# VentureLab — release history

## 15 November 2026: Core pilot improvements (merged to main)

- GitHub merge commit: d7b81d2614e48b0df4baf7b33ebdad16e9a0bc38
- GitHub Actions: 29 simulated workflow checks and the Next.js production build passed before merging.
- Vercel's GitHub deployment status reported success for the merged commit. This does NOT establish that hosted signup, data persistence, WhatsApp, or delivery have passed live end-to-end tests.
- Public demo assistants now accept recent local conversation history, while their contact details and booking requests are not saved.
- Conservative India Standard Time date handling, lead capture without fabricated slot dates, and duplicate-booking protection.
- Owner appointment calendar and one-click website customer-chat confirmations for approved or declined appointments.
- Coaching intake captures class and target exam; salon intake captures service and optional stylist.
- Owner dashboard includes an onboarding checklist when business knowledge is incomplete.
- GitHub Actions now checks pull requests and updates to main.
- Important: The existing package-lock.json needs regeneration. CI runs npm install --package-lock-only before npm ci as a temporary workaround.

### Still required before onboarding paying clients

1. Verify production DATABASE_URL, ADMIN_SESSION_SECRET and persistent signup/booking records, including across a server restart and two unrelated owner accounts.
2. Complete and test official Meta WhatsApp credentials, idempotent webhook processing, outbound retries, provider delivery status, consent and approved notification templates. Manual WhatsApp links are not automated reminders.
3. Replace the single PostgreSQL JSON snapshot with normalized, indexed tables and move outbound AI/network calls out of write locks for concurrent traffic.
4. Implement public real-time availability, resource working hours, holidays, rescheduling, and customer-initiated cancellation.
5. Add production owner recovery, staff roles, privacy/retention controls, monitoring and accessibility/mobile-browser checks.

---

## Original salon-first pilot (historical, before 15 November update)

Built on the existing VentureLab application and previous stabilization branch.

## Implemented

- Warm white / ink / teal responsive landing page with salon-first positioning and coaching, clinic and café choices.
- Owner registration, scrypt password hashing, signed expiring HTTP-only sessions, login throttling and API-level workspace isolation.
- PostgreSQL-backed durable workspace state; database row locking serializes writes and booking confirmation.
- Business settings and editable knowledge; new businesses start without fictional fees or policies.
- Grounded answers with existing Anthropic integration when configured, otherwise a deterministic knowledge-matching fallback. Clinic responses are restricted to reception assistance.
- Private customer conversation cookies, full owner inbox, human takeover, owner replies and customer polling.
- Booking request form, explicit IST appointment editing, duration/resource assignments and overlapping-booking prevention.
- Lead status tracking, existing CSV export, QR sharing and recoloured website widget.
- Follow-up planner with due dates, completion tracking and an explicit manual WhatsApp handoff.
- Four clearly labelled demo assistants: no demo contact details or booking records are saved.
- Previous WhatsApp signature verification and business routing fixes retained; outbound success reporting corrected.

## Validation

- `npm run build`: production compilation and TypeScript validation passed.
- `node --import tsx tests/workflows.mjs`: 21 route/workflow checks passed using an isolated simulated transaction transport. Covers registration/login, tenant isolation, forged sessions, knowledge ownership, grounded replies, conversation isolation, owner replies, conflicting booking confirmation, resource separation, CRM status validation, follow-ups and non-persistent clinic demos.
- Landing page visually inspected in the managed browser. Hosted database integration and a production deployment are not verified.

## Prior deployment status and required environment (historical)

No production deployment was made. The connected Vercel account exposes NeuraFitness only, not the existing `venture-lab-chi.vercel.app` project. Creating a Git-linked VentureLab project returned 403 permission denied. CLI credentials are not available. Keep this release off the production branch until the correct project can be configured and tested.

A new, empty Neon project named `venturelab` (`wild-meadow-68733902`, Singapore) was provisioned. `migrations/001_workspace.sql` and an empty initial workspace row were applied. No existing business/contact records were imported. The development container cannot resolve the database endpoint; live database tests must run from the authorized deployment environment.

Set in the intended Vercel project:

- `DATABASE_URL`: the pooled connection string from the VentureLab Neon project, stored as a secret.
- `ADMIN_SESSION_SECRET`: a strong random secret of at least 32 characters. Generate it securely in the deployment environment; do not commit it.
- `ADMIN_PASSWORD`: optional platform administrator password, at least 12 characters; regular owners register their own accounts.
- `ANTHROPIC_API_KEY`: optional for generative replies. Without it the UI explicitly reports knowledge-based fallback mode.
- `WHATSAPP_TOKEN`, `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_BUSINESS_MAPPING`: required for real WhatsApp. Mapping is Meta phone-number ID to business slug.

Run `npm ci`, apply the additive migration to an empty database if needed, build, then deploy a preview. Verify signup → business facts → customer chat → owner inbox → booking confirmation → follow-up persistence across a server restart before production promotion.

## Pilot limits / remaining production work

- This preserves the prototype's store API using one transactional JSON snapshot. It is intentionally a low-volume pilot implementation, not a high-scale relational SaaS. Normalize tenant tables and move AI/network calls outside write locks before onboarding significant traffic.
- No email verification, password reset, staff role management or two-factor authentication yet.
- Bookings prevent overlap for a manually named resource. Configured working hours, leave, recurring staff availability, capacity rules and a public real-time availability picker remain to build.
- Follow-ups are reminders in the owner workspace, not background delivery. No automated reminders, consent-based campaigns, approved WhatsApp templates or delivery queue yet.
- WhatsApp still needs a full provider sandbox test, multi-event webhook batching, idempotent message processing and reliable outbound retries. Human replies through the WhatsApp inbox are explicitly blocked until that integration is completed.
- Third-party widget conversation persistence uses partitioned secure cookies; test on target browsers and customer domains before rollout.
- Public clinic workflows must not collect medical histories. This is reception assistance, not medical software.

## Interface references

Fresha's scheduling / service presentation and respond.io's inbox / business-grounded assistant concepts informed the information hierarchy. The visual implementation is original.

- https://www.fresha.com/for-business/features/scheduling
- https://www.fresha.com/for-business/features
- https://respond.io/team-inbox
- https://respond.io/help/quick-start/what-is-respondio
