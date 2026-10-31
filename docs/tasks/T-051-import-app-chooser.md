# T-051: Choose the app first, then import

- **Milestone:** R7 (import) · **Depends on:** none (no schema change) · **Model tier:** mid (Codex Terra)

## Goal

Today Settings has one row, "Import from Strong, Hevy, FitNotes or Fitbod…", and one page that explains all four apps at once. The owner wants the usual flow instead:

1. tap **Import workouts**
2. choose the app
3. follow that app's own export steps and pick its files
4. review and import as today

Each app has its own CSV layout; there is no shared standard. The existing format detection stays as a safety net: picking a file from the wrong app gives a clear message instead of a confusing import.

## Read first

- `AGENTS.md`; `docs/DATA.md` → *Strong export* and *Other apps*.
- App: `src/app/features/import/` (`StrongImportScreen.tsx`, `ImportPickStep.tsx`, the review and result steps), `src/app/features/settings/SettingsScreen.tsx` (the import row), `src/app/App.tsx` (routes), `src/app/data/readPickedFiles.ts` (always read picked files through it).
- Worker: `src/worker/WorkerApi.ts` → `planStrongImport` (format detection per file, measurement files).
- Core: `src/core/import/formats/detectWorkoutFileFormat.ts`, `src/core/import/ImportError.ts`.

## Scope

- **Create:**
  - `src/app/features/import/ImportSourceScreen.tsx` (the app list)
  - `src/app/features/import/importSources.ts` (+ test): one frozen table of the four apps with their display name, one-line summary, export steps, whether measurement files are accepted, and whether the format is verified against a real export
- **Edit:**
  - the import screen and pick step (per-app instructions)
  - routes:
    - `/settings/import` is the list
    - `/settings/import/:source` is the existing flow for one app
    - an unknown source redirects to the list
  - the Settings row label
  - `planStrongImport` (an expected-format argument)
  - `ImportError` (a new kind)
  - tests, `docs/DATA.md` (one paragraph on the flow), `docs/ARCHITECTURE.md` (a row for `importSources.ts`)
- **Do not touch:** the parsers' behaviour, the review and result steps beyond the title/back link, migrations, charts, backup, export.

## Specification

1. **Settings:** the row reads **Import workouts…** and opens `/settings/import`.
2. **Import list** (`/settings/import`, title "Import workouts", back to Settings):
   - Four rows: **Strong**, **Hevy**, **FitNotes**, **Fitbod**, each with a one-line summary under the name:
     - Strong: "Workouts and body measurements"
     - Hevy: "Workouts"
     - FitNotes: "Workouts (Android app)"
     - Fitbod: "Workouts"
   - Under the list, in note style: "Each app exports its own kind of file. Pick the app you're coming from."
3. **App page** (`/settings/import/:source`, title "Import from Hevy", back to "Import workouts"):
   - Numbered export steps from `importSources.ts`:
     - **Strong:** "In Strong, open Settings → Export Data." / "Save the files to Files." / "Choose the workouts file. You can also choose the measurement files."
     - **Hevy:** "In Hevy, open Profile → Settings → Export & Import Data." / "Tap Export Data, then export your workouts." / "Save the CSV to Files, then choose it here."
     - **FitNotes:** "In FitNotes, open Settings and choose Spreadsheet Export." / "Send the CSV to your iPhone and save it to Files." / "Choose it here."
     - **Fitbod:** "In Fitbod, open Settings and choose Export workout data." / "Save the CSV to Files." / "Choose it here."
   - For Hevy, FitNotes and Fitbod, add a quiet line: "Not yet checked against a real export from this app. Nothing is saved until you've reviewed the import."
   - For Strong, keep: "Nothing is saved until you've reviewed the import."
   - **Choose files…** opens the picker with `multiple`, as today.
4. **Wrong app.** `planStrongImport(files, expectedFormat)`:
   - Each workouts file's detected format must equal `expectedFormat`.
   - If it doesn't, throw `ImportError` with kind `wrongWorkoutFile`, carrying `expected` and `detected`. Message: "This looks like a Hevy export, not a Strong export."
   - An `unknown` format keeps today's message.
   - Strong measurement files are accepted only when `expectedFormat` is `strong`. Otherwise: "Measurement files can only be imported from Strong."
   - On screen, a `wrongWorkoutFile` failure shows the message plus a primary button **Import as Hevy instead**. It re-plans the files already read, without picking again: keep the read contents in state, and navigate to that app's page. "Choose files again" remains as the secondary action.
5. **Review screen:** replace "Detected: Hevy export" with "From Hevy". Everything else is unchanged.
6. **No new pipeline:** review, flagged sets, **Leave out all**, units and idempotent re-import behave exactly as today for every app.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core/worker tests: matching format plans as before; a Hevy file under `strong` throws `wrongWorkoutFile` with expected/detected; a measurement file under `hevy` is refused; an unknown file keeps its message; the existing Strong import tests pass unchanged.
- [ ] App tests: `importSources.ts` covers all four `WorkoutFileFormat` values except `unknown`, each with steps; an unknown route source redirects; the wrong-app message and button text.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
