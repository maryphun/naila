# Hotlah — design and architecture proposal

Status: cream, charcoal, and yellow visual direction and the first four mobile concepts approved by the user; see design/mobile-v1/README.md. Architecture and remaining detailed flows remain recommendations for review, not an approved implementation specification. Prepared on 2026-09-21. Confirmed requirements are in PRODUCT.md. No application code has been written.

## Recommended design language

Use a light, warm interface suited to browsing nail photos and checking appointments on a phone. Preserve the reference images' cream, yellow, and dark-outline character, with professional typography and useful photography carrying the experience.

| Element | Proposed direction |
| --- | --- |
| Page background | Warm ivory, approximately #FAF9EF |
| Content surfaces | Off-white, approximately #FFFEFA |
| Text and important outlines | Deep charcoal, approximately #24251F |
| Primary accent | Warm yellow, approximately #FFD23F, with charcoal text |
| Confirmed/success | Deep green, paired with a text label |
| Pending | Amber indicator plus explicit Pending label |
| Typography | Manrope for English UI, Noto Sans SC for Chinese; verify the pairing in bilingual screen designs |
| Shape | 12–16 px corners for content; pill-shaped filter chips and selected actions |
| Borders | Clear thin outlines; stronger emphasis reserved for selected controls |
| Photography | Consistent nail-service crops with colour-accurate presentation |
| Motion | Short feedback transitions; respect reduced-motion preferences |

These values are starting proposals, not measured samples from the references or final validated tokens. Use readable secondary text and check contrast in the eventual screens. Avoid white text on the yellow accent. Use photos for nail styles rather than relying on names alone.

Phone layouts should use roughly 16 px horizontal margins, readable 16 px form inputs, and at least 44 px touch targets. Account for safe areas, the software keyboard, and longer Chinese/English labels. Display one language at a time with an accessible language switch.

The merchant interface shares the same visual system but uses denser appointment lists, fewer photos, and more direct actions. Desktop layouts gain columns and side navigation rather than stretching a phone screen.

## Customer experience

Proposed bottom navigation: Explore, Bookings, Messages, Account. Saved services can live within Account initially.

1. Optional visual nail-style selection, with a clear skip action.
2. Region selection using the simplified geographic map or equivalent text list; optional location permission and distance filtering.
3. Service results showing photo, service name, price, duration, merchant, area, and next requestable time. Label promoted results and retain filter relevance.
4. Service detail with portfolio examples, inclusions, extras, merchant policies, and a prominent availability action.
5. Availability selection: date strip followed by time slots on narrow phones, expanding to a multi-day grid when space permits. Display duration and buffers in actual availability calculations.
6. Request summary containing menu selection, time, price, policy acknowledgement, and optional message. The action reads Request booking rather than Confirm appointment.
7. Pending request screen and conversation. Approval unlocks the exact home-studio address and tracked WhatsApp/Call actions.
8. Booking history, cancellation, and review access after completion.

Browsing before sign-in is recommended; require sign-in when submitting a request. Customer-visible pending status remains truthful even if merchant access is restricted. Do not expose the merchant's allowance or imply that a pending request has been approved.

## Merchant experience

Proposed entry: Account → Become a nailist → application → manual platform approval → merchant workspace. Approved merchants can deliberately switch between customer and merchant views.

Proposed merchant bottom navigation: Today, Calendar, Messages, Business. Business contains menus, portfolio, promotions, customer records, insights, policies, and subscription settings.

Registration should be a resumable sequence: business type and details; location/service area; style expertise; photo menus and durations; opening hours and blocked dates; approval preference and policies; application review.

The merchant home screen prioritizes pending requests and today's appointments. Insights report service/profile views, click-through rate with a defined denominator, unique first-time requesters, approved appointments, and automatically completed appointments. Automatically completed is a system status, not verified attendance or verified revenue.

For restricted requests, display a generic New booking request notice and a subscription action. Do not send customer identity, time, service, message text, or contact details in notification previews, email, or unauthorized API responses. Keep existing approved appointments and their conversations accessible as a proposed preservation rule.

## Booking and allowance model

- Maintain separate booking status and merchant access status; subscription restriction is not a customer booking status.
- Normal lifecycle: pending → approved → automatically completed; cancellation and rejection are separate outcomes.
- Pending requests never become completed simply because their requested date passed.
- Recommended completion boundary: after the appointment's local calendar date has ended in Asia/Kuala_Lumpur. This operational interpretation still needs review before booking implementation.
- A first qualifying request records acquisition once for the merchant/customer pair. Repeat requests must not charge that pair again.
- A qualifying cancellation or rejection issues one replacement credit, exactly once. Repeated events or page refreshes cannot issue additional credits.
- Keep an internal acquisition/credit ledger. Merchant reporting can show acquisition results, but no exact remaining allowance or countdown.
- Administrators can change thresholds and pricing through a logged settings interface. Changes need explicit effective dates and must not rewrite historical charges or silently alter existing paid subscriptions.
- Once restricted, new requests remain pending regardless of the merchant's automatic-approval preference. Subscription restores access; recheck availability before any approval.
- Request submission and approval must be protected against duplicate submissions and overlapping confirmed appointments.

## Recommended technical stack

| Area | Recommendation | Purpose |
| --- | --- | --- |
| Web app | React + TypeScript + React Router framework mode + Vite | Phone-first app with server-rendered public service/profile pages |
| Styling | Tailwind CSS + Radix primitives | Custom Hotlah styling with accessible controls |
| Backend API | Hono on Cloudflare Workers | One API and business-rule layer for web and future apps |
| Relational data | Cloudflare D1 + Drizzle ORM | Accounts, profiles, menus, bookings, messages, acquisition credits |
| Photos | Cloudflare R2 | Separate image storage, optimized upload variants, cached delivery |
| Authentication | Better Auth with Google, Apple, Facebook | Established authentication library and role-aware sessions |
| Booking coordination | Durable Objects scoped by merchant | Serialize availability/approval decisions to prevent concurrent double booking |
| Background tasks | Cloudflare Queues and scheduled Workers | Retryable email delivery and automatic completion |
| Email | Resend | Booking and account notifications |
| Map | Geographic data simplified into an interactive SVG | Clickable region selection without a paid map-tile subscription |
| Later mobile delivery | Capacitor with a separately bundled client entry | Reuse React UI and call the same backend from Android/iOS |

React Router has an official Cloudflare deployment path. The public website should render service/profile content on the server for discovery and link sharing. Keep business logic behind an API so mobile clients do not depend on web-only server loaders. Sources: [Cloudflare React Router guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/), [Hono on Workers](https://hono.dev/docs/getting-started/cloudflare-workers/).

Tailwind supports responsive layouts, and Radix supplies unstyled accessible primitives; Hotlah's design will control their appearance. Sources: [Tailwind responsive design](https://tailwindcss.com/docs/responsive-design), [Radix introduction](https://www.radix-ui.com/primitives/docs/overview/introduction).

Drizzle documents D1 integration. Better Auth supports a Drizzle adapter and the requested social providers. Verify the exact pinned versions, D1 transaction compatibility, and account-linking behavior in an implementation spike before shipping login. Apple sign-in needs Apple Developer credentials. Sources: [Drizzle D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1), [Better Auth Drizzle](https://better-auth.com/docs/adapters/drizzle), [Google](https://better-auth.com/docs/authentication/google), [Apple](https://better-auth.com/docs/authentication/apple), [Facebook](https://better-auth.com/docs/authentication/facebook).

Use D1 for initial regional scope, with indexes and bounded queries. It has per-database limits; this is not a claim of unlimited scaling. Keep analytics events and photos from inflating the booking database, monitor query latency, and leave a deliberate migration path to PostgreSQL if relational size or write demand outgrows it. Migration will require work even with an ORM. Sources: [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Durable Objects](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/).

For launch, in-app messages and notification badges can refresh while the relevant screen is active. Add live WebSocket delivery when its value warrants the complexity. In-app notification does not promise background operating-system push; email remains the out-of-app channel in the initial scope.

Capacitor is my initial mobile recommendation because the release order is web, Android, then iOS. The server-rendered web build is not directly packaged: share UI and API code with a client-only native bundle, and implement native back navigation, keyboard handling, deep links, authentication callbacks, and notifications appropriately. React Native/Expo remains an alternative if later requirements demand native UI; it entails a separate presentation layer. Sources: [Capacitor](https://capacitorjs.com/docs), [Cloudflare's React Router build limitations](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/).

The region map requires licensed boundary data, simplification that preserves recognizable geography, and a text-list alternative. Region selection and distance calculation are separate: distance needs a coordinate origin. Geocoding choice is deferred to the map specification.

## Budget envelope

Published USD prices checked on 2026-09-21; JPY amounts below are budget allocations, not exchange-rate conversions or vendor quotes.

| Cost | Current reference |
| --- | --- |
| Workers paid baseline | USD 5/month, with usage charges beyond included amounts |
| D1 | Paid plan includes 5 GB plus query allowances; overages are metered |
| R2 Standard | Free tier includes 10 GB-month and operation allowances; internet egress is free |
| Resend | Free: 3,000 emails/month, limited to 100/day; Pro: USD 20/month for 50,000 emails |

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Resend pricing](https://resend.com/pricing).

Suggested monthly allocation within JPY 10,000: JPY 2,000 compute/data/storage; JPY 4,000 email; JPY 1,000 domain/monitoring reserve; JPY 3,000 contingency. Aim below the full budget during the pilot. This assumes modest traffic, optimized photos, indexed queries, and restrained notification frequency; actual spend depends on measured usage, taxes, and currency rates.

The free email tier is suitable for a pilot, but booking creation, approval, cancellation, and reminders can exhaust its daily limit quickly. Queue and retry delivery; do not let an email failure undo a booking. Budget alerts and usage controls are required because serverless billing is not a fixed monthly cap. Developer-program fees, paid ads, payment-processing fees, and labour are outside this hosting estimate.

## Review boundary

The first mobile discovery, service/availability, booking conversation, and merchant Today concepts have been generated and approved; see design/mobile-v1/README.md. Development has not started. Remaining flows and detailed layouts still need design, and the architecture proposal still needs review. Subscription amount, allowance threshold, map data, pending expiration, and payment-provider eligibility remain explicit later decisions.
