# T-030: History calendar

- **Milestone:** W4 · **Depends on:** T-015 (merged) · **Model tier:** mid

## Goal

At the top of History, a month calendar shows which days had a workout (a small dot in the accent colour). Swiping or tapping arrows changes month. Tapping a day with workouts scrolls the list to that day (or opens the workout if there is exactly one). The list below stays as it is.

## Read first

`AGENTS.md`, `docs/DESIGN.md`, `src/app/features/history/HistoryScreen.tsx`, `src/core/queries/WorkoutHistory.ts`, `WorkoutMonthGroups.ts` (month grouping in the phone's time zone), `src/app/format/dateText.ts`.

## Scope

- **Create:** `src/core/queries/WorkoutCalendar.ts` (+ test): `workoutDaysInMonth(db, year, month)` → the local dates (`YYYY-MM-DD`) that have a finished workout, with their workout ids; computed in the phone's time zone like `WorkoutMonthGroups`. `src/app/features/history/HistoryCalendar.tsx` (+ CSS module) and small helpers with tests (`calendarGrid.ts`: the weeks of a month, Monday first).
- **Edit:** `HistoryScreen.tsx` (render the calendar above the list; day anchors in the list), `WorkerApi.ts` (one method in a block `// History calendar (T-030)`).
- **Do not touch:** `WorkoutHistory.ts`, templates, the workout feature.

## Specification

- Week starts on Monday. Today has a hairline ring. Days outside the month are blank. Digits use tabular numerals. Dots use `--color-accent`; no other colour.
- Months without workouts still render; the month title reads "October 2026".
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for `workoutDaysInMonth` (time-zone edge: a workout at 23:30 local on the last day of the month) and `calendarGrid`.
- [ ] UI at 430 × 932, dark and light, with imported synthetic data across two months.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
