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

Implemented within the listed scope; left uncommitted. Not complete against the entire brief: the PR series has correct cumulative maxima but still uses the shared chart's linear interpolation. Step rendering needs an optional prop in `LongRangeChart.tsx` and `LongRangePlot.tsx`, which are outside the explicit edit scope. A scope-extension question is pending. The board was not edited, as instructed.

**Files and public API**

- `src/core/queries/ExerciseSeries.ts` and `.test.ts`: `ExerciseHistoryPolicy`, `ExerciseSession`, `ExerciseSeriesPoint`, `ExerciseSeriesHistory`; `ExerciseSeries.history`, `read`, `estimatedOneRepMax`, `heaviestWeight`, `sessionVolume`, `bestReps`, `duration`, `progression`. History pages contain up to 200 finished sessions, newest first; chart input is oldest first and keeps sessions on the same day distinct. Repeated exercise entries are combined per workout. Only completed sets enter history; warm-ups remain visible there but are excluded from all analytics.
- `src/core/queries/RepMaxTable.ts` and `.test.ts`: `RepMaxRow`, `ExerciseRecords`, `RepMaxTable(db, exerciseId, now?)`. Actual performance means the heaviest set with at least the row's reps, with earliest performance winning ties. Dated records reuse the series calculations. Predictions invert the canonical unit-load e1RM estimate at RIR 0; no second k table or formula implementation was introduced. Returned values remain exact kg; `estimateText` provides shared rounding at display time.
- `src/worker/WorkerApi.ts`, block `// Exercise page (T-057)`, and `WorkerApi.exercisePage.test.ts`: new read-only `exerciseHistory(exerciseId, offset?)`, `exerciseCharts(exerciseId)`, `exerciseRecords(exerciseId)` methods. Worker tests check results, missing ids, pagination and byte-for-byte non-mutation.
- `src/app/features/exercises/ExerciseDetailScreen.tsx`, its CSS module and `.test.ts`; new `ExerciseSummaryTab`, `ExerciseHistoryTab`, `ExerciseHistoryPage`, `ExerciseSessionRow`, `ExerciseChartsTab`, `ExerciseChart`, `ExerciseRecordsTab`, `ExerciseRecordRow`, `ExerciseRepMaxTable`, `ExerciseHowToTab`, `ExerciseStrengthHeadline`, `ExerciseQueryMessage`, `ExercisePage.module.css`, `exercisePageTabs.ts`/`.test.ts`, `exerciseSetText.ts`, `ExerciseChart.test.ts`. URL tab state preserves unrelated query parameters. Only the active tab mounts its own data query; reopening refreshes it. Summary uses the same smoothed headline as StrengthCard without its old chart. Pictures load only in How-to and retain their existing preference behavior.
- `docs/ARCHITECTURE.md` ownership rows and `docs/DESIGN.md` exercise-page behavior updated. No migrations or out-of-scope screens changed.

**Interpretations**

- Timed exercises show duration; loaded timed exercises also show heaviest weight. Bodyweight exercises show best reps without inventing total mass, weighted volume or e1RM. Unsupported weight records have an explanatory message.
- Work includes working, drop and failure sets. Unknown effort is explicit in history/records; predictions use existing eligibility and effort assumptions. Actual rep performances do not require effort data. No source screenshot values were used.
- History uses bounded previous/next pages rather than an ever-growing load-more list. Links open existing History details; browser Back retains the exercise section in the URL.
- Shared chart files remain untouched pending scope authorization. The requested step interpolation cannot be selected through their current public props.

**Verification and remaining checks**

- `make format` and `make verify` passed: 147 test files, **1,117 tests**, including **26 new tests** across six files; lint, strict type checks and production/PWA build passed. Build retains the existing large-chunk advisory. `git diff --check` passed.
- Synthetic desktop benchmark (no personal data): 800 sessions over four years, 20,000 sets across 20 exercises, 1,000 sets for the selected exercise. Summary queries ~21 ms, Charts ~60 ms, Records ~59 ms, first History page ~74 ms. These exclude worker transfer, rendering and device startup. A deliberately extreme 20,000-set single-exercise case took ~971 ms for existing Summary queries, ~1,319 ms for Charts, ~1,512 ms for Records and ~350 ms for History; the 200 ms iPhone page-open requirement is not established by these measurements.
- Live visual/safe-area/dark/light checks remain unverified: `make dev` failed with sandbox `listen EPERM` on port 5173; the browser host was unavailable and opening Simulator returned `Invalid app: Simulator`. Server-rendered app tests cover URL selection, deferred queries, hidden-chart rules, chart expansion/table markup and estimate rounding, but do not replace device QA.
- Lead follow-up: authorize/add step interpolation to the shared chart and apply it to PR progression, then perform iPhone visual/navigation/offline checks. No commit was made.
