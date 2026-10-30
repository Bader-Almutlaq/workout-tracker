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

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
