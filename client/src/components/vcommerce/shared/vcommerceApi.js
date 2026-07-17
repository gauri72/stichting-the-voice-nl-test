import { apiFetch, authHeaders, adminAuthHeaders } from "../../../utils/api.js";

// --- Public ---

export function getVCommerceFeatured() {
  return apiFetch("/api/vcommerce/featured");
}

export function getVCommerceStats() {
  return apiFetch("/api/vcommerce/stats");
}

export function getVCommercePopularProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/vcommerce/products/popular${qs ? `?${qs}` : ""}`);
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

export function confirmApplicationPackagePayment(sessionId) {
  const qs = new URLSearchParams({ sessionId }).toString();
  return apiFetch(`/api/vcommerce/apply/payment-confirm?${qs}`, { headers: authHeaders() });
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

// --- Portal: Bulk Pricing ---

export function patchMyProductPricing(productId, data) {
  return apiFetch(`/api/vcommerce-portal/me/products/${productId}/pricing`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

// --- Portal: Excel Import ---

export function getProductsTemplate() {
  return fetch("/api/vcommerce-portal/me/products/template", { headers: authHeaders() }).then((r) => {
    if (!r.ok) throw new Error("Failed to download template.");
    return r.blob();
  });
}

export function postImportProducts(formData) {
  return apiFetch("/api/vcommerce-portal/me/products/import", {
    method: "POST",
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: formData,
  });
}

export function getMyImportHistory() {
  return apiFetch("/api/vcommerce-portal/me/products/import-history", { headers: authHeaders() });
}

// --- Portal: Referral Link ---

export function getMyReferralLink() {
  return apiFetch("/api/vcommerce-portal/me/referral-link", { headers: authHeaders() });
}

export function getMyConnectStatus() {
  return apiFetch("/api/vcommerce-portal/me/connect/status", { headers: authHeaders() });
}

export function startMyConnectOnboarding() {
  return apiFetch("/api/vcommerce-portal/me/connect/onboarding", {
    method: "POST",
    headers: authHeaders(),
  });
}

export function startMyPackageCheckout() {
  return apiFetch("/api/vcommerce-portal/me/package/checkout", {
    method: "POST",
    headers: authHeaders(),
  });
}

export function submitMyBusinessForReview() {
  return apiFetch("/api/vcommerce-portal/me/submit-review", {
    method: "POST",
    headers: authHeaders(),
  });
}

// --- Public: Reviews ---

export function getVCommerceReviews(slug, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/vcommerce/${slug}/reviews${qs ? `?${qs}` : ""}`);
}

export function postVCommerceReview(businessId, data) {
  return apiFetch(`/api/vcommerce/${businessId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

// --- Wholesaler ---

export function getWholesalerStatus() {
  return apiFetch("/api/wholesaler/status", { headers: authHeaders() });
}

export function postRegisterWholesaler(data) {
  return apiFetch("/api/wholesaler/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function getMyWholesalerProfile() {
  return apiFetch("/api/wholesaler/me", { headers: authHeaders() });
}

export function patchMyWholesalerProfile(data) {
  return apiFetch("/api/wholesaler/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function postReorderFromPastOrder(orderId) {
  return apiFetch(`/api/wholesaler/orders/${orderId}/reorder`, {
    method: "POST",
    headers: authHeaders(),
  });
}

// --- Admin: Wholesalers ---

export function adminGetWholesalers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return adminFetch(`/api/admin/wholesalers${qs ? `?${qs}` : ""}`);
}

export function adminPatchWholesaler(id, data) {
  return adminFetch(`/api/admin/wholesalers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// --- Admin: Reviews ---

export function adminGetReviews(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return adminFetch(`/api/admin/wholesalers/reviews${qs ? `?${qs}` : ""}`);
}

export function adminDeleteReview(id) {
  return adminFetch(`/api/admin/wholesalers/reviews/${id}`, { method: "DELETE" });
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
