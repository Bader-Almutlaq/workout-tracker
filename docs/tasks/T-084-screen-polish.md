# T-084: Screen polish from the owner's iPhone review: lists, tiles, pins, live boxes

- **Milestone:** Analytics redesign, round 2 (`docs/ANALYTICS.md` → "Text on analytics screens") · **Depends on:** T-082 (merged) · **Model tier:** mid (Codex Terra)
- **May run alongside T-083** (chart system), which owns `src/app/design/charts/*` and every chart component, including the chart parts of `ScopedTemplateAnalyticsContent.tsx`. Don't touch charts. In `ScopedTemplateAnalyticsContent.tsx`, change only the exercise-progress list section if you must; prefer editing `LiftRow` and its own files.

## Goal

The owner reviewed the app on their iPhone with real data (2026-11-02). Besides the charts (T-083) and the data fixes (T-082), they want:

1. **No " · " strings.** "You keep using this dot format, which I think is not the best way." Examples: the plan card lists its workouts as "Push · Pull · Legs"; the exercise summary says "230 sessions · 878 sets · 3 warm-up sets"; a muscle row says "6 direct · 4 indirect".
2. **Plan Summary muscles:** only show muscles the plan trains (obliques and hip abductors showed with nothing). "Show smaller muscles" should show them differently from the main list.
3. **Progress rows are unclear** (plan and workout Analytics): "I'm not sure what that line represents. Is it one rep max?… what kind of progress am I looking at", and over what period.
4. **Workout tile "Last sets"** is unclear.
5. **Pinned lifts:** the empty state is chatty ("Pin lifts from an exercise's ⋯ menu"), and tapping **+ Bench Press**, then **+ Squat**, then **+ Deadlift** ended on the Obliques muscle page. Likely cause: after the first pin, the suggestions disappear (the empty state ends) and the page jumps, so the next taps land on the muscles table below.
6. **e1RM "how did you get this":** the owner couldn't tell where 166.5 kg came from.
7. **Live workout:** the number boxes still look sharp-cornered, and should be slightly more compact. Cause: `.cell` in `ValueCell.module.css` has a 6 px transparent border with `background-clip: padding-box`, so the visible box's corner radius is 8 − 6 = 2 px.
8. **Finish with nothing logged:** the "Nothing was logged, so this workout won't be saved." dialog needs more spacing.

## Read first

- `AGENTS.md`, `docs/DESIGN.md`, `docs/ANALYTICS.md` (Text on analytics screens), `src/app/design/tokens.css`, the shared components in `src/app/design/components/`.
- `PlanCard.tsx`, `TemplateMuscleList.tsx` (+ sheet), `SMALLER_MUSCLES` (`src/core/library/MuscleProminence.ts`), `exerciseText.ts` and the exercise Summary screen, `LiftRow.tsx`, `LiftSparkline.tsx`, `TemplateAnalyticsTiles.tsx` (workout tiles), `PinnedLifts.tsx`, `ExerciseProgressTiles.tsx`, `ValueCell.module.css`, `SetGrid.module.css`, `liveWorkoutLayout.test.ts`, `confirmation.ts` and the confirm dialog component it uses.

## Specification

1. **Plan card workouts:** show each workout name as its own small chip (wrapping), or as a short vertical list of names when there are 4 or fewer. Pick one, apply it to every plan card. No " · ".
2. **Exercise Summary stats:** labelled stat tiles in one row (value large, label small under it): **Sessions**, **Working sets**, **Warm-ups** (omit Warm-ups when 0). Remove the " · " sentence. Apply the same treatment anywhere `exerciseText.ts` builds a " · " stats line for a summary (leave short inline subtitles such as "Barbell · Chest" alone only if they are a name + category; otherwise use chips).
3. **Plan Summary muscles (`TemplateMuscleList`):**
   - Hide muscles with 0 fractional sets (they aren't trained by this plan).
   - Each row: muscle name, the fractional sets value, a bar, and the split as two **right-aligned columns with a header row** ("Direct", "Indirect"), not a sentence. Tapping still opens the contributions sheet.
   - "Show smaller muscles" reveals a separate, visually quieter group under its own small heading "Smaller muscles": compact rows (smaller text, no bar), still tappable. Hidden again by the same control.
4. **Progress rows (`LiftRow`) on the plan and workout Analytics tabs:**
   - A header row above the list, once: **Exercise · Est. 1RM (last 8) · vs 4 sessions ago**, as three column headers aligned with the row's name, sparkline and change (no dots in the real UI: three header cells).
   - When a row falls back to top-set weight (no e1RM), its sparkline column shows top-set weight and the row carries a small "top set" tag, as today.
   - The set-count change ("3 → 1 sets") moves into its own small tag on the row ("Sets 3 → 1"), not appended to text.
5. **Workout tiles:** rename "Last sets" to **Sets last time**, value "18 / 18", sub-line "planned". Keep three tiles in one row.
6. **Pinned lifts:**
   - Empty state: just the suggestion chips under the "Pinned lifts" heading, no sentence. If there are no suggestions, a single muted line "No pinned lifts" and nothing else.
   - Pinning from a chip must not move the page under the finger: keep the remaining suggestion chips visible after a pin (as "+ Squat" chips beside the new card) until every suggestion is pinned, and reserve the card row's height so nothing below jumps. After pinning, the card appears in place of its chip.
   - Write a regression test that pins two suggestions in a row and checks that both are pinned and no navigation happened.
7. **e1RM tile explains itself (`ExerciseProgressTiles`):** tapping the **e1RM now** or **Best e1RM** tile opens a small bottom sheet: the set it came from (date, weight × reps, "RPE 8" or "RPE not logged: counted as 2 reps left"), the formula in words ("weight × (1 + (reps + reps left − 1) ÷ k)"), this lift's k and whether it's personal ("learned from your sets" with n) or the default for its type. Use whatever the worker already returns; if the source set or k isn't exposed, add it to the existing `exerciseProgress` result (core + worker, tested). Keep the tiles' own text unchanged.
8. **Live value boxes:**
   - Give the visible box real rounded corners (`--radius-small`, 8 px, visible) by moving the touch-area extension off the box: use an outer wrapper or a `::before` hit area, not a transparent border that eats the radius.
   - Make the visible box about 30 px tall (from 32), keeping the 44 px touch target and the row spacing rules in DESIGN.md. Update `liveWorkoutLayout.test.ts`.
   - History's past-workout editing uses the same cells; it must keep working.
9. **Confirm dialog spacing:** when a confirmation has a title and no message, give it the same vertical rhythm as one with a message (space between title and buttons, buttons stacked with a gap, padding around). Check the "Discard workout" case and one other confirmation.
10. Works at 430 × 932 in dark and light, no horizontal scroll.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: plan card renders one element per workout and no " · "; exercise summary renders labelled tiles; 0-set muscles hidden; smaller muscles in their own group; progress list header present once; "Sets last time" tile; pinned-lift empty state has no sentence and two pins in a row both stick; e1RM sheet shows the source set and k; value box radius not eaten by a transparent border (layout test); confirm dialog without message has its spacing class.
- [ ] DESIGN.md updated where the look changed. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Implemented plan workout chips, exercise usage tiles, trained-muscle rows and smaller group, progress headers and set labels, workout tile wording, pinned suggestion slots, estimate explanations, compact rounded value boxes, and confirmation spacing. `ExerciseProgress` now returns the best and latest accepted estimate source sets and the fitted curve; the current headline is a smoothed trend rather than one set, which the sheet explains.

Remaining review: the required two-consecutive-pin interaction regression and interactive sheet/expanded-muscle tests were not added. The pin-slot ordering is stable while pinning, but suggested lifts can revert to suggestion order after a remount even if previously reordered; resolve this before marking the task complete. No iPhone-sized dark/light visual check was performed. Confirm that the progress comparison header and the touch areas fit on device. Changes are uncommitted; do not mark the task done until those gaps are resolved and verification is rerun.
