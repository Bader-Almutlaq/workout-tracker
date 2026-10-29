# T-009: Live typo check for one set while logging

- **Milestone:** M3
- **Depends on:** T-008 (done)
- **Model tier:** mid

## Goal

When the owner completes a set whose weight or reps look like a typo, the app asks "Is this right?", for example 1,000 lb instead of 100, or 80 reps instead of 8. The check must be the same one the import review uses, so there's one definition of "suspicious". This task builds the core function; the logging screen (T-010) will call it later.

## Read first

- `AGENTS.md`; `docs/DATA.md` → *Typo and outlier checks*.
- `Packages/WorkoutCore/Sources/WorkoutCore/Validation/SetPlausibility.swift`: `Observation`, `Finding`, `Issue`, `Threshold`, the internal `check(_:against:)`, `SessionSummary.make(from:)`, and `weightCorrection`.
- `Logging/WorkoutLogger.swift`, `Queries/PreviousPerformance.swift`, and the models `WorkoutSet` and `Workout` (`isInProgress`, `isCompleted`).
- Tests for style: `Tests/WorkoutCoreTests/Validation/SetPlausibilityTests.swift` and `Tests/WorkoutCoreTests/Logging/WorkoutLoggerTests.swift`.

## Scope

- **Create:**
  - `Packages/WorkoutCore/Sources/WorkoutCore/Validation/LiveSetCheck.swift`
  - `Packages/WorkoutCore/Tests/WorkoutCoreTests/Validation/LiveSetCheckTests.swift`
- **Edit:** `Validation/SetPlausibility.swift` only if a small internal change is needed to reuse `check` with past-only neighbours, for example a new internal entry point. Behaviour for the import must stay identical: all existing tests pass unchanged.
- **Do not touch:** the App, migrations, and any other file.

## Specification

```swift
public enum LiveSetCheck {
    /// The finding for a candidate set of `exerciseID`, judged against the owner's most recent
    /// finished sessions of that exercise (up to `SetPlausibility.Threshold.neighbourSessions`,
    /// newest first, excluding `workoutID`). `nil` when the set looks normal or there is too little
    /// history (fewer than `Threshold.minimumNeighbourSessions` sessions).
    public static func finding(
        exerciseID: Int64, weightKilograms: Double, reps: Int, kind: SetKind,
        excludingWorkout workoutID: Int64?, _ db: Database
    ) throws -> SetPlausibility.Finding?
}
```

- Only past sessions count as neighbours, since there's no future while logging. Build them with the same `SessionSummary` logic: the top working-set weight and reps per session.
- Warm-ups are never flagged; the same rule as the import.
- The finding's `id` can be 0, since there's no line number.
- Weight-unit suggestions (kg↔lb) and ÷10 / ×10 suggestions work as in the import, through the same `weightCorrection`.

## Acceptance criteria

- [ ] `make test` passes, and every existing SetPlausibility test is unchanged.
- [ ] Tests, using a synthetic history inserted with SQL:
  - normal set → nil
  - 1,000 kg on a 100 kg lift → weight too high, suggestion 100
  - 80 reps where typical is 8 → reps too high, suggestion 8
  - fewer than 3 past sessions → nil
  - warm-up → nil
  - in-progress and planned sets are ignored as history
  - `excludingWorkout` is honoured
- [ ] Add a row to the concept table in `docs/ARCHITECTURE.md`: "Live typo check for one set" → `Validation/LiveSetCheck.swift` (this task may edit that one table).
- [ ] Handoff filled in.

## Handoff

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
