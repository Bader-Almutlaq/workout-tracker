# T-083: One chart system: compact, trend line, press-and-drag readout, landscape zoom

- **Milestone:** Analytics redesign, round 2 (`docs/ANALYTICS.md`) · **Depends on:** T-077–T-081 · **Model tier:** high (Codex Sol)
- **Reference screenshots** (in `.claude/worktrees/references/`, git-ignored): `strong-expanded-chart-landscape.png` (Strong's expanded chart: rotated to landscape, full history, pinch to zoom) and `apple-fitness-chart-scrub.png` (Apple Fitness: press a point, a callout above the plot shows date and value).
- **Runs in parallel with T-082** (core fixes). You own `src/app/design/charts/*` and every chart component and its CSS: `ExerciseProgressChart`, `ExerciseChart`, `ExerciseTimedCharts`, `StrengthCard` (chart part), `MeasurementChart`, `WeeklySetsChart`, `WeeklyEffortChart`, `SessionEffortChart` and the session sets chart, the chart parts of `ScopedTemplateAnalyticsContent.tsx`, the muscle page's weekly chart, `ExerciseRpeChart` only if it uses the shared frame. Don't edit core files except adding the trend function below, and leave `LiftRow`/`LiftSparkline`, tiles and lists alone (T-084).

## Goal

The owner's review on their iPhone (2026-11-02), about every chart in the app:

- **Too much text.** Charts carry captions ("Weekly last value", "Each point is one session"), takeaways, "Touch and drag for values", "Tap to expand", deload notes and readouts underneath. "If you need to explain the chart, the chart is not good. It should have a good title, a good X and Y axis." Strong shows a title and the chart, nothing else.
- **Too many points.** A chart from January 2024 to today plots every session; it says nothing. Charts should be compact and aggregated, with a **trend line (a regression line)** so the direction is visible at a glance, and deload dips visible.
- **Touch is wrong.** Dragging a finger shows values in a block of text under the chart. When the finger lifts, the line stays. Tapping draws a rectangle (focus/tap highlight). The owner wants Apple Fitness's behaviour: press and drag, a callout follows the finger above the plot, release and it's gone.
- **Expand is wrong.** "Tap to expand" doesn't look clean, and the expanded chart grows vertically. Strong's expanded chart is **landscape** (rotated when the phone is upright), shows the whole history, and **zooms with a pinch**: zoomed out it aggregates, zoomed in it shows every session.
- Legends unclear, no colour, titles unclear.

## Read first

- `AGENTS.md`; `docs/DESIGN.md` (Charts); `docs/ANALYTICS.md` (Chart rules: the lead has rewritten them for this task); the `dataviz` guidance summarised in DESIGN.md if present.
- `src/app/design/charts/` (all of it), `src/core/analytics/TimeBuckets.ts`.
- Every chart component listed above and where it's used (`grep -rl "design/charts" src/app`).

## Specification

### 1. One component

- Build one shared time chart (suggested name `TimeChart`, in `src/app/design/charts/`) that every dated chart in the app uses: line (default) or bars, one or more series, optional deload marks, optional trend line. Retire `LongRangeChart`/`LongRangePlot`/`LongRangeChartSheet` and the bespoke plot in `ExerciseProgressChart` and the session charts by moving their callers onto it. No two implementations of axes, touch or aggregation remain.
- Props stay small and typed: `title`, `unit` (y-axis unit label, for example "kg", "sets", "RIR"), `series` (name + dated values in display units; a value may be `null` for "nothing logged"), `kind` ('line' | 'bars'), `aggregation` (how buckets combine: 'max' | 'mean' | 'sum' | 'last'), `marks` (deload dates), `trend` (boolean), `formatValue`, optional `onOpenPoint` (open a session).

### 2. Inline look (small chart in a page)

- Height about 160 px; full width inside the page's insets.
- **Header row:** title on the left (short: "Estimated 1RM", "Top set", "Weekly hard sets"), and an **expand icon button** (a small "⤢" style icon from the app's icon set, 44 px hit area, no text) on the right. Nothing else above the plot.
- **Y-axis:** 3–4 round ticks, the unit on the top tick only ("160 kg", then "150", "140"). **X-axis:** 3–5 date labels (month, or "Jan 25" across years).
- **Aggregation:** pick the bucket so the inline chart shows at most about 26 marks: per session/day for short spans, then week, then month, then quarter (`TimeBuckets.choose` already does most of this; extend it with quarter if needed). Aggregated line points are drawn small; no min–max band inline (it reads as noise on a phone). Bars for sums (weekly sets), lines for levels (e1RM, weight, RIR).
- **Gaps:** a `null` value or a missing bucket breaks the line (no zero, no interpolation across a gap of more than 2 buckets) and draws no bar.
- **Trend line** (when `trend` is set; on for e1RM, top set, reps, weekly sets): least-squares straight line over the shown, non-deload values, drawn dashed in a muted ink, ending at the last point. Put the regression in WorkoutCore as one function (`src/core/analytics/LinearTrend.ts`: slope per day and intercept from dated values; `Heuristic:` ordinary least squares, the owner asked for a regression line; tests with a hand-computed example). Skip it with fewer than 3 points.
- **Deloads:** a deload session's point is yellow (`--color-deload`), in every chart and at every zoom; a bucket containing a deload gets a yellow point only if all its sessions were deloads. No deload caption.
- **Legend:** only when there are 2+ series (or a series plus the trend): small swatches under the header, each series in its own colour from the categorical palette (validate it in light and dark with the dataviz validator if you change it), the trend as a dashed swatch named "Trend". A single series without trend has no legend.
- **Colour:** the primary series uses the accent colour; deload yellow is reserved for deloads.
- Remove every caption, takeaway line, "Touch and drag…", "Tap to expand", "Hollow points…" and readout paragraph from charts. Callers that pass a `takeaway` stop passing it (delete the prop).
- The data table stays available for screen readers (visually hidden inline) and as a visible toggle only in the expanded view.

### 3. Press-and-drag readout (Apple Fitness style)

- **Touch:** press on the plot and drag horizontally: a thin vertical rule snaps to the nearest mark, that mark gets a ring, and a **callout bubble appears above the plot** (overlaying the header row, as in the Apple screenshot), centred on the mark and clamped inside the chart: date (or period, "Week of 6 Oct", "Oct 2025") in bold, the value with its unit, and "Deload" when it is one. For several series, one line per series with its swatch.
- **Release:** the rule, ring and callout disappear (after about 1 s, or at once; pick what feels right on the phone). Nothing stays selected.
- **Scrolling:** a vertical swipe on the chart still scrolls the page. Use `touch-action: pan-y` on the plot and start the readout on horizontal movement or a short press (about 150 ms); once the readout starts, the page doesn't scroll.
- **No rectangle:** no tap highlight (`-webkit-tap-highlight-color: transparent`), no focus ring on pointer use. Keep a visible focus ring for keyboard use (`:focus-visible`), with arrow keys moving the readout.
- Opening a session: in the expanded view, a short tap on a session point (not a drag) shows the callout with an "Open" chevron that goes to the session (`onOpenPoint`). Inline charts don't navigate.

### 4. Expanded view (Strong style)

- The expand button opens a full-screen view: title, a close button, and the chart filling the screen. **When the phone is upright, rotate the whole view 90° (CSS transform) so the chart is landscape**, as Strong does; when the phone is already landscape, no rotation. Respect safe areas on all four sides in both cases. Touch coordinates must be mapped through the rotation.
- **Whole history** is loaded; it opens showing the last 6 months (or all if shorter).
- **Pinch to zoom and drag to pan** along time (two fingers zoom, one finger drag pans when zoomed in; press-and-hold then drag shows the readout). Zoom limits: from about 2 weeks to the whole history. Double-tap resets.
- **Aggregation follows the zoom:** the bucket is chosen from the visible span with the same "about 26 marks" rule, but with the wider canvas use about 60 marks. Zoomed fully in, every session is its own point.
- A small "Table" toggle in the expanded header shows the data as a table (visible buckets, with session links).
- Range chips (3M/6M/1Y/All) are removed; pinch replaces them.

### 5. Apply everywhere

- Exercise Progress tab and the exercise's own Charts tab: e1RM (trend on), Top set weight (trend on), Reps on the top set, Working sets (bars), Average RPE. Titles exactly those, units "kg"/"lb", "reps", "sets", "RPE".
- By-workout chips keep adding series to the e1RM chart, with the legend.
- Workout Analytics tab: hard sets per session (bars), effort per session (line, "RIR").
- Plan and Analytics tab: weekly hard sets (bars, trend on), weekly effort (line, "RIR").
- Muscle page weekly sets, body measurement charts, timed/bodyweight exercise charts.
- Sparklines in lists (`LiftSparkline`, pinned cards) are not part of this task.

### 6. Quality

- Works at 430 × 932 in dark and light, upright and landscape, with no horizontal page scroll; the expanded view fits within safe areas.
- Pure functions for the maths (bucket choice for a span, nearest-mark lookup, zoom domain clamping, rotation coordinate mapping, gap splitting, callout clamping), each tested.
- Component tests: no caption/takeaway text rendered; legend only for 2+ series; expand button has an accessible name and no visible text; gaps break the line; trend path present with ≥ 3 points and absent below; deload points yellow class.
- `docs/DESIGN.md` → Charts rewritten to describe the new system (inline, readout, expanded, aggregation, trend, deloads, gaps). Remove the old LongRange description.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] No remaining imports of `LongRangeChart`, `LongRangePlot`, `LongRangeChartSheet`; no chart renders explanatory paragraphs.
- [ ] Tests listed above.
- [ ] DESIGN.md updated. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
