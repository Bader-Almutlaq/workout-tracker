# T-081: Workout and plan Analytics polish after the lead's check

- **Milestone:** Analytics redesign (`docs/ANALYTICS.md`) · **Depends on:** T-079, T-080 · **Model tier:** mid (Codex Terra)

## Goal

The lead checked the workout and plan Analytics tabs at 430 × 932 with a synthetic 16-week plan (2026-11-01). The numbers are right; fix the presentation, following the chart rules in `docs/ANALYTICS.md`.

## Fixes

1. **Per-session charts have no axes or dates** (workout tab: "Hard sets per session", "Effort per session"). Draw them with the existing chart system, as the exercise Progress charts do (`src/app/features/exercises/ExerciseProgressChart.tsx` / `ExerciseChart`, `src/app/design/charts/`): y-axis ticks with units ("sets", "RIR"), dates on the x-axis, normal chart height, tap for a session's date and value, deload sessions yellow, table view. Bars for sets are fine if the chart system supports them; otherwise a line with dots. Remove any hand-drawn SVG left for these.
2. **Headings:** chart headings are short ("Hard sets per session", "Effort per session", "Weekly hard sets", "Weekly effort"); "Each bar is one session" / "Each point is one week" moves into the one-line takeaway under it, never the heading. Apply to the shared `WeeklySetsChart` / `WeeklyEffortChart` titles and the Analytics tab and muscle page too, so nothing wraps to two lines at 430 px.
3. **Tiles:** the three tiles on both tabs sit in one row of three (no orphan tile on a second row), each with the same value size; the sub-line wraps inside the tile.
4. **Sets per muscle (plan):** hide muscles where both done and planned are 0. Make the planned tick clearly visible (2 px wide, primary text colour, taller than the bar) and the legend draws the same tick. Keep "Show smaller muscles".
5. **Exercise rows without an e1RM** (high-rep sets over the estimate's limit, timed or bodyweight lifts): instead of "—", show the top-set weight as the value with its change vs 4 sessions ago and a muted "top set" label, so every row with sessions shows movement. Keep "—" only when there's no session.
6. Check dark and light, no horizontal page scroll.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] App tests: per-session charts render axis ticks and a table; headings contain no "Each"; three tiles render in one row container; 0/0 muscles hidden; a row without e1RM shows its top-set weight and change.
- [ ] DESIGN.md updated where the look changed. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
