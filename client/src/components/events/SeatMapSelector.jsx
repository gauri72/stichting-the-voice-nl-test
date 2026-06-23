import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      onError?.(err.message || "Could not load seat map.");
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
      onError?.(err.message || "Could not hold seats.");
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
      onError?.(`Please select exactly ${ticketQuantity} seat(s). Deselect a seat first.`);
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

  if (loading) return <p className="ticket-booking__status">Loading seat map…</p>;
  if (!data?.reservedSeatingEnabled) return null;

  const { seatMap, seats = [] } = data;
  const stageLabel = seatMap?.stageLabel || seatMap?.settings?.stageLabel || "Screen / Stage";

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
            <img src={seatMap.imageUrl} alt={seatMap.name || "Venue seat map"} className="seat-map-image" draggable={false} />
          ) : (
            <div className="seat-map-image seat-map-image--placeholder">Seat map image not configured</div>
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
                title={`${seat.section ? `${seat.section} · ` : ""}Row ${seat.row} Seat ${seat.seatNumber}`}
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
        <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>Zoom in</button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>Zoom out</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset view</button>
        <button type="button" onClick={() => setFullscreen((f) => !f)}>{fullscreen ? "Exit full screen" : "Full screen"}</button>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#8a9bb5" }}>
          {selectedSeatIds.length} / {ticketQuantity} selected
          {holding ? " · holding…" : ""}
        </span>
      </div>

      <div className="seat-map-legend" aria-label="Seat legend">
        <span><i style={{ background: "#1a7f5a" }} /> Available</span>
        <span><i style={{ background: "#3ec6d4" }} /> Selected</span>
        <span><i style={{ background: "#c9a227" }} /> Held</span>
        <span><i style={{ background: "#6b7280" }} /> Booked</span>
        <span><i style={{ background: "#991b1b" }} /> Blocked</span>
        <span><i style={{ background: "#7c3aed" }} /> VIP</span>
        <span><i style={{ background: "#2563eb" }} /> Premium</span>
      </div>

      <div className="seat-map-summary">
        <h3>Selected seats</h3>
        {selectedSeats.length ? (
          <ul>
            {selectedSeats.map((s) => (
              <li key={s.seatId}>
                {s.section ? `${s.section} · ` : ""}Row {s.row}, Seat {s.seatNumber}
                {s.category && s.category !== "regular" ? ` (${s.category})` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "#8a9bb5", fontSize: 13 }}>
            Select {ticketQuantity} seat{ticketQuantity !== 1 ? "s" : ""} on the map.
          </p>
        )}
      </div>

      <div className="seat-map-list" aria-label="Seat list">
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
              Row {seat.row} · Seat {seat.seatNumber}
              {selectedSeatIds.includes(seat.seatId) ? " ✓" : ""}
            </button>
          ))}
      </div>
    </div>
  );
}
