# Summary: Security/Stability Audit + Discount System (June 24–25, 2026)

**Project:** Stichting The V.O.I.C.E. NL
**Window covered:** last 48 hours
**Commits:** [`1db6b70`](#1-full-source-code-audit) (audit), [`348e68e`](#2-discount-code-voucher--membership-discount-system) (discount system)
**Status:** Both commits pushed to `origin/main` on GitHub (`gauri72/stichting-the-voice-nl-test`)

---

## 1. Full source code audit

`1db6b70` — **425 files changed, 15,592 insertions, 5,799 deletions**

A complete pass across the server and client, organized by severity. Verified throughout via the full backend test suite, real document validation against updated schemas, live browser checks for UI-facing changes, and a full client production build.

### Phase 1 — Critical
- Allowlisted mass-assignment in dashboard/page builders (admins could previously write arbitrary fields).
- Added DOMPurify sanitization on every `dangerouslySetInnerHTML` site.
- Fixed an IDOR on session/RSVP PDF downloads (now gated by `checkInToken`).
- Fixed a missing `mongoose` import that was breaking membership discount payments.
- Fixed complimentary ticket fulfillment.
- Closed a finance ledger idempotency gap with a partial unique index.

### Phase 2 — High
- Added `select: false` on password/OTP/webhook-secret fields, with corrected read-site auditing.
- Switched webhook signature comparison to timing-safe.
- Wired up waitlist notify/convert (previously dead buttons).
- Made admin RBAC fail-closed on both server and client — found and fixed **7 unmapped admin route groups** that had no permission mapping.
- Disabled not-yet-wired "Smart API" triggers in the UI rather than leaving them silently broken.
- Fixed a sponsorship auth-header inconsistency.

### Phase 3 — Medium
- Escaped regex in 12 admin search locations (ReDoS risk).
- Fixed a rate-limit memory leak; added per-route body-size limits and public-endpoint rate limiting.
- Added a membership-provisioning race-condition guard.
- Added the missing "My Sessions" dashboard widget.
- Added try/catch on ~20 previously unguarded admin actions.
- Extracted shared `useApiWarmup`/`useAutoAdvance` hooks, deduping 3 payment blocks and 4 carousels.
- Fixed a carousel touch-timer leak.
- Replaced 5 dead routes with a real "coming soon" page instead of a blank screen.

### Phase 4 — Low / cleanup
- Wired up 3 customer emails that were never being sent, and fixed a wrong "from" address bug affecting all 5 discount-related emails.
- Removed 31 orphaned component files and ~25 dead service functions (6 entire files deleted).
- Consolidated `handleError`/validation/PDF-buffer helpers across ~50 files.

### Additional bugs found and fixed beyond the original audit scope
- Refunding a seated ticket never released the seat back to inventory.
- The "Enable online payments" admin kill-switch did nothing — now enforced.
- Admin-configured SMTP settings were silently ignored in favor of `.env` only — now loaded at startup and hot-reloaded on settings update.
- `GET /api/booking/waitlist` had no auth and leaked full waitlist PII (name, email, phone) — restricted to admins.
- Session-booking confirmations never notified admins.

---

## 2. Discount Code, Voucher & Membership Discount System

`348e68e` — **41 files changed, 2,252 insertions, 252 deletions**

A new system allowing discounts, vouchers, and membership discounts to be scoped to specific events **and specific ticket types within those events** — not just whole events as before. Delivered in three phases plus a UI redesign, all verified against the live dev server and database with disposable test fixtures (cleaned up after each check).

### Phase A — Backend schema + validation engine
- `DiscountRule` and `Voucher` models gained `applyToAllEvents` + `eventScopes: [{eventId, applyToAllTicketTypes, ticketTypeIds}]` for precise per-event-per-ticket-type targeting. Legacy `eligibleEventIds`/`eligibleEvents` kept as a deprecated fallback for backward compatibility.
- New `appliesToEventAndTicketType()` validation helper, with every discount/membership/voucher check now also verifying the event is **published** before applying anything (`isEventPublished()`).
- New `applyDiscountsToOrderLines()` — resolves discounts per ticket-type line and sums the results, so a code valid for one ticket type degrades gracefully instead of failing the whole cart.
- Removed a dead, parallel voucher-validation code path (`ticketPricingService.js`'s `validateVoucher`) that had zero real callers — was a second, unmaintained eligibility engine that didn't check published status or ticket type.
- Fixed a pre-existing gap where vouchers redeemed through the main checkout path never had their usage count incremented (silently reusable beyond their limit).
- `Voucher` gained `assignedEmail` (single-recipient vouchers) and a `"used"` status.
- New voucher bulk-generate and CSV export endpoints.
- One-time migration script (`migrate-discount-event-scopes.js`) run against the live database to backfill the new fields on all 9 existing membership-discount rules and 1 existing voucher.
- 15 new vitest unit tests (`discountService.test.js`).

### Phase B — Admin UI
- `AdminDiscountsPage.jsx`: replaced the old single event multi-select with the new scope picker; removed a bug that hid event/ticket-type assignment entirely for membership-type discounts; added event + ticket-type filters to the list view.
- New `AdminMembershipDiscountsPage.jsx`: a dedicated admin page for membership-tier discounts (tier dropdown, stacking toggle exposed for the first time).
- `AdminVouchersPage.jsx` rebuilt: added the scope picker (previously had **zero** event-assignment UI despite the model supporting it), `assignedEmail`, a bulk-generate form, and CSV export.
- Found and fixed a related pre-existing bug: the admin catalog service was missing several fields (`eligibleMembershipTypes`, `allowStacking`, `assignedEmail`, `referrerEmail`, etc.) from its API responses, which had been silently breaking editing for personalized/referral codes.

### Phase C — Checkout flow
- `TicketBookingPage.jsx`: discount/voucher code entry moved from a single cart-wide field in the Review step to one real-time-validated input **per ticket-type row** in Select Tickets, with a green/red indicator and an automatic membership-discount badge per ticket type.
- `BookingPricePreview.jsx`: added a per-ticket-type price breakdown section.
- The real order-creation path (`checkoutBundleService.js`) was updated so the final charge always matches what the customer saw in the live preview — verified with a real test order end-to-end.

### Two pre-existing bugs found and fixed while tracing the checkout flow
- A broken re-export chain (introduced earlier in the audit's cleanup phase) had been **silently breaking the real ticket-booking price-preview endpoint** since that point — every call to it would have thrown. Found, fixed, and a full sweep of all 349 dynamic imports in the server confirmed no other instances.
- A dead payment-confirmation code path pointed at a deleted module. Confirmed unreachable from any real UI (no customer impact) but repaired anyway since the intent was legitimate.

### UI redesign (same commit)
Following a design review, the original picker (checkboxes + per-event cards) was simplified to two compact dropdowns — **"Select Events"** and **"Select Ticket Type"** — backed by a new reusable `MultiSelectDropdown.jsx` component (single-line field that expands into a checklist). This is now used consistently across:
- Discounts admin
- Membership Discounts admin
- Vouchers admin (both single-create and bulk-generate forms)
- The event editor's ticket-type rows, which gained a new "Add Discount" quick-create action pre-filled to that event + ticket type

A nested-`<form>`-inside-`<form>` bug introduced during this redesign (invalid HTML, risked submit-event bleed-through into the page's main save form) was caught during verification and fixed before commit.

---

## Verification performed

- Full backend vitest suite: 81 tests passing throughout both phases.
- Full client production build (`vite build`) clean after every change.
- Real HTTP requests and a real free-order creation against the live dev server and database, using disposable test fixtures created and deleted for each check.
- Real-browser (Playwright) passes through the actual admin pages and the actual customer-facing ticket booking page, confirming discount validation, price updates, and the new picker UI all work end-to-end with zero console errors.

## Not covered by this document

A separate conversation reviewed which environment variables this server needs for a Render deployment, and cross-checked the values currently in the local `.env` against what should be set in Render — no code or configuration was changed as part of that review.
