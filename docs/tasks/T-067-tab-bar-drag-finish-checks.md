# T-067: Settings tab, past workouts into plans, and accidental-workout checks

- **Milestone:** R4/R6 · **Depends on:** T-058, T-059 · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-066** (workout page, plan workout cards, `App.tsx` routes). Don't edit `App.tsx`, `PlanPage*`, `PlanWorkouts*`, `WorkoutSheet*`, `TemplatePreview*`, or the exercise page.

## Goal

From the owner's review (2026-10-31):

1. **The History tab isn't important.** The full workout history moves to a button at the top of the Workout tab, and **Settings takes its place in the tab bar**. The history the owner cares about is per exercise, per plan and per workout, shown inside those pages (T-066).
2. **Tapping a past workout starts it straight away, which is annoying.** It should open the session instead.
3. The owner imported history from Strong, which has no templates, so their plan is empty. They tried to **drag a past workout into a plan** and couldn't. Make that work.
4. **Workouts started by mistake shouldn't be saved.** When finishing, detect them and ask.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md` (*Navigation*); `docs/DESIGN.md`.
- App: `src/app/design/components/` (`TabBar`, `Screen`, `SettingsButton`, `ConfirmDialog` or the existing dialog components), `src/app/features/workout/` (`StartWorkout`, `RecentWorkouts`, `RecentWorkoutRow`, `useActiveWorkout`, `workoutActions`), `src/app/features/templates/` (`TemplatesSection`, `PlanCard`, `TemplateGroups`, `SaveAsTemplate*`, `MoveTemplateDialog`, `FolderChoice`), `src/app/features/history/` (`HistoryScreen`, `WorkoutDetailScreen`).
- Worker: `recentWorkouts`, `createTemplateFromWorkout`, `moveTemplate`, `finishWorkout`, `discardWorkout`. Core: `WorkoutLogger.finish`, `workoutSet.completedAt`.

## Scope

- **Edit:** the files above as needed; the worker API (a `// Past workouts and finishing (T-067)` block) and core for the queries below (+ tests); docs (PAGES *Navigation*, DESIGN, DECISIONS: one entry for the tab change and one for the finishing rules).
- **Create:** a small drag helper in `src/app/design/drag/` (+ test), and any new components.
- **Do not touch:** migrations, CSV import/export, analytics, the exercise page.

## Specification

1. **Tab bar:** **Workout · Exercises · Measure · Analytics · Settings** (lucide `Settings` icon). The Settings tab owns `/settings`.
   - Remove the gear button from every screen header (`SettingsButton` and its uses). Delete the component if nothing uses it.
   - The Workout tab header (with no workout in progress) gets a **History** button at the top right (lucide `History` or `CalendarDays` icon, accessible label "History"), opening `/history`. History screens keep working; while on `/history…` no tab is highlighted, or Workout is: choose Workout.
2. **Past workouts** (Workout tab, below the plans):
   - Rename the section to **Past workouts**. Show the latest session of each distinct workout name (case-insensitive), newest first, up to 8.
   - **Tapping a row opens the session** (`/history/:workoutId`); it never starts a workout.
   - The session detail screen gets two actions: **Repeat this workout** (the existing repeat action, then go to the Workout tab) and **Add to plan…** (a plan picker: existing plans plus "New plan…"; creates a workout from the session in that plan with the existing `createTemplateFromWorkout`, named after the session).
3. **Drag into a plan** (touch first; it must work in iPhone Safari as a Home Screen app):
   - **Long-press** (about 400 ms, with no more than 8px movement) a past workout row or a workout card under "Other workouts" to pick it up. A light lifted copy follows the finger; page scrolling is blocked only while dragging.
   - Plan cards are drop targets and highlight while the item is over them.
   - Dropping a **past workout** on a plan creates a workout in that plan from that session (as in 2). Dropping an **existing workout** moves it to that plan (`moveTemplate`).
   - Then a short confirmation line under the plans for 3 seconds: "Added Full Squat Fri to Full Body". Dropping elsewhere cancels.
   - A normal tap still opens; a normal swipe still scrolls.
   - The helper is pointer-event based, with no new dependency. It exposes the drag state for tests.
4. **Finishing checks** (in `useActiveWorkout` and the worker/core as needed). Checked in this order when the owner taps Finish:
   - **Nothing completed:** a dialog "Nothing was logged, so this workout won't be saved." with **Discard workout** (primary) and **Keep logging**. Today this case deletes silently after the unfinished-sets question; replace that.
   - **Under 5 minutes** from start to finish, with at least one completed set: "This workout lasted 3 minutes. Save it?" with **Save** (primary) and **Discard**.
   - **Left running:** if the last completed set was more than 60 minutes before now, offer "Your last set was at 18:42. End the workout then?" with **End at 18:42** (primary; the finish time becomes that set's `completedAt`) and **Keep current time**.
   - Then the existing unfinished-sets question, then finish as today.
   - The thresholds live in a frozen, documented constants object (`Heuristic:` note: the owner's request, no research source).
   - Discarding uses the existing discard. Nothing that was logged is lost without the owner choosing Discard.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: tab bar has the five tabs and no History; no header gear remains; the Workout header History button navigates to `/history`.
- [ ] Past workouts: one row per distinct name, newest first, limit 8; tap navigates to the session and doesn't start anything; Repeat and Add to plan call the right actions.
- [ ] Drag helper: long-press starts a drag, movement beyond the threshold before the press cancels it, drop over a target reports it, drop elsewhere cancels. Dropping a past workout calls create-from-workout with the plan; dropping a workout calls move.
- [ ] Finishing: each of the three checks, in order, with both answers; finishing at the last set's time stores that time.
- [ ] Works at 430 × 932 in dark and light.
- [ ] Docs updated. Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Not started._
