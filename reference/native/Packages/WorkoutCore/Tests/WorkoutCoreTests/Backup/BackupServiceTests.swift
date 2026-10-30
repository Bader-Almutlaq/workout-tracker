import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Backup and restore")
struct BackupServiceTests {
    private func makeService() throws -> (BackupService, folder: URL) {
        let root = try TestData.temporaryDirectory()
        let database = try AppDatabase.openOnDisk(
            at: root.appending(path: "live/workouts.sqlite"), snapshotDirectory: root.appending(path: "snapshots")
        )
        let service = BackupService(database: database, safetySnapshotDirectory: root.appending(path: "safety"))
        let folder = root.appending(path: "iCloud")
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return (service, folder)
    }

    @Test("A backup is a complete copy and appears in the listing")
    func backUpWritesCompleteCopy() throws {
        let (service, folder) = try makeService()
        try service.database.writer.write(TestData.insertWorkoutWithOneSet)

        let url = try service.backUp(into: folder)
        #expect(try service.backups(in: folder).count == 1)
        let copy = try DatabaseQueue(path: url.path)
        #expect(try copy.read(TestData.workoutCount) == 1)
    }

    @Test("Restore brings data back and keeps a safety snapshot of what it replaced")
    func restoreRoundTrip() throws {
        let (service, folder) = try makeService()
        try service.database.writer.write(TestData.insertWorkoutWithOneSet)
        let backup = try service.backUp(into: folder)

        try service.database.writer.write { db in try db.execute(sql: "DELETE FROM workout") }
        #expect(try service.database.writer.read(TestData.workoutCount) == 0)

        try service.restore(from: backup)
        #expect(try service.database.writer.read(TestData.workoutCount) == 1)
        let safety = try FileManager.default.contentsOfDirectory(atPath: service.safetySnapshotDirectory.path)
        #expect(safety.count == 1, "Safety folder contains: \(safety)")
    }

    @Test("A file that isn't a backup is rejected and live data is untouched")
    func rejectsNonBackup() throws {
        let (service, folder) = try makeService()
        try service.database.writer.write(TestData.insertWorkoutWithOneSet)
        let junk = folder.appending(path: "junk.sqlite")
        try Data("not a database".utf8).write(to: junk)

        #expect(throws: BackupError.self) { try service.restore(from: junk) }
        #expect(try service.database.writer.read(TestData.workoutCount) == 1)
    }

    @Test("Pruning never touches files that aren't backups")
    func pruneLeavesOtherFiles() throws {
        let (service, folder) = try makeService()
        try Data("keep me".utf8).write(to: folder.appending(path: "notes.txt"))
        try service.backUp(into: folder, now: TestData.date(2026, 10, 29, 8))
        try service.backUp(into: folder, now: TestData.date(2026, 10, 29, 9))

        let names = try FileManager.default.contentsOfDirectory(atPath: folder.path)
        #expect(names.contains("notes.txt"))
        #expect(try service.backups(in: folder).count == 1)
    }

    @Test("The folder bookmark survives a round trip through UserDefaults")
    func bookmarkRoundTrip() throws {
        let suite = "WorkoutCoreTests-\(UUID().uuidString)"
        let defaults = try #require(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let (_, folder) = try makeService()

        let bookmark = BackupFolderBookmark(suiteName: suite)
        #expect(try bookmark.resolve() == nil)
        try bookmark.save(folder)
        #expect(try bookmark.resolve()?.standardizedFileURL.path == folder.standardizedFileURL.path)
        #expect(throws: BackupError.noFolderChosen) {
            bookmark.clear()
            try bookmark.withFolder { _ in }
        }
    }
}
