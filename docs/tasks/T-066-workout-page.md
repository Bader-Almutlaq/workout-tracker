# T-066: Workout page, plan workout cards, and exercise-in-workout view

- **Milestone:** R4/R5 (programs → workouts → exercises) · **Depends on:** T-058 (plan page, workout sheet), T-063 · **Model tier:** mid (Codex Terra)
- **Reference screenshots** (attached to your prompt): Strong's plan folder of workout cards (`09-start-workout-plans`) and Strong's workout sheet (`10-workout-template-sheet`).
- **Runs in parallel with T-067** (tab bar, Workout tab past workouts, drag into a plan, finishing checks). Don't edit `TabBar`, `Screen`, `SettingsButton`, `StartWorkout`, `RecentWorkouts*`, `PlanCard*`, `TemplatesSection`, the history feature or the live workout. You own `App.tsx` routes.

## Goal

The owner's review (2026-10-31), in their words: analytics come in **layers of granularity**. A plan has plan analytics; a workout has workout analytics; an exercise inside a workout has analytics for that exercise on that day. Today a workout opens as a bottom sheet. The owner wants:

- **Plan page → Workouts tab:** the plan's workouts as cards like Strong's (a 2-column grid: name, exercise summary, last done), or better. Not the full-width list look of the Workout tab.
- **Tapping a workout opens a workout page**, never starts it. The page has a segmented bar **Exercises · History · Analytics**, and a **Start this workout** button.
- **Tapping an exercise on that page** opens that exercise **inside this workout**: its history and charts limited to sessions of this workout.

Product rule: measure, don't prescribe. Descriptive labels only.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md` (*Words*, *Plans and workouts*); `docs/DESIGN.md`.
- App: `src/app/features/templates/` (`PlanPage`, `PlanScreen`, `PlanWorkouts`, `PlanSessions`, `PlanWorkoutTable`, `WorkoutSheet`, `TemplatePreview*`, `PreviewExercise`, `TemplateSessionHistory`, `TemplateSessionCharts`, `templatePaths`, `lastDoneText`, `exerciseNames`), `src/app/features/exercises/` (`ExerciseHistoryTab`, `ExerciseChartsTab`: reuse their parts), `src/app/design/components/` (`SegmentedControl`, `Screen`, `Button`), `src/app/design/charts/LongRangeChart*`.
- Core: `src/core/queries/TemplateSessions.ts`, `ExerciseSeries.ts` (see `filterMachine`, the model for a filter), `ExerciseHistory` (or wherever the exercise History tab's data comes from), `TemplateCatalog.ts`.

## Scope

- **Create:**
  - the workout page: route `/workout/workouts/:templateId`, a screen and its tab components
  - the exercise-in-workout page: route `/workout/workouts/:templateId/exercises/:exerciseId`
  - a plan workout card component (grid)
  - core: the "limit to one workout" filter for an exercise's series and history (+ tests)
- **Edit:** `App.tsx` (routes), `PlanWorkouts` (grid), `templatePaths`, the worker API (a `// Workout page (T-066)` block), docs (DESIGN: plan and workout pages; ARCHITECTURE rows; PAGES-2026-10-31: replace "Workout sheet" with the page).
- **Remove:** `WorkoutSheet` / `TemplatePreviewSheet` once nothing opens them (no dead code). Every place that opened the sheet opens the page instead.

## Specification

1. **Plan page → Workouts tab:**
   - A 2-column grid of cards (one column only if the screen is narrower than 360px). Each card:
     - the workout's name (bold, up to 2 lines)
     - its exercise names, comma-separated, clamped to 3 lines in secondary text
     - "Last: 2 days ago" (existing `lastDoneText`) with a small clock icon, or "Never done"
     - a ⋯ button with the existing actions (edit, rename, move to plan, delete)
   - Tapping the card opens the workout page. "+ Workout" stays.
   - Cards use tokens only, a subtle surface and border, 12px radius, like the plan cards on the Workout tab.
2. **Workout page** (`/workout/workouts/:templateId`):
   - Header: back (to where the owner came from, normally the plan page), the workout name as title, **Edit** (opens the existing template editor), and a ⋯ menu with the existing actions. No settings gear.
   - Under the title: the description (`template.notes`, hidden when empty) and "Last done: Tue, Sep 29" or "Never done".
   - `SegmentedControl` **Exercises · History · Analytics**, stored as `?tab=` (default Exercises), like the exercise page.
   - **Exercises:** one row per exercise in order: picture (existing component), name, main muscle, and the planned sets as "3 × 8–10" (or "3 sets"), plus the machine brand when set. Tapping a row opens the exercise-in-workout page. A chevron shows it is tappable.
   - **History:** this workout's sessions, newest first (existing `TemplateSessionHistory`); each opens the History entry.
   - **Analytics:** this workout's charts (existing `TemplateSessionCharts`).
   - **Start this workout:** a primary button pinned above the tab bar, respecting the safe area. It starts the workout exactly like today's sheet did (the existing `startTemplateWorkout`) and goes to the Workout tab. Disabled while another workout is in progress, with the text "A workout is in progress" under it.
   - An unknown template id redirects to `/`.
3. **Exercise in a workout** (`/workout/workouts/:templateId/exercises/:exerciseId`):
   - Title: the exercise name; a subtitle line "In Full Bench Sat". Back returns to the workout page.
   - `SegmentedControl` **History · Charts** (`?tab=`, default History).
   - Both show only sessions **started from this workout** (`workout.templateId`). Reuse the exercise page's History list and Charts tab components with the filter applied, including the machine chips and full-screen chart.
   - A link at the bottom: "All sessions of this exercise" opens the normal exercise page.
   - Empty state: "No sessions of this exercise in this workout yet."
4. **Core filter:** add a way to limit an exercise's series and its history to one template id, alongside the existing machine filter. Sessions whose workout has no template, or another template, are excluded. Records on the exercise page stay unfiltered.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests: the template filter for series and history (this workout only; other workouts and unfiled sessions excluded; combined with the machine filter; empty).
- [ ] App tests: plan grid renders names, summary and last done; tapping a card navigates to the workout page (not a start); the workout page tabs read and write `?tab=`; Start this workout calls the start action and is disabled while a workout is in progress; unknown id redirects; the exercise-in-workout page passes the template filter.
- [ ] No remaining import of the removed sheet.
- [ ] Works at 430 × 932 in dark and light.
- [ ] Docs updated. Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

Implemented the plan workout grid, workout page, and workout-specific exercise History and Charts. The old preview sheets were removed; list previews now route to the workout page. Workout session filtering happens in `ExerciseSeries` before pagination and combines with the existing machine filter. The worker's `exerciseHistory` and `exerciseCharts` methods accept an optional template ID; existing calls remain unfiltered. Records remain lifetime-wide.

The rename menu opens the existing editor, where the workout name can be changed. Back navigation uses the originating plan or Workout tab when opened from a list, with the saved plan as the deep-link fallback. The existing picture preference controls exercise images.

Verification: `make format` and `make verify` were run. The dark/light phone viewport and interactive navigation could not be checked: the development server was denied permission to bind a port and the browser host was unavailable. The automated page tests cover rendered grid content, tab selection, active-workout disabling, unknown IDs, scoped exercise props, and the start action; they do not exercise tab changes or card taps in a browser. Changes are uncommitted.
