# T-056: Strong-style live workout screen

- **Milestone:** R6 (live workout panel) · **Depends on:** none (no schema change) · **Model tier:** strong (Codex Sol: the most-used screen; must stay fast and lose nothing)
- **Reference screenshots** (attached to your prompt): `11-live-workout`, `12-exercise-menu`, `13-exercise-menu-2`.

## Goal

Implement **Live workout** from `docs/design/PAGES-2026-10-31.md` (read it first), plus *Suggested values* and *Warm-ups* from `docs/design/PROPOSALS.md` → *Owner decisions*. The owner prefers Strong's compact layout. Suggestions are a reusable slot: warm-ups fill it now, and progression fills it later.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md` → *Live workout*; `docs/design/PROPOSALS.md` → *Owner decisions* (suggestions beside the value, warm-ups); `docs/DESIGN.md` (tokens).
- `src/app/features/workout/` (WorkoutScreen, ExerciseCard and its header, SetRow, SetCell, the number pad, `setKindItems.ts`, `warmupMenuItem.ts`, `workoutActions.ts`, `useActiveWorkout.ts`), `src/app/design/tokens.css`.
- Core: `src/core/logging/WorkoutLogger.ts` (warm-up suggestions and protection, set kinds, unit switch, replace and remove), the `exercise.restTargetSeconds` and `supersetGroup` columns.

## Scope

- **May edit:** the workout feature, `tokens.css` (new tokens), shared components where a small prop is needed, the worker API (only if an existing core operation lacks a method), tests, `docs/DESIGN.md` (live workout and token table).
- **Do not touch:** migrations, history/edit mode behaviour (shared components must keep working there; check `src/app/features/history/PastWorkoutEditor.tsx`), templates, charts, analytics, import/export.

## Specification

1. **Layout** (screenshot 11):
   - **Header:** workout name with its menu, date and elapsed time. A sticky top bar keeps elapsed time and **Finish**.
   - **Per exercise:**
     - the name (accent colour, opens the exercise page) and a ⋯ menu
     - an **info line**, showing only what exists: rest target ("Rest 2:00"), exercise note or sticky note, and later the machine
     - the columns **Set · Previous · kg (or lb) · Reps · ✓**, then **+ Add set**
   - Compact rows, ~44 px tap targets, 430 px wide, dark and light.
2. **RPE:**
   - Moves from its own column to a small badge on the ✓ button, as in Strong.
   - Tap the badge (or long-press ✓) to set RPE with the existing picker.
   - An empty badge isn't shown until RPE is set; the ⋯ menu gets "Show RPE" to reveal empty badges for this exercise.
3. **Suggested values:**
   - Untouched weight and reps show the previous session's values, greyed (as today).
   - Add an optional **amber suggestion** next to each value cell (`--color-suggestion`, light and dark), rendered from a `suggestion` prop.
   - Tapping it copies the value into the set. Ticking ✓ with untouched cells uses the greyed values.
   - Wire warm-up suggestions to it. Leave a clear, typed seam for progression later; no progression logic here.
4. **Warm-up rows:**
   - A brighter purple tint across the whole row (`--color-warmup-row` and `--color-warmup-label`, defined as explicit hex in light and dark, derived from the theme accent `#5e6ad2` / `#7c85e8`).
   - A thin separator line before the first working set.
   - Replace today's amber tint.
5. **Set types:**
   - Tapping the set number opens the set type menu: Warm-up, Normal, Drop, Failure.
   - Labels: W (purple), D, **F in red** (`--color-status-bad`), and numbers for normal sets.
6. **⋯ menu** (screenshots 12–13), using only existing operations:
   - Add note, Add sticky note (if a persistent exercise note exists; otherwise omit)
   - Add warm-up sets / Remove suggested warm-ups
   - Rest time (edit `restTargetSeconds`; display only, no timer)
   - Replace exercise, Create superset (only if supported; otherwise omit)
   - Unit (kg/lb)
   - Move up/down, Remove exercise

   Don't build new features for missing items; list what you omitted in the Handoff.
7. **No regressions:**
   - Every change still saves immediately through the existing write queue, and the typo check still prompts.
   - History edit mode still works with the shared components.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: the suggestion slot (tap copies, tick uses greyed values), the RPE badge visibility rule, set type labels (F uses the bad-status token), warm-up row and separator classes, menu items present/omitted per capability, and the history edit mode render still passing.
- [ ] Docs updated (DESIGN token table with the new hex values).
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

Implemented; automated verification passes. Changes are uncommitted and the board is unchanged.

- **Behaviour:** five-column live rows, accent exercise-page links, conditional rest/note info,
  session metadata and name menu, sticky elapsed time/Finish, per-exercise Show RPE, tappable RPE
  badges and a 500 ms completion-button hold. Holds tolerate small finger movement and cancel on
  scrolling/cancellation/unmount. Normal completion still runs the queued typo check.
- **Suggestions:** optional typed `ValueSuggestion` props on `ValueCell`/`SetCell` provide amber
  values beside current values. The callback accepts the displayed value only on tap. Untouched
  planned cells are greyed; ticking uses their saved prefill. Generated warm-ups supply the slot
  through existing suggestion ids and saved planned values; no generator/progression changes.
- **Warm-ups/types:** explicit purple light/dark surface and label tokens, existing separator
  selectors, W/Normal/D/F menus and red failure labels. Existing warm-up protection/removal stays
  in the logger. Unit, move, remove, note and rest-target actions use existing queued operations.
  The automatic rest-bar display is removed from the live screen; recorded rest behaviour is unchanged.
- **History compatibility:** shared cards explicitly retain the previous six-column grid, separate
  RPE input, unit chip, set/exercise note controls, mixed-unit labels and disabled completion.
  No History feature files, core implementations or schema were changed.
- **Omitted capabilities:** Add sticky note (no persistent exercise-note model), Replace exercise
  (no live core operation), Create superset (stored/template groups exist, but no live grouping
  operation). Machine metadata is absent, so no empty machine field appears. Existing notes use
  Edit note in the menu. Rest time edits seconds within existing core limits, without a timer.
- **Interpretations/limits:** warm-up plans already live in saved planned rows, so the greyed and
  amber values initially match; this uses the existing generation model rather than inventing a
  second calculation. Entered/accepted styling and Show RPE are local presentation state; reopening
  shows saved planned values greyed again. Accepting an identical warm-up value does not change
  core provenance: Remove suggested warm-ups can still remove that uncompleted, unchanged row.
  Editing its values or completing it preserves existing protection. A future progression caller
  can supply different amber values using the same typed slot.
- **Public API:** new `ValueSuggestion` (`value`, `text`, `onAccept`, in cell display units/seconds),
  `exerciseMenuItems`, `ExerciseInfoLine`, `ExerciseNoteDialog`, `RestTargetDialog`, `WorkoutMenu`,
  `WorkoutMetadata`, and queued `saveExerciseNotes`. `CellEditor` adds `isValueEntered` and
  `acceptSuggestion`; optional card actions expose suggestion acceptance, entry notes, rest target
  and exercise navigation. CheckButton adds optional effort props; SetRow/SetColumnHeader preserve
  history through explicit props. Screen adds optional `titleAccessory` and accepts a React subtitle.
  No worker API methods were added.
- **Files:** `src/app/features/workout/` layout components, CSS modules, cell editor/actions, set-kind
  names and new small metadata/dialog/menu/suggestion files; shared `Screen.tsx`/`Screen.module.css`;
  `src/app/design/tokens.css`; `docs/DESIGN.md`; this Handoff. Tests are
  `src/app/features/workout/liveWorkoutLayout.test.ts`, `src/worker/LiveWorkoutLayout.test.ts` and
  `tools/liveWorkoutLayout.test.ts`.
- **Verification:** `make format`, `make verify` and `git diff --check` pass. **1,067 tests in 139
  files**, including 13 new tests: suggestion tap/rendering, entry-unit display, placeholder and RPE
  visibility, kind labels/style tokens, warm-up/separator selectors, capability menus, metadata and
  shared History rendering. Queue integration tests use `Database.openInMemory()` plus `migrate`,
  the real worker API/logger, and synthetic history to check prefill completion, rapid successive
  edits and typo prompting. The production build retains the existing chunk-size advisory.
- **Pending review:** 430 × 932 dark/light screenshots and touch checks (especially long-press and
  inline suggestions) still need a permitted browser/device session. `make dev` was blocked by
  `listen EPERM` on port 5173; browser access was unavailable and Chrome control was not approved.
  No visual verification is claimed.
