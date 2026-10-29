import Foundation
import Observation
import WorkoutCore

/// The workout list, kept live: it updates by itself after an import or a new workout.
@MainActor
@Observable
final class HistoryModel {
    /// Workouts of one calendar month, newest first.
    struct MonthSection: Identifiable {
        var month: Date
        var workouts: [WorkoutHistory.Summary]
        var id: Date { month }
    }

    private(set) var sections: [MonthSection] = []
    private(set) var workoutCount = 0
    private(set) var errorMessage: String?

    let database: AppDatabase

    init(database: AppDatabase) {
        self.database = database
    }

    /// Watches the database until the calling task is cancelled (use from `.task`).
    func observe() async {
        do {
            for try await summaries in WorkoutHistory.observeSummaries(in: database) {
                workoutCount = summaries.count
                sections = Self.groupByMonth(summaries)
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            Log.ui.error("History observation failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
        }
    }

    private static func groupByMonth(_ summaries: [WorkoutHistory.Summary]) -> [MonthSection] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: summaries) { summary in
            calendar.dateInterval(of: .month, for: summary.startedAt)?.start ?? summary.startedAt
        }
        return grouped
            .map { MonthSection(month: $0.key, workouts: $0.value.sorted { $0.startedAt > $1.startedAt }) }
            .sorted { $0.month > $1.month }
    }
}
