import GRDB

/// Finds the exercise a name refers to: its own name first, then a stored alias.
/// Both comparisons ignore case. Used by the Strong importer so a name the owner
/// has already matched always lands on the same exercise.
public enum ExerciseNameResolver {
    /// The ID of the exercise called `name` or aliased as `name`, or `nil`.
    public static func exerciseID(named name: String, _ db: Database) throws -> Int64? {
        if let id = try Int64.fetchOne(db, sql: "SELECT id FROM exercise WHERE name = ? COLLATE NOCASE", arguments: [name]) {
            return id
        }
        return try Int64.fetchOne(db, sql: "SELECT exerciseId FROM exerciseAlias WHERE alias = ? COLLATE NOCASE", arguments: [name])
    }
}
