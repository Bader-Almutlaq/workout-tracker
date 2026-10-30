# T-043: Body measurements: sites with how-to notes, flexed and relaxed, history and change

- **Milestone:** R1 · **Depends on:** none (parallel with T-042, which touches no migrations or measurement code) · **Model tier:** strong (Codex Sol: migration with a table rebuild)

## Goal

The owner keeps bookkeeping of body measurements, as in Strong, but better:
- every site carries a note on **where and how to measure** (e.g. "Waist: at the belly button, tape snug, relaxed, after exhaling")
- muscle sites can be logged **flexed and relaxed**
- tapping a site shows its history, a simple chart and how much it changed

Nothing fancier.

**Placement (lead decision):** the Analytics tab gets a two-option switch at the top, **Training · Body**. Body is the measurements home. The tab bar stays at five tabs.

## Read first

- `AGENTS.md` (data safety, migrations append-only), `docs/DATA.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md` (tokens; charts use the shared pieces).
- `src/core/models/BodyMeasurement.ts`, `src/core/db/migrations.ts` (`bodyMeasurement`: `UNIQUE (takenAt, site)`), `src/core/import/StrongMeasurementsFile.ts` (site slugs such as `left-bicep`, cm and kg), `src/core/import/StrongImporter.ts` (`INSERT OR IGNORE INTO bodyMeasurement`), `src/core/backup/BackupValidation.ts` (it compares schemas to the frozen migrations, so a new migration must keep it passing).
- App: `src/app/features/analytics/AnalyticsScreen.tsx`, `src/app/design/charts/*` (reuse `ChartFrame`, `chartScales`, `TrendLine`, `DotSeries`, `TouchRule`, `ChartTable`; **do not change** the existing analytics or strength charts), `src/app/format/`.

## Scope

- **Create:**
  - Core: `src/core/measurements/` with `MeasurementSite.ts` (model), `MeasurementStore.ts` (log, edit, delete, update a site's note, add a custom site), `MeasurementQueries.ts` (site list with latest values; one site's history), `MeasurementChange.ts` (pure change maths), with tests.
  - App: `src/app/features/body/` (Body screen, site detail, log sheet, note editor), with helper tests.
- **Edit:**
  - `migrations.ts`: append `v4-measurement-sites`.
  - `BodyMeasurement.ts` (add `state`).
  - The Strong importer (insert `state = 'relaxed'`; keep it idempotent).
  - `WorkerApi.ts` (a block `// Measurements (T-043)`).
  - `AnalyticsScreen.tsx` (the Training · Body switch only; the Training content stays untouched).
  - Docs: `DATA.md`, `ARCHITECTURE.md` concept rows, a `DECISIONS.md` entry.
- **Do not touch:** existing charts' behaviour, the backup/Dropbox code (T-042 is running in parallel), logging, templates.

## Specification

**Migration `v4-measurement-sites`** (the worker already snapshots before migrating):
- New table `measurementSite`:
  - `key TEXT PRIMARY KEY` (the existing slugs)
  - `name`
  - `kind` (`length` | `mass`)
  - `groupKey` (e.g. `biceps`)
  - `side` (`left` | `right` | NULL)
  - `supportsFlexed` (0/1)
  - `guide TEXT` (the how-to note, editable)
  - `position`
  - `isCustom`
- Seed it inside the migration (frozen) with Strong's 15 sites plus bodyweight: chest, shoulders, neck, waist, hips, upper abs, lower abs, left/right bicep, forearm, thigh and calf. `supportsFlexed = 1` for biceps, forearms, thighs and calves.
- Each seeded site gets a short default guide in the owner's style, written for a tape measure. Examples:
  - "Waist: at the belly button, tape level and snug, relaxed, after a normal exhale."
  - "Biceps: at the peak, arm at 90°; flexed: fist clenched and the biceps contracted hard."
- Rebuild `bodyMeasurement` to add `state TEXT NOT NULL DEFAULT 'relaxed' CHECK (state IN ('relaxed','flexed'))` and change uniqueness to `UNIQUE (takenAt, site, state)`.
  - Copy every row unchanged; existing rows become `relaxed`.
  - Any site slug found in existing rows but missing from the seed gets a custom site row, so nothing is orphaned.
  - Do it in one transaction, with a test proving every row and value survives byte-for-byte.
- Keep `BackupValidation` passing (it validates against the frozen migrations) and add a test that a v3 backup restores and migrates.

**Core:**
- **Log:** site, value in the entry unit (cm/in or kg/lb), state (flexed only if the site supports it), and taken-at (default now). Store cm/kg exactly converted, as weights do. Editing and deleting entries is allowed (measurements are bookkeeping).
- **Site list:** groups in order, each with the latest relaxed/flexed values and the change over 4 weeks.
- **`MeasurementChange`:**
  - latest; change since the first entry; change over the last 4 and 12 weeks (latest minus the newest entry on or before that date)
  - average monthly rate over the last 12 weeks, from a least-squares slope (cite as `Heuristic:`)
  - computed per state; null when there isn't enough data
- **Display unit:** a `lengthUnit` app setting (`cm` | `in`, default `cm`). Bodyweight follows the existing weight unit setting.

**App:**
- **Body screen:** a list grouped like the site list. Left/right pairs share a row ("Biceps · L 38.5 · R 38.0 cm", with a flexed line beneath when present). Each row shows its 4-week change in caption style, signed and descriptive ("+0.5 cm in 4 weeks"). **Log measurement** opens a sheet: pick the site, then the state, value and date.
- **Site detail:**
  - The guide note at the top (tap to edit) and the latest values.
  - A line chart of relaxed and flexed as two series, sharing one axis and the same unit, with a legend. Use the existing shared chart pieces and their default look; no new chart styles.
  - Change figures (4 weeks, 12 weeks, since first, per month).
  - The full history list with edit and delete.
  - **Log** prefilled with this site.
- **Custom sites:** "Add site" (name, length/mass, supports flexed, guide).
- Wording is descriptive only. No goals or verdicts.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Migration tests: populated v3 → v4 keeps every row; unknown slugs get custom sites; uniqueness now includes state; v3 backup restore passes validation.
- [ ] Core tests: log/edit/delete; flexed refused for sites that don't support it; change maths with hand-computed examples (including too little data → null); cm/in conversion exact.
- [ ] Strong re-import stays idempotent after v4.
- [ ] Docs: DATA (measurements), ARCHITECTURE rows (measurement sites, measurement change), a DECISIONS entry (placement under Analytics → Body; flexed/relaxed model).

## Handoff

- **Status:** Implementation finished within the listed scope; **not ready to mark done**. The worktree's `make verify` is blocked by three existing test/fixture files outside the explicit scope. Scope approval was requested; those files remain untouched. Changes are uncommitted, and BOARD.md is untouched as instructed.
- **What was done:** Added the frozen v4 site seed and transactional measurement rebuild (preserves values, ids, timestamps, provenance and deleted-id high-water marks), legacy/new unknown-slug sites, relaxed/flexed uniqueness, nullable typed entry units, validated measurement CRUD, custom sites and editable guides, ordered paired-site queries, exact unit conversion, per-state change maths, and the Measurements worker block. Added Analytics → Training · Body, paired Body rows, unit pickers, site detail, existing shared chart/table/touch components, full editable history, entry sheet, custom-site sheet and note editor. Updated DATA, ARCHITECTURE ownership rows and DECISIONS.
- **Files touched:** New `src/core/measurements/`: `MeasurementSite.ts`, `MeasurementUnits.ts`, `MeasurementStore.ts`, `MeasurementQueries.ts`, `MeasurementChange.ts`, `MeasurementStore.test.ts`, `MeasurementChange.test.ts`, `MeasurementMigration.test.ts`. New `src/app/features/body/`: `BodyScreen.tsx`, `Body.module.css`, `MeasurementGroupRow.tsx`, `MeasurementDetail.tsx`, `MeasurementLatest.tsx`, `MeasurementChangeFigures.tsx`, `MeasurementChart.tsx`, `MeasurementHistory.tsx`, `MeasurementLogSheet.tsx`, `MeasurementSiteSheet.tsx`, `MeasurementGuideEditor.tsx`, `MeasurementUnitPicker.tsx`, `measurementText.ts`, `measurementText.test.ts`, `measurementTimestamp.ts`, `useBodyAction.ts`, `useBodyQueryError.ts`. Edited `src/core/db/migrations.ts`, `src/core/models/BodyMeasurement.ts`, `src/core/import/StrongImporter.ts`, `src/core/import/StrongMeasurementsFile.ts`, `src/worker/WorkerApi.ts`, `src/app/features/analytics/AnalyticsScreen.tsx`, `docs/DATA.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and this Handoff only.
- **Public API:** `MeasurementStore.save/delete/updateGuide/addSite/setUnits`; `MeasurementQueries.list/detail`; `measurementChange`; `measurementUnits`, `storedMeasurementValue`, `measurementValueIn`; typed site/draft/detail/change/unit models. Worker methods: `measurementSites`, `measurementDetail`, `saveMeasurement`, `deleteMeasurement`, `updateMeasurementGuide`, `addMeasurementSite`, `setMeasurementUnits`. `BodyMeasurement` now includes `state` and nullable `entryUnit`. The existing import conversion export is retained as a re-export of its new owner.
- **Decisions taken:** Changes anchor to each state's latest observation; 4/12 weeks mean 28/84 elapsed days and select the newest observation on/before the cutoff. Least-squares rate uses the inclusive trailing 84 days, scaled by 365.2425/12 days/month, documented as a descriptive heuristic. Missing comparisons remain null. New entries preserve the typed unit; legacy/imported units stay unknown/null. No global weight display setting existed, so Body adds a kg/lb picker backed by `weightUnit`, default kg, alongside `lengthUnit`, default cm; exercise units and training analytics retain their meaning. Unknown slugs default to custom length sites. Custom flexed support follows the explicit site flag for either dimension. Detail navigation is local to Body; no route edits. Shared charts retain their existing behaviour/styles.
- **Open questions / left over:** Approval is needed for the minimal test-only compatibility patch at `/tmp/t043-compatibility.patch`: (1) name the five legacy measurement columns in `src/core/db/fixtures/DataSafetyFixture.ts`; (2) expect `measurementSite` in `src/core/db/Database.test.ts`; (3) expect relaxed/null state/entryUnit in `src/core/models/Models.test.ts`. The required migration necessarily invalidates those old fixture/assertion assumptions. Applying that patch in a temporary copy makes the whole suite pass. The central `AppSettingKey` registry is outside scope; the lead may add `lengthUnit`/`weightUnit` there (Body already owns and persists them). Visual phone/dark/light/input/scroll checks remain unverified: `make dev` failed with listen EPERM on 0.0.0.0:5173, the browser access host was unavailable, and `make sim-safari` failed because sandbox access to CoreSimulatorService/logs was denied. No screenshot or live UI check is claimed.
- **How it was verified:** `make format` completed. In this worktree, `make verify` passed formatting, ESLint and strict type checks; tests report **726 passed, 20 failed, 746 total**. All **27 new tests** pass (7 migration/restore/import, 8 store/query/units, 7 maths, 5 UI helpers); the 20 failures come solely from the three unchanged legacy test/fixture assumptions above. Production build passes. A disposable `/tmp/t043-review` copy, with the exact same implementation plus only the proposed three-file test patch, passes **`make format` and `make verify`: all 746 tests in 99 files plus production/PWA build**. Regression coverage includes populated and empty v3 table preservation, binary float equality, deleted-id high-water marks, atomic rollback, unknown slugs, state uniqueness, real v3 backup validation/restore with a snapshot, migrated Strong-row re-import, unsupported state/unit/value checks, duplicate-edit safety, exact conversions, custom sites/notes, independent latest/changes, hand-computed least squares and three-zone datetime editing.
