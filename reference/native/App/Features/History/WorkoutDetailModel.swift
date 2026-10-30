import Foundation
import Observation
import WorkoutCore

/// Loads one workout for the detail screen.
@MainActor
@Observable
final class WorkoutDetailModel {
    private(set) var detail: WorkoutHistory.Detail?
    private(set) var errorMessage: String?

    private let database: AppDatabase
    private let workoutID: Int64

    init(database: AppDatabase, workoutID: Int64) {
        self.database = database
        self.workoutID = workoutID
    }

    func load() async {
        let database = database, workoutID = workoutID
        do {
            detail = try await database.writer.read { try WorkoutHistory.detail(workoutID: workoutID, $0) }
        } catch {
            Log.ui.error("Loading workout \(workoutID) failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
        }
    }
}
