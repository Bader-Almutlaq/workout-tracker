import Foundation

/// Why an exercise could not be created, edited or merged.
public enum ExerciseEditError: Error, LocalizedError, Equatable {
    case emptyName
    case nameInUse(String)
    case noPrimaryMuscle
    case notFound
    /// Library exercises are edited by changing `library.json`; the owner duplicates them instead.
    case libraryExerciseIsReadOnly
    case mergeIntoItself

    public var errorDescription: String? {
        switch self {
        case .emptyName: "Give the exercise a name."
        case .nameInUse(let name): "An exercise called “\(name)” already exists."
        case .noPrimaryMuscle: "Pick at least one primary muscle."
        case .notFound: "That exercise no longer exists."
        case .libraryExerciseIsReadOnly: "Built-in exercises can’t be edited. Duplicate it to make your own version."
        case .mergeIntoItself: "An exercise can’t be merged into itself."
        }
    }
}
