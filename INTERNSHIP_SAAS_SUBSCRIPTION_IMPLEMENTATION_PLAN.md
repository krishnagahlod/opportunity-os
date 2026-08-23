# Subscription & Freemium Monetization Implementation Plan
## InternPrep AI + Opportunity OS

> **Purpose:** This document is the implementation starting point for an AI development tool (Claude Code/Cursor/etc.) to convert the existing InternPrep AI and Opportunity OS applications into secure, production-ready freemium + paid products.
>
> **Primary launch principle:** Build authorization, entitlements, usage enforcement, and admin controls first. Integrate payments only after the access-control layer works correctly. Never rely on frontend state for paid-feature enforcement.

---

# 1. Executive Summary

We currently have two student-focused products:

1. **InternPrep AI** — an AI-powered internship/career preparation platform with resume intelligence, resume bullet generation/refinement, live mock case interviews, and company-specific intelligence.
2. **Opportunity OS** — an opportunity discovery and ranking platform aggregating internships, hackathons, fellowships, startup roles, etc., with personalized scoring and user actions.

The intended business model is:

- **IIT Bombay users:** free access after verified `@iitb.ac.in` email authentication.
- **External users:** limited free/freemium access, followed by paid plans.
- **Admin:** full ability to grant, revoke, extend, suspend, or override access.
- **Topmate:** an additional sales/acquisition channel only; no direct Topmate integration is required initially.
- **Payments:** start with fixed-duration purchases (e.g. 30/90/365 days) and add recurring auto-renewal later if useful.
- **Anti-sharing:** allow legitimate use across multiple devices, but detect and restrict excessive concurrent sessions / suspicious account sharing.
- **Security requirement:** paid access must be enforced server-side. Hiding UI elements is not considered security.
- **Initial scale:** ~20+ InternPrep AI active users, ~5+ Opportunity OS users; target >50 users this month, >200 in 3 months, and potentially ~1,000 in 6 months.

The two products should remain technically separate for now. However, the **authorization concepts, plan names, entitlement model, audit model, and implementation patterns should be consistent** so a future unified account/billing system can be introduced without a full rewrite.

---

# 2. Existing Architecture

## 2.1 InternPrep AI

Current documented architecture:

- Frontend: Next.js 16 App Router + React 19
- Styling/UI: Tailwind CSS, Framer Motion, shadcn/ui, Radix
- State: Zustand, React Context, LocalForage/IndexedDB
- Hosting: Vercel
- Backend: Python FastAPI
- Database: Supabase PostgreSQL + pgvector
- ORM/migrations: SQLAlchemy + Alembic
- Observability: Sentry + PostHog
- AI:
  - Gemini for heavy cognitive/resume tasks
  - Cerebras for live mock interviews
  - sentence-transformers + pgvector for embeddings/RAG
- Current architecture contains a guest/IndexedDB mode for low-friction usage and optional Supabase sync.

Source reference: `PROJECT_DOCUMENTATION.md`.

Important existing feature areas:

- Resume Intelligence & Section Composer
- Achievement Vault
- Point Bank / Refinement Coach
- Live Mock Case Interviews
- RAG Company Intelligence

The current FastAPI backend is the preferred enforcement point for protected AI functionality.

---

## 2.2 Opportunity OS

Current documented architecture:

- Frontend/API: Next.js 16 App Router + React 19
- Backend/database: Supabase PostgreSQL + Auth + RLS
- Automation/ingestion: n8n
- AI: Gemini primary, Groq fallback
- Email: Resend + React Email
- Telegram: Telegram Bot API
- Hosting: Vercel
- Vercel cron jobs for scheduled processes
- Existing Supabase RLS is used aggressively for user-owned data.
- Ingestion endpoints are protected by an `INGEST_SHARED_SECRET`.

Important feature areas:

- Opportunity ingestion
- Structured and unstructured extraction
- Opportunity enrichment
- Personalized scoring/ranking
- Save/apply/dismiss/feedback
- Daily digest
- Email/Telegram notifications
- Admin/source-quality functionality

**Critical monetization requirement:** premium opportunity data/features must be filtered server-side. Do not send all premium data to the browser and hide it with React/UI logic.

Source reference: `ARCHITECTURE(3).md`.

---

# 3. Core Product Rules

## 3.1 Access hierarchy

Do not represent access with a single frontend boolean such as:

```ts
isPremium = true
```

Instead use:

```text
User
  ↓
Authentication
  ↓
Entitlement resolution
  ↓
Plan
  ↓
Feature access
  ↓
Usage quota
  ↓
Feature execution
```

The server/database is the source of truth.

---

## 3.2 Initial plan taxonomy

Keep the terminology identical across both applications.

Recommended internal plan keys:

```text
guest
free
iitb_free
pro
lifetime
admin
```

These are logical access tiers. A paid subscription record and an entitlement record should remain separate concepts.

### `guest`
Unauthenticated or temporary experience.

### `free`
External authenticated user with intentionally limited access.

### `iitb_free`
Verified IIT Bombay user with high/full product access, subject to reasonable fair-use/API limits.

### `pro`
Paid external user.

### `lifetime`
Special entitlement for manual promotions/special cases. Use sparingly.

### `admin`
Administrative authorization role. This is not a normal customer subscription.

---

# 4. IIT Bombay Access Model

## Rule

A verified account using an email address ending in:

```text
@iitb.ac.in
```

gets `iitb_free`.

Implementation:

```text
Sign up / OAuth
    ↓
Email verification completed
    ↓
Check email domain
    ↓
email ends with @iitb.ac.in ?
    ├── yes → IITB entitlement
    └── no  → external Free plan
```

Important:

- Do not grant IITB benefits purely based on a client-supplied email string.
- Confirm identity through Supabase Auth.
- Require verified email.
- Make the rule server-side.
- Store the eligibility decision/entitlement in the database.
- Keep an admin override available.

Current product policy:

- IITB students: free.
- IITB alumni/faculty/staff: also acceptable for the initial domain-based rule.
- Other IIT domains: remain external.
- Later, this can become a more sophisticated verification system if needed.

---

# 5. Freemium Model

The exact numerical limits are intentionally left configurable. The implementation should support changing limits without code rewrites.

## 5.1 InternPrep AI

External `free` users should receive a useful but constrained experience, such as:

- limited resume analyses
- limited mock interviews
- limited AI refinement
- limited premium sections/features

`iitb_free` should expose most/all meaningful product capabilities with generous fair-use limits.

`pro` should provide substantially higher limits and unlock premium functionality.

### Do not hard-code the numbers into feature code.

Use database/config-driven limits:

```text
feature_key
plan_key
limit
period
enabled
```

Example concept:

```text
resume_analysis | free | 2 | month | true
resume_analysis | pro | 20 | month | true
resume_analysis | iitb_free | 20 | month | true
```

These are examples only; final limits should be decided after cost analysis.

---

## 5.2 Opportunity OS

External `free` users should get a limited taste of the platform:

- limited opportunity visibility
- limited detail views
- limited searches/queries
- limited saves
- limited premium matching
- limited alerts/digests

Premium fields/results must not be sent to the browser if the user is not entitled.

Potential premium-only capabilities include:

- deeper resume-to-opportunity matching
- higher result counts
- advanced ranking
- premium alerts
- priority sources
- deeper analytics
- future automated outreach functionality

Exact limits are intentionally configurable.

---

# 6. Entitlement Architecture

Do not use only:

```text
profiles.plan = 'pro'
```

Create a dedicated entitlement model.

Recommended tables/entities:

## 6.1 `plans`

Suggested fields:

```text
id
product
slug
display_name
description
is_active
created_at
updated_at
```

Possible rows:

```text
internprep_ai / free
internprep_ai / iitb_free
internprep_ai / pro
opportunity_os / free
opportunity_os / iitb_free
opportunity_os / pro
```

---

## 6.2 `entitlements`

Suggested fields:

```text
id
user_id
product
plan_key
status
source
starts_at
expires_at
granted_by
external_reference
metadata
created_at
updated_at
```

Recommended `source` values:

```text
iitb
admin
razorpay
promo
topmate
system
```

Recommended `status` values:

```text
active
scheduled
expired
revoked
suspended
```

Examples:

```text
user X
product = internprep_ai
plan = iitb_free
source = iitb
starts_at = ...
expires_at = null
```

or:

```text
user Y
product = opportunity_os
plan = pro
source = razorpay
starts_at = ...
expires_at = ...
external_reference = payment/order/subscription id
```

---

## 6.3 `subscriptions`

Keep payment/subscription state separate from entitlements.

Suggested fields:

```text
id
user_id
product
plan_key
provider
provider_customer_id
provider_subscription_id
status
started_at
current_period_start
current_period_end
cancelled_at
ended_at
metadata
created_at
updated_at
```

For the initial fixed-duration model, `provider_subscription_id` can be null.

---

## 6.4 `payment_transactions`

Suggested fields:

```text
id
user_id
product
amount
currency
provider
provider_order_id
provider_payment_id
status
raw_reference
metadata
created_at
updated_at
```

Do not store sensitive payment card/payment instrument data.

---

## 6.5 `feature_limits`

Suggested fields:

```text
id
product
plan_key
feature_key
enabled
limit_value
period
metadata
created_at
updated_at
```

Examples of `feature_key`:

### InternPrep AI

```text
resume_analysis
mock_interview
ai_refinement
company_intelligence
bullet_generation
advanced_resume_analysis
```

### Opportunity OS

```text
opportunity_search
opportunity_detail
premium_match
save_opportunity
daily_digest
priority_alert
advanced_filter
ai_analysis
```

---

## 6.6 `usage_events`

Use server-side usage accounting.

Suggested fields:

```text
id
user_id
product
feature_key
period_key
count
last_used_at
metadata
created_at
updated_at
```

Prefer atomic database increment operations / transactions to avoid race conditions.

For more granular analytics, also consider an append-only event table:

```text
usage_event_log
```

with:

```text
id
user_id
product
feature_key
request_id
created_at
metadata
```

Do not log full sensitive resume contents or full AI conversations unnecessarily.

---

## 6.7 `user_sessions`

Suggested fields:

```text
id
user_id
session_id
device_hash
user_agent
ip_hash
created_at
last_seen_at
revoked_at
```

Goals:

- multiple-device usage is allowed
- simultaneous account sharing is discouraged
- suspicious activity can be flagged
- user can revoke other sessions
- admin can revoke sessions

Avoid storing more network/device information than necessary.

---

## 6.8 `admin_audit_logs`

Suggested fields:

```text
id
admin_user_id
target_user_id
product
action
before_state
after_state
reason
created_at
```

Examples:

```text
grant_access
revoke_access
extend_access
change_plan
suspend_user
unsuspend_user
reset_sessions
manual_override
```

Every privileged admin action should be auditable.

---

# 7. Central Authorization Service

Implement a reusable backend authorization layer.

## InternPrep AI

Suggested conceptual modules:

```text
apps/api/
  services/
    entitlements.py
    usage.py
    sessions.py
  dependencies/
    auth.py
    authorization.py
```

Core functions:

```python
get_current_user()
get_active_entitlement()
has_feature_access()
check_feature_quota()
consume_feature_quota()
require_feature_access()
```

Example conceptual flow:

```python
user = get_current_user()

entitlement = get_active_entitlement(
    user_id=user.id,
    product="internprep_ai"
)

require_feature_access(
    entitlement=entitlement,
    feature="resume_analysis"
)

check_feature_quota(
    user_id=user.id,
    feature="resume_analysis"
)

result = perform_resume_analysis(...)
consume_feature_quota(...)
```

Do not trust:

- query parameters
- localStorage
- IndexedDB
- React state
- client-provided plan keys
- client-provided user IDs
- frontend route protection

---

## Opportunity OS

Build the same logical service inside the Next.js backend/server layer.

For every protected route:

```text
authenticate user
↓
resolve entitlement
↓
resolve feature
↓
check quota
↓
perform query
↓
return only permitted data
```

---

# 8. Critical Security Requirement: Server-Side Gating

## Never do this

```tsx
if (user.plan === "pro") {
  return <PremiumFeature />
}
```

while the API still exposes the premium data.

## Instead

```text
Browser
  ↓
Authenticated API request
  ↓
Server verifies identity
  ↓
Server resolves entitlement
  ↓
Server checks feature + quota
  ↓
Server executes query/model call
  ↓
Server returns allowed result only
```

Frontend gating is UX.

Backend authorization is security.

Both are required.

---

# 9. InternPrep AI Specific Security Changes

InternPrep AI currently has guest/IndexedDB functionality. Preserve guest mode for onboarding, but ensure it cannot unlock paid capabilities.

Rules:

- Guest state is never an entitlement.
- IndexedDB must never be the authority for premium state.
- Local cache must never contain a trusted `isPremium` flag.
- Every protected FastAPI endpoint checks server-side user entitlement.
- Every AI call should pass through the authorization/quota layer.
- Uploaded resume files must be tied to the authenticated user.
- File retrieval must enforce ownership.
- AI providers must be called server-side only.

Potential protected endpoints include:

```text
resume analysis
resume parsing
bullet generation
point refinement
mock interview generation
mock interview message
company intelligence
advanced analysis
```

Audit every current FastAPI router rather than assuming these are the complete list.

---

# 10. Opportunity OS Specific Security Changes

Opportunity OS already has Supabase Auth and RLS.

Preserve and strengthen this architecture.

Critical rule:

> Never return the full premium opportunity set to the frontend and then hide rows/cards with React.

Instead:

```text
Free user
→ query only free-eligible opportunities

Pro user
→ query free + pro opportunities/features
```

For fields that themselves are premium:

```text
Free query
→ select non-premium columns only

Pro query
→ select premium columns
```

Also audit:

- save routes
- application routes
- opportunity detail routes
- search routes
- ranking endpoints
- AI endpoints
- digest endpoints
- admin endpoints
- ingestion endpoints

The existing `INGEST_SHARED_SECRET` must remain server-side only.

---

# 11. Authentication

Current users already have accounts.

Supported methods currently include Google/email for the existing system. Do not unnecessarily migrate existing accounts.

Requirements:

- verified email for IITB entitlement
- secure session handling
- password reset
- email verification
- account deletion
- logout
- session revocation
- protection against unauthorized user-ID substitution

If Google OAuth is enabled in a product, preserve it.

---

# 12. Admin System

Create an authenticated admin-only area.

## Admin capabilities

Minimum required:

### User search

Search by:

- email
- user ID
- name

### User profile

Show:

```text
identity
email verification
IITB eligibility
product access
current plan
entitlement expiry
payment status
usage
active sessions
account status
```

### Access controls

Admin can:

- grant access
- revoke access
- extend access
- change plan
- set custom expiry
- grant lifetime
- suspend/unsuspend
- reset sessions
- manually override entitlement
- add admin note

### Auditability

Every admin mutation must be recorded in `admin_audit_logs`.

---

# 13. Admin Authorization

Do NOT expose an `isAdmin` flag that the client controls.

Use a trusted server-side mechanism.

Recommended approaches:

1. dedicated admin table / role
2. server-side role claim
3. allowlisted admin user IDs

For initial simplicity, a dedicated admin role table is acceptable.

All `/admin/*` backend actions must enforce admin authorization server-side.

---

# 14. Account Sharing Protection

Target: **moderate protection**.

Do not lock an account to a single device.

Recommended initial model:

- allow several registered devices
- allow normal device switching
- enforce a maximum number of active sessions
- enforce maximum concurrent sessions
- allow "sign out all other devices"
- flag suspicious patterns
- expose suspicious users to admin
- avoid automatic permanent bans based only on IP

Potential checks:

```text
active_session_count
device_count
concurrent_requests
request rate
AI usage
rapid IP changes
rapid geographic changes
```

Do not treat IP changes alone as proof of abuse.

---

# 15. Session Revocation

Provide a user-facing option:

```text
Settings
  → Security
  → Active Sessions
  → Sign out other devices
```

Admin must also be able to revoke all sessions.

On revocation:

- invalidate/rotate session
- require reauthentication
- update `revoked_at`

---

# 16. Rate Limiting

Add server-side rate limiting for:

### Authentication endpoints

- login
- signup
- password reset
- verification

### AI endpoints

- resume analysis
- interview generation
- interview message
- refinement
- company intelligence

### Opportunity endpoints

- search
- advanced matching
- AI analysis

### Admin endpoints

Much stricter limits.

Potential implementation options can include an external rate limiter (e.g. Redis/Upstash) or database-backed limits during the early stage.

The implementation should be configurable and should not block legitimate IITB use.

---

# 17. AI Cost Protection

Current AI APIs are free-tier APIs.

This must be treated as a hard operational constraint.

Every AI feature should have:

```text
authentication
+
feature entitlement
+
quota
+
rate limit
+
request size limit
```

Also add:

- maximum input length
- maximum PDF/file size
- timeout
- retry limit
- model fallback limit
- global abuse protection

Do not allow a single anonymous/external user to consume unlimited AI calls.

---

# 18. Usage Enforcement Race Conditions

Usage must be checked/consumed atomically.

Bad:

```text
read count = 4
if count < 5:
    perform request
    update count = 5
```

Two simultaneous requests can both observe 4.

Preferred:

```text
atomic conditional increment
```

or database transaction/row-lock pattern.

The system should never allow quota bypass through concurrent requests.

---

# 19. Payment Architecture

Initial recommendation:

## Phase 1

Use one-time payments for fixed-duration access.

Examples:

```text
30-day access
90-day access
365-day access
Lifetime (special/manual)
```

Payment success should create/extend an entitlement.

Keep payment provider logic behind an abstraction:

```text
payment_provider/
  razorpay.py
  interface.py
```

This keeps the app independent from one provider.

---

# 20. Razorpay Flow

Desired flow:

```text
User selects plan
      ↓
Backend creates payment/order
      ↓
Frontend opens Razorpay checkout
      ↓
User completes payment
      ↓
Provider sends webhook
      ↓
Server verifies webhook signature
      ↓
Server verifies payment/order
      ↓
Idempotency check
      ↓
Transaction recorded
      ↓
Entitlement created/extended
      ↓
User sees active Pro access
```

Never grant access solely because the browser reaches a success page.

---

# 21. Payment Webhook Security

Webhook endpoint must:

- use HTTPS
- validate provider signature
- use raw request body for signature verification where required
- reject invalid signatures
- verify the expected product/order/amount where applicable
- be idempotent
- log the provider event ID
- handle retries safely

Duplicate webhook delivery must not:

```text
grant 30 days twice
```

Use a unique provider event/order/payment ID.

---

# 22. Payment States

Represent explicit states:

```text
created
pending
paid
failed
cancelled
refunded
expired
```

Do not infer the current access state only from payment history.

Entitlements remain the authorization source.

---

# 23. Expiry Handling

Every time-limited entitlement must have `expires_at`.

A scheduled task should:

```text
find active entitlements
where expires_at < now()
→ mark inactive/expired
```

The authorization check should also independently compare `expires_at` with current time, so expired access is blocked even if the scheduled cleanup job has not yet run.

---

# 24. Renewal

Initial release:

```text
Expired Pro
→ Renew
→ New payment
→ Extend entitlement
```

Later, if required:

```text
Razorpay subscription
→ recurring payment webhook
→ extend entitlement
```

Do not implement automatic recurring billing unless product demand justifies it.

---

# 25. Billing Page

Authenticated users should have:

```text
My Plan
Current plan
Status
Start date
Expiry date
Usage
Upgrade
Renew
Payment history
```

Example:

```text
PLAN
Pro

STATUS
Active

EXPIRES
14 Oct 2026
```

And:

```text
Resume Analysis
3 / 20 this month
```

The UI must pull this data from server-authoritative APIs.

---

# 26. Upgrade UX

When a free user hits a protected feature:

```text
You've reached the free limit.

Upgrade to Pro to unlock:
✓ higher usage
✓ advanced features
✓ deeper matching
✓ more interview practice

[Upgrade to Pro]
```

Do not overuse blocking popups.

Let free users experience real value first.

---

# 27. External Free Tier Strategy

The external free tier should be useful enough to create product value but limited enough to create upgrade intent.

For Opportunity OS:

```text
show some opportunities
lock higher-value details/features
```

For InternPrep:

```text
give some resume analyses
give some mock interviews
unlock only certain sections
```

The user should reach a meaningful value moment before seeing a paywall.

---

# 28. IITB Experience

For verified IITB users:

Display something like:

```text
IIT Bombay Access
Your account has free access to premium features.
```

Avoid making IITB users go through payment flows.

They should still see usage meters where fair-use limits apply.

---

# 29. Privacy / User Data

Before paid launch, formally document:

- data collected
- why data is collected
- where resumes/files are stored
- AI provider processing
- retention period
- account deletion
- data deletion
- analytics
- cookies/local storage
- billing data handling

The products may store sensitive career materials, including resumes and AI-derived information. Do not retain more than necessary.

---

# 30. Required Legal/Policy Pages

Before charging external users, add:

```text
Privacy Policy
Terms of Service
Refund/Cancellation Policy
Contact/Support
Account Deletion
Subscription Terms
```

These should reflect the actual implementation.

Do not claim:

- unlimited AI
- guaranteed interviews
- guaranteed internships
- guaranteed job outcomes

unless the product actually provides such guarantees, which it should not.

---

# 31. Public GitHub Security

The production source repositories are currently public.

Before monetization:

## Make production repositories private.

Audit Git history for:

- Supabase keys
- Supabase service role key
- API keys
- database credentials
- `INGEST_SHARED_SECRET`
- hosting secrets
- webhook secrets
- payment keys
- JWT signing secrets
- admin credentials

Any credential that has ever been exposed publicly should be rotated.

Do not rely on `.env` being ignored today if a secret was committed historically.

After rotation, ensure:

```text
.env
.env.local
.env.production
```

and equivalents are never committed.

Production secrets must exist only in secure environment-variable systems.

---

# 32. Environment Separation

Use separate environments:

```text
development
staging
production
```

At minimum, payment work should use provider test/sandbox credentials first.

Never test real payment webhooks using production secrets while actively developing.

---

# 33. Observability

Use existing Sentry/PostHog infrastructure where appropriate.

Track:

### Product

```text
signup
login
iitb_verified
feature_used
quota_reached
upgrade_clicked
checkout_started
payment_success
payment_failed
entitlement_granted
entitlement_expired
```

### Security

```text
rate_limit_hit
invalid_webhook
unauthorized_feature_attempt
session_limit_hit
suspicious_activity
admin_action
```

Do not send resumes/full AI conversations into analytics events.

---

# 34. Automated Alerts

For the initial launch, alert on:

- repeated webhook signature failures
- sudden AI usage spikes
- unusual error rates
- unusually high request rates
- unexpected payment failures
- admin privilege changes
- suspicious account-sharing activity
- database errors

---

# 35. Testing / Red-Team Checklist

Before launch, explicitly attempt:

## Authentication

- access protected route without login
- access with expired session
- substitute another user ID
- modify client auth state

Expected: blocked.

## Entitlements

- modify localStorage
- modify React state
- modify query parameters
- send fake plan key
- send fake user ID
- call premium endpoint directly

Expected: blocked.

## Quotas

- make simultaneous requests
- replay requests
- modify client counters
- call API in parallel from multiple tabs

Expected: quota remains enforced.

## Payments

- fake success redirect
- replay webhook
- invalid signature
- wrong amount
- wrong order ID
- duplicate event

Expected: no unauthorized entitlement.

## RLS

- query another user's saved data
- access another user's application
- access another user's resume/file

Expected: blocked.

## Sessions

- open many sessions
- revoke session
- use revoked session token
- switch devices

Expected: correct enforcement.

## Admin

- access admin route as normal user
- modify admin parameters
- attempt user impersonation
- modify entitlement without admin role

Expected: blocked.

## Opportunity OS

- request premium rows directly
- request premium details directly
- manipulate pagination
- request hidden opportunities by ID
- access premium ranking without entitlement

Expected: blocked.

---

# 36. Acceptance Criteria for Monetization Readiness

The system is not ready to charge users until all of these are true:

- [ ] Authentication is server validated.
- [ ] IITB verification is server enforced.
- [ ] Entitlements exist independently of frontend state.
- [ ] Every protected feature has a server-side authorization check.
- [ ] Every limited AI feature has a server-side quota.
- [ ] Usage increments are race-condition safe.
- [ ] Admin can grant/revoke/extend access.
- [ ] All admin actions are audited.
- [ ] Expired access is blocked server-side.
- [ ] Payment webhook verification works.
- [ ] Webhook processing is idempotent.
- [ ] Payment records are persisted.
- [ ] Entitlements can be linked to payment references.
- [ ] Premium data is never exposed to unauthorized users.
- [ ] RLS has been tested.
- [ ] API secrets are server-side.
- [ ] Public GitHub repositories contain no production secrets.
- [ ] Account sharing controls work.
- [ ] Rate limiting exists on important endpoints.
- [ ] User can view current plan and expiry.
- [ ] User can delete their account.
- [ ] Privacy/terms/refund documentation exists.
- [ ] Sentry/error monitoring is operational.
- [ ] Production payment test has been completed.
- [ ] Red-team tests have been completed.

---

# 37. Recommended Implementation Order

## Phase 0 — Repository & Security Audit

**Goal:** understand and secure what already exists.

Tasks:

1. Inventory every route/API endpoint.
2. Inventory every authentication mechanism.
3. Inventory every database table and RLS policy.
4. Inventory every secret/environment variable.
5. Search Git history for leaked secrets.
6. Make production repositories private.
7. Rotate exposed credentials.
8. Audit CORS.
9. Audit file upload/download authorization.
10. Document existing guest access.

**Deliverable:**

`SECURITY_AUDIT.md`

---

## Phase 1 — Entitlement Foundation

**Goal:** make access controllable without payment.

Implement:

- plans
- entitlements
- feature limits
- usage
- sessions
- admin audit logs

Seed:

```text
free
iitb_free
pro
lifetime
admin
```

**Deliverable:**

Admin can manually grant/revoke/extend access.

---

## Phase 2 — Authorization Middleware

**Goal:** enforce the entitlement layer.

InternPrep:

- FastAPI auth dependency
- entitlement resolver
- feature access
- usage enforcement
- quota consumption

Opportunity OS:

- Next.js server authorization
- entitlement resolver
- premium query filtering
- usage enforcement

**Deliverable:**

A user cannot unlock protected functionality by changing frontend state.

---

## Phase 3 — IITB Verification

**Goal:** automatic free access.

Implement:

```text
verified @iitb.ac.in
→ iitb_free
```

Add:

- email verification requirement
- entitlement creation
- re-evaluation mechanism
- admin override

**Deliverable:**

IITB account receives appropriate access automatically.

---

## Phase 4 — Freemium UI

**Goal:** communicate limitations.

Implement:

- usage meters
- locked features
- upgrade prompts
- plan status
- expiry
- billing page

**Deliverable:**

Free users understand what they can use and why an upgrade is useful.

---

## Phase 5 — Admin Dashboard

Implement:

- user search
- entitlement management
- payment history
- usage
- sessions
- audit log
- suspension
- manual override

**Deliverable:**

The owner can run the system without direct database editing.

---

## Phase 6 — Payment Integration

Start with one-time fixed-duration purchases.

Implement:

- product/plan selection
- order creation
- checkout
- webhook
- signature verification
- payment transaction
- entitlement creation
- idempotency

**Deliverable:**

A real test payment produces correct Pro access.

---

## Phase 7 — Abuse Protection

Implement:

- sessions
- concurrency limits
- rate limiting
- AI quotas
- request-size limits
- suspicious behavior flags

**Deliverable:**

One shared account cannot cheaply become an unlimited shared service.

---

## Phase 8 — Data & Legal Readiness

Implement:

- privacy policy
- terms
- refund policy
- deletion flow
- retention rules
- support

**Deliverable:**

Product is ready for external paid users.

---

## Phase 9 — Beta Launch

Start with:

```text
InternPrep AI
20+ existing users
```

Then invite a small controlled cohort.

Test:

- payments
- free tier
- IITB tier
- Pro tier
- expiry
- admin overrides
- sessions
- quotas

Fix bugs before expanding.

---

## Phase 10 — Opportunity OS

Replicate the same architecture:

- entitlement tables
- authorization
- premium queries
- usage
- admin
- payment
- sessions
- security tests

Do not duplicate logic blindly; keep the conceptual architecture consistent.

---

# 38. Implementation Principles for the AI Coding Agent

The development tool must follow these rules.

## Rule 1 — Inspect before editing

Before changing code:

- inspect repository structure
- inspect package dependencies
- inspect Supabase migrations
- inspect existing auth
- inspect RLS
- inspect current API routes
- inspect environment variables (names only)
- inspect tests

Do not assume the documentation perfectly matches the latest code.

---

## Rule 2 — Do not rewrite working architecture unnecessarily

InternPrep already has FastAPI + Supabase.

Opportunity OS already has Next.js + Supabase.

Extend existing patterns rather than introducing unrelated frameworks.

---

## Rule 3 — Never expose secrets

Never place secrets in:

- frontend source
- public config
- localStorage
- IndexedDB
- query strings
- public GitHub
- browser-visible environment variables

---

## Rule 4 — Server is the authorization authority

Never trust the frontend for:

- plan
- entitlement
- quotas
- user identity
- payment status
- admin status

---

## Rule 5 — Database changes must be migratable

Use versioned Supabase migrations / SQL migrations.

Never manually modify production schema without recording the migration.

---

## Rule 6 — Preserve existing users

Existing authenticated users must not break when subscription support is introduced.

Migration strategy:

```text
existing authenticated user
→ create/assign free entitlement
```

If verified IITB:

```text
→ iitb_free entitlement
```

No existing user should accidentally lose functionality during deployment unless intentionally moved to the new free-tier limits after a controlled rollout.

---

## Rule 7 — Backward compatibility

Introduce feature gates behind a configuration/feature flag where possible.

Example:

```text
SUBSCRIPTION_ENFORCEMENT_ENABLED=false
```

during development.

Enable first in staging.

Then production beta.

---

## Rule 8 — Write tests for security behavior

Every protected feature needs authorization tests.

Do not test only the happy path.

---

# 39. Suggested Folder/Module Organization

Exact placement should follow the current repository, but aim for something similar.

## InternPrep AI

```text
apps/api/
  auth/
  dependencies/
    authorization.py
    authentication.py
  services/
    entitlements.py
    plans.py
    usage.py
    sessions.py
    billing.py
  routers/
    billing.py
    admin.py
    account.py
  models/
    ...
  repositories/
    entitlement_repository.py
    usage_repository.py
    subscription_repository.py
```

Frontend:

```text
apps/web/
  src/
    app/
      account/
      billing/
      admin/
    components/
      billing/
      paywall/
      usage/
    lib/
      entitlements/
      billing/
```

Do not blindly create these files. First adapt to the existing code organization.

---

# 40. Initial API Contract

Conceptual API endpoints:

## Account

```text
GET /api/account/me
GET /api/account/entitlements
GET /api/account/usage
DELETE /api/account
```

## Billing

```text
POST /api/billing/create-order
POST /api/billing/verify
POST /api/billing/webhook
GET  /api/billing/history
POST /api/billing/renew
```

## Sessions

```text
GET  /api/account/sessions
DELETE /api/account/sessions/:id
POST /api/account/sessions/revoke-others
```

## Admin

```text
GET  /api/admin/users
GET  /api/admin/users/:id
POST /api/admin/users/:id/grant
POST /api/admin/users/:id/revoke
POST /api/admin/users/:id/extend
POST /api/admin/users/:id/change-plan
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/reset-sessions
GET  /api/admin/users/:id/usage
GET  /api/admin/audit-logs
```

The actual route conventions should match the existing applications.

---

# 41. Feature Access Contract

Every protected feature should resolve to something like:

```json
{
  "allowed": true,
  "plan": "pro",
  "feature": "resume_analysis",
  "remaining": 17,
  "limit": 20,
  "reset_at": "2026-09-01T00:00:00Z"
}
```

For blocked:

```json
{
  "allowed": false,
  "reason": "quota_exceeded",
  "plan": "free",
  "remaining": 0,
  "upgrade_required": true
}
```

Do not expose internal secrets or sensitive payment data.

---

# 42. Product Metadata for Payment Plans

Keep payment-provider product IDs outside business logic.

Example:

```text
plan:
  internprep_pro_30d
  provider_product_id
  provider_price_id
```

The application works with internal:

```text
internprep_ai / pro / 30d
```

and the payment layer maps that to Razorpay IDs.

This prevents vendor lock-in.

---

# 43. Fixed-Duration Entitlement Rules

For a new purchase:

```text
starts_at = now
expires_at = now + duration
```

For renewal while active:

```text
new_expiry = existing_expiry + duration
```

rather than:

```text
now + duration
```

This prevents users from losing remaining paid time when renewing early.

---

# 44. Admin Grant Rules

Admin grants should use the same entitlement engine as payments.

Example:

```text
grant(
  user_id,
  product,
  plan,
  starts_at,
  expires_at,
  source="admin"
)
```

Do not create a completely separate "admin premium" code path.

---

# 45. Handling Multiple Entitlements

A user may eventually have:

```text
Opportunity OS → Pro
InternPrep AI → IITB Free
```

Therefore entitlement resolution must include `product`.

Do not assume one global plan applies to both products.

---

# 46. Future Unified Account

Do not implement yet.

But preserve the possibility that later:

```text
one user ID
    ├── InternPrep entitlement
    └── Opportunity OS entitlement
```

This is why the entitlement table includes `product`.

A future unified product can also introduce:

```text
Career Pro
```

that grants:

```text
internprep_ai pro
+
opportunity_os pro
```

without redesigning the core system.

---

# 47. Performance Considerations

At ~1,000 users, a normal entitlement lookup will be inexpensive, but structure it efficiently.

Recommended:

- index `entitlements(user_id, product, status)`
- index active/expiry fields
- index `subscriptions(user_id, product)`
- index `usage_events(user_id, feature_key, period_key)`
- index sessions by user
- avoid repeated entitlement queries during a single request
- optionally cache entitlement resolution later

Do not prematurely introduce complicated distributed infrastructure.

---

# 48. Launch Strategy

## Stage 1

InternPrep AI:

- existing users
- IITB users
- internal test accounts

## Stage 2

Small external paid cohort.

## Stage 3

Public freemium.

## Stage 4

Opportunity OS.

This reduces simultaneous failure points.

---

# 49. Success Metrics

Initially track:

```text
weekly active users
free users
IITB users
paid users
conversion rate
average revenue per paid user
renewal rate
quota-hit rate
feature usage
refund rate
failed payments
abuse flags
```

For Opportunity OS, retain the existing North Star concept:

```text
Qualified Actions Per Weekly Active User
```

rather than optimizing only for raw opportunity impressions.

---

# 50. Definition of Done

The monetization implementation is complete when:

```text
A user can:
  sign up
  verify email
  receive correct free/IITB status
  use allowed free features
  hit a quota
  see an upgrade prompt
  pay for Pro
  have payment verified server-side
  receive Pro entitlement
  use Pro features
  see usage and expiry
  renew
  expire
  regain access after renewal
  log in from another device
  revoke another session
```

and:

```text
An admin can:
  search users
  inspect access
  inspect usage
  grant access
  revoke access
  extend access
  change plans
  suspend accounts
  reset sessions
  view payments
  view audit logs
```

and:

```text
An attacker cannot:
  unlock Pro by changing frontend state
  bypass quota by editing localStorage
  call premium APIs without entitlement
  access another user's data
  retrieve hidden premium opportunities
  fake payment success
  replay a webhook to gain extra access
  use another user's session indefinitely
```

---

# 51. Final Development Order

Implement strictly in this order:

```text
1. Repository/security audit
2. Make production repos private + rotate leaked secrets
3. Database migrations
4. Plan/entitlement service
5. Authentication verification
6. IITB entitlement
7. Server-side feature gates
8. Usage/quota engine
9. Admin dashboard
10. Session/device security
11. Freemium UI
12. Billing page
13. Razorpay test integration
14. Secure webhook verification
15. Entitlement activation
16. Expiry/renewal
17. Security/red-team tests
18. Privacy/legal flows
19. Controlled beta
20. Production launch
21. Replicate architecture for Opportunity OS
```

**Do not skip ahead to payment integration simply because it feels like the monetization feature. The security/access-control foundation is the monetization feature.**

---

# 52. Immediate Next Task for the AI Development Tool

Start with **InternPrep AI only**.

Do not modify Opportunity OS yet.

The first task is:

## `PHASE_0_SECURITY_AND_ARCHITECTURE_AUDIT`

The development tool must:

1. Inspect the full repository.
2. Inspect current Supabase schema/migrations.
3. Inspect all FastAPI routers/endpoints.
4. Inspect authentication/session handling.
5. Inspect every AI endpoint.
6. Inspect file upload/download flows.
7. Inspect RLS policies.
8. Inspect environment variable usage.
9. Search source and Git history for hardcoded credentials/secrets.
10. Inspect guest/IndexedDB flows.
11. Identify every feature that needs access control.
12. Produce:
   - `SUBSCRIPTION_AUDIT.md`
   - a list of vulnerabilities
   - a proposed migration plan
   - a list of files to modify
   - a list of new files/modules to add
   - any questions/blockers

### Important agent behavior

**Do not implement large changes during the initial audit.**

First understand the existing architecture.

After the audit, proceed to Phase 1 only when the implementation plan is consistent with the repository.

---

# 53. Notes for Future Expansion

After InternPrep AI is stable:

1. Port the same entitlement concepts to Opportunity OS.
2. Add shared plan vocabulary.
3. Add a unified user/identity layer only when needed.
4. Consider combined "Career Pro" access to both products.
5. Consider recurring billing.
6. Consider referral/affiliate tracking.
7. Consider Topmate-driven access grants only if Topmate/API integration becomes desirable.
8. Consider institutional/student licensing.
9. Consider team/college plans.
10. Consider Stripe/global payments if international users justify it.

Do not build these now unless required for the first monetization launch.

---

# 54. Source References

Current project architecture was derived from the provided project documentation:

- InternPrep AI architecture/features/backend/AI stack: `PROJECT_DOCUMENTATION.md`
- Opportunity OS architecture/auth/RLS/ingestion/scoring/notifications: `ARCHITECTURE(3).md`

These documents should be treated as the baseline architecture, but the implementation agent must inspect the live repository and treat code as the final source of truth if the documentation and code differ.

---

# 55. Non-Negotiable Security Principles

1. **Never trust the client for authorization.**
2. **Never expose production API keys.**
3. **Never return premium data to unauthorized clients.**
4. **Never grant access based solely on a frontend payment-success state.**
5. **Always verify payment events server-side.**
6. **Always make webhooks idempotent.**
7. **Always enforce quotas server-side.**
8. **Always enforce user ownership at the database/API layer.**
9. **Always audit privileged admin mutations.**
10. **Never store more sensitive user data than needed.**
11. **Do not call a system “unbreakable”; continuously test and harden it.**
12. **Preserve existing users and functionality through a controlled migration.**

---

## END OF IMPLEMENTATION PLAN
