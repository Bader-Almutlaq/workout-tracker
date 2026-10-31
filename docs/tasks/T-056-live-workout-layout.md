# T-056: Strong-style live workout screen

- **Milestone:** R6 (live workout panel) · **Depends on:** none (no schema change) · **Model tier:** strong (Codex Sol: the most-used screen; must stay fast and lose nothing)
- **Reference screenshots** (attached to your prompt): `11-live-workout`, `12-exercise-menu`, `13-exercise-menu-2`.

## Goal

Implement **Live workout** from `docs/design/PAGES-2026-10-31.md` (read it first), plus *Suggested values* and *Warm-ups* from `docs/design/PROPOSALS.md` → *Owner decisions*. The owner prefers Strong's compact layout. Suggestions are a reusable slot: warm-ups fill it now, and progression fills it later.

## Read first

- `AGENTS.md`; `docs/design/PAGES-2026-10-31.md` → *Live workout*; `docs/design/PROPOSALS.md` → *Owner decisions* (suggestions beside the value, warm-ups); `docs/DESIGN.md` (tokens).
- `src/app/features/workout/` (WorkoutScreen, ExerciseCard and its header, SetRow, SetCell, the number pad, `setKindItems.ts`, `warmupMenuItem.ts`, `workoutActions.ts`, `useActiveWorkout.ts`), `src/app/design/tokens.css`.
- Core: `src/core/logging/WorkoutLogger.ts` (warm-up suggestions and protection, set kinds, unit switch, replace and remove), the `exercise.restTargetSeconds` and `supersetGroup` columns.

## Scope

- **May edit:** the workout feature, `tokens.css` (new tokens), shared components where a small prop is needed, the worker API (only if an existing core operation lacks a method), tests, `docs/DESIGN.md` (live workout and token table).
- **Do not touch:** migrations, history/edit mode behaviour (shared components must keep working there; check `src/app/features/history/PastWorkoutEditor.tsx`), templates, charts, analytics, import/export.

## Specification

1. **Layout** (screenshot 11):
   - **Header:** workout name with its menu, date and elapsed time. A sticky top bar keeps elapsed time and **Finish**.
   - **Per exercise:**
     - the name (accent colour, opens the exercise page) and a ⋯ menu
     - an **info line**, showing only what exists: rest target ("Rest 2:00"), exercise note or sticky note, and later the machine
     - the columns **Set · Previous · kg (or lb) · Reps · ✓**, then **+ Add set**
   - Compact rows, ~44 px tap targets, 430 px wide, dark and light.
2. **RPE:**
   - Moves from its own column to a small badge on the ✓ button, as in Strong.
   - Tap the badge (or long-press ✓) to set RPE with the existing picker.
   - An empty badge isn't shown until RPE is set; the ⋯ menu gets "Show RPE" to reveal empty badges for this exercise.
3. **Suggested values:**
   - Untouched weight and reps show the previous session's values, greyed (as today).
   - Add an optional **amber suggestion** next to each value cell (`--color-suggestion`, light and dark), rendered from a `suggestion` prop.
   - Tapping it copies the value into the set. Ticking ✓ with untouched cells uses the greyed values.
   - Wire warm-up suggestions to it. Leave a clear, typed seam for progression later; no progression logic here.
4. **Warm-up rows:**
   - A brighter purple tint across the whole row (`--color-warmup-row` and `--color-warmup-label`, defined as explicit hex in light and dark, derived from the theme accent `#5e6ad2` / `#7c85e8`).
   - A thin separator line before the first working set.
   - Replace today's amber tint.
5. **Set types:**
   - Tapping the set number opens the set type menu: Warm-up, Normal, Drop, Failure.
   - Labels: W (purple), D, **F in red** (`--color-status-bad`), and numbers for normal sets.
6. **⋯ menu** (screenshots 12–13), using only existing operations:
   - Add note, Add sticky note (if a persistent exercise note exists; otherwise omit)
   - Add warm-up sets / Remove suggested warm-ups
   - Rest time (edit `restTargetSeconds`; display only, no timer)
   - Replace exercise, Create superset (only if supported; otherwise omit)
   - Unit (kg/lb)
   - Move up/down, Remove exercise

   Don't build new features for missing items; list what you omitted in the Handoff.
7. **No regressions:**
   - Every change still saves immediately through the existing write queue, and the typo check still prompts.
   - History edit mode still works with the shared components.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests: the suggestion slot (tap copies, tick uses greyed values), the RPE badge visibility rule, set type labels (F uses the bad-status token), warm-up row and separator classes, menu items present/omitted per capability, and the history edit mode render still passing.
- [ ] Docs updated (DESIGN token table with the new hex values).
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
