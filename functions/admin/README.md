## Emilocker Admin Panel

Modern App Router dashboard powered by Next.js 16, RTK, and feature-based modules.

### Quick start

1. Install deps
   ```bash
   pnpm install
   ```
2. Copy `env.example` → `.env.local` and set `NEXT_PUBLIC_API_BASE_URL`.
3. Seed an admin on the backend (from this folder)
   ```bash
   pnpm seed:admin
   ```
   _Ensure the backend `.env` has Mongo + admin credentials configured._
4. Run the panel
   ```bash
   pnpm dev
   ```

### Structure

- `app/(auth)` – login surface
- `app/(dashboard)` – guarded layout + analytics widgets
- `src/features/auth` – RTK slice, thunks, selectors
- `src/components` – reusable layout + form primitives
- `src/hooks` – auth guard + store bindings
- `src/lib/api-client` – Axios instance with JWT injection

### Commands

| Script         | Description                          |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Run the admin UI locally             |
| `pnpm build`   | Next production build                |
| `pnpm start`   | Serve the built app                  |
| `pnpm lint`    | Run linting                          |
| `pnpm seed:admin` | Execute backend admin seed helper |

Use the seeded admin credentials on `/login` to reach the dashboard.
