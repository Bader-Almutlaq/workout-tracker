# T-045: Finish screen: compared with last time, and personal bests

- **Milestone:** wave 2 · **Depends on:** none (no schema change; parallel with T-043) · **Model tier:** mid-strong (Codex Terra, high)

## Goal

When a workout ends, the owner sees how it compares with the last time they did that workout, and any personal bests set today, as plain descriptive lines. No confetti, badges or streaks (product rule). The same bests show on the workout in History. Spec: `docs/design/PROPOSALS.md` §3.

## Read first

- `AGENTS.md` (measure, don't prescribe; no celebrations), `docs/design/PROPOSALS.md` §3.
- Core:
  - `src/core/analytics/EstimatedOneRepMax.ts`, `EffectiveReps.ts` and the qualifying-set rules (reuse; don't re-derive)
  - `src/core/queries/WorkoutHistory.ts` and `countWorkoutSets`
  - `src/core/queries/PreviousPerformance.ts`
  - `src/core/models/*`
- App: `src/app/features/workout/SavedWorkoutSummary.tsx` (finish summary), `src/app/features/history/WorkoutDetailScreen.tsx`, `HistoryScreen.tsx`, `src/app/format/`.

## Scope

- **Create:**
  - `src/core/queries/PersonalBests.ts` (+ test)
  - `src/core/queries/WorkoutComparison.ts` (+ test)
  - small app components for the two finish-summary sections, plus a "Personal bests" section in the workout detail
- **Edit:** the finish summary, workout detail, History rows (a quiet "2 bests" caption when > 0), `WorkerApi.ts` (block `// Bests and comparison (T-045)`), `docs/ARCHITECTURE.md` concept rows.
- **Do not touch:** charts, analytics screens, migrations, logging write paths, backup, import, measurements.

## Specification

**Which sets count:** completed sets that aren't warm-ups (working, drop, failure), on exercises tracked as weight × reps. Timed or bodyweight-only tracking is skipped for now.

**Personal bests** for a workout W, per exercise, compared with every **earlier** finished workout (by start time). The first ever session of an exercise sets no bests.
1. **Best e1RM:** the highest e1RM among W's qualifying sets beats the previous highest, using the existing e1RM function and qualifying rules.
2. **Heaviest weight:** the highest weight beats the previous highest.
3. **Rep bests:** for each rep count N from 1 to 12, the heaviest weight lifted for at least N reps beats the previous heaviest for at least N reps. Report only the highest N per weight, so one set yields at most one rep-best line.
4. **Best set volume:** weight × reps of one set.
5. **Best session volume** for that exercise (sum over its qualifying sets).

For each best, report the exercise, the kind, the new value, the previous value, and the set that did it.

`personalBestsForWorkout(db, workoutId)` returns them for the finish screen and workout detail. `personalBestCounts(db)` returns workoutId → count for History, computed in one pass over the history (sets ordered by time), fast enough for 1,000 workouts and 25,000 sets. Add a test with a 1,000-workout synthetic history that finishes in well under a second in Node.

Weights compare in kilograms with a 0.01 kg tolerance, so 61.23 kg (135 lb) equals 61.23.

**Comparison with last time:**
- "Last time" means the most recent earlier finished workout with the same `templateId`. Without a template, the most recent earlier finished workout with the same name. Otherwise none.
- Report:
  - duration
  - working sets (warm-ups excluded, via `countWorkoutSets`)
  - volume
- Per exercise present in both, the top set (heaviest weight, then most reps) then → now, and its e1RM then → now.
- Exercises new today or missing today are listed by name.

**Text** (pure helpers with tests): descriptive and signed.
- "Volume 8,420 kg (+6%)"
- "Bench Press (Barbell): 100 × 8 → 102.5 × 8"
- "Best e1RM · Bench Press (Barbell) · 131 kg (was 128.5)"
- "Rep best · Squat (Barbell) · 140 kg × 5 (was 137.5 kg × 5)"

Weights use the exercise's display unit and existing formatters.

**UI:**
- The finish summary gets two sections below the totals: **Compared with last time** (when available) and **Personal bests** (when any). Plain rows, no icons beyond the existing style.
- Workout detail: a **Personal bests** section.
- History list: a "2 bests" caption.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] PersonalBests tests with hand-computed examples:
  - each kind
  - first session yields none
  - warm-ups ignored
  - ties are not bests
  - lb/kg tolerance
  - rep-best collapse to the highest N
- [ ] Comparison tests: template match; name fallback; none; exercises added and removed; warm-ups excluded from sets.
- [ ] Performance test as above.
- [ ] Text helper tests.
- [ ] ARCHITECTURE rows added (personal bests, workout comparison).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
