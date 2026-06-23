/**
 * Resolves required RBAC permission key from admin API request path + method.
 * Returns null when any authenticated admin may proceed (e.g. /admin/me).
 */

function methodAction(method, { create = "create", mutate = "edit", read = "view", remove = "delete" } = {}) {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return read;
  if (m === "DELETE") return remove;
  if (m === "POST") return create;
  if (m === "PUT" || m === "PATCH") return mutate;
  return read;
}

function eventsPermission(url, method) {
  if (url.includes("/tickets")) {
    if (method === "GET") return "tickets.view";
    if (url.includes("/refund")) return "tickets.refund";
    if (url.includes("/resend-email")) return "tickets.resend";
    if (url.includes("/export") || url.includes("/pdf")) return "tickets.export";
    return "tickets.edit";
  }
  if (url.includes("/check-in")) {
    return method === "GET" ? "checkin.view" : "checkin.scan";
  }
  if (url.includes("/vouchers")) {
    return method === "GET" ? "vouchers.view" : "vouchers.edit";
  }
  if (
    url.includes("/inventory") ||
    url.includes("/operations") ||
    url.includes("/technical-rider") ||
    url.includes("/stage-plan") ||
    url.includes("/documents") ||
    url.includes("/checklists") ||
    url.includes("/vendors")
  ) {
    if (url.includes("/documents")) {
      return method === "GET" ? "documents.view" : "documents.edit";
    }
    return method === "GET" ? "inventory.view" : "inventory.edit";
  }
  if (url.includes("/seat-map") || url.includes("/seats")) {
    return method === "GET" ? "seat_maps.view" : "seat_maps.edit";
  }
  if (url.includes("/highlights")) {
    return method === "GET" ? "cms.view" : "cms.edit";
  }
  if (url.includes("/publish") || url.includes("/draft")) return "events.publish";
  if (method === "DELETE" && /\/events\/[^/]+$/.test(url)) return "events.delete";
  if (method === "POST" && /\/events\/?$/.test(url)) return "events.create";
  if (["POST", "PUT", "PATCH"].includes(method)) return "events.edit";
  return "events.view";
}

export function resolveAdminPermission(req) {
  const url = String(req.originalUrl || req.url || "").split("?")[0];
  const method = req.method || "GET";

  if (/\/admin\/me\/?$/.test(url)) return null;

  if (url.includes("/admin/access")) {
    return method === "GET" ? "access_management.view" : "access_management.edit";
  }
  if (url.includes("/admin/inventory")) {
    return method === "GET" ? "inventory.view" : "inventory.edit";
  }
  if (url.includes("/admin/documents")) {
    return method === "GET" ? "documents.view" : "documents.edit";
  }
  if (url.includes("/admin/events")) return eventsPermission(url, method);
  if (url.includes("/admin/sessions") || url.includes("/admin/session-bookings") || url.includes("/admin/resources")) {
    if (method === "GET") return "sessions.view";
    if (method === "DELETE") return "sessions.delete";
    return "sessions.edit";
  }
  if (url.includes("/admin/rsvps")) {
    return method === "GET" ? "rsvp.view" : "rsvp.edit";
  }
  if (url.includes("/admin/checkout-forms")) {
    return method === "GET" ? "checkout_forms.view" : "checkout_forms.edit";
  }
  if (url.includes("/admin/reviews")) {
    if (method === "GET") return "reviews.view";
    if (url.includes("/moderate") || url.includes("/approve") || url.includes("/reject")) return "reviews.moderate";
    return "reviews.edit";
  }
  if (url.includes("/admin/team-members")) {
    return method === "GET" ? "team_public.view" : "team_public.edit";
  }
  if (url.includes("/admin/api-builder")) {
    if (url.includes("/secrets")) return "api_builder.secrets";
    if (url.includes("/test") || url.includes("/execute")) return "api_builder.test";
    return method === "GET" ? "api_builder.view" : "api_builder.edit";
  }
  if (url.includes("/admin/memberships")) {
    const action = methodAction(method, { create: "create", mutate: "edit", remove: "delete" });
    return `memberships.${action}`;
  }
  if (url.includes("/admin/users")) {
    if (url.includes("/export")) return "users.export";
    return method === "GET" ? "users.view" : "users.edit";
  }
  if (url.includes("/admin/discounts") || url.includes("/admin/vouchers")) {
    const module = url.includes("/vouchers") ? "vouchers" : "discounts";
    return method === "GET" ? `${module}.view` : `${module}.edit`;
  }
  if (url.includes("/admin/sponsorships")) {
    if (url.includes("/receipt")) return "sponsorships.receipt";
    if (url.includes("/export")) return "sponsorships.export";
    return method === "GET" ? "sponsorships.view" : "sponsorships.edit";
  }
  if (url.includes("/admin/donations")) {
    if (url.includes("/receipt")) return "donations.receipt";
    if (url.includes("/export")) return "donations.export";
    return method === "GET" ? "donations.view" : "donations.edit";
  }
  if (url.includes("/admin/finance")) {
    if (url.includes("/export")) return "finance.export";
    return method === "GET" ? "finance.view" : "finance.edit";
  }
  if (url.includes("/admin/reports")) {
    if (url.includes("/export")) return "reports.export";
    return method === "GET" ? "reports.view" : "reports.create";
  }
  if (url.includes("/admin/pages") || url.includes("/admin/customer-dashboard")) {
    if (method === "GET") return "cms.view";
    if (url.includes("/publish")) return "cms.publish";
    return "cms.edit";
  }
  if (url.includes("/admin/settings")) {
    if (url.includes("/financial")) return "settings.financial";
    return method === "GET" ? "settings.view" : "settings.edit";
  }
  if (url.includes("/admin/dashboard")) return "dashboard.view";
  if (url.includes("/admin/broadcasts") || url.includes("/admin/communication")) {
    if (url.includes("/send")) return "communication.send";
    return method === "GET" ? "communication.view" : "communication.edit";
  }
  if (url.includes("/admin/templates")) {
    return method === "GET" ? "templates.view" : "templates.upload";
  }
  if (url.includes("/admin/tickettailor")) return "memberships.edit";

  return "dashboard.view";
}
