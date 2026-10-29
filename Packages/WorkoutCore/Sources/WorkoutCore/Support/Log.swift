import os

/// The app's loggers, one per module.
///
/// View output in Console.app by filtering on the subsystem
/// `com.ketchup.workouttracker`. Use these instead of `print`.
public enum Log {
    /// Reverse-DNS identifier shared by every logger. Matches the bundle ID.
    public static let subsystem = "com.ketchup.workouttracker"

    /// Database connection, migrations and pre-migration snapshots.
    public static let database = Logger(subsystem: subsystem, category: "database")

    /// Backup writing, retention and restore.
    public static let backup = Logger(subsystem: subsystem, category: "backup")

    /// Strong CSV import.
    public static let importer = Logger(subsystem: subsystem, category: "import")

    /// Analytics calculations.
    public static let analytics = Logger(subsystem: subsystem, category: "analytics")

    /// SwiftUI layer (feature models and views).
    public static let ui = Logger(subsystem: subsystem, category: "ui")
}
