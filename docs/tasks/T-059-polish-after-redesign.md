# T-059: Polish after the redesign

- **Milestone:** R5/R6 follow-ups · **Depends on:** T-055 to T-058 merged · **Model tier:** mid (Codex Terra)

## Goal

Small fixes the lead found while reviewing T-055 to T-058 on screen. Each one is independent; keep them small.

## Read first

`AGENTS.md`; `docs/design/PAGES-2026-10-31.md`; `docs/DESIGN.md` → Live workout, Long-range charts.

## Fixes

1. **PR progression step line** (unfinished in T-057):
   - Add an optional `shape: 'line' | 'step'` to `LongRangeChart` and its plot. Step uses d3 `curveStepAfter`.
   - Show the exercise page's PR progression series (running maximum of e1RM) as a step line on the Charts tab.
   - Add tests.
2. **No Settings gear during a workout:** while a live workout is showing on the Workout tab, the header shows only the workout menu. Today the gear sits beside it. `Screen`'s default gear needs an explicit way to opt out; `trailing={null}` should mean none.
3. **Back to the plan after saving:** a workout created from a plan page (`/workout/templates/new?plan=<id>`) returns to that plan page after **Save workout**; today it goes to the Workout tab. Editing from a plan page also returns there.
4. **Taller full-screen chart:** the full-screen `LongRangeChartSheet` uses most of the available height (at least about 60% of the viewport), and the small charts keep their size. This needs an optional height on `ChartFrame`/`useChartSize`. Keep the existing default.
5. **Finished sessions only:** the exercise page Summary's "Last" date and session counts exclude an unfinished live workout.

## Scope

- **May edit:** the files these fixes need, their tests, and `docs/DESIGN.md` lines that describe them.
- **Do not touch:** migrations, analytics formulas, import/export, Dropbox.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] A test for each fix (step path, the gear opt-out, plan return path, the height prop, finished-only usage).
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
