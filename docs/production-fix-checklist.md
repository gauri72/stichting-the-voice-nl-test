# Production Fix Checklist

Track production-readiness fixes for Stichting The V.O.I.C.E. NL.

Legend: ✅ Done · 🔄 In progress · ⬜ Todo · ⚠️ Risk accepted

---

## Priority 1 — Revenue-critical

### Ticket checkout & payments
- [x] Bind Stripe PaymentIntent `order_id` + amount to order at fulfillment
- [x] Atomic ticket inventory increment at fulfillment (prevent oversell race)
- [x] Roll back order from `processing` → `failed` on fulfillment error
- [x] Propagate `membershipCode` through checkout validation and pricing (paid + free)
- [x] Align guest TicketTailor benefit rules between preview and checkout
- [x] Fix dead code in membership bundle validation
- [x] Stripe webhook: return 500 on fulfillment failure (enable retries)
- [x] Stripe webhook: durable idempotency (`stripe_webhook_events`)
- [x] Reject unsigned Stripe webhooks in production
- [x] Atomic voucher `usedCount` increment with usage limit guard
- [x] Only accept `succeeded` payment status for fulfillment (not `processing`)
- [ ] Reserve inventory at order creation + TTL release for abandoned pending orders
- [x] Secure ticket PDF download (require verification token)
- [x] Guest order lookup: require email + order number

### Memberships
- [x] Membership code passed at final checkout (not just preview)
- [ ] Membership renewal edge cases — automated test coverage
- [ ] TicketTailor sync failure alerting

### Email / PDF / QR
- [ ] Email send retry queue for failed ticket confirmations
- [ ] DB flag for `confirmationEmailSentAt` (replace in-memory dedup)
- [ ] QR/PDF generation integration tests

---

## Priority 2 — Admin-critical

### RBAC
- [x] Apply `requirePermission()` to all admin APIs via centralized `requireAdmin` resolver
- [x] Unify legacy CMS/finance middleware with `req.admin.permissions`
- [ ] Sync `Admin.role` with `roleSlug` on invite accept

### Admin workflows
- [ ] Admin retry fulfillment for stuck orders (`processing` + no tickets)
- [ ] Audit log for refund and ticket resend actions

### Security
- [x] Auth rate limiting (login, register, OTP, admin login)
- [x] Production env validation (`JWT_SECRET`, Turnstile, Stripe webhook secret)
- [x] Smart API webhooks require secret in production
- [x] Replace CMS regex sanitization with allowlist (`sanitize-html`)
- [x] Sanitize customer dashboard rich text blocks at save time
- [ ] Rotate/remove default seed admin password from `seed-admin.js`
- [ ] Separate JWT secrets for user vs admin tokens

---

## Priority 3 — Public UX

- [x] Error boundary on ticket checkout route
- [x] Error boundary on admin panel content
- [ ] Error boundary on member dashboard
- [ ] Mobile table scroll audit across admin pages
- [ ] CTA link audit (CMS header/footer)
- [ ] Video modal error handling (YouTube embed failures)

---

## Priority 4 — Performance

- [ ] Admin panel code splitting (dynamic imports per route)
- [ ] Image WebP/AVIF audit for hero assets
- [ ] Review PWA precache size (`vite-plugin-pwa`)
- [ ] Redis-backed rate limiting for multi-instance
- [ ] Lower default JSON body limit; raise only on upload routes
- [ ] Profile slow report aggregations

---

## Priority 5 — Robustness & tests

- [x] Vitest baseline (`server/tests/productionCritical.test.js`)
- [ ] Integration test: checkout → webhook → tickets
- [ ] Playwright E2E: login, book ticket, confirmation
- [ ] Unit tests: discount calculation, membership detection
- [ ] Webhook signature verification tests
- [ ] Sentry / error reporting integration
- [ ] Alert: paid orders without tickets after 5 minutes

---

## Deployment verification (run before each release)

- [ ] `cd server && npm test`
- [ ] `cd client && npm run build`
- [ ] Verify `JWT_SECRET`, `STRIPE_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY` set in production; when `STRIPE_CONNECT_ENABLED=true`, also verify `STRIPE_CONNECT_WEBHOOK_SECRET`
- [ ] Smoke test: free ticket checkout
- [ ] Smoke test: paid ticket checkout (Stripe test mode)
- [ ] Smoke test: admin login + create draft event
- [ ] Smoke test: CMS page publish + public render
- [ ] Check Stripe webhook delivery logs after deploy

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Product | | | |
| Finance | | | |
