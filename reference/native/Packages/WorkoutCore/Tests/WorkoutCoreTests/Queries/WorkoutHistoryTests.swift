import Foundation
import Testing
@testable import WorkoutCore

@Suite("History queries")
struct WorkoutHistoryTests {
    private func importedDatabase() throws -> AppDatabase {
        let database = try AppDatabase.inMemory()
        let plan = StrongImportPlan.make(rows: try StrongWorkoutsFile.parse(StrongFixtures.olderLayout, timeZone: StrongFixtures.utc))
        _ = try StrongImporter(database: database, snapshotDirectory: try TestData.temporaryDirectory()).importPlan(plan)
        return database
    }

    @Test("Summaries are newest first with counts and tonnage excluding warm-ups")
    func summaries() throws {
        let summaries = try importedDatabase().writer.read(WorkoutHistory.summaries)
        #expect(summaries.map(\.name) == ["Legs", "Push, heavy"])
        let push = try #require(summaries.last)
        #expect(push.exerciseCount == 2)
        #expect(push.setCount == 4)
        #expect(abs(push.volumeKilograms - (61.23 * 8 + 60 * 6 + 99.21 * 0.45359237 * 12)) < 1e-6)
    }

    @Test("Detail returns entries and sets in logged order")
    func detail() throws {
        let database = try importedDatabase()
        let push = try #require(try database.writer.read(WorkoutHistory.summaries).last)
        let detail = try #require(try database.writer.read { try WorkoutHistory.detail(workoutID: push.id, $0) })
        #expect(detail.entries.map(\.exercise.name) == ["Bench Press (Barbell)", "Seated Leg Curl (Machine)"])
        #expect(detail.entries[0].sets.map(\.kind) == [.warmup, .working, .failure])
        #expect(try database.writer.read { try WorkoutHistory.detail(workoutID: 999, $0) } == nil)
    }
}
