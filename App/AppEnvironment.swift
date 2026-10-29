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
    let history: HistoryModel
    /// Local folder for safety snapshots (before migrations, restores, imports and merges).
    let snapshotDirectory: URL
    /// The built-in exercise library, already seeded into `database`. Supplies search aliases.
    let library: ExerciseLibrary
    /// Creates, edits, archives and merges exercises.
    let exerciseEditor: ExerciseEditor

    /// Seeds the library into `database` (a no-op when already at this version), then builds the services.
    init(database: AppDatabase, snapshotDirectory: URL, bookmark: BackupFolderBookmark) throws {
        let library = try ExerciseLibrary.bundled()
        try ExerciseLibrarySeeder.seed(library, into: database)
        self.library = library
        self.exerciseEditor = ExerciseEditor(database: database, snapshotDirectory: snapshotDirectory)
        self.database = database
        self.snapshotDirectory = snapshotDirectory
        self.backupSettings = BackupSettingsModel(
            service: BackupService(database: database, safetySnapshotDirectory: snapshotDirectory),
            bookmark: bookmark
        )
        self.history = HistoryModel(database: database)
    }

    /// A fresh import flow. Each import starts from scratch.
    func makeImportModel() -> StrongImportModel {
        StrongImportModel(importer: StrongImporter(database: database, snapshotDirectory: snapshotDirectory))
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
        return try AppEnvironment(database: database, snapshotDirectory: snapshots, bookmark: BackupFolderBookmark())
    }

    /// An in-memory environment for SwiftUI previews.
    static func preview() -> AppEnvironment {
        do {
            return try AppEnvironment(
                database: try AppDatabase.inMemory(),
                snapshotDirectory: FileManager.default.temporaryDirectory.appending(path: "PreviewSnapshots"),
                bookmark: BackupFolderBookmark(suiteName: "preview")
            )
        } catch {
            // Previews only: an in-memory database and the bundled library can't fail to load in practice.
            preconditionFailure("Preview environment failed to load: \(error)")
        }
    }
}
