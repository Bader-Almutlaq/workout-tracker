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

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
