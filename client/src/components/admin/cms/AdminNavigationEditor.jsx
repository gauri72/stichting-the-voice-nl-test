import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from "@tabler/icons-react";

function newNavItem(label = "New item") {
  return {
    id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    url: "/",
    icon: "",
    order: 0,
    visible: true,
    showOnDesktop: true,
    showOnMobile: true,
    desktopVisible: true,
    mobileVisible: true,
    openInNewTab: false,
    type: "page",
    children: [],
  };
}

function updateAtPath(items, path, updater) {
  if (!path.length) return updater(items);
  const [head, ...rest] = path;
  return items.map((item, index) => {
    if (index !== head) return item;
    const children = item.children || [];
    return {
      ...item,
      children: updateAtPath(children, rest, updater),
    };
  });
}

function removeAtPath(items, path) {
  if (path.length === 1) return items.filter((_, i) => i !== path[0]);
  const [head, ...rest] = path;
  return items.map((item, index) => {
    if (index !== head) return item;
    return { ...item, children: removeAtPath(item.children || [], rest) };
  });
}

function moveAtPath(items, path, direction) {
  if (path.length === 1) {
    const index = path[0];
    const next = index + direction;
    if (next < 0 || next >= items.length) return items;
    const copy = [...items];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    return copy.map((item, order) => ({ ...item, order }));
  }
  const [head, ...rest] = path;
  return items.map((item, index) => {
    if (index !== head) return item;
    return { ...item, children: moveAtPath(item.children || [], rest, direction) };
  });
}

function NavItemEditor({ item, path, depth, readOnly, onChange, onRemove, onMove, onAddChild }) {
  const isSub = depth > 0;

  return (
    <div className={`admin-cms__nav-item admin-cms__nav-item--depth-${depth}`}>
      <div className="admin-cms__nav-item-head">
        <strong>{isSub ? "Submenu" : "Menu"} item</strong>
        {!readOnly ? (
          <div className="admin-cms__nav-item-tools">
            <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => onMove(path, -1)} aria-label="Move up">
              <IconChevronUp size={14} />
            </button>
            <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => onMove(path, 1)} aria-label="Move down">
              <IconChevronDown size={14} />
            </button>
            {!isSub ? (
              <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => onAddChild(path)}>
                <IconPlus size={14} /> Submenu
              </button>
            ) : null}
            <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--danger" onClick={() => onRemove(path)} aria-label="Remove">
              <IconTrash size={14} />
            </button>
          </div>
        ) : null}
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Label</label>
        <input className="admin-cms__input" value={item.label || ""} onChange={(e) => onChange(path, "label", e.target.value)} disabled={readOnly} />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">URL</label>
        <input className="admin-cms__input" value={item.url || ""} onChange={(e) => onChange(path, "url", e.target.value)} disabled={readOnly} placeholder="/events or https://..." />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Link type</label>
        <select className="admin-cms__select" value={item.type || "page"} onChange={(e) => onChange(path, "type", e.target.value)} disabled={readOnly}>
          <option value="page">Internal page</option>
          <option value="external">External</option>
          <option value="anchor">Anchor</option>
          <option value="dynamic">Dynamic</option>
        </select>
      </div>
      <div className="admin-cms__nav-checks">
        <label className="admin-cms__checkbox">
          <input type="checkbox" checked={item.visible !== false} onChange={(e) => onChange(path, "visible", e.target.checked)} disabled={readOnly} />
          Visible
        </label>
        <label className="admin-cms__checkbox">
          <input type="checkbox" checked={item.desktopVisible !== false && item.showOnDesktop !== false} onChange={(e) => onChange(path, "desktopVisible", e.target.checked)} disabled={readOnly} />
          Desktop
        </label>
        <label className="admin-cms__checkbox">
          <input type="checkbox" checked={item.mobileVisible !== false && item.showOnMobile !== false} onChange={(e) => onChange(path, "mobileVisible", e.target.checked)} disabled={readOnly} />
          Mobile
        </label>
        <label className="admin-cms__checkbox">
          <input type="checkbox" checked={item.openInNewTab === true} onChange={(e) => onChange(path, "openInNewTab", e.target.checked)} disabled={readOnly} />
          New tab
        </label>
      </div>
      {(item.children || []).map((child, childIndex) => (
        <NavItemEditor
          key={child.id || `${path.join("-")}-${childIndex}`}
          item={child}
          path={[...path, childIndex]}
          depth={depth + 1}
          readOnly={readOnly}
          onChange={onChange}
          onRemove={onRemove}
          onMove={onMove}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

export default function AdminNavigationEditor({ items = [], readOnly, onChange }) {
  function handleChange(path, field, value) {
    function apply(item) {
      const next = { ...item, [field]: value };
      if (field === "desktopVisible") next.showOnDesktop = value;
      if (field === "mobileVisible") next.showOnMobile = value;
      return next;
    }
    function setDeep(list, remaining) {
      if (remaining.length === 1) {
        return list.map((item, index) => (index === remaining[0] ? apply(item) : item));
      }
      const [head, ...rest] = remaining;
      return list.map((item, index) =>
        index === head ? { ...item, children: setDeep(item.children || [], rest) } : item
      );
    }
    onChange(setDeep(items, path));
  }

  function handleRemove(path) {
    onChange(removeAtPath(items, path));
  }

  function handleMove(path, direction) {
    onChange(moveAtPath(items, path, direction));
  }

  function handleAddChild(path) {
    onChange(
      updateAtPath(items, path, (list) =>
        list.map((item, index) => {
          if (index !== path[0]) return item;
          const children = [...(item.children || [])];
          children.push({ ...newNavItem("Submenu item"), order: children.length });
          return { ...item, children };
        })
      )
    );
  }

  function addTopLevel() {
    onChange([...items, { ...newNavItem(), order: items.length }]);
  }

  return (
    <div className="admin-cms__nav-editor">
      <div className="admin-cms__nav-editor-toolbar">
        <h3>Navigation items</h3>
        {!readOnly ? (
          <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={addTopLevel}>
            <IconPlus size={16} /> Add menu item
          </button>
        ) : null}
      </div>
      {items.map((item, index) => (
        <NavItemEditor
          key={item.id || index}
          item={item}
          path={[index]}
          depth={0}
          readOnly={readOnly}
          onChange={handleChange}
          onRemove={handleRemove}
          onMove={handleMove}
          onAddChild={handleAddChild}
        />
      ))}
    </div>
  );
}
