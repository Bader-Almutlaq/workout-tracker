import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Seeding the library into the database")
struct ExerciseLibrarySeederTests {
    private func library(version: Int = 1, primary: String = "chest") throws -> ExerciseLibrary {
        let json = """
            {"version": \(version), "families": [
              {"movement": "Bench Press", "pattern": "horizontal-push", "mechanic": "compound",
               "primary": ["\(primary)"], "secondary": ["triceps"], "variants": ["barbell", "dumbbell"]}
            ]}
            """
        return try ExerciseLibrary(json: Data(json.utf8))
    }

    @Test("First run inserts every exercise and its muscles")
    func firstRun() throws {
        let database = try AppDatabase.inMemory()
        let result = try ExerciseLibrarySeeder.seed(try library(), into: database)
        #expect(result == .init(inserted: 2, linked: 0, updated: 0, skipped: false))
        try database.writer.read { db in
            #expect(try Exercise.fetchCount(db) == 2)
            #expect(try ExerciseMuscle.fetchCount(db) == 4)
            let bench = try #require(try Exercise.filter(Column("libraryKey") == "bench-press-barbell").fetchOne(db))
            #expect(bench.source == .library)
            #expect(bench.equipment == .barbell)
        }
    }

    @Test("The same version is not seeded twice")
    func skipsSameVersion() throws {
        let database = try AppDatabase.inMemory()
        try ExerciseLibrarySeeder.seed(try library(), into: database)
        #expect(try ExerciseLibrarySeeder.seed(try library(), into: database).skipped)
    }

    @Test("A new version rewrites library fields but keeps the owner's entry unit and archive flag")
    func updateKeepsOwnerFields() throws {
        let database = try AppDatabase.inMemory()
        try ExerciseLibrarySeeder.seed(try library(), into: database)
        try database.writer.write { db in
            try db.execute(sql: "UPDATE exercise SET defaultEntryUnit = 'lb', isArchived = 1 WHERE libraryKey = 'bench-press-barbell'")
        }
        let result = try ExerciseLibrarySeeder.seed(try library(version: 2, primary: "front-delt"), into: database)
        #expect(result.updated == 2)
        try database.writer.read { db in
            let bench = try #require(try Exercise.filter(Column("libraryKey") == "bench-press-barbell").fetchOne(db))
            #expect(bench.defaultEntryUnit == .pounds)
            #expect(bench.isArchived)
            let primary = try String.fetchAll(db, sql: "SELECT muscleId FROM exerciseMuscle WHERE exerciseId = ? AND role = 'primary'", arguments: [bench.id])
            #expect(primary == ["front-delt"])
        }
    }

    @Test("An imported Strong exercise with the same name is linked, keeping its history")
    func linksSameName() throws {
        let database = try AppDatabase.inMemory()
        try database.writer.write { db in
            try db.execute(sql: """
                INSERT INTO exercise (id, name, source, createdAt) VALUES (7, 'bench press (barbell)', 'strong', '2026-01-01');
                INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01 10:00:00', 'Push', 'strong');
                INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (1, 7, 0);
                """)
        }
        let result = try ExerciseLibrarySeeder.seed(try library(), into: database)
        #expect(result.linked == 1)
        #expect(result.inserted == 1)
        try database.writer.read { db in
            let bench = try #require(try Exercise.fetchOne(db, key: 7))
            #expect(bench.libraryKey == "bench-press-barbell")
            #expect(bench.name == "Bench Press (Barbell)")
            #expect(bench.source == .library)
        }
    }

    @Test("Importing after seeding lands on library exercises and adopts Strong's unit")
    func importAfterSeed() throws {
        let database = try AppDatabase.inMemory()
        try ExerciseLibrarySeeder.seed(try ExerciseLibrary.bundled(), into: database)
        let before = try database.writer.read(Exercise.fetchCount)
        let importer = StrongImporter(database: database, snapshotDirectory: try TestData.temporaryDirectory())
        let plan = StrongImportPlan.make(
            rows: try StrongWorkoutsFile.parse(StrongFixtures.olderLayout, timeZone: StrongFixtures.utc), measurements: []
        )
        let result = try importer.importPlan(plan)
        #expect(result.exercisesCreated == 0)
        try database.writer.read { db in
            #expect(try Exercise.fetchCount(db) == before)
            let curl = try #require(try Exercise.filter(Column("name") == "Seated Leg Curl (Machine)").fetchOne(db))
            #expect(curl.source == .library)
            #expect(curl.defaultEntryUnit == .pounds)
        }
    }
}
