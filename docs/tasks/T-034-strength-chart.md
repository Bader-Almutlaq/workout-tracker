# T-034: Strength chart on the exercise detail screen (and the shared chart building blocks)

- **Milestone:** W6 · **Depends on:** T-032 (merged) · **Model tier:** strong (Codex Sol: chart and touch work)

## Goal

Each exercise's detail screen gets an "Estimated 1RM" card: the smoothed trend as a line, each session's best estimate as a quiet dot, the latest value and change per week as the headline, and touch-and-drag to read any session ("Mar 4 · e1RM 121.5 kg · best 100 × 6 @ RPE 8"). It establishes the reusable SVG chart pieces the Analytics tab will use.

## Read first

- `AGENTS.md`, `docs/DESIGN.md` → *Charts* and *Signature chart: recent vs baseline* (marks, colours, touch, "no chart framework": SVG via React with `d3-scale` / `d3-shape`, both installed), *Units* (charts in kg; the readout shows both units).
- `src/core/queries/ExerciseStrength.ts` (`ExerciseStrength.series`), `src/core/analytics/StrengthTrend.ts`, `src/app/features/exercises/ExerciseDetailScreen.tsx`, `src/app/format/` (weight and date text), `src/worker/WorkerApi.ts`.

## Scope

- **Create:** `src/app/design/charts/` with small, generic, documented pieces: `useChartSize` (width from the container), `ChartFrame` (SVG with padding and the card background fade), `TrendLine`, `DotSeries`, `TouchRule` (pointer events: press-and-drag snaps a vertical rule to the nearest point and reports it; release clears), `chartScales.ts` (+ test). `src/app/features/exercises/StrengthCard.tsx` (+ CSS module) and a pure `strengthReadout.ts` (+ test).
- **Edit:** `ExerciseDetailScreen.tsx` (render the card above the recent sessions), `WorkerApi.ts` (block `// Strength (T-034)`: `exerciseStrength(exerciseId)`).
- **Do not touch:** `src/app/features/analytics/` (another task builds it in parallel), core.

## Specification

- Trend: 2 pt accent line (`curveMonotoneX`); sessions: 6–8 pt dots at 35% opacity; latest session: ring. Y axis does not start at zero; three quiet horizontal gridlines with labels in `--color-text-tertiary`, tabular digits. X: month labels.
- Headline: latest trend value in the exercise's display unit (big number, `--font-display`), then "+0.4% per week" (or "—" when null) in caption style. Descriptive only.
- Touch: one finger press-and-drag shows the rule and replaces the headline with the readout; the page must not scroll while dragging (`touch-action: pan-y` on the card, pointer capture on the SVG).
- Empty state when fewer than 2 sessions: "Log this exercise a few times to see a trend." Bodyweight and timed exercises: no card.
- Every chart has a "Show as table" toggle listing date, e1RM and best set.
- `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for scales and the readout text.
- [ ] UI at 430 × 932, dark and light, with an imported synthetic history of 8+ sessions: card, drag readout, table toggle, empty state.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
