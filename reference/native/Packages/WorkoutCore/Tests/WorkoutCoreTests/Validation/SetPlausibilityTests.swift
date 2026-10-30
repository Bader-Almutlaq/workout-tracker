import Foundation
import Testing
@testable import WorkoutCore

@Suite("Typo detection")
struct SetPlausibilityTests {
    /// Weekly sessions of one exercise; `weights[i]` is session i's only working set.
    private func history(_ weights: [Double], reps: [Int]? = nil, kind: SetKind = .working) -> [SetPlausibility.Observation] {
        weights.enumerated().map { index, weight in
            SetPlausibility.Observation(
                id: index, exerciseKey: "Squat", sessionKey: "s\(index)",
                date: Date(timeIntervalSince1970: Double(index) * 7 * 86_400),
                kind: kind, weightKilograms: weight, reps: reps?[index] ?? 5
            )
        }
    }

    @Test("An extra zero is flagged and the decimal shift is suggested")
    func extraZero() throws {
        let findings = SetPlausibility.findings(in: history([100, 100, 100, 100, 1000, 100, 100, 100]))
        let finding = try #require(findings.first)
        #expect(findings.count == 1)
        #expect(finding.id == 4)
        #expect(finding.issue == .weightTooHigh)
        #expect(finding.suggestion == 100)
    }

    @Test("A missed digit is flagged as too low")
    func missedDigit() {
        let findings = SetPlausibility.findings(in: history([70, 70, 72.5, 7, 72.5, 75, 75]))
        #expect(findings.map(\.id) == [3])
        #expect(findings.first?.issue == .weightTooLow)
    }

    @Test("A sustained jump in strength is not flagged")
    func realProgressIsNotFlagged() {
        #expect(SetPlausibility.findings(in: history([60, 60, 60, 100, 100, 100, 100])).isEmpty)
    }

    @Test("Absurd reps are flagged and divided by ten when that fits")
    func absurdReps() {
        let findings = SetPlausibility.findings(in: history(Array(repeating: 50, count: 7), reps: [9, 9, 8, 81, 9, 9, 9]))
        #expect(findings.map(\.issue) == [.repsTooHigh])
        #expect(findings.first?.suggestion == 8)
    }

    @Test("Zero reps are always flagged; warm-ups never are")
    func zeroRepsAndWarmups() {
        #expect(SetPlausibility.findings(in: history([100], reps: [0])).map(\.issue) == [.zeroReps])
        #expect(SetPlausibility.findings(in: history([100, 100, 100, 5, 100, 100], kind: .warmup)).isEmpty)
    }

    @Test("Too little history to judge: nothing flagged")
    func needsHistory() {
        #expect(SetPlausibility.findings(in: history([100, 1000, 100])).isEmpty)
    }

    @Test("A number typed in the wrong unit suggests the conversion")
    func wrongUnit() {
        // "30" meant as kg but saved as 30 lb (13.61 kg), in a ~35 kg exercise.
        let findings = SetPlausibility.findings(in: history([35, 35, 35, 13.607771, 35, 35, 35]))
        #expect(findings.map(\.issue) == [.weightTooLow])
        #expect(abs((findings.first?.suggestion ?? 0) - 30) < 0.01)
    }
}
