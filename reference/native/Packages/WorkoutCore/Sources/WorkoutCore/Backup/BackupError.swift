import Foundation

/// Reasons a file can't be restored.
public enum BackupError: Error, LocalizedError, Equatable {
    /// The file isn't a database written by this app.
    case notABackup
    /// SQLite's integrity check failed.
    case damaged
    /// The backup came from a newer app version.
    case newerVersion
    /// No backup folder has been chosen yet.
    case noFolderChosen
    /// The saved folder permission no longer resolves (folder moved or deleted).
    case folderUnavailable

    public var errorDescription: String? {
        switch self {
        case .notABackup: "This file isn't a Workout Tracker backup."
        case .damaged: "This backup file is damaged and can't be restored."
        case .newerVersion: "This backup was made by a newer version of the app. Update the app first."
        case .noFolderChosen: "Choose a backup folder first."
        case .folderUnavailable: "The backup folder can't be reached. Choose it again."
        }
    }
}
