import Foundation
import Observation
import WorkoutCore

/// Drives the "Match Strong exercises" screen: lists imported exercises that are not in the
/// library yet, suggests library exercises for each, and applies the owner's choice.
///
/// Two choices exist (see `docs/DECISIONS.md`, "Merging an exercise keeps its old name as an alias"):
/// - **Merge** the Strong exercise into a library exercise: its history moves over and the
///   Strong name becomes an alias. A safety snapshot is taken first by ``ExerciseEditor/merge(_:into:)``.
/// - **Keep as my own**: the Strong exercise becomes a custom exercise with the muscles the owner picks.
///
/// All matching logic lives in WorkoutCore (`ExerciseSearch`, `ExerciseEditor`); this model only
/// holds screen state and forwards intent.
@MainActor
@Observable
final class StrongMatchingModel {
    /// A merge the owner has not confirmed yet.
    struct PendingMerge {
        /// The imported exercise that would disappear.
        var unmatched: ExerciseCatalog.UnmatchedImport
        /// The library exercise that would receive its history.
        var target: ExerciseSearch.Entry

        /// The confirmation question, e.g. "Move 236 sessions of “Bayesian Cable Curl” into “Bayesian Curl (Cable)”?".
        var message: String {
            let sessions = StrongMatchingModel.sessionCountText(unmatched.workoutCount)
            return "Move \(sessions) of “\(unmatched.exercise.name)” into “\(target.name)”?"
        }
    }

    /// How many library suggestions each card shows.
    static let suggestionLimit = 3

    /// Imported exercises not yet matched, most sets first. Empty once everything is matched or tagged.
    private(set) var unmatched: [ExerciseCatalog.UnmatchedImport] = []
    /// False until the first read of the database finishes, so the screen does not flash "All matched".
    private(set) var hasLoaded = false
    /// True while a merge or edit runs on a background thread; the screen disables its buttons.
    private(set) var isWorking = false
    /// Set when something fails; the screen shows it in an alert and clears it.
    var errorMessage: String?
    /// Search over library exercises only (custom and Strong exercises are not match targets).
    private(set) var librarySearch = ExerciseSearch(entries: [])

    private var suggestionsByExerciseID: [Int64: [ExerciseSearch.Entry]] = [:]
    @ObservationIgnored private var isObserving = false

    private let database: AppDatabase
    private let library: ExerciseLibrary
    private let editor: ExerciseEditor

    /// Creates the model; `library` supplies the built-in aliases that improve suggestions.
    init(database: AppDatabase, library: ExerciseLibrary, editor: ExerciseEditor) {
        self.database = database
        self.library = library
        self.editor = editor
    }

    // MARK: - Reading

    /// Up to ``suggestionLimit`` library exercises closest to the imported name, best first.
    func suggestions(for item: ExerciseCatalog.UnmatchedImport) -> [ExerciseSearch.Entry] {
        item.id.flatMap { suggestionsByExerciseID[$0] } ?? []
    }

    /// Every unmatched exercise paired with its best suggestion, for "Match all suggested".
    /// Exercises with no suggestion are left out.
    var topSuggestionMatches: [PendingMerge] {
        unmatched.compactMap { item in
            suggestions(for: item).first.map { PendingMerge(unmatched: item, target: $0) }
        }
    }

    /// "1 session" or "236 sessions".
    nonisolated static func sessionCountText(_ count: Int) -> String {
        count == 1 ? "1 session" : "\(count.formatted()) sessions"
    }

    /// "236 sessions · 1,402 sets", shown under the Strong name.
    nonisolated static func usageText(for item: ExerciseCatalog.UnmatchedImport) -> String {
        let sets = item.setCount == 1 ? "1 set" : "\(item.setCount.formatted()) sets"
        return "\(sessionCountText(item.workoutCount)) · \(sets)"
    }

    /// Watches the database until the calling task is cancelled (use from `.task`).
    /// A second call while one is running returns immediately.
    func observe() async {
        guard !isObserving else { return }
        isObserving = true
        defer { isObserving = false }
        async let imports: Void = observeUnmatchedImports()
        async let entries: Void = observeLibraryEntries()
        _ = await (imports, entries)
    }

    // MARK: - Actions

    /// Moves all history of `unmatched` onto the library exercise `entryID`.
    func merge(_ unmatched: ExerciseCatalog.UnmatchedImport, into entryID: Int64) {
        guard let sourceID = unmatched.id else { return }
        let name = unmatched.exercise.name
        perform(failureContext: "Couldn’t match “\(name)”") { editor in
            try editor.merge(sourceID, into: entryID)
        }
    }

    /// Turns `unmatched` into one of the owner's own exercises, tagged with the chosen muscles.
    /// - Parameter name: A new name, or `nil` to keep the Strong name.
    func keepAsOwn(
        _ unmatched: ExerciseCatalog.UnmatchedImport, named name: String? = nil,
        primary: [Muscle], secondary: [Muscle]
    ) {
        guard let exerciseID = unmatched.id else { return }
        let exercise = unmatched.exercise
        let draft = CustomExerciseDraft(
            name: name ?? exercise.name, equipment: exercise.equipment, pattern: exercise.movementPattern,
            mechanic: exercise.mechanic, primaryMuscles: primary, secondaryMuscles: secondary,
            isLengthenedBiased: exercise.isLengthenedBiased, tracking: exercise.tracking
        )
        perform(failureContext: "Couldn’t save “\(exercise.name)”") { editor in
            try editor.update(exerciseID, with: draft)
        }
    }

    /// Merges every unmatched exercise into its top suggestion (see ``topSuggestionMatches``).
    /// The screen asks the owner to confirm the list first. Stops at the first failure; merges
    /// already done stay done, and each one took its own snapshot.
    func acceptAllTopSuggestions() {
        let pairs = topSuggestionMatches.compactMap { match in
            match.unmatched.id.map { (source: $0, target: match.target.id) }
        }
        guard !pairs.isEmpty else { return }
        perform(failureContext: "Couldn’t match all suggestions") { editor in
            try editor.mergeAll(Dictionary(pairs.map { ($0.source, $0.target) }, uniquingKeysWith: { first, _ in first }))
        }
    }

    // MARK: - Private

    /// Runs `work` off the main thread. The screen updates through the database observation.
    private func perform(failureContext: String, _ work: @escaping @Sendable (ExerciseEditor) throws -> Void) {
        guard !isWorking else { return }
        isWorking = true
        let editor = editor
        Task {
            let result = await Task.detached { Result { try work(editor) } }.value
            isWorking = false
            if case .failure(let error) = result { report(error, context: failureContext) }
        }
    }

    private func observeUnmatchedImports() async {
        do {
            for try await items in ExerciseCatalog.observeUnmatchedImports(in: database) {
                unmatched = items
                hasLoaded = true
                refreshSuggestions()
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            report(error, context: "Reading unmatched exercises failed")
        }
    }

    private func observeLibraryEntries() async {
        do {
            for try await entries in ExerciseCatalog.observeEntries(in: database, library: library) {
                librarySearch = ExerciseSearch(entries: entries.filter { !$0.isCustom })
                refreshSuggestions()
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            report(error, context: "Reading the library failed")
        }
    }

    private func refreshSuggestions() {
        var result: [Int64: [ExerciseSearch.Entry]] = [:]
        for item in unmatched {
            guard let id = item.id else { continue }
            result[id] = librarySearch.suggestions(forName: item.exercise.name, limit: Self.suggestionLimit)
        }
        suggestionsByExerciseID = result
    }

    private func report(_ error: any Error, context: String) {
        Log.ui.error("\(context, privacy: .public): \(error.localizedDescription, privacy: .public)")
        errorMessage = "\(context). \(error.localizedDescription)"
    }
}
