import Testing
@testable import WorkoutCore

@Suite("Per-exercise export unit")
struct ExportUnitResolverTests {
    @Test("Round kg converted to lb marks a pounds column")
    func detectsPoundColumn() {
        let verdict = ExportUnitResolver.resolve(values: [99.21, 63.93, 140, 160])
        #expect(verdict.columnUnit == .pounds)
        #expect(verdict.poundVotes == 2)
        #expect(verdict.kilogramVotes == 0)
    }

    @Test("Whole pounds converted to kg mark a kilograms column")
    func detectsKilogramColumnWithPoundEntries() {
        let verdict = ExportUnitResolver.resolve(values: [61.23, 49.9, 100, 102.5])
        #expect(verdict.columnUnit == .kilograms)
        #expect(verdict.kilogramVotes == 2)
    }

    @Test("Only round values gives no evidence and defaults to kg")
    func defaultsToKilograms() {
        let verdict = ExportUnitResolver.resolve(values: [100, 102.5, 0])
        #expect(verdict == .init(columnUnit: .kilograms, kilogramVotes: 0, poundVotes: 0))
    }
}
