# T-065: Muscle coverage and intensity sections for Analytics

- **Milestone:** W6 (analytics redesign) · **Depends on:** T-035/T-036 (weekly muscle volume, signature card) · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-064**, which rebuilds `AnalyticsScreen.tsx` with views and a period picker. **Don't edit any existing file under `src/app/features/analytics/`.** Build standalone components that take a date range; the lead wires them into the tab after both merge.

## Goal

Two research-backed views the owner can't get from Strong (`reports/Workout tracker app research.md` → *Muscle coverage* and *How hard versus how much?*, and section 12 formulas):

- **Muscle coverage:** how often each muscle is trained, which muscles have quietly dropped out, where focus sits (balance ratios), and which exercises produce a muscle's sets.
- **Intensity:** the rep ranges and closeness to failure of the owner's working sets, and how heavy relative to their strength, week by week.

Product rule: **measure, don't prescribe.** Descriptive labels only. Balance ratios have no ideal value, and the screen must not suggest one.

## Read first

- `AGENTS.md`; `docs/DESIGN.md` (charts: SVG drawn by React, `d3-scale`/`d3-shape` for the math, no chart framework); the research report sections named above.
- Core: `src/core/analytics/` (`HardSets`, `MuscleVolume`, `EffectiveReps`, `EstimatedOneRepMax`, `StrengthTrend`), `src/core/queries/WeeklyMuscleVolume.ts` and `DailyHardSets.ts` (Monday weeks, local dates, fractional sets), `src/core/library/Muscle.ts`, `MovementPattern.ts`.
- App: `src/app/features/analytics/MuscleBars.tsx` and `SignatureCard.tsx` (style to match), `src/app/design/components/` (BottomSheet, ToggleChip, Section, EmptyState).

## Scope

- **Create:**
  - core:
    - `src/core/library/MuscleProminence.ts` (+ test)
    - `src/core/queries/MuscleCoverage.ts` (+ test)
    - `src/core/queries/IntensityMix.ts` (+ test)
  - app:
    - `src/app/features/analytics/MuscleCoverage.tsx`, with small sub-components: `MuscleFrequencyList.tsx`, `NeglectedMuscles.tsx`, `BalanceRatios.tsx`, `MuscleExerciseShareSheet.tsx`
    - `src/app/features/analytics/AnalyticsIntensity.tsx`, with sub-components: `RepRangeBars.tsx`, `EffortHistogram.tsx`, `IntensityVolumeMap.tsx`
    - their CSS modules and tests
- **Edit:** the worker API (a new section, with your own methods only), docs (ARCHITECTURE rows, DECISIONS: one entry for the interpretations below).
- **Do not touch:** existing analytics files, migrations, existing formulas, other screens.

## Specification

1. **`MuscleProminence.ts`:**
   - `SMALLER_MUSCLES`, a frozen list: rotator-cuff, neck, serratus, brachialis, brachioradialis, tibialis, lower-traps, hip-flexors.
   - `isMainMuscle(muscle)`.
   - The owner's decision: smaller muscles stay secondary and must not crowd normal results. They're shown only behind a "Show smaller muscles" toggle.
2. **`MuscleCoverage(db, from, to)`**, over finished workouts and Monday weeks:
   - Per muscle:
     - mean weekly fractional hard sets
     - **frequency**: mean days per week on which that muscle's fractional hard sets that day total ≥ 1 (report §12; record the "≥ 1 fractional set per day" reading in DECISIONS)
     - days since last trained (the last day with any hard set for it as primary)
   - **Neglected:** main muscles with under 4 mean weekly fractional sets over the **last 4 weeks** ending at `to` (report: "under 4 sets per week over the last 2–4 weeks"), with days since last trained.
   - **Balance ratios** (report: descriptive only): whole hard sets per pattern group, A ÷ B:
     - horizontal push : horizontal pull
     - vertical push : vertical pull
     - knee-dominant (squat, lunge, knee-extension) : hip-dominant (hinge, hip-thrust, knee-flexion)
     - upper : lower (map every `MovementPattern` to upper, lower or neither in a frozen, documented table)
     - A side with zero sets gives no ratio, shown as "—".
   - **Exercise share** for one muscle: the exercises producing its fractional sets in the range, as a percentage of the muscle's total, largest first.
3. **`IntensityMix(db, from, to, muscle?)`**, over working (non-warm-up) sets of finished workouts; with a muscle, only sets whose exercise has it as primary:
   - **Rep-range mix** of hard sets: 1–5, 6–10, 11–15, 16–30 (report §12), plus "31+" so nothing disappears. Counts and shares.
   - **Effort distribution** of working sets with RPE logged: RIR 0, 1, 2, 3, 4, 5+ (RIR = 10 − RPE), plus a separate "not logged" count.
   - **Weekly intensity points** (report §12): per week, Σ fractional hard sets and the mean **relative intensity** of those sets (set weight ÷ that exercise's e1RM trend on that date × 100). Weight-and-reps exercises only; weeks with no qualifying sets are left out.
4. **`MuscleCoverage.tsx`** takes `{ from: Date; to: Date }`:
   - A **Neglected** list at the top ("Under 4 sets a week over the last 4 weeks"), or "None in the last 4 weeks".
   - A frequency list: each muscle with sets/week and days/week, main muscles only, with the toggle for smaller ones. Tapping a muscle opens `MuscleExerciseShareSheet`.
   - **Balance ratios** as "1.4 : 1" with the two set counts beside, and a one-line note: "No ideal ratio exists; this shows where your sets went."
5. **`AnalyticsIntensity.tsx`** takes `{ from: Date; to: Date }`:
   - Muscle filter chips at the top: **All training**, then main muscles.
   - Horizontal bars for the rep-range mix and the effort histogram (thin bars, 4px rounded ends, value labels in text colours, recessive axes; `docs/DESIGN.md` tokens).
   - The **intensity–volume map**: a scatter of weeks, x = weekly hard sets, y = mean relative intensity %, with the most recent week emphasised and a tooltip or tap readout "Week of 13 Oct: 14.5 sets, 78%".
   - Each chart has a "Show as table" alternative, like the existing volume table.
   - Empty states in plain text.
6. Works at 430 × 932 in dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests with small synthetic fixtures, hand-computed:
  - frequency per muscle and the ≥ 1 per day rule
  - neglected over the last 4 weeks, main muscles only
  - each balance ratio, and zero on one side → none
  - exercise share percentages summing to 100
  - rep-range buckets including 31+
  - RIR buckets and "not logged"
  - relative intensity against a known trend
  - unfinished workouts and warm-ups excluded
- [ ] Component tests: neglected list and empty text; smaller-muscle toggle; ratio text; muscle filter changes the intensity query; table alternative.
- [ ] Docs updated. Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
