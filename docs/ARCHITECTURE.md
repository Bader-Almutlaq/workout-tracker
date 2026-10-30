# Architecture

## Folder layout

```
workout-tracker/
├── AGENTS.md                Rules and start-of-session routine for every agent (CLAUDE.md imports it)
├── docs/                    PLAN, architecture, data, design, decisions
│   ├── agents/WORKFLOW.md   How agents claim tasks, work in parallel, review and hand off
│   └── tasks/               Task board (BOARD.md) and one brief per task
├── Makefile                 The only build/test entry point (`make help`)
├── index.html               The page shell: iOS Home Screen meta tags, root element
├── vite.config.ts           Build, offline support (service worker) and the Home Screen manifest
├── eslint.config.js         Lint rules, including the layer boundaries
├── tsconfig.*.json          core (no DOM), app (DOM + worker), node (tools); `make typecheck` runs all three
├── public/                  Home Screen icons (rendered by `make icon`)
├── design/                  SVG sources for graphics (app icon)
├── tools/                   Developer scripts run on the Mac (icon renderer, import report)
├── src/
│   ├── core/                WorkoutCore: all logic, no UI, synchronous, tested in Node
│   │   ├── db/              Database wrapper, migrations, settings
│   │   ├── models/          Row types, one per table                       (W1)
│   │   ├── units/           kg/lb conversion and original-unit inference   (W1)
│   │   ├── import/          Strong CSV parsing, planning, importing        (W1)
│   │   ├── validation/      Typo / outlier checks                          (W1, W3)
│   │   ├── queries/         Read-only queries behind screens               (W1–W3)
│   │   ├── backup/          Validating and restoring backup files          (W1)
│   │   ├── library/         Exercise library, muscles, search, edits       (W2)
│   │   │   └── library.json The curated library (edit this to add exercises)
│   │   ├── logging/         Writing a workout as it happens                (W3)
│   │   ├── analytics/       e1RM, trend, volume, intensity…                (W5)
│   │   └── support/         Logging and other shared plumbing
│   ├── worker/              The Web Worker that owns the live database
│   │   ├── database.worker.ts   Entry point: opens the store, exposes the API
│   │   ├── OnDeviceStore.ts     The database file on the phone, safety snapshots
│   │   └── WorkerApi.ts         Everything the screen may ask of the database
│   └── app/                 React screens
│       ├── main.tsx, App.tsx    Entry point, routes and tab bar
│       ├── data/                The worker client (`database`), `useDatabaseQuery`, offline/updates, storage
│       ├── design/              tokens.css, global.css, shared components
│       ├── appearance/          System / Dark / Light preference
│       └── features/<area>/     One folder per screen area
├── reference/native/        The archived Swift app: read-only spec for the port (W1–W3), then deleted
├── reports/, research_notes/     Research behind every formula
└── export_data/             The owner's real Strong export (git-ignored, never committed)
```

## Layers and dependency direction

```
src/app (React screens)
        │  async calls through `database` (Comlink)
        ▼
src/worker (WorkerApi: one method per screen need)
        │  synchronous calls
        ▼
src/core (WorkoutCore: services → models → Database)
        │
        ▼
SQLite (WebAssembly) on the phone's private file system
```

- **WorkoutCore** knows nothing about React, the DOM or workers. Its TypeScript config has no DOM types, so it can't reach the screen, files or the network. It runs and tests in Node, which keeps feedback fast.
- **The worker** is the only place the live database is opened. Each `WorkerApi` method calls WorkoutCore and returns plain data (results are copied between threads). Write methods notify subscribers, so every open screen refreshes.
- **Screens** read with `useDatabaseQuery(key, () => database.someRead(...))` and write with `await database.someWrite(...)`. They hold view state only (what's selected, what's being typed).
- ESLint (`eslint.config.js`) fails the build if core imports app/worker/React, or if the app imports SQLite or `core/db`.

## Glossary (allowed abbreviations)

| Term | Meaning |
|---|---|
| RPE | Rating of perceived exertion, 1–10 scale (Zourdos 2016) |
| RIR | Reps in reserve; RIR = 10 − RPE |
| e1RM | Estimated one-rep max, in kg |
| Hard set | A working set at RIR ≤ 4 (or RIR unknown) |
| Fractional sets | Hard sets weighted 1.0 for primary muscles and 0.5 for secondary (Pelland 2025) |
| Block | A user-marked training period (mesocycle) used for comparisons |
| OPFS | The browser's private file system, where the database lives on the phone |

## Concept ownership

Each concept is implemented once, in one place. When adding a concept, add a row here. Rows marked *(to port)* name the native file in `reference/native/Packages/WorkoutCore/Sources/WorkoutCore/` that specifies them.

| Concept | Owner |
|---|---|
| SQLite access (queries, transactions, export/import bytes) | `src/core/db/Database.ts` |
| Schema and migrations | `src/core/db/migrations.ts` |
| Opening the database on the phone; safety snapshots | `src/worker/OnDeviceStore.ts` |
| What the screen can ask of the database | `src/worker/WorkerApi.ts` |
| Running a query from a screen and refreshing after writes | `src/app/data/database.ts` (`useDatabaseQuery`) |
| Offline support and "Update ready" | `src/app/data/appUpdate.ts` |
| Asking the browser to keep storage | `src/app/data/persistentStorage.ts` |
| Logging categories | `src/core/support/log.ts` |
| Light / dark preference | `src/app/appearance/appearance.ts` |
| Color, type, spacing, radius and motion tokens | `src/app/design/tokens.css` |
| Key–value app settings | `src/core/db/AppSetting.ts` (`AppSettingKey` lists every key) |
| kg ↔ lb conversion, display rounding, original-unit inference | `src/core/units/WeightUnit.ts`, `src/core/units/Weight.ts` |
| Stored record types (one per table), 0/1 → boolean conversion | `src/core/models/` (`from<Type>Row`) |
| CSV reading | `src/core/import/CsvTable.ts` *(to port: `Import/CSVTable.swift`)* |
| Strong file formats and timestamps | `src/core/import/` *(to port: `Import/Strong*.swift`)* |
| Which unit an exported exercise is in | `src/core/import/ExportUnitResolver.ts` *(to port)* |
| Import review (plan, decisions) and writing it | `src/core/import/StrongImportPlan.ts`, `StrongImporter.ts` *(to port)* |
| Typo / outlier detection (import review and live logging) | `src/core/validation/SetPlausibility.ts` *(to port)* |
| Live typo check for one set | `src/core/validation/LiveSetCheck.ts` *(to port)* |
| History list and workout detail queries | `src/core/queries/WorkoutHistory.ts` *(to port)* |
| Backup file naming, validation and restore | `src/core/backup/` and `OnDeviceStore` *(new for web, W1)* |
| Muscle taxonomy (23 muscles, delts split) and regions | `src/core/library/Muscle.ts` *(to port)*; rows frozen in `v1-schema` |
| Equipment, movement patterns, mechanic, tracking kinds | `src/core/library/` *(to port)* |
| The built-in exercise list (names, muscles, aliases) | `src/core/library/library.json`, loaded by `ExerciseLibrary.ts` *(to port)* |
| Exercise naming ("Movement (Equipment)") and stable keys | `ExerciseLibrary` *(to port)* |
| Copying the library into the database on launch | `src/core/library/ExerciseLibrarySeeder.ts` *(to port)* |
| Name or alias → exercise | `src/core/library/ExerciseNameResolver.ts` *(to port)* |
| Creating, editing, archiving and merging exercises | `src/core/library/ExerciseEditor.ts` *(to port)* |
| Search text normalisation, slang, typo distance | `src/core/library/SearchText.ts`, `GymSlang.ts` *(to port)* |
| Exercise search and import-name suggestions | `src/core/library/ExerciseSearch.ts` *(to port)* |
| Exercise list, detail and unmatched-import queries | `src/core/queries/ExerciseCatalog.ts` *(to port)* |
| Logging a workout live | `src/core/logging/WorkoutLogger.ts` *(to port)* |
| What was done last time for an exercise | `src/core/queries/PreviousPerformance.ts` *(to port)* |
| The workout in progress as the logging screen shows it | `src/core/queries/LiveWorkout.ts` *(to port)* |

Developer tool: `tools/import-report.ts` (`make import-report`, W1) dry-runs the importer on `export_data/` and prints totals, unit verdicts and flagged sets. It's the only code allowed to read the owner's real export.
