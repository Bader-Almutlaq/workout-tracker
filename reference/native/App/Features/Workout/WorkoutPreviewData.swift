#if DEBUG
import Foundation
import WorkoutCore

/// Fake sessions in an in-memory database for SwiftUI previews. Built through `WorkoutLogger`, so the
/// previews exercise the same code as the app. Never uses the owner's real export.
@MainActor
enum WorkoutPreviewData {
    /// A preview environment with one finished workout (bench press typed in lb, three sets) and, if asked,
    /// a workout in progress with Bench Press (Barbell) pre-filled from it plus an empty Lateral Raise (Dumbbell).
    static func environment(withActiveWorkout: Bool) -> AppEnvironment {
        let environment = AppEnvironment.preview()
        do {
            try addFinishedWorkout(to: environment)
            if withActiveWorkout { try addActiveWorkout(to: environment) }
        } catch {
            // Previews only: the in-memory database and the bundled library can't fail in practice.
            preconditionFailure("Preview data failed to load: \(error)")
        }
        return environment
    }

    /// The model of the workout in progress from ``environment(withActiveWorkout:)``.
    static func activeWorkoutModel() -> ActiveWorkoutModel {
        let environment = environment(withActiveWorkout: true)
        do {
            guard let workoutID = try environment.workoutLogger.activeWorkoutID() else {
                preconditionFailure("The preview workout was not started")
            }
            return ActiveWorkoutModel(
                workoutID: workoutID, database: environment.database, library: environment.library,
                queue: LoggingActionQueue(logger: environment.workoutLogger), onFinish: { _ in }
            )
        } catch {
            preconditionFailure("Preview data failed to load: \(error)")
        }
    }

    private static func addFinishedWorkout(to environment: AppEnvironment) throws {
        let logger = environment.workoutLogger
        let benchID = try exerciseID("Bench Press (Barbell)", in: environment)
        let workoutID = try logger.start(name: "Evening workout", at: .now.addingTimeInterval(-3 * 24 * 60 * 60))
        let entryID = try logger.addExercise(benchID, to: workoutID)
        try logger.setEntryUnit(.pounds, for: entryID)
        try logger.addSet(to: entryID)
        try logger.addSet(to: entryID)
        let detail = try environment.database.writer.read { try WorkoutHistory.detail(workoutID: workoutID, $0) }
        for (index, set) in (detail?.entries.first?.sets ?? []).enumerated() {
            guard let setID = set.id else { continue }
            try logger.updateSet(
                setID, weight: Weight(135, unit: .pounds), entryUnit: .pounds, reps: 8 - index, rpe: 8, kind: .working
            )
            try logger.setCompleted(setID, true)
        }
        try logger.finish(workoutID)
    }

    private static func addActiveWorkout(to environment: AppEnvironment) throws {
        let logger = environment.workoutLogger
        let workoutID = try logger.start(name: "Afternoon workout", at: .now.addingTimeInterval(-25 * 60))
        try logger.addExercise(try exerciseID("Bench Press (Barbell)", in: environment), to: workoutID)
        try logger.addExercise(try exerciseID("Lateral Raise (Dumbbell)", in: environment), to: workoutID)
        let detail = try environment.database.writer.read { try WorkoutHistory.detail(workoutID: workoutID, $0) }
        if let firstSetID = detail?.entries.first?.sets.first?.id {
            try logger.setCompleted(firstSetID, true)
        }
    }

    private static func exerciseID(_ name: String, in environment: AppEnvironment) throws -> Int64 {
        let id = try environment.database.writer.read { try ExerciseNameResolver.exerciseID(named: name, $0) }
        guard let id else { preconditionFailure("The bundled library has no exercise named \(name)") }
        return id
    }
}
#endif
