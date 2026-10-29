import Foundation
import Observation
import WorkoutCore

/// Runs every logging write one at a time, in the order the owner tapped, off the main thread.
///
/// `WorkoutLogger` calls block while SQLite writes, so they never run on the main actor. Running
/// them in parallel would let "save the weight" and "complete the set" arrive out of order, so each
/// action waits for the one before it. Failures are logged and kept in ``errorMessage`` for the
/// screen to show; the screen itself only ever changes through the database observation, so a failed
/// write leaves it showing what is really saved.
@MainActor
@Observable
final class LoggingActionQueue {
    /// The latest failure, in words the owner can read. `nil` when there is none to show.
    private(set) var errorMessage: String?

    let logger: WorkoutLogger
    @ObservationIgnored private var tail: Task<Void, Never>?

    init(logger: WorkoutLogger) {
        self.logger = logger
    }

    /// Queues `work` to run after every earlier action has finished.
    ///
    /// - Returns: A task whose value is the result of `work`, or `nil` if it threw (the failure is
    ///   then already in ``errorMessage``). Ignore it when only the side effect matters.
    @discardableResult
    func enqueue<Result: Sendable>(_ work: @escaping @Sendable (WorkoutLogger) throws -> Result) -> Task<Result?, Never> {
        errorMessage = nil
        let previous = tail
        let task = Task<Result?, Never> { [logger] in
            await previous?.value
            do {
                return try await Task.detached(priority: .userInitiated) { try work(logger) }.value
            } catch {
                self.report(error)
                return nil
            }
        }
        tail = Task { _ = await task.value }
        return task
    }

    /// Shows `error` in the banner and writes it to the log.
    func report(_ error: any Error) {
        Log.ui.error("Logging action failed: \(error.localizedDescription, privacy: .public)")
        errorMessage = error.localizedDescription
    }

    /// Hides the banner.
    func dismissError() {
        errorMessage = nil
    }
}
