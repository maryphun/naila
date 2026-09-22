---
name: Hotlah
description: A warm, professional visual system for a local nail-service marketplace.
colors:
  paper: "#faf9ef"
  ink: "#25251f"
  muted: "#68695f"
  line: "#dcded0"
  yellow: "#ffd331"
  green: "#17644e"
  yellow-hover: "#f7c91b"
  quiet-hover: "#eeeedf"
  pending: "#69551c"
  error: "#933529"
typography:
  display:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "52px"
    fontWeight: 750
    lineHeight: 1.16
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "23px"
    fontWeight: 730
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "17px"
    fontWeight: 750
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "14px"
    lineHeight: 1.7
  label:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "12px"
    fontWeight: 650
  button:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "13px"
    fontWeight: 750
    lineHeight: 1.5
  input-phone:
    fontFamily: "'Manrope Variable', 'Noto Sans SC', sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
rounded:
  slot: "8px"
  field: "10px"
  notice: "12px"
  card: "14px"
  dialog: "20px"
  pill: "100px"
  chip: "99px"
  circle: "50%"
spacing:
  gap-small: "8px"
  gap-control: "10px"
  inset-small: "12px"
  inset-medium: "16px"
  inset-card: "20px"
  gutter-phone: "22px"
  space: "24px"
  gutter-desktop: "40px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.yellow-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  button-text:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  button-icon:
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    width: "44px"
    height: "44px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  chip-selected:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "9px 18px"
  navigation-phone:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "9px 10px calc(8px + env(safe-area-inset-bottom))"
  service-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  availability-slot:
    textColor: "{colors.ink}"
    rounded: "{rounded.slot}"
    padding: "10px 0"
  status-pending:
    textColor: "{colors.pending}"
---

# Design System: Hotlah

## Overview

**Creative North Star: "Warm, professional simplicity"**

A minimalist, professional marketplace in warm ivory, charcoal and yellow. Manrope, fine outlines and natural nail photography give the interface a clean, approachable character. The approved direction is preserved across customer and merchant screens.

Surfaces are flat and restrained, with generous separation between groups and compact supporting metadata. Yellow identifies actions and selections; green communicates availability, confirmation and keyboard focus. This document records the implemented system, including the final responsive overrides in app/styles.css.

This phrase summarizes the approved direction; it is not an additional brand claim. Sources are PRODUCT.md, the approved concepts in design/mobile-v1/, app/styles.css, and the implemented React components. The frontmatter records reusable implemented values, which take precedence over approximate measurements in the earlier raster concepts.

**Key Characteristics:**

- Warm ivory canvas with fine charcoal outlines.
- Manrope typography with a Simplified Chinese fallback.
- Rounded controls, clear selection states and photography-led service cards.
- Phone-first interaction with usable desktop grids.

## Colors

A warm neutral foundation keeps service photography prominent, with a single yellow brand accent and functional status colors.

### Primary

- **Warm Yellow** (`yellow`): primary buttons, selected chips, active mobile navigation and selected appointment times.
- **Pressed Yellow** (`yellow-hover`): primary-button hover feedback.

### Neutral

- **Warm Ivory** (`paper`): page, card and dialog surfaces.
- **Charcoal** (`ink`): headings, principal text and defining outlines.
- **Quiet Olive Grey** (`muted`): supporting metadata and inactive states.
- **Soft Divider** (`line`): internal rules and quiet field outlines.
- **Quiet Hover** (`quiet-hover`): secondary and icon-button feedback.

### Functional colors

- **Confirmation Green** (`green`): availability, approved/completed states, caret and focus.
- **Pending Ochre** (`pending`): pending status text and its dot.
- **Error Rust** (`error`): field errors and alerts. Destructive text uses a closely related source value; retain its contextual styling.

**The Selection Rule.** Use yellow for primary actions and selected controls; keep normal reading surfaces quiet.

The sidecar's tonal ramps are synthesized inspection aids, not additional application tokens.

## Typography

Manrope Variable is bundled in app/root.tsx. Noto Sans SC is the declared Chinese fallback, followed by the platform sans-serif; it is not separately bundled. The voice is geometric, readable and restrained, with moderately heavy headings and compact metadata. The implementation uses role-specific sizes rather than a mathematical type scale.

- **Display:** discovery heading uses the frontmatter role on desktop, stepping to 58px above 1500px, 34px on phones and 29px below 360px.
- **Headline:** section titles use the headline role, with contextual 19–22px phone variants. General page headings use 42px desktop and 32px phone.
- **Title:** card and list headings use the title role; prominent service names use 19px.
- **Body:** descriptive paragraphs commonly use the body role; phone descriptions often use 12px. Other paragraphs retain their contextual 13–16px sizes.
- **Label:** fields and compact metadata use the label role. Buttons use their separate weight and line height.
- **Numbers:** availability and reporting use tabular numerals. Price emphasis comes from weight and scale.
- **Phone inputs:** form fields, search and message entry use the input-phone role. Search and composer placeholders remain smaller.

**The Phone Input Rule.** Editable phone fields use 16px text, even when their labels and placeholders are smaller.

## Layout

The product uses one phone interface at every viewport width. The application canvas is capped at 430px and centered on larger browser windows against a quiet neutral surround; it never expands into a desktop information architecture. Inside the canvas, horizontal gutters are 22px and reduce to 16px below 360px. Repeated gaps are commonly 8, 10, 16, 20 and 24px.

Service listings remain one column with a 23px row gap and a 1.55 image aspect ratio at every browser width. The style strip scrolls within the phone canvas instead of expanding the page.

Detail, conversation and merchant workspace layouts always stack. Booking actions and the message composer remain in normal flow. The mobile bottom navigation is the sole primary navigation on every browser width and is fixed to the centered phone canvas. The app reserves 85px below content, with safe-area padding inside navigation.

Forms generally use two columns, collapsing below 360px. Dialogs cap width at 520px and remain within the viewport with internal scrolling. Do not infer universal 44px sizing: frequent phone chips, save/send, header icon, language and location controls have the enlarged target, while some dense controls retain contextual dimensions.

## Elevation & Depth

The system is predominantly flat: outlines, light dividers and warm surface changes separate content. Cards have no resting drop shadows. Dialogs and toast notifications are the deliberate elevated exceptions.

**The Flat Surface Rule.** Cards use outlines and spacing for separation; shadows belong to transient overlays and notifications.

The sidecar records the actual dialog and toast shadows, overlay tint and short transitions. Service photography has a subtle hover zoom; buttons shift down by one pixel when pressed. Reduced-motion preferences disable animation, transitions and smooth scrolling.

## Shapes

Cards and main bordered panels use the card radius. Fields use a tighter radius, while primary/secondary buttons, search and chips form pills. Circular icon controls and avatars contrast with restrained rectangular content. Most structural borders are one pixel.

Messages use asymmetric corners to indicate direction. Dialogs use the larger radius, reduced to 17px on phones. Photographs are clipped within their container and use cover cropping. Thin outlined icons typically range from 16px to 24px.

## Components

### Buttons

Confident, compact pills. Primary and secondary share a charcoal outline, frontmatter padding and a 46px minimum height. Primary fills yellow; secondary stays transparent until its quiet hover. Buttons use a short background/transform transition and a one-pixel press translation. Disabled controls retain the source's reduced opacity and inactive cursor.

Text buttons use an underline offset by 5px and a 44px minimum height. Icon buttons center a simple outlined symbol in a circular target. Keyboard focus uses a green 3px outline with a 4px offset.

### Inputs / Fields

Quiet bordered fields with persistent labels and helper/error text. Desktop controls are at least 46px high. Phone field padding becomes 11px by 12px and editable text becomes 16px. Textareas start at 100px high and resize vertically. Search and chat use an enclosing charcoal pill with a green focus-within outline.

### Chips

Pill-shaped options with a fine neutral border. Selection adds yellow, a charcoal border and heavier text. Phone chips use 8px by 15px padding and a final 44px minimum height. Hover strengthens the border. Preserve semantic selected state through the actual control API.

### Cards / Containers

Photography-led service cards use a charcoal outline, rounded clipped edges and ivory background. The content hierarchy is style/duration, service name, merchant, location, next available request time and price/payment note. The image can zoom slightly on hover. Save is a separate accessible toggle; it fills yellow when selected.

Booking cards are horizontal bordered summaries with an image, written status, name, appointment and price. They use a gentle surface hover instead of elevation. Conversation details and subscription notices share the same outline vocabulary.

### Navigation

Desktop navigation is a compact header row; the active destination has a dark underline. Phones use four equal bottom destinations, each with an icon and visible label. A small yellow pill sits behind the active icon while text stays charcoal. Customer and merchant destinations change with context without changing the visual system.

### Availability and status

Availability is a tabular grid of quiet bordered time buttons with yellow selection and explicit disabled states. Desktop slots start at 40px high; phone slots at 43px. The grid scrolls vertically and keeps date headings visible.

Status badges combine a small dot with written text. Pending is ochre; approved/completed are green; cancelled/declined/expired are muted. Color alone must not communicate appointment state.

### Dialogs and feedback

Radix dialogs provide modal behavior, titles, close controls and optional descriptions. Ivory surfaces sit over a translucent charcoal overlay. Inline errors use rust text and a pale warm alert surface. Toasts use reversed ivory-on-charcoal text and remain above phone navigation.

## Do's and Don'ts

### Do:

- Do use the implemented paper, ink and yellow tokens across customer and merchant screens.
- Do keep editable phone inputs at 16px and preserve the enlarged frequent touch controls.
- Do show status in words as well as color.
- Do use real nail photography for merchant work and identify preview imagery and example content honestly.
- Do respect reduced-motion preferences and keep keyboard focus visible.

### Don't:

- Don't replace the approved restrained identity with mascots, gradients or ornamental effects.
- Don't present pending requests as confirmed appointments.
- Don't remove prices, location or availability from service comparison.
- Don't promote old mockup measurements over the final responsive CSS.
