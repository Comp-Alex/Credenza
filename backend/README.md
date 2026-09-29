# Credenza API

Express 5 REST API using PostgreSQL and Knex migrations. Requires Node.js 22.12+ and PostgreSQL 16+.

## Local setup

1. Start PostgreSQL from the repository root with `docker compose up -d db`. The Compose password is development-only; never use it in production.
2. From `backend/`, copy `.env.example` to `.env`; replace both JWT secrets with separate random values of at least 32 characters.
3. Install dependencies with `npm ci`.
4. Apply the schema and starter templates with `npm run migrate` and `npm run seed`.
5. Start the API with `npm run dev`; check `http://localhost:4000/health`.

The Vite dev server proxies `/api` to port 4000. In production, terminate TLS at a trusted reverse proxy, set `CLIENT_ORIGINS`, and set `DATABASE_URL` and both JWT secrets in the deployment secret store. The server requires HTTPS in production and marks auth cookies `Secure`.

## Vercel

This Express app also exports a default app from `src/app.js`, which Vercel detects when this folder is configured as the project's Root Directory. Use a managed PostgreSQL connection pooler and set `DATABASE_POOL_MAX=3` for serverless instances. Run migrations from CI or a trusted local environment before deployment; do not run them during function startup. Configure the frontend's exact origin in `CLIENT_ORIGINS` and use sibling custom domains for the frontend and API so `SameSite=Lax` cookies remain same-site.

## API surface

- `GET /api/security/csrf`, `GET /api/auth/session`
- `POST /api/register`, `POST /api/login`, `POST /api/logout`
- `GET /api/templates`, `POST /api/user/template`
- `GET /api/projects/:userId`, `POST /api/projects`, `PUT|DELETE /api/projects/:id`
- `GET /api/skills/:userId`, `POST /api/skills`, `PUT|DELETE /api/skills/:id`
- `PUT /api/profile`, `POST /api/contact`
- `GET /api/admin/audit-logs` (admin only)

Registration creates a user-role account; never accept a role from the registration body. Grant the first admin role through a trusted database operations process, not a public API. Portfolio reads by UUID are public; mutations are scoped to the authenticated owner. Contact submissions are validated, rate-limited, audited, and stored in `contact_messages`; configure a delivery provider separately before promising email delivery.

## Security

- Access JWTs expire after 15 minutes; refresh JWTs rotate, are scoped to a session family, and are stored only as SHA-256 hashes in the database.
- JWTs use `HttpOnly`, `SameSite=Lax` cookies, `Secure` in production, and `/api` path scope. No bearer token is returned to browser JavaScript.
- State-changing methods require a signed double-submit CSRF cookie/header pair and an allowed origin.
- Passwords use bcrypt cost 12 and are limited to bcrypt's 72-byte input; account validation, auth rate limiting, ownership checks, parameterized Knex queries, Helmet, and audit logs are enabled.
- Inputs are length/type/URL validated. UI text is rendered as text; server output must still be encoded by any future HTML renderer.

`npm test` runs the database-independent CSRF tests. `npm run lint` checks the API source.