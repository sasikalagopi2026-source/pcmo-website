# PCMO Production Setup Guide

This document is the authoritative go-live checklist. It complements `DEPLOYMENT.md` and
`README.md` and gives the external team everything needed to stand up a working production
environment.

---

## 1. Prerequisites (server)

- A **Linux server** (Ubuntu 22.04+ recommended) with:
  - Docker Engine
  - Docker Compose plugin (`docker compose` v2)
  - Git
- **DNS**: `A` / `AAAA` records for your chosen `DOMAIN` pointing to the server IP.
- **Firewall**: allow **only** ports `80` and `443` inbound. **Do not open** MySQL port `3306`.

---

## 2. Create `.env.production`

Copy the example and fill EVERY value with a unique, real secret. The server validates
these at startup (see `server/config.ts`). Missing required values cause the app to fail
fast with a clear error.

```bash
cp .env.production.example .env.production
```

### Required variables

| Variable | How to set | Notes |
|----------|-----------|-------|
| `NODE_ENV` | `production` | |
| `DOMAIN` | your real domain, e.g. `app.example.com` | Used by Caddy for TLS |
| `API_HOST` | `0.0.0.0` | Set already in compose |
| `API_PORT` | `3001` | |
| `MYSQL_HOST` | `mysql` | Set already in compose |
| `MYSQL_PORT` | `3306` | |
| `MYSQL_USER` | `pcmo` (or unique) | Required |
| `MYSQL_PASSWORD` | long random string | **Required** |
| `MYSQL_ROOT_PASSWORD` | long random string | For mysql container + healthcheck |
| `MYSQL_DATABASE` | `pcmo` | Required |
| `JWT_SECRET` | `openssl rand -base64 48` | **Required** |
| `ADMIN_EMAIL` | real inbox | For `db:create-admin:prod` |
| `ADMIN_PASSWORD` | strong password | For `db:create-admin:prod` |
| `ADMIN_DISPLAY_NAME` | e.g. `PCMO Administrator` | |
| `CLIENT_ORIGIN` | `https://app.example.com` | Leave `VITE_API_URL` empty (one-origin) |
| `CLIENT_URL` | `https://app.example.com` | |

### Optional but recommended

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Live Stripe key (use test key first) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint |
| `OPENAI_API_KEY` | AI assistant / community AI replies |
| `OPENAI_MODEL` | default `gpt-5.6-luna` |
| `OPENAI_AUTO_REPLY_ENABLED` | `true`/`false` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM` | Transactional email delivery (see ┬º2A below) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `WHATSAPP_FROM` | WhatsApp notifications |
| `ACTIVITY_NOTIFICATION_EMAIL` | Recipient for contact/activity emails |

> **Transactional email is required in production.** Without a working SMTP transport, the
> welcome, purchase, newsletter, OTP, certificate, event, and notification emails are simply
> logged as `not_configured` in the `email_logs` table and never delivered.

### 2A. Transactional email (Mailgun recommended)

The app sends all transactional email through Nodemailer using standard SMTP. Mailgun is the
recommended provider and matches the existing implementation.

1. Create a **Mailgun** account and add + verify a sending domain (e.g. `mg.petrocontracts.com`).
2. Open **Mailgun ÔåÆ Sending ÔåÆ SMTP** and copy the SMTP credentials.
3. Set these variables in `.env.production`:

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mg.YOUR_DOMAIN.com   # Mailgun SMTP username
SMTP_PASS=the-mailgun-smtp-password        # NOT your mailbox password
EMAIL_FROM=PCMO <no-reply@mg.YOUR_DOMAIN.com>  # must use the verified domain
ACTIVITY_NOTIFICATION_EMAIL=admin@example.com
```

> **Important:** Mailgun SMTP does **not** accept your normal mailbox password. Use the SMTP
> password from the Mailgun dashboard (or use username `api` + your `key-...` API key).
> The `EMAIL_FROM` domain must be the **verified** Mailgun domain, otherwise senders are
> rejected.

**Verifying delivery:** every send is recorded in the `email_logs` table. Admin users can
inspect status (`queued`/`sent`/`failed`/`suppressed`) and retry failed emails from
**Admin ÔåÆ Emails**. You can also watch the API logs for the delivery result.

> **Security rule:** Never commit `.env` or `.env.production`. Both are already in `.gitignore`.

---

## 3. Deploy (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/sasikalagopi2026-source/pcmo-website.git /app/pcmo
cd /app/pcmo

# 2. Create and fill .env.production (section 2)

# 3. Build and start (migration container applies schema before app starts)
docker compose -f docker-compose.production.yml up -d --build

# 4. Create the initial administrator ONCE
docker compose -f docker-compose.production.yml run --rm app npm run db:create-admin:prod

# 5. Verify health
curl https://YOUR_DOMAIN/api/health
# expect: {"status":"ok","database":"connected"}
```

Caddy automatically obtains and renews TLS certificates once DNS + ports 80/443 are correct.
It exposes only HTTP/HTTPS; MySQL stays on Docker's internal network.

---

## 4. Post-deploy verification

- [ ] `/api/health` returns `status: ok`
- [ ] Admin login works with the account from step 3
- [ ] File uploads work (courses, library, profile)
- [ ] Realtime updates work (Socket.IO)
- [ ] Webinars stream from `/api/webinars/series-1/...`
- [ ] Member publications download from `output/pdf/`
- [ ] Stripe **test** checkout completes, then switch to live keys

---

## 5. Stripe webhook

In the Stripe dashboard create a webhook:

- URL: `https://YOUR_DOMAIN/api/stripe/webhook`
- Event: `checkout.session.completed`
- Put the generated signing secret in `STRIPE_WEBHOOK_SECRET`.
- Use test mode first, then switch both Stripe values to live together.

---

## 6. Backups & security (before/after launch)

- [ ] Create a **daily encrypted backup** of BOTH Docker volumes:
  - `pcmo_mysql_data`
  - `pcmo_uploads`
- [ ] Store backups on a **different server** (off-site).
- [ ] **Test restoring** a backup before launch.
- [ ] Rotate any secret that was ever committed or shared insecurely.
- [ ] Keep firewall closed except ports 80/443.

---

## 7. Clean-environment build verification

Run this on a clean PC/server to confirm the repo builds and runs by itself:

```bash
git clone https://github.com/sasikalagopi2026-source/pcmo-website.git
cd pcmo-website
npm ci
npm run typecheck:api
npm run build          # compiles Vite client (dist/) + TS API (server-dist/)
npm start              # runs built server: node server-dist/index.js
```

Then open `http://localhost:3001`. The built app should serve the SPA and API from one origin.

---

## 8. What the code already handles

- Webinar media path (production: `dist/webinars`, dev: `public/webinars`).
- Publications copied into the Docker runtime image (`output/pdf`).
- Dev `NODE_ENV` isolation so the dev server never inherits a production `NODE_ENV`.
- `.dockerignore` excludes logs but keeps needed build assets.
- Corrupted characters in the newsletter widget fixed.
