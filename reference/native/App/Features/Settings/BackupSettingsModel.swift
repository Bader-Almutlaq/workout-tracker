import Foundation
import Observation
import UIKit
import WorkoutCore

/// State and actions for the Backups section of Settings, plus the automatic
/// backup that runs when the app goes to the background.
///
/// All file work runs off the main thread; this model only publishes results.
@MainActor
@Observable
final class BackupSettingsModel {
    /// Display name of the chosen folder, or `nil` if none is chosen.
    private(set) var folderName: String?
    /// When the newest backup in the folder was made.
    private(set) var lastBackupAt: Date?
    /// True while a backup or restore is running.
    private(set) var isWorking = false
    /// The latest user-facing error, cleared by the next successful action.
    var errorMessage: String?
    /// A short confirmation after a manual action, e.g. "Backed up".
    private(set) var statusMessage: String?

    private let service: BackupService
    private let bookmark: BackupFolderBookmark

    init(service: BackupService, bookmark: BackupFolderBookmark) {
        self.service = service
        self.bookmark = bookmark
    }

    /// Re-reads the folder and its newest backup.
    func refresh() {
        let bookmark = bookmark, service = service
        run(confirmation: nil) {
            try bookmark.withFolder { folder in
                (folder.lastPathComponent, try service.backups(in: folder).last?.createdAt)
            }
        } then: { [weak self] (name, last) in
            self?.folderName = name
            self?.lastBackupAt = last
        }
    }

    /// Saves the folder picked in the Files picker, then backs up into it straight away.
    func chooseFolder(_ url: URL) {
        do {
            try bookmark.save(url)
            backUpNow()
        } catch {
            report(error)
        }
    }

    /// Writes a backup now, ignoring the automatic throttle.
    func backUpNow() {
        let bookmark = bookmark, service = service
        run(confirmation: "Backed up") {
            try bookmark.withFolder { folder in
                try service.backUp(into: folder)
                return (folder.lastPathComponent, try service.backups(in: folder).last?.createdAt)
            }
        } then: { [weak self] (name, last) in
            self?.folderName = name
            self?.lastBackupAt = last
        }
    }

    /// Called when the app moves to the background. Backs up if a folder is set
    /// and ``BackupPolicy`` says one is due. Keeps the app alive briefly to finish.
    func backUpIfDue() {
        guard bookmark.isSet, BackupPolicy.isAutomaticBackupDue(lastBackupAt: lastBackupAt, now: .now) else { return }
        let taskID = UIApplication.shared.beginBackgroundTask(withName: "Backup")
        let bookmark = bookmark, service = service
        Task.detached {
            let result = Result {
                try bookmark.withFolder { folder in
                    try service.backUp(into: folder)
                    return try service.backups(in: folder).last?.createdAt
                }
            }
            await MainActor.run { [weak self] in
                switch result {
                case .success(let last): self?.lastBackupAt = last
                case .failure(let error): Log.backup.error("Automatic backup failed: \(error.localizedDescription, privacy: .public)")
                }
                UIApplication.shared.endBackgroundTask(taskID)
            }
        }
    }

    /// Replaces all current data with the backup at `url` (from the Files picker).
    /// The current data is snapshotted first by ``BackupService/restore(from:)``.
    func restore(from url: URL) {
        let service = service
        run(confirmation: "Restored") {
            let didStart = url.startAccessingSecurityScopedResource()
            defer { if didStart { url.stopAccessingSecurityScopedResource() } }
            try service.restore(from: url)
        } then: { _ in }
    }

    /// Runs `work` off the main thread, then applies `update` on the main thread.
    private func run<T: Sendable>(
        confirmation: String?,
        _ work: @escaping @Sendable () throws -> T,
        then update: @escaping @MainActor (T) -> Void
    ) {
        isWorking = true
        statusMessage = nil
        Task {
            let result = await Task.detached { Result { try work() } }.value
            isWorking = false
            switch result {
            case .success(let value):
                update(value)
                errorMessage = nil
                statusMessage = confirmation
            case .failure(BackupError.noFolderChosen):
                folderName = nil
            case .failure(let error):
                report(error)
            }
        }
    }

    private func report(_ error: any Error) {
        Log.backup.error("\(error.localizedDescription, privacy: .public)")
        errorMessage = error.localizedDescription
    }
}
