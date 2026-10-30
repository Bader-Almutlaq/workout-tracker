import GRDB

/// Links an exercise to a muscle it trains, with its role. Table `exerciseMuscle`.
public struct ExerciseMuscle: Codable, Sendable, Hashable, FetchableRecord, PersistableRecord {
    public var exerciseId: Int64
    public var muscleId: Muscle
    public var role: MuscleRole

    public init(exerciseId: Int64, muscle: Muscle, role: MuscleRole) {
        self.exerciseId = exerciseId
        self.muscleId = muscle
        self.role = role
    }

    public static let databaseTableName = "exerciseMuscle"
}
