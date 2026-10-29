import Foundation
import GRDB

/// The app's single SQLite database.
///
/// Opening it runs any pending schema migrations. If the file already holds
/// data and migrations are pending, a complete snapshot is written first, so a
/// faulty migration can always be undone (see `docs/DATA.md`).
public final class AppDatabase: Sendable {
    /// The underlying connection. A `DatabasePool` (WAL mode) on disk,
    /// a `DatabaseQueue` in memory for tests and previews.
    public let writer: any DatabaseWriter

    /// Opens (creating if needed) the database file at `fileURL`.
    ///
    /// - Parameters:
    ///   - fileURL: Location of the SQLite file. Its folder is created if missing.
    ///   - snapshotDirectory: Where pre-migration snapshots are written.
    public static func openOnDisk(at fileURL: URL, snapshotDirectory: URL) throws -> AppDatabase {
        try FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true
        )
        let pool = try DatabasePool(path: fileURL.path, configuration: makeConfiguration())
        return try AppDatabase(
            writer: pool, migrator: Migrations.makeMigrator(), snapshotDirectory: snapshotDirectory
        )
    }

    /// An empty, fully migrated database in memory. For tests and SwiftUI previews.
    public static func inMemory() throws -> AppDatabase {
        let queue = try DatabaseQueue(configuration: makeConfiguration())
        return try AppDatabase(writer: queue, migrator: Migrations.makeMigrator(), snapshotDirectory: nil)
    }

    /// Designated initializer. Internal so tests can inject a custom migrator.
    init(writer: any DatabaseWriter, migrator: DatabaseMigrator, snapshotDirectory: URL?) throws {
        self.writer = writer
        try Self.migrate(writer, with: migrator, snapshotDirectory: snapshotDirectory)
    }

    /// Brings `writer` up to date with `migrator`, snapshotting first when needed.
    ///
    /// Also used after a restore, because a backup may predate newer migrations.
    static func migrate(
        _ writer: any DatabaseWriter, with migrator: DatabaseMigrator, snapshotDirectory: URL?
    ) throws {
        // `appliedIdentifiers` includes migrations this version doesn't know about,
        // which is exactly what reveals a file written by a newer app version.
        let (applied, hasPending) = try writer.read { db in
            (try migrator.appliedIdentifiers(db), try !migrator.hasCompletedMigrations(db))
        }
        let unknown = applied.subtracting(migrator.migrations)
        guard unknown.isEmpty else {
            throw AppDatabaseError.newerSchema(unknownMigrations: unknown.sorted())
        }

        if hasPending, !applied.isEmpty, let snapshotDirectory {
            let url = try writeSnapshot(of: writer, into: snapshotDirectory)
            Log.database.notice("Pre-migration snapshot written: \(url.lastPathComponent, privacy: .public)")
        }
        try migrator.migrate(writer)
    }

    /// Writes a complete, consistent copy of `reader` as a new backup file in `directory`.
    ///
    /// Uses SQLite's online backup API, so it is safe while the app is writing.
    /// The result is always one self-contained file with no `-wal`/`-shm` side files.
    /// - Returns: The URL of the new file.
    @discardableResult
    static func writeSnapshot(
        of reader: any DatabaseReader, into directory: URL, now: Date = .now
    ) throws -> URL {
        let fileManager = FileManager.default
        let fileName = BackupFile(createdAt: now).fileName
        let staging = fileManager.temporaryDirectory.appending(path: "snapshot-\(UUID().uuidString)")
        try fileManager.createDirectory(at: staging, withIntermediateDirectories: true)
        defer { try? fileManager.removeItem(at: staging) }

        let stagedURL = staging.appending(path: fileName)
        let destination = try DatabaseQueue(path: stagedURL.path)
        try reader.backup(to: destination)
        // The copy inherits the live file's WAL mode, which needs side files to
        // open. Switch it to rollback-journal mode so the single file is complete,
        // syncs safely through iCloud, and opens read-only during restore.
        try destination.writeWithoutTransaction { db in
            try db.execute(sql: "PRAGMA journal_mode = DELETE")
        }
        try destination.close()

        // Move only the database file; any side files stay in staging and are deleted.
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        let url = directory.appending(path: fileName)
        if fileManager.fileExists(atPath: url.path) { try fileManager.removeItem(at: url) }
        try fileManager.moveItem(at: stagedURL, to: url)
        return url
    }

    /// Connection settings shared by every database the app opens.
    static func makeConfiguration() -> Configuration {
        var configuration = Configuration()
        configuration.foreignKeysEnabled = true
        configuration.label = "WorkoutTracker"
        return configuration
    }
}
