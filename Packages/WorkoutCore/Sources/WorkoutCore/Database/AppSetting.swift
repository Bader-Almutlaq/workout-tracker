import GRDB

/// Small key–value settings stored in the `appSetting` table.
///
/// Each key is a case here, so every stored setting is listed in one place.
public enum AppSetting: String, Sendable {
    /// The ``ExerciseLibrary/version`` last seeded into the database.
    case seededLibraryVersion = "seeded-library-version"

    /// The stored value, or `nil` if never set.
    public func value(_ db: Database) throws -> String? {
        try String.fetchOne(db, sql: "SELECT value FROM appSetting WHERE key = ?", arguments: [rawValue])
    }

    /// Stores `value`, replacing any previous one.
    public func set(_ value: String, _ db: Database) throws {
        try db.execute(
            sql: "INSERT INTO appSetting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            arguments: [rawValue, value]
        )
    }
}
