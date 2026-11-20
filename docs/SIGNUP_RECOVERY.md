# VentureLab signup recovery — Vercel and Neon

The signup UI displays “Workspace temporarily unavailable” when a server request fails. This does **not** mean the signup form is invalid.

## Diagnose the deployed site

1. Open `https://<your-live-domain>/api/health` in a browser. The endpoint is read-only and returns no passwords, URLs, account names, or customer records.
2. It returns `200` with `{"status":"ok","code":"READY"}` only when the deployed server can connect to PostgreSQL, find the initial workspace row, and has a usable session secret.
3. A `503` response includes a non-secret diagnostic code:

| Code | Corrective action |
| --- | --- |
| `DATABASE_URL_MISSING` | Add `DATABASE_URL` in **that site's actual Vercel project**, Settings → Environment Variables. |
| `DATABASE_AUTH_FAILED` | Copy a fresh **pooled** connection URI from the chosen Neon project's Connection Details; ensure credentials and special-character encoding are correct. |
| `DATABASE_CONNECT_FAILED` | Check the Neon endpoint/region, SSL, compute status and network access; use a Neon-pooled Postgres URI. |
| `DATABASE_SCHEMA_MISSING` | Run the additive SQL migration in `migrations/001_workspace.sql` in the correct Neon database. |
| `DATABASE_STATE_MISSING` | The table exists but the required row (id = 1) does not. Do not overwrite existing customer data; back up and initialize an empty project using the existing migration script. |
| `SESSION_SECRET_MISSING` | Set `ADMIN_SESSION_SECRET` to a securely generated random string of at least 32 characters. |
| `WORKSPACE_OPERATION_FAILED` | Check Vercel → Logs for `VentureLab workspace failure`; the code logs only a safe failure category and request path. |

**Important:** A successful GitHub build or Vercel deployment does not prove database connectivity. Different Vercel accounts can deploy the same GitHub repository, so verify the project attached to the *actual live domain*. A Neon project reachable from your connector is not necessarily the one configured in Vercel.

## Finish safely

1. Open the Vercel dashboard that owns the live domain, select the VentureLab project, then Settings → Environment Variables.
2. Set `DATABASE_URL` (from the matching Neon project, pooled connection string) and `ADMIN_SESSION_SECRET` for **Production**. Never paste either secret in GitHub, screenshots, or chat.
3. After changing variables, **Redeploy** the production deployment; old functions retain their old environment.
4. Open `/api/health` again and look for `READY`.
5. Create a **new test account using test details**, then sign out and sign in again. Verify the workspace still exists.
6. Verify the data landed in the intended Neon project using read-only queries, without exposing contact details. Only then proceed with real customers.

Do not repeatedly run migrations or insert replacement state into an existing database. Never publish an old connection URI; rotate any Neon credential that was previously shared outside a secure secret store.
