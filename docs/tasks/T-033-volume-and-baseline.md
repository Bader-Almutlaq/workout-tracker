# T-033: Analytics engine part 2: hard sets per muscle, weekly volume, recent vs baseline

- **Milestone:** W5 · **Depends on:** none (reads existing tables) · **Model tier:** strong (formulas; Codex Sol)

## Goal

WorkoutCore can answer "where is my training going?": fractional hard sets per muscle per week (direct sets count 1.0, secondary 0.5), with the report's zones, and the generic "recent vs baseline" series behind the app's signature chart (a short recent window against a long baseline, the % difference and range statistics). Pure, tested against the report.

## Read first

- `AGENTS.md`: every formula cites the report or is marked `Heuristic:`; descriptive labels only, never verdicts.
- `reports/Workout tracker app research.md` → *The recommended algorithms, in one place*, items **10** (volume: hard sets, fractional counting, zones, per-session flag) and **12** (analytics formulas); sections *2. Where is my training going?*, *3. How hard versus how much?* and *Time scales*.
- `docs/DESIGN.md` → *Signature chart: recent vs baseline* (what the chart needs: recent line, baseline line, ±10% neutral band, % change, range statistics on a selected range).
- `src/core/db/migrations.ts` (`exerciseMuscle` roles), `src/core/library/Muscle.ts`, `src/core/models/WorkoutSet.ts`.

## Scope

- **Create:** `src/core/analytics/HardSets.ts`, `MuscleVolume.ts`, `RecentVsBaseline.ts` (pure), `src/core/queries/WeeklyMuscleVolume.ts` (reads finished workouts and returns weekly fractional hard sets per muscle as plain data), each with tests.
- **Do not touch:** anything else (another agent is writing e1RM and trend files in `src/core/analytics` in parallel: don't create files about e1RM, effective reps or strength).

## Specification

- Weeks start on Monday in the phone's time zone (same convention as the History calendar).
- `RecentVsBaseline`: given a daily or weekly series, compute the recent window value (e.g. 7-day sum) and the baseline (e.g. 28-day average scaled to the same window), the % difference, and a classification for the dot colour: `below` / `within` / `above` using the ±10% band from DESIGN.md (mark the band `Heuristic:` if the report has no source). Also `rangeStatistics(series, from, to)`: start, end, change, mean, min, max, count.
- Secondary-muscle weight 0.5 is the default; make it a parameter (the plan allows 0.3) with the report citation.
- Tests: the report's worked examples where given, plus a week with no workouts, warm-ups excluded, RIR unknown counts as hard, a muscle hit only indirectly.
- `make format`; `make verify` must pass.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
