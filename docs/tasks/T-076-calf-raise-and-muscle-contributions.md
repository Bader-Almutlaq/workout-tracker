# T-076: Donkey Calf Raise as a weighted machine exercise; tap a muscle to see its exercises

- **Milestone:** fix iteration · **Depends on:** T-072, T-074 · **Model tier:** mid (Codex Terra)

## Goal

The owner's review (2026-11-01):

1. "For Donkey Calf Raise, remove the addition of weights; make it like a normal exercise using normal weights." Today the exercise is tracked as `bodyweight-reps`, so the live workout shows an "Added kg" column and the previous text "+145 kg × 12". The owner loads it on a machine, so the number is the machine weight.
2. On a saved workout's page (and the plan's Summary), "Sets per muscle" lists counts per muscle. "When I press on the muscles, I want to see from which exercises these sets came from."

## Read first

- `AGENTS.md`; `docs/DATA.md` (library, migrations, snapshots); `docs/ARCHITECTURE.md` (concept ownership).
- Library: `src/core/library/library.json` (family "Donkey Calf Raise": its `bodyweight` variant carries machine instructions and images; `machine` and `plate-loaded` variants exist), `ExerciseLibrary.ts`, `LibraryFile.ts`, `tools/build-library.ts`, `data/sources/library-mapping.json`, library seeding and its tests.
- `src/core/db/migrations.ts` (append only; the last is `v12-deload-settings`).
- Muscles: `src/core/queries/TemplateMuscleSummary.ts` and tests, `src/app/features/templates/TemplateMuscleList.tsx` (used by `WorkoutPage.tsx` with `weekly={false}` and `PlanSummary.tsx` with `weekly`), `src/app/design/components/BottomSheet*`, the existing `src/app/features/analytics/MuscleExerciseShareSheet.tsx` for the visual pattern.

## Specification

### 1. Donkey Calf Raise records plain weight

- **Library:** the bare "Donkey Calf Raise" is tracked `weight-reps`, not `bodyweight-reps`. Fix it at the source (`library.json`, and `tools/build-library.ts` or the mapping if the build would regenerate the old value) without renaming the exercise or changing its `libraryKey`, so imports, aliases and templates keep resolving to the same row. Keep its instructions and pictures.
- **Existing installs:** a new append-only migration `v13-donkey-calf-raise-weighted` sets `tracking = 'weight-reps'` on the exercise row whose `libraryKey` is that library entry (and only if it is still `bodyweight-reps`). Stored set weights are not touched: 145 kg added stays 145 kg, now read as the machine weight. The worker's usual pre-migration snapshot covers it. If the owner renamed the row or made a custom copy, leave those alone.
- Check that nothing else in analytics treats the old sets specially once the tracking changes (e1RM, volume, previous text, progression): they should now behave like any machine exercise.
- Document in `docs/DATA.md` (migration list) and `docs/DECISIONS.md` (one entry: the library tracked it as bodyweight but it is a machine lift; owner asked for plain kg).

### 2. Tap a muscle to see its exercises

- **Core:** extend `TemplateMuscleSummary` so each muscle row lists its contributing exercises: `contributions: readonly { exerciseId; name; direct; indirect; fractional }[]`, where a template exercise counts its non-warm-up sets as direct (primary muscle) or indirect (secondary), fractional = direct + indirect × secondary weight, the same rule as the row totals. The same exercise appearing in several workouts of a plan (or twice in one workout) is summed into one item. Sorted by fractional descending, then name. The row totals must equal the sum of the contributions (test it).
- **UI:** each muscle row in `TemplateMuscleList` with sets is a button (whole row, 44 px minimum, a chevron at the right of the count). Tapping opens a bottom sheet:
  - Title: the muscle name. One line: "6 sets · 4 direct + 4 indirect" (zero parts left out, as on the row; indirect counted at the secondary weight as the list's note explains).
  - One row per exercise: name on the left; on the right "4 sets" for direct, or "4 indirect · 2 sets" style for secondary — keep it short and consistent: the fractional sets as the number, and "direct" / "indirect" as a muted word under or beside it. On the plan Summary also show which workouts it comes from in muted text ("Push A, Push B") when there is more than one workout in the plan.
  - Tapping an exercise row isn't required (no navigation). A Close button.
- Rows marked "Not trained" (plan Summary) aren't tappable.
- Works on the workout page and the plan Summary; 430 × 932, dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Migration test v12 → v13: the library row changes to `weight-reps`, its sets and weights are unchanged, a custom or renamed exercise is untouched, and running on a fresh database works. Library test: Donkey Calf Raise's tracking is `weight-reps`.
- [ ] Core tests for contributions (direct and indirect, repeats summed across workouts, totals equal sums, sort order).
- [ ] App test: muscle rows render as buttons when they have sets, the sheet lists the exercises with their counts, "Not trained" rows aren't buttons.
- [ ] Docs as above. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Fill in at the end of the session._
