# PCMO deployment guide

## Local demonstration

1. Install Node.js 22 LTS and Docker Desktop.
2. Copy `.env.example` to `.env`, then replace the JWT secret, database passwords, and admin password. Do not use the example values.
3. Start MySQL only: `docker compose up -d mysql`.
4. Run `npm ci`, `npm run db:migrate`, and `npm run db:create-admin`.
5. Start the site: `npm run dev:all`, then open `http://localhost:8080`.
6. Before an internal demo, run `npm run check`.

The local frontend proxies API calls to port 3001. Production serves the built frontend and API from one origin, so leave `VITE_API_URL` empty unless the frontend is deliberately hosted on a different domain.

## Live server prerequisites

- A Linux server with Docker Engine and Docker Compose plugin.
- DNS `A`/`AAAA` records for the chosen `DOMAIN` already pointing to the server.
- Inbound firewall rules for ports 80 and 443 only. Do **not** open MySQL port 3306.
- Stripe live account, webhook secret, and a tested recovery destination for backups if payments are enabled.

## First production deployment

1. Copy this repository to the server.
2. Copy `.env.production.example` to `.env.production`; set every placeholder to a unique production value and replace `portal.example.com` with the real domain.
3. Generate a JWT secret with `openssl rand -base64 48` and store it only in `.env.production` or your secret manager.
4. Build and start: `docker compose -f docker-compose.production.yml up -d --build`.
5. Create the initial administrator once: `docker compose -f docker-compose.production.yml run --rm app npm run db:create-admin:prod`.
6. Confirm `https://YOUR_DOMAIN/api/health` returns `status: ok`, then test login, an upload, realtime updates, and a full Stripe test/live checkout as appropriate.

Caddy obtains and renews TLS certificates automatically once DNS and ports 80/443 are correct. It exposes only HTTPS/HTTP; MySQL remains on Docker's internal network. The API process, uploads, MySQL data, and certificates all use persistent Docker volumes.

## Stripe and notifications

In Stripe, create a webhook at `https://YOUR_DOMAIN/api/stripe/webhook` and subscribe to `checkout.session.completed`. Put the generated signing secret in `STRIPE_WEBHOOK_SECRET`. Use Stripe test mode first, then switch both Stripe values to live values together.

Email and WhatsApp delivery are not implemented by this application; those choices currently create in-app notifications and log a server message. Configure a provider and credentials before promising external email or WhatsApp delivery to members.

## Backups and updates

Create a daily encrypted backup job for both the `pcmo_mysql_data` and `pcmo_uploads` volumes, and copy backups to storage outside the server. Test restoring them before launch. After code updates, run `docker compose -f docker-compose.production.yml up -d --build`; the migration container applies the schema before the app starts.

Never commit `.env`, `.env.production`, database dumps, or uploaded member files. Rotate any secret that was ever committed or shared insecurely.
