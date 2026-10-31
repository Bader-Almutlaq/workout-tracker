# T-058: Plan pages and workout sheets, with history and analytics

- **Milestone:** R4 (programs → workouts → exercises) and R5 · **Depends on:** T-055 merged (uses `LongRangeChart`, `TimeBuckets`, the header gear) · **Model tier:** strong (Codex Sol)
- **Reference screenshots** (attached to your prompt): `09-start-workout-plans`, `10-workout-template-sheet`.

## Goal

Implement **Plans and workouts** from `docs/design/PAGES-2026-10-31.md` (read it first; note the *Words* section):

- A **plan** is today's template folder.
- A **workout** is today's template.
- A **session** is a finished workout in History.

The data model stays as it is (`templateFolder`, `template.notes`, `workout.templateId`). This task changes how it's shown and adds history and analytics per plan and per workout.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md`; `docs/DESIGN.md`.
- App: `src/app/features/workout/WorkoutScreen.tsx`, `src/app/features/templates/*` (TemplatesSection, TemplateGroups/Group/Row, TemplatePreviewSheet, TemplateEditor, the folder dialogs), `src/app/design/components/BottomSheet.tsx`, `SegmentedControl.tsx`, `src/app/design/charts/LongRangeChart.tsx`.
- Core: `src/core/queries/TemplateCatalog.ts`, `WorkoutHistory.ts`, `WorkoutComparison.ts`, `HardSets.ts`, `src/core/analytics/TimeBuckets.ts`.

## Scope

- **Create:**
  - `src/core/queries/TemplateSessions.ts` (+ test): the sessions and per-session totals for a workout or a plan
  - a plan page route (`/workout/plans/:folderId`) and its tab components
- **Edit:**
  - the Workout tab's plan list (a new look, not folders)
  - the workout sheet (TemplatePreviewSheet)
  - routes
  - the worker API (block `// Plans and workouts (T-058)`)
  - visible wording: "Plan" for folder, "Workout" for template
  - docs: DESIGN, ARCHITECTURE rows, and a DECISIONS entry for the wording, keeping the code names
- **Do not touch:** migrations, the live workout screen (another task is redesigning it), the exercise page, Measure, import/export.

## Specification

1. **Workout tab:**
   - Keep **Start empty workout** on top.
   - Plans appear as **cards**, not folders: name, workout count, the names of its workouts, and "Last: 2 days ago".
   - Workouts outside any plan show under "Other workouts".
   - Creating, renaming, reordering and deleting plans and workouts all keep working (existing dialogs).
   - Visible "Template"/"Folder" become "Workout"/"Plan".
2. **Plan page** (`/workout/plans/:folderId`), with the plan name as title, back to Workout, the gear and a menu (rename, delete).
   - **Workouts:** cards of its workouts (name, exercise summary, last done); tap opens the workout sheet; "+ Workout".
   - **History:** sessions started from any of its workouts, newest first; tap opens the History entry.
   - **Analytics:**
     - `LongRangeChart` for sessions per week (sum), session volume (mean) and session duration (mean)
     - a small table per workout: sessions, last done, average duration
3. **Workout sheet** (screenshot 10):
   - Title, Edit, description (`template.notes`, "Add a description" when empty), "Last performed".
   - A SegmentedControl: **Exercises · History · Analytics**.
     - **Exercises:** sets × name and main muscle, as today's preview.
     - **History:** this workout's sessions.
     - **Analytics:** session volume, duration, and the top exercise's best e1RM per session, with the long-range chart.
   - **Start workout** stays pinned at the bottom.
4. **Sessions query:**
   - `TemplateSessions` returns finished sessions by template id or folder id: date, duration, working-set count and volume (kg × reps, warm-ups excluded).
   - Uses existing helpers (hard sets, volume), with no new formulas. Index-friendly.
   - Tests use a synthetic fixture with two plans and an unfiled workout.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests for `TemplateSessions` (by workout and by plan, warm-ups excluded, unfinished excluded, empty); a worker test; app tests for the wording and plan routing (an unknown folder redirects).
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
