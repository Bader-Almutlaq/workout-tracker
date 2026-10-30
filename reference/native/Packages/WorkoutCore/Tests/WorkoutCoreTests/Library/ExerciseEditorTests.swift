import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Creating, editing and merging exercises")
struct ExerciseEditorTests {
    private func makeEditor() throws -> ExerciseEditor {
        ExerciseEditor(database: try AppDatabase.inMemory(), snapshotDirectory: try TestData.temporaryDirectory())
    }

    private let draft = CustomExerciseDraft(
        name: "  Panatta Lateral  ", equipment: .machine, primaryMuscles: [.sideDelt], secondaryMuscles: [.sideDelt, .upperTraps]
    )

    @Test("Create trims the name, stores muscles and drops secondaries that are also primary")
    func create() throws {
        let editor = try makeEditor()
        let id = try editor.create(draft)
        try editor.database.writer.read { db in
            let exercise = try #require(try Exercise.fetchOne(db, key: id))
            #expect(exercise.name == "Panatta Lateral")
            #expect(exercise.source == .custom)
            let roles = try ExerciseMuscle.filter(Column("exerciseId") == id).fetchAll(db).map { "\($0.muscleId.rawValue):\($0.role.rawValue)" }
            #expect(Set(roles) == ["side-delt:primary", "upper-traps:secondary"])
        }
    }

    @Test("Names must be unique, ignoring case, and non-empty, with a primary muscle")
    func validation() throws {
        let editor = try makeEditor()
        try editor.create(draft)
        var copy = draft
        copy.name = "panatta lateral"
        #expect(throws: ExerciseEditError.nameInUse("panatta lateral")) { try editor.create(copy) }
        #expect(throws: ExerciseEditError.emptyName) { try editor.create(CustomExerciseDraft(name: " ", primaryMuscles: [.chest])) }
        #expect(throws: ExerciseEditError.noPrimaryMuscle) { try editor.create(CustomExerciseDraft(name: "X")) }
    }

    @Test("Library exercises are read-only")
    func libraryReadOnly() throws {
        let editor = try makeEditor()
        let id = try editor.database.writer.write { db -> Int64 in
            var exercise = Exercise(name: "Squat (Barbell)", source: .library, libraryKey: "squat-barbell")
            try exercise.insert(db)
            return try #require(exercise.id)
        }
        #expect(throws: ExerciseEditError.libraryExerciseIsReadOnly) { try editor.update(id, with: draft) }
    }

    @Test("Merge moves history, keeps the old name as an alias, adopts the unit and snapshots first")
    func merge() throws {
        let editor = try makeEditor()
        try editor.database.writer.write { db in
            try db.execute(sql: """
                INSERT INTO exercise (id, name, source, defaultEntryUnit, createdAt) VALUES (1, 'Bayesian Cable Curl', 'strong', 'lb', '2026-01-01');
                INSERT INTO exercise (id, name, source, libraryKey, createdAt) VALUES (2, 'Bayesian Curl (Cable)', 'library', 'bayesian-curl-cable', '2026-01-01');
                INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01 10:00:00', 'Arms', 'strong');
                INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (1, 1, 0);
                """)
        }
        let moved = try editor.merge(1, into: 2)
        #expect(moved == 1)
        try editor.database.writer.read { db throws in
            #expect(try Exercise.fetchOne(db, key: 1) == nil)
            #expect(try ExerciseNameResolver.exerciseID(named: "bayesian cable curl", db) == 2)
            #expect(try Exercise.fetchOne(db, key: 2)?.defaultEntryUnit == .pounds)
        }
        let snapshots = try FileManager.default.contentsOfDirectory(atPath: try #require(editor.snapshotDirectory).path)
        #expect(snapshots.count == 1)
        #expect(throws: ExerciseEditError.mergeIntoItself) { try editor.merge(2, into: 2) }
    }

    @Test("A re-import after a merge lands on the merged exercise")
    func reimportAfterMerge() throws {
        let editor = try makeEditor()
        let importer = StrongImporter(database: editor.database, snapshotDirectory: try TestData.temporaryDirectory())
        let rows = try StrongWorkoutsFile.parse(StrongFixtures.olderLayout, timeZone: StrongFixtures.utc)
        _ = try importer.importPlan(StrongImportPlan.make(rows: rows, measurements: []))
        let target = try editor.create(CustomExerciseDraft(name: "Flat Press", primaryMuscles: [.chest]))
        let source = try #require(try editor.database.writer.read { db in
            try ExerciseNameResolver.exerciseID(named: "Bench Press (Barbell)", db)
        })
        try editor.merge(source, into: target)
        try editor.database.writer.write { db in try db.execute(sql: "DELETE FROM workout") }
        let result = try importer.importPlan(StrongImportPlan.make(rows: rows, measurements: []))
        #expect(result.exercisesCreated == 0)
    }

    @Test("Batch merge writes one snapshot and is all-or-nothing")
    func mergeAll() throws {
        let editor = try makeEditor()
        try editor.database.writer.write { db in
            try db.execute(sql: """
                INSERT INTO exercise (id, name, source, createdAt) VALUES
                  (1, 'A', 'strong', '2026-01-01'), (2, 'B', 'strong', '2026-01-01'), (3, 'Target', 'custom', '2026-01-01');
                """)
        }
        try editor.mergeAll([1: 3, 2: 3])
        try editor.database.writer.read { db throws in
            #expect(try Exercise.fetchCount(db) == 1)
            #expect(try ExerciseAlias.fetchCount(db) == 2)
        }
        let snapshots = try FileManager.default.contentsOfDirectory(atPath: try #require(editor.snapshotDirectory).path)
        #expect(snapshots.count == 1)
        #expect(throws: ExerciseEditError.notFound) { try editor.mergeAll([3: 99]) }
        #expect(try editor.database.writer.read(Exercise.fetchCount) == 1)
    }
}
