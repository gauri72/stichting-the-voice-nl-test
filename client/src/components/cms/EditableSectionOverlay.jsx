import { IconPencil } from "@tabler/icons-react";
import "../../styles/cms-editable-overlay.css";

/**
 * Wraps one rendered section with hover/click affordances for the visual
 * editor. Never alters the section's own markup — purely an absolutely
 * positioned sibling layer, so what admins see in Edit mode is pixel-identical
 * to Browse mode and the public site.
 */
export default function EditableSectionOverlay({ section, label, selected, onSelect, children }) {
  return (
    <div
      className={`cms-editable-overlay${selected ? " cms-editable-overlay--selected" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(section.sectionId);
      }}
    >
      {children}
      <div className="cms-editable-overlay__chrome" aria-hidden="true">
        <span className="cms-editable-overlay__label">
          <IconPencil size={12} stroke={2} /> {label}
        </span>
      </div>
    </div>
  );
}
