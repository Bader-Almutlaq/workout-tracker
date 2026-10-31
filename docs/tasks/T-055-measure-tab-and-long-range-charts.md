# T-055: Measure tab, Settings gear, and long-range charts

- **Milestone:** R1 (measurements) and R0 (charts: the owner has now reviewed them) · **Depends on:** none · **Model tier:** strong (Codex Sol: shared chart component plus navigation)
- **Reference screenshots** (attached to your prompt): `01-tab-bar`, `02-measurements-list`, `03-measurement-detail`.

## Goal

Implement **Navigation**, **Charts over long periods** and **Measure tab** from `docs/design/PAGES-2026-10-31.md`. Read that document first; it is the specification. The chart component built here is reused later by the exercise, workout and plan pages, so make it general.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md`; `docs/DESIGN.md` (tokens, chart rules); `docs/DATA.md` → measurements.
- App:
  - `src/app/design/components/TabBar.tsx`, `Screen.tsx`, `SegmentedControl.tsx`
  - `src/app/App.tsx`
  - `src/app/features/body/*`, which today sits under `src/app/features/analytics/AnalyticsScreen.tsx` (Body segment)
  - `src/app/design/charts/*`
- Core: `src/core/measurements/*` (sites, pairs, guides, flexed/relaxed) and their worker API block.

## Scope

- **Create:**
  - `src/core/analytics/TimeBuckets.ts` (+ test): pure bucket choice and aggregation for any dated series
  - `src/app/design/charts/LongRangeChart.tsx` (+ CSS): the small chart plus its full-screen view
  - a Measure screen and route (`/measure`, `/measure/:bodyPart`)
  - a `SettingsButton` (gear) for main tab headers
- **Edit:**
  - the tab bar and routes
  - `Screen.tsx` (a trailing header slot, if missing)
  - the body feature (moved under Measure, renamed in visible text)
  - the Analytics screen (drop its Body segment)
  - measurement defaults (ab guide texts, via a new migration **only if** the guides are seeded in the database; otherwise in the seed constant)
  - docs (DESIGN: long-range chart rules; ARCHITECTURE: rows for `TimeBuckets` and `LongRangeChart`; DECISIONS: tab bar and Analytics role)
- **Do not touch:** workout logging, the live workout screen, templates, exercise pages, existing analytics formulas, import/export.

## Specification

1. **Tab bar:**
   - Tabs: Workout · History · Exercises · Measure · Analytics. Use a lucide ruler icon for Measure.
   - Settings leaves the bar. A gear button sits at the top right of every main tab screen and opens `/settings`.
   - Settings sub-pages keep their back links.
2. **Time buckets** (`TimeBuckets.ts`, documented as `Heuristic:` with the reason):
   - Choose the bucket from the shown range: day up to 92 days, ISO week up to 730 days, month beyond.
   - The aggregation is a parameter: mean, max or last.
   - Return bucket start, value, min, max and count.
   - Tests cover the boundaries, empty and single-point series, DST-safe week starts (pinned TZ) and each aggregation.
3. **LongRangeChart:**
   - **Small view:** the aggregated line, plus a faint min–max band when a bucket holds more than one point.
   - **Full screen:** tapping opens a full-screen sheet with range chips 3M · 6M · 1Y · All, finer buckets and the existing touch rule and tooltip.
   - Follow the existing ChartFrame conventions (horizontal gridlines, thin 2 px line, tokens only, dark and light) and include a table view for accessibility.
4. **Measure tab** (screenshots 02–03):
   - **List:**
     - Grouped body parts, the latest value on the right, and a **+** button on each row that opens the existing log sheet for that part.
     - Pairs stay on one row.
     - Never-measured parts are hidden. "Add body part" lists hidden built-in parts plus "New body part…".
     - Bodyweight isn't listed (its data stays).
   - **Body part page:**
     - A SegmentedControl: **Chart · History**.
     - **Chart:** `LongRangeChart` using the mean, plus the existing change figures, the relaxed/flexed toggle and the "where to measure" note.
     - **History:** every entry, editable and deletable as today.
     - A **Log** button.
   - **Wording:** visible text says "body part", never "site".
   - **Ab guides:** "Lower abs: at the hip bone", "Waist: at the belly button", "Upper abs: above the belly button, below the ribs". Only change guides the owner hasn't edited.
5. **Analytics:** remove the Body segment; the Training content stays exactly as it is.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] `TimeBuckets` tests as above; app tests for hidden parts, bodyweight exclusion, the gear and the tab list.
- [ ] Measurement data is unchanged (no rows altered except unedited guide texts).
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

Implemented and left uncommitted for review. The task board is unchanged as requested.

### Behavior and files

- Navigation: `src/app/App.tsx`, `src/app/design/components/TabBar.tsx`, `Screen.tsx`, `Screen.module.css`, new `SettingsButton.tsx` / `SettingsButton.module.css`, and `navigation.test.ts`. The gear is supplied centrally by Screen on the five exact main-tab root paths, avoiding edits to workout, history or exercise screens. Explicit trailing actions override the default gear; pushed pages retain their back links.
- Measure: replaced `src/app/features/body/BodyScreen.tsx` with `MeasureScreen.tsx`; added `AddBodyPartSheet.tsx` and `MeasureScreen.test.ts`. Updated `MeasurementGroupRow.tsx`, `MeasurementDetail.tsx`, `MeasurementChart.tsx`, `MeasurementHistory.tsx`, `MeasurementLogSheet.tsx`, `MeasurementSiteSheet.tsx`, `measurementText.ts`, `useBodyAction.ts`, and `Body.module.css`. List rows keep pairs together, show both recorded states, and have separate + buttons. History includes every state, newest first. Existing edit/delete/guide flows remain.
- Chart core: new `src/core/analytics/TimeBuckets.ts` and `TimeBuckets.test.ts`.
- Chart UI: new `src/app/design/charts/LongRangeChart.tsx`, `LongRangePlot.tsx`, `LongRangeChartSheet.tsx`, `LongRangeChart.module.css`, and `LongRangeChart.test.ts`. The overview aggregates all data; full screen supplies range chips, finer periods, shared pointer/keyboard selection, both sides in readouts, and tables. A single populated bucket retains a visible spread mark.
- Analytics: `src/app/features/analytics/AnalyticsScreen.tsx` drops only the Training/Body switch and Body rendering; training content and queries are unchanged.
- Guides: appended v7 to `src/core/db/migrations.ts`; added `src/core/measurements/MeasurementGuidesMigration.test.ts`. Pinned the existing v5 → v6 test in `src/core/db/migrations.test.ts` to its stated target version, so it continues testing v6 independently of v7's intentional guide updates. Measurement rows and all other site fields remain unchanged; the existing worker migration snapshot is reused.
- Updated `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and this Handoff only.

### Public API

- `TimeBuckets.choose(from, to, detailed?)`: day through 92 elapsed days, ISO week through 730, month beyond; detailed advances one finer level.
- `TimeBuckets.range(points, 3 | 6 | 12 | 'all')`: inclusive UTC range, latest-observation anchor, calendar-month clamping; null for empty/invalid data.
- `TimeBuckets.aggregate(points, size, 'mean' | 'max' | 'last', range?)`: chronological populated buckets with `start`, `value`, `min`, `max`, `count`. Invalid observations are ignored; input is unchanged. Exported dated-value/bucket/range types document units and tie handling.
- `LongRangeChart({ title, series, aggregation, formatValue })`: named series in caller display units; exported props/series types. Supporting plot and full-screen sheet live in separate files.
- `MeasureScreen`: `/measure` and `/measure/:bodyPart` (group key, including paired groups).
- `SettingsButton`; optional `Screen.trailing` header slot.
- `MeasurementGroupRow.onLog(key)` and `MeasurementSiteSheet.onCreated(key)`; `measurementSection(group)` is display-only region grouping. `MeasurementDetail` no longer owns a back callback; the route supplies BackLink.

### Interpretations and limits

- A hidden built-in is chosen from Add body part to open its log sheet; its first saved observation reveals the row. No separate visibility setting was introduced. Empty custom parts remain selectable in that chooser; creating one opens its detail page immediately.
- Bodyweight is excluded from list, chooser, detail routes and logging choices here; its stored history, units and backups remain intact.
- Range windows anchor to the latest available data, rather than today. Full-screen detail is day for ranges through two years, week beyond; the small view uses the required thresholds. Bucket timestamps, axis labels and table dates are UTC to avoid DST ambiguity.
- The schema does not record guide edit history. Exact equality to each frozen v4 guide is the only available definition of unedited; a note edited back to exactly that old default cannot be distinguished. Cleared and different notes are preserved.
- Live visual/gesture verification at 430 × 932 in dark/light remains for review: `make dev` failed with sandbox `listen EPERM` on port 5173, and the browser automation host was unavailable. Render tests exercise the UI structure but cannot establish its final appearance or real iPhone gesture behavior.

### Verification

- `make format` completed.
- `make verify` passed: formatting, ESLint, strict TypeScript, **1,091 tests across 141 files**, and production/PWA build. Added 37 cases across bucket boundaries/aggregations/DST, migration preservation, navigation, Measure visibility/deep links and chart rendering.
- Production build reports its existing large-chunk advisory; build and service-worker generation succeed.
- `git diff --check` passed. No commits, task-board edits, personal reference values, new dependencies or worker API changes.
