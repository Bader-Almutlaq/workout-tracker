# T-057: Exercise page with Summary · History · Charts · Records · How-to

- **Milestone:** R5 (analytics by view) and R2 · **Depends on:** T-055 merged (uses `LongRangeChart` and `TimeBuckets`) · **Model tier:** strong (Codex Sol: new per-exercise series and the rep-max table)
- **Reference screenshots** (attached to your prompt): `05-exercise-about`, `06-exercise-charts-1`, `07-exercise-charts-2`, `08-exercise-records`.

## Goal

Implement **Exercises → Exercise page** from `docs/design/PAGES-2026-10-31.md` (read it first). Today the page is one long scroll. It becomes a page with a segmented bar, like Strong, holding every analytic for that exercise.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md` (Exercises; Charts over long periods); `reports/Workout tracker app research.md` (e1RM formulas and caveats: cite them).
- App:
  - `src/app/features/exercises/ExerciseDetailScreen.tsx` and its parts (StrengthCard, RecentSessionRow, ExerciseInstructions, ExercisePictures, MuscleChips, ExerciseActions, the loading fields)
  - `src/app/design/charts/LongRangeChart.tsx`
  - `src/app/design/components/SegmentedControl.tsx`
- Core: `src/core/queries/ExerciseStrength.ts`, `StrengthTrend.ts`, `PersonalBests.ts`, `EstimatedOneRepMax.ts`, `PreviousPerformance.ts`, `src/core/analytics/TimeBuckets.ts`, `HardSets.ts`.

## Scope

- **Create:**
  - `src/core/queries/ExerciseSeries.ts` (+ test): one function per chart series, per session, warm-ups excluded, kilograms
  - `src/core/queries/RepMaxTable.ts` (+ test)
  - small tab components under `src/app/features/exercises/`
- **Edit:** the exercise page, the worker API (block `// Exercise page (T-057)`), docs (ARCHITECTURE rows; DESIGN for the page).
- **Do not touch:** migrations, the live workout, templates, measurement screens, the Analytics tab, import/export.

## Specification

1. **Segmented bar** at the top: **Summary · History · Charts · Records · How-to**. The selected tab is kept in the URL (`?tab=charts`), so Back returns to it.
2. **Summary:** muscles (primary and secondary chips), equipment and traits, usage (sessions, first, last), the latest e1RM headline (today's StrengthCard figure), loading settings, and the Edit and actions as today.
3. **History:** every session of this exercise, newest first. Each row shows the date, workout name and the sets (weight × reps @ RPE, kind labels). Tapping opens that History entry. Paginate or virtualise beyond about 200 sessions.
4. **Charts:** `LongRangeChart` for each series:
   - **Best set, est. 1RM:** max per session; aggregate with max.
   - **Heaviest weight:** max per session.
   - **Session volume** (kg × reps, working sets): aggregate with mean, labelled "per session".
   - **Best reps at any weight:** max reps in one set.
   - **PR progression:** a running maximum of e1RM, as a step line.

   Formulas cite the research report or are marked `Heuristic:`. Hide a chart with fewer than 2 points behind a one-line note. Timed or bodyweight exercises show only the series that apply (reps, duration).
5. **Records:**
   - **Personal records:** e1RM, heaviest weight (with reps and RPE), best session volume, each with its date.
   - **Rep-max table, 1–12 reps:**
     - **Best performance:** the heaviest set with at least that many reps, with date.
     - **Predicted:** from the best e1RM, inverting the same e1RM formula, rounded with the shared estimate rounding.
     - Rows with no performance still show the prediction.
6. **How-to:** the existing pictures (respecting the Show pictures setting) and the numbered instructions. If there are none: "No instructions for this exercise."
7. **Performance:** each tab loads its own query when first opened. The page opens in under 200 ms with the owner's four years of data.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests: each series on a synthetic history (warm-ups excluded, kg vs lb entries equal in kg); the rep-max best and predicted values hand-computed; timed and bodyweight exercises; empty history.
- [ ] Worker test for the new methods; app tests for tab URL state and the hidden-chart rule.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
