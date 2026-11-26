# VentureLab dashboard and staff implementation

Built on the existing Next.js application, retaining onboarding, grounded chat, lead capture, booking requests, calendar, inbox, human handover, follow-ups, knowledge, QR and website widget workflows.

## Added

- Responsive dashboard using the supplied desktop/mobile direction: green sidebar, two-column mobile metrics, attention queue, bookings for today, recent conversations and mobile More menu.
- Owner Settings staff account creation, activation and disabling.
- Staff sign-in through the existing login page; operational dashboard with inbox, leads, bookings and follow-ups.
- Server-side staff permission checks, tenant isolation, and immediate session revocation. Restoring access requires a fresh login.
- 15 additional workflow assertions for staff accounts and access boundaries.

## Verification and limits

53 workflow checks pass with simulated PostgreSQL transport. Production build passes. Lint completes with warnings and zero errors. Visual verification is blocked by the local preview connection; see design-qa.md. Production deployment and hosted database checks have not run.

Account roles are stored in the existing snapshot account data; legacy accounts default to owner. The unused Prisma schema is not the persistence source in this application.

Staff passwords are initially set by the owner and must be shared privately. Email invitations, self-service password reset, per-staff custom permissions and audit logging remain future work. Staff can operate on all records belonging to their business. Knowledge and business settings remain owner-managed.

## Remaining toward the wider vision

- Reachable preview with actual database and visual QA of both reference layouts.
- Production integration tests for signup, knowledge, chat, booking confirmation, human replies and persistence.
- Staff password reset/invitations and custom permissions if needed for pilot operations.
- WhatsApp provider configuration and outbound delivery; production email delivery.
- Pilot feedback from salons and cafés; cost and conversion measurements before validating prices.
- Database normalization and removal of AI calls from snapshot write locks before scaling.

The prior web-only review understated the existing implementation. Repository tests show these core workflows already exist; the earlier demo-loop observation should not be treated as proof that the whole product lacks booking persistence.
