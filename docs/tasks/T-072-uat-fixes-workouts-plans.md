# T-072: Test-pass fixes: workouts, plans and the live workout

- **Milestone:** fix iteration · **Depends on:** T-066–T-071 · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-073** (measure, history, analytics fixes). Don't edit `src/app/features/body/`, `src/app/features/history/`, `src/app/features/analytics/`, `src/app/features/exercises/` or `src/app/features/settings/`.

## Goal

The lead tested every feature on a fresh copy of the app (2026-11-01). Everything core works. Fix these bugs and rough edges, each with a regression test where it's testable.

## Fixes

1. **Return doesn't submit name dialogs.** In "New plan" (and every dialog with one text field: rename plan, rename workout, folder/plan name), pressing Return should do the primary action when the field is valid. Use a `<form>` with `onSubmit`, not key handlers.
2. **Exercise picker count is wrong across searches.** After selecting Bench Press, searching "UAT" and selecting UAT Hammer Curl, the button said "Add (1)" while both were added. The count must be the total selected, regardless of the current search or filters.
3. **Template editor day chips:** the Mon…Sun row sits against the card's edge with no label. Give it a "Day" label like the other fields and the same inner padding; chips wrap or shrink to fit 430 px without overflow.
4. **Workout page day chip** ("Sun") stretches across the full width. It should be a small inline chip next to "Last done …".
5. **Workout page "Sets per muscle"** lists every untrained muscle, which is too long for one workout. On the workout page, show only muscles with sets. The plan Summary keeps its "Not trained" rows.
6. **Muscle row wording** (plan Summary and workout page): leave out zero parts: "1 direct", "1 indirect", "2 direct + 1 indirect". Leave out the frequency when it's 0 ("0× a week" is noise); show "1× a week", "2× a week".
7. **Active plan card:** the "Active" badge and a tiny underlined "Today: UAT Sunday" link are squeezed into the top-right corner. Put the **Active** badge after the plan name. Make "Today: UAT Sunday" a full-width row at the bottom of the card (accent text, chevron) that opens the workout page, with a 44 px touch target.
8. **Warm-up "W" label in the live workout is clipped:** the set-type pill shows a dark shape with the W at its edge. The pill must fit its label (W, D, F, or a number) centred, at the compact row size, in dark and light.
9. **After finishing a workout started from a saved workout**, the summary offers "Save as workout", which would make a duplicate. When the session came from a workout, offer **Update "UAT Sunday"** instead (replace that workout's exercises and set kinds with this session's, keeping its targets where the exercise and set position still match; ask for confirmation first). Keep "Save as workout" for empty-start sessions.

10. **Session links remember where they came from:** session links in the workout page's History tab (`TemplateSessionHistory`) and the plan's History (`PlanSessions`) pass `state: { from: <current path with search> }`. T-073 makes the session page's Back use it.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests for 1, 2, 5, 6, 7 and 9 (core test for the update-from-session store function: targets kept for matching positions, new sets without targets, removed exercises removed).
- [ ] Checked at 430 × 932, dark and light. Docs where behaviour changed. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Implemented name-dialog form submission, synchronous picker search rendering, day and muscle layouts, active plan navigation, compact set labels, history return state, and confirmed updating of linked workouts from finished sessions. The update matches repeated exercises in occurrence order and preserves targets by set position; double progression is switched off if new or changed sets cannot satisfy its target requirements. The operation is transactional and leaves session data intact.

Changed files: shared Button/ConfirmDialog; template plan cards, dialogs, details, muscle list, session history, workout page and finish action; workout picker, rename dialog, summary and set label; TemplateStore and WorkerApi; adjacent regression tests. Public API: `TemplateStore.updateFromWorkout(db, workoutId, now)` and `WorkerApi.updateTemplateFromWorkout(workoutId)`.

Verification: `make format` run; `make verify` passed: 185 test files, 1,301 tests, and production build (with the existing chunk-size warning). `make dev` could not bind port 5173 (EPERM), and the browser access host was unavailable, so the 430 × 932 dark/light checks and interactive Return and cross-search picker checks remain for review. The picker already stored its full selection independently of results; removing deferred search rendering avoids showing stale results but the reported count discrepancy could not be reproduced here. Tests cover rendered form/button markup and counts, not those interactions. No board edit or commit.
