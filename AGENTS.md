# AGENTS.md

Project-specific guidance for AI coding agents.

<!-- ASTRYX:START -->
Astryx v0.6.2 · 164 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing, page frame included.
- Frame first: read `astryx docs layout` before writing any page or screen — page frame, region widths, breakpoint behavior.
- Dense data = rows (Table, List/Item), never Card-wrapped list items; Card is for standalone widgets. Status = StatusDot/Token; Badge = counts only.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent belongs in the theme (`astryx theme list` / `theme add <slug>`, or `astryx theme template` for a custom one) — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   164 components by category
  template --list    page + block recipes
  docs <topic>       browser-support, cli-integrations, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any Astryx or integration dependency bump
<!-- ASTRYX:END -->

## Testing and verification

Be economical with tests and command execution.

- Do not run the full test suite after every change.
- For small UI, styling, animation, copy, or layout changes, do not run unit tests unless the changed code has relevant tests or there is a meaningful regression risk.
- Prefer the smallest relevant verification command.
- Batch related changes before running tests.
- Do not repeatedly run the same test command unless code affecting that test has changed.
- Do not run expensive integration/E2E tests automatically for routine UI work.
- Run the full test suite only when:
  - explicitly requested,
  - making substantial logic/refactoring changes,
  - changing shared infrastructure,
  - or before finishing a sufficiently large/risky task where full verification is justified.
- For frontend visual changes, prioritize type checking, linting, or a build when appropriate instead of exhaustive unit testing.
- If verification would be disproportionately expensive relative to the change, skip it and briefly state what was not run.

## Command efficiency

Minimize unnecessary terminal commands and token usage.

Think through the implementation before executing commands.
Inspect relevant files first, make related edits together, then verify once.

Do not use tests as a substitute for reasoning about the code.
Avoid exploratory command loops when the implementation can be determined directly from the existing codebase.
