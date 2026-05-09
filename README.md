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

### What you (the user) need to do

#### 1. Create a Stripe account (test mode)

1. Sign up at <https://dashboard.stripe.com/register>.
2. After login, make sure the dashboard shows **Test mode** (top-right toggle).
3. Go to **Developers -> API keys** (<https://dashboard.stripe.com/test/apikeys>) and copy:
   - **Publishable key** -> starts with `pk_test_...`
   - **Secret key** -> starts with `sk_test_...` (click "Reveal")

#### 2. Create email credentials (for confirmation emails)

Pick one. Gmail is the fastest for testing; SendGrid/Mailgun are recommended once you go live.

**Option A - Gmail (easiest)**

1. Enable 2-factor auth on the Gmail account you want to send from.
2. Go to <https://myaccount.google.com/apppasswords> and generate a new App Password (any name).
3. Use the 16-character password as `EMAIL_PASS` in `server/.env`.

**Option B - SendGrid (recommended for production)**

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
   EMAIL_FROM="Stichting The V.O.I.C.E. NL <verified_sender@yourdomain.org>"
   ```

#### 3. Fill in your `.env` files

`server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...     # optional for local dev (see step 5)
PAYMENT_CURRENCY=eur

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Stichting The V.O.I.C.E. NL <your_email@gmail.com>"
ORG_NOTIFY_EMAIL=info@thevoice.nl   # optional internal alerts
```

`client/.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_WHATSAPP_E164=31619032104
```

Restart `npm run dev` after changing any env file.

#### 4. Test the flow

1. Open <http://localhost:5173/sponsorship>.
2. Click **Become A Sponsor** on any tier - the payment block appears below the cards and the page scrolls to it.
3. Fill in the sponsor details, click **Continue to payment**.
4. In the Stripe Elements payment box, use test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/34`)
   - CVC: any 3 digits (e.g. `123`)
   - Postal code: any (e.g. `1000`)
5. Click **Pay ... Securely**. After success the block flips to a thank-you state and an email is sent to the address you typed.

Other useful Stripe test cards: <https://stripe.com/docs/testing#cards>

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

### Deploy to Render (free tier, test mode)

The repo includes a `render.yaml` Blueprint that provisions:

- `voice-nl-api` - Node web service (Frankfurt region, free plan)
- `voice-nl-web` - static site for the Vite build of the React app

Steps:

1. Commit and push everything (incl. `render.yaml`) to the GitHub default branch.
2. Sign up / log in at <https://render.com> (free tier).
3. Click **New -> Blueprint** and connect the GitHub repo. Render reads `render.yaml` and proposes both services - click **Apply**.
4. The first build of the API will succeed but the static build will fail (Vite needs the publishable key). Open each service in the Render dashboard and fill in the env vars marked `sync: false`:
   - **voice-nl-api**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (optional), `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `ORG_NOTIFY_EMAIL` (optional), `CLIENT_URL` (paste the static-site URL Render assigned).
   - **voice-nl-web**: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL` (paste the API service URL Render assigned).
5. Trigger **Manual Deploy -> Clear build cache & deploy** on each service so Vite re-bakes the new env values into the static bundle.
6. (Optional) Add a Stripe webhook in the test-mode dashboard pointing to `https://<api-service>.onrender.com/api/payments/webhook`, copy its `whsec_...`, paste into `STRIPE_WEBHOOK_SECRET`, redeploy the API.
7. Open the static-site URL, run a test charge (`4242 4242 4242 4242`), confirm the email arrives.

Free tier caveat: the API spins down after ~15 min of inactivity; first request after sleep takes ~30 s. Use UptimeRobot ping `/api/health` every 14 min to keep it warm, or upgrade to the Starter plan ($7/mo) when ready.

### Going live (real money)

Once you are happy with test mode:

1. Activate your Stripe account (banking details, business info) at <https://dashboard.stripe.com/account/onboarding>.
2. Switch the dashboard toggle to **Live mode** and copy your live keys (`pk_live_...`, `sk_live_...`).
3. Replace the test keys in your **production** environment variables (do **not** put live keys in git).
4. Add a webhook endpoint in **Developers -> Webhooks -> Add endpoint** pointing to `https://your-domain.com/api/payments/webhook`, listening for `payment_intent.succeeded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Redeploy. Real cards will now be charged.

### Architecture notes

- `server/src/controllers/paymentController.js` creates a `PaymentIntent` per checkout, stores sponsor details in PaymentIntent metadata, sends emails via `services/mailer.js`, and de-duplicates emails between webhook and client-confirm fallback.
- `server/src/config/sponsorshipTiers.js` is the source of truth for prices (server-side validated). Update both this file and the `tiers` array in `client/src/components/sponsorship/SponsorshipTiersSection.jsx` if you change pricing.
- The Stripe webhook handler is mounted with `express.raw()` **before** `express.json()` so signature verification works.
