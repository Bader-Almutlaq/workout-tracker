import Foundation
import GRDB

/// Writes, lists, prunes and restores database backups.
///
/// The service works on plain folder URLs. Getting permission to use the
/// iCloud Drive folder is ``BackupFolderBookmark``'s job.
public struct BackupService: Sendable {
    /// The live database being protected.
    public let database: AppDatabase

    /// Local folder for safety snapshots taken before a restore.
    public let safetySnapshotDirectory: URL

    public init(database: AppDatabase, safetySnapshotDirectory: URL) {
        self.database = database
        self.safetySnapshotDirectory = safetySnapshotDirectory
    }

    /// Writes a new backup into `folder`, then applies ``BackupPolicy`` retention there.
    ///
    /// The snapshot is first written to a local temporary folder and then copied
    /// in with file coordination, so iCloud never syncs a partial file.
    /// - Returns: The URL of the new backup.
    @discardableResult
    public func backUp(into folder: URL, now: Date = .now) throws -> URL {
        let staging = FileManager.default.temporaryDirectory.appending(path: "backup-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: staging) }

        let local = try AppDatabase.writeSnapshot(of: database.writer, into: staging, now: now)
        let destination = folder.appending(path: local.lastPathComponent)
        try CoordinatedFile.copy(from: local, to: destination)
        Log.backup.notice("Backup written: \(destination.lastPathComponent, privacy: .public)")

        try prune(folder, now: now)
        return destination
    }

    /// Backups in `folder`, oldest first. Ignores files that aren't backups.
    public func backups(in folder: URL) throws -> [BackupFile] {
        try FileManager.default.contentsOfDirectory(atPath: folder.path)
            .compactMap(BackupFile.init(fileName:))
            .sorted()
    }

    /// Deletes the backups in `folder` that ``BackupPolicy`` doesn't keep.
    public func prune(_ folder: URL, now: Date = .now) throws {
        for backup in BackupPolicy.backupsToDelete(from: try backups(in: folder), now: now) {
            try CoordinatedFile.delete(folder.appending(path: backup.fileName))
            Log.backup.info("Pruned backup: \(backup.fileName, privacy: .public)")
        }
    }

    /// Replaces the live data with the contents of the backup at `file`.
    ///
    /// Steps: copy the file locally → check it is a readable backup from this
    /// or an older app version → snapshot the current data into
    /// ``safetySnapshotDirectory`` → copy the backup over the live database →
    /// run any newer migrations.
    /// - Throws: ``BackupError`` if the file isn't a usable backup. The live data
    ///   is untouched in that case.
    public func restore(from file: URL) throws {
        let staging = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        try FileManager.default.createDirectory(at: staging, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: staging) }

        let localCopy = staging.appending(path: "restore.sqlite")
        try CoordinatedFile.copyForReading(from: file, to: localCopy)
        let source = try Self.openValidatedBackup(at: localCopy)
        defer { try? source.close() }

        let safety = try AppDatabase.writeSnapshot(of: database.writer, into: safetySnapshotDirectory)
        Log.backup.notice("Safety snapshot before restore: \(safety.lastPathComponent, privacy: .public)")

        try source.backup(to: database.writer)
        try AppDatabase.migrate(database.writer, with: Migrations.makeMigrator(), snapshotDirectory: nil)
        Log.backup.notice("Restored from \(file.lastPathComponent, privacy: .public)")
    }

    /// Opens `url` read-only and checks that it is an intact backup this app version can read.
    static func openValidatedBackup(at url: URL) throws -> DatabaseQueue {
        var configuration = AppDatabase.makeConfiguration()
        configuration.readonly = true
        let queue: DatabaseQueue
        do {
            queue = try DatabaseQueue(path: url.path, configuration: configuration)
        } catch {
            throw BackupError.notABackup
        }

        let migrator = Migrations.makeMigrator()
        // Any read failure here means the file isn't a usable SQLite database.
        let (applied, integrity): (Set<String>, String?)
        do {
            (applied, integrity) = try queue.read { db in
                (try migrator.appliedIdentifiers(db), try String.fetchOne(db, sql: "PRAGMA quick_check"))
            }
        } catch {
            throw BackupError.notABackup
        }
        guard !applied.isEmpty else { throw BackupError.notABackup }
        guard integrity == "ok" else { throw BackupError.damaged }
        let unknown = applied.subtracting(migrator.migrations)
        guard unknown.isEmpty else { throw BackupError.newerVersion }
        return queue
    }
}
