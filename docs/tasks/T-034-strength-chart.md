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

- **Status:** Implementation complete; live UI acceptance remains unverified. Changes are uncommitted, per assignment; BOARD.md is unchanged.
- **What was done:** Added the Estimated 1RM card above recent sessions for weight-and-reps exercises. It shows the worker's trend, session dots and latest ring, display-unit headline and weekly change, kg axes, snapped drag readout in both units, keyboard inspection, a session table, and loading/error/insufficient-history states.
- **Files touched:** Created `src/app/design/charts/{useChartSize.ts,ChartFrame.tsx,ChartFrame.module.css,TrendLine.tsx,DotSeries.tsx,TouchRule.tsx,chartScales.ts,chartScales.test.ts}` and `src/app/features/exercises/{StrengthCard.tsx,StrengthCard.module.css,strengthReadout.ts,strengthReadout.test.ts}`; edited `ExerciseDetailScreen.tsx`, `src/worker/WorkerApi.ts`, and this Handoff.
- **Public API:** `exerciseStrength(exerciseId): Promise<ExerciseStrengthSeries>` in its own Strength (T-034) worker block; `StrengthCard({ exerciseId, unit })`; reusable chart components/hook, `ChartPoint`, `ChartScales`, `ChartLayout`, `chartScales`, `nearestChartPoint`; pure `strengthReadout`, `strengthBestSetText`, `strengthWeeklyChangeText`.
- **Decisions taken:** Used T-034's specific monotone accent line/horizontal grid spec over the general signature-chart treatment. All analytics stay in the existing core query. The chart and e1RM table stay in kg; the headline and best set use the exercise's display unit; inspection shows e1RM in both units. Core sessions are daily maxima, so two qualifying days are required. Calendar keys are formatted in UTC to preserve the phone-local day already chosen by core. The card has `touch-action: pan-y`; its SVG hit rectangle uses `touch-action: none` and pointer capture so a drag cannot become page scrolling. Arrow keys inspect, Escape/blur clears. Sparse histories still offer the table when one session exists.
- **Open questions / left over:** Required visual/interaction checks at 430 × 932 in dark/light with an imported synthetic history of 8+ sessions remain for review: card, drag/release/cancel, table, loading/error and empty states, plus bodyweight/timed suppression. This sandbox denied the dev server's listening socket (`listen EPERM 0.0.0.0:5173`); browser discovery reported the access host unavailable, Chrome computer use was rejected as not approved, and CoreSimulator services were inaccessible. No screenshot or live touch verification is claimed. The lead should add shared chart ownership to ARCHITECTURE.md if desired; that file is outside this task's scope.
- **How it was verified:** `make format`, then `make verify` passed: formatting, ESLint, strict TypeScript, 86 test files / 629 tests (14 new), production build and service-worker generation. New tests cover scale domains/ranges, flat/empty/invalid data, outlier visibility, resizing, nearest-point/tie/edge snapping, both unit orders, calendar-day stability, missing/half-step RPE, shared weight snapping, and weekly rates including null/negative zero. `git diff --check` passed. No core, analytics-tab, board or git metadata changes.
