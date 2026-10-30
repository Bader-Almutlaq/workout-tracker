import GRDB

/// An exercise as performed within one workout, at a position in the session. Table `workoutExercise`.
public struct WorkoutExercise: Codable, Sendable, Identifiable, Hashable, FetchableRecord, MutablePersistableRecord {
    public var id: Int64?
    public var workoutId: Int64
    public var exerciseId: Int64
    /// 0-based order within the workout. Used for exercise-order analytics.
    public var position: Int
    /// Exercises sharing a group number were done as a superset.
    public var supersetGroup: Int?
    public var notes: String?

    public init(
        id: Int64? = nil, workoutId: Int64, exerciseId: Int64, position: Int,
        supersetGroup: Int? = nil, notes: String? = nil
    ) {
        self.id = id
        self.workoutId = workoutId
        self.exerciseId = exerciseId
        self.position = position
        self.supersetGroup = supersetGroup
        self.notes = notes
    }

    public static let databaseTableName = "workoutExercise"

    public mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
