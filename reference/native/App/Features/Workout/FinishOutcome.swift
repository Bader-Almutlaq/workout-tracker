import Foundation

/// How a workout ended, for the sheet shown after Finish.
enum FinishOutcome: Identifiable, Equatable {
    /// The workout was saved.
    case saved(FinishSummary)
    /// No set was completed, so the workout was deleted.
    case nothingLogged

    /// Identity for `sheet(item:)`. The workout ID is positive, so -1 can't collide.
    var id: Int64 {
        switch self {
        case .saved(let summary): summary.id
        case .nothingLogged: -1
        }
    }
}
