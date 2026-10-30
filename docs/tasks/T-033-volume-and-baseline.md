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

- **Status:** review; implementation complete, changes intentionally uncommitted. Board unchanged as instructed.
- **What was done:** Added pure hard-set qualification, direct/weighted-indirect muscle volume, descriptive weekly zones, per-session >11 flags, a finished-workout weekly query, and generic daily/weekly recent-versus-baseline totals with selected-range statistics. Reproduced the report's bench example exactly (1 chest set, 0.5 triceps sets); the cited sections have no other worked numeric examples for these formulas. Added 72 tests, including fractional arithmetic and calendar regressions.
- **Files touched:** `src/core/analytics/HardSets.ts`, `HardSets.test.ts`, `MuscleVolume.ts`, `MuscleVolume.test.ts`, `RecentVsBaseline.ts`, `RecentVsBaseline.test.ts`; `src/core/queries/WeeklyMuscleVolume.ts`, `WeeklyMuscleVolume.test.ts`; this Handoff only.
- **Public API:** `isHardSet(HardSet)`; `muscleVolume(MuscleVolumeSet[], secondaryWeight = 0.5)`; `muscleVolumeZone(totalSets)`; `weeklyMuscleVolume(db, from: Date, to: Date, secondaryWeight = 0.5)`; `recentVsBaseline(SeriesPoint[], { cadence?, recentPeriods?, baselinePeriods? })`; `rangeStatistics(SeriesPoint[], from, to)` with inclusive `YYYY-MM-DD` bounds. Exported readonly input/output types, named policy constants, and typed input errors accompany these functions. Volume results expose direct/weighted-indirect/total sets, numeric zone keys and workout IDs exceeding the session soft limit. Range statistics expose start/end values, absolute change, mean/min/max/count/total.
- **Decisions taken:** Unknown effort counts as hard; failure implies RIR 0 even with conflicting RPE; warm-ups and planned sets never count. Secondary weights accept any finite fraction 0–1, including the report's 0.3 option. The report overlaps zone endpoints: 10 and 20 enter the higher zone; 30 stays in 20–30. Every requested week and all 23 muscles are returned, including zeros. Date endpoints select entire containing local Monday weeks; workouts belong to their start's week, matching History, including imports without end/completion timestamps. Recent and baseline windows overlap and include the point's period; baseline is mean per period × recent-period count. Windows remain null until full calendar coverage. Interior missing periods count as zero; output appears at supplied dates. Both-zero compares as 0%/within; nonzero recent against zero baseline gives null percentage/classification. The ±10% neutral band is inclusive and documented as a display heuristic. Range change is absolute end minus start, and range statistics count supplied observations without filling gaps.
- **Open questions / left over:** No implementation blockers. The lead must add concept-ownership rows for hard-set qualification (`HardSets.ts`), fractional muscle volume/zones/session flags (`MuscleVolume.ts`), chart windows/range statistics (`RecentVsBaseline.ts`), and weekly volume queries (`WeeklyMuscleVolume.ts`); shared docs are outside this task's scope. Record the above endpoint/window conventions in DECISIONS if desired. Series inputs represent daily/weekly totals, with explicit leading zeros if coverage predates the first workout; irregular strength/bodyweight observations require appropriate period preparation before using this totals API. No worker wiring or UI was in scope.
- **How it was verified:** `make format`; `make verify` (lint, strict TypeScript checks, 543 tests across 78 files, production build), with final verification under `TZ=America/New_York` to exercise local Monday boundaries and both daylight-saving transitions. The earlier full suite also passed in the default timezone. Database tests use `Database.openInMemory()` and `migrate(db)` with synthetic data only.
