# T-037: Audit: no data loss

- **Milestone:** quality · **Depends on:** none · **Model tier:** strong (Codex Sol)
- **Runs in parallel with:** T-038 (data accuracy). Stay inside your file areas below; if a fix needs a file outside them, describe it in the Handoff instead of editing.

## Goal

The owner asked for proof that the app never loses or corrupts data. Hunt for every path where a workout, set, template, exercise, measurement or setting could be lost, duplicated or silently changed, prove each risk with a failing test, fix it, and leave a written verdict per area.

## Read first

- `AGENTS.md` (data-safety rules), `docs/DATA.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (storage-never-deleted, snapshots).
- `src/worker/OnDeviceStore.ts`, `src/worker/WorkerApi.ts`, `src/core/db/*`, `src/core/backup/*`, `src/core/import/StrongImporter.ts`, `src/core/logging/*`, `src/core/templates/*`, `src/core/library/ExerciseEditor.ts` (custom exercises, merge, delete).

## Scope (your file areas)

- **May edit and add tests in:** `src/core/db/`, `src/core/backup/`, `src/core/logging/`, `src/core/templates/`, `src/core/library/ExerciseEditor*`, `src/core/import/StrongImporter*`, `src/worker/`.
- **Do not touch:** `src/app/` (no UI or chart changes: the owner put charts on hold), `src/core/analytics/`, `src/core/queries/`, `src/core/units/`, the import parsers and plan (T-038 owns those), shipped migrations (append-only: a fix that needs schema goes in a new migration, and only if unavoidable; say so in the Handoff first).

## What to check (each needs at least one test that would fail if the risk were real)

1. **Opening storage:** failed/locked open never deletes or reinitialises the pool; retries; clear error. Second-tab case.
2. **Migrations:** snapshot before every pending migration; a migration that throws leaves the database unchanged (transaction) and the snapshot restorable; running migrate twice is a no-op; v1 → v3 on a populated database keeps every row.
3. **Backup → restore round trip:** every table and column survives byte-for-byte (workouts, sets with all fields, notes, kinds, entry units, RPE, templates with folders/sets, custom exercises, aliases, merges, measurements, settings). Restore takes a safety snapshot first; a corrupt or older/newer-schema backup is refused without touching current data.
4. **Import:** idempotent (importing the same export twice adds nothing); one transaction (a failure part-way leaves nothing behind); snapshot first; importing after app-logged workouts keeps them.
5. **Live workout:** every write (add/edit/delete set, reorder, change kind, notes, finish, discard) persists immediately; a reload mid-workout restores exactly; only one in-progress workout; discard deletes only that workout; finishing twice is harmless.
6. **Deletes and merges:** deleting a workout, template, folder or custom exercise never cascades into other data unexpectedly (e.g. an exercise used in history must not be deletable or must be merged, never dropping sets); merging exercises moves every set, template entry and alias.
7. **Worker API:** every write method notifies listeners and surfaces errors (no swallowed promise rejections).

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Each bug found has a regression test and a fix inside your areas (or a precise description in the Handoff if outside).
- [ ] Handoff lists, per numbered area above: **verdict** (safe / fixed / risk remains), the tests that prove it, and anything you could not test (e.g. real OPFS behaviour in Safari).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **Findings by area (1–7):**
- **Files touched:**
- **Open questions / left over:**
- **How it was verified:**
