# T-077: Personal strength curve, RPE chart and exercise progress (analytics level 1)

- **Milestone:** Analytics redesign (`docs/ANALYTICS.md`) · **Depends on:** T-032, T-034 · **Model tier:** high (Codex Sol)
- **Runs in parallel with T-078** (Analytics tab rebuild). T-078 owns `src/app/features/analytics/`, `TrainingSummary`, `IntensityMix`, `LiftTrends`, `MuscleCoverage`, any new migration, pins, `ExerciseActions.tsx` and a new `PercentOfMax.ts`. Don't edit those. Both tasks add methods to `src/worker/WorkerApi.ts`: add yours in one block with a `// Exercise progress (T-077)` comment so the lead can merge.

## Goal

Read `docs/ANALYTICS.md` first: it is the agreed design. This task builds level 1 (an exercise, alone or within one saved workout) and the strength maths under it.

The owner (2026-11-01): progress on one exercise should show several measures (estimated 1RM, the best estimated 1RM and the top set), not one number. Their RPE chart (RPE × reps → % of 1RM, the RTS chart) "is good information and should exist in the app". On estimating 1RM: "the chart is a guide; there are many ways; search for the best, maybe one for each exercise". The research report's answer is a personal curve per lift.

## Read first

- `AGENTS.md`, `docs/ANALYTICS.md`, `docs/ARCHITECTURE.md` (concept ownership), `docs/DESIGN.md` (charts), `reports/Workout tracker app research.md` → "The recommended algorithms, in one place" items 1–4 and the "RIR plugs in naturally" paragraph.
- Core: `src/core/analytics/EffectiveReps.ts`, `EstimatedOneRepMax.ts`, `StrengthTrend.ts` and tests; `src/core/queries/ExerciseStrength.ts`, `ExerciseSeries.ts`, `RepMaxTable.ts`, `TemplateSessions.ts`; `src/core/units/LoadableWeight.ts` (rounding to the load step).
- App: `src/app/features/templates/WorkoutExercisePage.tsx`; `src/app/features/exercises/ExerciseDetailScreen.tsx`, `ExerciseChartsTab.tsx`, `ExerciseChart.tsx`, `ExerciseRecordsTab.tsx`, `ExerciseRepMaxTable.tsx`, `ExerciseStrengthHeadline.tsx`; `src/app/design/charts/`.

## Specification

### A. Personal curve per lift (core)

1. New `src/core/analytics/PersonalCurve.ts`: report item 3. For one exercise's qualifying sets (item 1's rules: not warm-up, E ≤ 12, RIR ≤ 4; sets with no RPE count with RIR 2 at lower weight, as today), once there are **≥ 10 qualifying sets at ≥ 2 different effective-rep counts**, find `k_yours` that makes sets within the same 14-day windows agree best (minimise the spread of their e1RMs; a simple search over k = 8…50 in 0.5 steps is fine and deterministic). Blend: `k = (n × k_yours + 15 × k_start) / (n + 15)`, clamp to 8–50. Below the threshold return `k_start` (the existing lift-type value). Named constants with the citation.
2. `estimatedOneRepMax` takes the lift's k from this curve. Every caller (ExerciseStrength, LiftTrends, RepMaxTable predictions, progression, deload…) gets it through one place: no caller fits k itself. Exercises with no lift-type k (unmapped compounds) still return no estimate unless they have a personal k from enough sets.
3. Expose the curve for display: `{ k, kStart, personalSets: n, isPersonal }`.
4. Tests with hand-computed synthetic data: below the threshold returns k_start; a synthetic lifter whose sets follow k = 20 exactly yields k_yours = 20 and the blended value for n; clamping; sets without RPE weighted less; deterministic.
5. Record in `docs/DECISIONS.md` (personal k replaces "on hold" in PLAN W8; the RTS chart is shown as a guide, not used for the estimate) and add the concept to `docs/ARCHITECTURE.md` → Concept ownership.

### B. RPE chart (core + Records tab)

1. New `src/core/analytics/RpeChart.ts`: the RTS percentages as a frozen constant (RPE 10 → 5 in half steps, reps 1–15; value for E = reps + RIR read off one curve; half-RIR values average the neighbours, matching the owner's chart: 2 reps @ RPE 10 = 0.955, 1 rep @ RPE 9.5 = 0.9775, 8 reps @ RPE 8 = 0.739, 15 reps @ RPE 5 = 0.464). Cite the report ("Mike Tuchscherer's widely used RTS chart turns out to be exactly reps + RIR…"). A second function returns the lift's own grid: `percent = 1 / (1 + (E − 1) / k)` with the lift's personal k, and weights = e1RM × percent rounded to the lift's load step (`LoadableWeight`), in kg.
2. Records tab of an exercise (`ExerciseRecordsTab`): a section **RPE chart** under the rep-max table, with a segmented control **% · kg** (default kg when the lift has an e1RM, else %).
   - % view: the RTS grid (the guide), caption "Guide: RTS chart, the same for every lift".
   - kg view: the lift's grid, caption "From e1RM 145.4 kg · this lift's curve (learned from 46 sets)" or "(lift-type default)" below the threshold. Weights in the exercise's entry unit.
   - Rows RPE 10–5, columns reps 1–15 in a horizontally scrolling table with the RPE column sticky; cells with E > 12 muted. Readable at 430 px.
3. Tests: the four chart values above; kg rounding; the lift grid uses the personal k.

### C. Exercise progress query (core)

New `src/core/queries/ExerciseProgress.ts`, scoped to an exercise and optionally a saved workout (`templateId`):
- `sessions`: per finished session in scope, oldest first: date, workoutId, isDeload, best-set e1RM, top set (heaviest completed working set; ties → more reps) `{ weightKilograms, reps, rpe }`, working-set count, average RPE of completed working sets with RPE (null if none).
- `trendNow` (smoothed e1RM, item 4) and `bestEstimate` `{ value, date }` within scope.
- `changes` vs 4 sessions ago (latest non-deload vs 4th previous non-deload; null with fewer): e1RM %, top-set text before/after, working-set count before/after.
- `otherWorkouts`: saved workouts (id, name, weekday) that contain this exercise, for the compare chips.
Tests on a synthetic fixture: deloads skipped in changes; scope by template; ties for the top set; fewer than 5 sessions → null changes.

### D. Screens

1. **Exercise in a workout** (`WorkoutExercisePage`): tabs **Progress · History** (Progress default; the old Charts tab becomes Progress).
   - Tiles row: e1RM now (with change), best e1RM (date), top set last session ("+20 kg × 8 @ RPE 8", bodyweight lifts keep "+"). 3 tiles fit at 430 px.
   - Charts (existing chart pieces, one measure each, each with a one-line takeaway above): best-set e1RM per session, top-set weight, reps on the top set, working sets, average RPE. Deload sessions as yellow dots, excluded from takeaways. Tap a point → date and the session's top set (and a link to the session).
   - **Compare days:** chips under the e1RM chart for `otherWorkouts`; turning one on adds its e1RM series as a second line with a legend (at most 3 lines, categorical colours from `docs/DESIGN.md`).
   - Keep the machine filter where it exists today.
2. **Exercise page** (Exercises tab): its Charts tab uses the same Progress content with **By workout** chips (All · each saved workout containing it); "All" is today's behaviour.
3. Charts follow the chart rules in `docs/ANALYTICS.md`. Works at 430 × 932, dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests listed in A, B, C; existing e1RM, trend, rep-max and progression tests updated only where the personal k legitimately changes a value (say which in the report).
- [ ] App tests: Progress tiles and chart titles render; compare chips appear only with other workouts; RPE chart % and kg views and the muted cells.
- [ ] Docs: DECISIONS, ARCHITECTURE (concept ownership: PersonalCurve, RpeChart, ExerciseProgress), DESIGN (RPE chart table, Progress tab). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
