# PCMO Student and Admin Portals

React/Vite frontend with a Node.js TypeScript API, MySQL persistence, JWT authentication, role-based admin access, generic CRUD endpoints, audit logging, and Socket.IO realtime refresh.

## First-time setup

1. Copy `.env.example` to `.env` and change `JWT_SECRET`, database passwords, and admin credentials.
2. Start MySQL:

```bash
docker compose up -d mysql
```

3. Apply the schema and create the first administrator:

```bash
npm run db:migrate
npm run db:create-admin
```

4. Start the frontend and API:

```bash
npm run dev:all
```

Open `http://localhost:8080/login`.

Students can register from the login page. Administrators sign in using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Main API groups

- `/api/auth/*` — registration, login, current account
- `/api/student/dashboard` — live student dashboard aggregation
- `/api/admin/dashboard` — live admin dashboard aggregation
- `/api/admin/users` — user role and account-status administration
- `/api/resources/:resource` — authenticated paginated CRUD
- `/api/courses/*` — enrollment and quiz workflows
- `/api/events/*` — event registration
- `/api/community/*` — community interactions
- `/api/admin/reminders/*` — recipient lookup and reminder creation

The database definition is [server/schema.sql](server/schema.sql). The server never uses static fallback records: an empty database produces empty-state UI until records are created through the admin console.

## Verification

```bash
npm run typecheck:api
npm run build
```
