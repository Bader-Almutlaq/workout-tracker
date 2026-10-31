# T-060: Opt-in progression suggestions (reps, then load), shown in amber

- **Milestone:** R5/R6 (progression) · **Depends on:** T-056 merged (the suggestion slot), T-044 (loadable weights) · **Model tier:** strong (Codex Sol: a formula, a migration and the live screen)

## Goal

The owner's decision (`docs/design/PROPOSALS.md` → *Owner decisions*, Progression):

- Progression is **opt-in** and progresses **reps first within the chosen rep range, then load**, with intensity (RPE) considered.
- Suggestions appear in **amber** beside the greyed previous value and are used only when tapped.
- Progression is **per workout**: the same exercise on different days can have different rep ranges.

AGENTS.md product rule: measure, don't prescribe. The suggestion is an opt-in calculation, with descriptive wording and no verdicts.

## Read first

- `AGENTS.md`; `docs/design/PROPOSALS.md` (§11 and *Owner decisions*); `docs/design/PAGES-2026-10-31.md` → Live workout; `reports/Workout tracker app research.md` (double progression and RPE/RIR sections: cite them, or mark `Heuristic:`).
- Core:
  - `src/core/db/migrations.ts` (`templateSet.targetRepsLow/High/targetRpe` already exist)
  - `src/core/units/LoadableWeight.ts`
  - `src/core/queries/PreviousPerformance.ts`
  - `src/core/logging/WorkoutLogger.ts` (starting from a template)
  - `src/core/logging/WarmupPlan.ts`, as the model for a pure planner
- App: `src/app/features/workout/` (`ValueSuggestion.ts`, SetRow, ValueCell, ExerciseInfoLine, exerciseMenuItems), the template editor (`src/app/features/templates/`, TargetValueCell, TemplateSetRow).

## Scope

- **Create:** `src/core/logging/ProgressionPlan.ts` (+ test): a pure function from the previous performance and the targets to per-set suggestions.
- **Edit:**
  - migrations: append `v8-template-progression`, adding to `templateExercise` a nullable `progression TEXT CHECK (progression IN ('double'))` (NULL = off)
  - template models and editor
  - the logger or worker query that feeds the live screen
  - the live workout suggestion wiring and info line
  - docs (DATA: new column; ARCHITECTURE: a row for ProgressionPlan; DECISIONS: one entry)
- **Do not touch:** charts, analytics, import/export, measurements, Dropbox, warm-up generation rules.

## Specification

1. **Turning it on:**
   - In the workout (template) editor, each exercise gets **Progression: Off / Reps then weight**.
   - The rep range comes from that exercise's template set targets (`targetRepsLow`–`targetRepsHigh`, `targetRpe`).
   - If the targets are missing when it's switched on, the editor asks for a range (defaults 8–12).
2. **Previous performance:** the working sets of the most recent finished session of **the same template** containing the exercise. If there is none, fall back to the most recent finished session of the exercise anywhere. Warm-ups are ignored.
3. **Rule** (double progression; cite the report or mark `Heuristic:`), per working set position:
   - **Below the range** (reps < low): same weight; suggest reps = low.
   - **In range, top not yet reached:** same weight, reps + 1 (capped at high).
   - **Every working set reached the top** of the range at RPE ≤ target (or RPE unknown): weight + one loadable step (`roundToLoadable(previous + step, profile, 'nearest')`; at least the next loadable load), reps = low.
   - **RPE above the target** with reps in range: same weight and reps (repeat). Wording on the info line: "Repeat: last RPE above target".
   - Weights stay exact kilograms, displayed in the set's entry unit. No suggestion when tracking isn't weight + reps (bodyweight: reps only, same rule without the weight step).
4. **Live workout:**
   - When the workout was started from a template whose exercise has progression on, each working set's weight and reps cells get the amber suggestion (the `ValueSuggestion` slot).
   - The previous values stay greyed as today. Tapping amber copies it; ticking without tapping uses the greyed values.
   - The info line shows the range and the reason, e.g. "8–12 reps · +1 rep" or "8–12 reps · +2.5 kg next".
5. **Persistence:** suggestions are computed on the fly, not stored. After a reload they reappear for untouched sets.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] `ProgressionPlan` tests with hand-computed cases:
  - 100 kg × [12, 12, 11] in 8–12 → [12, 12, 12] at 100
  - 100 × [12, 12, 12] @ RPE 8 (target 8) → 102.5 × 8
  - dumbbell 22.5 × 12s → 25 × 8
  - RPE 9.5 above target 8 → repeat
  - below range
  - lb exercise steps in lb
  - bodyweight reps only
  - no previous session → no suggestion
- [ ] Migration test v7 → v8 keeps every row, new column NULL; backup validation passes.
- [ ] Live screen tests: amber appears only with progression on; tap copies; tick without tap uses greyed values; the info line text.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
