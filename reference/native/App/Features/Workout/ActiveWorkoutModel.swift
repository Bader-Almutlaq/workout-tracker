import Foundation
import Observation
import WorkoutCore

/// State and actions behind the screen for the workout being logged.
///
/// The screen shows the database, never local guesses: every action is queued to `WorkoutLogger`
/// (see ``LoggingActionQueue``) and the new state arrives through `LiveWorkout.observe`. The only
/// local state is the cell being typed into and its ``NumberDraft``, which is saved when the owner
/// moves to another cell, taps Done, or does anything else that would leave the cell.
@MainActor
@Observable
final class ActiveWorkoutModel {
    /// The three editable cells of a set row. `reps` holds seconds for timed exercises.
    enum Field: Hashable {
        case weight, reps, rpe
    }

    /// One editable cell: a field of one set.
    struct Cell: Hashable {
        var setID: Int64
        var field: Field
    }

    /// A question the owner must answer before something destructive happens.
    enum Confirmation: Identifiable, Equatable {
        case discardWorkout
        case finish(plannedSets: Int)
        case removeExercise(entryID: Int64, name: String)

        var id: String {
            switch self {
            case .discardWorkout: "discard"
            case .finish: "finish"
            case .removeExercise(let entryID, _): "remove-\(entryID)"
            }
        }

        var title: String {
            switch self {
            case .discardWorkout: "Discard this workout?"
            case .finish: "Finish workout?"
            case .removeExercise(_, let name): "Remove \(name)?"
            }
        }

        var message: String {
            switch self {
            case .discardWorkout: "Nothing logged in it will be kept."
            case .finish(let planned): planned == 1
                ? "1 set wasn’t completed and will be discarded."
                : "\(planned) sets weren’t completed and will be discarded."
            case .removeExercise: "Its completed sets will be deleted from this workout."
            }
        }

        var confirmLabel: String {
            switch self {
            case .discardWorkout: "Discard workout"
            case .finish: "Finish"
            case .removeExercise: "Remove exercise"
            }
        }

        var isDestructive: Bool {
            if case .finish = self { return false }
            return true
        }
    }

    /// Why a typed value could not be saved, before it reached WorkoutCore.
    enum EditError: Error, LocalizedError, Equatable {
        /// RPE is rated in half steps; 7.3 is not a rating.
        case rpeNeedsHalfSteps(Double)

        var errorDescription: String? {
            switch self {
            case .rpeNeedsHalfSteps(let rpe): "RPE goes in half steps, such as 7 or 7.5 (got \(rpe.formatted()))."
            }
        }
    }

    /// The workout being logged.
    let workoutID: Int64
    /// The workout as saved, or `nil` until the first read arrives.
    private(set) var snapshot: LiveWorkout.Snapshot?
    /// Set when watching the database failed; the screen shows it instead of the workout.
    private(set) var loadError: String?
    /// The cell the number pad is typing into.
    private(set) var editing: Cell?
    /// The text typed into ``editing``.
    private(set) var draft = NumberDraft(text: "")
    /// The open question, if any.
    var confirmation: Confirmation?

    /// Runs the writes and holds the latest failure.
    let queue: LoggingActionQueue

    private let database: AppDatabase
    private let library: ExerciseLibrary
    private let onFinish: @MainActor (FinishOutcome) -> Void

    /// - Parameter onFinish: called with the result when Finish completes, so the Workout tab can show it.
    init(
        workoutID: Int64, database: AppDatabase, library: ExerciseLibrary, queue: LoggingActionQueue,
        onFinish: @escaping @MainActor (FinishOutcome) -> Void
    ) {
        self.workoutID = workoutID
        self.database = database
        self.library = library
        self.queue = queue
        self.onFinish = onFinish
    }

    /// Watches the workout until the calling task is cancelled (use from `.task`).
    func observe() async {
        do {
            for try await value in LiveWorkout.observe(workoutID: workoutID, in: database) {
                snapshot = value
                if let editing, location(ofSet: editing.setID) == nil { self.editing = nil }
            }
        } catch is CancellationError {
            // The view went away; nothing to report.
        } catch {
            Log.ui.error("Workout observation failed: \(error.localizedDescription, privacy: .public)")
            loadError = error.localizedDescription
        }
    }

    // MARK: - Reading

    /// Heading of the number pad, e.g. "WEIGHT · KG" or "SECONDS".
    var padTitle: String? {
        guard let editing, let place = location(ofSet: editing.setID) else { return nil }
        let tracking = place.entry.exercise.tracking
        switch editing.field {
        case .weight: return (tracking.isBodyweightLoad ? "Added weight" : "Weight") + " · " + place.set.entryUnit.symbol
        case .reps: return tracking.recordsDuration ? "Seconds" : "Reps"
        case .rpe: return "RPE"
        }
    }

    /// Whether the pad shows the decimal point for the cell being edited (not for reps or seconds).
    var padAllowsDecimal: Bool {
        editing?.field != .reps
    }

    /// Sets that are planned but not completed; finishing discards them.
    var plannedSetCount: Int {
        snapshot?.entries.reduce(0) { $0 + $1.sets.filter { !$0.isCompleted }.count } ?? 0
    }

    /// A model for the add-exercise sheet.
    func makePickerModel() -> ExercisePickerModel {
        ExercisePickerModel(database: database, library: library)
    }

    // MARK: - Editing cells

    /// Starts typing into a cell, saving the cell it was in before.
    func beginEditing(setID: Int64, field: Field) {
        let cell = Cell(setID: setID, field: field)
        guard cell != editing else { return }
        commitEdit()
        guard let place = location(ofSet: setID) else { return }
        editing = cell
        draft = NumberDraft(text: Self.text(of: place.set, field: field, tracking: place.entry.exercise.tracking))
    }

    /// Types one digit into the cell.
    func type(digit: Int) {
        draft.append(digit: digit)
    }

    /// Types the decimal point into the cell.
    func typeDecimalPoint() {
        draft.appendDecimalPoint()
    }

    /// Deletes the last typed character.
    func deleteBackward() {
        draft.deleteLast()
    }

    /// Moves the cell's value by one step up (`+1`) or down (`-1`).
    func step(direction: Double) {
        guard let editing, let place = location(ofSet: editing.setID) else { return }
        let unit = place.set.entryUnit
        switch editing.field {
        case .weight:
            let ceiling = Weight(kilograms: WorkoutLogger.Limits.maximumKilograms).value(in: unit)
            draft.step(by: direction * NumberPadSteps.weight(in: unit), within: 0...ceiling)
        case .reps:
            draft.step(by: direction * NumberPadSteps.reps, within: 0...Double(WorkoutLogger.Limits.maximumReps))
        case .rpe:
            draft.step(by: direction * NumberPadSteps.rpe, within: WorkoutLogger.Limits.rpeRange)
        }
    }

    /// Saves the cell and moves to the next one: weight, reps, RPE, then the next row's weight.
    /// Closes the pad after the last cell.
    func next() {
        guard let editing else { return }
        let target = cell(after: editing)
        commitEdit()
        if let target { beginEditing(setID: target.setID, field: target.field) }
    }

    /// Saves the cell and closes the number pad.
    func commitEdit() {
        guard let cell = editing, let place = location(ofSet: cell.setID) else {
            editing = nil
            return
        }
        let draft = draft
        editing = nil
        guard draft.hasChanged else { return }
        let tracking = place.entry.exercise.tracking

        switch cell.field {
        case .weight:
            let typed = draft.value ?? 0
            editSet(cell.setID) { $0.weight = Weight(typed, unit: $0.entryUnit) }
        case .reps:
            let typed = (draft.value ?? 0).rounded()
            if tracking.recordsDuration {
                editSet(cell.setID) {
                    $0.durationSeconds = typed
                    $0.reps = 0
                }
            } else {
                editSet(cell.setID) { $0.reps = Int(typed) }
            }
        case .rpe:
            guard let typed = draft.value else {
                editSet(cell.setID) { $0.rpe = nil }
                return
            }
            guard (typed * 2).rounded() == typed * 2 else {
                queue.report(EditError.rpeNeedsHalfSteps(typed))
                return
            }
            editSet(cell.setID) { $0.rpe = typed }
        }
    }

    // MARK: - Sets

    /// Marks the set done or not done. Saves any half-typed cell first.
    func toggleCompleted(setID: Int64) {
        guard let place = location(ofSet: setID) else { return }
        commitEdit()
        let isCompleted = !place.set.isCompleted
        queue.enqueue { try $0.setCompleted(setID, isCompleted) }
    }

    /// Changes a set between working, warm-up, drop and failure.
    func setKind(_ kind: SetKind, setID: Int64) {
        commitEdit()
        editSet(setID) { $0.kind = kind }
    }

    /// Appends a planned set to the exercise.
    func addSet(entryID: Int64) {
        commitEdit()
        queue.enqueue { try $0.addSet(to: entryID) }
    }

    /// Deletes a set.
    func deleteSet(setID: Int64) {
        if editing?.setID == setID { editing = nil }
        queue.enqueue { try $0.deleteSet(setID) }
    }

    // MARK: - Exercises

    /// Appends the exercises, in the given order, each pre-filled from its last session.
    func addExercises(_ exerciseIDs: [Int64]) {
        commitEdit()
        let workoutID = workoutID
        queue.enqueue { logger in
            for exerciseID in exerciseIDs { try logger.addExercise(exerciseID, to: workoutID) }
        }
    }

    /// Switches the exercise between kg and lb. Saves any half-typed cell first, in its old unit.
    func toggleUnit(entryID: Int64) {
        guard let current = snapshot?.entries.first(where: { $0.id == entryID })?.exercise.defaultEntryUnit else { return }
        commitEdit()
        queue.enqueue { try $0.setEntryUnit(current.toggled, for: entryID) }
    }

    /// Moves the exercise one place up (`-1`) or down (`+1`).
    func moveExercise(entryID: Int64, by offset: Int) {
        guard let index = snapshot?.entries.firstIndex(where: { $0.id == entryID }) else { return }
        commitEdit()
        queue.enqueue { try $0.moveExercise(entryID, to: index + offset) }
    }

    /// Removes the exercise, asking first when it has completed sets.
    func requestRemoval(of entry: LiveWorkout.Entry) {
        guard let entryID = entry.id else { return }
        if entry.sets.contains(where: \.isCompleted) {
            confirmation = .removeExercise(entryID: entryID, name: entry.exercise.name)
        } else {
            removeExercise(entryID: entryID)
        }
    }

    // MARK: - Workout

    /// Renames the workout. Blank names are ignored.
    func rename(to name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let workout = snapshot?.workout else { return }
        let workoutID = workoutID, notes = workout.notes
        queue.enqueue { try $0.update(workoutID, name: trimmed, notes: notes) }
    }

    /// Finishes the workout, asking first when planned sets would be dropped.
    func requestFinish() {
        commitEdit()
        let planned = plannedSetCount
        if planned > 0 {
            confirmation = .finish(plannedSets: planned)
        } else {
            finish()
        }
    }

    /// Carries out what the owner confirmed.
    func confirm(_ confirmation: Confirmation) {
        self.confirmation = nil
        switch confirmation {
        case .discardWorkout: discard()
        case .finish: finish()
        case .removeExercise(let entryID, _): removeExercise(entryID: entryID)
        }
    }

    // MARK: - Private

    private func removeExercise(entryID: Int64) {
        queue.enqueue { try $0.removeExercise(entryID) }
    }

    private func discard() {
        editing = nil
        let workoutID = workoutID
        queue.enqueue { try $0.discard(workoutID) }
    }

    private func finish() {
        editing = nil
        let workoutID = workoutID
        let task = queue.enqueue { logger -> FinishOutcome in
            let result = try logger.finish(workoutID)
            guard let finishedID = result.workoutID else { return .nothingLogged }
            guard let summary = try FinishSummary.load(workoutID: finishedID, from: logger.database) else {
                throw WorkoutLoggerError.workoutNotFound
            }
            return .saved(summary)
        }
        Task {
            if let outcome = await task.value { onFinish(outcome) }
        }
    }

    /// Changes one set, starting from what is saved *at the moment the write runs*.
    ///
    /// `WorkoutLogger.updateSet` replaces every field, so building it from the on-screen set could undo
    /// a change still waiting in the queue (weight typed, then reps typed before the weight's write
    /// shows up on screen). Reading inside the queued action sees every earlier write.
    private func editSet(_ setID: Int64, _ change: @escaping @Sendable (inout SetValues) -> Void) {
        let workoutID = workoutID
        queue.enqueue { logger in
            let detail = try logger.database.writer.read { try WorkoutHistory.detail(workoutID: workoutID, $0) }
            guard let stored = detail?.entries.flatMap(\.sets).first(where: { $0.id == setID }) else {
                throw WorkoutLoggerError.setNotFound
            }
            var values = SetValues(stored)
            change(&values)
            try logger.updateSet(
                setID, weight: values.weight, entryUnit: values.entryUnit, reps: values.reps, rpe: values.rpe,
                kind: values.kind, durationSeconds: values.durationSeconds
            )
        }
    }

    /// The fields `WorkoutLogger.updateSet` takes, copied from a saved set so a change can touch one.
    private struct SetValues: Sendable {
        var weight: Weight
        var entryUnit: WeightUnit
        var reps: Int
        var rpe: Double?
        var kind: SetKind
        var durationSeconds: Double?

        init(_ set: WorkoutSet) {
            weight = set.weight
            entryUnit = set.entryUnit
            reps = set.reps
            rpe = set.rpe
            kind = set.kind
            durationSeconds = set.durationSeconds
        }
    }

    private func location(ofSet setID: Int64) -> (entry: LiveWorkout.Entry, set: WorkoutSet)? {
        for entry in snapshot?.entries ?? [] {
            if let set = entry.sets.first(where: { $0.id == setID }) { return (entry, set) }
        }
        return nil
    }

    /// The cell that follows `cell` in reading order across the whole workout, or `nil` after the last.
    private func cell(after cell: Cell) -> Cell? {
        var order: [Cell] = []
        for entry in snapshot?.entries ?? [] {
            let fields: [Field] = entry.exercise.tracking.recordsWeight ? [.weight, .reps, .rpe] : [.reps, .rpe]
            for setID in entry.sets.compactMap(\.id) {
                order += fields.map { Cell(setID: setID, field: $0) }
            }
        }
        guard let index = order.firstIndex(of: cell), index + 1 < order.count else { return nil }
        return order[index + 1]
    }

    /// The text a cell starts with when the pad opens on it. Zero and unset values start empty.
    private static func text(of set: WorkoutSet, field: Field, tracking: ExerciseTracking) -> String {
        switch field {
        case .weight:
            return set.weightKilograms == 0 ? "" : NumberDraft.text(for: set.weight.displayValue(in: set.entryUnit))
        case .reps:
            let amount = tracking.recordsDuration ? (set.durationSeconds ?? 0) : Double(set.reps)
            return amount == 0 ? "" : NumberDraft.text(for: amount)
        case .rpe:
            return set.rpe.map(NumberDraft.text(for:)) ?? ""
        }
    }
}
