# T-062: Deload button, stored deload sessions, shaded on charts

- **Milestone:** R13 (deload) · **Depends on:** T-060 merged (its migration v8 and progression suggestions) · **Model tier:** strong (Codex Sol: a migration, suggestions and chart marks)

## Goal

The owner's decision (`docs/design/PROPOSALS.md` → *Owner decisions*, Deload):

- A yellow **Deload** button for one exercise or the whole workout.
- About **20% less weight** on big lifts. For other exercises, lower the intensity rather than the sets; the owner already does few sets.
- Then **build back** over two to three sessions instead of jumping straight back.
- Deloaded sessions are **stored as deload**, so charts show the dip was a deload and not a drop in performance.

It's measured, not prescribed: the deload changes suggestions only, and the owner still types or taps the values.

## Read first

- `AGENTS.md`; `docs/design/PROPOSALS.md` §10 and *Owner decisions*; `reports/Workout tracker app research.md` (deload section: 40–50% fewer sets plus −10% load or +2–3 RIR; cite it, or mark `Heuristic:` where the owner's choice differs).
- Core: `src/core/logging/ProgressionPlan.ts` (T-060), `WarmupPlan.ts` (`defaultWarmupCount`'s "big compound" test: reuse the same classification), `LoadableWeight.ts`, `src/core/db/migrations.ts`.
- App: `src/app/features/workout/` (suggestion slot, exercise menu, workout menu, info line), `src/app/design/charts/LongRangeChart*`, `src/app/features/exercises/ExerciseChartsTab.tsx`, `src/app/design/tokens.css`.

## Scope

- **Create:** `src/core/logging/DeloadPlan.ts` (+ test).
- **Edit:**
  - migrations: append `v9-deload`, adding nullable `workoutExercise.deloadStage INTEGER CHECK (deloadStage IN (1, 2))`; NULL = normal
  - logger and worker: set and clear the stage
  - live workout UI
  - export/import **only** to carry the stage in JEM's own backup (already automatic, since backups are the database), not CSV
  - the shared chart (optional deload marks) and exercise charts
  - tokens (`--color-deload`, light and dark)
  - docs
- **Do not touch:** CSV import/export formats, measurements, Dropbox.

## Specification

1. **Turning it on:**
   - The exercise ⋯ menu gets **Deload this exercise**, and the workout ⋯ menu gets **Deload whole workout**.
   - Both are shown in the deload yellow. The workout action sets every exercise.
   - When an exercise is in deload, a small yellow **Deload** chip shows on its info line; tapping it offers "End deload".
2. **Stages and suggestions** (`DeloadPlan`, pure):
   - **Stage 1:** big lifts (the barbell compound classification used for warm-ups) at −20% load; other exercises at −10% load. Same reps as previous. Sets unchanged.
   - **Stage 2:** big lifts −10%, others −5%.
   - Loads round **down** to loadable weights.
   - The stage's suggestions replace progression suggestions in the amber slot. The info line shows "Deload · −20%".
3. **Building back:**
   - When an exercise was at stage 1 in its previous session, the next session of it starts at stage 2 automatically, shown with the chip. The owner can end it.
   - After stage 2, the next session is normal again.
   - Stages apply per exercise.
4. **Stored:**
   - `deloadStage` is saved on the workout's exercise and survives edits.
   - History shows a small "Deload" tag on that exercise.
5. **Charts:**
   - `LongRangeChart` accepts optional `marks` (dates with a kind).
   - Exercise charts pass deload sessions. Buckets containing a deload session draw that point hollow, with a faint yellow column behind it.
   - The full-screen view and the table show "Deload" too.
   - PRs still count deload sessions (they rarely set one), but the PR step line is unaffected visually.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] `DeloadPlan` tests, hand-computed:
  - 100 kg barbell squat → stage 1 80, stage 2 90
  - 30 kg dumbbell curl → stage 1 27.5 (round down from 27), stage 2 27.5
  - lb exercise in lb
  - bodyweight: no load change; reps unchanged
- [ ] Logger/worker tests: set, clear and auto stage 2 on the next session; whole-workout deload; the stage survives finishing and history edit.
- [ ] Migration test v8 → v9 keeps every row, new column NULL; backup validation.
- [ ] Chart test: marks render hollow and shaded; the table lists Deload.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

- **Status:** done. The implementer's run stopped at its usage limit before writing this handoff; the lead fixed three test type errors, reviewed the code and verified it on screen.
- **What was done:** migration v9 adds `workoutExercise.deloadStage` (1, 2, NULL), with a snapshot first. `DeloadPlan` computes stage suggestions: big barbell compounds −20% then −10%, others −10% then −5%, loads rounded down, same reps and sets, bodyweight load unchanged. Stage 2 starts automatically on the next session after stage 1 and uses the pre-deload load. The exercise menu has **Deload this exercise** and the workout menu **Deload whole workout**, both in deload yellow. A **Deload · −20%** chip on the info line ends it. Deload suggestions replace progression ones. History shows a Deload tag, and exercise charts mark deload buckets hollow with a faint yellow column, also listed in the table.
- **Note:** the brief's dumbbell example was wrong: 30 kg × 0.9 = 27 kg rounds down to 25 kg on 2.5 kg steps. The implementation follows the rule.
- **Verified:** `make verify` (1,231 tests). On screen: menu item, chip, and 82.5 kg → 65 kg × 5 suggestion.
