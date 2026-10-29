# Architecture

## Folder layout

```
workout-tracker/
├── AGENTS.md                Rules and start-of-session routine for every agent (CLAUDE.md imports it)
├── docs/                    PLAN, architecture, data, design, decisions
│   ├── agents/WORKFLOW.md   How agents claim tasks, work in parallel, review and hand off
│   └── tasks/               Task board (BOARD.md) and one brief per task
├── design/                SVG sources for graphics (app icon); `make icon` renders them
├── tools/                 Small developer scripts used by the Makefile
├── Makefile                 The only build/test entry point (`make help`)
├── project.yml              XcodeGen spec for the iOS app (source of truth for the .xcodeproj)
├── Config/                  Build settings (.xcconfig); Local.xcconfig is git-ignored
├── App/                     iOS app target: SwiftUI only
│   ├── WorkoutTrackerApp.swift   Entry point; builds the dependency graph once
│   ├── AppEnvironment.swift      Owns the long-lived services (database, backups)
│   ├── DesignSystem/             Colors, typography, spacing, reusable components
│   ├── Features/<Feature>/       One folder per screen area: View(s) + its @Observable model
│   └── Resources/                Asset catalog, Info.plist
├── Packages/WorkoutCore/    Swift package: all logic, no UI
│   ├── Sources/WorkoutCore/
│   │   ├── Database/        Connection, migrations, snapshot-before-migrate
│   │   ├── Models/          Persisted record types (one per file)
│   │   ├── Backup/          Snapshot writing, retention, restore
│   │   ├── Units/           kg/lb conversion and original-unit inference
│   │   ├── Import/          Strong CSV parsing and planning          (M1)
│   │   ├── Library/         Exercise library, muscles, search, edits (M2)
│   │   │   └── Resources/library.json   The curated library (edit this to add exercises)
│   │   ├── Queries/         Read-only queries behind screens
│   │   ├── Validation/      Typo / outlier checks
│   │   ├── Analytics/       e1RM, trend, volume, intensity…          (M5)
│   │   └── Support/         Logging and other shared plumbing
│   └── Tests/WorkoutCoreTests/   Mirrors Sources/ folder by folder
├── reports/, research_notes/     Research behind every formula
└── export_data/             The owner's real Strong export (git-ignored, never committed)
```

## Layers and dependency direction

```
App (SwiftUI views → @Observable feature models)
        │  calls
        ▼
WorkoutCore (services → models → database)
        │
        ▼
GRDB.swift (SQLite)
```

- **WorkoutCore** knows nothing about SwiftUI or UIKit. It compiles and tests on macOS with `swift test`, which keeps the feedback loop fast.
- **Feature models** (`@Observable`, `@MainActor`) translate user intent into WorkoutCore calls and hold view state. One per screen area.
- **Views** only render and forward taps.
- Services are created once in `AppEnvironment` and passed down, so there are no singletons and no hidden global state.

## Glossary (allowed abbreviations)

| Term | Meaning |
|---|---|
| RPE | Rating of perceived exertion, 1–10 scale (Zourdos 2016) |
| RIR | Reps in reserve; RIR = 10 − RPE |
| e1RM | Estimated one-rep max, in kg |
| Hard set | A working set at RIR ≤ 4 (or RIR unknown) |
| Fractional sets | Hard sets weighted 1.0 for primary muscles and 0.5 for secondary (Pelland 2025) |
| Block | A user-marked training period (mesocycle) used for comparisons |

## Concept ownership

Each concept is implemented once, in one place. When adding a concept, add a row here.

| Concept | Owner (WorkoutCore) |
|---|---|
| Database connection and migrations | `Database/AppDatabase.swift`, `Database/Migrations.swift` |
| Schema (tables, columns) | `Database/Migrations.swift` |
| Writing a consistent single-file snapshot | `AppDatabase.writeSnapshot` (used for pre-migration, pre-restore and cloud backups) |
| Backup, prune, restore, validate a backup file | `Backup/BackupService.swift` |
| When to back up; which backups to keep | `Backup/BackupPolicy.swift` |
| Backup file naming and ordering | `Backup/BackupFile.swift` |
| Remembering the iCloud Drive folder | `Backup/BackupFolderBookmark.swift` |
| iCloud-safe file copy/delete | `Support/CoordinatedFile.swift` |
| kg ↔ lb conversion, display rounding, original-unit inference | `Units/WeightUnit.swift`, `Units/Weight.swift` |
| Logging categories | `Support/Log.swift` |
| Stored record types (one per table) | `Models/` |
| CSV reading | `Import/CSVTable.swift` |
| Strong file formats and timestamps | `Import/StrongWorkoutsFile.swift`, `Import/StrongMeasurementsFile.swift`, `Import/StrongTimestamp.swift` |
| Which unit an exported exercise is in | `Import/ExportUnitResolver.swift` |
| Import review (plan, decisions) and writing it | `Import/StrongImportPlan.swift`, `Import/StrongImportOptions.swift`, `Import/StrongImporter.swift` |
| Typo / outlier detection (import review and, later, live logging) | `Validation/SetPlausibility.swift` |
| History list and workout detail queries | `Queries/WorkoutHistory.swift` |
| Muscle taxonomy (23 muscles, delts split) and regions | `Library/Muscle.swift`, `Library/MuscleRegion.swift`; DB rows frozen in migration v2 |
| Equipment, movement patterns, mechanic, set tracking kinds | `Library/Equipment.swift`, `Library/MovementPattern.swift`, `Library/Mechanic.swift`, `Library/ExerciseTracking.swift` |
| The built-in exercise list (names, muscles, aliases) | `Library/Resources/library.json`, loaded and validated by `Library/ExerciseLibrary.swift` |
| Exercise naming ("Movement (Equipment)") and stable keys | `ExerciseLibrary.name(movement:equipment:)`, `ExerciseLibrary.key(forName:)` |
| Copying the library into the database on launch | `Library/ExerciseLibrarySeeder.swift` |
| Name or alias → exercise | `Library/ExerciseNameResolver.swift` |
| Creating, editing, archiving and merging exercises | `Library/ExerciseEditor.swift` |
| Search text normalisation, slang, typo distance | `Library/SearchText.swift`, `Library/GymSlang.swift` |
| Exercise search and import-name suggestions | `Library/ExerciseSearch.swift` |
| Exercise list, detail and unmatched-import queries | `Queries/ExerciseCatalog.swift` |
| Key–value app settings | `Database/AppSetting.swift` |

App-side owners: color, type, spacing and radius tokens in `App/DesignSystem/`; weight-to-text formatting in `App/DesignSystem/WeightFormatting.swift`; the backup screen and automatic background backup in `App/Features/Settings/BackupSettingsModel.swift`; the import flow in `App/Features/Import/`; history in `App/Features/History/`.

Developer tool: `Packages/WorkoutCore/Sources/StrongImportReport` (`make import-report`) dry-runs the importer on `export_data/` and prints totals, unit verdicts and flagged sets. It's the only code allowed to read the owner's real export.
