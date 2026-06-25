import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../utils/api.js";
import "../../styles/seat-map.css";

const CATEGORY_CLASS = {
  vip: "seat-map-seat--vip",
  premium: "seat-map-seat--premium",
  wheelchair: "seat-map-seat--wheelchair",
};

function seatClass(seat, selectedIds) {
  if (selectedIds.includes(seat.seatId)) return "seat-map-seat--selected";
  const status = seat.effectiveStatus || seat.status;
  if (status === "held") return "seat-map-seat--held";
  if (status === "booked") return "seat-map-seat--booked";
  if (status === "blocked" || status === "reserved") return "seat-map-seat--blocked";
  if (status === "disabled") return "seat-map-seat--disabled";
  if (seat.category && CATEGORY_CLASS[seat.category]) return CATEGORY_CLASS[seat.category];
  return "seat-map-seat--available";
}

export default function SeatMapSelector({
  eventId,
  checkoutSessionId,
  ticketQuantity,
  ticketTypeIds = [],
  selectedSeatIds = [],
  onSelectionChange,
  onError,
}) {
  const { t } = useTranslation(["checkout"]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [holding, setHolding] = useState(false);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);

  const loadAvailability = useCallback(async () => {
    if (!eventId) return;
    try {
      const params = checkoutSessionId ? `?checkoutSessionId=${encodeURIComponent(checkoutSessionId)}` : "";
      const result = await apiFetch(`/api/events/${eventId}/seat-map${params}`);
      setData(result);
    } catch (err) {
      onError?.(err.message || t("checkout:seatMap.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  }, [eventId, checkoutSessionId, onError]);

  useEffect(() => {
    loadAvailability();
    const interval = setInterval(loadAvailability, 20_000);
    return () => clearInterval(interval);
  }, [loadAvailability]);

  const selectedSeats = useMemo(() => {
    if (!data?.seats) return [];
    return data.seats.filter((s) => selectedSeatIds.includes(s.seatId));
  }, [data, selectedSeatIds]);

  async function holdSeats(nextIds) {
    if (!checkoutSessionId || !nextIds.length) return;
    setHolding(true);
    try {
      await apiFetch("/api/checkout/seat-hold", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          seatIds: nextIds,
          checkoutSessionId,
        }),
      });
      await loadAvailability();
    } catch (err) {
      onError?.(err.message || t("checkout:seatMap.couldNotHold"));
    } finally {
      setHolding(false);
    }
  }

  function toggleSeat(seat) {
    const status = seat.effectiveStatus || seat.status;
    const selectable = status === "available" || seat.heldBySelf;
    if (!selectable) return;

    const isSelected = selectedSeatIds.includes(seat.seatId);
    let next;
    if (isSelected) {
      next = selectedSeatIds.filter((id) => id !== seat.seatId);
    } else if (selectedSeatIds.length >= ticketQuantity) {
      onError?.(t("checkout:seatMap.selectExactSeats", { count: ticketQuantity }));
      return;
    } else {
      next = [...selectedSeatIds, seat.seatId];
    }
    onSelectionChange(next, data?.seats?.filter((s) => next.includes(s.seatId)) || []);
    void holdSeats(next);
  }

  function onPointerDown(e) {
    if (e.target.closest(".seat-map-seat")) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }

  function onPointerMove(e) {
    if (dragRef.current) {
      setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
    }
  }

  function onPointerUp() {
    dragRef.current = null;
    pinchRef.current = null;
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(3, Math.max(0.5, z + delta)));
  }

  if (loading) return <p className="ticket-booking__status">{t("checkout:seatMap.loading")}</p>;
  if (!data?.reservedSeatingEnabled) return null;

  const { seatMap, seats = [] } = data;
  const stageLabel = seatMap?.stageLabel || seatMap?.settings?.stageLabel || t("checkout:seatMap.screenStage");

  return (
    <div className={`seat-map-wrap${fullscreen ? " seat-map-wrap--fullscreen" : ""}`}>
      {seatMap?.settings?.seatingInstructions ? (
        <p className="ticket-booking__desc" style={{ padding: "12px 16px 0", margin: 0 }}>
          {seatMap.settings.seatingInstructions}
        </p>
      ) : null}

      <div
        className="seat-map-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="seat-map-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {seatMap?.imageUrl ? (
            <img src={seatMap.imageUrl} alt={seatMap.name || t("checkout:seatMap.venueSeatMap")} className="seat-map-image" draggable={false} />
          ) : (
            <div className="seat-map-image seat-map-image--placeholder">{t("checkout:seatMap.imageNotConfigured")}</div>
          )}
          <span className="seat-map-stage-label">{stageLabel}</span>
          {seats.map((seat) => {
            const w = seat.width || 2.5;
            const h = seat.height || 2.5;
            return (
              <button
                key={seat.seatId}
                type="button"
                className={`seat-map-seat ${seatClass(seat, selectedSeatIds)}`}
                style={{
                  left: `${seat.xPercent}%`,
                  top: `${seat.yPercent}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                }}
                title={`${seat.section ? `${seat.section} · ` : ""}${t("checkout:seatMap.row")} ${seat.row} ${t("checkout:seatMap.seat")} ${seat.seatNumber}`}
                disabled={holding || (!selectedSeatIds.includes(seat.seatId) && (seat.effectiveStatus || seat.status) !== "available" && !seat.heldBySelf)}
                onClick={() => toggleSeat(seat)}
              >
                {seat.seatLabel || `${seat.row}${seat.seatNumber}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="seat-map-controls">
        <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>{t("checkout:seatMap.zoomIn")}</button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>{t("checkout:seatMap.zoomOut")}</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>{t("checkout:seatMap.resetView")}</button>
        <button type="button" onClick={() => setFullscreen((f) => !f)}>{fullscreen ? t("checkout:seatMap.exitFullScreen") : t("checkout:seatMap.fullScreen")}</button>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#8a9bb5" }}>
          {selectedSeatIds.length} / {ticketQuantity} {t("checkout:seatMap.selected")}
          {holding ? ` · ${t("checkout:seatMap.holding")}` : ""}
        </span>
      </div>

      <div className="seat-map-legend" aria-label={t("checkout:seatMap.seatLegend")}>
        <span><i style={{ background: "#1a7f5a" }} /> {t("checkout:seatMap.available")}</span>
        <span><i style={{ background: "#3ec6d4" }} /> {t("checkout:seatMap.selectedLegend")}</span>
        <span><i style={{ background: "#c9a227" }} /> {t("checkout:seatMap.held")}</span>
        <span><i style={{ background: "#6b7280" }} /> {t("checkout:seatMap.booked")}</span>
        <span><i style={{ background: "#991b1b" }} /> {t("checkout:seatMap.blocked")}</span>
        <span><i style={{ background: "#7c3aed" }} /> {t("checkout:seatMap.vip")}</span>
        <span><i style={{ background: "#2563eb" }} /> {t("checkout:seatMap.premium")}</span>
      </div>

      <div className="seat-map-summary">
        <h3>{t("checkout:seatMap.selectedSeats")}</h3>
        {selectedSeats.length ? (
          <ul>
            {selectedSeats.map((s) => (
              <li key={s.seatId}>
                {s.section ? `${s.section} · ` : ""}{t("checkout:seatMap.row")} {s.row}, {t("checkout:seatMap.seat")} {s.seatNumber}
                {s.category && s.category !== "regular" ? ` (${s.category})` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "#8a9bb5", fontSize: 13 }}>
            {ticketQuantity === 1
              ? t("checkout:seatMap.selectSeatsHint", { count: ticketQuantity })
              : t("checkout:seatMap.selectSeatsHintPlural", { count: ticketQuantity })}
          </p>
        )}
      </div>

      <div className="seat-map-list" aria-label={t("checkout:seatMap.seatList")}>
        {seats
          .filter((s) => (s.effectiveStatus || s.status) === "available" || selectedSeatIds.includes(s.seatId))
          .slice(0, 40)
          .map((seat) => (
            <button
              key={`list-${seat.seatId}`}
              type="button"
              className="ticket-booking__outline-btn"
              style={{ textAlign: "left" }}
              onClick={() => toggleSeat(seat)}
            >
              {t("checkout:seatMap.row")} {seat.row} · {t("checkout:seatMap.seat")} {seat.seatNumber}
              {selectedSeatIds.includes(seat.seatId) ? " ✓" : ""}
            </button>
          ))}
      </div>
    </div>
  );
}
