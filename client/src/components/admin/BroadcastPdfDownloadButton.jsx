import { useEffect, useRef, useState } from "react";
import { IconDownload, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const POLL_MS = 2000;

/** "Download PDF" action shared by the history table rows and the report page header —
 * handles the full queued -> generating -> ready/error lifecycle behind one button so
 * neither call site has to duplicate the polling logic. */
export default function BroadcastPdfDownloadButton({ broadcastId, initialStatus = "idle" }) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // If this button mounts already mid-generation (e.g. the admin navigated away and back
  // while a PDF was still being built), resume polling immediately — otherwise it renders a
  // permanently disabled "Generating…" state that only a full page reload would ever clear.
  useEffect(() => {
    if (initialStatus === "queued" || initialStatus === "generating") pollUntilDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pollUntilDone() {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await apiFetch(`/admin/broadcasts/${broadcastId}/pdf/status`, { headers: adminAuthHeaders() });
        setStatus(data.pdfStatus);
        if (data.pdfStatus === "error") setError(data.pdfError || "PDF generation failed.");
        if (data.pdfStatus === "ready" || data.pdfStatus === "error") clearInterval(pollRef.current);
      } catch {
        clearInterval(pollRef.current);
      }
    }, POLL_MS);
  }

  async function handleClick(e) {
    e.stopPropagation(); // rows in the history table are themselves clickable
    setError("");

    if (status === "ready") {
      try {
        const data = await apiFetch(`/admin/broadcasts/${broadcastId}/pdf/download`, { headers: adminAuthHeaders() });
        window.open(data.url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setError(err.message || "Could not start the download.");
      }
      return;
    }

    if (status === "generating" || status === "queued") return; // already in flight

    try {
      const data = await apiFetch(`/admin/broadcasts/${broadcastId}/pdf`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setStatus(data.pdfStatus);
      if (data.pdfStatus === "queued" || data.pdfStatus === "generating") pollUntilDone();
    } catch (err) {
      setStatus("error");
      setError(err.message || "Could not request PDF generation.");
    }
  }

  const busy = status === "queued" || status === "generating";
  const label = busy ? "Generating…" : status === "error" ? "Retry PDF" : "Download PDF";

  return (
    <span className="broadcast-pdf-button">
      <button type="button" className="admin-finance__btn" onClick={handleClick} disabled={busy} title={error || undefined}>
        {busy ? <IconLoader2 size={16} className="broadcast-pdf-button__spin" /> : status === "error" ? <IconRefresh size={16} /> : <IconDownload size={16} />}
        {label}
      </button>
      {error ? <span className="broadcast-pdf-button__error">{error}</span> : null}
    </span>
  );
}
