# Task board

Check this first and update it last (see `docs/agents/WORKFLOW.md`). Newest milestone at the top.

**Current milestone:** W4, templates and calendar. Milestone branch: `web` (deployed from `main` with `make deploy`).
**Lead:** Claude Opus (main chat).

## W1: Strong import, History and backups

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-013](T-013-units-models-settings.md) | Port units, row types and app settings to WorkoutCore | done | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-014](T-014-strong-import-core.md) | Port the Strong importer and typo checks; `make import-report` | done (report matches the export exactly) | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-015](T-015-history.md) | Port history queries; History list and workout detail screens | done | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-016](T-016-backup-restore.md) | Back up through the share sheet; restore with a safety snapshot | done (share sheet checked in iOS Safari) | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-017](T-017-import-flow.md) | Settings → Import from Strong: pick files, review, import, result | done (flow checked in the browser by lead; split into components in T-021) | Codex Terra (high), reviewed by lead | merged |
| [T-021](T-021-import-screen-components.md) | Split the import screen into small components | done | Codex Terra (high), reviewed by lead | merged |
| [T-018](T-018-hosting.md) | Publish the site and add it to the Home Screen | done: https://bader-almutlaq.github.io/workout-tracker/ (`make deploy`) | lead | `main` |

## W2: Exercise library (started early, in parallel with W1)

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-019](T-019-library-and-search-core.md) | Port the library, muscle taxonomy and search (pure part) | done | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-020](T-020-library-database.md) | Port library seeding, exercise editing and merge, catalog queries | done | Codex Terra (high), finished by lead | merged |
| [T-022](T-022-exercises-tab-and-matching.md) | Exercises tab and Strong matching screen | done | Claude Sonnet (subagent), reviewed by lead | merged |

## W3: Logging (started early)

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-023](T-023-logging-core.md) | Port the logging core (live workout, previous performance, live typo check) | done | Codex Terra (high), reviewed by lead | merged |
| [T-024](T-024-workout-tab.md) | Workout tab: live logging screen | done | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-025](T-025-backup-reminder.md) | Finish summary: quiet "Back up" line when the last backup is over 7 days old | done | Codex Terra (high), reviewed by lead | merged |
| [T-026](T-026-search-tie-breaks.md) | Search tie-breaks prefer common equipment | done | Codex Terra (high), reviewed by lead | merged |
| [T-027](T-027-rest-timer.md) | Rest timer on the logging screen | done | Claude Sonnet (subagent), reviewed by lead | merged |

## W4: Templates and calendar

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-028](T-028-template-core.md) | Template engine: folders, templates, start from a template, save a workout as a template | done | Codex Terra (high), reviewed by lead | merged |
| [T-029](T-029-template-screens.md) | Template screens: list with folders on the Workout tab, editor, save-as-template | review | Claude Sonnet (subagent) | `task/T-029-template-screens` |
| [T-030](T-030-history-calendar.md) | History calendar | done | Codex Terra (high), reviewed by lead | merged |

## Next milestones (tasks are written when the milestone starts)

- **W3: Logging screens.** Workout tab with number pad (spec in T-010), rest timer.
- **W5/W6: Analytics.** The "recent vs baseline" signature chart (spec in `docs/DESIGN.md` → *Signature chart*), muscles, intensity × volume.

## Done milestones

- **W0:** web skeleton: SQLite in a worker on the phone, migrations with snapshot, offline support, tokens, tabs, Appearance (branch `web`, 2026-10-30).

## Archived: native app (2026-10-29 → 2026-10-30)

Tasks T-001 to T-012 built M0–M3 natively in Swift. That code is the spec for W1–W3 (`reference/native/`, full history on branch `native-archive`). Their briefs stay in this folder for reference; T-004, T-005, T-009 and T-010 describe screens that W2–W3 rebuild, and T-010's number pad and set-row spec carries over unchanged.
