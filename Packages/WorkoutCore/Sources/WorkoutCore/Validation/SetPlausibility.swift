import Foundation

/// Finds sets whose weight or reps look like typing mistakes: a missed digit,
/// an extra zero, or a number typed in the wrong unit.
///
/// Used by the Strong import review and, later, by live logging.
///
/// Heuristic (no literature applies): a set is compared with the same
/// exercise's typical top weight and reps in nearby sessions, before *and*
/// after it. A genuine jump in strength is followed by sessions at the new
/// level, so it isn't flagged; a typo stands alone.
public enum SetPlausibility {
    /// The facts the check needs about one set.
    public struct Observation: Sendable, Equatable {
        /// Caller's identifier, returned in ``Finding/id`` (e.g. the export line number).
        public var id: Int
        /// Groups sets of the same exercise, e.g. its name.
        public var exerciseKey: String
        /// Groups sets of the same session, e.g. the workout's start time.
        public var sessionKey: String
        public var date: Date
        public var kind: SetKind
        public var weightKilograms: Double
        public var reps: Int

        public init(
            id: Int, exerciseKey: String, sessionKey: String, date: Date, kind: SetKind,
            weightKilograms: Double, reps: Int
        ) {
            self.id = id
            self.exerciseKey = exerciseKey
            self.sessionKey = sessionKey
            self.date = date
            self.kind = kind
            self.weightKilograms = weightKilograms
            self.reps = reps
        }
    }

    /// Why a set was flagged.
    public enum Issue: String, Sendable, Equatable {
        case weightTooHigh
        case weightTooLow
        case repsTooHigh
        case zeroReps
    }

    /// A suspicious set, with what's typical and a likely correction.
    public struct Finding: Sendable, Equatable, Identifiable {
        public var id: Int
        public var issue: Issue
        /// Typical value nearby: kilograms for weight issues, reps for rep issues.
        public var typical: Double
        /// A likely intended value in the same unit as `typical`, or `nil` if none fits.
        public var suggestion: Double?
    }

    /// Tuning constants. Heuristic; adjust against real flags if they prove noisy.
    public enum Threshold {
        /// Sessions on each side of a set used to judge what's typical.
        public static let neighbourSessions = 4
        /// Fewer neighbouring sessions than this: not enough history to judge.
        public static let minimumNeighbourSessions = 3
        /// A weight above this multiple of the typical top weight is flagged.
        public static let highWeightRatio = 1.6
        /// A weight below this multiple of the typical top weight is flagged.
        public static let lowWeightRatio = 0.4
        /// Reps above this multiple of typical reps (and above ``minimumSuspiciousReps``) are flagged.
        public static let highRepsRatio = 2.5
        public static let minimumSuspiciousReps = 25
        /// A correction must land within this ratio band of the typical value.
        public static let suggestionBand = 0.75...1.33
    }

    /// Checks every set against its exercise's nearby history.
    /// - Returns: Findings in the order of `observations`.
    public static func findings(in observations: [Observation]) -> [Finding] {
        let byExercise = Dictionary(grouping: observations, by: \.exerciseKey)
        var results: [Int: Finding] = [:]

        for sets in byExercise.values {
            let sessions = SessionSummary.make(from: sets)
            for (index, session) in sessions.enumerated() {
                let neighbours = neighbourhood(of: index, in: sessions)
                for set in session.sets {
                    if let finding = check(set, against: neighbours) { results[set.id] = finding }
                }
            }
        }
        return observations.compactMap { results[$0.id] }
    }

    /// Checks one set against the sessions around it.
    static func check(_ set: Observation, against neighbours: [SessionSummary]) -> Finding? {
        guard set.kind == .working || set.kind == .failure else { return nil }
        if set.reps == 0 { return Finding(id: set.id, issue: .zeroReps, typical: 0, suggestion: nil) }
        guard neighbours.count >= Threshold.minimumNeighbourSessions else { return nil }

        let typicalReps = median(neighbours.map(\.medianReps))
        if Double(set.reps) > typicalReps * Threshold.highRepsRatio, set.reps > Threshold.minimumSuspiciousReps {
            let tenth = Double(set.reps) / 10
            let suggestion = Threshold.suggestionBand.contains(tenth / typicalReps) ? tenth.rounded() : nil
            return Finding(id: set.id, issue: .repsTooHigh, typical: typicalReps, suggestion: suggestion)
        }

        let topWeights = neighbours.map(\.topWeight).filter { $0 > 0 }
        guard set.weightKilograms > 0, topWeights.count >= Threshold.minimumNeighbourSessions else { return nil }
        let typicalWeight = median(topWeights)
        let ratio = set.weightKilograms / typicalWeight
        let issue: Issue
        if ratio > Threshold.highWeightRatio { issue = .weightTooHigh }
        else if ratio < Threshold.lowWeightRatio { issue = .weightTooLow }
        else { return nil }
        return Finding(
            id: set.id, issue: issue, typical: typicalWeight,
            suggestion: weightCorrection(for: set.weightKilograms, typical: typicalWeight)
        )
    }

    /// The likeliest intended weight in kilograms: a shifted decimal (×10, ÷10)
    /// or a number typed in the wrong unit (kg↔lb), whichever lands closest to
    /// typical. Exact; round with ``Weight/displayValue(in:)`` when showing it.
    static func weightCorrection(for weight: Double, typical: Double) -> Double? {
        let poundFactor = WeightUnit.kilogramsPerPound
        let candidates = [weight / 10, weight * 10, weight * poundFactor, weight / poundFactor]
        return candidates
            .filter { Threshold.suggestionBand.contains($0 / typical) }
            .min { abs($0 - typical) < abs($1 - typical) }
    }

    /// Up to ``Threshold/neighbourSessions`` sessions on each side of `index`, excluding it.
    static func neighbourhood(of index: Int, in sessions: [SessionSummary]) -> [SessionSummary] {
        let before = sessions[max(0, index - Threshold.neighbourSessions)..<index]
        let after = sessions[(index + 1)..<min(sessions.count, index + 1 + Threshold.neighbourSessions)]
        return Array(before) + Array(after)
    }

    static func median(_ values: [Double]) -> Double {
        let sorted = values.sorted()
        guard !sorted.isEmpty else { return 0 }
        let middle = sorted.count / 2
        return sorted.count.isMultiple(of: 2) ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
    }

    /// One session of one exercise, reduced to what the check compares against.
    struct SessionSummary {
        var sets: [Observation]
        /// Heaviest working or failure set.
        var topWeight: Double
        /// Median reps of working and failure sets.
        var medianReps: Double

        /// Groups an exercise's sets into sessions, oldest first.
        static func make(from sets: [Observation]) -> [SessionSummary] {
            Dictionary(grouping: sets, by: \.sessionKey).values
                .map { sets in
                    let work = sets.filter { $0.kind == .working || $0.kind == .failure }
                    return SessionSummary(
                        sets: sets,
                        topWeight: work.map(\.weightKilograms).max() ?? 0,
                        medianReps: median(work.map { Double($0.reps) })
                    )
                }
                .sorted { ($0.sets.first?.date ?? .distantPast) < ($1.sets.first?.date ?? .distantPast) }
        }
    }
}
