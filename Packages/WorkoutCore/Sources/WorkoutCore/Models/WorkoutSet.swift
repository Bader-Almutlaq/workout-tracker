import Foundation
import GRDB

/// One set. Table `workoutSet`.
public struct WorkoutSet: Codable, Sendable, Identifiable, Hashable, FetchableRecord, MutablePersistableRecord {
    public var id: Int64?
    public var workoutExerciseId: Int64
    /// 0-based order within the exercise.
    public var position: Int
    public var kind: SetKind
    /// Load in kilograms, exactly as entered or imported. 0 for bodyweight movements.
    public var weightKilograms: Double
    /// Unit the weight was typed in, for display.
    public var entryUnit: WeightUnit
    public var reps: Int
    /// Rating of perceived exertion, 1–10 (half steps allowed). `nil` = not logged.
    /// RIR is derived as 10 − RPE (Zourdos 2016); it is never stored separately.
    public var rpe: Double?
    public var durationSeconds: Double?
    public var distanceMeters: Double?
    public var side: SetSide
    /// Rest taken before this set, from the rest timer. `nil` when unknown (all imported sets).
    public var restBeforeSeconds: Double?
    public var completedAt: Date?
    public var notes: String?

    public init(
        id: Int64? = nil, workoutExerciseId: Int64, position: Int, kind: SetKind, weightKilograms: Double,
        entryUnit: WeightUnit, reps: Int, rpe: Double? = nil, durationSeconds: Double? = nil,
        distanceMeters: Double? = nil, side: SetSide = .both, restBeforeSeconds: Double? = nil,
        completedAt: Date? = nil, notes: String? = nil
    ) {
        self.id = id
        self.workoutExerciseId = workoutExerciseId
        self.position = position
        self.kind = kind
        self.weightKilograms = weightKilograms
        self.entryUnit = entryUnit
        self.reps = reps
        self.rpe = rpe
        self.durationSeconds = durationSeconds
        self.distanceMeters = distanceMeters
        self.side = side
        self.restBeforeSeconds = restBeforeSeconds
        self.completedAt = completedAt
        self.notes = notes
    }

    /// The load as a ``Weight``.
    public var weight: Weight { Weight(kilograms: weightKilograms) }

    public static let databaseTableName = "workoutSet"

    public mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
