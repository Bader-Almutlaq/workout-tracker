# T-079: Workout and plan Analytics tabs (analytics levels 2 and 3)

- **Milestone:** Analytics redesign (`docs/ANALYTICS.md`) · **Depends on:** T-077 (exercise progress, personal curve), T-078 (typical length, weekly effort, muscle volume pieces), T-076 (muscle contributions sheet) · **Model tier:** mid (Codex Terra)

## Goal

Read `docs/ANALYTICS.md` sections 2 and 3: the agreed design. The owner (2026-11-01): "the most important piece of analytics is the analytics for a specific plan… and for a specific workout… This is how you see progression: you check your progress week by week on a specific exercise on a specific day." For a workout: are total sets changing, is intensity changing, is each exercise progressing or regressing, deload effects. For a plan: the same across its days, and above all how many sets each muscle gets and whether that matches the plan.

## Read first

- `AGENTS.md`, `docs/ANALYTICS.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`.
- Core: `ExerciseProgress.ts` and `PersonalCurve.ts` (T-077), `TrainingSummary.ts` (typical length, average RIR) and the weekly effort query (T-078), `TemplateSessions.ts`, `TemplateMuscleSummary.ts` (planned sets and contributions), `WeeklyMuscleVolume.ts`, `HardSets.ts`.
- App: `src/app/features/templates/WorkoutPage.tsx`, `PlanPage.tsx`, `PlanSessions.tsx`, `TemplateSessionCharts.tsx`, `PlanWorkoutTable.tsx`, `TemplateMuscleList.tsx`, `TemplateMuscleSheet.tsx`; the Analytics tab's components from T-078 (strength rows with sparklines, tiles, sets/effort chart pair) to reuse rather than duplicate.

## Specification

### Core

1. `TemplateAnalytics` query (new file), scope `{ templateId } | { folderId }`:
   - `sessionCount`, `typicalSessionSeconds` (reuse T-078's median rule, one implementation), for a plan `weeksOnPlan` (since its first session) and `sessionsPerWeek` over the last 4 full weeks vs `plannedWorkouts` (templates in the plan).
   - For a workout: `lastSession` working sets vs planned working sets (non-warm-up template sets).
   - `exercises`: per exercise in the workout (or per workout → exercises for a plan, in saved order): name, exerciseId, templateId, the last 8 sessions' best-set e1RM (sparkline, deloads flagged), change vs 4 sessions ago, the latest top set, set-count change ("3 → 4"). Built from `ExerciseProgress` with the template scope; never re-derive e1RM or top set.
   - `perSession` (workout): date, isDeload, hard sets, average RIR (null when no RPE logged).
   - `weekly` (plan): week start, isDeload week, hard sets, average RIR (reuse T-078's weekly effort rules).
   - `musclesDoneVsPlanned` (plan): per main muscle, average fractional hard sets per week over the last 4 full weeks of this plan's sessions vs planned fractional sets per week (`TemplateMuscleSummary` with the folder scope), plus the contributing exercises for done sets.
2. Tests on a synthetic fixture: scope by template vs plan; deload sessions flagged and left out of changes; done vs planned arithmetic; plans with fewer than 4 weeks use the weeks available (say so in the label).

### Workout page → Analytics tab

Replace `TemplateSessionCharts` there with, in order:
1. Tiles: Sessions · Typical length · Last sets ("18" with "of 18 planned").
2. **Exercise progress:** rows (name, top set in muted text, sparkline, e1RM, coloured change; "3 → 4 sets" when it changed). Tap → `WorkoutExercisePage` (Progress tab).
3. **Hard sets per session:** bars, deload sessions yellow, takeaway line.
4. **Effort per session:** average RIR line (RPE in the tooltip and takeaway), deload points yellow.
Empty state as today when there are no sessions.

### Plan page → Analytics tab

Replace `TemplateSessionCharts` and keep `PlanWorkoutTable` only if it adds something not shown below (otherwise remove it):
1. Tiles: On this plan ("6 wk") · Sessions / week ("2.8" with "of 3 planned") · Typical length.
2. **Sets per muscle, per week:** bullet bars: filled bar = done, a tick = planned, numbers "9 / 10" at the right; main muscles, "Show smaller muscles"; legend "Done · Planned". Tap → a sheet with the exercises behind the done sets (reuse the T-076 sheet pattern).
3. **Weekly hard sets** and **Weekly effort** as two charts on the same weeks (reuse T-078's pair).
4. **Progress by workout:** the exercise rows grouped under each workout name (with its weekday chip).

Remove `TemplateSessionCharts` and its session volume / duration / top e1RM charts once neither page uses them. Charts follow the chart rules in `docs/ANALYTICS.md`. Works at 430 × 932, dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests listed above.
- [ ] App tests: section order on both tabs, rows link to the exercise-in-workout page, bullet bars show done and planned, deload styling, empty states.
- [ ] Docs: DESIGN (workout and plan Analytics), ARCHITECTURE (TemplateAnalytics). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
