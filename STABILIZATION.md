> Historical notes from the earlier prototype. Superseded by [RELEASE.md](RELEASE.md) and [README.md](README.md).

# VentureLab stabilization status

## Fixes in this branch
- Signed HttpOnly admin cookie, /login and /api/auth/login, guarded /dashboard, /onboard, and owner CRUD API routes.
- Conversations may not be reused across businesses; admin conversation reads are tenant-checked.
- Anthropic's retired Claude 3.5 Haiku default replaced with Claude Haiku 4.5, using real usage tokens when available.
- Booking-status validation and simple duplicate-confirmation guard. Booking requests remain pending until approval.
- WhatsApp webhook signature verification (META_APP_SECRET) and required explicit inbound number mapping (WHATSAPP_BUSINESS_MAPPING).
- Unverified local-business validation claim removed from homepage.

## Before trying the preview
1. Configure ADMIN_PASSWORD (12+ characters) and ADMIN_SESSION_SECRET (32+ characters) in Vercel's environment variables, then redeploy.
2. Open /login and sign in; public /c/apex-institute remains unauthenticated.
3. Set ANTHROPIC_API_KEY for live LLM answers, or use fallback demo mode.
4. Configure official WhatsApp Cloud API credentials and phone mapping before testing WhatsApp.

## Important limitations
- **Not yet production-ready**. Data still uses an in-memory/JSON store; Vercel cannot be relied on to persist runtime filesystem writes. A PostgreSQL persistence migration and database connection remain necessary.
- This is a single shared administrator password, not business-owner-specific accounts or role-based tenant authorization.
- Slot conflict detection is best effort; there is no atomic database lock or verified availability calendar.
- WhatsApp still needs official Meta configuration, retry/idempotency handling, and end-to-end delivery verification.
- This change has received source-level checks only; an npm build and deployment smoke test have not been run.
