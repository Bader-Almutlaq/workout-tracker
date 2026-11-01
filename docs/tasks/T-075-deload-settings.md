# T-075: Deload settings: how much, and by weight, sets or both

- **Milestone:** R13 (deload) · **Depends on:** T-062 · **Model tier:** mid (Codex Terra)
- **Reference screenshot** (attached): JEM today, with the deload menu running off the left edge (`jem-live-deload-menu`).
- **Runs in parallel with T-074** (Strong-style live workout), which restyles `ExerciseCard*`, `ExerciseInfoLine*`, `SetRow*`, `ValueCell*`, `NumberPad*`, `exerciseMenuItems.ts` and `ActionMenu*`. Here you own `DeloadChip*`, a new `DeloadSheet*`, `src/core/logging/DeloadPlan.ts`, the deload code in `WorkoutLogger.ts`, `LiveWorkout.ts`, `PreviousPerformance.ts` and `WorkoutExercise.ts`, a new migration, the worker's deload methods, `workoutActions.setDeload` and the workout menu's deload item (`WorkoutMenu.tsx`). In `ExerciseCard.tsx`, `ExerciseInfoLine.tsx` and `exerciseMenuItems.ts`, change only the deload lines (the `DeloadChip` element and its props, the "Deload this exercise" item, and one dialog state for the sheet). Keep those edits to a few lines; the lead merges both branches.

## Goal

The owner's review (2026-11-01): "I'm not able to specify how much deload, and also whether the deload is by sets or by weight only. Maybe the default is by weight and then I can specify it." Today, "Deload this exercise" starts at once with a fixed reduction (T-062: barbell compounds −20% then −10%, others −10% then −5%, sets and reps unchanged). Tapping the "Deload · −10%" label opens a one-item menu that runs off the screen.

Measure, don't prescribe: the owner chooses; the app only fills suggestions they can take or ignore.

## Read first

- `AGENTS.md`; `docs/DECISIONS.md` (2026-10-31 deload entry); `docs/DATA.md`; `reports/Workout tracker app research.md` §12.9 (deloads: 40–50% fewer sets, −10% load or +2–3 RIR).
- Core: `DeloadPlan.ts` and its tests, `WorkoutLogger.ts` (`setDeloadStage`, `deloadWorkout`, `initializeDeload`), `LiveWorkout.ts` (`deload`), `PreviousPerformance.ts` (`deloadBaseline`), `WorkoutExercise.ts`, `src/core/db/migrations.ts` (append only), backup validation (`src/core/backup/`).
- App: `DeloadChip*`, `ExerciseCard.tsx`, `ExerciseInfoLine.tsx`, `exerciseMenuItems.ts`, `WorkoutMenu.tsx`, `workoutActions.ts`, `deload.test.ts`, `src/app/design/components/BottomSheet*`, `SegmentedControl*`, the history chip.

## Specification

1. **Stored settings (migration `v12-deload-settings`, append only, snapshot as usual):** on `workoutExercise`, all nullable:
   - `deloadMode TEXT CHECK (deloadMode IN ('load', 'sets', 'both'))`: null means `load` (today's behaviour).
   - `deloadLoadPercent REAL CHECK (deloadLoadPercent > 0 AND deloadLoadPercent < 100)`: null means the T-062 default for the stage.
   - `deloadSetPercent REAL CHECK (deloadSetPercent > 0 AND deloadSetPercent < 100)`: null means 50.
   - Existing rows keep NULLs, so every past deload reads exactly as before. Preserved by History edits, backups and restore validation. Document in DATA.md.
2. **Rules (`DeloadPlan`, pure, tested):**
   - **Load reduction:** the stored percent, else today's defaults. Rounding and the bodyweight rule are unchanged.
   - **Sets reduction:** keep `ceil(workingSets × (1 − setPercent / 100))` working sets, at least 1 (drop and failure count as working sets; warm-ups are never counted or removed). Cite §12.9 for the 50% default.
   - **Stage 2 (build-back)** is inherited as today, with the predecessor's settings:
     - `load`: half the stage-1 percent, rounded to 0.5 (so 20 → 10 and 10 → 5, matching today's defaults).
     - `both`: load only at half the percent, with full sets.
     - `sets`: no stage 2; the next session is normal.
   - Record the rules in DECISIONS (a new entry that refines 2026-10-31).
3. **Applying a sets reduction:** when sets or both is saved on a live entry, remove trailing working sets that aren't completed until the kept count is reached. Never remove a completed set or a warm-up. If too many sets are completed, remove none. Changing back to load, or ending the deload, doesn't re-add sets (Add Set does). One transaction; tested in core.
4. **Deload sheet (`DeloadSheet`, a bottom sheet)** for one exercise:
   - Title "Deload <exercise name>" and one line with the stage: "Lighter session. Next time builds back halfway." for stage 1 (for sets-only: "Next time is a normal session."), or "Building back" for stage 2.
   - **Reduce:** a segmented control **Weight · Sets · Both**, default Weight.
   - **Weight:** a −/+ stepper for the percent (steps of 5, range 5–50; default the T-062 value for this exercise and stage) with the resulting first working weight beside it ("−10% · 115 kg"). Hidden for Sets, and for bodyweight exercises (with a short note).
   - **Sets:** a −/+ stepper for the working sets to keep ("Keep 2 of 4 sets"), default from 50%. Stored as the equivalent percent.
   - Buttons: **Start deload** (not active) or **Save** (active), and **End deload** (in the deload colour) when active. Cancel closes.
   - It opens from the exercise ⋯ item, renamed **Deload…**, and by tapping the deload label. The label's off-screen one-item menu is removed. The History label stays non-interactive.
5. **Label text:** "Deload · −10%", "Deload · 2 of 4 sets", "Deload · −10% · 2 of 4 sets"; stage 2 adds "build-back" ("Deload build-back · −5%"). Keep the yellow style. Its position in the info line is T-074's job.
6. **Whole-workout deload** (workout ⋯ menu): opens a sheet with the same Reduce choice, a weight choice of **Suggested per exercise** (T-062 defaults) or one custom percent, and a sets percent. It applies to every exercise as today.
7. **Suggestions:** load suggestions use the chosen percent; sets reduction changes only the set count. The existing yellow numbers beside the boxes keep working (T-074 restyles them).
8. Works at 430 × 932 in dark and light; the sheet fits above the home indicator.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Migration test v11 → v12: rows kept, new columns NULL, behaviour unchanged for an old stage-1 row. Backup round trip keeps the settings.
- [ ] Core tests, hand-computed: custom load percent; sets kept for 4, 3 and 1 working sets at 50% and 33%; completed sets never removed; warm-ups never removed or counted; stage 2 halves the percent (20 → 10, 15 → 7.5); `both` → stage 2 load only; `sets` → no stage 2; NULL settings equal T-062's results.
- [ ] App tests: sheet defaults, mode switch hides fields, stepper text, Start/Save/End; label texts; ⋯ "Deload…" opens the sheet; tapping the label opens it.
- [ ] Docs: DATA, DECISIONS, DESIGN (sheet). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

- Implemented v12 settings, worker methods, exercise and workout sheets, labels, absolute set targets, and stage-2 restoration. Existing rows retain their original defaults. Changes are uncommitted; the board was not edited.
- The v12 set-percent check permits zero, a deliberate refinement of the brief’s strictly positive check: the lead’s required exact formula produces zero when all sets are kept, including a one-set exercise. NULL still means the 50% default.
- The sheet uses static-render coverage for defaults and labels; interactive mode-switch, stepper, and opening flows still need browser-level tests and a phone-size visual check.
- Run `make format` and `make verify` after any further edits. See the session report for the most recent result.
