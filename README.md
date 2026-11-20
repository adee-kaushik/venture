# VentureLab

A salon-first customer-engagement pilot for salons, coaching centres, clinics and cafés, built with Next.js, React and PostgreSQL.

## Features

- Private owner accounts and business-scoped access
- Editable business facts and grounded customer replies
- Customer inbox, human takeover and owner replies
- Booking requests with date, duration, resource and overlap checks; customer notifications on website chat
- Monthly appointment calendar, coaching student qualification and salon service intake
- Multi-turn public demos and conservative booking-date handling (never fabricate available slots)
- Lead management and a manual WhatsApp follow-up planner
- Customer links, QR sharing and an embeddable chat widget
- Four clearly labelled demos that use client-supplied recent context without saving contact details

## Local setup

Use Node.js 22 or newer.

```bash
npm install
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

The 29 workflow checks use an isolated simulated transaction transport. They do not replace a hosted PostgreSQL integration test.

## Deployment

Import `adee-kaushik/venture` into the intended Vercel account as a Next.js project. Configure production secrets directly in Vercel and ensure the PostgreSQL migration has run. Deploy a preview and verify signup, knowledge, chat, owner replies, bookings and persistence before promoting it.

No credentials, dependencies, build output or old contact-data files are included in this repository.

## Current release limits

The complete product flow is ready for a low-volume pilot: owner onboarding, grounded chat, lead capture, bookings, appointment calendar, inbox, follow-ups, demos and WhatsApp webhook routing are implemented and tested. Production email delivery, WhatsApp outbound delivery and the database still require the deployment secrets described in `.env.example`.

Persistence uses one transactionally locked JSON snapshot. Normalize tenant tables and move AI calls outside write locks before significant scale. Per-staff leave, group capacity, payments, subscriptions and two-factor authentication are intentionally outside this release. See [RELEASE.md](RELEASE.md) for the deployment checklist and verification notes.
