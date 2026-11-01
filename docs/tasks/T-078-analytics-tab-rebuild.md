# T-078: Analytics tab rebuild: pins, overview, strength, muscles, effort (analytics level 4)

- **Milestone:** Analytics redesign (`docs/ANALYTICS.md`) · **Depends on:** T-035, T-036, T-064, T-073 · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-077** (personal strength curve, RPE chart, exercise progress). T-077 owns `src/core/analytics/EstimatedOneRepMax.ts`, `StrengthTrend.ts`, new `PersonalCurve.ts`, `RpeChart.ts`, `ExerciseProgress.ts`, `ExerciseStrength.ts`, `ExerciseSeries.ts`, `RepMaxTable.ts`, the exercise pages and `WorkoutExercisePage`. Don't edit those; call their existing functions (T-077 changes e1RM values underneath without changing their signatures). Both tasks add methods to `src/worker/WorkerApi.ts`: add yours in one block with a `// Analytics tab (T-078)` comment.

## Goal

Read `docs/ANALYTICS.md` first: it is the agreed design (section "4. Analytics tab"). The owner's review of today's tab (2026-11-01): the Overview chart couldn't be understood, Time / week is useless (they want typical workout length), the Muscles tab is "a dump of text, not a dashboard", balance ratios and the bubble chart weren't understood, and "Time / week 87h 17m" and "133% of est. 1RM" are wrong. They liked the period chips, the rep-range bars and the RIR bars, and want RPE alongside RIR and % of 1RM too. They want pinned lifts (Squat, Bench, Deadlift) at the top, like pinned messages.

## Read first

- `AGENTS.md`, `docs/ANALYTICS.md`, `docs/DESIGN.md` (charts, tokens), `docs/DATA.md` (migrations, backups), `docs/ARCHITECTURE.md`.
- App: everything in `src/app/features/analytics/`; `src/app/design/charts/`; `src/app/features/exercises/ExerciseActions.tsx`; the Workout tab's active plan card (`src/app/features/templates/PlanCard.tsx`, `TemplateCatalog`).
- Core: `TrainingSummary.ts`, `IntensityMix.ts`, `LiftTrends.ts`, `MuscleCoverage.ts`, `WeeklyMuscleVolume.ts`, `DailyHardSets.ts`, `TemplateSessions.ts` (`SessionDurationLimits`), `HardSets.ts`, `MuscleVolume.ts`, `src/core/db/migrations.ts` (last is `v13-donkey-calf-raise-weighted`), backup validation in `src/core/backup/`.

## Specification

### Core

1. **Typical length:** `TrainingSummary` returns `typicalSessionSeconds`: the median duration of finished workouts in the window, ignoring those over `SessionDurationLimits.maximumSeconds` (reuse it; don't add a second limit). Drop `secondsPerWeek` and `volumePerWeek` if nothing else uses them. Add `averageRir` and `rirNotLogged` (completed working sets; RIR = 10 − RPE) so the tile and the previous-period change work. Regression test: one 3-day "open" workout doesn't move the typical length.
2. **% of 1RM of a set:** new `src/core/analytics/PercentOfMax.ts`: weight ÷ the lift's e1RM on that date, where the reference is the larger of the smoothed trend at that date and that session's best e1RM, so a value never exceeds 100%. Use `ExerciseStrength.series` for the trend. `IntensityMix` uses it for a new `percentOfMax` distribution (buckets `<60%`, `60–70`, `70–80`, `80–90`, `≥90%`) and drops the per-week intensity map. Regression test: a set heavier than the lagging trend reads ≤ 100%. Effort buckets keep RIR and gain the RPE label.
3. **Weekly effort:** a weekly series of hard sets and average RIR for the window (reuse `WeeklyMuscleVolume`/`TimeBuckets` week rules) for the "sets and effort" pair of charts, optionally filtered by muscle.
4. **Strength ranking:** extend `LiftTrends`: each lift's trend now, change over the period, sparkline values, and `weeksSinceBest` (weeks since its last new best e1RM); plus the **median change** across lifts with a change. Lifts need ≥ 2 sessions in the window. A lift is "no new best in 6 wk" when `weeksSinceBest ≥ 6` (named constant, `Heuristic:` reason).
5. **Muscles table:** new query (or extend `MuscleCoverage`) returning per muscle for the window: average fractional sets per week, strength change (median e1RM change of exercises where it is primary, from the ranking above), average RIR of its direct sets, and the existing exercise shares. One window for everything (fixes "Not trained in this period" using 4 weeks while the period said 12).
6. **Muscle detail:** weekly fractional sets for one muscle over the window, its exercise shares, its exercises' strength rows, and its rep-range and effort mix (reuse `IntensityMix` with the muscle filter).
7. **Pins:** migration `v14-pinned-exercises`: `pinnedExercise (exerciseId INTEGER PRIMARY KEY REFERENCES exercise(id) ON DELETE CASCADE, position INTEGER NOT NULL, pinnedAt TEXT NOT NULL)`. Store functions pin, unpin, reorder (move up/down), list. Included in backup and restore validation and the merge of exercises (a merged exercise keeps its pin). Document in DATA.md. Tests: migration, cascade, backup round trip, merge.
8. Remove core code used only by removed screens (signature/recent-vs-baseline UI query if nothing else uses it, balance ratios, coverage "neglected" text inputs) after checking no other screen uses it. Keep `RecentVsBaseline` if the core still uses it elsewhere.

### Analytics tab (one scrolling page; remove the Overview / Muscles / Intensity tabs)

In this order:
1. **Pinned lifts:** 2-column cards: lift name, e1RM now (entry unit), change over the selected period, sparkline. Tap → the exercise page. Long-press or a ⋯ on the card: Unpin, Move left/right. Empty state: "Pin lifts from an exercise's ⋯ menu." with one-tap suggestions for Squat (Barbell), Bench Press (Barbell) and Deadlift (Barbell) when they have history. The exercise page ⋯ (`ExerciseActions.tsx`) gets **Pin to Analytics** / **Unpin from Analytics**.
2. **Active plan row:** when a plan is active: "<plan name> · week N · Plan analytics ›" (N = weeks since its first session) linking to the plan page's Analytics tab (`?tab=analytics`). Hidden without an active plan.
3. **Period chips** (keep `PeriodChips`), applying to everything below the pins (pins use the period for their change).
4. **Overview tiles** (2 × 2): Workouts / week; Typical length ("62m", "1h 05m"); Hard sets / week; Average effort ("1.8 RIR", small "RPE 8.2"); each with "+4% vs previous 12 weeks" as today.
5. **Strength:** takeaway "Median change across 14 lifts: +3.1% over 12 weeks", then rows ranked by change (name, sparkline, e1RM, coloured change), "no new best in 6 wk" in muted text under the name. Show 8, then "Show all". Tap → exercise page.
6. **Muscles:** table: Muscle · Sets / wk (number + small bar) · Strength (± %) · Effort (RIR). Sorted by sets; rows under 4 sets/week muted; main muscles first with "Show smaller muscles". Tap → **muscle page** (new route, e.g. `/analytics/muscles/:muscle?period=12w`) with: weekly sets bars, exercise shares (name, sets, %), its lifts' strength rows, rep-range bars and effort bars for that muscle.
7. **Effort and reps:** rep-range bars (keep); effort bars labelled "1 RIR · RPE 9"; % of 1RM bars; then **Weekly hard sets** (bars) and **Weekly effort** (average RIR line), two charts on the same weeks with deload weeks marked yellow.

Every chart follows the chart rules in `docs/ANALYTICS.md` (title says what a mark is, one-line takeaway, legend for two series, one scale, table view). Remove: Time / week and Volume / week tiles, `SignatureCard` and its readout, the Workouts per week chart, Muscles paragraphs (`NeglectedMuscles`, the not-trained line), `MuscleFrequencyList`, `BalanceRatios`, `IntensityVolumeMap`, `WeekChips` if unused, and their tests and CSS. Works at 430 × 932, dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests for 1–7 as listed (median length with an outlier; % of 1RM ≤ 100; weekly effort; ranking order, median and weeks since best; muscles table window; pins migration/backup/merge).
- [ ] App tests: tab order of sections, pins empty state and suggestions, pin/unpin from the exercise ⋯, plan row hidden without an active plan, muscles table sorting and muted rows, muscle page sections, removed components gone.
- [ ] Docs: DATA (v14, backup), DECISIONS (removals, typical length, % of 1RM reference), DESIGN (Analytics tab layout), ARCHITECTURE (PercentOfMax, pins). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Core item 1 was committed before this round. This round adds v14 exercise pins, pin ordering and merge transfer, backup coverage, percentage-of-max buckets, weekly effort, expanded lift ranking, muscle dashboard/detail queries and worker methods. The existing screens still consume the old intensity and muscle-coverage interfaces, so those older queries are retained until the UI round. No screen changes were made. The percentage calculation uses the set load as a lower bound when neither qualifying estimate reaches that load, to preserve the requested 100% ceiling. Weekly muscle detail clips partial weeks to the selected dates. Pins preserve the target's existing pin when both exercises are pinned during a merge.

Remaining review: verify the new ranking and detail against the design, and remove obsolete screen-only analytics when the UI is replaced. Changes remain uncommitted.
