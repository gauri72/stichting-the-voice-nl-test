# Stichting The V.O.I.C.E. NL Website (MERN)

Monorepo starter for a MERN website:

- `client` - React + Vite frontend
- `server` - Node.js + Express backend
- `shared` - Shared constants/types/utils

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env files:

   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`

3. Run both apps:

   ```bash
   npm run dev
   ```

## Default Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## Sponsorship Payments (Stripe)

The sponsorship page at `/sponsorship` lets sponsors pick a tier (Associate / Silver / Gold / Platinum) and pay securely below the tier cards. Payment processing uses Stripe Elements; confirmation and thank-you emails are sent via Nodemailer SMTP.

### Stripe: live account (production)

Payments use **live** API keys from your production Stripe account. Test keys (`pk_test_` / `sk_test_`) must not be used in production.

#### 1. Stripe live account setup

1. Log in to the **live** Stripe account you want to charge (not the old test account).
2. Complete account activation if prompted: <https://dashboard.stripe.com/account/onboarding>.
3. Turn **Live mode** on (top-right toggle).
4. Go to **Developers → API keys** (<https://dashboard.stripe.com/apikeys>) and copy:
   - **Publishable key** → `pk_live_...`
   - **Secret key** → `sk_live_...` (click **Reveal**)
5. Add a **live** webhook: **Developers → Webhooks → Add endpoint**
   - URL: `https://<your-api-host>/api/payments/webhook`
   - Event: `payment_intent.succeeded`
   - Copy the **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`

Both keys must come from the **same** Stripe account. The publishable and secret keys must both be live (or both test for local experiments only).

#### 1b. (Optional) Local development with test keys

For local-only testing without real charges, use a separate test account or test keys from **Test mode** in the dashboard (<https://dashboard.stripe.com/test/apikeys>). Do not mix `pk_live_` on the client with `sk_test_` on the server.

#### 2. Create email credentials (for confirmation emails)

Pick one. **SiteGround** is recommended if your domain mailbox is already there; Gmail is fine for quick local tests.

**Option A - SiteGround (recommended for production)**

1. In SiteGround **Site Tools → Email → Accounts**, create or use a mailbox (e.g. `info@stichtingthevoice.nl`).
2. Open **Mail Configuration → Manual settings** and copy the outgoing SMTP host, port (usually **465**), username (full email), and password.
3. In `server/.env` set (use the same address for `EMAIL_USER` and `EMAIL_FROM`):
   ```env
   EMAIL_HOST=mail.stichtingthevoice.nl
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=info@stichtingthevoice.nl
   EMAIL_PASS=<mailbox_password>
   EMAIL_FROM=Stichting The V.O.I.C.E. NL <info@stichtingthevoice.nl>
   CONTACT_EMAIL=info@stichtingthevoice.nl
   ORG_NOTIFY_EMAIL=info@stichtingthevoice.nl
   ```
4. On startup the API logs `[mail] SMTP configured` and verifies the connection.

**Option B - Gmail (easiest for local testing)**

1. Enable 2-factor auth on the Gmail account you want to send from.
2. Go to <https://myaccount.google.com/apppasswords> and generate a new App Password (any name).
3. Use the 16-character password as `EMAIL_PASS` in `server/.env`.

**Option C - SendGrid**

1. Sign up at <https://sendgrid.com/>.
2. Go to **Settings -> API Keys** and create a key with "Mail Send" permission.
3. Verify a sender or domain under **Settings -> Sender Authentication**.
4. In `server/.env` set:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASS=<your_sendgrid_api_key>
   EMAIL_FROM=Stichting The V.O.I.C.E. NL <verified_sender@yourdomain.org>
   ```

#### 3. Fill in your `.env` files

`server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...     # required in production; optional locally with Stripe CLI
PAYMENT_CURRENCY=eur

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Stichting The V.O.I.C.E. NL <your_email@gmail.com>"
ORG_NOTIFY_EMAIL=info@stichtingthevoice.nl   # internal alerts for donations, sponsorships, newsletter
```

`client/.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_WHATSAPP_E164=31619032104
```

Restart `npm run dev` after changing any env file.

#### 4. Verify payments

1. Open <http://localhost:5173/sponsorship> or `/donate`.
2. Complete a checkout with a **real** card (live keys charge real money).
3. Confirm the payment in the Stripe dashboard (**Payments**, live mode) and that confirmation emails arrive.

For test-mode keys only, use Stripe test cards: <https://stripe.com/docs/testing#cards> (e.g. `4242 4242 4242 4242`).

#### 5. (Optional but recommended) Forward webhooks locally

The server already exposes `POST /api/payments/webhook`. To receive webhooks from Stripe locally:

1. Install the Stripe CLI - <https://docs.stripe.com/stripe-cli>.
2. Run:
   ```bash
   stripe login
   stripe listen --forward-to http://localhost:5000/api/payments/webhook
   ```
3. The CLI prints `whsec_...`. Paste that into `STRIPE_WEBHOOK_SECRET` in `server/.env` and restart the server.

Without the webhook the site still works because the React app calls `POST /api/payments/confirm` after a successful payment (and that endpoint sends the email). The webhook is the production-grade path: it fires even if the user closes the browser before redirect.

### Deploy to Render (free tier)

The repo includes a `render.yaml` Blueprint that provisions:

- `voice-nl-api` - Node web service (Frankfurt region, free plan)
- `voice-nl-web` - static site for the Vite build of the React app

Steps:

1. Commit and push everything (incl. `render.yaml`) to the GitHub default branch.
2. Sign up / log in at <https://render.com> (free tier).
3. Click **New -> Blueprint** and connect the GitHub repo. Render reads `render.yaml` and proposes both services - click **Apply**.
4. The first build of the API will succeed but the static build will fail (Vite needs the publishable key). Open each service in the Render dashboard and fill in the env vars marked `sync: false`:
   - **voice-nl-api**: `STRIPE_SECRET_KEY` (`sk_live_...`), `STRIPE_WEBHOOK_SECRET` (live `whsec_...`), `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `ORG_NOTIFY_EMAIL` (optional), `CLIENT_URL` (paste the static-site URL Render assigned).
   - **voice-nl-web**: `VITE_STRIPE_PUBLISHABLE_KEY` (`pk_live_...` from the **same** account), `VITE_API_BASE_URL` (paste the API service URL Render assigned).
5. Trigger **Manual Deploy -> Clear build cache & deploy** on each service so Vite re-bakes the new env values into the static bundle.
6. Add a **live-mode** Stripe webhook pointing to `https://<api-service>.onrender.com/api/payments/webhook`, copy its `whsec_...` into `STRIPE_WEBHOOK_SECRET`, redeploy the API.
7. Open the static-site URL and run a small real charge to confirm emails and receipts.

Free tier caveat: the API spins down after ~15 min of inactivity; first request after sleep takes ~30 s. Use UptimeRobot ping `/api/health` every 14 min to keep it warm, or upgrade to the Starter plan ($7/mo) when ready.

### Architecture notes

- `server/src/controllers/paymentController.js` creates a `PaymentIntent` per checkout, stores sponsor details in PaymentIntent metadata, sends emails via `services/mailer.js`, and de-duplicates emails between webhook and client-confirm fallback.
- `server/src/config/sponsorshipTiers.js` is the source of truth for prices (server-side validated). Update both this file and the `tiers` array in `client/src/components/sponsorship/SponsorshipTiersSection.jsx` if you change pricing.
- The Stripe webhook handler is mounted with `express.raw()` **before** `express.json()` so signature verification works.
