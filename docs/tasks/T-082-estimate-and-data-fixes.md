# T-082: Estimated 1RM fit, lower traps, plan tiles and empty weeks

- **Milestone:** Analytics redesign, round 2 (`docs/ANALYTICS.md`) · **Depends on:** T-077–T-081 · **Model tier:** high (Codex Sol)
- **Runs in parallel with T-083** (charts), which owns `src/app/design/charts/*` and every chart component. Here you own core files plus the small UI files named below. Don't edit chart components.

## Goal

The owner checked the analytics on their iPhone with their real history (2026-11-02). Four things are wrong in the data:

1. **Squat e1RM reads 166.5 kg now and 180 kg best,** while their best top set is 140 kg × 3 and they believe their max is about 150. Cause (lead's diagnosis): almost all imported Strong sets have no RPE, so `effectiveReps` counts them as RIR 2. `personalCurve` then fits k to make *every* set in a 14-day window agree, including back-off and volume sets that were far from failure. Agreement needs a low k (about 15 for 140 × 3 against 100 × 10), and with n in the hundreds the blend ignores the 38 prior. A low k inflates every heavy set: 140 × 3 at RIR 2 → 140 × (1 + 4/15.5) ≈ 176.
2. **Lower traps never get sets.** Only one library family tags `lower-traps`; the rest fold lower traps into `upper-back`. The owner's plan shows lower traps as untrained.
3. **Plan tiles:** "175 wk" (weeks since the first imported session with a matching name) means nothing to the owner, and "Sessions per week 0" appears because the window is the last 4 full calendar weeks and they haven't trained that plan recently. Sets per muscle "done" has the same problem: all zeros after a break.
4. **Weeks with nothing logged plot as 0** on the weekly sets and weekly effort charts. The owner: "If I didn't log anything, then I'm not sure if we want to record that as 0."

## Read first

- `AGENTS.md`, `docs/ANALYTICS.md` (Definitions), `docs/DECISIONS.md` (2026-11-01 personal curve entry).
- `reports/Workout tracker app research.md` → "The recommended algorithms, in one place", items 1–4.
- `src/core/analytics/PersonalCurve.ts` (+ test), `EstimatedOneRepMax.ts`, `EffectiveReps.ts`, `src/core/queries/ExerciseCurve.ts`, `ExerciseProgress.ts`.
- `src/core/library/library.json`, `library-mapping.json`, `Muscle.ts`, `MuscleProminence.ts`, `ExerciseLibrarySeeder.ts`, `src/core/db/migrations.ts` (append only).
- `src/core/queries/TemplateAnalytics.ts` (+ test), `WeeklyEffort.ts` (+ test), `MuscleDashboard.ts`, `MuscleDetail` (weekly sets), `src/app/features/templates/TemplateAnalyticsTiles.tsx`.
- `tools/import-report.ts` (the only code allowed to read `export_data/`).

## Specification

### 1. Personal curve fits only sets with known effort

- A set qualifies for **fitting** only when its effort is known: logged RPE, or kind `failure`. Sets with unknown effort (the RIR-2 assumption) never count toward n, the rep-count check or the windows. They still get an e1RM from the resulting k, as today.
- Within each 14-day window, use only the **best e1RM set per effective-rep count** (at the trial k) for the variance, so several back-off sets at one rep count can't outvote the top set. (Report item 3 says "your sets from the same two weeks agree best"; top sets are the ones near a max. Mark this `Heuristic:` with that reason.)
- Everything else stays: ≥ 10 qualifying sets at ≥ 2 effective-rep counts, blend `(n × k_yours + 15 × k_start)/(n + 15)`, clamp 8–50, k_start fallback.
- Record the change in `docs/DECISIONS.md` (refines the 2026-11-01 entry) and in `docs/ANALYTICS.md` → Definitions (one line).
- **Tests (hand-computed):**
  - Strong-like history with no RPE (heavy triples plus 10-rep back-offs every week for 20 weeks) → `isPersonal: false`, k = 38 for a barbell squat; 140 × 3 with no RPE → 140 × (1 + 4/38) = 154.74 kg.
  - Logged RPE sets that agree at a known k (for example k = 30: build sets from e1RM 150 at E = 3, 6 and 9) → the fit returns 30 before blending, and the blend is right for n.
  - A window with three back-off sets at one rep count and one top set at another: only the best per count enters.
  - Existing tests still pass or are updated with a reason.

### 2. Developer check against the real export

Add an optional flag to `tools/import-report.ts`: `--strength "<exercise name>"`. After the normal report, it plans the import into an in-memory database (`Database.openInMemory()` + `migrate` + the existing import path), then prints, for that exercise: qualifying sets with known effort and with unknown effort, k_start, fitted k (or "not personal"), the current e1RM trend and the best session e1RM, each with the set it came from (date, weight × reps, RPE or "no RPE"). Output goes to the terminal only: nothing written to disk, nothing in tests. Keep it small (one helper file under `tools/` if needed). The lead runs it on the owner's export.

### 3. Lower traps

- In `library.json`, add `lower-traps` as **secondary** to the families that train them directly: Face Pull, every Y-raise family (any movement containing "Y-Raise" or "Y Raise"), Reverse Fly, Chest-Supported Reverse Fly, Reverse Fly With External Rotation, Sled Reverse Fly, and prone trap raises if present. Don't add it to rows or pulldowns (`upper-back` already covers them, per `Muscle.ts`).
- Migration `v15-lower-traps` (append only, frozen SQL): insert the matching `exerciseMuscle (exerciseId, 'lower-traps', 'secondary')` rows for existing library exercises with those library keys, `INSERT OR IGNORE`, only where `source = 'library'`. Write the keys out in the SQL. The worker's pre-migration snapshot applies as usual.
- Test: v14 → v15 adds the rows for library exercises only, and leaves custom and edited exercises alone (an exercise whose muscles the owner edited keeps exactly its rows; use whatever marks an edit today, or skip exercises with `source <> 'library'`). Update the seeder test counts.

### 4. Plan tiles and the "recent" window

- **Recent window** for a plan or workout: the 4 calendar weeks (Monday start) **ending with the week of its latest finished session**, not the current week. With fewer weeks of history, the weeks available. Expose `windowEnd` (ISO date) so the UI can say "4 weeks to 12 Oct" when the latest session is more than a week old.
- Use it for sessions per week and for sets per muscle done vs planned (and its contribution sheet).
- Replace `weeksOnPlan` in the tiles with **Workouts**: total finished sessions in scope. Keep `weeksOnPlan` out of the UI (delete it if nothing else uses it).
- `TemplateAnalyticsTiles.tsx` (plan): **Workouts** (total), **Per week** (recent window, one decimal, "of 3 planned" as the sub-line), **Typical length**. If the latest session is more than 7 days old, the Per week sub-line reads "4 wk to 12 Oct" instead. Keep tile text short.
- Tests: a plan last trained 6 weeks ago has non-zero per week and done sets; a plan with sessions this week behaves as before.

### 5. Weeks with nothing logged are gaps

- `WeeklyEffort` (and the weekly sets series on the muscle page, `MuscleDetail`): a week with **no finished session in scope** is omitted (or carries `null`), not 0. A week with sessions but no logged RPE has `null` effort (it already reports "not logged"). A week with sessions but zero hard sets for that muscle is a real 0.
- Callers must keep compiling. If the charts need `null` to draw a gap, return `null` and type it; T-083 draws the gaps. Don't change chart components here; a minimal type fix in a caller is fine.
- Tests for each case.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests listed above, hand-computed.
- [ ] Docs: DECISIONS (curve fit, lower traps, recent window), ANALYTICS (Definitions), DATA (v15). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
