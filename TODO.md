# TODO: Email Notification Subsystem (Mailgun)

## Goals
- [x] 1. Add `email_logs` tracking table to `server/schema.sql`
- [x] 2. Add all 12 email template builders to `server/email.ts`
- [x] 3. Add `sendEmail` service (dedup, logging, retry) to `server/emailService.ts`
- [x] 4. Wire all 12 email triggers to correct events (`server/index.ts`)
- [ ] 5. Add OTP generation + verification endpoint (`/api/auth/otp`)
- [x] 6. Add `GET /api/admin/emails` endpoint + retry endpoint (`POST /api/admin/emails/:id/retry`)
- [x] 7. Admin Dashboard email status view (via `GET /api/admin/emails`)
- [ ] 8. Expand unit tests for all 12 builders + delivery/dedup logic
- [ ] 9. Add `scripts/email_smoke.mjs` end-to-end harness
- [x] 10. Update `.env.production.example` with Mailgun SMTP vars
- [x] 11. Update docs (PRODUCTION_SETUP.md)
- [ ] 12. Build + typecheck + push to GitHub

## Current State (August 2026)
- **Transport:** Nodemailer against Mailgun SMTP (or any SMTP provider).
- **Retry:** 3 attempts (immediate + 2 backoff retries).
- **Dedup:** within a rolling window per (recipient, template, key).
- **Deliverability/status:** recorded in `email_logs` and surfaced via Admin Emails API.
- **ÔÜá´©Å SMTP still needs valid Mailgun credentials.** The `.env` has SMTP config pointing to
  `smtp.mailgun.org` with the provided `sasikala@petrocontracts.com` / `4wG!$6#vcQUnwU#`,
  but Mailgun rejects these with `535 Authentication failed`. You need to:
  1. Verify a sending domain in Mailgun (e.g. `mg.petrocontracts.com`)
  2. Use the **Mailgun SMTP password** (not mailbox password) from Mailgun ÔåÆ Sending ÔåÆ SMTP
  3. Set `EMAIL_FROM` to use the verified domain
- **Admin email monitoring:** Go to `/admin/emails` (or use the API) to view delivery status.
</content>
