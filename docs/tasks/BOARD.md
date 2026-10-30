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
| [T-029](T-029-template-screens.md) | Template screens: list with folders on the Workout tab, editor, save-as-template | done | Claude Sonnet (subagent), reviewed by lead | merged |
| [T-030](T-030-history-calendar.md) | History calendar | done | Codex Terra (high), reviewed by lead | merged |
| [T-031](T-031-template-follow-ups.md) | Template follow-ups: reorder, discard prompt, seconds label | done (lead fixed timed targets landing in reps) | Codex Terra (high), reviewed by lead | merged |

## W5: Analytics engine

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-032](T-032-e1rm-and-trend.md) | Effective reps, e1RM, session values and trend | done | Codex Sol (high), reviewed by lead | merged |
| [T-033](T-033-volume-and-baseline.md) | Hard sets per muscle, weekly volume, recent vs baseline | done | Codex Sol (high), reviewed by lead | merged |

## W6: Analytics screens

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-034](T-034-strength-chart.md) | Strength chart on exercise detail + shared chart pieces | done | Codex Sol (high), reviewed by lead | merged |
| [T-035](T-035-analytics-muscles.md) | Analytics tab: weekly sets per muscle | done | Codex Terra (high), reviewed by lead | merged |
| [T-036](T-036-signature-chart.md) | Signature chart (recent vs baseline) on the Analytics tab, plus chart polish | done | Codex Sol (high), reviewed by lead | merged |

## Quality

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| [T-037](T-037-audit-data-safety.md) | Audit: no data loss | done (9 fixes, 34 tests) | Codex Sol (high), reviewed by lead | merged |
| [T-038](T-038-audit-data-accuracy.md) | Audit: data accuracy | done (6 fixes, 21 tests) | Codex Sol (high), reviewed by lead | merged |
| [T-039](T-039-e2e-fixes.md) | Fixes from the end-to-end check (set notes, warm-up prefill, template stamp, set counts, import preview) | done | Codex Terra (high), reviewed by lead | merged |
| [T-040](T-040-import-leave-out.md) | Leave out a flagged set at import | done | Codex Terra (high), reviewed by lead | merged |
| [T-041](T-041-backup-on-finish-and-one-tap-clean.md) | Backup button on every finish; leave out all flagged sets in one tap | done | Codex Terra (high), reviewed by lead | merged |
| [T-042](T-042-dropbox-backup.md) | Automatic backup to Dropbox (R11) | done (live Dropbox connect checked by owner) | Codex Sol + Terra (high), reviewed by lead | merged |
| [T-043](T-043-measurements.md) | Body measurements: sites with how-to notes, flexed/relaxed, history and change (R1) | done (polish in T-043b) | Codex Sol (high), reviewed by lead | merged |
| [T-044](T-044-loadable-weights-and-warmups.md) | Loadable weights + auto warm-up sets | doing | Codex Sol (high) | `task/T-044-warmups` |
| [T-043b](T-043b-body-polish.md) | Body screen polish | doing | Codex Terra (high) | `task/T-043b-body-polish` |
| [T-045](T-045-finish-comparison-and-bests.md) | Finish screen: compared with last time, personal bests | done | Codex Terra (high), reviewed by lead | merged |

## Next milestones (tasks are written when the milestone starts)

- **On hold:** chart changes, until the owner has reviewed the charts (`docs/PLAN.md` → R0).
- **Owner's roadmap R1–R6** (`docs/PLAN.md` → *Roadmap*): measurements page, bigger library, exercise variants, programs, per-workout analytics, live-workout polish. Designed with the owner before tasks are written.
- **W6 (rest): Intensity × volume.** Rep-range mix, RIR histogram, intensity–volume map (`docs/PLAN.md` → analytics item 3).

## Done milestones

- **W0:** web skeleton: SQLite in a worker on the phone, migrations with snapshot, offline support, tokens, tabs, Appearance (branch `web`, 2026-10-30).

## Archived: native app (2026-10-29 → 2026-10-30)

Tasks T-001 to T-012 built M0–M3 natively in Swift. That code is the spec for W1–W3 (`reference/native/`, full history on branch `native-archive`). Their briefs stay in this folder for reference; T-004, T-005, T-009 and T-010 describe screens that W2–W3 rebuild, and T-010's number pad and set-row spec carries over unchanged.
