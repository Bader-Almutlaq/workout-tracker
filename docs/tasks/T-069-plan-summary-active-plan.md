# T-069: Plan Summary (sets per muscle), workout day, and the active plan

- **Milestone:** R4 (programs) · **Depends on:** T-066, T-068 merged · **Model tier:** mid (Codex Terra)

## Goal

The owner's review (2026-10-31). When building a plan, they usually work in a spreadsheet: count the sets each muscle gets per week, counting **direct and indirect** sets, plus how often each muscle is trained. They want this inside the plan, updating as exercises are added. Also:

- a **day** for each workout as data, instead of writing it in the name ("Full Bench Sat")
- the ability to make one plan the **active plan**
- a body heat map would be nice but is not important (out of scope here)

Measure, don't prescribe: no targets or verdicts on the numbers.

## Read first

- `AGENTS.md`; `docs/DESIGN.md`; `docs/DATA.md`; `reports/Workout tracker app research.md` (fractional sets: direct = 1, indirect = secondary weight; frequency).
- Core: `src/core/analytics/MuscleVolume.ts` (fractional set weights: reuse, don't re-derive), `HardSets.ts`, `src/core/library/MuscleProminence.ts`, `Muscle.ts`, `src/core/queries/MuscleCoverage.ts` (the ≥ 1 fractional set per day frequency rule), `TemplateCatalog.ts`, `src/core/templates/TemplateDraft.ts`, `TemplateStore.ts`, `src/core/db/migrations.ts` (append only), `appSetting` usage.
- App: `src/app/features/templates/` (`PlanPage*`, `PlanMenu*`, `PlanCard*`, `PlanWorkoutCard*`, `TemplatesSection*`, `TemplateDetailsSection*`, `WorkoutPage*`), `src/app/features/analytics/MuscleFrequencyList*` and `BalanceRatios*` (style to match), design components.

## Specification

1. **Template set summary (core, pure):** `TemplateMuscleSummary` for one template and for a plan (all its templates):
   - Counts planned sets that aren't warm-ups (working, drop, failure).
   - Per muscle: direct sets (exercise lists it as primary), indirect sets (secondary), and **fractional sets** = direct + indirect × the existing secondary weight from `MuscleVolume`.
   - **Frequency** (plan only): the number of the plan's workouts in which that muscle gets ≥ 1 fractional set (the same rule as `MuscleCoverage`). A plan is read as one week.
   - Totals: planned sets, workouts, and exercises.
   - Cite the report in doc comments.
2. **Plan page Summary tab:** the segmented bar becomes **Workouts · Summary · History · Analytics** (`?tab=summary`).
   - Number tiles: **sets per week** (planned, non-warm-up) and **workouts**.
   - **Sets per muscle:** each muscle with fractional sets as the main number, "6 direct + 4 indirect" under it, a thin bar for share of the largest, and "2× a week" frequency. Sorted by fractional sets.
   - Main muscles only, with a "Show smaller muscles" toggle (`MuscleProminence`). Muscles with zero sets are listed at the bottom as "Not trained" in muted text so gaps are visible.
   - One line of explanation: "Indirect sets count as half a set." (use the actual weight).
   - It reads the saved templates, so it updates whenever a workout is edited.
3. **Workout page:** under the exercise list, a small **Sets per muscle** section for that workout (same rows, without frequency).
4. **Workout day:**
   - Migration `v11-template-weekday`: `ALTER TABLE template ADD COLUMN weekday INTEGER CHECK (weekday BETWEEN 1 AND 7)`, nullable (ISO: 1 = Monday). Snapshot as usual. Preserved by every template edit path, duplicate and backup.
   - The editor's details section gets a row of day chips (Mon … Sun, tap again to clear).
   - Plan workout cards and the workout page show the day as a small chip ("Sat").
   - Within a plan, workouts with a day are listed Monday → Sunday, then those without, in their saved order.
5. **Active plan:**
   - Stored in `appSetting` (`activePlanId`); cleared when that plan is deleted.
   - Plan ⋯ menu (card and page): **Set as active plan** / **Stop using as active plan**.
   - The active plan's card is first on the Workout tab with an "Active" badge (accent).
   - When one of its workouts has today's weekday, the card shows "Today: Full Bench Sat", which opens that workout's page.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Core tests, hand-computed: direct/indirect/fractional per muscle for one template; plan totals; frequency ≥ 1 rule across workouts; warm-ups excluded; drop and failure counted; empty template.
- [ ] Migration test v10 → v11 keeps every row, weekday NULL; template save, edit, duplicate keep the weekday; backup validation passes.
- [ ] Active plan: set, clear, cleared on delete; sorted first; today line.
- [ ] App tests: Summary tab via `?tab=summary`; muscle rows text; smaller-muscle toggle; day chips set and clear; plan ordering by day.
- [ ] Works at 430 × 932 in dark and light. Docs (DATA: the column and setting; ARCHITECTURE row; DESIGN; DECISIONS: plan read as one week, frequency rule). Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

_Not started._
