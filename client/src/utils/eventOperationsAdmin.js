import { adminAuthHeaders, apiFetch } from "./api.js";

const base = (eventId) => `/api/admin/events/${eventId}`;

export async function fetchOpsConfig(eventId) {
  return apiFetch(`${base(eventId)}/operations/config`, { headers: adminAuthHeaders() });
}

export async function fetchOpsOverview(eventId) {
  return apiFetch(`${base(eventId)}/operations`, { headers: adminAuthHeaders() });
}

export async function fetchInventory(eventId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`${base(eventId)}/inventory${q ? `?${q}` : ""}`, { headers: adminAuthHeaders() });
}

export async function saveInventoryItem(eventId, item, itemId = null) {
  const url = itemId ? `${base(eventId)}/inventory/${itemId}` : `${base(eventId)}/inventory`;
  return apiFetch(url, {
    method: itemId ? "PATCH" : "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(item),
  });
}

export async function deleteInventoryItem(eventId, itemId) {
  return apiFetch(`${base(eventId)}/inventory/${itemId}`, {
    method: "DELETE",
    headers: adminAuthHeaders(),
  });
}

export async function duplicateInventoryItem(eventId, itemId) {
  return apiFetch(`${base(eventId)}/inventory/${itemId}/duplicate`, {
    method: "POST",
    headers: adminAuthHeaders(),
  });
}

export async function copyInventoryFromEvent(eventId, sourceEventId) {
  return apiFetch(`${base(eventId)}/inventory/copy-from-event`, {
    method: "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify({ sourceEventId }),
  });
}

export async function fetchTechnicalRider(eventId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`${base(eventId)}/technical-rider${q ? `?${q}` : ""}`, { headers: adminAuthHeaders() });
}

export async function saveRiderItem(eventId, item, itemId = null) {
  const url = itemId ? `${base(eventId)}/technical-rider/${itemId}` : `${base(eventId)}/technical-rider`;
  return apiFetch(url, {
    method: itemId ? "PATCH" : "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(item),
  });
}

export async function deleteRiderItem(eventId, itemId) {
  return apiFetch(`${base(eventId)}/technical-rider/${itemId}`, {
    method: "DELETE",
    headers: adminAuthHeaders(),
  });
}

export async function fetchStagePlans(eventId) {
  return apiFetch(`${base(eventId)}/stage-plan`, { headers: adminAuthHeaders() });
}

export async function saveStagePlan(eventId, plan, planId = null) {
  const url = planId ? `${base(eventId)}/stage-plan/${planId}` : `${base(eventId)}/stage-plan`;
  return apiFetch(url, {
    method: planId ? "PATCH" : "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(plan),
  });
}

export async function fetchDocuments(eventId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`${base(eventId)}/documents${q ? `?${q}` : ""}`, { headers: adminAuthHeaders() });
}

export async function uploadDocument(eventId, payload) {
  return apiFetch(`${base(eventId)}/documents/upload`, {
    method: "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateDocument(eventId, documentId, payload) {
  return apiFetch(`${base(eventId)}/documents/${documentId}`, {
    method: "PATCH",
    headers: adminAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteDocument(eventId, documentId) {
  return apiFetch(`${base(eventId)}/documents/${documentId}`, {
    method: "DELETE",
    headers: adminAuthHeaders(),
  });
}

export async function fetchDocumentVersions(eventId, documentId) {
  return apiFetch(`${base(eventId)}/documents/${documentId}/versions`, { headers: adminAuthHeaders() });
}

export async function fetchChecklists(eventId) {
  return apiFetch(`${base(eventId)}/checklists`, { headers: adminAuthHeaders() });
}

export async function saveChecklistItem(eventId, item, taskId = null) {
  const url = taskId ? `${base(eventId)}/checklists/${taskId}` : `${base(eventId)}/checklists`;
  return apiFetch(url, {
    method: taskId ? "PATCH" : "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(item),
  });
}

export async function fetchVendors(eventId) {
  return apiFetch(`${base(eventId)}/vendors`, { headers: adminAuthHeaders() });
}

export async function saveVendor(eventId, vendor, vendorId = null) {
  const url = vendorId ? `${base(eventId)}/vendors/${vendorId}` : `${base(eventId)}/vendors`;
  return apiFetch(url, {
    method: vendorId ? "PATCH" : "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(vendor),
  });
}

export async function fetchEventsPicker(eventId) {
  return apiFetch(`${base(eventId)}/operations/events-picker`, { headers: adminAuthHeaders() });
}

export async function exportOperations(eventId, type, plan = null) {
  const res = await fetch(`/api/admin/events/${eventId}/operations/export`, {
    method: "POST",
    headers: {
      ...adminAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, plan }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Export failed.");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : "export";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchGlobalInventory(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/api/admin/inventory${q ? `?${q}` : ""}`, { headers: adminAuthHeaders() });
}

export async function saveGlobalInventoryItem(item, itemId = null) {
  const url = itemId ? `/api/admin/inventory/${itemId}` : "/api/admin/inventory";
  return apiFetch(url, {
    method: itemId ? "PATCH" : "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(item),
  });
}

export async function fetchGlobalDocuments(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/api/admin/documents${q ? `?${q}` : ""}`, { headers: adminAuthHeaders() });
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatEventDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
