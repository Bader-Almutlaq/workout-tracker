# T-074: Strong-style live workout: continuous list, spaced rows, RPE on the pad

- **Milestone:** R6 (live workout polish) · **Depends on:** T-070–T-073 · **Model tier:** mid (Codex Terra)
- **Reference screenshots** (attached): Strong's live workout (`14-live-workout-strong`, `11-live-workout`), Strong's number pad with the RPE key (`15-number-pad-rpe`), and JEM today (`jem-live-info-line`, `jem-live-deload-menu`).
- **Runs in parallel with T-075** (deload settings). T-075 owns `DeloadChip*`, the new `DeloadSheet*`, `src/core/logging/DeloadPlan.ts`, deload code in `WorkoutLogger`/`LiveWorkout`, migrations and the worker's deload methods. Here: don't edit those files, and in `ExerciseCard.tsx`, `ExerciseInfoLine.tsx` and `exerciseMenuItems.ts` leave the deload lines (the `DeloadChip` element and the "Deload this exercise" item) as they are, apart from moving the chip's position in the info line (item 4).

## Goal

The owner tried the compact rows on their iPhone (2026-11-01) and compared them with Strong. JEM feels cramped. Make the live workout look and space like Strong:

1. **No cards.** Strong shows the exercises as one continuous list, not boxed cards.
2. **Small rows with space between them.** Each row is compact, but there's a gap between rows and a bigger gap between exercises.
3. **One Add Set button.** Remove "Add warm-up set" under the sets; adding a warm-up moves to the ⋯ menu.
4. **RPE:** "Show RPE" in ⋯ showed the word "RPE" on every row and then couldn't be undone (the item disappeared). The owner couldn't find how to enter RPE at all. Strong has an **RPE key on the number pad**.
5. **Info line:** rest and rep range in yellow, lined up, with the deload label on the right.
6. **Suggestions:** the owner likes the small yellow deload number beside each box. Progression should look the same, and the number should be smaller.
7. **Menus go off screen** (the deload menu opened past the left edge). Like Strong, a menu near the bottom opens upward, and every menu stays inside the screen.
8. **"+" was unclear:** a bodyweight exercise shows "+145 kg × 12" and a "+KG" column, and the owner didn't know it means weight added to bodyweight.
9. **Rep range:** the owner can set rest from ⋯ but found no way to set a rep range.

## Read first

- `AGENTS.md`; `docs/DESIGN.md` (live workout, set colours, info line, compact rows); `src/app/design/tokens.css`.
- `src/app/features/workout/`: `ActiveWorkout*`, `ExerciseCard*`, `ExerciseCardHeader*`, `ExerciseInfoLine*`, `SetRow*`, `SetGrid.module.css`, `SetColumnHeader*`, `SetCell*`, `ValueCell*`, `CheckButton*`, `SetKindMenu*`, `NumberPad*`, `PadButton*`, `PadKey.ts`, `useCellEditor.ts`, `CellEditor.ts`, `cellOrder.ts`, `padTitle.ts`, `ProgressButton.tsx`, `progressionValueSuggestion.ts`, `progressionSuggestions.test.ts`, `exerciseMenuItems.ts`, `warmupMenuItem.ts`, `setCellText.ts`, `liveWorkoutLayout.test.ts`.
- `src/app/design/components/ActionMenu*` (shared menu).
- Template editor: `src/app/features/templates/TemplateExercise*`, `templateSetEdits*`, `TargetValueCell*`; core `TemplateDraft.ts`, `TemplateStore.ts`, `LiveWorkout.ts` (`plannedTargets`).
- History reuses `ExerciseCard`/`SetRow` for editing past workouts (`notes` / `isPastWorkout`). It must keep working; it may take the same new look.

## Specification

1. **Continuous list (Strong's layout):**
   - Remove each exercise's card background, border, radius and shadow. Exercises sit directly on the screen background, separated by about 24 px of space (no divider lines).
   - Header line: exercise name (accent, as now), then the right-hand buttons (deload/progression controls if any, ⋯). Info line and note under it, then the column headings and rows.
   - Page side insets match Strong's (about 16 px). Rows use the full width inside those insets.
2. **Spaced compact rows:**
   - Value boxes stay about 32 px tall with rounded corners and a filled background (as Strong's). Add **about 8 px vertical space between rows**, so each row reads on its own.
   - The set label sits in a small rounded square (like Strong's "1"), coloured for W/F/D as now. Keep the faint tint for warm-up/failure/drop, drawn as a rounded band behind that row only, so the gaps stay visible.
   - Column headings ("Set · Previous · kg · Reps · ✓") use Strong's proportions: Previous gets the room it needs for "145 kg × 2 @ 9"; weight and reps boxes are equal width.
   - Touch targets stay at least 44 px tall by extending the hit area, not by enlarging the visible box. With 32 px boxes + 8 px gaps, rows are 40 px apart; make the hit areas meet in the middle rather than overlap.
3. **One Add Set button:**
   - A single full-width **+ Add Set** button under the sets: a rounded, filled bar like Strong's, about 32 px tall, with space above it.
   - Remove the "Add warm-up set" button.
   - The exercise ⋯ menu gets **Add warm-up set**: adds one empty warm-up at the top (after existing warm-ups, using the existing `addSet(entryId, 'warmup')`).
   - The existing calculated warm-ups item stays, renamed **Add suggested warm-ups** / **Remove suggested warm-ups**.
   - Changing a set's type from its label (to or from W) still moves it, as T-070 built.
4. **Info line:**
   - Rep range and rest ("8–12 reps · Rest 2:00") in the deload yellow (`--color-deload`), same size and baseline as the rest of the line.
   - The deload label sits at the **right end** of the info line, vertically centred with the text. When the line wraps, nothing overlaps.
   - With no rep range or rest, the deload label alone sits on the right.
   - Machine brand and "Previous: other machine" keep their current muted style after the targets.
   - The note stays on its own line below.
5. **RPE on the number pad (Strong's pad):**
   - Lay the pad out like Strong's: digits in three columns; the right column holds, top to bottom, **hide pad** (keyboard-down icon, replacing Done), **RPE**, **− | +** (one key split in two), **Next**. The bottom row holds the decimal point (disabled for whole numbers), 0, ⌫. Keep the title row and the kg/lb toggle.
   - **RPE** while editing a set's weight or reps switches the pad to that set's RPE. While editing RPE, the key is highlighted, and tapping it again returns to reps.
   - In RPE mode, show a row of quick-pick chips above the digits: 6, 7, 7.5, 8, 8.5, 9, 9.5, 10. Tapping one sets the RPE. The title reads "RPE 8 · 2 reps left" (RIR = 10 − RPE), or "RPE" when empty. Typing digits still works; − / + step by 0.5. Valid range as today.
   - Next from RPE goes to the next set's weight (or reps), as Next from reps does now.
   - **RPE badge:** shown on a set only when it has an RPE (a small pill at the reps box's top-right, as now and as Strong's). Remove the "Show RPE" menu item and the empty "RPE" badges. Tapping a badge still edits RPE; keep the long-press on ✓.
6. **Suggestion numbers:**
   - The small number beside a box (deload's yellow, today) gets smaller: caption size (about 12 px), so the boxes keep their width.
   - **Progression suggestions show the same way**, beside the weight and reps boxes of matching sets that aren't completed, in the progression colour (`--color-failure` red, the owner's progression colour). Tapping a number enters it, as tapping a deload number does. The grey placeholder stays last time's value, and ✓ still fills that.
   - Remove the red **Progress** button from the exercise. Remove `ProgressButton.tsx` and any code only it used. Update `docs/DECISIONS.md` (the Progress button decision of 2026-10-31 is replaced).
   - A deload and progression never show at once (deload wins, as now).
7. **Menus stay on screen:**
   - `ActionMenu` measures on open. If there isn't room below the trigger (above the tab bar, pad or bottom safe area), it opens **upward**. Horizontally it's clamped so the whole panel stays inside the viewport with 8 px margin, whatever `align` says.
   - This fixes every ⋯ menu, the set-type menu if it uses `ActionMenu`, and the deload menu. Test the placement maths as a pure function.
8. **Added weight is clear:**
   - For bodyweight exercises (`isBodyweightLoad`), the weight column heading reads **"+kg"** → **"Added kg"** (or "Added lb"), and the previous text keeps "+145 kg × 12".
   - The heading fits its column at 430 px in uppercase at the heading size; if it doesn't, use "+kg added". Keep the "+" in the previous text.
9. **Rep range:**
   - **Template editor:** the exercise ⋯ menu gets **Rep range…**: a small dialog with low and high reps (and an optional RPE target) that sets the targets on every working, drop and failure set of that exercise in the draft. It shows in the editor's info line next to Rest.
   - **Live workout:** when the session came from a saved workout, the exercise ⋯ menu gets **Rep range…**. It updates that saved workout's targets for this exercise (the same rule, saved to the workout immediately; the dialog says "Saves to <workout name>"). The info line updates. It's hidden for sessions not started from a workout.
   - Use the existing template store/update functions where they fit; add one worker method if needed. Repeated exercises in a workout are matched in occurrence order (the rule `TemplateStore.updateFromWorkout` already uses).
10. Works at 430 × 932 in dark and light, with 4-digit weights ("1000.5") and the pad open.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: menu placement (opens up near the bottom, clamped left and right); pad RPE switching and back, quick picks, the RIR title; RPE badge only when logged; "Show RPE" gone; ⋯ has Add warm-up set (adds at the top) and the renamed suggested warm-ups item; no Add warm-up set button; progression numbers beside boxes, tap enters the value, never completes; no Progress button; "Added kg" heading for bodyweight; rep-range dialog in the editor and live (saved to the template, hidden without one).
- [ ] Layout tests updated (no card border/background; 8 px row gap; single add button).
- [ ] Past-workout editing in History still works (its tests pass).
- [ ] Docs: DESIGN (continuous list, row spacing, pad layout, suggestion numbers), DECISIONS (Progress button replaced by inline numbers; RPE on the pad). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
