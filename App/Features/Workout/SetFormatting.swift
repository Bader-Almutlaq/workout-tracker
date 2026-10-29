import Foundation
import WorkoutCore

extension SetKind {
    /// Name shown in the set-kind menu.
    var displayName: String {
        switch self {
        case .working: "Working set"
        case .warmup: "Warm-up"
        case .drop: "Drop set"
        case .failure: "Failure"
        }
    }

    /// The letter shown instead of a set number: "W", "D" or "F". `nil` for working sets, which are numbered.
    var letter: String? {
        switch self {
        case .working: nil
        case .warmup: "W"
        case .drop: "D"
        case .failure: "F"
        }
    }
}

extension ExerciseTracking {
    /// Whether a set of this exercise has a weight cell. Timed holds without load do not.
    var recordsWeight: Bool { self != .duration }

    /// Whether the second cell holds seconds (shown as m:ss) rather than a rep count.
    var recordsDuration: Bool { self == .duration || self == .weightAndDuration }

    /// Whether the weight is load added to the lifter's own bodyweight, so 0 reads as "BW".
    var isBodyweightLoad: Bool { self == .bodyweightReps }
}

/// Text for the cells of a set row. Weights go through ``Weight`` so kg and lb are never converted by hand.
extension WorkoutSet {
    /// The weight cell: the number in the set's own unit, or "BW" for unloaded bodyweight sets.
    func weightText(tracking: ExerciseTracking) -> String {
        if tracking.isBodyweightLoad, weightKilograms == 0 { return "BW" }
        return weight.number(in: entryUnit)
    }

    /// The reps cell: a rep count, or m:ss for timed exercises.
    func repsText(tracking: ExerciseTracking) -> String {
        tracking.recordsDuration ? (durationSeconds ?? 0).clockText : String(reps)
    }

    /// The RPE cell: "8" or "8.5", or "—" when not logged.
    var rpeText: String {
        rpe.map { $0.formatted(.number.precision(.fractionLength(0...1))) } ?? "—"
    }

    /// What this set was last time, for the PREVIOUS column, in `unit`: "135 lb × 8", "BW × 12" or "1:30".
    func previousText(tracking: ExerciseTracking, in unit: WeightUnit) -> String {
        let load: String
        if tracking.isBodyweightLoad {
            load = weightKilograms == 0 ? "BW" : "+" + weight.formatted(in: unit)
        } else {
            load = weight.formatted(in: unit)
        }
        switch tracking {
        case .weightAndReps, .bodyweightReps: return "\(load) × \(reps)"
        case .duration: return (durationSeconds ?? 0).clockText
        case .weightAndDuration: return "\(load) × \((durationSeconds ?? 0).clockText)"
        }
    }
}
