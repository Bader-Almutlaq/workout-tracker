# Task board

Check this first and update it last (see `docs/agents/WORKFLOW.md`). Newest milestone at the top.

**Current milestone:** M2, exercise library and search. Milestone branch: `m2-exercise-library`.
**Lead:** Claude Opus (main chat).

## M2: Exercise library and search

| ID | Task | Status | Agent | Branch |
|---|---|---|---|---|
| T-001 | Curated library file, muscle taxonomy, schema v2, seeding, name resolver, editor and merge | done | Claude Opus (lead) | `m2-exercise-library` |
| T-002 | In-memory exercise search and import-name suggestions | done | Claude Sonnet (subagent), reviewed by lead | `m2-exercise-library` |
| T-003 | Exercise catalog queries (entries, detail, unmatched imports) | done | Claude Opus (lead) | `m2-exercise-library` |
| [T-004](T-004-exercises-tab.md) | Exercises tab: browse, search, filters, detail, custom exercises | todo | | |
| [T-005](T-005-strong-matching.md) | Strong matching screen | todo | | |
| T-006 | App icon (SVG source → PNG asset) | todo | lead | |
| T-007 | Run M1 + M2 screens in the simulator; fix what looks wrong | blocked: iOS simulator runtime still downloading | lead | |

## Next milestones (tasks are written when the milestone starts)

- **M3: Logging.** The active-workout screen, per-exercise unit toggle, live typo check and rest timer.
- **M5/M6: Analytics.** The "recent vs baseline" signature chart (spec in `docs/DESIGN.md` → *Signature chart*), muscles, intensity × volume.

## Done milestones

- **M0:** skeleton, database, backups (on `main`).
- **M1:** Strong import and History (branch `m1-strong-import`, merged into `main` on 2026-10-30).
