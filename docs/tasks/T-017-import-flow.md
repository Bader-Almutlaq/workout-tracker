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

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
