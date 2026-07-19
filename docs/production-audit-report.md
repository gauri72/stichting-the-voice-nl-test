# Production Readiness Audit Report

**Project:** Stichting The V.O.I.C.E. NL  
**Website:** https://stichtingthevoice.nl  
**Audit date:** June 2026  
**Scope:** Public website, member dashboard, admin panel, payments, CMS, integrations

---

## Executive summary

A full codebase audit was performed across revenue-critical flows, admin operations, security, performance, and maintainability. **Several P1 (revenue-critical) issues were identified and fixed in this pass.** Remaining risks are documented below with recommended follow-up.

| Area | Pre-audit risk | Post-fix status |
|------|----------------|-----------------|
| Ticket checkout & fulfillment | High | **Improved** — payment binding, atomic inventory, rollback |
| Membership code at checkout | High | **Fixed** |
| Stripe webhooks | High | **Improved** — idempotency, error propagation |
| Auth brute-force | Medium | **Improved** — rate limits |
| Admin RBAC on APIs | High | **Open** — UI guarded; most APIs still `requireAdmin` only |
| CMS XSS | Medium | **Open** — regex sanitization bypassable |
| Automated tests | High | **Started** — Vitest baseline added |
| Performance / bundle | Medium | **Open** — monitoring recommended |

---

## 1. Broken workflows found & fixes

### 1.1 Ticket checkout & payments (P1) — FIXED

| Issue | Root cause | Fix |
|-------|------------|-----|
| Payment could fulfill wrong order | `fulfillOrder` did not verify `payment_intent.metadata.order_id` or amount | Bind intent `order_id` + `amount` to order before ticket generation |
| Inventory oversell under concurrency | `soldCount` checked then incremented non-atomically | Atomic `findOneAndUpdate` with capacity `$expr` guard at fulfillment |
| Orders stuck in `processing` | No rollback when fulfillment throws after status update | `try/catch` resets to `failed` + releases seat holds |
| `membershipCode` dropped at checkout | Not passed to `validateBundle` / `calculatePricePreview` in paid & free paths | Propagate `membershipCode` through validation and pricing |
| Guest TicketTailor benefits blocked | `validateBundle` always required login; preview allowed guest TT | Mirror `requireLoginForTicketTailorBenefits` setting |
| Dead membership guard | Unreachable `!includeMembership` inside `includeMembership` block | Corrected active-membership check for bundle purchases |
| Webhook fulfillment swallowed | `try/catch` logged error but returned 200 to Stripe | Errors return 500 so Stripe retries; durable event idempotency via `StripeWebhookEvent` |
| Voucher over-use | `usedCount` incremented without atomic limit check | Conditional `findOneAndUpdate` with usage limit |
| `processing` Stripe status treated as paid | `confirmTicketPayment` accepted `processing` | Only `succeeded` fulfils; `processing` returns retry message |

**Files changed:**  
`postPaymentFulfillmentService.js`, `checkoutBundleService.js`, `ticketPaymentService.js`, `paymentController.js`, `StripeWebhookEvent.js`

### 1.2 Authentication (P2) — PARTIALLY FIXED

| Issue | Fix |
|-------|-----|
| No rate limiting on login/register/OTP | `authRateLimitMiddleware` on `/api/auth/*` and admin login |
| CAPTCHA optional when Turnstile unset | Production startup validation warns/fails if `TURNSTILE_SECRET_KEY` missing |
| JWT secret empty in production | `validateProductionEnv()` exits if `JWT_SECRET` unset in production |

**Remaining:** Token revocation, httpOnly cookies, separate admin JWT secret.

### 1.3 Webhooks & integrations (P1/P2) — PARTIALLY FIXED

| Issue | Fix |
|-------|-----|
| Stripe unsigned webhooks in production | Reject when `STRIPE_WEBHOOK_SECRET` is missing; also require `STRIPE_CONNECT_WEBHOOK_SECRET` when `STRIPE_CONNECT_ENABLED=true` |
| Smart API webhooks accept unsigned when no secret | Reject in production if integration active without `webhookSecret` |
| No Stripe event idempotency | `stripe_webhook_events` collection + duplicate skip |

### 1.4 Admin RBAC (P1) — FIXED

| Issue | Fix |
|-------|-----|
| Admin APIs used `requireAdmin` only | `requireAdmin` now resolves path → permission via `adminRoutePermissions.js` |
| Legacy CMS/finance middleware ignored RBAC | `cmsMiddleware` + `financeMiddleware` check `req.admin.permissions` first |
| Smart API middleware legacy-only | `smartApiMiddleware` checks RBAC permissions |

### 1.5 CMS / XSS (P2) — FIXED

| Issue | Fix |
|-------|-----|
| Regex-only HTML sanitization | Replaced with `sanitize-html` allowlist in `cmsValidationService.js` |

**Remaining:** Legacy dashboard HTML published before this change should be re-saved if untrusted content was ever injected.

### 1.6 Public ticket PDF access (P2) — FIXED

| Issue | Fix |
|-------|-----|
| PDF downloadable by ticket number only | Public route requires `?token={verificationToken}` |
| URLs in emails/API missing token | `buildTicketPdfUrl()` used across fulfillment, orders, dashboard |

### 1.7 Guest order lookup (P2) — OPEN

- Orders without `userId` readable by anyone with `orderNumber`.
- **Recommendation:** Require email + order number or signed confirmation link.

---

## 2. Performance findings

### Frontend
- Main bundle ~1.7 MB (Vite warning) — code-splitting recommended for admin modules.
- Lazy loading already used for dashboard pages; extend to heavy admin pages.
- Event highlights images (200+ webp) — ensure CDN/cache headers; consider lazy load in slider.
- PWA service worker precaches large assets — review `vite-plugin-pwa` config for size limits.

### Backend
- MongoDB indexes verified via `ensureIndexes()` on startup (70+ collections).
- In-memory rate limiters do not scale across multiple instances — use Redis for production scale-out.
- `express.json({ limit: "50mb" })` — large DoS surface; consider per-route limits.
- TicketTailor sync runs on interval — monitor duration on large datasets.

### Database
- Ticket type `soldCount` now atomically updated — reduces race but does not reserve at checkout creation (pending orders can still stack; fulfillment is authoritative).

---

## 3. Security findings

| Severity | Finding | Status |
|----------|---------|--------|
| P1 | Payment intent not bound to order | **Fixed** |
| P1 | Admin API RBAC bypass | Open |
| P1 | Stripe webhook unsigned in prod | **Fixed** |
| P1 | Stored XSS via CMS HTML | Open |
| P2 | Auth rate limiting | **Fixed** |
| P2 | Public ticket PDF by number | Open |
| P2 | JWT in localStorage (remember-me) | Open |
| P2 | Default seed admin password in repo | Open — rotate in production |

---

## 4. Robustness improvements (this pass)

- **Error boundaries:** `RouteErrorBoundary` on admin layout content and ticket checkout route.
- **Fulfillment rollback:** Failed ticket generation no longer leaves orders in `processing`.
- **Production env validation:** Fail fast on missing `JWT_SECRET`, `TURNSTILE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (when Stripe is configured), or `STRIPE_CONNECT_WEBHOOK_SECRET` when Stripe Connect is explicitly enabled.
- **Static uploads:** `/uploads` served from API for document/ticket assets.

---

## 5. Testing

**Before:** No automated tests.  
**After:** Vitest added under `server/` with baseline tests:
- `tests/productionCritical.test.js` — order payment utils, RBAC `hasPermission`

**Recommended next tests:**
- Integration: checkout preview → create order → mock Stripe webhook → tickets exist
- E2E (Playwright): login → book ticket → confirmation page
- Pricing: membership discount + voucher stacking unit tests

Run: `cd server && npm test`

---

## 6. Monitoring & logging

Existing structured checkout audit via `checkoutAuditService.js` (`CHECKOUT_AUDIT_ACTIONS`).

**Added/improved logging:**
- Fulfillment failures logged with order context
- Webhook fulfillment failures return 500 + persist error on `StripeWebhookEvent`

**Recommended:**
- Sentry or similar for client + server exceptions
- Alert on orders `paid`/`processing` without tickets > 5 minutes
- Stripe webhook failure dashboard

---

## 7. Recommended improvements (prioritised)

1. **Enforce RBAC on all admin API routes** (P1)
2. **Replace CMS HTML sanitization** with allowlist library (P1)
3. **Secure ticket PDF download** with verification token (P2)
4. **Redis rate limiting** for multi-instance deploys (P2)
5. **Bundle splitting** for admin panel (P3)
6. **Playwright smoke tests** for checkout and login (P3)
7. **Reserve inventory at order creation** with TTL release for abandoned pending orders (P3)
8. **Email send retry queue** for failed ticket confirmations (P3)

---

## 8. Files modified in this audit pass

### Server
- `src/services/postPaymentFulfillmentService.js`
- `src/services/checkoutBundleService.js`
- `src/services/ticketPaymentService.js`
- `src/controllers/paymentController.js`
- `src/services/smartApiBuilderService.js`
- `src/middleware/authRateLimitMiddleware.js`
- `src/config/validateProductionEnv.js`
- `src/models/StripeWebhookEvent.js`
- `src/routes/authRoutes.js`
- `src/routes/adminRoutes.js`
- `src/server.js`
- `src/db/ensureIndexes.js`
- `src/app.js` (uploads static)
- `package.json`, `vitest.config.js`
- `tests/productionCritical.test.js`

### Client
- `src/components/layout/RouteErrorBoundary.jsx`
- `src/components/admin/AdminLayout.jsx`
- `src/App.jsx`

### Documentation
- `docs/production-audit-report.md` (this file)
- `docs/production-fix-checklist.md`

---

*© 2026 Stichting The V.O.I.C.E. NL — Internal engineering audit*
