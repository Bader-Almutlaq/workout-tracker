import Foundation

/// Failures when opening or migrating the database.
public enum AppDatabaseError: Error, LocalizedError, Equatable {
    /// The file was written by a newer version of the app than this one.
    case newerSchema(unknownMigrations: [String])

    public var errorDescription: String? {
        switch self {
        case .newerSchema(let migrations):
            "This data was saved by a newer version of the app (\(migrations.joined(separator: ", "))). Update the app first."
        }
    }
}
