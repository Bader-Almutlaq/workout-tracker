# T-046: Plain-language exercise search (muscles, movements, equipment words)

- **Milestone:** wave 2 · **Depends on:** none · **Model tier:** mid (Codex Terra)

## Goal

The owner types the way they think: "chest machine", "rear delt cable", "quad isolation", "lat pull", "pecs fly", "hamstring curl", "bis db". Today search matches names, aliases, slang, prefixes and typos, and filters by muscle only through a chip. Muscle and movement words typed in the box should narrow and rank results too.

## Read first

- `AGENTS.md`; `src/core/library/ExerciseSearch.ts` (+ test: tuning, `SearchText`, slang), the muscle taxonomy (`src/core/library/Muscle*.ts`), `Equipment.ts`, the movement pattern and mechanic types.
- App: `src/app/features/exercises/ExerciseFilters.tsx`, `exerciseBrowseState.ts`, `ExerciseBrowser.tsx` (the same search is used by the workout's add-exercise picker).

## Scope

- **May edit:** `ExerciseSearch.ts` (+ test), a new `src/core/library/SearchVocabulary.ts` (+ test) for the word lists, the filters UI and browse state (+ tests).
- **Do not touch:** migrations, the library seed, charts, workout logging, measurements, warm-ups (T-044 is running in parallel).

## Specification

1. **Vocabulary** (one frozen file, documented as `Heuristic:` gym usage):
   - Muscle words → `Muscle`, e.g.:
     - chest/pecs/pec → chest
     - front delt/anterior delt
     - side delt/lateral delt
     - rear delt/posterior delt
     - lats/lat
     - traps/trap → upper traps
     - upper back/rhomboids
     - bis/biceps
     - tris/triceps
     - forearm
     - abs/core
     - obliques
     - glutes/glute/butt
     - quads/quad/quadriceps
     - hams/hamstrings/hamstring
     - calves/calf
     - adductors/inner thigh
     - abductors/outer thigh
     - hip flexors
     - neck
   - Movement words → movement pattern or mechanic: press, push, pull, row, fly/flye, curl, extension, raise, squat, hinge, lunge, carry, isolation, compound.
   - Equipment words already exist; add any missing (machine, cable, smith, plate loaded, band).
2. **Query parsing:** each query token (or two-token phrase such as "rear delt") that is a vocabulary word becomes a *soft constraint*:
   - Entries whose primary muscles (for muscle words), pattern/mechanic (for movement words) or equipment (for equipment words) match get a strong boost.
   - Entries that match only as a secondary muscle get a small boost.
   - Remaining tokens match names as today.
   - If every token is a vocabulary word ("chest machine"), return only entries matching all constraints, ranked by usage and recency.
   - A token that is both a name word and a vocabulary word ("curl", "press", "raise") counts for both.
3. **Filters:** keep the muscle and equipment chips, and add **Compound / Isolation** chips. Chips and typed words combine (AND).
4. **Ranking stays honest:** a whole-name match still beats a vocabulary-only match. Tune in `SearchTuning`, with tests on the bundled library:
   - "chest machine" top 5 are chest machines
   - "rear delt cable" top 3 are rear-delt cable exercises
   - "bay" still finds Bayesian curl first
   - "rdl" still finds Romanian deadlift
   - "hamstring curl" finds leg curls
   - "quad isolation" finds leg extensions
   - "lat pull" finds lat pulldowns
5. Performance: under 5 ms per keystroke for 1,500 entries in Node (add a timing test with a synthetic library).

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Vocabulary tests; the ranking tests above; no regression in existing search tests.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
