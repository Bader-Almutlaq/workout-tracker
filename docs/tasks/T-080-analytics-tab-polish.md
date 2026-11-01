# T-080: Analytics tab polish after the lead's check

- **Milestone:** Analytics redesign (`docs/ANALYTICS.md`) · **Depends on:** T-078 · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-079 round 1** (core only: a new `TemplateAnalytics` query and worker methods). Don't edit `src/core/queries/` except where an item below says so; T-079 adds its worker methods in a `// Template analytics (T-079)` block.

## Goal

The lead checked the rebuilt Analytics tab at 430 × 932 with a synthetic 16-week history (2026-11-01). The numbers are right; the presentation isn't yet. Fix these, each against the chart rules in `docs/ANALYTICS.md` and the tokens in `docs/DESIGN.md`.

## Fixes

1. **Weekly hard sets / Weekly effort** (`WeeklyChart.tsx`) are drawn in a stretched `viewBox="0 0 100 100"` with no axes, no dates and huge height. Replace `WeeklyChart` with the existing chart system (`src/app/design/charts/LongRangeChart` or `ChartFrame` + `chartScales` + `TouchRule`, as `ExerciseChart` and the exercise Progress charts do): y-axis ticks with units ("sets", "RIR"), week dates on the x-axis, a normal chart height, tap for the week's value, deload weeks yellow through the existing `marks` mechanism, table view. The effort chart's takeaway says "Lower = harder" once. Delete `WeeklyChart.tsx` and its CSS afterwards. These two charts become shared pieces T-079 reuses: name them for what they draw (`WeeklySetsChart`, `WeeklyEffortChart`), taking points `{ date, value, deload }` and an optional title.
2. **Pinned lifts empty state:** the suggestions render as run-on text ("Pin Bench Press (Barbell)Pin Squat (Barbell)"). Make each suggestion a chip button ("+ Bench Press (Barbell)") in a wrapping row under the hint, 44 px touch targets. Pinned cards: 2-column grid, name (one line, ellipsis), e1RM, coloured change, sparkline; check the card ⋯ / long-press menu stays on screen.
3. **Active plan row:** a full-width card row (surface background, radius, 44 px+), plan name in primary text, "week N" muted, "Plan analytics ›" in accent at the right. No underline.
4. **Colour the changes:** strength list, pinned cards and the muscles table "Strength" column: positive in `--color-status-good`, negative in `--color-status-bad`, zero muted; keep the sign so colour is never the only cue. Sparklines get an emphasised end dot.
5. **Muscles table:** muscle names aren't underlined links: the whole row is the tap target (button or link styled as a row) with a chevron at the end; rows under 4 sets a week stay muted. Rows with 0.0 sets go below a "Not trained in this period" divider label (still in the table, muted), so the list doesn't end in a run of zeros.
6. **Strength list:** at most 8 rows then "Show all" (check it works both ways); "no new best in 6 wk" note muted under the name; the median line's change coloured as in 4.
7. **Distribution bars** (rep ranges, effort, % of 1RM): each bar row is tappable or has its value visible (it is visible today: keep it); make sure labels like "2 RIR · RPE 8" and "<60%" never wrap at 430 px.
8. **Muscle page** (`/analytics/muscles/:muscle`): check it at 430 × 932 and apply 1, 4 and 5 there too (its weekly sets chart uses the new `WeeklySetsChart`).
9. Dark and light both; no horizontal scrolling of the page.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] App tests: weekly charts render axes/tick labels and a table; suggestion chips are buttons; plan row has no underline class and links to `?tab=analytics`; change colours by sign; muscles rows tappable with the zero-sets divider; Show all toggles.
- [ ] DESIGN.md updated where the look changed. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
