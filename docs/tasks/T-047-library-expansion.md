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

- **Status:** Implementation complete, uncommitted; not marked done. Final-tree `make verify` is blocked only by the committed upstream JSON's existing formatting. Awaiting the requested scope exception to ignore `data/sources/free-exercise-db/` in `.prettierignore` (recommended), or permission to format that input. `.prettierignore` is outside this brief's Scope. The upstream source has been restored byte-for-byte; the board and git metadata were not changed.
- **What was done:** Deterministic offline converter plus a decision for every one of the 876 source ids (233 matches, 433 new decisions, 210 skips), yielding 852 exercises in 578 families and 643 variants with source details. Preserved all original 420 names/keys and primary tags. Added v6 nullable detail columns and five frozen muscles, secondary synergist tags, exact-variant instructions/photos, default-on phone-local picture setting, Settings → Credits, and pinned-host CacheFirst caching. Custom rows are preserved, including name collisions with newly introduced library entries. Source JSON was neither fetched nor changed.
- **Files touched:**
  - `data/sources/library-mapping.json`; `tools/build-library.ts`, `tools/build-library.test.ts`, `tools/__snapshots__/build-library.test.ts.snap`.
  - `src/core/db/migrations.ts`, `migrations.test.ts`, `Database.test.ts`; `src/core/models/Exercise.ts`.
  - `src/core/library/ExerciseLibrary.ts`, `ExerciseLibrarySeeder.ts`, `ExerciseLibrarySeeder.test.ts`, `LibraryExercise.ts`, `LibraryFile.ts`, `Muscle.ts`, `Muscle.test.ts`, generated `library.json`.
  - `src/app/features/exercises/ExerciseDetailScreen.tsx`, `ExerciseInstructions.tsx`/`.module.css`, `ExercisePictures.tsx`/`.module.css`, `ExercisePicture.tsx`, `picturePreference.ts`/`.test.ts`.
  - `src/app/features/settings/SettingsScreen.tsx`, `ExercisePicturesSetting.tsx`, `CreditsScreen.tsx`; `vite.config.ts`.
  - `docs/DATA.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, this Handoff only.
- **Public API:** `buildLibrary(source, mapping): string` and its `SourceExercise`, `LibraryDecision`, `LibraryMapping` input types. `LibraryVariant` adds optional source steps/image paths; expanded `LibraryExercise` exposes nullable newline-separated `instructions` and an `imageKeys` array. `Exercise`/`ExerciseRow` add nullable SQLite detail text fields (optional for older in-memory callers, like the v5 loading fields). No worker API change is needed: the existing detail query already returns the exercise row. Display helpers expose pinned URLs and phone-local picture preference reads/writes.
- **Decisions taken:**
  - Freeze the original families inside the mapping, so generation does not mutate the curated baseline. Every kept id names its exact family; explicit equipment and muscle overrides correct source errors (Smith machines, serratus punches, direct tibialis raises, obliques). Existing families retain their muscles except the requested secondary additions. Source-order-independent lexical id ordering chooses the first details on duplicate matches and combines aliases.
  - Keep real resistance exercises using an exercise ball only with explicit exceptions; skip medicine balls, rollers, conditioning, jumps and other excluded categories. Unusual external implements use the existing `weighted` equipment slug with explicit weight/repetition or weight/duration tracking. No new equipment vocabulary is introduced.
  - Credits uses `/settings?credits`, avoiding edits to the shared route table. Pictures are two CORS JPEG frames with no credentials/referrer, hidden until loaded and omitted after failures. The bounded cache covers only the exact pinned CDN path. Disabling pictures stops requests/display and leaves already cached pictures alone.
  - Custom exercises whose names collide with expansion entries stay custom; that library row is omitted rather than taking ownership of the owner's row.
- **Open questions / left over:**
  - Need the narrow `.prettierignore` exception described above. `make format` rewrites the upstream JSON despite `SOURCE.md` documenting it as copied unchanged. Restoring it makes `make verify` fail only its formatting check. No exception has been assumed or applied.
  - Visual checks at 430 × 932 in dark/light and an actual CDN/cache/offline round trip remain for the lead: `make dev` fails with `listen EPERM: operation not permitted 0.0.0.0:5173` in this sandbox. No browser/server bypass or network fetch was attempted. Instructions/pictures/settings/credits compile, but screenshots and real picture loading have not been checked.
  - Build emits the existing-style >500 kB chunk warning; no build failure. Library instructions increase bundled size; no unrelated splitting changes were made.
- **How it was verified:** `make format` ran. Full `make verify` passed (lint, strict type checks, **903 tests in 120 files**, production build/PWA generation) with the upstream input temporarily formatted. The input was then restored, and final-tree `make verify` fails solely on its pre-existing formatting. Converter tests reproduce the generated file byte-for-byte, reverse input ordering, cover equipment/muscle/shoulder/skip/override rules, deterministic duplicate matches and exact variant details, and snapshot/resolve all 420 original names. Database tests use `Database.openInMemory()` plus migrations, verify v5 → v6 row/column preservation and both older/current backup validation, details/idempotency and custom collision preservation. Existing search/import tests pass unchanged. Generated `dist/sw.js` was inspected for the exact pinned host/path, CacheFirst, cache name and 600-entry limit. `git diff --check` passes. No commit was run and `docs/tasks/BOARD.md` was not edited.
