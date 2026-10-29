import GRDB

/// Another name that resolves to an exercise, such as a Strong name merged into a
/// library exercise ("Bayesian Cable Curl" → "Bayesian Curl (Cable)"). Table `exerciseAlias`.
///
/// Built-in slang for library exercises lives in `library.json`, not here; this
/// table holds only names that come from the owner's own data.
public struct ExerciseAlias: Codable, Sendable, Hashable, FetchableRecord, PersistableRecord {
    /// The alternative name. Unique, case-insensitive.
    public var alias: String
    public var exerciseId: Int64

    public init(alias: String, exerciseId: Int64) {
        self.alias = alias
        self.exerciseId = exerciseId
    }

    public static let databaseTableName = "exerciseAlias"
}
