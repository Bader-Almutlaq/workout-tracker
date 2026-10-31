# T-068: Workout tab, plan cards, plan charts and a compact workout page

- **Milestone:** R4/R5 polish · **Depends on:** T-066, T-067 · **Model tier:** mid (Codex Terra)
- **Reference screenshots** (attached): Strong's plan folder (`09-start-workout-plans`) and workout sheet (`10-workout-template-sheet`).
- **Runs in parallel with T-070** (template editor and live workout). Don't edit `src/app/features/workout/` files other than `StartWorkout*`, `RecentWorkout*`, or any template editor file (`TemplateEditor*`, `TemplateExercise*`, `TemplateSet*`, `ProgressionControl*`, `TemplateDetailsSection*`, `templateSetEdits*`).

## Goal

The owner's review (2026-10-31):

1. **Remove "Past workouts" from the Workout tab.** The tab shows only plan cards and workout cards (workouts outside a plan). Sessions stay reachable through the History button, whose session page keeps **Repeat this workout** and **Add to plan…**.
2. **Plan analytics don't fit.** Axis numbers run off the screen ("15,000", and "500,000" on duration, which is in seconds), and the titles and "Tap to expand" sit against the card's edge with no padding.
3. **Plan workout cards:** make the ⋯ button purple like Strong's (accent colour on a light accent tint), and give the cards a little depth. Subtle; just so they stand out.
4. **The workout page takes too much screen.** Make the exercise list compact like Strong's sheet, without pictures. Instead of the whole row opening the exercise, use a **?** button at the right of each row, like Strong.

## Read first

- `AGENTS.md`; `docs/DESIGN.md`; `src/app/design/tokens.css`.
- App: `src/app/features/workout/StartWorkout.tsx`, `RecentWorkouts*`, `RecentWorkoutRow*`, `src/app/design/drag/`, `src/app/features/templates/` (`PlanCard*`, `PlanWorkoutCard*`, `WorkoutPage*`, `WorkoutExerciseRow*`, `TemplateSessionCharts*`, `PlanPage*`), `src/app/design/charts/LongRangeChart*`, `LongRangePlot*`.
- Core: `src/core/queries/TemplateSessions.ts` (duration), any existing duration plausibility constant (search `Limits` in `src/core`).

## Specification

1. **Workout tab:** delete the Past workouts section and its now-unused code (`RecentWorkouts*`, `RecentWorkoutRow*`, the drag's "past workout" kind, the worker's `recentWorkouts` if nothing else uses it). Dragging a workout card onto a plan keeps working.
2. **Charts (shared, so every page benefits):**
   - `LongRangeChart` gets an optional `formatTick` for y-axis labels. When absent, ticks use a compact number format ("15k", "1.2k", "800").
   - Plan and workout analytics pass `formatTick`: duration as "1h", "45m"; volume compact with the unit ("10k kg"); sessions as plain integers.
   - The y-axis gutter fits its widest label; nothing is clipped at 430 px wide.
   - Chart titles, captions and "Tap to expand" get the same inner padding as the plot card (check the plan page, workout page and exercise Charts tab).
3. **Duration outliers:** a session longer than a plausible maximum (reuse an existing constant if there is one; otherwise `SessionDurationLimits.maximumSeconds = 6 h`, `Heuristic:` sessions left running in Strong) is left out of duration means and the duration chart. Volume and counts still include it.
4. **Plan workout cards:**
   - ⋯ button: accent icon on an accent-tint pill (like Strong's), 32 × 28 px, at the card's top right.
   - Depth: a subtle shadow token (`--shadow-card`, light and dark; dark uses a lighter border highlight rather than a heavy shadow), plus the existing border.
   - Apply the same ⋯ style and depth to the plan cards on the Workout tab.
5. **Workout page, Exercises tab:**
   - One compact row per exercise: "3 × Squat (Barbell)" (16 px, medium weight) with the main muscle under it (14 px, secondary). The planned reps and machine brand go on that second line after the muscle ("Legs · 6–8 · Panatta"). No pictures. Row height about 56 px, separated by hairlines inside one card, like Strong's sheet.
   - A **?** button (accent, tinted pill like the ⋯) at the right opens the exercise-in-workout page. The row itself isn't a link.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: Workout tab has no Past workouts section; compact tick format ("15k", "1.2k"); duration tick format; outlier duration excluded from means but counted in sessions; the **?** button links to the exercise-in-workout page and the row isn't a link.
- [ ] Checked at 430 × 932, dark and light: no clipped axis labels, padded chart text.
- [ ] Docs (DESIGN: card depth, ⋯ style, chart ticks). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Implemented the Workout tab cleanup, compact exercise rows and separate detail link, plan card depth and menu accents, shared compact chart ticks and padding, and six-hour duration filtering. The cutoff includes exactly six hours; longer sessions remain in counts and volume. Added targeted tests and updated DESIGN.md. Changes are uncommitted; BOARD.md was not changed.

The 430 × 932 dark/light visual check remains outstanding: the browser access host was unavailable and the sandbox denied the development server listening socket. Verify the plan and workout analytics and the exercise Charts tab on a phone-sized browser before marking the task done.
