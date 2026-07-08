import { apiFetch, authHeaders, adminAuthHeaders } from "../../../utils/api.js";

// --- Public ---

export function getVCommerceFeatured() {
  return apiFetch("/api/vcommerce/featured");
}

export function getVCommerceList(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return apiFetch(`/api/vcommerce${qs ? `?${qs}` : ""}`);
}

export function getVCommerceProfile(slug) {
  return apiFetch(`/api/vcommerce/${slug}`);
}

// --- Application ---

export function getApplyStatus() {
  return apiFetch("/api/vcommerce/apply/status", { headers: authHeaders() });
}

export function postApply(data) {
  return apiFetch("/api/vcommerce/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

// --- Orders ---

export function postCreateOrder(businessId, data) {
  return apiFetch(`/api/vcommerce/${businessId}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function getOrderStatus(orderId) {
  return apiFetch(`/api/vcommerce/order/${orderId}/status`, { headers: authHeaders() });
}

// --- Business Portal ---

export function getMyBusiness() {
  return apiFetch("/api/vcommerce-portal/me", { headers: authHeaders() });
}

export function patchMyBusiness(data) {
  return apiFetch("/api/vcommerce-portal/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function uploadBusinessImage(field, imageData) {
  return apiFetch(`/api/vcommerce-portal/me/upload/${field}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ imageData }),
  });
}

export function getMyProducts() {
  return apiFetch("/api/vcommerce-portal/me/products", { headers: authHeaders() });
}

export function postMyProduct(data) {
  return apiFetch("/api/vcommerce-portal/me/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function patchMyProduct(productId, data) {
  return apiFetch(`/api/vcommerce-portal/me/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function deleteMyProduct(productId) {
  return apiFetch(`/api/vcommerce-portal/me/products/${productId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export function getMyOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/vcommerce-portal/me/orders${qs ? `?${qs}` : ""}`, { headers: authHeaders() });
}

export function markOrderFulfilled(orderId, note) {
  return apiFetch(`/api/vcommerce-portal/me/orders/${orderId}/fulfilled`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ note }),
  });
}

export function getMyPayouts() {
  return apiFetch("/api/vcommerce-portal/me/payouts", { headers: authHeaders() });
}

// --- Admin ---

function adminFetch(path, opts = {}) {
  return apiFetch(path, { ...opts, headers: { ...adminAuthHeaders(), ...(opts.headers || {}) } });
}

export function adminGetApplications(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return adminFetch(`/api/admin/vcommerce/applications${qs ? `?${qs}` : ""}`);
}

export function adminReviewApplication(id, data) {
  return adminFetch(`/api/admin/vcommerce/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function adminGetBusinesses(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return adminFetch(`/api/admin/vcommerce/businesses${qs ? `?${qs}` : ""}`);
}

export function adminGetOneBusiness(id) {
  return adminFetch(`/api/admin/vcommerce/businesses/${id}`);
}

export function adminPatchBusiness(id, data) {
  return adminFetch(`/api/admin/vcommerce/businesses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function adminSetFeatured(businessId) {
  return adminFetch(`/api/admin/vcommerce/businesses/${businessId}/featured`, { method: "POST" });
}

export function adminGetOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return adminFetch(`/api/admin/vcommerce/orders${qs ? `?${qs}` : ""}`);
}

export function adminGetPayouts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return adminFetch(`/api/admin/vcommerce/payouts${qs ? `?${qs}` : ""}`);
}

export function adminGetPayoutSummary(businessId) {
  return adminFetch(`/api/admin/vcommerce/payouts/summary/${businessId}`);
}

export function adminCreatePayout(data) {
  return adminFetch("/api/admin/vcommerce/payouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function adminMarkPayoutPaid(payoutId, data) {
  return adminFetch(`/api/admin/vcommerce/payouts/${payoutId}/paid`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function adminGetAnalytics() {
  return adminFetch("/api/admin/vcommerce/analytics");
}
