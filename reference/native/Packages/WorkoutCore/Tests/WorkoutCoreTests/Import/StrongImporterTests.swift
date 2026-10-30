import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Importing into the database")
struct StrongImporterTests {
    private func makeImporter() throws -> StrongImporter {
        StrongImporter(database: try AppDatabase.inMemory(), snapshotDirectory: try TestData.temporaryDirectory())
    }

    private func plan() throws -> StrongImportPlan {
        StrongImportPlan.make(
            rows: try StrongWorkoutsFile.parse(StrongFixtures.olderLayout, timeZone: StrongFixtures.utc),
            measurements: try StrongMeasurementsFile.parse(StrongFixtures.waist, timeZone: StrongFixtures.utc)
        )
    }

    @Test("Everything in the plan is stored")
    func importsEverything() throws {
        let importer = try makeImporter()
        let result = try importer.importPlan(try plan())
        #expect(result == .init(workoutsAdded: 2, workoutsSkipped: 0, setsAdded: 6, exercisesCreated: 2, measurementsAdded: 2))

        try importer.database.writer.read { db in
            #expect(try WorkoutSet.fetchCount(db) == 6)
            let curl = try #require(try Exercise.filter(Column("name") == "Seated Leg Curl (Machine)").fetchOne(db))
            #expect(curl.defaultEntryUnit == .pounds)
            #expect(curl.source == .strong)
        }
    }

    @Test("Importing the same file twice adds nothing")
    func idempotent() throws {
        let importer = try makeImporter()
        _ = try importer.importPlan(try plan())
        let second = try importer.importPlan(try plan())
        #expect(second == .init(workoutsAdded: 0, workoutsSkipped: 2, setsAdded: 0, exercisesCreated: 0, measurementsAdded: 0))
        #expect(try importer.database.writer.read(Workout.fetchCount) == 2)
    }

    @Test("Existing exercises are reused, matched case-insensitively")
    func reusesExercises() throws {
        let importer = try makeImporter()
        try importer.database.writer.write { db in
            var bench = Exercise(name: "bench press (barbell)", source: .custom)
            try bench.insert(db)
        }
        let result = try importer.importPlan(try plan())
        #expect(result.exercisesCreated == 1)
    }

    @Test("A snapshot is taken before importing")
    func snapshotsFirst() throws {
        let importer = try makeImporter()
        _ = try importer.importPlan(try plan())
        let files = try FileManager.default.contentsOfDirectory(atPath: importer.snapshotDirectory.path)
        #expect(files.count == 1)
    }
}
