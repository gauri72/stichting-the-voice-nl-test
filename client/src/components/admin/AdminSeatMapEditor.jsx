import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconMap,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/seat-map.css";

const SEATING_MODES = [
  { value: "general_admission", label: "General Admission" },
  { value: "reserved_seating", label: "Reserved Seating" },
  { value: "mixed_seating", label: "Mixed Seating" },
];

const SEAT_CATEGORIES = [
  "regular", "premium", "vip", "wheelchair", "companion", "staff", "blocked",
];

const EMPTY_BULK = {
  section: "Main Hall",
  startRow: "A",
  endRow: "D",
  seatsPerRow: 20,
  startingSeatNumber: 1,
  category: "regular",
  startX: 10,
  startY: 25,
  rowSpacing: 5,
  seatSpacing: 4,
};

function readImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

export default function AdminSeatMapEditor() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [seatMap, setSeatMap] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [bulk, setBulk] = useState(EMPTY_BULK);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragSeatRef = useRef(null);
  const dragPanRef = useRef(null);
  const canvasRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${eventId}/seat-map`, {
        headers: adminAuthHeaders(),
      });
      setSeatMap(data.seatMap);
      setSeats(data.seats || []);
    } catch (err) {
      setError(err.message || "Could not load seat map.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings(patch) {
    setSaving(true);
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${eventId}/seat-map`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(patch),
      });
      setSeatMap(data.seatMap);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload JPG, PNG, or WEBP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result;
      const dims = await readImageDimensions(imageData);
      setSaving(true);
      try {
        const data = await apiFetch(`/api/admin/events/${eventId}/seat-map/upload-image`, {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({
            imageData,
            imageWidth: dims.width,
            imageHeight: dims.height,
          }),
        });
        setSeatMap(data.seatMap);
        setMessage("Seat map image uploaded.");
      } catch (err) {
        setError(err.message || "Upload failed.");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function removeImage() {
    if (!window.confirm("Remove seat map image?")) return;
    await saveSettings({ imageUrl: "" });
  }

  async function bulkCreate() {
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/events/${eventId}/seats/bulk-create`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(bulk),
      });
      setSeats(data.seats || []);
      setMessage(`Created ${data.seats?.length || 0} seats.`);
    } catch (err) {
      setError(err.message || "Bulk create failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSeatPatch(seatId, patch) {
    const data = await apiFetch(`/api/admin/events/${eventId}/seats/${seatId}`, {
      method: "PATCH",
      headers: adminAuthHeaders(),
      body: JSON.stringify(patch),
    });
    setSeats((prev) => prev.map((s) => (s.seatId === seatId ? data.seat : s)));
  }

  async function savePositions(updatedSeats) {
    await apiFetch(`/api/admin/events/${eventId}/seats/reposition`, {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({
        positions: updatedSeats.map((s) => ({
          seatId: s.seatId,
          xPercent: s.xPercent,
          yPercent: s.yPercent,
          width: s.width,
          height: s.height,
        })),
      }),
    });
    setMessage("Layout saved.");
  }

  async function deleteSeat(seatId) {
    if (!window.confirm("Delete this seat?")) return;
    await apiFetch(`/api/admin/events/${eventId}/seats/${seatId}`, {
      method: "DELETE",
      headers: adminAuthHeaders(),
    });
    setSeats((prev) => prev.filter((s) => s.seatId !== seatId));
    if (selectedSeatId === seatId) setSelectedSeatId("");
  }

  async function blockSelected(block) {
    const ids = selectedSeatId ? [selectedSeatId] : [];
    if (!ids.length) return;
    const endpoint = block ? "block" : "unblock";
    const data = await apiFetch(`/api/admin/events/${eventId}/seats/${endpoint}`, {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ seatIds: ids }),
    });
    setSeats(data.seats || []);
  }

  const selectedSeat = seats.find((s) => s.seatId === selectedSeatId);
  const settings = seatMap?.settings || {};

  function onCanvasPointerDown(e, seat) {
    if (previewMode) return;
    if (seat) {
      setSelectedSeatId(seat.seatId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragSeatRef.current = {
        seatId: seat.seatId,
        startX: e.clientX,
        startY: e.clientY,
        origX: seat.xPercent,
        origY: seat.yPercent,
        rectW: rect.width / zoom,
        rectH: rect.height / zoom,
      };
    } else {
      dragPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }

  function onCanvasPointerMove(e) {
    if (dragSeatRef.current) {
      const d = dragSeatRef.current;
      const dx = ((e.clientX - d.startX) / d.rectW) * 100;
      const dy = ((e.clientY - d.startY) / d.rectH) * 100;
      setSeats((prev) =>
        prev.map((s) =>
          s.seatId === d.seatId
            ? { ...s, xPercent: Math.max(0, Math.min(100, d.origX + dx)), yPercent: Math.max(0, Math.min(100, d.origY + dy)) }
            : s
        )
      );
    } else if (dragPanRef.current) {
      setPan({ x: e.clientX - dragPanRef.current.x, y: e.clientY - dragPanRef.current.y });
    }
  }

  function onCanvasPointerUp() {
    if (dragSeatRef.current) {
      const moved = seats.find((s) => s.seatId === dragSeatRef.current.seatId);
      if (moved) void saveSeatPatch(moved.seatId, { xPercent: moved.xPercent, yPercent: moved.yPercent });
    }
    dragSeatRef.current = null;
    dragPanRef.current = null;
  }

  return (
    <AdminLayout pageTitle="Seat Map Editor" pageSubtitle="Configure reserved seating for this event.">
      <div className="seat-map-admin">
        <p>
          <Link to="/admin/events" className="admin-events__outline-btn">
            <IconArrowLeft size={16} /> Back to events
          </Link>
        </p>

        {error ? <p className="ticket-booking__error" role="alert">{error}</p> : null}
        {message ? <p className="ticket-booking__status">{message}</p> : null}
        {loading ? <p>Loading…</p> : null}

        {!loading && seatMap ? (
          <>
            <div className="seat-map-admin__grid">
              <div className="seat-map-admin__panel">
                <div className="seat-map-admin__toolbar">
                  <button type="button" className="primary" disabled={saving} onClick={() => saveSettings({ settings })}>
                    <IconDeviceFloppy size={14} /> Save settings
                  </button>
                  <button type="button" onClick={() => setPreviewMode((p) => !p)}>
                    <IconEye size={14} /> {previewMode ? "Edit mode" : "Preview customer view"}
                  </button>
                  <label className="seat-map-admin__toolbar button" style={{ cursor: "pointer" }}>
                    <IconUpload size={14} /> Upload image
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleImageUpload} />
                  </label>
                  {seatMap.imageUrl ? (
                    <button type="button" onClick={removeImage}><IconTrash size={14} /> Remove image</button>
                  ) : null}
                </div>

                <div className="seat-map-wrap">
                  <div
                    className="seat-map-viewport"
                    onPointerMove={onCanvasPointerMove}
                    onPointerUp={onCanvasPointerUp}
                    onPointerLeave={onCanvasPointerUp}
                  >
                    <div
                      ref={canvasRef}
                      className="seat-map-canvas"
                      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                      onPointerDown={(e) => onCanvasPointerDown(e, null)}
                    >
                      {seatMap.imageUrl ? (
                        <img src={seatMap.imageUrl} alt="" className="seat-map-image" draggable={false} />
                      ) : (
                        <div className="seat-map-image seat-map-image--placeholder">
                          <IconMap size={32} /> Upload a venue seat map (1920×1080 recommended)
                        </div>
                      )}
                      <span className="seat-map-stage-label">{seatMap.stageLabel || settings.stageLabel || "Screen / Stage"}</span>
                      {seats.map((seat) => (
                        <button
                          key={seat.seatId}
                          type="button"
                          className={`seat-map-seat seat-map-seat--${seat.status === "available" ? seat.category === "vip" || seat.category === "premium" ? seat.category : "available" : seat.status}${selectedSeatId === seat.seatId ? " seat-map-seat--editing" : ""}`}
                          style={{
                            left: `${seat.xPercent}%`,
                            top: `${seat.yPercent}%`,
                            width: `${seat.width || 2.5}%`,
                            height: `${seat.height || 2.5}%`,
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            onCanvasPointerDown(e, seat);
                          }}
                          disabled={previewMode}
                        >
                          {seat.seatLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="seat-map-controls">
                    <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>Zoom in</button>
                    <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>Zoom out</button>
                    <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset view</button>
                  </div>
                </div>
              </div>

              <div>
                <div className="seat-map-admin__panel">
                  <h3>Seating &amp; Seat Map</h3>
                  <div className="seat-map-admin__field">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.enableReservedSeating === true}
                        onChange={(e) =>
                          setSeatMap((m) => ({
                            ...m,
                            settings: { ...m.settings, enableReservedSeating: e.target.checked },
                          }))
                        }
                      />{" "}
                      Enable reserved seating
                    </label>
                  </div>
                  <div className="seat-map-admin__field">
                    <label>Seating mode</label>
                    <select
                      value={seatMap.seatingMode || settings.seatingMode || "general_admission"}
                      onChange={(e) => setSeatMap((m) => ({ ...m, seatingMode: e.target.value }))}
                    >
                      {SEATING_MODES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="seat-map-admin__field">
                    <label>Seat map name</label>
                    <input value={seatMap.name || ""} onChange={(e) => setSeatMap((m) => ({ ...m, name: e.target.value }))} />
                  </div>
                  <div className="seat-map-admin__field">
                    <label>Venue name</label>
                    <input value={seatMap.venueName || ""} onChange={(e) => setSeatMap((m) => ({ ...m, venueName: e.target.value }))} />
                  </div>
                  <div className="seat-map-admin__field">
                    <label>Screen / stage label</label>
                    <input
                      value={seatMap.stageLabel || ""}
                      onChange={(e) => setSeatMap((m) => ({ ...m, stageLabel: e.target.value }))}
                    />
                  </div>
                  <div className="seat-map-admin__field">
                    <label>Seating instructions</label>
                    <textarea
                      rows={3}
                      value={settings.seatingInstructions || ""}
                      onChange={(e) =>
                        setSeatMap((m) => ({
                          ...m,
                          settings: { ...m.settings, seatingInstructions: e.target.value },
                        }))
                      }
                    />
                  </div>
                  {[
                    ["allowCustomerSeatSelection", "Allow customer seat selection"],
                    ["autoAssignSeats", "Auto-assign seats if customer does not choose"],
                    ["holdSeatsDuringCheckout", "Hold selected seats during checkout"],
                    ["allowAdminBlockSeats", "Allow admin to block seats"],
                  ].map(([key, label]) => (
                    <div key={key} className="seat-map-admin__field">
                      <label>
                        <input
                          type="checkbox"
                          checked={settings[key] !== false}
                          onChange={(e) =>
                            setSeatMap((m) => ({
                              ...m,
                              settings: { ...m.settings, [key]: e.target.checked },
                            }))
                          }
                        />{" "}
                        {label}
                      </label>
                    </div>
                  ))}
                  <div className="seat-map-admin__field">
                    <label>Seat hold duration (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.seatHoldMinutes ?? 10}
                      onChange={(e) =>
                        setSeatMap((m) => ({
                          ...m,
                          settings: { ...m.settings, seatHoldMinutes: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="admin-events__save-btn"
                    disabled={saving}
                    onClick={() =>
                      saveSettings({
                        name: seatMap.name,
                        venueName: seatMap.venueName,
                        stageLabel: seatMap.stageLabel,
                        seatingMode: seatMap.seatingMode,
                        settings: seatMap.settings,
                      })
                    }
                  >
                    Save seating settings
                  </button>
                </div>

                <div className="seat-map-admin__panel" style={{ marginTop: 16 }}>
                  <h3>Bulk create seats</h3>
                  <div className="seat-map-admin__bulk-grid">
                    {Object.entries(bulk).map(([key, val]) => (
                      <div key={key} className="seat-map-admin__field">
                        <label>{key}</label>
                        {key === "category" ? (
                          <select value={val} onChange={(e) => setBulk((b) => ({ ...b, [key]: e.target.value }))}>
                            {SEAT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <input
                            value={val}
                            onChange={(e) =>
                              setBulk((b) => ({
                                ...b,
                                [key]: ["seatsPerRow", "startingSeatNumber", "startX", "startY", "rowSpacing", "seatSpacing"].includes(key)
                                  ? Number(e.target.value)
                                  : e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="admin-events__outline-btn" disabled={saving} onClick={bulkCreate}>
                    <IconPlus size={14} /> Generate seats
                  </button>
                </div>

                {selectedSeat ? (
                  <div className="seat-map-admin__panel" style={{ marginTop: 16 }}>
                    <h3>Edit seat {selectedSeat.seatLabel}</h3>
                    <div className="seat-map-admin__field">
                      <label>Row</label>
                      <input value={selectedSeat.row} onChange={(e) => saveSeatPatch(selectedSeat.seatId, { row: e.target.value })} />
                    </div>
                    <div className="seat-map-admin__field">
                      <label>Seat number</label>
                      <input value={selectedSeat.seatNumber} onChange={(e) => saveSeatPatch(selectedSeat.seatId, { seatNumber: e.target.value })} />
                    </div>
                    <div className="seat-map-admin__field">
                      <label>Section</label>
                      <input value={selectedSeat.section} onChange={(e) => saveSeatPatch(selectedSeat.seatId, { section: e.target.value })} />
                    </div>
                    <div className="seat-map-admin__field">
                      <label>Category</label>
                      <select value={selectedSeat.category} onChange={(e) => saveSeatPatch(selectedSeat.seatId, { category: e.target.value })}>
                        {SEAT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="seat-map-admin__field">
                      <label>Status</label>
                      <select value={selectedSeat.status} onChange={(e) => saveSeatPatch(selectedSeat.seatId, { status: e.target.value })}>
                        {["available", "blocked", "disabled", "reserved"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="seat-map-admin__toolbar">
                      <button type="button" onClick={() => blockSelected(true)}>Block</button>
                      <button type="button" onClick={() => blockSelected(false)}>Unblock</button>
                      <button type="button" onClick={() => deleteSeat(selectedSeat.seatId)}><IconTrash size={14} /></button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
