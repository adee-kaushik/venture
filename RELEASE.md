# VentureLab salon-first pilot

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

## Deployment status and required environment

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
