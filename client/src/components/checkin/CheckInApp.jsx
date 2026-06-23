import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconQrcode, IconScan, IconX } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  extractTokenFromInput,
  loadRecentCheckIns,
  pushRecentCheckIn,
} from "./checkInUtils.js";

const READER_ID = "checkin-qr-reader";

export default function CheckInApp({ variant = "admin" }) {
  const readerDomId = useId().replace(/:/g, "");
  const readerId = `${READER_ID}-${readerDomId}`;

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

  const handleCheckIn = useCallback(async (verificationToken) => {
    if (!online) {
      setError("You are offline. Check-in requires an internet connection.");
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

      if (navigator.vibrate) navigator.vibrate(120);
    } catch (err) {
      setError(err.message || "Check-in failed.");
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
    } catch {
      setError("Camera access denied. Paste the QR verification URL or token instead.");
    }
  }, [readerId, stopScanner, handleCheckIn, loading]);

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
          Offline — connect to the internet to validate tickets.
        </p>
      ) : null}

      <section className="checkin-app__scanner">
        {scanning ? (
          <div className="checkin-app__reader-wrap">
            <div id={readerId} className="checkin-app__reader" />
            <p className="checkin-app__hint">Align the ticket QR code inside the frame.</p>
            <button type="button" className="checkin-app__secondary-btn" onClick={stopScanner}>
              Stop camera
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="checkin-app__scan-btn"
            onClick={startScanner}
            disabled={loading || !online}
          >
            <IconScan size={isPwa ? 36 : 28} aria-hidden />
            <span>{loading ? "Validating…" : "Scan QR code"}</span>
          </button>
        )}

        <form className="checkin-app__form" onSubmit={onSubmit}>
          <label htmlFor={`${readerId}-token`}>
            <IconQrcode size={18} aria-hidden /> Manual token entry
          </label>
          <input
            id={`${readerId}-token`}
            className="checkin-app__input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste verification token or QR URL…"
            autoComplete="off"
            inputMode="text"
          />
          <button
            type="submit"
            className="checkin-app__submit"
            disabled={loading || !token.trim() || !online}
          >
            {loading ? "Validating…" : "Check in"}
          </button>
        </form>
      </section>

      {error ? (
        <div className="checkin-app__result checkin-app__result--error" role="alert">
          <IconX size={24} aria-hidden />
          <p>{error}</p>
        </div>
      ) : null}

      {result?.success ? (
        <div className="checkin-app__result checkin-app__result--success">
          <IconCheck size={32} aria-hidden />
          <h2>Check-in successful</h2>
          <dl className="checkin-app__details">
            <div><dt>Attendee</dt><dd>{result.ticket?.attendeeName}</dd></div>
            <div><dt>Event</dt><dd>{result.event?.title}</dd></div>
            <div><dt>Ticket type</dt><dd>{result.ticket?.ticketTypeName}</dd></div>
            {result.ticket?.row || result.ticket?.seatNumber ? (
              <>
                <div><dt>Section</dt><dd>{result.ticket?.section || "—"}</dd></div>
                <div><dt>Row</dt><dd>{result.ticket?.row || "—"}</dd></div>
                <div><dt>Seat</dt><dd>{result.ticket?.seatNumber || result.ticket?.seatLabel || "—"}</dd></div>
              </>
            ) : null}
            <div><dt>Ticket ID</dt><dd>{result.ticket?.ticketNumber}</dd></div>
            <div><dt>Venue</dt><dd>{result.event?.venueName || "—"}</dd></div>
          </dl>
          <button type="button" className="checkin-app__submit" onClick={resetForNextScan}>
            Scan next ticket
          </button>
        </div>
      ) : null}

      {result && !result.success && result.ticket ? (
        <div className="checkin-app__result checkin-app__result--warning">
          <p>Ticket: {result.ticket.ticketNumber}</p>
          <p>{result.ticket.attendeeName}</p>
        </div>
      ) : null}

      {recent.length > 0 ? (
        <section className="checkin-app__recent" aria-label="Recent check-ins this session">
          <h3>Recent check-ins</h3>
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
