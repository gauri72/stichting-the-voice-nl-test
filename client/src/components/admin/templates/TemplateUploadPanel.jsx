import { useState, useCallback, useRef } from "react";
import { IconAlertCircle, IconFileCode, IconLoader2, IconUpload } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";

/**
 * Drag-and-drop raw-.html-file upload — extracted verbatim (same behavior) from the page
 * this replaced, just reporting success via onSaved/pushToast instead of an automatic
 * navigate-after-2s redirect, since there's now a Library tab to land on instead.
 */
export default function TemplateUploadPanel({ onSaved, pushToast }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    const isHtml = extension === "html" || extension === "htm" || selectedFile.type === "text/html";

    if (!isHtml) {
      setFileError("Invalid file type. Please select an HTML file (.html or .htm).");
      setFile(null);
      setHtmlContent("");
      return;
    }

    setFileError("");
    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      setHtmlContent(text);

      if (!name) {
        const baseName = selectedFile.name
          .replace(/\.html?$/i, "")
          .replace(/[-_]+/g, " ")
          .trim();
        setName(baseName);
      }
    } catch {
      setFileError("Could not read file content. Please try another file.");
      setFile(null);
      setHtmlContent("");
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const triggerBrowse = () => fileInputRef.current?.click();

  const handleResetFile = () => {
    setFile(null);
    setHtmlContent("");
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }
    if (!htmlContent) {
      setError("Please select and load an HTML template file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/admin/broadcasts/templates", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          subject: name.trim(),
          description: "Uploaded via simple template manager",
          htmlBody: htmlContent,
        }),
      });

      pushToast?.({ type: "success", message: "Template uploaded." });
      setName("");
      handleResetFile();
      onSaved?.();
    } catch (err) {
      setError(err.message || "Failed to upload template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-upload-card">
      <form className="admin-upload-form" onSubmit={handleSubmit}>
        <div className="admin-upload-group">
          <label htmlFor="template-name" className="admin-upload-label">
            Template Name
          </label>
          <input
            id="template-name"
            type="text"
            className="admin-upload-input"
            placeholder="e.g. Summer Newsletter 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={160}
            disabled={loading}
          />
        </div>

        <div className="admin-upload-group">
          <span className="admin-upload-label">HTML Template File</span>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".html,.htm,text/html"
            style={{ display: "none" }}
          />

          {!file ? (
            <div
              className={`admin-upload-dropzone${isDragging ? " admin-upload-dropzone--dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerBrowse}
            >
              <div className="admin-upload-dropzone-icon">
                <IconUpload size={24} />
              </div>
              <p className="admin-upload-dropzone-text">
                Drag &amp; drop your HTML file here, or <span style={{ color: "var(--ad-purple)", textDecoration: "underline" }}>browse</span>
              </p>
              <p className="admin-upload-dropzone-hint">Supports HTML files (.html, .htm) up to 50MB</p>
            </div>
          ) : (
            <div className="admin-upload-file-details">
              <div className="admin-upload-file-info">
                <IconFileCode size={28} className="admin-upload-file-icon" />
                <div>
                  <p className="admin-upload-file-name">{file.name}</p>
                  <p className="admin-upload-file-size">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button type="button" className="admin-upload-change-btn" onClick={handleResetFile} disabled={loading}>
                Change File
              </button>
            </div>
          )}

          {fileError && (
            <div className="admin-upload-error-alert" style={{ marginTop: "8px" }}>
              <IconAlertCircle size={18} />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="admin-upload-error-alert">
            <IconAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="admin-upload-actions">
          <button type="submit" className="admin-broadcast__primary-btn" disabled={loading || !file || !name.trim()}>
            {loading ? (
              <>
                <IconLoader2 className="admin-upload-spin" size={18} />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <IconUpload size={18} />
                <span>Upload Template</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
