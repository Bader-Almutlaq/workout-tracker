import Foundation
import WorkoutCore

/// The app's long-lived services, created once at launch and passed down.
///
/// There are no singletons: every screen gets what it needs from here, which
/// keeps dependencies visible and lets previews use an in-memory database.
@MainActor
final class AppEnvironment {
    let database: AppDatabase
    let backupSettings: BackupSettingsModel

    init(database: AppDatabase, backupService: BackupService, bookmark: BackupFolderBookmark) {
        self.database = database
        self.backupSettings = BackupSettingsModel(service: backupService, bookmark: bookmark)
    }

    /// Opens the on-device database and wires up backups.
    ///
    /// Files live in Application Support (see `docs/DATA.md`):
    /// `WorkoutTracker/workouts.sqlite` and `WorkoutTracker/Snapshots/`.
    static func live() throws -> AppEnvironment {
        let root = URL.applicationSupportDirectory.appending(path: "WorkoutTracker")
        let snapshots = root.appending(path: "Snapshots")
        let database = try AppDatabase.openOnDisk(
            at: root.appending(path: "workouts.sqlite"), snapshotDirectory: snapshots
        )
        return AppEnvironment(
            database: database,
            backupService: BackupService(database: database, safetySnapshotDirectory: snapshots),
            bookmark: BackupFolderBookmark()
        )
    }

    /// An in-memory environment for SwiftUI previews.
    static func preview() -> AppEnvironment {
        do {
            let database = try AppDatabase.inMemory()
            let snapshots = FileManager.default.temporaryDirectory.appending(path: "PreviewSnapshots")
            return AppEnvironment(
                database: database,
                backupService: BackupService(database: database, safetySnapshotDirectory: snapshots),
                bookmark: BackupFolderBookmark(suiteName: "preview")
            )
        } catch {
            // Previews only: an in-memory SQLite database can't fail to open in practice.
            preconditionFailure("Preview database failed to open: \(error)")
        }
    }
}
