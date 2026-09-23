# Hotlah

A phone-first nailist marketplace for Kuala Lumpur and Selangor. Built as a working local MVP, with customer and solo-merchant experiences in one responsive web app.

Android test APK and Play Store app bundle build instructions are in [android/README.md](android/README.md).

## Run locally

Requires Node 22.13+ (Node 24 recommended) and pnpm. No live Cloudflare account is needed for the local preview.

```sh
pnpm install
cp .dev.vars.example .dev.vars
# Set DEMO_MODE=true, APP_URL=http://127.0.0.1:5173,
# and a long local-only BETTER_AUTH_SECRET in .dev.vars.
pnpm db:migrate
pnpm db:seed
pnpm dev
```

On Windows use `Copy-Item .dev.vars.example .dev.vars` in place of `cp`. The development server is http://127.0.0.1:5173. This workspace already has a local-only configuration and seeded database.

Use **Account → Local preview tools** to switch between fictional customer, merchant and administrator accounts. Merchant subscription restriction can be simulated under **Business → Local subscription preview**. This does not take payment. Demo login is restricted to localhost and disabled in the production configuration.

## Implemented

- Responsive customer discovery, skippable style preferences, search, style/shape/business-type/price filters, geolocation radius, saved services, and region selection using DOSM district outlines.
- Service photos, menu details, private-address handling, three-day availability table, booking request with a message, approval/decline, cancellation, history, in-app conversations, and completed-appointment reviews.
- Merchant application, manual admin approval, service/photo editing, business hours, unavailable time blocks, manual/automatic request approval, customer list, launch promotions, and reach/CTR reporting.
- Unique customer accounting per merchant; one cancellation/decline credit for the original acquisition; server-side locked-request redaction and action blocking. Exact remaining allowance is never returned to merchants.
- In-app notifications, durable email outbox with a Resend transport, automatic completion of approved appointments after the booking date (Malaysia time), and post-approval tracked call/WhatsApp actions.
- English/Simplified Chinese customer and merchant UI. Merchant-authored descriptions are not automatically translated; the admin workspace is currently English.

## Architecture

React Router SSR + React + Tailwind CSS, Radix dialogs and Lucide icons. A Cloudflare Worker serves the app and Hono API. D1 holds relational data; R2 holds uploaded photos. Better Auth uses Drizzle/D1 at the explicit `/api/auth` base path and is wired for Google and Facebook. Apple support remains conditional and is hidden unless Apple credentials are configured. A scheduled Worker processes completed appointments and email delivery. Chat uses modest foreground polling; no always-on server is required.

Booking counting, one-time credits and approval overlap checks run inside D1's write transaction using database triggers. Service details/prices are snapshotted when requested, so later menu edits cannot change existing bookings. Pending requests are not reservations; only approval reserves the slot. Unapproved requests remain pending. Past pending requests cannot be approved without a new request.

`server/api.ts` owns authentication/ownership checks. `server/domain.ts` owns privacy, availability and completion. `database/migrations` contains the schema and transactional invariants. `app` contains the responsive product UI. `DESIGN.md` records the implemented visual system.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm build
# Start pnpm dev first; the browser tests currently use installed Microsoft Edge.
pnpm test:e2e
```

Verified: 10 unit tests and 8 browser tests pass, along with type-checking and the production build. Unit tests cover invalid dates, availability buffers, privacy, unique-customer counting, cancellation credit, subscription locking, overlapping approvals, blocked times and review eligibility. Browser tests cover discovery/filtering/saving, request/chat/cancellation, locked direct API access, cross-origin rejection, configured-provider visibility, calculated availability, Chinese switching, region selection, the requested copy removals with preserved spacing, and horizontal overflow at 320/390/768/1440 px. Local test runs use fictional data and leave cancelled test bookings in history.

## Before a public launch

This is not deployed and is not yet production-ready. These are deliberate integration boundaries, not simulated live services:

1. Create the R2 bucket named `hotlah-media` (`pnpm exec wrangler r2 bucket create hotlah-media`). It is bound to the Worker as `MEDIA` and stores merchant-uploaded service photos. Confirm the production D1 database ID, then apply migrations remotely **without** the demo seed. The Worker custom domain and `APP_URL` are configured for `https://hotlah.site`.
2. Add `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, and `FACEBOOK_CLIENT_SECRET` with `pnpm exec wrangler secret put <NAME>`; never commit their values. Google and Facebook use `https://hotlah.site/api/auth/callback/google` and `https://hotlah.site/api/auth/callback/facebook`. Verify both with real accounts. Apple remains hidden and unconfigured until an Apple Developer Program account is available.
3. `hotlahmalaysia@gmail.com` is configured as the production administrator account. Connect a verified `hotlah.site` email sender and `RESEND_API_KEY`; exercise delivery/retry behavior. The Gmail address cannot be used as an arbitrary Resend sender. In-app notifications work locally. Native push and native Android/iOS apps are future work.
4. Decide merchant subscription pricing and connect a payment provider with verified signed, idempotent webhooks before enabling live billing. The API refuses live billing activation today. No checkout is faked; subscription access fields are reserved for that integration.
5. Verify merchant map pins and service-area coverage. Preview distances use approximate studio coordinates, not travel distance. New profiles need geographic validation before going public.
6. Add production anti-abuse controls/rate limits, image/contact-detail moderation (including QR codes and social handles), appropriate privacy/terms/consent flows, account recovery/deletion, monitoring, backups and an accessibility pass with real devices. Plain-text phone numbers and URLs are screened, but that does not replace moderation.
7. Verify Cloudflare/email usage and set spend alerts within the JPY 10,000/month budget. This build creates no paid resources and makes no guarantee about future usage cost. Keep discovery geographically limited at launch; add pagination/server filtering before the catalogue grows large.

Promotion is a labelled, free-at-launch menu feature, not a payment product. Call/WhatsApp clicks are engagement events and never treated as verified bookings. Direct contact is only available after approval.

## Assets and geography

The four nail photographs are AI-generated illustrative demo assets, not real merchant portfolios. Exact prompts are preserved in `design/asset-provenance.json`; generated WebP files are in `public/images`. The original approved screen concepts remain in `design/mobile-v1`.

District outlines derive from [DOSM Malaysia's administrative district GeoJSON](https://github.com/dosm-malaysia/data-open/blob/main/datasets/geodata/administrative_2_district.geojson). `scripts/prepare-map.mjs` builds the local vector map from the retained source. Geographic outlines are for discovery, not navigation, surveying or legal boundary decisions.
