# T-036: Signature chart (recent vs baseline) on the Analytics tab, plus chart polish

- **Milestone:** W6 · **Depends on:** T-033, T-034, T-035 (all merged) · **Model tier:** strong (Codex Sol: query, chart and touch work)

## Goal

The top of the Analytics tab gets the signature "how am I doing lately" card, modelled on Apple Fitness's Training Load: a thick line for the last 7 days of hard sets, a thin line for the 28-day baseline, dots coloured by how far each day sits from the baseline, and a descriptive headline ("+12% · 7-day vs 28-day hard sets"). The owner can switch it from all training to one muscle. The same task tidies the chart text that T-034 and T-035 left rough.

## Read first

- `AGENTS.md`; `docs/DESIGN.md` → *Signature chart: recent vs baseline* (the full visual spec: line weights, diverging dot colours, ±10% neutral band, latest-point ring, descriptive headline, touch readout) and *Charts*.
- Core: `src/core/analytics/RecentVsBaseline.ts` (`recentVsBaseline`, daily cadence, 7 vs 28), `src/core/analytics/HardSets.ts` (`isHardSet`, primary 1 / secondary 0.5 weights), `src/core/queries/WeeklyMuscleVolume.ts` (how sets are read, grouped by local day with `src/core/support/localDate.ts`).
- App: `src/app/design/charts/*` (shared pieces from T-034: reuse them, extend them only where this brief says), `src/app/features/analytics/*` (T-035), `src/app/features/exercises/StrengthCard.tsx` and `strengthReadout.ts`, `src/app/format/`.

## Scope

- **Create:**
  - `src/core/queries/DailyHardSets.ts` (+ test): `dailyHardSets(database, { from, to, muscleId? }): SeriesPoint[]`, one point per local calendar day from `from` to `to` inclusive (YYYY-MM-DD), zero-filled. Without `muscleId`: each completed hard set counts once. With `muscleId`: fractional sets for that muscle (primary 1, secondary 0.5) exactly as `WeeklyMuscleVolume` counts them; reuse its helpers rather than re-deriving the weights.
  - `src/app/features/analytics/SignatureCard.tsx` (+ CSS module) and a pure `signatureReadout.ts` (+ test) for the headline and readout text.
  - Any small chart piece the card needs in `src/app/design/charts/` (for example `BaselineLine`, `ClassifiedDots`), each generic and documented.
- **Edit:**
  - `src/worker/WorkerApi.ts`: new block `// Signature chart (T-036)` with `dailyHardSets(from, to, muscleId?)`.
  - `src/app/features/analytics/AnalyticsScreen.tsx`: render the card above the weekly bars.
  - Polish (see below): `src/app/design/charts/chartScales.ts` (+ test), `StrengthCard.tsx` / `strengthReadout.ts` (+ test), `MuscleHistory.tsx`.
  - `docs/ARCHITECTURE.md` → *Concept ownership*: add a row for daily hard sets.
- **Do not touch:** other core analytics, migrations, other features.

## Specification

**Data.** The worker loads `dailyHardSets` from (range start − 34 days) to today, so the first visible day has a full 7 + 28-day history, then the card calls `recentVsBaseline(series, { cadence: 'daily' })` in the app and drops points before the range start. The 28-day baseline is shown scaled to 7 days (the function's `baseline` field), so both lines share one axis.

**Card layout (top to bottom).**
- Metric picker: a native `<select>` styled with tokens: "All training" (default) then the muscles in their stored order. Range chips: 1M · 3M (default) · 6M.
- Headline: latest `percentDifference` as "+12%" / "−8%" / "0%" in `--font-display`, then caption "7-day vs 28-day hard sets" (or "… Chest sets" for a muscle). When the latest percent is null: "—" and caption "Not enough history yet". Never verdict words.
- Chart, using the shared frame and scales: recent line 3 pt `curveCatmullRom`; baseline 1.5 pt in `--color-text-primary`, no dots; a dot on every recent point coloured by classification: within ±10% → `--color-text-secondary`; below → chart slot 1 (blue); above → chart slot 5 (magenta); intensity grows with distance (opacity from 0.45 at ±10% to 1 at ±50% or more). Latest point: 8 pt ring with a soft glow. Y axis starts at zero for this card (it counts sets).
- One-finger press-and-drag (reuse `TouchRule`): the headline area becomes "Tue, Oct 14 · last 7 days 18 sets · baseline 15.5 · +16%". Release returns to the headline.
- "Show as table": date, last 7 days, baseline, difference.
- Empty state (no hard sets in the loaded window): "Log a few workouts to see this chart."

**Polish (owner-visible rough edges found in review).**
- `chartScales`: make the y domain "nice" and put gridlines on round tick values (d3 `nice()` and `ticks(3)`), so labels read 105 / 110 / 115, not 103.3 / 112.7 / 122.1. Keep the non-zero domain for trend charts; allow callers to force a zero baseline (the signature card needs it).
- X labels: when the visible span is under ~3 months, label days ("Oct 5"); otherwise months ("Oct", with the year added on January or on the first label, e.g. "Oct 2026"). The current "Oct 26" reads like a date.
- Strength headline: round the trend to one decimal at most, and to the display unit's natural precision (kg: nearest 0.5; lb: nearest 1), e.g. "112.5 kg" not "112.55 kg". Use the existing formatter in `src/app/format/` if one fits.
- `MuscleHistory`: week labels as "Oct 26", not "2026-10-26".

Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Tests: `dailyHardSets` (zero-filling, local-day grouping across midnight with a pinned TZ, warm-up and incomplete sets excluded, fractional muscle counts, all-training counts each set once); `signatureReadout` text (positive, negative, null); `chartScales` nice ticks and forced zero; strength headline rounding.
- [ ] UI at 430 × 932, dark and light, with a synthetic history: card with all three ranges, a muscle selected, drag readout, table, empty state.
- [ ] ARCHITECTURE concept row added.

## Handoff

- **Status:** Implementation complete; verification passes. Ready for lead review, with the required browser checks still pending because the sandbox cannot run the app/browser. Changes are uncommitted per owner instruction; BOARD.md was not edited.
- **What was done:** Added zero-filled local-day hard-set queries and a worker method; placed the signature card above weekly volume, with all-training/muscle selection, 1M/3M/6M ranges, descriptive headline, two smooth lines, diverging dots, latest ring/glow, touch/keyboard inspection, loading/error/empty states and a table. Polished shared scale ticks/date labels, strength headline precision and muscle-history week labels. Added the concept ownership row.
- **Files touched:**
  - Core: `src/core/queries/DailyHardSets.ts`, `DailyHardSets.test.ts`.
  - Worker: `src/worker/WorkerApi.ts` (dedicated T-036 block).
  - Analytics UI: `SignatureCard.tsx`, `SignatureCard.module.css`, `signatureReadout.ts`, `signatureReadout.test.ts`, `AnalyticsScreen.tsx`, `MuscleHistory.tsx`.
  - Shared charts: `chartScales.ts`, `chartScales.test.ts`, `ChartFrame.tsx`, `ChartFrame.module.css`, `TouchRule.tsx`; new `ComparisonLines`, `ClassifiedDots`, and `ChartTable` components, each with a CSS module.
  - Strength UI: `StrengthCard.tsx`, `strengthReadout.ts`, `strengthReadout.test.ts`.
  - Docs: `docs/ARCHITECTURE.md` concept ownership; this Handoff only.
- **Public API:** `dailyHardSets(database, { from, to, muscleId? }): SeriesPoint[]` with YYYY-MM-DD endpoints, `DailyHardSetsOptions`, `DailyHardSetsError`; worker `dailyHardSets(from, to, muscleId?)`; `SignatureCard`, `signatureHeadline`, `signatureReadout`, `signatureDifferenceText`, `signatureSetsText`; chart `chartScales` optional `{ zeroBaseline }`, `chartDateLabels`, `ChartFrame` optional `signature`, `TouchRule` optional `label`, new `ComparisonLines`, `ClassifiedDots`, `ChartTable`; `strengthHeadlineText`.
- **Decisions taken:**
  - Daily grouping uses the workout start's local date and only finished workouts, matching WeeklyMuscleVolume, including imports without end/completion timestamps. All training also counts unmatched exercises; optional muscle counts call the existing `muscleVolume` helper, without duplicating weights.
  - Month ranges use calendar months with month-end clamping. Every request includes 34 prior civil days; the existing overlapping 7/28 windows are calculated before trimming. Missing days, including leading days, are explicit zeros as specified.
  - The task's select/range controls supersede the older design's scope chips. Signature plots use the design's weekly dashed vertical rules, in-plot date labels and no horizontal/y-axis labels. Other charts retain their horizontal grid with nice ticks.
  - Chart blue/magenta tokens are scoped in `ClassifiedDots.module.css` with DESIGN.md's exact dark/light palette because global `tokens.css` is outside scope and currently has no palette tokens. The lead can move them into global tokens later.
  - Strength rounding applies to the headline only (0.5 kg / 1 lb); session readouts and original set text retain their existing precision. Whole percentages use a typographic minus, and rounded negative zero is suppressed.
- **Open questions / left over:** Required visual/touch checks at 430 × 932 in dark/light remain pending: all three ranges, muscle selection, drag/release, table, empty/loading/error states, strength headline and muscle-history labels. `make dev` fails with `listen EPERM` on port 5173. Playwright's bundled browser is absent; installed Chrome aborts on launch; the computer-use browser host is unavailable. No visual verification is claimed. No other scope changes are needed.
- **How it was verified:** `make format`, then `make verify` passed (89 test files, 649 tests, including 16 new cases; lint, all TypeScript projects, production build/PWA precache). New cases cover zero-filling, pinned Riyadh midnight and Los Angeles DST transitions, hard-set exclusions, primary/secondary counting, all-training deduplication/unmatched exercises, invalid/reversed ranges, positive/negative/null headline and readout text, nice ticks/forced zero, short/long x labels and strength headline rounding. `git diff --check` is clean.
