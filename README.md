# VentureLab

A salon-first customer-engagement pilot for salons, coaching centres, clinics and cafés, built with Next.js, React and PostgreSQL.

## Features

- Private owner accounts and business-scoped access
- Editable business facts and grounded customer replies
- Customer inbox, human takeover and owner replies
- Booking requests with date, duration, resource and overlap checks
- Lead management and a manual WhatsApp follow-up planner
- Customer links, QR sharing and an embeddable chat widget
- Four clearly labelled demos that do not save contact details

## Local setup

Use Node.js 22 or newer.

```bash
npm ci
cp .env.example .env.local
```

Fill in `DATABASE_URL` and a securely generated `ADMIN_SESSION_SECRET` (at least 32 characters). Do not commit `.env.local`.

For a new empty PostgreSQL database, run:

```bash
npm run migrate
npm run dev
```

Open http://localhost:3000. Create an owner account at `/signup`, add business knowledge and share the customer link from your dashboard. New businesses start without fictional prices or policies.

`ADMIN_PASSWORD` is optional for platform-administrator access; normal owners use their registered email and password. `ANTHROPIC_API_KEY` enables the optional generative provider. Without it, responses use deterministic knowledge matching. Real WhatsApp requires the Meta credentials and business mapping listed in `.env.example`.

## Checks

```bash
npm test
npm run build
```

The 21 workflow checks use an isolated simulated transaction transport. They do not replace a hosted PostgreSQL integration test.

## Deployment

Import `adee-kaushik/venture` into the intended Vercel account as a Next.js project. Configure production secrets directly in Vercel and ensure the PostgreSQL migration has run. Deploy a preview and verify signup, knowledge, chat, owner replies, bookings and persistence before promoting it.

No credentials, dependencies, build output or old contact-data files are included in this repository.

## Pilot limitations

Automated reminders, complete WhatsApp retries/idempotency, password recovery, staff roles and a public availability calendar remain unfinished. Persistence uses one transactional JSON snapshot for low-volume pilots and must be normalized before significant scale. See [RELEASE.md](RELEASE.md) for details and the previous validation/deployment status.
