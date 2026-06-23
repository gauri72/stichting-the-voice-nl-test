import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { IconDeviceFloppy, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import {
  exportOperations,
  fetchOpsConfig,
  fetchStagePlans,
  readFileAsDataUrl,
  saveStagePlan,
} from "../../../utils/eventOperationsAdmin.js";

const DEFAULT_ELEMENT = {
  elementType: "Stage",
  label: "",
  xPercent: 20,
  yPercent: 20,
  widthPercent: 20,
  heightPercent: 12,
  rotation: 0,
  color: "#008080",
  locked: false,
  zIndex: 1,
};

export default function EventStagePlanPage() {
  const { eventId } = useParams();
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [elements, setElements] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [viewOnly, setViewOnly] = useState(window.innerWidth < 768);
  const dragRef = useRef(null);
  const canvasRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cfg] = await Promise.all([fetchStagePlans(eventId), fetchOpsConfig(eventId)]);
      setPlans(data.plans || []);
      setConfig(cfg);
      const plan = data.plans?.[0] || null;
      setActivePlan(plan);
      setElements(plan?.elements || []);
    } catch (err) {
      setError(err.message || "Could not load stage plan.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const img = new Image();
    img.onload = async () => {
      if (activePlan?.id) {
        await saveStagePlan(eventId, {
          floorImageData: dataUrl,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          elements,
        }, activePlan.id);
      } else {
        await saveStagePlan(eventId, {
          name: "Main Layout",
          floorImageData: dataUrl,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          elements: [],
        });
      }
      setMessage("Floor image uploaded.");
      load();
    };
    img.src = dataUrl;
  }

  function addElement(type) {
    const el = { ...DEFAULT_ELEMENT, elementType: type, id: `temp-${Date.now()}`, zIndex: elements.length + 1 };
    setElements([...elements, el]);
    setSelectedId(el.id);
  }

  function updateElement(id, patch) {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  }

  function removeElement(id) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function onPointerDown(e, el) {
    if (viewOnly || el.locked) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.xPercent,
      origY: el.yPercent,
      rect,
    };
  }

  function onPointerMove(e) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    updateElement(drag.id, {
      xPercent: Math.min(95, Math.max(0, drag.origX + dx)),
      yPercent: Math.min(95, Math.max(0, drag.origY + dy)),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: activePlan?.name || "Main Layout",
        elements: elements.map(({ id, ...rest }) => rest),
      };
      if (activePlan?.id) {
        await saveStagePlan(eventId, payload, activePlan.id);
      } else {
        await saveStagePlan(eventId, payload);
      }
      setMessage("Stage plan saved.");
      load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function exportPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f4f8f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (activePlan?.floorImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawElementsOnCanvas(ctx, canvas.width, canvas.height);
        const a = document.createElement("a");
        a.download = "stage-plan.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
      };
      img.src = activePlan.floorImageUrl;
    } else {
      drawElementsOnCanvas(ctx, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.download = "stage-plan.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    }
  }

  function drawElementsOnCanvas(ctx, w, h) {
    elements.forEach((el) => {
      const x = (el.xPercent / 100) * w;
      const y = (el.yPercent / 100) * h;
      const ew = (el.widthPercent / 100) * w;
      const eh = (el.heightPercent / 100) * h;
      ctx.save();
      ctx.translate(x + ew / 2, y + eh / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.fillStyle = el.color || "#008080";
      ctx.globalAlpha = 0.75;
      ctx.fillRect(-ew / 2, -eh / 2, ew, eh);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(el.label || el.elementType, 0, 4);
      ctx.restore();
    });
  }

  const selected = elements.find((el) => el.id === selectedId);

  return (
    <div className="event-ops__page event-ops__stage-plan">
      <div className="event-ops__toolbar-row">
        <label className="admin-events__outline-btn event-ops__upload-btn">
          <IconUpload size={16} /> Upload floor image
          <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </label>
        <button type="button" className="admin-events__primary-btn" onClick={handleSave} disabled={saving}>
          <IconDeviceFloppy size={16} /> {saving ? "Saving…" : "Save plan"}
        </button>
        <button type="button" className="admin-events__outline-btn" onClick={exportPng}>Export PNG</button>
        <button type="button" className="admin-events__outline-btn" onClick={() => exportOperations(eventId, "stage_plan_pdf", activePlan ? { ...activePlan, elements } : {})}>Export PDF</button>
        <label className="event-ops__view-toggle">
          <input type="checkbox" checked={viewOnly} onChange={(e) => setViewOnly(e.target.checked)} />
          View only (mobile)
        </label>
      </div>

      {error ? <p className="admin-events__error">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}
      {loading ? <p className="admin-events__hint">Loading…</p> : null}

      <div className="event-ops__stage-layout">
        <aside className="event-ops__palette admin-events__card">
          <h3>Elements</h3>
          <div className="event-ops__preset-chips">
            {(config.stageElementTypes || []).map((type) => (
              <button key={type} type="button" className="event-ops__chip" disabled={viewOnly} onClick={() => addElement(type)}>
                <IconPlus size={12} /> {type}
              </button>
            ))}
          </div>
          {selected ? (
            <div className="event-ops__element-props">
              <h4>Selected: {selected.elementType}</h4>
              <label>Label<input value={selected.label} onChange={(e) => updateElement(selected.id, { label: e.target.value })} /></label>
              <label>Width %<input type="number" value={selected.widthPercent} onChange={(e) => updateElement(selected.id, { widthPercent: Number(e.target.value) })} /></label>
              <label>Height %<input type="number" value={selected.heightPercent} onChange={(e) => updateElement(selected.id, { heightPercent: Number(e.target.value) })} /></label>
              <label>Rotation<input type="number" value={selected.rotation} onChange={(e) => updateElement(selected.id, { rotation: Number(e.target.value) })} /></label>
              <label>Color<input type="color" value={selected.color} onChange={(e) => updateElement(selected.id, { color: e.target.value })} /></label>
              <label><input type="checkbox" checked={selected.locked} onChange={(e) => updateElement(selected.id, { locked: e.target.checked })} /> Locked</label>
              <button type="button" className="admin-events__outline-btn" onClick={() => removeElement(selected.id)}><IconTrash size={14} /> Delete</button>
            </div>
          ) : null}
        </aside>

        <div
          className="event-ops__canvas-wrap"
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {activePlan?.floorImageUrl ? (
            <img src={activePlan.floorImageUrl} alt="Venue floor plan" className="event-ops__canvas-bg" />
          ) : (
            <div className="event-ops__canvas-placeholder">Upload a venue floor or stage image to begin</div>
          )}
          {elements.map((el) => (
            <button
              key={el.id}
              type="button"
              className={`event-ops__canvas-el${selectedId === el.id ? " event-ops__canvas-el--selected" : ""}`}
              style={{
                left: `${el.xPercent}%`,
                top: `${el.yPercent}%`,
                width: `${el.widthPercent}%`,
                height: `${el.heightPercent}%`,
                backgroundColor: el.color,
                transform: `rotate(${el.rotation}deg)`,
              }}
              onPointerDown={(e) => onPointerDown(e, el)}
              onClick={() => setSelectedId(el.id)}
            >
              <span>{el.label || el.elementType}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
