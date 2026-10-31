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

Implemented; changes are uncommitted. Board unchanged.

- **Files:** `src/core/queries/TemplateSessions.ts` with synthetic fixture/tests; `TemplateCatalog.ts` and tests for plan last performance; `TemplateStoreError.ts` for visible wording; `src/worker/WorkerApi.ts` and its plans test; `src/app/App.tsx`; plan cards/page/tabs, workout sheet, dialogs/editor wording and supporting CSS/tests in `src/app/features/templates/`; shared `TimeBuckets` and `LongRangeChart`/`LongRangePlot` with tests; DESIGN, ARCHITECTURE and DECISIONS. The obsolete folder-group header and its CSS were removed.
- **Public API:** `TemplateSessions.read(db, { templateId } | { folderId })` returns `TemplateSessionReport` (finished sessions, per-workout table totals, named top exercise), with exported scope/session/totals/report types. Worker `templateSessions(scope)` lives in the requested T-058 block. `TemplateFolderSummary.lastStartedAt` is the latest finished session of its current workouts. Shared aggregation accepts `sum`; charts optionally accept `overviewBucket`. Routes add `/workout/plans/:folderId`; new-workout links accept `?plan=ID` to preselect a valid plan.
- **Behavior:** Start empty workout remains first. Plan cards open a page with Workouts, History and Analytics; Other workouts holds unfiled workouts. Management operations reuse the existing dialogs/queue. Workout sheets show description, last performance, Exercises/History/Analytics, an explicit Close, and a pinned Start workout outside the scroller. Archived exercise metadata remains visible. History rows open the existing session detail.
- **Interpretations:** “Top exercise” means the first exercise in the saved order, named explicitly, taking the best eligible estimate across its repeated session entries. Same-day sessions remain separate. Working-set totals include every completed non-warm-up set, including low-effort/drop/failure work; using hard-set eligibility would undercount the requested total. Missing/invalid/reversed timing is excluded from duration means; zero is retained. Plan history follows current membership; moving/deleting a saved workout changes its plan scope while preserving History. Weekly frequency uses sums; volume and duration use means; strength uses maxima.
- **Shared support:** The required weekly sum was unavailable in the existing chart. Its small extension adds sum aggregation and an optional overview period, suppressing misleading observation bands for totals and retaining existing defaults for other callers. No migration, live workout, exercise page, Measure or import/export files changed.
- **Verification:** `make format` and `make verify` pass: 145 test files, 1,112 tests. This adds 21 cases across core/query, worker, app wording/routing/sheet/history and shared aggregation/chart coverage. The production build retains its existing large-chunk warning. `git diff --check` passes.
- **Remaining visual check:** 430 × 932 dark/light rendering and touch/scroll/safe-area inspection could not run here. `make dev` fails with sandbox `listen EPERM` on port 5173; browser access is unavailable and native browser control was denied. Automated rendering tests pass, but no phone/browser screenshot validation is claimed.
- **Query limitation:** Scope predicates are parameterized and use current template ids; per-session detail reads use existing primary/unique keys. The schema has no `workout(templateId)` index, and migrations are out of scope, so the initial scoped session selection may scan workout metadata. No new index or historical membership storage was introduced.
