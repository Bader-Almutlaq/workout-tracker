import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Database migrations and safety snapshots")
struct AppDatabaseTests {
    @Test("A fresh database has every core table")
    func createsCoreTables() throws {
        let database = try AppDatabase.inMemory()
        let tables = try database.writer.read { db in
            try ["muscle", "exercise", "exerciseMuscle", "exerciseAlias", "appSetting", "workout", "workoutExercise",
                 "workoutSet", "bodyMeasurement"]
                .filter { try db.tableExists($0) }
        }
        #expect(tables.count == 9)
    }

    @Test("Every muscle in the taxonomy has a row, with the same name and region")
    func musclesMatchTaxonomy() throws {
        let database = try AppDatabase.inMemory()
        let rows = try database.writer.read { db in
            try Row.fetchAll(db, sql: "SELECT id, name, region FROM muscle")
        }
        let stored = Set(rows.map { "\($0["id"] as String)|\($0["name"] as String)|\($0["region"] as String)" })
        let expected = Set(Muscle.allCases.map { "\($0.rawValue)|\($0.displayName)|\($0.region.rawValue)" })
        #expect(stored == expected)
    }

    @Test("Deleting a workout deletes its exercises and sets")
    func cascadesDeletes() throws {
        let database = try AppDatabase.inMemory()
        try database.writer.write { db in
            try TestData.insertWorkoutWithOneSet(db)
            try db.execute(sql: "DELETE FROM workout")
            #expect(try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM workoutSet") == 0)
            #expect(try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM workoutExercise") == 0)
        }
    }

    @Test("An exercise that has been logged can't be deleted")
    func protectsLoggedExercises() throws {
        let database = try AppDatabase.inMemory()
        try database.writer.write { db in
            try TestData.insertWorkoutWithOneSet(db)
            #expect(throws: DatabaseError.self) { try db.execute(sql: "DELETE FROM exercise") }
        }
    }

    @Test("Pending migrations on a database with data trigger a snapshot first")
    func snapshotsBeforeMigrating() throws {
        let folder = try TestData.temporaryDirectory()
        let snapshots = folder.appending(path: "Snapshots")
        let queue = try DatabaseQueue(path: folder.appending(path: "db.sqlite").path)

        _ = try AppDatabase(writer: queue, migrator: Migrations.makeMigrator(), snapshotDirectory: snapshots)
        #expect(!FileManager.default.fileExists(atPath: snapshots.path), "First migration of an empty file needs no snapshot")

        var newer = Migrations.makeMigrator()
        newer.registerMigration("test-v2") { db in try db.create(table: "extra") { $0.column("x") } }
        _ = try AppDatabase(writer: queue, migrator: newer, snapshotDirectory: snapshots)
        let files = try FileManager.default.contentsOfDirectory(atPath: snapshots.path)
        #expect(files.count == 1)
        #expect(files.allSatisfy { BackupFile(fileName: $0) != nil })
    }

    @Test("A database from a newer app version is refused, not modified")
    func refusesNewerSchema() throws {
        let queue = try DatabaseQueue()
        var newer = Migrations.makeMigrator()
        newer.registerMigration("future") { _ in }
        try newer.migrate(queue)

        #expect(throws: AppDatabaseError.self) {
            _ = try AppDatabase(writer: queue, migrator: Migrations.makeMigrator(), snapshotDirectory: nil)
        }
    }
}
