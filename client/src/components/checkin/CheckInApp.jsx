import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCheck, IconList, IconQrcode, IconScan, IconSearch, IconX } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import {
  extractTokenFromInput,
  loadRecentCheckIns,
  pushRecentCheckIn,
} from "./checkInUtils.js";

const READER_ID = "checkin-qr-reader";

export default function CheckInApp({ variant = "admin" }) {
  const { t } = useTranslation(["checkin"]);
  const { admin } = useAdminAuth();
  const readerDomId = useId().replace(/:/g, "");
  const readerId = `${READER_ID}-${readerDomId}`;

  const [mode, setMode] = useState("scan");
  const [token, setToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(() => loadRecentCheckIns());
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const scannerRef = useRef(null);
  const isPwa = variant === "pwa";

  // Door/volunteer staff are scoped to exactly one assignedEvents entry, so
  // the guest list needs no picker for them. A broader admin (empty
  // assignedEvents) gets a dropdown to choose which event's roster to browse.
  const singleAssignedEventId = admin?.assignedEvents?.length === 1 ? admin.assignedEvents[0] : null;
  const [selectedEventId, setSelectedEventId] = useState("");
  const effectiveEventId = singleAssignedEventId || selectedEventId;
  const [eventOptions, setEventOptions] = useState([]);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [rosterSearch, setRosterSearch] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        // Scanner may already be stopped when the tab loses focus.
      }
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => {
    stopScanner();
  }, [stopScanner]);

  useEffect(() => {
    if (mode !== "scan") stopScanner();
  }, [mode, stopScanner]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (mode !== "list" || singleAssignedEventId || eventOptions.length) return;
    apiFetch("/api/admin/events", { headers: adminAuthHeaders() })
      .then((data) => setEventOptions(data.events || []))
      .catch(() => {});
  }, [mode, singleAssignedEventId, eventOptions.length]);

  useEffect(() => {
    if (mode !== "list" || !effectiveEventId) return;
    let cancelled = false;
    setRosterLoading(true);
    setRosterError("");
    apiFetch(`/api/admin/events/${effectiveEventId}/check-in-list`, { headers: adminAuthHeaders() })
      .then((data) => {
        if (!cancelled) setRoster(data.guests || []);
      })
      .catch((err) => {
        if (!cancelled) setRosterError(err.message || t("checkin:app.rosterLoadError"));
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, effectiveEventId, t]);

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (g) =>
        g.attendeeName?.toLowerCase().includes(q) ||
        g.ticketNumber?.toLowerCase().includes(q)
    );
  }, [roster, rosterSearch]);

  const handleCheckIn = useCallback(async (verificationToken) => {
    if (!online) {
      setError(t("checkin:app.offlineError"));
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await apiFetch("/api/admin/events/check-in", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ token: verificationToken }),
      });

      const entry = {
        ticketNumber: data.ticket?.ticketNumber,
        attendeeName: data.ticket?.attendeeName,
        eventTitle: data.event?.title,
        checkedInAt: new Date().toISOString(),
      };
      setRecent(pushRecentCheckIn(entry));
      setResult({ success: true, ...data });
      setToken("");
      setRoster((prev) =>
        prev.map((g) =>
          g.verificationToken === verificationToken
            ? { ...g, checkedIn: true, checkedInAt: entry.checkedInAt }
            : g
        )
      );

      if (navigator.vibrate) navigator.vibrate(120);
    } catch (err) {
      setError(err.message || t("checkin:app.checkInFailedError"));
      if (err.data?.ticket) {
        setResult({ success: false, ticket: err.data.ticket });
      }
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    } finally {
      setLoading(false);
    }
  }, [online]);

  const startScanner = useCallback(async () => {
    setError("");
    setResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
            return { width: edge, height: edge };
          },
        },
        (decodedText) => {
          const nextToken = extractTokenFromInput(decodedText);
          if (!nextToken || loading) return;
          stopScanner().then(() => handleCheckIn(nextToken));
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      // html5-qrcode/getUserMedia reject with different shapes depending on
      // browser — inspect both err.name (DOMException) and the stringified
      // message (the library sometimes throws a plain string) so the staff
      // member sees the real cause instead of always "camera denied".
      const raw = String(err?.name || err?.message || err || "");
      if (/NotFoundError|no camera|device not found/i.test(raw)) {
        setError(t("checkin:app.cameraNotFoundError"));
      } else if (/NotReadableError|already in use|TrackStartError/i.test(raw)) {
        setError(t("checkin:app.cameraInUseError"));
      } else if (/SecurityError|insecure/i.test(raw)) {
        setError(t("checkin:app.cameraInsecureError"));
      } else if (/NotAllowedError|Permission denied|permission/i.test(raw)) {
        setError(t("checkin:app.cameraDeniedError"));
      } else {
        setError(t("checkin:app.cameraGenericError", { detail: raw || "unknown error" }));
      }
    }
  }, [readerId, stopScanner, handleCheckIn, loading, t]);

  function onSubmit(e) {
    e.preventDefault();
    const nextToken = extractTokenFromInput(token);
    if (nextToken) handleCheckIn(nextToken);
  }

  function resetForNextScan() {
    setResult(null);
    setError("");
    setToken("");
  }

  return (
    <div className={`checkin-app${isPwa ? " checkin-app--pwa" : ""}`}>
      {!online ? (
        <p className="checkin-app__offline" role="status">
          {t("checkin:app.offlineBanner")}
        </p>
      ) : null}

      <div className="checkin-app__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "scan"}
          className={`checkin-app__tab${mode === "scan" ? " checkin-app__tab--active" : ""}`}
          onClick={() => setMode("scan")}
        >
          <IconScan size={16} aria-hidden /> {t("checkin:app.tabScan")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "list"}
          className={`checkin-app__tab${mode === "list" ? " checkin-app__tab--active" : ""}`}
          onClick={() => setMode("list")}
        >
          <IconList size={16} aria-hidden /> {t("checkin:app.tabList")}
        </button>
      </div>

      {mode === "scan" ? (
        <section className="checkin-app__scanner">
          {/* The reader container must stay mounted in the DOM even while
              hidden — Html5Qrcode looks up this element by id when start()
              is called, which happens BEFORE `scanning` flips true. Removing
              it from the tree (via a ternary) makes every scan attempt fail
              with an "element not found" error that got misreported as a
              camera-permission denial. */}
          <div className="checkin-app__reader-wrap" hidden={!scanning}>
            <div id={readerId} className="checkin-app__reader" />
            <p className="checkin-app__hint">{t("checkin:app.alignHint")}</p>
            <button type="button" className="checkin-app__secondary-btn" onClick={stopScanner}>
              {t("checkin:app.stopCamera")}
            </button>
          </div>
          {!scanning ? (
            <button
              type="button"
              className="checkin-app__scan-btn"
              onClick={startScanner}
              disabled={loading || !online}
            >
              <IconScan size={isPwa ? 36 : 28} aria-hidden />
              <span>{loading ? t("checkin:app.validating") : t("checkin:app.scanQrCode")}</span>
            </button>
          ) : null}

          <form className="checkin-app__form" onSubmit={onSubmit}>
            <label htmlFor={`${readerId}-token`}>
              <IconQrcode size={18} aria-hidden /> {t("checkin:app.manualTokenEntry")}
            </label>
            <input
              id={`${readerId}-token`}
              className="checkin-app__input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t("checkin:app.tokenPlaceholder")}
              autoComplete="off"
              inputMode="text"
            />
            <button
              type="submit"
              className="checkin-app__submit"
              disabled={loading || !token.trim() || !online}
            >
              {loading ? t("checkin:app.validating") : t("checkin:app.checkIn")}
            </button>
          </form>
        </section>
      ) : (
        <section className="checkin-app__roster">
          {!effectiveEventId ? (
            <div className="checkin-app__roster-picker">
              <label htmlFor="checkin-roster-event">{t("checkin:app.selectEvent")}</label>
              <select
                id="checkin-roster-event"
                className="checkin-app__input"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="">{t("checkin:app.selectEventPlaceholder")}</option>
                {eventOptions.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="checkin-app__roster-search">
                <IconSearch size={16} aria-hidden />
                <input
                  type="search"
                  className="checkin-app__input"
                  placeholder={t("checkin:app.searchGuests")}
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                />
              </div>

              {rosterLoading ? <p className="checkin-app__hint">{t("checkin:app.loadingGuests")}</p> : null}
              {rosterError ? (
                <p className="checkin-app__result checkin-app__result--error">{rosterError}</p>
              ) : null}

              {!rosterLoading && !rosterError ? (
                <ul className="checkin-app__roster-list">
                  {filteredRoster.map((g) => (
                    <li
                      key={g.ticketId}
                      className={`checkin-app__roster-row${g.checkedIn ? " checkin-app__roster-row--done" : ""}`}
                    >
                      <div className="checkin-app__roster-info">
                        <strong>{g.attendeeName}</strong>
                        <span>{g.ticketTypeName} · {g.ticketNumber}</span>
                      </div>
                      {g.checkedIn ? (
                        <span className="checkin-app__roster-badge">
                          <IconCheck size={14} aria-hidden /> {t("checkin:app.checkedIn")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="checkin-app__roster-btn"
                          onClick={() => handleCheckIn(g.verificationToken)}
                          disabled={loading || !online}
                        >
                          {t("checkin:app.checkIn")}
                        </button>
                      )}
                    </li>
                  ))}
                  {filteredRoster.length === 0 ? (
                    <p className="checkin-app__hint">{t("checkin:app.noGuestsFound")}</p>
                  ) : null}
                </ul>
              ) : null}
            </>
          )}
        </section>
      )}

      {error ? (
        <div className="checkin-app__result checkin-app__result--error" role="alert">
          <IconX size={24} aria-hidden />
          <p>{error}</p>
        </div>
      ) : null}

      {result?.success ? (
        <div className="checkin-app__result checkin-app__result--success">
          <IconCheck size={32} aria-hidden />
          <h2>{t("checkin:app.checkInSuccessful")}</h2>
          <dl className="checkin-app__details">
            <div><dt>{t("checkin:app.attendee")}</dt><dd>{result.ticket?.attendeeName}</dd></div>
            <div><dt>{t("checkin:app.event")}</dt><dd>{result.event?.title}</dd></div>
            <div><dt>{t("checkin:app.ticketType")}</dt><dd>{result.ticket?.ticketTypeName}</dd></div>
            {result.ticket?.row || result.ticket?.seatNumber ? (
              <>
                <div><dt>{t("checkin:app.section")}</dt><dd>{result.ticket?.section || "—"}</dd></div>
                <div><dt>{t("checkin:app.row")}</dt><dd>{result.ticket?.row || "—"}</dd></div>
                <div><dt>{t("checkin:app.seat")}</dt><dd>{result.ticket?.seatNumber || result.ticket?.seatLabel || "—"}</dd></div>
              </>
            ) : null}
            <div><dt>{t("checkin:app.ticketId")}</dt><dd>{result.ticket?.ticketNumber}</dd></div>
            <div><dt>{t("checkin:app.venue")}</dt><dd>{result.event?.venueName || "—"}</dd></div>
          </dl>
          <button type="button" className="checkin-app__submit" onClick={resetForNextScan}>
            {t("checkin:app.scanNextTicket")}
          </button>
        </div>
      ) : null}

      {result && !result.success && result.ticket ? (
        <div className="checkin-app__result checkin-app__result--warning">
          <p>{t("checkin:app.ticketLabel", { number: result.ticket.ticketNumber })}</p>
          <p>{result.ticket.attendeeName}</p>
        </div>
      ) : null}

      {recent.length > 0 ? (
        <section className="checkin-app__recent" aria-label={t("checkin:app.recentCheckInsAria")}>
          <h3>{t("checkin:app.recentCheckIns")}</h3>
          <ul>
            {recent.map((item) => (
              <li key={`${item.ticketNumber}-${item.checkedInAt}`}>
                <strong>{item.attendeeName}</strong>
                <span>{item.ticketNumber}</span>
                <span>{item.eventTitle}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
