import { useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";
import { formatSectionType } from "../../../utils/pagesAdmin.js";

export default function CmsSectionList({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  readOnly = false,
  formatType = formatSectionType,
}) {
  const [dragId, setDragId] = useState(null);

  function handleDragStart(e, sectionId) {
    if (readOnly) return;
    setDragId(sectionId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetId) {
    e.preventDefault();
    if (!dragId || dragId === targetId || readOnly) return;
    const ids = sections.map((s) => s.sectionId);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...ids];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, dragId);
    onReorder(next);
    setDragId(null);
  }

  return (
    <div className="admin-cms__section-list">
      {sections.map((section, index) => (
        <div
          key={section.sectionId}
          className={`admin-cms__section-item${selectedId === section.sectionId ? " admin-cms__section-item--active" : ""}${section.isVisible === false ? " admin-cms__section-item--hidden" : ""}`}
          draggable={!readOnly}
          onDragStart={(e) => handleDragStart(e, section.sectionId)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, section.sectionId)}
        >
          <div className="admin-cms__section-item-main" onClick={() => onSelect(section.sectionId)}>
            {!readOnly ? <IconGripVertical size={16} className="admin-cms__drag-handle" /> : null}
            <div className="admin-cms__section-item-info">
              <strong>{section.title || formatType(section.sectionType)}</strong>
              <span>{formatType(section.sectionType)}</span>
            </div>
          </div>
          {!readOnly ? (
            <div className="admin-cms__section-item-actions">
              <button type="button" title="Move up" disabled={index === 0} onClick={() => onMoveUp(section.sectionId)}>
                <IconChevronUp size={16} />
              </button>
              <button type="button" title="Move down" disabled={index === sections.length - 1} onClick={() => onMoveDown(section.sectionId)}>
                <IconChevronDown size={16} />
              </button>
              <button type="button" title={section.isVisible === false ? "Show" : "Hide"} onClick={() => onToggleVisibility(section.sectionId)}>
                {section.isVisible === false ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
              <button type="button" title="Duplicate" onClick={() => onDuplicate(section.sectionId)}>
                <IconCopy size={16} />
              </button>
              {section.isCustom ? (
                <button type="button" title="Delete" className="admin-cms__btn--danger" onClick={() => onDelete(section.sectionId)}>
                  <IconTrash size={16} />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
