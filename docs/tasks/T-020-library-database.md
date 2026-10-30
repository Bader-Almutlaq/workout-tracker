# T-020: Port library seeding, exercise editing and merge, and catalog queries

- **Milestone:** W2
- **Depends on:** T-013, T-019 (both merged into `web`)
- **Model tier:** mid (Codex Terra, high effort)

## Goal

The library's 421 exercises are copied into the database (linking any same-name exercises already there, such as imported Strong ones), the owner can create, edit, archive and merge exercises, and the Exercises screen has the queries it needs: the list, one exercise's detail, and the Strong names not yet matched.

## Read first

- `AGENTS.md` (rules), `docs/agents/WORKFLOW.md`, `docs/ARCHITECTURE.md` (concept table), `docs/DECISIONS.md` (library exercises are read-only; merge keeps the old name as an alias).
- Existing WorkoutCore: `src/core/db/Database.ts` (`transaction`), `src/core/db/migrations.ts` (schema), `src/core/db/AppSetting.ts` (`AppSettingKey.seededLibraryVersion`), `src/core/models/*`, `src/core/library/ExerciseLibrary.ts`, `ExerciseSearch.ts` (its `ExerciseSearchEntry` is what the catalog builds).
- Native spec (read-only) in `reference/native/Packages/WorkoutCore/`: `Sources/WorkoutCore/Library/ExerciseLibrarySeeder.swift`, `ExerciseEditor.swift`, `ExerciseEditError.swift`, `CustomExerciseDraft.swift`, `Sources/WorkoutCore/Queries/ExerciseCatalog.swift`, and tests `Tests/WorkoutCoreTests/Library/ExerciseLibrarySeederTests.swift`, `ExerciseEditorTests.swift`, `Tests/WorkoutCoreTests/Queries/ExerciseCatalogTests.swift`.

## Scope

- **Create:** `src/core/library/ExerciseLibrarySeeder.ts`, `ExerciseEditor.ts`, `ExerciseEditError.ts`, `CustomExerciseDraft.ts`, `src/core/queries/ExerciseCatalog.ts`, each with a `.test.ts`.
- **Do not touch:** anything else. In particular not `src/worker`, `src/app`, `src/core/import`, `src/core/validation`, `src/core/library/ExerciseNameResolver.ts` (another agent owns them right now), migrations, or docs other than this file's Handoff.

## Specification

- Port behaviour and every test case exactly. Functions take `db: Database` first and, where the Swift took a clock, `now: Date`.
- **Snapshots:** in the native app, merge took a snapshot itself. Here core can't touch files: `ExerciseEditor.mergeAll` and `merge` are pure database operations in one transaction, and their doc comments say **the caller (the worker) must take a safety snapshot first**. Seeding needs no snapshot (it only adds rows and links same-name rows), as in the native app.
- **Catalog:** `ExerciseCatalog.entries(db, library)` returns `ExerciseSearchEntry[]` (dates as `Date`), `detail(db, exerciseId)` and `unmatchedImports(db)`, with the same SQL behaviour and `recentSessionLimit = 10` as a named constant. Results are plain data (they cross threads later).

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Every case in the three native test files is ported and passing.
- [ ] No `any`, `!`, `console`; doc comments on every export; constants named.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
