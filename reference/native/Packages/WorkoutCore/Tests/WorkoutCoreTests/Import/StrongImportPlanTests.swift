import Foundation
import Testing
@testable import WorkoutCore

@Suite("Import plan")
struct StrongImportPlanTests {
    private func plan(_ text: String = StrongFixtures.olderLayout, options: StrongImportOptions = .init()) throws -> StrongImportPlan {
        StrongImportPlan.make(rows: try StrongWorkoutsFile.parse(text, timeZone: StrongFixtures.utc), options: options)
    }

    @Test("Rows group into workouts and exercise entries in file order")
    func grouping() throws {
        let plan = try plan()
        #expect(plan.workouts.map(\.name) == ["Push, heavy", "Legs"])
        #expect(plan.workouts[0].exercises.map(\.name) == ["Bench Press (Barbell)", "Seated Leg Curl (Machine)"])
        #expect(plan.workouts[0].exercises.map(\.position) == [0, 1])
        #expect(plan.workouts[0].sourceKey == "strong:2024-01-01 10:00:00")
        #expect(plan.workouts[0].notes == "Felt good")
        #expect(plan.workouts[0].endedAt == plan.workouts[0].startedAt.addingTimeInterval(67 * 60))
    }

    @Test("Set orders map to kinds and positions count within the entry")
    func setKinds() throws {
        let bench = try plan().workouts[0].exercises[0].sets
        #expect(bench.map(\.kind) == [.warmup, .working, .failure])
        #expect(bench.map(\.position) == [0, 1, 2])
    }

    @Test("A kg column keeps its values; lb-typed sets are marked as lb")
    func kilogramColumn() throws {
        let bench = try plan().workouts[0].exercises[0].sets
        #expect(bench[1].weightKilograms == 61.23)
        #expect(bench[1].entryUnit == .pounds)
        #expect(bench[2].entryUnit == .kilograms)
    }

    @Test("A lb column is converted to kg; kg-typed and lb-typed sets are told apart")
    func poundColumn() throws {
        let plan = try plan()
        #expect(plan.exercises.first { $0.name == "Seated Leg Curl (Machine)" }?.columnUnit == .pounds)
        let first = plan.workouts[0].exercises[1].sets[0]
        #expect(abs(first.weightKilograms - 45) < 0.01)
        #expect(first.entryUnit == .kilograms)
        let typedInPounds = plan.workouts[1].exercises[0].sets[0]
        #expect(abs(typedInPounds.weightKilograms - 140 * 0.45359237) < 1e-9)
        #expect(typedInPounds.entryUnit == .pounds)
    }

    @Test("An owner override changes the column unit")
    func unitOverride() throws {
        let plan = try plan(options: .init(unitOverrides: ["Seated Leg Curl (Machine)": .kilograms]))
        #expect(plan.workouts[0].exercises[1].sets[0].weightKilograms == 99.21)
        #expect(plan.exercises.first { $0.name == "Seated Leg Curl (Machine)" }?.isOverridden == true)
    }

    @Test("Totals: sets, work sets and volume exclude warm-ups")
    func totals() throws {
        let totals = try plan().totals
        #expect(totals.workouts == 2)
        #expect(totals.sets == 6)
        #expect(totals.workSets == 5)
        let pound = 0.45359237
        let bench: Double = 61.23 * 8 + 60 * 6
        let curlPounds: Double = 99.21 * 12 + 140 * 10 + 63.93 * 15
        let expected = bench + curlPounds * pound
        #expect(abs(totals.volumeKilograms - expected) < 1e-6)
    }

    @Test("Newer layout: notes attach to the exercise; rest timers are skipped")
    func newerLayout() throws {
        let plan = try plan(StrongFixtures.newerLayout)
        let pulldown = plan.workouts[0].exercises[0]
        #expect(pulldown.sets.count == 2)
        #expect(pulldown.notes == "Use the wide bar")
        #expect(plan.totals.skippedRestTimerRows == 1)
    }

    @Test("A typo is flagged; correcting or confirming it removes the flag")
    func reviewDecisions() throws {
        let text = StrongFixtures.squatHistoryWithTypo()
        let flagged = try plan(text)
        let finding = try #require(flagged.findings.first)
        #expect(flagged.findings.count == 1)
        #expect(finding.suggestion == 100)

        let corrected = try plan(text, options: .init(corrections: [finding.id: .init(weightKilograms: 100)]))
        #expect(corrected.findings.isEmpty)
        let set = corrected.workouts.flatMap(\.exercises).flatMap(\.sets).first { $0.line == finding.id }
        #expect(set?.weightKilograms == 100)
        #expect(set?.isCorrected == true)

        #expect(try plan(text, options: .init(confirmedLines: [finding.id])).findings.isEmpty)
    }
}
