import { apiFetch, adminAuthHeaders } from "../../../utils/api.js";

function adminApiFetch(path, opts = {}) {
  return apiFetch(path, { ...opts, headers: { ...adminAuthHeaders(), ...(opts.headers || {}) } });
}

export function listPendingTranslations() {
  return adminApiFetch("/api/admin/i18n-review");
}

export function approveTranslation(id, editedText) {
  return adminApiFetch(`/api/admin/i18n-review/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editedText }),
  });
}

export function rejectTranslation(id) {
  return adminApiFetch(`/api/admin/i18n-review/${id}/reject`, { method: "POST" });
}
