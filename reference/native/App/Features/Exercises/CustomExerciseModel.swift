import Foundation
import Observation
import WorkoutCore

/// State behind the create/edit exercise sheet: the draft being filled in and the save action.
///
/// Validation (empty name, duplicate name, no primary muscle) belongs to ``ExerciseEditor``; this
/// model only keeps Save disabled for the two cases the form can see, and shows the editor's
/// message when it refuses.
@MainActor
@Observable
final class CustomExerciseModel: Identifiable {
    /// Whether the sheet creates a new exercise or changes an existing one.
    enum Mode: Equatable {
        case create
        case edit(exerciseID: Int64)
    }

    /// The fields being edited.
    var draft: CustomExerciseDraft
    /// The editor's refusal or a database failure, shown under the form. `nil` when there is none.
    private(set) var errorMessage: String?

    let mode: Mode
    private let editor: ExerciseEditor

    init(editor: ExerciseEditor, mode: Mode, draft: CustomExerciseDraft) {
        self.editor = editor
        self.mode = mode
        self.draft = draft
    }

    /// Navigation title of the sheet.
    var title: String {
        switch mode {
        case .create: "New exercise"
        case .edit: "Edit exercise"
        }
    }

    /// Save needs a name and at least one primary muscle.
    var canSave: Bool {
        !draft.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !draft.primaryMuscles.isEmpty
    }

    /// Adds or removes `muscle` as a primary muscle. A primary muscle can't also be secondary,
    /// so choosing it here removes it from the secondary list.
    func togglePrimary(_ muscle: Muscle) {
        draft.primaryMuscles = Self.toggled(muscle, in: draft.primaryMuscles)
        draft.secondaryMuscles.removeAll { $0 == muscle }
    }

    /// Adds or removes `muscle` as a secondary muscle. Primary muscles are ignored.
    func toggleSecondary(_ muscle: Muscle) {
        guard !draft.primaryMuscles.contains(muscle) else { return }
        draft.secondaryMuscles = Self.toggled(muscle, in: draft.secondaryMuscles)
    }

    /// Saves the draft. Returns `true` when the sheet can close; on failure the message stays in
    /// ``errorMessage`` and the sheet stays open.
    func save() -> Bool {
        do {
            switch mode {
            case .create: try editor.create(draft)
            case .edit(let exerciseID): try editor.update(exerciseID, with: draft)
            }
            errorMessage = nil
            return true
        } catch let error as ExerciseEditError {
            Log.ui.notice("Exercise not saved: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.errorDescription
            return false
        } catch {
            Log.ui.error("Saving exercise failed: \(error.localizedDescription, privacy: .public)")
            errorMessage = error.localizedDescription
            return false
        }
    }

    /// `muscles` with `muscle` added or removed, kept head to toe like every muscle list.
    private static func toggled(_ muscle: Muscle, in muscles: [Muscle]) -> [Muscle] {
        muscles.contains(muscle) ? muscles.filter { $0 != muscle } : (muscles + [muscle]).sorted()
    }
}

// WorkoutCore gives `Muscle`, `Equipment` and `MovementPattern` a `displayName` but not these two
// (gap noted in the T-004 handoff). Move these into WorkoutCore when it adds them.
