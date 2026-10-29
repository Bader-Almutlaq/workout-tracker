import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Exercise catalog queries")
struct ExerciseCatalogTests {
    private func seededDatabase() throws -> (AppDatabase, ExerciseLibrary) {
        let json = """
            {"version": 1, "families": [
              {"movement": "Bench Press", "pattern": "horizontal-push", "mechanic": "compound",
               "primary": ["chest"], "secondary": ["triceps"], "aliases": ["bp"], "variants": ["barbell"]}
            ]}
            """
        let library = try ExerciseLibrary(json: Data(json.utf8))
        let database = try AppDatabase.inMemory()
        try ExerciseLibrarySeeder.seed(library, into: database)
        try database.writer.write { db in
            let benchID = try #require(try ExerciseNameResolver.exerciseID(named: "Bench Press (Barbell)", db))
            try db.execute(sql: """
                INSERT INTO exercise (id, name, source, createdAt) VALUES (50, 'Cable Grip', 'strong', '2026-01-01');
                INSERT INTO exercise (id, name, source, isArchived, createdAt) VALUES (51, 'Old Thing', 'custom', 1, '2026-01-01');
                INSERT INTO exerciseAlias (alias, exerciseId) VALUES ('Flat Press', ?);
                INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01 10:00:00', 'A', 'app');
                INSERT INTO workout (id, startedAt, name, source) VALUES (2, '2026-02-01 10:00:00', 'B', 'app');
                INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, ?, 0);
                INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (2, 2, ?, 0);
                INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (3, 2, 50, 1);
                INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps) VALUES
                  (1, 0, 'warmup', 60, 'kg', 10), (1, 1, 'working', 100, 'kg', 5),
                  (2, 0, 'working', 100, 'kg', 6), (2, 1, 'working', 102.5, 'kg', 3),
                  (3, 0, 'working', 20, 'kg', 30);
                """, arguments: [benchID, benchID, benchID])
        }
        return (database, library)
    }

    @Test("Entries carry muscles, both kinds of alias, usage and last use; archived ones are hidden")
    func entries() throws {
        let (database, library) = try seededDatabase()
        let entries = try database.writer.read { db in try ExerciseCatalog.entries(library: library, db) }
        #expect(entries.map(\.name).sorted() == ["Bench Press (Barbell)", "Cable Grip"])
        let bench = try #require(entries.first { $0.name == "Bench Press (Barbell)" })
        #expect(bench.aliases == ["bp", "Flat Press"])
        #expect(bench.primaryMuscles == [.chest])
        #expect(bench.secondaryMuscles == [.triceps])
        #expect(bench.usageCount == 2)
        #expect(bench.lastUsedAt == TestData.date(2026, 2, 1, 10))
        #expect(!bench.isCustom)
        #expect(try #require(entries.first { $0.name == "Cable Grip" }).isCustom)
    }

    @Test("Detail summarises usage and lists recent sessions with their top set")
    func detail() throws {
        let (database, library) = try seededDatabase()
        let id = try #require(try database.writer.read { db in try ExerciseNameResolver.exerciseID(named: "Bench Press (Barbell)", db) })
        let detail = try #require(try database.writer.read { db in try ExerciseCatalog.detail(exerciseID: id, library: library, db) })
        #expect(detail.workoutCount == 2)
        #expect(detail.setCount == 4)
        #expect(detail.firstUsedAt == TestData.date(2026, 1, 1, 10))
        #expect(detail.recentSessions.map(\.workoutID) == [2, 1])
        #expect(detail.recentSessions[0].topSet?.weightKilograms == 102.5)
        #expect(detail.recentSessions[1].workSetCount == 1)
    }

    @Test("Unmatched imports are the Strong exercises, most sets first")
    func unmatched() throws {
        let (database, _) = try seededDatabase()
        let unmatched = try database.writer.read(ExerciseCatalog.unmatchedImports)
        #expect(unmatched.map(\.exercise.name) == ["Cable Grip"])
        #expect(unmatched[0].setCount == 1)
    }
}
