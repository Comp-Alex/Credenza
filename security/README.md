# Frontend Security Notes

- Keep access and refresh JWTs in `HttpOnly`, `SameSite=Lax` cookies scoped to `/api`; production cookies are `Secure`. Refresh tokens rotate per session family and the database stores only SHA-256 token hashes. The React app does not read or store JWTs.
- Bootstrap a CSRF token from `/api/security/csrf`; keep it in memory and send it as `X-CSRF-Token` for mutations.
- Render user text as normal React text. Do not use `dangerouslySetInnerHTML` for profile or contact content.
- Validate lengths, email, and HTTP(S) URLs in the UI for usability, then repeat all validation and authorization on the backend.
- Use HTTPS in production, credentialed CORS with explicit `CLIENT_ORIGINS`, and server-side rate limits for authentication and contact submissions.
- Grant administrator roles only through a trusted operations process. There is no public role-escalation endpoint.
- Contact messages are stored and audited. Email delivery is not configured yet.