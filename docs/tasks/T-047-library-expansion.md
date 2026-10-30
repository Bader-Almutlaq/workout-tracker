# T-047: Bigger exercise library with instructions, pictures and smaller muscles

- **Milestone:** wave 3 · **Depends on:** T-044 merged (this adds migration **v6**, after T-044's v5) · **Model tier:** strong (Codex Sol: data mapping and a migration)

## Goal

The owner wants more exercises, descriptions, pictures if possible, and volume on smaller muscles (serratus, brachialis…). Merge **free-exercise-db** (876 exercises, public domain under the Unlicense, with step-by-step instructions and two photos each) into our library format, keep our naming and muscle taxonomy, and add a few small muscles. Spec: `docs/design/PROPOSALS.md` §5; background: `reports/Workout tracker app research.md` → *Two open databases*.

## Inputs (already in the worktree)

- `data/sources/free-exercise-db/exercises.json` and `data/sources/free-exercise-db/SOURCE.md` (the upstream commit and licence). Don't fetch anything; there is no network.

## Read first

- `AGENTS.md`; `src/core/library/library.json` (families: movement, pattern, mechanic, primary/secondary muscles, aliases, equipment variants: 165 families, 420 exercises), `ExerciseLibrary.ts`, `ExerciseLibrarySeeder.ts` (+ tests), `Muscle.ts` (`MUSCLES`), `Equipment.ts`, `ExerciseNameResolver.ts`, `src/core/db/migrations.ts`.
- App: `src/app/features/exercises/ExerciseDetailScreen.tsx`, Settings.

## Scope

- **Create:**
  - `tools/build-library.ts` (+ test): a deterministic converter that reads the source JSON and `data/sources/library-mapping.json` and writes `src/core/library/library.json`. Running it twice gives identical output.
  - `data/sources/library-mapping.json`: hand-reviewable decisions, keyed by source id:
    - match to an existing family and variant, or new family, or skip
    - our muscles if the default mapping is wrong
  - Exercise detail sections for instructions and pictures; a Settings → **Credits** screen; a **Show exercise pictures** setting (default on).
  - A migration `v6-library-details`.
- **Edit:** `library.json` (generated), the library types and seeder, `Muscle.ts`, the muscle display names, the exercise model, `vite.config.ts` (runtime caching for the picture host only), docs (DATA: library sources; ARCHITECTURE: rows; DECISIONS: picture loading).
- **Do not touch:** charts, analytics formulas, workout logging, measurements, backup, import parsers (name matching may improve via aliases only).

## Specification

1. **Coverage.**
   - Keep `category` in strength, powerlifting, olympic weightlifting and strongman.
   - Skip stretching, cardio, plyometrics, foam roll, medicine ball and exercise ball, unless the movement is a real resistance exercise.
   - Expected result: roughly 800–1,000 exercises in total.
2. **Matching.** For each kept source exercise:
   - If it is the same movement as an existing family variant (by normalised name, aliases or the mapping file), attach its instructions and pictures to that family and variant. **Never rename** existing exercises; their names are referenced by history and Strong matching.
   - Otherwise add it to an existing family as a new equipment variant, or to a new family named Strong-style, "Movement (Equipment)", with aliases from the source name.
   - Equipment mapping:
     - body only → bodyweight
     - kettlebells → kettlebell
     - e-z curl bar → ez-bar
     - bands → band
     - null/other → review in the mapping file
3. **Muscles.**
   - Map source muscles to `MUSCLES`:
     - abdominals → abs
     - quadriceps → quads
     - middle back → upper-back
     - traps → upper-traps
     - forearms → forearm-flexors (extensors when the name says reverse/extension)
     - abductors → hip-abductors
   - "shoulders" by keyword: lateral/side → side-delt; rear/reverse fly/face pull → rear-delt; otherwise front-delt.
   - Existing families keep their current muscles.
   - **Add muscles** (migration v6, frozen rows): `serratus`, `brachialis`, `brachioradialis`, `tibialis`, `lower-traps`. Tag them as **secondary** on exercises where they clearly work, so main-muscle volume doesn't change. For example:
     - push-ups, landmine press and incline press → serratus
     - hammer and reverse curls → brachialis and brachioradialis
     - Y-raise and prone raises → lower-traps
   - Make one of these **primary** only for direct movements: tibialis raise, serratus punch, wall slide.
4. **Details stored with exercises** (migration v6 adds nullable columns to `exercise`):
   - `instructions TEXT` (newline-separated steps)
   - `imageKeys TEXT` (JSON array of source paths)

   The seeder fills them for library exercises (it already upserts by `libraryKey`); custom exercises leave them null. Keep `BackupValidation` passing, and test a v5 → v6 migration keeping every row.
5. **Pictures.**
   - Load from the pinned upstream commit through jsDelivr: `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@<commit>/exercises/<path>`.
   - Add a Workbox runtime-caching rule (CacheFirst, that host only, max ~600 entries), so a picture viewed once works offline.
   - The detail shows the two frames side by side (start and end). With pictures off, or when offline and not cached, show nothing, with no broken image.
   - Record in DECISIONS that this is the only network read besides app updates and Dropbox, that it is optional, and that it sends nothing about the owner.
6. **Credits:** free-exercise-db (Unlicense) with a link; the research report's sources aren't needed.
7. **Search** picks up new aliases automatically (`ExerciseSearch` reads the catalog).

## Acceptance criteria

- [ ] `make format`; `make verify` passes; `tools/build-library.ts` reproduces `library.json` exactly (a test compares).
- [ ] Converter tests: equipment and muscle mapping, shoulder keywords, skip rules, existing names never renamed, deterministic output.
- [ ] Seeder tests: details filled; custom exercises untouched; re-seeding is idempotent.
- [ ] Migration test v5 → v6; backup validation passes.
- [ ] Every existing library exercise name still resolves (snapshot test of the 420 names).
- [ ] Docs updated; Credits screen present.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
