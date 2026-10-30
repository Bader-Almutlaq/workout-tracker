# T-017: Settings → Import from Strong: pick files, review, import, result

- **Milestone:** W1
- **Depends on:** T-014 (import core)
- **Model tier:** mid

## Goal

From Settings, the owner picks the Strong export files on the phone, reviews which exercises were in pounds and which sets look like typos, and imports everything with a safety snapshot first, exactly as the native import flow did.

## Read first

- `docs/DATA.md` → *Strong export*, *Typo and outlier checks*; T-014's handoff; `src/core/import/`.
- Native screens: `reference/native/App/Features/Import/` (`StrongImportModel.swift`, `StrongImportView.swift`, `FindingGroupCard.swift`).
- `src/worker/WorkerApi.ts`, `src/worker/OnDeviceStore.ts` (`takeSnapshot`), `src/app/features/settings/SettingsScreen.tsx`.

## Scope

- **Create:** `src/app/features/import/` (the flow screens and CSS modules).
- **Edit:** `WorkerApi.ts`: `planStrongImport(files: { name: string; text: string }[])` and `runStrongImport(options)` in block `// Strong import (T-017)`. The worker keeps the last plan between the two calls; `runStrongImport` takes a snapshot, then imports, then notifies listeners. `SettingsScreen.tsx`: an "Import from Strong…" row. `App.tsx`: route `/settings/import` (handed over).
- **Do not touch:** core import logic (report problems in the handoff), migrations.

## Specification

- File input with `multiple` and `accept=".csv,text/csv"`; the screen reads each file's text and sends `{ name, text }` to the worker.
- Steps, as in the native flow: **Review** (totals; pound-unit exercises with a per-exercise override; flagged sets grouped by finding with confirm / fix / ignore) → **Import** (progress) → **Result** (counts added, skipped as already imported). Errors show the `ImportError` message.
- Safe to repeat: the footnote under the row says "Safe to repeat: workouts already imported are skipped."

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] UI: the whole flow in Safari on the iPhone 15 Pro Max simulator with a synthetic export (copy one from T-014's fixtures into a temporary file; never the owner's), dark and light, including a re-import that adds nothing.

## Handoff

- **Status:** Implementation complete; visual and simulator acceptance checks remain outstanding.
- **What was done:** Added the Settings entry and import route, CSV picking, review of totals and detected pound units, grouped suspicious-set decisions and manual edits, blocking progress, and result counts. The worker retains the source and rebuilds the plan for decisions; it takes a snapshot before the transaction and notifies listeners after success.
- **Files touched:** `src/worker/WorkerApi.ts`, `src/app/App.tsx`, `src/app/features/settings/SettingsScreen.tsx`, `src/app/features/import/StrongImportScreen.tsx`, `src/app/features/import/StrongImportScreen.module.css`, and this handoff. Core import and migrations were not changed.
- **Decisions taken:** Added `reviewStrongImport` to rebuild the plan off the UI thread when decisions change. Only one workouts file may be selected at a time: line numbers identify review decisions and collide across multiple workouts files; any number of measurement files can accompany it. Unreviewed findings import as logged, matching the native flow.
- **Open questions / left over:** Run the complete flow on iPhone 15 Pro Max Safari in dark and light with a synthetic fixture, including flagged-set edits, errors, and re-import. Confirm layout, keyboard, safe areas, snapshot and actual phone import timing. No real export was read. The changes are uncommitted as requested.
- **How it was verified:** `make verify` passed (lint, type checks, 277 tests, production build). Existing core tests cover planning, corrections and idempotent importing; the new UI and worker integration were not exercised end-to-end. `make dev` failed with `listen EPERM` on port 5173 under the sandbox, preventing simulator and browser checks.
