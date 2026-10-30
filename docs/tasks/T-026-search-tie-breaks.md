# T-026: Search tie-breaks prefer common equipment

- **Milestone:** W2 follow-up · **Depends on:** T-019 (merged) · **Model tier:** mid

## Goal

When several variants match a query equally well, the common one comes first. Today "bench prss" lists Bench Press (Band) and (Cable) above (Barbell), because equal scores fall back to the shorter name. With no usage history yet (a fresh install), Barbell and Dumbbell should lead.

## Read first

`AGENTS.md`, `src/core/library/ExerciseSearch.ts` (`SearchTuning`, the sort in `results`, `popularityScore`), its tests, `src/core/library/Equipment.ts`.

## Scope

- **Edit:** `src/core/library/ExerciseSearch.ts`, `ExerciseSearch.test.ts`. Nothing else.

## Specification

- Add `SearchTuning.equipmentOrder`: a ranked list of equipment, most common first (barbell, dumbbell, machine, cable, smith-machine, then the rest in a sensible order; bands, kettlebells and other specialist kit last). Mark it `Heuristic:` with the reason (typical commercial-gym availability; no published source).
- Use it as a tie-break **after** score and popularity and **before** name length. It must never beat a better word match or the owner's own usage.
- Keep every existing test passing (adjust an expectation only if it encoded the old tie-break, and say which in the handoff). Add tests: "bench prss" and "bench press" put Barbell first with no usage; with usage on Dumbbell, Dumbbell first; a better match on a band exercise still wins.

## Acceptance criteria

- [ ] `make format`, `make verify` pass.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
