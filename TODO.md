# TODO: Production Configuration Fixes

## Goals
- [x] 1. Fix webinar media path so production webinars load (server/index.ts)
- [x] 2. Fix Dockerfile to copy webinar media (`dist/webinars`) and publications (`output/pdf`) into the runtime image
- [x] 3. Fix `.dockerignore` so production-required assets (webinars, publications) are not excluded from the build context
- [x] 4. Verify production build (`npm run build`) succeeds cleanly
- [x] 5. Verify compiled API output (`server-dist`) contains the corrected webinar path
- [x] 6. Verify production runtime (start built server, confirm `/api/health` and client serving)
- [x] 7. Update deployment docs / `.env.production.example` if needed

## Status Notes
- **Webinar path fix (server/index.ts):** Resolves to `public/webinars` (dev) / `dist/webinars` (prod). ✅
- **Webinar files verified:** 12 files in `dist/webinars/series-1/` (6 MP4 + 6 scripts). ✅
- **Member publications verified:** 10 PDFs in `output/pdf/`. ✅
- **Compiled API verified:** `server-dist/index.js` contains the corrected `dist` path. ✅
- **Dockerfile updated:** Copies `output/` (publications) and `dist/webinars` (webinar media) into the runtime image. ✅
- **`.dockerignore` verified:** `output` and `dist` are NOT excluded — production assets reach the build context. ✅
- **Production runtime verified:** Built server serves `index.html` (HTTP 200) and `/api/health` returns `{"status":"ok","database":"connected"}`. ✅
- **`.env.production.example` verified:** Contains all required production variables (NODE_ENV, DOMAIN, API_PORT, MYSQL_*, JWT_SECRET, ADMIN_*, STRIPE_*, OPENAI_*). ✅

## Production deployment checklist (for clean machine)
1. Clone repo, install Node.js 22 LTS and Docker.
2. Copy `.env.production.example` → `.env.production`; set EVERY placeholder to a unique production value; replace `portal.example.com` with the real domain; generate a unique JWT secret with `openssl rand -base64 48`.
3. Run `docker compose -f docker-compose.production.yml up -d --build`.
4. Create admin once: `docker compose -f docker-compose.production.yml run --rm app npm run db:create-admin:prod`.
5. Confirm `https://YOUR_DOMAIN/api/health` returns `status: ok`.
6. Test login, uploads, realtime updates, and a Stripe test/live checkout as appropriate.
