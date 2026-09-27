---
target: booking calendar and scheduling section
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\phunm\\OneDrive\\Documents\\GitHub\\naila\\app\\components\\booking-schedule.tsx"
target_fingerprint: "sha256:0f4c84bda60ca1a50ff2ea6c16a8e421bcb38449a74da164039d6facd631a5aa"
target_path: "C:\\Users\\phunm\\OneDrive\\Documents\\GitHub\\naila\\app\\components\\booking-schedule.tsx"
timestamp: 2026-09-26T16-10-51Z
slug: app-components-booking-schedule-tsx
closed: true
---
Method: dual-agent (A: /root/design_review · B: /root/evidence_review)

# Booking calendar and scheduling critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | The chosen date, time, price, and Request state update clearly, but the time picker does not consistently expose its available half-hour starts on first open. |
| 2 | Match between system and real world | 2/4 | A 12-hour analog dial makes a finite list of appointment starts feel like free-form time entry. |
| 3 | User control and freedom | 2/4 | Selecting a date automatically opens a modal after availability loads, changing context before the user explicitly asks to choose a time. |
| 4 | Consistency and standards | 2/4 | The clock's pink/mint surfaces diverge from the service page's ivory/yellow/charcoal language. |
| 5 | Error prevention | 3/4 | Unavailable hours, disabled dates, and a disabled Request action prevent many invalid choices; the calendar does not distinguish a working day from a day with open slots. |
| 6 | Recognition rather than recall | 2/4 | Half-hour options and the chosen date/time zone are not always visible together inside the picker. |
| 7 | Flexibility and efficiency | 1/4 | Users may need to hunt through hours or dates to find an available start. |
| 8 | Aesthetic and minimalist design | 3/4 | The numbered two-step flow is legible, though the calendar retains a large blank lower area at mobile width. |
| 9 | Help users recover from errors | 2/4 | Empty-day and time-selection messages give a next step; end-to-end submission could not be verified in this local environment. |
| 10 | Help and documentation | 2/4 | Dimmed-day and payment explanations are present, but cancellation policy is away from the final Request decision. |
| **Total** | | **22/40** | **Acceptable; appointment-time selection is the main friction.** |

## Design Specificity Verdict

The service page feels authored for Hotlah: nail imagery, warm ivory surfaces, yellow emphasis, and pay-at-appointment reassurance reinforce its identity. The scheduler becomes more category-interchangeable at the analog clock. Its pink/mint styling and generic dial model do not express Hotlah's compact, direct booking pattern.

The deterministic detector returned `[]`: **0 findings**, no rule names or file locations, and no false positives to discard. This mechanical result does not negate the runtime observations. No reliable user-visible issue overlay was created: browser script injection was unavailable, so screenshots, accessibility-tree inspection, read-only DOM checks, and source review were the fallback signals.

## Overall Impression

The two-step schedule is easy to understand until the user reaches the time picker. The highest-value change is to make actual available appointment starts visible immediately, with the date and time zone in the same decision surface.

## What's Working

- The `01 Choose your day` / `02 Choose a start time` sequence, disabled Request action, and selected-date summary make progress understandable.
- The price and pay-at-appointment reassurance remain near the booking action, reducing uncertainty about payment.
- The calendar and schedule stay within the intended centered mobile canvas at both 390 px and 1280 px without horizontal overflow.

## Priority Issues

1. **[P1] Available half-hour starts are not reliably visible on first picker open.** At 390 px, one fresh run showed no `.booking-clock-starts` section in the modal or accessibility tree, although another run exposed the `:00`/`:30` choices after tapping an hour. The code injects those choices into a third-party clock with a `MutationObserver`, disables automatic minute switching, and hides the minute UI in CSS (`app/components/booking-schedule.tsx:67-132`; `app/styles.css:53-59`). This makes a common booking task feel like hour-hunting and leaves the initial path to half-hour appointments unclear. **Fix:** show real available starts as first-class, immediately visible choices; keep date and Malaysia time in that picker. If the clock remains, do not depend on post-open DOM insertion to reveal the only minute choices. **Suggested command:** `$impeccable clarify`.
2. **[P2] An enabled calendar day is not necessarily bookable.** The calendar enables days from working-day rules, while availability is fetched only after the user chooses one; the fetch then auto-opens the clock when slots exist (`app/components/booking-schedule.tsx:171-218`). This can send users into an empty-day detour, while a successful fetch unexpectedly opens a modal. **Fix:** distinguish available dates from merely working dates when the data supports it; otherwise state that dates must be checked, and let the user explicitly open the time picker after the result appears. **Suggested command:** `$impeccable clarify`.
3. **[P2] The clock is a visual detour from the Hotlah system.** The modal uses bespoke blush and mint variables (`app/styles.css:49-60`) against the surrounding ivory, neutral outlines, charcoal text, and yellow action color. It reads like a different product at the most consequential step. **Fix:** bring picker surfaces, active selections, and borders back to the existing Hotlah tokens while retaining clear selected/disabled contrast. **Suggested command:** `$impeccable colorize`.
4. **[P2] Booking terms are too far from the commitment moment.** The service policy is behind `Before you book` higher on the page (`app/routes/service.tsx:79`), while the schedule's footer and review emphasize price, date/time, and no immediate payment. A first-time customer may request without seeing the relevant cancellation condition. **Fix:** put a short policy summary or direct policy disclosure beside the final Request/review action, without repeating the full policy wall. **Suggested command:** `$impeccable clarify`.

## Persona Red Flags

- **Jordan, first-time customer:** selects a date, then lands in a dial where the advertised half-hour starts may not be visible until an hour is tapped; the Request action alone does not explain whether a booking is confirmed or pending approval.
- **Casey, hurried mobile customer:** an enabled date can require a network check and yield no times; the automatic modal opening interrupts scanning for a better day.
- **Sam, keyboard or screen-reader customer:** in one initial modal state, the accessibility tree had no start-choice buttons. The scripted insertion needs a reliable announcement and focus path, not just a visible option after pointer interaction.

## Minor Observations

- The mobile calendar leaves a sizable empty lower region after the last week, pushing step 02 and Request farther down.
- Dimmed dates are pale, but their explanatory note directly below the calendar helps interpret them.
- A 320 px viewport remained within the intended mobile layout in the visual review.
- The local sign-in step could not be exercised because the development environment lacks `BETTER_AUTH_SECRET`. This is a test limitation, **not** evidence of a production booking outage or a P0 issue.

## Questions to Consider

- If the API already knows the open starts for a date, what does the analog clock add over direct appointment-time buttons?
- Should users see the next few genuinely available dates before choosing a calendar square?
- What is the shortest policy sentence a customer needs beside the final Request action?
