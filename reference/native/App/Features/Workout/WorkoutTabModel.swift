import Foundation
import Observation
import WorkoutCore

/// State behind the Workout tab: whether a workout is in progress (and its model), the list of past
/// workouts to repeat, and the sheet shown after Finish.
///
/// It lives in ``AppEnvironment`` so the half-typed cell and scroll position of a workout in progress
/// survive switching tabs.
@MainActor
@Observable
final class WorkoutTabModel {
    /// The model of the workout in progress, or `nil` when none is.
    private(set) var active: ActiveWorkoutModel?
    /// False until the database has said whether a workout is in progress, so the Start button doesn't
    /// flash up for a workout that is about to appear.
    private(set) var hasLoadedActive = false
    /// The latest finished workouts, newest first, offered under "Repeat a past workout".
    private(set) var recentWorkouts: [WorkoutHistory.Summary] = []
    /// What to show in the sheet after Finish. Set by the active workout; cleared when the sheet closes.
    var finishOutcome: FinishOutcome?

    /// Runs the writes for this tab and for the active workout, in tap order.
    let queue: LoggingActionQueue

    private let database: AppDatabase
    private let library: ExerciseLibrary

    /// How many past workouts the tab offers to repeat.
    private static let recentLimit = 6

    init(database: AppDatabase, library: ExerciseLibrary, logger: WorkoutLogger) {
        self.database = database
        self.library = library
        self.queue = LoggingActionQueue(logger: logger)
    }

    /// Watches whether a workout is in progress until the calling task is cancelled (use from `.task`).
    func observeActiveWorkout() async {
        do {
            for try await workoutID in LiveWorkout.observeActiveWorkoutID(in: database) {
                hasLoadedActive = true
                guard let workoutID else {
                    active = nil
                    continue
                }
                if active?.workoutID != workoutID {
                    active = ActiveWorkoutModel(
                        workoutID: workoutID, database: database, library: library, queue: queue,
                        onFinish: { [weak self] in self?.finishOutcome = $0 }
                    )
                }
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            hasLoadedActive = true
            queue.report(error)
        }
    }

    /// Watches the finished workouts until the calling task is cancelled (use from `.task`).
    func observeRecentWorkouts() async {
        do {
            for try await summaries in WorkoutHistory.observeSummaries(in: database) {
                recentWorkouts = Array(summaries.prefix(Self.recentLimit))
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            queue.report(error)
        }
    }

    /// Starts a workout named for the time of day, with no exercises.
    func startEmptyWorkout(at date: Date = .now) {
        let name = Self.workoutName(startingAt: date)
        queue.enqueue { try $0.start(name: name, at: date) }
    }

    /// Starts a workout with `past`'s name and the same exercises in the same order.
    /// Sets are pre-filled from each exercise's last session by `WorkoutLogger.addExercise`.
    func repeatWorkout(_ past: WorkoutHistory.Summary) {
        let name = past.name, pastID = past.id
        queue.enqueue { logger in
            guard let detail = try logger.database.writer.read({ try WorkoutHistory.detail(workoutID: pastID, $0) }) else {
                throw WorkoutLoggerError.workoutNotFound
            }
            let workoutID = try logger.start(name: name)
            for entry in detail.entries where !entry.exercise.isArchived {
                if let exerciseID = entry.exercise.id { try logger.addExercise(exerciseID, to: workoutID) }
            }
        }
    }

    /// "Morning", "Afternoon" or "Evening" workout, from the hour `date` falls in.
    static func workoutName(startingAt date: Date, calendar: Calendar = .current) -> String {
        let hour = calendar.component(.hour, from: date)
        switch hour {
        case ..<DayPart.afternoonStartHour: return "Morning workout"
        case ..<DayPart.eveningStartHour: return "Afternoon workout"
        default: return "Evening workout"
        }
    }

    /// Where the day is split for naming a workout.
    ///
    /// Heuristic: the everyday meaning of the words (afternoon from noon, evening from 5 pm); no
    /// source applies, and the owner can rename the workout.
    enum DayPart {
        /// The hour (24-hour clock) at which "Afternoon" begins.
        static let afternoonStartHour = 12
        /// The hour (24-hour clock) at which "Evening" begins.
        static let eveningStartHour = 17
    }
}
