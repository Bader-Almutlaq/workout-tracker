/// Where a row came from. Stored in the `source` columns.
public enum RecordSource: String, Codable, Sendable {
    /// Logged in this app.
    case app
    /// Imported from a Strong export.
    case strong
    /// Created by the owner (exercises only).
    case custom
    /// The built-in exercise library (exercises only). See ``ExerciseLibrary``.
    case library
}
