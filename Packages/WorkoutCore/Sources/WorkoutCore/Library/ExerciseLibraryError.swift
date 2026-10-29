import Foundation

/// Problems with the bundled library file. These are programmer errors caught
/// by `ExerciseLibraryTests`; at runtime they are logged and surfaced, never ignored.
public enum ExerciseLibraryError: Error, LocalizedError, Equatable {
    case resourceMissing
    case duplicateName(String)
    case noPrimaryMuscle(String)
    case muscleListedTwice(exercise: String, muscle: Muscle)

    public var errorDescription: String? {
        switch self {
        case .resourceMissing: "The built-in exercise library is missing from the app."
        case .duplicateName(let name): "The exercise library lists “\(name)” twice."
        case .noPrimaryMuscle(let name): "“\(name)” in the exercise library has no primary muscle."
        case .muscleListedTwice(let exercise, let muscle):
            "“\(exercise)” lists \(muscle.displayName) as both primary and secondary."
        }
    }
}
