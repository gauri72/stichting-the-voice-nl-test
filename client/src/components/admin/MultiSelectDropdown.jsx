import { useEffect, useRef, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import "../../styles/multi-select-dropdown.css";

/**
 * Single-line dropdown that expands into a checklist — picks one or more options without
 * taking up the vertical space of a native <select multiple> listbox. Used for "Select
 * Events" / "Select Ticket Type" across the discount/voucher/membership admin pickers.
 */
export default function MultiSelectDropdown({
  label,
  placeholder = "Select…",
  options,
  selected,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function toggleValue(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  return (
    <div className="multi-select-dropdown" ref={rootRef}>
      {label ? <span className="multi-select-dropdown__label">{label}</span> : null}
      <button
        type="button"
        className="multi-select-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`multi-select-dropdown__summary${selectedLabels.length === 0 ? " multi-select-dropdown__summary--placeholder" : ""}`}>
          {summary}
        </span>
        <IconChevronDown size={16} className="multi-select-dropdown__chevron" aria-hidden />
      </button>
      {open ? (
        <ul className="multi-select-dropdown__panel" role="listbox" aria-multiselectable="true">
          {options.length === 0 ? (
            <li className="multi-select-dropdown__empty">No options available</li>
          ) : (
            options.map((opt) => (
              <li key={opt.value}>
                <label className="multi-select-dropdown__option">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggleValue(opt.value)}
                  />
                  {opt.label}
                </label>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
