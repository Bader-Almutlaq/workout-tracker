# Task board

Check this first and update it last (see `docs/agents/WORKFLOW.md`). Newest milestone at the top.

**Current milestone:** W1, Strong import, History and backups. Milestone branch: `web`.
**Lead:** Claude Opus (main chat).

## W1: Strong import, History and backups

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-013](T-013-units-models-settings.md) | Port units, row types and app settings to WorkoutCore | doing | Claude Sonnet (subagent) | `task/T-013-units-models-settings` |
| [T-014](T-014-strong-import-core.md) | Port the Strong importer and typo checks; `make import-report` | todo (after T-013) | | |
| [T-015](T-015-history.md) | Port history queries; History list and workout detail screens | todo (after T-013) | | |
| [T-016](T-016-backup-restore.md) | Back up through the share sheet; restore with a safety snapshot | review | Claude Sonnet (subagent), lead reviews | `task/T-016-backup-restore` |
| [T-017](T-017-import-flow.md) | Settings → Import from Strong: pick files, review, import, result | todo (after T-014) | | |
| [T-018](T-018-hosting.md) | Publish the site and add it to the Home Screen | blocked: owner picks a host | lead | |

## W2: Exercise library (started early, in parallel with W1)

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-019](T-019-library-and-search-core.md) | Port the library, muscle taxonomy and search (pure part) | doing | Claude Sonnet (subagent) | `task/T-019-library-and-search-core` |

## Next milestones (tasks are written when the milestone starts)

- **W2: Exercise library.** Port library, seeding, resolver, editor and merge, search, catalog; Exercises tab; Strong matching screen.
- **W3: Logging.** Port logger, previous performance, live workout, live set check; Workout tab with number pad; rest timer.
- **W5/W6: Analytics.** The "recent vs baseline" signature chart (spec in `docs/DESIGN.md` → *Signature chart*), muscles, intensity × volume.

## Done milestones

- **W0:** web skeleton: SQLite in a worker on the phone, migrations with snapshot, offline support, tokens, tabs, Appearance (branch `web`, 2026-10-30).

## Archived: native app (2026-10-29 → 2026-10-30)

Tasks T-001 to T-012 built M0–M3 natively in Swift. That code is the spec for W1–W3 (`reference/native/`, full history on branch `native-archive`). Their briefs stay in this folder for reference; T-004, T-005, T-009 and T-010 describe screens that W2–W3 rebuild, and T-010's number pad and set-row spec carries over unchanged.
