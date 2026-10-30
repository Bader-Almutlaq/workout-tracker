# T-050: Edit and delete past workouts in History

- **Milestone:** R12 · **Depends on:** none (no schema change expected) · **Model tier:** strong (Codex Sol: data safety)

## Goal

History is read-only today, so a typo after finishing a workout (or after an import) can't be fixed. The owner can now edit any finished workout as easily as a live one, and delete a workout or a set. A safety snapshot protects every destructive change. All analytics, bests and comparisons update automatically, since they read the database.

## Read first

- `AGENTS.md` (data safety: snapshot before anything that can lose data; never swallow errors), `docs/DATA.md`.
- Core: `src/core/logging/WorkoutLogger.ts` (all set and exercise edit operations for the live workout: reuse them, don't duplicate), the typo check (`src/core/validation/`), `src/core/queries/WorkoutHistory.ts`.
- Worker: `src/worker/OnDeviceStore.ts` (`takeSnapshot`), `WorkerApi.ts` (how import and merge take snapshots first).
- App: `src/app/features/history/WorkoutDetailScreen.tsx`, `SetRow.tsx`, and the live workout components in `src/app/features/workout/` (number pad, set kinds, RPE, notes) to reuse.

## Scope

- **May edit:** WorkoutLogger (generalise its edit operations to work on a finished workout id; keep live behaviour identical), the worker API (block `// Edit past workouts (T-050)`), the History detail screen and a new edit mode, shared workout components where reuse needs a small prop, tests, `docs/DATA.md`, `docs/ARCHITECTURE.md` rows.
- **Do not touch:** migrations, charts, analytics formulas, import/export, measurements, the library.

## Specification

1. **Edit mode.** Workout detail gets **Edit**. In edit mode the workout shows exactly like the live screen:
   - weight × reps, RPE, set kind (W/D/F), set and exercise notes, add or remove sets, add or remove exercises, reorder
   - the workout name, notes, start time and duration
   - **Done** leaves edit mode.

   Every change saves immediately, as in the live workout, so there is no unsaved state to lose.
2. **Typo check** runs on edited weights and reps, the same "Is this right?" prompt as live logging.
3. **Snapshots.** Take a safety snapshot once when entering edit mode on a workout, not per keystroke, and before **Delete workout**. The existing pool keeps the newest three. If the snapshot fails, refuse to enter edit mode or delete, with a readable error.
4. **Delete.**
   - **Delete workout** asks first ("Delete Push on Oct 25? This can't be undone in the app; a safety copy is kept."), then removes it and returns to History.
   - Deleting a set or an exercise in edit mode needs no confirmation (it's immediate and the snapshot covers it). An exercise that ends with no sets is removed.
5. **Imported workouts** are editable too. Their `sourceKey` stays, so re-importing the same Strong file never resurrects a deleted workout's old values… *except* that importing skips by `sourceKey`: a **deleted** imported workout would be re-added by a re-import. Handle this with a tombstone. Store deleted source keys in an `appSetting` row (`deletedSourceKeys`, a JSON array) that the importer treats as already imported. Document it, and test that re-importing after a delete adds nothing.
6. **Live workout untouched:** the in-progress workout keeps using the live screen; History edit applies to finished workouts only.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests: edit operations on a finished workout persist; live workout behaviour unchanged (existing tests pass); delete removes the workout tree only; an empty exercise is removed; deleting an imported workout tombstones its source key, and re-import adds nothing.
- [ ] Worker tests: a snapshot is taken on entering edit and before delete; a failed snapshot blocks both; one notification per write.
- [ ] Typo check prompts in edit mode (app helper test).
- [ ] Docs updated.

## Handoff

- **Status:** Implemented; ready for review. Automated checks pass. Browser visual / touch checks remain pending because the computer-use browser host is unavailable. Changes are deliberately uncommitted; BOARD.md is unchanged, per the owner's instructions.
- **What was done:** History detail now offers snapshot-protected Edit and confirmed Delete workout. Edit reuses the live exercise cards, set kinds, number pad, picker, typo prompt and write queue. Supports weight/reps/duration/RPE, multiline set/exercise/workout notes, name, local start time, elapsed duration, set/exercise additions and removals, and exercise ordering. Snapshot failures prevent entry/deletion with a logged, readable error. Historical additions are performed without invented completion times; empty historical exercises disappear. Imported identity survives edits; deletion atomically tombstones source keys and re-import skips them in preview and execution. Existing live behavior is retained.
- **Files touched:**
  - Core: `src/core/logging/WorkoutLogger.ts`, `src/core/import/StrongImporter.ts`.
  - Worker: `src/worker/WorkerApi.ts` (new methods inside the marked T-050 block, plus the snapshot error helper).
  - History: `WorkoutDetailScreen.tsx`, new `PastWorkoutActions.tsx`, `PastWorkoutEditor.tsx` / `.module.css`, `PastWorkoutExercisePicker.tsx`, `PastWorkoutMetadata.tsx`, `usePastWorkoutEditor.ts`, `pastWorkoutFields.ts` under `src/app/features/history/`.
  - Shared workout pieces: `CheckButton.tsx`, `ExerciseCard.tsx`, `ExerciseCardHeader.tsx`, `SetRow.tsx`, `useCellEditor.ts`, `workoutActions.ts`, new `WorkoutTextField.tsx` / `.module.css` under `src/app/features/workout/`.
  - Tests: new `WorkoutLogger.past.test.ts`, `WorkerApi.past.test.ts`, `workoutActions.past.test.ts`, `SetRow.past.test.ts`, `pastWorkoutFields.test.ts` next to their source areas.
  - Docs: `docs/DATA.md`, concept rows in `docs/ARCHITECTURE.md`, this Handoff only in the task brief.
- **Public API:** `FinishedWorkoutChange`; `WorkoutLogger.requireFinished`, `updateFinished`, `updateExerciseNotes`, `updateSetNotes`, `deleteFinished`, static `deletedSourceKeys`. Existing logger set/exercise operations now give finished additions performed state and remove empty historical entries. Worker methods: `pastWorkout`, `beginPastWorkoutEdit`, `deletePastWorkout`, `updatePastWorkout`, `updateWorkoutExerciseNotes`, `updateWorkoutSetNotes`. Existing mutation signatures stay unchanged. Shared editor/save helper accepts an optional typo callback; cards/rows gain optional note, display-unit and completion-read-only props. New History view components/helpers and `WorkoutTextField` have documented exports.
- **Decisions taken:**
  - The explicit tombstone requirement in specification 5 is interpreted as a narrow exception to the general "Do not touch import/export" scope line. The only importer change is duplicate detection against the logger-owned deleted-key set (including preview counts); parsing/export are untouched.
  - Metadata and notes commit on field blur, matching the live pad's cell-change / Done saving. Weight/reps save immediately at commit and then show the existing typo prompt; Save anyway acknowledges the saved value, Fix reopens its cell. Done drains writes and waits for outstanding checks/errors.
  - Start changes preserve exact elapsed duration, missing ends stay unknown, and the duration input uses minutes converted to core seconds. Historical unit changes affect the workout entry only, retaining future defaults and exact kilograms. Mixed-unit rows use the displayed header unit to decide their suffix.
  - Reorder means exercise order, matching the existing live screen. Removing all historical exercises leaves the workout for subsequent editing or explicit deletion. No live completion toggles, rest timers or generated warm-ups run in History.
  - `deletedSourceKeys` is a JSON array in the existing appSetting table, owned by WorkoutLogger to avoid a schema or settings-file change. Malformed protection fails closed. Backups retain it; restoring a pre-deletion backup restores that earlier state.
- **Open questions / left over:** Must still inspect and tap through at 430 × 932 in dark and light, including number pad, scrolling, long names, picker, empty state, errors and delete confirmation. The browser tool returned "The browser access host is unavailable", so no visual or simulator result is claimed. Vite emits its non-fatal bundle-size advisory (>500 kB). No migration, analytics formula, chart, measurement or library changes.
- **How it was verified:** `make format`, then `make verify` passed: formatting, ESLint, all strict TypeScript projects, **993 tests in 133 files**, production build and PWA generation. **25 new tests**: 9 core (real `Database.openInMemory()` + `migrate`), 6 worker (real SQLite with only OPFS file I/O simulated), 3 typo/action helper, 3 rendered shared-row regressions, 4 time-field helpers. Includes snapshot bytes before edits/deletion, failed snapshots blocking both operations, serialized snapshot/write ordering, one notification per write, exact unrelated-field preservation, empty-exercise cleanup, edited-source identity, tombstones surviving backup/re-import, malformed tombstones, unchanged live paths, mixed units, multiline notes and timezone/DST display. `git diff --check` also passed.
