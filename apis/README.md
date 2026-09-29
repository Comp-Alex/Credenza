# Credenza REST API Contract

The React app uses `VITE_API_BASE_URL` (defaults to `/api`). Vite proxies this prefix to the Express server on port 4000 during development.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/security/csrf` | Set the CSRF cookie and return `{ "csrfToken": "..." }` |
| GET | `/api/auth/session` | Return the current `{ "user", "profile" }`, or `401` |
| POST | `/api/register` | Create a user-role account and set auth cookies |
| POST | `/api/login` | Authenticate and set auth cookies |
| POST | `/api/logout` | Revoke the current refresh token and clear auth/CSRF cookies |
| GET | `/api/templates` | List active portfolio templates |
| POST | `/api/user/template` | Assign a template to the authenticated user |
| GET | `/api/projects/:userId` | List a public portfolio's projects |
| POST | `/api/projects` | Create a project for the authenticated user |
| PUT / DELETE | `/api/projects/:id` | Update or delete an owned project |
| GET | `/api/skills/:userId` | List a public portfolio's skills |
| POST | `/api/skills` | Create a skill for the authenticated user |
| PUT / DELETE | `/api/skills/:id` | Update or delete an owned skill |
| PUT | `/api/profile` | Validate and atomically save profile, projects, skills, and template |
| POST | `/api/contact` | Validate, rate-limit, audit, and store a contact message |
| GET | `/api/admin/audit-logs` | List audit events (admin role only) |

All requests include cookies. The client sends the in-memory CSRF token in `X-CSRF-Token` on state-changing requests and refreshes it once after a `403`. The server stores only hashes of rotating refresh JWTs, and never returns bearer tokens to JavaScript.

The session response shape is `{ "user": { "id", "displayName", "email", "role" }, "profile": { "displayName", "headline", "bio", "location", "photoUrl", "template", "projects": [], "skills": [] } }`. Profile updates return `{ "profile": { ... } }`.

Contact submissions are stored in PostgreSQL; no email delivery provider is configured. For cross-origin deployments, allow credentials only from configured `CLIENT_ORIGINS`. Validate authorization, CSRF, rate limits, and every submitted field on the server; client-side checks are for feedback, not a security boundary.