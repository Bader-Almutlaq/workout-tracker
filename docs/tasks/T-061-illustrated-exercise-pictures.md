# T-061: Illustrated exercise drawings where available

- **Milestone:** R2 (library) · **Depends on:** T-047 (pictures), T-057 (How-to tab) · **Model tier:** mid (Codex Terra)

## Goal

The owner prefers an illustrated model over photos of a real person (`docs/design/PAGES-2026-10-31.md` → Exercises). It's a side feature, so keep it light.

The everkinetic dataset has line drawings, a start and an end frame, for 293 exercises (CC BY-SA 4.0). Show its drawings where an exercise has one, and keep the existing free-exercise-db photos as the fallback.

## Inputs (already in the repository)

- `data/sources/everkinetic/exercises.json` and `SOURCE.md` (the pinned commit, licence, and how images load). Don't fetch anything. Each entry has `id_num` (e.g. `"0042"`), `title`, `primary`, `secondary` and `equipment`.
- Image URLs follow `https://cdn.jsdelivr.net/gh/everkinetic/data@446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6/dist/png/<id_num>-relaxation.png` and `-tension.png`.

## Read first

- `AGENTS.md`; `tools/build-library.ts` and `data/sources/library-mapping.json` (how T-047 matched a dataset deterministically, with an explicit decision per source id).
- `src/core/library/library.json`, `LibraryFile.ts`.
- App: `src/app/features/exercises/ExercisePictures.tsx`, `ExercisePicture.tsx`, `picturePreference.ts`, the How-to tab, Settings → Credits and the picture setting.
- `vite.config.ts`: the Workbox runtime caching rule for the free-exercise-db host.

## Scope

- **Create:**
  - `tools/build-illustrations.ts` (+ test): writes `src/core/library/illustrations.json`, a map from our exercise `libraryKey` to an everkinetic `id_num`, from a hand-reviewable `data/sources/illustration-mapping.json`
  - that mapping file: one decision per everkinetic id, matched to a libraryKey or skipped, each with a short reason when not obvious
- **Edit:**
  - the picture components: prefer drawings, fall back to photos
  - the picture setting: "Exercise pictures: Drawings first / Photos only / Off"; drawings first is the default
  - Credits: add everkinetic (CC BY-SA 4.0, link, "illustrations shown unmodified")
  - `vite.config.ts`: CacheFirst for the everkinetic pinned path, about 600 entries
  - docs (DATA: the source; DECISIONS: one entry; ARCHITECTURE: a row)
- **Do not touch:** migrations (no schema change: the map is bundled and looked up by `libraryKey`), library names, charts, logging, import/export.

## Specification

1. **Matching:**
   - Match only the **same movement and equipment**, e.g. everkinetic "Bench Press" (barbell) → our "Bench Press (Barbell)".
   - Skip ambiguous ones rather than guess.
   - Aim for precision over count; expect roughly 120–200 matches.
   - The generated map is deterministic. A test regenerates it and compares byte-for-byte.
2. **Display:**
   - The How-to tab and the exercise list thumbnails (if the list shows pictures) use the two drawing frames, start and end, side by side, on a light card so the black line art reads well in dark mode.
   - With no drawing, show today's photos.
   - Respect the setting and offline state as today: nothing broken and no empty boxes.
3. **Privacy:** an image is requested only when viewed, with no credentials or referrer, the same as the existing photos. Record in DECISIONS that this is a second optional picture host.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Generator tests: deterministic output, skips honoured, only existing libraryKeys used.
- [ ] Component tests: drawings first, photo fallback, setting modes.
- [ ] Docs and Credits updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

Reviewed all 292 distinct source image IDs against library names, aliases, equipment and source instructions. The mapping now has 215 matches and 77 skips, with a specific reason for each skip. Duplicate movements retain one illustration; ID `0020` remains skipped because it identifies two different source exercises. For T-bar rows, the source describes an unsupported standing machine while the library's machine entry specifies chest support; it remains skipped pending a reliable equipment match. The source squat-to-bench explicitly says not to sit, so it is not mapped to the library's box squat.

Round 1 added the deterministic generator and bundled lookup, drawing-first picture selection with photo fallback, setting modes, credits, runtime cache and source/architecture/decision documentation. The list has no picture thumbnails and no schema changed. Round 2 changes the reviewed mapping, generated lookup and generator regression test. Public API remains `buildIllustrations`, `PicturePreference`, and `selectedExercisePictures`.

Verification: `make format` and `make verify` passed: 155 test files, 1,162 tests. Visual verification from Round 1 remains outstanding: `make dev` could not bind a local port in this sandbox (EPERM). Changes are uncommitted; the board was not edited.

## Round 2 (lead)

42 matches is far too few. The skips are mostly clear matches that only differ in wording. Review **every** skipped id by hand against our library names **and aliases** (`library.json`). Match when the movement and the equipment agree, even when the words differ:

| everkinetic | ours (check the exact name) |
|---|---|
| Arnold Press (dumbbells) | Arnold Press (Dumbbell) |
| Lateral Dumbbell Raises | Lateral Raise (Dumbbell) |
| Front Raises / Front Dumbbell Raise (dumbbell) | Front Raise (Dumbbell) |
| Barbell Shrugs / Shoulder Shrugs (dumbbell) | Shrug (Barbell) / Shrug (Dumbbell) |
| Seated Cable Rows | Seated Row (Cable) |
| T-Bar Rows | T-Bar Row |
| Upright Barbell Rows | Upright Row (Barbell) |
| Cable Crossover | Cable Crossover |
| Dumbbell Flys (flat bench) | Chest Fly (Dumbbell) |
| Dumbbell Incline Bench Press / Incline Dumbbell Press | Incline Bench Press (Dumbbell) |
| Smith Machine Bench Press | Bench Press (Smith Machine) |
| Chin Ups / Chest Dips | Chin Up / Chest Dip |

- **Several source ids may map to the same libraryKey;** keep one, the clearest. The map is libraryKey → one id.
- **When one source drawing fits a family** (e.g. a generic "Dumbbell Shoulder Press"), map it to the exact variant only.
- **Still skip:** stretches, mobility drills, ball/Bosu/band-only variants we don't have, and real ambiguity (posture or grip that clearly differs). Give a specific reason for each skip, not a generic one.
- **Target:** most strength exercises in the source, roughly 150 or more. Keep the generator deterministic and the tests passing.
