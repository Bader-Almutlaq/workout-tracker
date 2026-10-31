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

_Filled in by the implementer when stopping or finishing._
