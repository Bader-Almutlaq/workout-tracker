import Foundation
import Observation
import WorkoutCore

/// State behind the Exercises tab: the live list of exercises, the search text and the filters.
///
/// Searching and ranking are done by ``ExerciseSearch`` in WorkoutCore; this model only holds the
/// inputs and arranges the output for the screen (recent, alphabetical sections, row text).
@MainActor
@Observable
final class ExercisesModel {
    /// Exercises whose names start with one letter (or "#" for anything else), for the ALL list.
    struct LetterSection: Identifiable {
        var letter: String
        var entries: [ExerciseSearch.Entry]
        var id: String { letter }
    }

    /// What the owner typed in the search field.
    var query = ""
    /// The muscle, equipment and "Mine" filters.
    var filter = ExerciseSearch.Filter()

    /// The most recently used exercises, newest first. Empty until something has been logged.
    private(set) var recent: [ExerciseSearch.Entry] = []
    /// Every non-archived exercise, alphabetical, grouped by first letter.
    private(set) var sections: [LetterSection] = []
    /// How many exercises exist (non-archived).
    private(set) var exerciseCount = 0
    /// Set when watching the database failed; the screen shows it instead of the list.
    private(set) var errorMessage: String?

    let database: AppDatabase
    let library: ExerciseLibrary
    let editor: ExerciseEditor

    private var search = ExerciseSearch(entries: [])

    /// How many exercises the "Recent" section lists.
    private static let recentLimit = 8
    /// Granularity of the count in the search prompt ("Search 420 exercises").
    private static let promptRounding = 10
    /// Section title for names that don't start with a letter.
    private static let otherLetter = "#"

    init(database: AppDatabase, library: ExerciseLibrary, editor: ExerciseEditor) {
        self.database = database
        self.library = library
        self.editor = editor
    }

    /// Watches the database until the calling task is cancelled (use from `.task`).
    /// The search index is rebuilt whenever exercises, aliases or logged workouts change.
    func observe() async {
        do {
            for try await entries in ExerciseCatalog.observeEntries(in: database, library: library) {
                apply(entries)
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            Log.ui.error("Exercise list observation failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
        }
    }

    /// True when there is no search text and no filter, so the screen shows Recent and All.
    var isBrowsing: Bool {
        query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && filter == ExerciseSearch.Filter()
    }

    /// Matches for the current query and filters, best first.
    var results: [ExerciseSearch.Entry] {
        search.results(for: query, filter: filter)
    }

    /// Prompt for the search field, with the count rounded down so it doesn't flicker as exercises are added.
    var searchPrompt: String {
        let rounded = exerciseCount / Self.promptRounding * Self.promptRounding
        return rounded > 0 ? "Search \(rounded) exercises" : "Search exercises"
    }

    /// Second line of a row: the primary muscles, then how many sessions the exercise has been used in.
    func subtitle(for entry: ExerciseSearch.Entry) -> String {
        var parts = entry.primaryMuscles.map(\.displayName)
        if entry.usageCount > 0 { parts.append("\(entry.usageCount)×") }
        return parts.joined(separator: " · ")
    }

    /// A model for the "new exercise" sheet. Pass `name` to pre-fill it, e.g. from a search with no match.
    func makeNewExerciseModel(name: String = "") -> CustomExerciseModel {
        CustomExerciseModel(editor: editor, mode: .create, draft: CustomExerciseDraft(name: name))
    }

    /// A model for one exercise's detail screen.
    func makeDetailModel(exerciseID: Int64) -> ExerciseDetailModel {
        ExerciseDetailModel(exerciseID: exerciseID, database: database, library: library, editor: editor)
    }

    private func apply(_ entries: [ExerciseSearch.Entry]) {
        search = ExerciseSearch(entries: entries)
        exerciseCount = entries.count
        recent = entries
            .filter { $0.lastUsedAt != nil }
            .sorted { ($0.lastUsedAt ?? .distantPast) > ($1.lastUsedAt ?? .distantPast) }
            .prefix(Self.recentLimit)
            .map { $0 }
        sections = Self.alphabeticalSections(entries)
    }

    private static func alphabeticalSections(_ entries: [ExerciseSearch.Entry]) -> [LetterSection] {
        let sorted = entries.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        let grouped = Dictionary(grouping: sorted) { entry in
            // Fold accents so "Élévation" files under E, and treat digits and symbols as one group.
            let first = entry.name.first.map { String($0).folding(options: .diacriticInsensitive, locale: .current).uppercased() }
            return first.flatMap { $0.first?.isLetter == true ? $0 : nil } ?? otherLetter
        }
        return grouped
            .map { LetterSection(letter: $0.key, entries: $0.value) }
            .sorted { lhs, rhs in
                if lhs.letter == otherLetter { return false }
                if rhs.letter == otherLetter { return true }
                return lhs.letter < rhs.letter
            }
    }
}
