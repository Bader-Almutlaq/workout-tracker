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

_Filled in by the implementer when stopping or finishing._
