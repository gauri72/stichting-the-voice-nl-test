import { useRef } from "react";
import { IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { readImageFile, validateImageFile } from "../../../utils/pagesAdmin.js";

export default function CmsImageField({
  label,
  value,
  onChange,
  imageType = "section",
  guidance = "",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const image = value || { url: "", alt: "", focusPosition: "center" };

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      validateImageFile(file);
      const dataUrl = await readImageFile(file);
      const result = await apiFetch("/api/admin/pages/uploads/page-image", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          imageData: dataUrl,
          imageType,
          alt: image.alt,
          focusPosition: image.focusPosition,
        }),
      });
      onChange(result.image);
    } catch (err) {
      alert(err.message || "Upload failed.");
    }
    event.target.value = "";
  }

  return (
    <div className="admin-cms__image-field">
      <label className="admin-cms__label">{label}</label>
      {guidance ? <p className="admin-cms__hint">{guidance}</p> : null}
      {image.url ? (
        <div className="admin-cms__image-preview">
          <img src={image.url} alt={image.alt || label} style={{ objectPosition: image.focusPosition || "center" }} />
          {!disabled ? (
            <div className="admin-cms__image-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => inputRef.current?.click()}>
                <IconUpload size={16} /> Replace
              </button>
              <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--danger" onClick={() => onChange({ url: "", alt: "", focusPosition: "center" })}>
                <IconTrash size={16} /> Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <button type="button" className="admin-cms__upload-zone" onClick={() => !disabled && inputRef.current?.click()} disabled={disabled}>
          <IconPhoto size={24} />
          <span>Upload image</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={handleUpload} />
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Alt text</label>
        <input
          className="admin-cms__input"
          value={image.alt || ""}
          onChange={(e) => onChange({ ...image, alt: e.target.value })}
          disabled={disabled}
          placeholder="Describe the image"
        />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Focus position</label>
        <select
          className="admin-cms__select"
          value={image.focusPosition || "center"}
          onChange={(e) => onChange({ ...image, focusPosition: e.target.value })}
          disabled={disabled}
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
