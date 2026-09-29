# Credenza

**Showcase Your Skills. Build Your Future.**

Credenza is a portfolio platform for students, graduates, and early-career professionals. It helps people present their skills, projects, and experience in a polished, credible portfolio. Inspired by the Italian *credenza* (a sideboard or cabinet), Credenza is built around the idea of presenting your credentials with care and helping bridge education and industry.

## Features

- **Authentication:** Sign up and sign in with bcrypt-hashed passwords and JWTs in HttpOnly cookies.
- **Portfolio templates:** Switch between Canvas and Index layouts.
- **Editable content:** Manage a bio, projects, skills, and portfolio template from the dashboard.
- **Responsive interface:** Layouts and navigation adapt to mobile, tablet, and desktop.
- **Security:** CSRF and origin checks, input validation, ownership and role checks, parameterized SQL queries, rate limits, and production HTTPS enforcement.
- **Audit logging:** Record authentication events, portfolio edits, contact submissions, and template changes.
- **Contact form:** Validate, rate-limit, audit, and store messages in PostgreSQL.

## Tech Stack

- **Frontend:** React 19, Vite, JavaScript, CSS Grid and Flexbox.
- **Backend:** Node.js 22.12+ and Express 5.
- **Database:** PostgreSQL 16+.
- **ORM/query layer:** Knex.js migrations and parameterized queries.
- **Authentication:** bcrypt, short-lived access JWTs, rotating refresh JWTs, and HttpOnly cookies.
- **Deployment:** Vercel-ready frontend and Express entry point; managed PostgreSQL and production environment variables are configured separately.

## Project Structure

```text
Credenza/
├── apis/                  # REST API contract
├── backend/               # Express application and backend setup guide
│   └── src/
│       ├── config/        # Environment configuration
│       ├── db/            # Knex connection
│       ├── middleware/    # Auth, CSRF, validation, and errors
│       ├── routes/        # Auth, portfolio, contact, and admin routes
│       ├── services/      # Database-backed application services
│       └── utils/         # Cookies, tokens, audit, and errors
├── db/
│   ├── migrations/        # PostgreSQL schema migrations
│   └── seeds/             # Starter template records
├── frontend/
│   └── src/
│       ├── api/           # Credentialed API client
│       ├── components/    # Auth, dashboard, templates, and portfolio blocks
│       └── utils/         # Frontend validation helpers
├── security/              # Security notes
└── docker-compose.yml     # Local PostgreSQL service
```

## Requirements

- Node.js 22.12 or newer and npm.
- Docker Desktop with Compose, or a PostgreSQL 16+ server.

## Local Setup

From the repository root, start PostgreSQL:

```powershell
docker compose up -d db
```

Configure and start the backend:

```powershell
Set-Location backend
Copy-Item .env.example .env
```

Edit `backend/.env` and replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with different, randomly generated secrets of at least 32 characters. The database password in the Compose file is for local development only.

```powershell
npm ci
npm run migrate
npm run seed
npm run dev
```

The API listens on `http://localhost:4000`; check `http://localhost:4000/health`.

In a second terminal, start the React app:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the backend on port 4000.

## Validation

Backend checks:

```powershell
Set-Location backend
npm test
npm run lint
```

Frontend checks:

```powershell
Set-Location frontend
npm run lint
npm run build
```

## API and Security

The API routes and request/response shapes are documented in [apis/README.md](apis/README.md). Backend configuration and endpoints are described in [backend/README.md](backend/README.md); security controls are summarized in [security/README.md](security/README.md).

Auth cookies are HttpOnly; the React app never reads JWTs. Mutating API requests require a signed CSRF token. The backend validates and authorizes all input independently of frontend checks. Contact messages are stored in the database; email delivery is not configured yet.

## Deploying to Vercel

Use two Vercel projects from the same Git repository:

1. **Frontend project:** Set the Root Directory to `frontend`. Vercel detects Vite; the build command is `npm run build` and the output directory is `dist`.
2. **API project:** Set the Root Directory to `backend`. Vercel detects the Express app exported from `src/app.js` and deploys it as a Node.js function.
3. **Database:** Provision managed PostgreSQL 16+ (for example, through a Vercel Marketplace integration). Use its pooled connection string and place the database in a region close to the API project.
4. **Domains:** Assign the frontend a domain such as `credenza.example` and the API a sibling subdomain such as `api.credenza.example`. Keeping them under the same registrable domain lets the API's `SameSite=Lax` HttpOnly cookies work for credentialed browser requests. Avoid relying on separate default `*.vercel.app` domains for authentication cookies.
5. **Frontend environment:** Set `VITE_API_BASE_URL` to `https://api.credenza.example/api` in the Vercel frontend project's Production and Preview environments as appropriate. Vite embeds `VITE_` values at build time; redeploy after changing them.
6. **API environment:** Set `NODE_ENV=production`, `DATABASE_URL`, `DATABASE_POOL_MAX=3`, `CLIENT_ORIGINS=https://credenza.example`, and separate high-entropy `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values in the Vercel API project's environment settings. Add every allowed frontend origin explicitly.
7. **Migrations:** Run `npm run migrate` and `npm run seed` from a trusted local/CI environment with the production database URL before deploying the API. Do not run migrations on every serverless function startup.

The local API uses a larger Knex pool; the production pool defaults to three connections per warm function instance to reduce connection pressure. Confirm the database provider's pooler limits before increasing it. Contact submissions are stored in PostgreSQL but are not emailed until a delivery provider is configured.

Vercel references: [Vite](https://vercel.com/docs/frameworks/frontend/vite) and [Express](https://vercel.com/docs/frameworks/backend/express).
