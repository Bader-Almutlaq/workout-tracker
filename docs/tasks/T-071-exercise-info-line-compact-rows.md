# T-071: Exercise info line (rep range, rest, notes) and Strong-sized set rows

- **Milestone:** R6 (live workout polish) · **Depends on:** T-070 · **Model tier:** mid (Codex Terra)
- **Reference screenshots** (attached): Strong's live workout (`11-live-workout`).
- **Runs in parallel with T-069** (plan Summary, workout day, active plan). Don't edit `PlanPage*`, `PlanCard*`, `PlanWorkoutCard*`, `PlanMenu*`, `TemplatesSection*`, `TemplateDetailsSection*`, `WorkoutPage*`, `src/core/db/migrations.ts`, `src/core/templates/TemplateDraft.ts` or `TemplateStore.ts`.

## Goal

The owner's review (2026-11-01):

1. **Between the exercise name and the set table**, each exercise should show a line with the **rep range** and the **rest time**, in a different colour, plus the exercise's **notes** (Strong has notes there).
2. **Set rows are still too large.** The owner prefers Strong's compact size to Hevy's larger one. Make the live workout rows (and the template editor rows) as compact as Strong's.

Colours stay as decided: warm-up yellow, failure red, drop purple.

## Read first

- `AGENTS.md`; `docs/DESIGN.md`; `src/app/design/tokens.css`.
- Live workout: `src/app/features/workout/` (`ExerciseCard*`, `ExerciseCardHeader*`, `ExerciseInfoLine*`, `ExerciseNoteDialog*`, `SetRow*`, `SetCell*`, `CheckButton*`, `progressionText*`, `liveWorkoutLayout.test.ts`), core `LiveWorkout.ts` (planned targets per set: `targetRepsLow/High`).
- Template editor: `src/app/features/templates/` (`TemplateExerciseCard*`, `TemplateExerciseHeader*`, `TemplateSetRow*`, `TemplateSetGrid*`).

## Specification

1. **Info line (live workout)**, directly under the exercise name, always in the same place:
   - **Rep range** from the planned working sets' targets ("6–8 reps"; "8 reps" when low = high; "6–8 reps @ RPE 8" when an RPE target exists; if sets differ, the first working set's). Hidden when no targets.
   - **Rest** as "Rest 2:00" when the exercise has a rest target.
   - Machine brand, deload chip, "Previous: other machine" and progression text stay as today, on the same line.
   - Rep range and rest use the accent colour at secondary size (14 px), separated by " · ". Wraps when needed.
   - **Notes:** the exercise's note shows on its own line under that (secondary text colour, italic or a faint tinted background like Strong's note field). Tapping it opens the existing note dialog. With no note there's no empty line; notes are still added from the ⋯ menu as today.
2. **Template editor:** the same line under each exercise's name, showing the rest target, and the exercise's template note (`TemplateExerciseDraft.notes`) when set. Tapping the note edits it (an existing dialog or a small new one); ⋯ gets **Add note** if absent.
3. **Compact rows, matched to Strong:**
   - Live set rows: value boxes about 32 px high (from about 40), 15 px numbers, 4 px vertical gap between rows, the ✓ button 32 × 32 inside a 44 px-wide hit area. The "previous" column text 14 px. Column headings 11 px.
   - Exercise card padding and the gap between header, info line and table tightened accordingly. Add set / Add warm-up set as a single compact 36 px row.
   - Template editor rows match the live rows' height.
   - Touch targets stay at least 44 px tall by extending the hit area (padding or a pseudo-element), never by enlarging the visible box.
   - Coloured set-type pills and tints from T-070 stay.
4. Works at 430 × 932 in dark and light; nothing clipped with 4-digit weights ("1000.5").

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: info line text for a range, a single target, an RPE target, no target (hidden), rest; note shown and opens the dialog; no blank line without a note; template editor shows the note and Add note.
- [ ] Layout tests updated for the compact sizes.
- [ ] Docs (DESIGN: info line, compact rows). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Implemented planned target and rest metadata, separately editable live and template notes, and compact set rows in both editors. Template targets are exposed on `LiveWorkoutEntry.plannedTargets` even with progression off or deload active; `TemplateEditorActions.setExerciseNotes` updates the draft. Incomplete one-sided rep targets display their available endpoint; the first normal working set determines the line. Rest remains the exercise-level target.

Changes cover the live workout and template card components, their styles and tests, `LiveWorkout`, and `docs/DESIGN.md`. No schema or storage changes. `make format` and `make verify` passed: 181 test files, 1,289 tests, and production build. The browser host was unavailable, so dark/light, touch overlap and 430 × 932 visual checks including long weights still need device review. The 36 px row spacing means adjacent 44 px touch regions overlap by 8 px; verify tap behaviour on the phone.
