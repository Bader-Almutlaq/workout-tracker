# Workout Tracker: instructions for every agent

A personal iPhone workout tracker that replaces Strong. The owner is an advanced lifter who **does not read the code**. Agents build and maintain everything, often several at once and from different providers (Claude Code, Codex, others). The repository is the only shared memory, so everything an agent needs must be written down here.

This file is the single entry point. `CLAUDE.md` imports it; Codex and other tools read it directly.

## Start of every session (5 minutes, always)

1. Read this file.
2. Read `docs/PLAN.md`: product principles, milestones and **Status** (where the project is).
3. Read `docs/tasks/BOARD.md`: which tasks are open, in progress (and by whom, on which branch) or in review.
4. If you were given a task ID, read its file in `docs/tasks/`. If not, ask the owner or the lead which task to take; never start unlisted work.
5. Read `docs/agents/WORKFLOW.md` if you will change code. It covers claiming a task, branches, parallel work, review and handoff.
6. Before touching an area, read the doc that owns it: `docs/ARCHITECTURE.md` (code structure and who owns each concept), `docs/DATA.md` (storage, backups, import), `docs/DESIGN.md` (visual system, charts), `docs/DECISIONS.md` (why things are the way they are).

**End of every session:** update your task file's *Handoff* section and `docs/tasks/BOARD.md`. Update `docs/PLAN.md` Status only when a milestone changes. A session that ends without a handoff note loses its work for the next agent.

## Product rules

- **Measure, don't prescribe.** The app records and calculates; training decisions stay with the owner. Progression logic is opt-in and user-defined. Labels are descriptive ("+12% vs 4-week average"), never verdicts ("Overreaching").
- No AI features, exercise videos, social, streaks or celebrations. Keep the UI uncluttered.
- Every analytics formula cites its source from `reports/Workout tracker app research.md` in its doc comment, or is marked `Heuristic:` with the reason.
- **Data safety first.** Never ship a migration, importer, merge or restore path that can lose data without taking a snapshot first. Weights are stored in kilograms exactly as entered, with the unit they were typed in; display conversion happens only in the UI layer.
- The owner's real Strong export lives in `export_data/` (git-ignored). Never commit it, never copy it into tests or fixtures, never paste its contents into docs. Only the `StrongImportReport` developer tool reads it.

## Engineering rules

**One concept, one implementation, one place.**
- Each concept (e1RM, fractional sets, unit conversion, outlier check, backup, search…) has exactly one implementation in `WorkoutCore`. Views and other code call it; they never re-derive it.
- `docs/ARCHITECTURE.md` → *Concept ownership* lists the owner of every concept. Check it before writing anything, and add a row when you add a concept.
- One primary type per file, with the file named after the type.

**Layers** (see `docs/ARCHITECTURE.md`):
- `Packages/WorkoutCore`: models, database, import, library, search, analytics and backup. No SwiftUI and no UIKit. Everything can be tested with `swift test` on the Mac.
- `App/`: SwiftUI only. Views hold no business logic: they render state from an `@Observable` model and forward user intent to it.
- Dependencies point inward only: App → WorkoutCore, never the reverse. The App never imports GRDB.

**Swift style.**
- Swift 6 language mode with strict concurrency. Use value types (`struct`, `enum`) by default. Use `actor` or `@MainActor` for shared mutable state; never `@unchecked Sendable` without a comment explaining why it is safe.
- No force unwraps (`!`), `try!` or `fatalError` outside tests.
- Errors are typed `enum`s conforming to `Error` and `LocalizedError`, with a message the owner can read. Never swallow errors: log them and surface them.
- Logging uses `os.Logger` through `Log` (subsystem `com.ketchup.workouttracker`; categories `database`, `backup`, `import`, `analytics`, `ui`). No `print`.
- Names are full words (`estimatedOneRepMax`, not `e1rm`) except the domain abbreviations defined in `docs/ARCHITECTURE.md` (RIR, RPE, e1RM).
- No magic numbers. Constants live in a named `enum` namespace with a doc comment and a citation.
- No dead code, no commented-out code, no speculative protocols, and no abstractions with a single implementation "for later".

**Documentation.**
- Every public type, function and property gets a `///` doc comment: what it is, its units and edge cases. Formulas include the equation and the citation.
- Comments explain *why*, not what.
- Record non-obvious choices in `docs/DECISIONS.md` (newest last).

**Tests.**
- Swift Testing (`import Testing`, `@Test`, `#expect`). Every `WorkoutCore` feature ships with tests: the happy path, edge cases, and a regression test for every bug fixed.
- Formulas are tested against the worked examples in the research report.
- Fixtures are small and synthetic (`Tests/WorkoutCoreTests/Fixtures/`).

**Database.**
- Migrations are append-only. Never edit a migration that has shipped; add a new one. Reference data (such as muscle rows) is written out inside the migration, frozen.
- The app takes a local snapshot automatically before running pending migrations.

**UI.** Follow `docs/DESIGN.md` (Linear-inspired tokens in `App/DesignSystem/`; views use tokens only). Charts use Swift Charts only.

## Commands

All common commands live in the `Makefile`; run `make help` to list them. Use them, not ad-hoc commands, so every agent builds the same way.

| Command | What it does |
|---|---|
| `make test` | WorkoutCore unit tests on the Mac (fast, no simulator) |
| `make build` | Builds the iOS app for the simulator, with no signing |
| `make verify` | `test` + `build`. **Must pass before any task is marked done** |
| `make sim` | Builds, installs and launches the app on the booted simulator |
| `make import-report` | Dry-runs the Strong importer on the owner's export and prints totals and flagged sets |

## Environment

- Xcode 27.1 at `/Applications/Xcode.app`. The Makefile sets `DEVELOPER_DIR` itself, so `xcode-select` doesn't matter.
- The Xcode project is generated by XcodeGen from `project.yml`. Edit `project.yml`, never `*.xcodeproj` (it is git-ignored and regenerated).
- Signing uses a free Apple ID (Personal Team). The team ID goes in `Config/Local.xcconfig` (git-ignored). Bundle ID `com.ketchup.workouttracker` is fixed forever: changing it orphans the data on the phone.
- The owner's shell has the RTK command rewriter. If a command misbehaves (for example `ls` with flags), prefix it with `rtk proxy`.

## Git

- `main` holds finished, verified milestones. Work happens on a branch per task (`task/T-012-short-name`) or per milestone; see `docs/agents/WORKFLOW.md`.
- Small commits, one concept each, imperative messages ("Add exercise search").
- Never force-push, rewrite `main`, or delete branches that others may be using.
