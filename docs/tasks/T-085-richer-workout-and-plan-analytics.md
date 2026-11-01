# T-085: Richer workout and plan analytics: several trends per exercise, muscles and effort per plan

- **Milestone:** Analytics redesign, round 2 (`docs/ANALYTICS.md`) · **Depends on:** T-082, T-083, T-084 (all merged) · **Model tier:** mid (Codex Terra)

## Goal

The owner's iPhone review (2026-11-02):

- **Workout Analytics tab:** "I would have thought that there will be more detailed comparisons here… it could have multiple trends here because we have way more details: for example the number of sets, the RPE." Today each exercise shows one e1RM sparkline and a change.
- **Plan Analytics tab:** "Everything that you do across everything could be beneficial within the plan itself, because it indicates what the plan is doing for me." The Analytics tab's muscles table ("this kind of format is good to do for many other things") and its effort and reps section should exist for a plan too.

## Read first

- `AGENTS.md`, `docs/ANALYTICS.md` (levels 2–4, chart rules, text rules), `docs/DESIGN.md` → Charts (the new chart system from T-083).
- Workout/plan tabs: `src/app/features/templates/ScopedTemplateAnalytics*.tsx`, `TemplateAnalyticsTiles.tsx`, `PlanMuscleAnalytics.tsx`; core `src/core/queries/TemplateAnalytics.ts`.
- Analytics tab pieces: `MuscleDashboardTable`, `EffortAndReps`, `DistributionBars`, `RepRangeBars`, `EffortHistogram`, `LiftRow`, `LiftSparkline`; core `MuscleDashboard.ts`, `IntensityMix`, `PercentOfMax.ts`, rep-range code, `WeeklyEffort.ts`.

## Specification

### 1. Workout tab: exercise cards with three trends

- Replace the single-sparkline list with one compact card per exercise in the workout (workout order):
  - Header: exercise name (tap → the exercise-in-workout page, as today) and the e1RM change vs 4 sessions ago (signed colour), or top-set change for lifts without an e1RM.
  - Three small trends side by side, each with a tiny label above and its latest value under it: **Est. 1RM** (line, or **Top set** for lifts without e1RM), **Sets** (bars, working sets per session), **RPE** (line, average RPE of working sets; "—" when not logged). Same last 8 non-deload sessions for all three; deload sessions shown as yellow marks and excluded from changes.
  - No sentences, no " · ".
- Data: extend `TemplateAnalytics` for a workout scope with, per exercise, the last 8 sessions' `{date, isDeload, e1rm|null, topSetKilograms|null, workingSets, averageRpe|null}`. One query per workout, not per exercise per session. Tests with a synthetic workout (hand-computed values, a deload, a session without RPE).
- Sparkline drawing: reuse `LiftSparkline` (extend it for bars) or the T-083 system's small mode, whichever T-083 left as the one place for mini charts. Don't add a third implementation.

### 2. Plan tab: muscles table and effort and reps

- Under "Sets per muscle", add the **Muscles** table from the Analytics tab, scoped to the plan's recent window (T-082's window: the 4 weeks ending with the plan's latest session): sets per week, strength change (median e1RM change of the plan's exercises where the muscle is primary), average RIR. Same component, same row style, rows tap to the muscle page filtered to the plan if the muscle page supports a scope; otherwise to the contributions sheet the plan tab already has.
- Add **Effort and reps** for the plan (same window): rep-range bars, effort bars (RIR with RPE), % of 1RM mix. Same components as the Analytics tab, fed a plan scope.
- Core: add a plan scope (`{ folderId }`, matching `TemplateAnalytics`) to `MuscleDashboard` and the effort/rep/%1RM queries if they don't take one; one implementation each, tested for a plan scope (only the plan's sessions count).
- Order on the plan tab: tiles → Sets per muscle (done vs planned) → Muscles → Weekly hard sets → Weekly effort → Effort and reps → Progress by workout.

### 3. Quality

- Works at 430 × 932 in dark and light, no horizontal scroll; three trends fit a card at 430 px.
- Follow the text rules: labels, not sentences.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: workout card renders three trends with latest values and handles no-RPE and deload sessions; plan tab renders the muscles table and effort and reps for the plan scope only; core plan-scope tests.
- [ ] DESIGN.md / ANALYTICS.md (levels 2 and 3) updated. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._

Implemented workout trend cards, plan-scoped muscle and effort summaries, shared sparkline bars, and coverage for scoped calculations and rendering. The workout progress data still uses `ExerciseProgress` once per exercise; the required single workout-wide query remains unfinished. Phone-size visual checks remain outstanding. Changes are uncommitted; do not mark the task done until these points are resolved and verification passes.
- **Lead review (browser, 430 × 932):** simplified the sparkline session window into one helper; plan Muscles table hides muscles with no sets; effort-and-reps headings shortened ("Rep ranges", "Effort") and their explanatory lines and " · " values removed (also on the Analytics tab); workout cards switch to top-set weight when any non-deload session lacks an estimate (high-rep lifts showed a broken line). Per-exercise queries kept: a workout has a handful of exercises.
