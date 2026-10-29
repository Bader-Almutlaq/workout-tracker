# Workout Tracker: build plan

A personal iPhone app to replace Strong. It keeps 4 years of Strong history, has a much larger exercise library, makes building workouts easy, and gives deep, science-based analytics. Research behind every decision: `reports/Workout tracker app research.md` (details in `research_notes/`).

## Principles

- **Measure, don't prescribe.** The app records and calculates. Training decisions stay with the user. Progression rules are opt-in, per exercise, defined by the user.
- **Literature, not hype.** Every metric must trace to a cited source in the report, or be labelled as a descriptive heuristic.
- **Excluded:** AI features, exercise videos/animations, social, streaks, celebrations, accounts, cloud.
- **Not cluttered.** Logging needs 2–3 taps per set, with last session's numbers always visible inline.
- **Data is irreplaceable.** Never lose a set. Automatic backups to a folder in iCloud Drive (see `docs/DATA.md`). Keep the original Strong CSV forever.
- **Engineering standards** are in `.claude/CLAUDE.md`; structure in `docs/ARCHITECTURE.md`; visual system in `docs/DESIGN.md` (Linear-inspired).

## Platform and install

- Native Swift 6 + SwiftUI, Swift Charts. Xcode 27.1 is at `/Applications/Xcode.app`.
- Signed with a free Apple ID (Personal Team). Apps expire after 7 days, so re-run from Xcode weekly. Reinstalling over the app keeps its data; **deleting it deletes the data**.
- Always sign with the same Apple ID and the same bundle ID.
- Free tier limits: 3 apps per device, 10 App IDs per 7 days, no iCloud, no push. So: one app target, no widget or watch extension at first. Local notifications for the rest timer are fine.
- One-time setup (user, needs password):
  - `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
  - `sudo xcodebuild -license accept`
  - Developer Mode on the iPhone

## Architecture

- **`WorkoutCore`**: a local Swift package with no UI. It holds the models, database, Strong importer, exercise library, search and every analytics formula. Tested with `swift test`.
- **App target**: SwiftUI screens only. Generate the project with XcodeGen (`project.yml`) so it stays diffable. Fall back to a hand-made Xcode project if Homebrew/XcodeGen isn't available.
- **Storage:** SQLite through GRDB.swift (the only third-party dependency). It gives FTS5 search, migrations and fast aggregate queries over about 20k+ sets.
- **Units:** weights stored in kg (as in Strong's export); display unit is a setting.

### Data model (first pass)

| Table | Key fields |
|---|---|
| `muscle` | id, name, group, region. About 20 muscles, with front/side/rear delts split |
| `exercise` | id, name ("Movement (Equipment)"), equipment, pattern (h-push, v-pull, knee, hip…), mechanic (compound/isolation), e1RM category (k), lengthened_bias flag, source (wger / fedb / curated / custom), archived |
| `exercise_muscle` | exercise_id, muscle_id, role (primary 1.0 / secondary 0.5) |
| `exercise_alias` | exercise_id, alias (RDL, OHP, SSB, BSS…) + FTS5 index |
| `workout` | id, start, end, name, notes, template_id, block_id, source (strong / app) |
| `workout_exercise` | id, workout_id, exercise_id, position, superset_group, notes |
| `set` | id, workout_exercise_id, order, type (warmup / working / drop / failure), weight_kg, entry_unit (kg / lb), reps, rpe, rir, duration_s, distance_m, side (both / L / R), rest_before_s, completed_at, notes |
| `template_folder`, `template`, `template_exercise`, `template_set` | Folders, ordered exercises, default sets/reps/RIR/rest, supersets |
| `block` | id, name, goal, start, end, notes |
| `bodyweight` | date, kg |
| `measurement` | date, site (arm L/R, chest, waist, thigh L/R, calf L/R…), cm |
| `import_mapping` | strong_name → exercise_id (saved so re-imports land the same way) |
| `progression_rule` | exercise_id, kind, params (opt-in only) |
| `equipment_profile` | plates, dumbbell list, machine steps (for the calculator) |
| `setting` | key, value |

## Milestones

Each milestone ends with unit tests passing, the app running in the simulator, and a run on the iPhone.

### M0: Skeleton and safety net
- Docs, Makefile, `WorkoutCore` package with GRDB, schema v1 migration, pre-migration snapshot, XcodeGen project, Linear-style design tokens, app shell with tabs.
- Backups: pick an iCloud Drive folder once (security-scoped bookmark); automatic snapshot on going to the background when data changed; "Back up now"; retention (14 newest + 1 per month); restore from a file with a safety snapshot first.
- kg ↔ lb conversion and original-unit inference (`Units/`).

### M1: Strong import (top priority; export is in `export_data/`)
- Parse the owner's layout (comma-delimited, `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE`, durations like `1h 7m`). Also accept the newer semicolon layout with `Workout #` and `Duration (sec)`. Full profile in `docs/DATA.md`.
- Set Order W/D/F → warm-up / drop / failure. Skip "Rest Timer" rows and turn "Note" rows into notes if present.
- Infer the entry unit per set (61.23 kg → 135 lb).
- Import the 15 body-measurement files (`Date,Measurement Type,Value,Unit,Source`).
- **Typo review:** flag sets far outside that exercise's typical weight or reps near that date (missed digit, extra zero). Confirm, fix or ignore each before committing.
- Exercise mapping screen for the 85 names (about 30 custom): exact → split movement/equipment → fuzzy → manual pick or create custom. Save every choice.
- Verify: workout, set and exercise counts and total kg match the file exactly. Re-import is idempotent.

### M2: Exercise library and search
- Merge wger (CC-BY-SA, ~939) and free-exercise-db (Unlicense, ~876), de-duplicate, re-tag muscles with delts split, rename to Strong style.
- Curated additions file (Jefferson curl, SSB squat, Spoto press, seal row, …): 50–150 modern movements.
- Search: FTS5 prefix + trigram for typos, slang dictionary, ranking boosted by your usage frequency and recency.
- Filter chips: muscle, equipment, pattern, compound/isolation, custom. Unlimited custom exercises, clone-and-edit.
- Credits screen for wger attribution.

### M3: Logging
- Active workout screen: previous values inline per set, swipe to copy, large custom number pad.
- Units: per-exercise entry unit (kg or lb) remembered; one-tap kg/lb toggle on the number pad; both units shown on demand.
- Live typo check: a suspicious weight or rep count asks "Is this right?" before saving (same check as the import review).
- RPE or RIR entry (user's choice of scale), set types, supersets, L/R sides, notes (exercise / slot / workout).
- Auto rest timer per exercise and per set, lock-screen notification, actual rest recorded.
- Exercise position and prior same-muscle hard sets recorded automatically.
- Plate and warm-up calculators.

### M4: Workouts and templates
- Folders, drag to reorder, supersets, defaults per exercise, duplicate, start from a template or from any past session.
- Calendar and full history.

### M5: Analytics engine (in `WorkoutCore`, fully unit-tested)
- Effective reps E = reps + RIR (RIR = 10 − RPE; unknown → 2, lower weight).
- e1RM = w × (1 + (E − 1)/k), k by category (38 / 29 / 24 / 20 / 15). Qualifies if not a warm-up, E ≤ 12, RIR ≤ 4.
- Trend: EWMA, α = 1 − e^(−days/τ), τ 14–21 d; hold sessions >15% off the trend.
- Fractional hard sets (primary 1.0, secondary 0.5 or 0.3 setting; hard = RIR ≤ 4), zones <4 / 4–10 / 10–20 / 20–30 / >30, per-session flag >11.
- Relative intensity, rep-range buckets, RIR histogram, intensity–volume points, frequency, balance ratios, drop-off, bodyweight trend, block change (formulas in report section 12).

### M6: Analytics screens
1. **Exercise detail:** e1RM trend, rep-max table, reps at fixed load, like-for-like filters (position, rep range, rest), history.
2. **Muscles:** weekly sets direct vs indirect, body map, frequency, neglected list, balance ratios, exercise share per muscle.
3. **Intensity × volume:** rep-range mix, RIR histogram, intensity–volume map.
4. **Session summary**, **weekly report**, **block comparison**, **all-time** view.

### M7: Body
- Bodyweight with trend; measurements with L/R; strength relative to bodyweight; e1RM and bodyweight overlay.

### M8: Optional (pick later)
- Load calculator (weight for planned reps × RIR from your trend, rounded to your equipment).
- User-defined progression rules per exercise (double progression, RIR target, % e1RM, top set + back-offs), off by default.
- Stall flag with a user threshold; RIR calibration from failure sets; personal k per lift; lengthened-bias share chart.

## Needed from the user

- [x] Xcode license accepted, components installed.
- [x] Strong export (in `export_data/`, git-ignored).
- [ ] Apple ID team ID in `Config/Local.xcconfig` (Xcode → Settings → Accounts) for phone builds.
- [ ] Optional: Strong screenshots as UI reference.
- [ ] iPhone iOS version; preferred effort scale (RPE or RIR); app display name.

## Status

- 2026-10-29: research done, plan written. Docs and engineering rules written.
- 2026-10-29: **M0 code complete.** WorkoutCore: schema v1, snapshot-before-migrate, units (kg/lb, display snapping, entry-unit inference), backups (iCloud folder bookmark, coordinated writes, 15-min throttle, daily/monthly retention, validated restore with safety snapshot). 23 tests pass (`make test`). App: Linear-style tokens, tab shell, Settings → Backups/Restore; `make build` passes with no warnings.
  - Not yet verified: running on a simulator (no iOS simulator runtime downloaded) or on the iPhone (needs `Config/Local.xcconfig` with the team ID). The iCloud folder flow can only be checked on a real device or simulator.
  - Export profiled: per-exercise unit switching explains the odd weights (see `docs/DATA.md`). Owner's unit preference recorded: log in each exercise's unit, analytics in kg.
- 2026-10-29: **M1 code complete** (branch `m1-strong-import`). Parsers for both Strong layouts and measurement files, per-exercise unit detection, typo detection with suggestions, a reviewable import plan, an idempotent importer (snapshot first, one transaction), and history queries. App: Settings → Import from Strong (pick files → review units and flagged sets → import → result) and a live History tab with a workout detail screen. 58 tests pass; app builds with no warnings. Dry run on the real export matches it exactly (see `docs/DATA.md`).
  - Not yet verified: the import and History screens running on a device or simulator.
  - Deferred to M2: matching Strong names to library exercises (see `docs/DECISIONS.md`).
- Next: M2 (exercise library and search).
