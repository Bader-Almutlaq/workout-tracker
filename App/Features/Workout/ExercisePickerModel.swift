import Foundation
import Observation
import WorkoutCore

/// State behind the add-exercise sheet: the search box, the filters and what has been ticked.
///
/// Searching and ranking are done by ``ExerciseSearch``; this model only holds the inputs and the
/// ticked exercises, in the order they were picked.
@MainActor
@Observable
final class ExercisePickerModel: Identifiable {
    /// What the owner typed in the search field.
    var query = ""
    /// The muscle and equipment filters.
    var filter = ExerciseSearch.Filter()
    /// The ticked exercises, in the order they were ticked.
    private(set) var selection: [Int64] = []
    /// Set when watching the database failed; the sheet shows it instead of the list.
    private(set) var errorMessage: String?

    private let database: AppDatabase
    private let library: ExerciseLibrary
    private var search = ExerciseSearch(entries: [])

    init(database: AppDatabase, library: ExerciseLibrary) {
        self.database = database
        self.library = library
    }

    /// Watches the exercise list until the calling task is cancelled (use from `.task`).
    func observe() async {
        do {
            for try await entries in ExerciseCatalog.observeEntries(in: database, library: library) {
                search = ExerciseSearch(entries: entries)
            }
        } catch is CancellationError {
            // The sheet went away; nothing to report.
        } catch {
            Log.ui.error("Exercise picker observation failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
        }
    }

    /// Matches for the current query and filters, best first. With neither, every exercise, most used first.
    var results: [ExerciseSearch.Entry] {
        search.results(for: query, filter: filter)
    }

    /// Ticks the exercise, or unticks it if it was ticked.
    func toggle(_ exerciseID: Int64) {
        if let index = selection.firstIndex(of: exerciseID) {
            selection.remove(at: index)
        } else {
            selection.append(exerciseID)
        }
    }

    /// Whether the exercise is ticked.
    func isSelected(_ exerciseID: Int64) -> Bool {
        selection.contains(exerciseID)
    }

    /// Second line of a row: the primary muscles.
    func subtitle(for entry: ExerciseSearch.Entry) -> String {
        entry.primaryMuscles.map(\.displayName).joined(separator: " · ")
    }
}
