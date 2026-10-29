import Foundation

/// Why a logging action could not be carried out.
public enum WorkoutLoggerError: Error, LocalizedError, Equatable {
    /// Only one workout can be in progress; finish or discard it first.
    case workoutAlreadyInProgress(workoutID: Int64)
    case workoutNotFound
    case exerciseNotFound
    case setNotFound
    case invalidReps(Int)
    case invalidWeight(Double)
    case invalidRPE(Double)

    public var errorDescription: String? {
        switch self {
        case .workoutAlreadyInProgress: "A workout is already in progress. Finish or discard it first."
        case .workoutNotFound: "That workout no longer exists."
        case .exerciseNotFound: "That exercise no longer exists."
        case .setNotFound: "That set no longer exists."
        case .invalidReps(let reps): "\(reps) isn’t a valid number of reps."
        case .invalidWeight(let kilograms): "\(kilograms) kg isn’t a valid weight."
        case .invalidRPE(let rpe): "RPE must be between 1 and 10 (got \(rpe))."
        }
    }
}
