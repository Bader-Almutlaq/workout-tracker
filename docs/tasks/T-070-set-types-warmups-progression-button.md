# T-070: Compact workout editor, coloured set types, warm-ups on top, a Progress button

- **Milestone:** R5/R6 · **Depends on:** T-056 (live workout), T-060 (progression), T-062 (deload) · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-068** (Workout tab, plan cards, charts, workout page). Don't edit `StartWorkout*`, `RecentWorkout*`, `PlanCard*`, `PlanWorkoutCard*`, `WorkoutPage*`, `WorkoutExerciseRow*`, `TemplateSessionCharts*`, `LongRange*`, `TemplateDetailsSection*` or `src/core/queries/TemplateSessions.ts`.

## Goal

The owner's review (2026-10-31), about editing a workout and logging one:

1. **The workout editor is too large.** The value boxes are big; make it as compact as Strong's.
2. **Set types need colour.** Warm-up: a yellowish accent that fits the palette. Failure: red. Drop: purple. Working: plain, as today. At least the type label gets a coloured pill; a faint row tint is welcome.
3. **Warm-ups sit together on top**, with their own **Add warm-up set** button next to **Add set**. Interleaving (working, warm-up, working) shouldn't happen. "Last time" values already pair warm-ups with warm-ups and working sets with working sets (`matchPreviousSets`); keep that.
4. **Progression takes too much room** in the editor (a full-width "Progression: Off" select per exercise). Make it a small button in the exercise's header.
5. **In the live workout**, grey values in a cell are last time's, and the ✓ fills them. Progression suggestions shouldn't take over the cells: the owner wants a small red **Progress** button on the exercise that fills the suggested values.

Measure, don't prescribe: suggestions only fill values when the owner taps.

## Read first

- `AGENTS.md`; `docs/DESIGN.md`; `src/app/design/tokens.css` (`--color-deload`, danger, accent).
- Template editor: `src/app/features/templates/` (`TemplateEditor*`, `TemplateExerciseCard*`, `TemplateExerciseHeader*`, `TemplateExerciseList*`, `TemplateSetRow*`, `TemplateSetGrid*`, `TemplateSetColumnHeader*`, `SetKindButton*`, `ProgressionControl*`, `ProgressionRangeDialog*`, `templateSetEdits*`, `templateProgressionEdits*`, `TargetValueCell*`).
- Live workout: `src/app/features/workout/` (`ExerciseCard*`, `ExerciseCardHeader*`, `SetRow*`, `SetCell*`, `AddSet*` or wherever Add set lives, `ExerciseInfoLine*`, `DeloadChip*`, `useCellEditor`, `workoutActions`), and core `WorkoutLogger` (adding sets, set kinds), `PreviousPerformance.matchPreviousSets`, `ProgressionPlan`, `LiveWorkout`.

## Specification

1. **Tokens:** add `--color-warmup` (amber-yellow, distinct from `--color-deload`, legible on both surfaces), `--color-failure` (reuse the danger red if suitable), `--color-drop` (a purple distinct from the accent), each with a `-tint` variant for row backgrounds (about 8–12% alpha). Light and dark.
2. **Set type display** (editor and live workout): the type cell shows a short label in a coloured pill (W, 1, 2…, F, D as today, or the editor's words) using the colour above; non-working rows get the faint tint. Working sets stay plain.
3. **Warm-ups first** (editor and live workout):
   - **Add set** appends a working set (copying the previous working set's targets/values as today). **Add warm-up set** inserts a warm-up after the last warm-up (or first when none).
   - Changing a set's type to warm-up moves it into the warm-up group; changing a warm-up to another type moves it to the first position after the warm-ups. Order within each group is kept.
   - In the live workout, moving never touches completed values. Logger changes keep positions dense and are tested in core.
4. **Compact editor:**
   - Value boxes about 36 px high (from about 46), smaller column headings, tighter card padding and spacing, like Strong's template editor.
   - Header line: exercise name, then the progression button, then ⋯.
   - Keep 44 px minimum touch targets by padding, not by box size.
5. **Progression button in the editor:** replaces the full-width select. A small pill in the exercise header:
   - Off: outlined, "Progression".
   - On: filled in red (the owner's choice), "8–12 reps" (the range).
   - Tapping opens the existing range dialog, which also has "Turn off".
6. **Live workout Progress button:**
   - Progression suggestions no longer fill or colour the cells. The grey placeholder is always last time's value, and the ✓ fills it as today.
   - When the exercise has progression suggestions, its card shows a small red **Progress** button with the first suggestion in short form ("Progress · 82.5 kg × 8"). Tapping enters every suggested value into the matching sets that aren't completed, as typed values the owner can still edit. It never completes a set.
   - Deload stays as today (its own chip and suggestions).
7. Works at 430 × 932 in dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests: add a warm-up inserts after the last warm-up; type change to/from warm-up moves the set; positions stay dense; completed values untouched; previous values still pair by type after a move.
- [ ] App tests: template edits for add warm-up and type moves; editor progression pill text off/on; Progress button shown only with suggestions, fills uncompleted matching sets, doesn't complete them; cells show last time's value, not the suggestion.
- [ ] Docs (DESIGN: set colours, compact editor; DECISIONS: warm-ups first, Progress button). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Implemented grouped manual warm-ups and type moves in the logger and template editor, with separate add controls. Added theme colours, compact editor controls and an explicit live Progress action; deload suggestions remain separate. The worker `addSet` accepts an optional `working` or `warmup` kind. Tests cover ordering, completed values, type matching, progression labels and button application. `make format` and `make verify` passed: 177 test files, 1,279 tests. Phone-size visual review in dark and light remains outstanding.
