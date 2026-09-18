# Pawprint Network

Pawprint Network is a React/Vite social-app prototype with cat and dog experiences, an Express API, Clerk authentication, and server-side Gemini features.

## Local development

Requirements: Node.js 22–24, npm, and PostgreSQL.

1. Install the locked dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Replace the placeholder Clerk and Gemini credentials. Use the same Clerk publishable key for `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY`.
4. Run `npm run dev` and open `http://localhost:3000`.

Run the same checks used by CI and Render with:

```bash
npm run verify
```

## Architecture and operations

- [Authentication](docs/AUTHENTICATION.md) explains the components, request flow, domains, sessions, credentials, and token handling.
- [Production deployment](docs/DEPLOYMENT.md) covers Gandi Web Hosting, environment variables, Clerk dashboard work, tests, and release checks.
- [Mobile applications](MOBILE-APPS-README.md) covers the Capacitor targets.

## Current product boundary

Authentication, API authorization, and durable per-account PostgreSQL state are implemented. Browser `localStorage` is a user-scoped cache, not the source of truth. The current JSONB state model syncs an account across devices, but it is not a normalized shared social graph, and uploaded media still needs an object store before the app should be represented as a full multi-user social network.
