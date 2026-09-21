# Hotlah

<!-- impeccable:product-schema 1 -->

Confirmed product record from the discovery conversation. The cream, charcoal, and yellow visual direction and first four mobile screen concepts are approved; see design/mobile-v1/README.md. Further screens and architecture recommendations in HOTLAH-PROPOSAL.md remain subject to review. Development has not been authorized for this phase.

## Platform

web

Responsive web first, followed by Android and then iOS. Phone usability is the priority; desktop browsers must remain fully usable. One product contains customer and merchant experiences, with additional registration and approval required for merchant access.

## Stack

The user normally uses React, Tailwind CSS, and Cloudflare and requested recommendations for this product. Final architecture is awaiting review. Operating budget: JPY 10,000 per month. Scalability matters.

## Users

- Customers looking for nail services in Kuala Lumpur and Selangor, Malaysia.
- Primarily solo nailists and small operators who need help attracting new customers.
- Shop-based, home-based, and mobile/home-service nailists are allowed. Merchants specify their type during registration.
- Platform administrators manually approve merchant applications and manage commercial settings.
- Multiple staff and branches are outside the initial scope.

## Product Purpose

Help customers discover suitable nearby nail services and send appointment requests; help independent nailists acquire first-time customers.

## Positioning

A local nail-service marketplace inspired by Hot Pepper's service menus and Tabelog's availability selection. Services lead discovery. Customers can return to book through Hotlah, but repeat business outside the platform is acceptable.

## Operating Context

- Launch geography: Kuala Lumpur and Selangor.
- Customer languages: English and Simplified Chinese.
- Prices and payments: MYR only; customers pay at the appointment.
- Platform usage is free for customers.
- Merchant policies govern cancellation and related appointment terms.
- Notifications: in-app and email.
- Sign-in providers: Google, Apple, and Facebook.

## Capabilities and Constraints

### Discovery and merchant presentation

- Start by asking customers about preferred nail styles; allow skipping and later editing.
- Prioritize available services and suggest nearby nailists.
- Support detailed style filters and require merchant categorization.
- Profiles include portfolios, photo-based service menus, prices, availability, reviews, and policies.
- Geographic selection uses a simplified but geographically accurate clickable KL/Selangor region map, with distance filtering.
- Home studios show only their neighbourhood publicly. Reveal the exact address to the customer after booking approval.
- Merchant registration includes business type, profile, services, photos, opening hours, availability, and platform review.
- Merchants can block time slots at any time.
- Promotions can improve placement. Promotions are free at launch and may become paid later.

### Requests, conversations, and appointments

- A customer chooses a service/menu item and requested time and can attach a message.
- In-app conversation starts when the booking request is submitted.
- Merchants choose manual or automatic approval; manual is the default.
- Customers can cancel requests/appointments under the applicable merchant policy.
- Booking history remains available.
- Merchants may supply their phone number. WhatsApp and Call actions become available to customers only after approval.
- Contact actions use tracked redirects. Contact clicks are leads/interactions, not independent proof of an appointment.
- Appointment completion is automatic after the booking date, rather than manually marked by the merchant. Exact scheduling boundary is still to be specified.
- Only completed bookings qualify for reviews.

### Merchant allowance and subscription

- Count each new customer's first booking request to a particular merchant toward that merchant's unique-customer allowance; completion is not the counting event.
- Repeat customers do not consume another unique-customer allowance.
- A cancelled or declined qualifying request remains recorded as counted, but grants one replacement allowance.
- Do not show merchants the exact remaining allowance.
- Thresholds and subscription pricing remain undecided and must be adjustable by administrators.
- Once the allowance is exhausted, customers may still submit requests.
- The merchant is notified of a new request but cannot view its details or respond until a credit-card subscription is confirmed.
- Automatic approval is suspended for these new requests; they stay pending while access is restricted.
- Existing customer history must remain available. The detailed boundary between previously accessible merchant bookings and newly restricted requests must be preserved in the implementation specification.

### Merchant reporting and administration

- Report customer acquisition, booking traction, and click-through rate.
- Support customer records.
- Keep contact clicks, booking requests, and completed appointments distinguishable in reports.
- Platform administrators manually approve merchants and control subscription settings.

## Brand Commitments

- Working product name: Hotlah.
- Minimalist, professional, clean interface.
- Five user-supplied mobile UI references show cream backgrounds, dark outlines, yellow accents, rounded controls, restrained layouts, and bottom navigation.
- Reference images are visual inspiration; pet illustrations, medical content, and AI-assistant features are not product requirements.
- Approved visual direction: warm cream backgrounds, charcoal text/outlines, yellow primary actions, rounded controls, professional typography, and nail photography.
- First mobile concepts approved: customer discovery, service/availability, pending booking conversation, and merchant dashboard. Files and approval context are in design/mobile-v1/.
- Exact measured colour values, font choices, and remaining screen compositions still require detailed design review.

## Evidence on Hand

- User-supplied screenshots in the conversation.
- Confirmed answers in this record.
- Repository initially contained only README.md and Git metadata; there is no existing application implementation to preserve.
- No real merchant profiles, reviews, portfolio photos, production credentials, or logo have been provided. Prototype data must be identified as examples.

## Product Principles

- Make services, prices, location, and availability easy to compare on a phone.
- Keep the customer experience prominent and merchant access deliberate.
- Make pending requests visibly different from approved appointments.
- Protect home-studio addresses until approval.
- Measure first-time acquisition separately from repeat business and contact clicks.

## Open Decisions for Later Specification

These do not prevent selection of the core design language or architecture; they must not silently become confirmed product requirements.

- Subscription prices, thresholds, activation date, and payment-provider eligibility.
- Pending-request expiration and notification timing.
- Exact automatic-completion boundary and treatment of disputed attendance/no-shows.
- Offline appointment entry, as distinct from blocking availability.
- Exact map boundary dataset and geocoding service.
- Final nail-style vocabulary and merchant verification evidence.
- Build workflow and final visual approval.
