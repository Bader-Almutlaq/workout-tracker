import Foundation
import Observation
import WorkoutCore

/// State behind one exercise's detail screen: the live detail, its summary lines and the
/// archive, duplicate and edit actions.
@MainActor
@Observable
final class ExerciseDetailModel {
    /// The exercise as last read from the database. `nil` while loading, or if it was deleted.
    private(set) var detail: ExerciseCatalog.Detail?
    /// Set when watching the database or archiving failed.
    private(set) var errorMessage: String?
    /// True once the first read has finished, so "not found" isn't shown while loading.
    private(set) var hasLoaded = false

    private let exerciseID: Int64
    private let database: AppDatabase
    private let library: ExerciseLibrary
    private let editor: ExerciseEditor

    init(exerciseID: Int64, database: AppDatabase, library: ExerciseLibrary, editor: ExerciseEditor) {
        self.exerciseID = exerciseID
        self.database = database
        self.library = library
        self.editor = editor
    }

    /// Watches the exercise until the calling task is cancelled (use from `.task`).
    func observe() async {
        do {
            for try await detail in ExerciseCatalog.observeDetail(exerciseID: exerciseID, in: database, library: library) {
                self.detail = detail
                hasLoaded = true
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            Log.ui.error("Exercise \(self.exerciseID) observation failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
        }
    }

    // MARK: Summary lines

    /// True for built-in exercises, which can be duplicated but not edited.
    var isLibraryExercise: Bool { detail?.exercise.libraryKey != nil }

    /// True when the exercise is hidden from search and pickers.
    var isArchived: Bool { detail?.exercise.isArchived ?? false }

    /// "Barbell · Hinge · Compound · Long-length bias": whatever of these the exercise has.
    var characteristicsLine: String {
        guard let exercise = detail?.exercise else { return "" }
        var parts: [String] = []
        if let equipment = exercise.equipment { parts.append(equipment.displayName) }
        if let pattern = exercise.movementPattern { parts.append(pattern.displayName) }
        if let mechanic = exercise.mechanic { parts.append(mechanic.displayName) }
        if exercise.isLengthenedBiased { parts.append("Long-length bias") }
        return parts.joined(separator: " · ")
    }

    /// "236 sessions · 1,402 sets", or `nil` if the exercise was never logged.
    var usageLine: String? {
        guard let detail, detail.workoutCount > 0 else { return nil }
        let sessions = detail.workoutCount == 1 ? "1 session" : "\(detail.workoutCount.formatted()) sessions"
        let sets = detail.setCount == 1 ? "1 set" : "\(detail.setCount.formatted()) sets"
        return "\(sessions) · \(sets)"
    }

    /// "First: 3 Jan 2022", or `nil` if never logged.
    var firstUsedLine: String? { detail?.firstUsedAt.map { "First: \(Self.dateText($0))" } }

    /// "Last: 2 Oct 2026", or `nil` if never logged.
    var lastUsedLine: String? { detail?.lastUsedAt.map { "Last: \(Self.dateText($0))" } }

    /// The date of one past session, e.g. "2 Oct 2026".
    static func dateText(_ date: Date) -> String {
        date.formatted(.dateTime.day().month(.abbreviated).year())
    }

    /// The heaviest set of a session as "135 lb × 8", in the unit it was typed in.
    /// Bodyweight sets read "Bodyweight × 8", like the workout screen; warm-up-only sessions read "Warm-ups only".
    static func topSetText(_ session: ExerciseCatalog.Detail.Session) -> String {
        guard let set = session.topSet else { return "Warm-ups only" }
        let load = set.weightKilograms > 0 ? set.weight.formatted(in: set.entryUnit) : "Bodyweight"
        return "\(load) × \(set.reps)"
    }

    /// "4 sets" for the work-set count of a session.
    static func workSetsText(_ session: ExerciseCatalog.Detail.Session) -> String {
        session.workSetCount == 1 ? "1 set" : "\(session.workSetCount) sets"
    }

    // MARK: Actions

    /// Hides the exercise from search and pickers, or brings it back. History is kept either way.
    func toggleArchived() {
        guard let exercise = detail?.exercise else { return }
        do {
            try editor.setArchived(!exercise.isArchived, exerciseID: exerciseID)
            errorMessage = nil
        } catch {
            Log.ui.error("Archiving exercise \(self.exerciseID) failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
        }
    }

    /// A sheet that saves a copy of this exercise as the owner's own, named "<name> (Copy)".
    func makeDuplicateModel() -> CustomExerciseModel? {
        guard let detail else { return nil }
        var draft = makeDraft(from: detail)
        draft.name += " (Copy)"
        return CustomExerciseModel(editor: editor, mode: .create, draft: draft)
    }

    /// A sheet that edits this exercise. Built-in exercises can't be edited, so this is `nil` for them.
    func makeEditModel() -> CustomExerciseModel? {
        guard let detail, !isLibraryExercise, let id = detail.exercise.id else { return nil }
        return CustomExerciseModel(editor: editor, mode: .edit(exerciseID: id), draft: makeDraft(from: detail))
    }

    private func makeDraft(from detail: ExerciseCatalog.Detail) -> CustomExerciseDraft {
        let exercise = detail.exercise
        return CustomExerciseDraft(
            name: exercise.name,
            equipment: exercise.equipment,
            pattern: exercise.movementPattern,
            mechanic: exercise.mechanic,
            primaryMuscles: detail.primaryMuscles,
            secondaryMuscles: detail.secondaryMuscles,
            isLengthenedBiased: exercise.isLengthenedBiased,
            tracking: exercise.tracking
        )
    }
}
