/// The fields the owner fills in to create or edit their own exercise.
public struct CustomExerciseDraft: Sendable, Equatable {
    public var name: String
    public var equipment: Equipment?
    public var pattern: MovementPattern?
    public var mechanic: Mechanic?
    public var primaryMuscles: [Muscle]
    public var secondaryMuscles: [Muscle]
    public var isLengthenedBiased: Bool
    public var tracking: ExerciseTracking

    public init(
        name: String = "", equipment: Equipment? = nil, pattern: MovementPattern? = nil, mechanic: Mechanic? = nil,
        primaryMuscles: [Muscle] = [], secondaryMuscles: [Muscle] = [], isLengthenedBiased: Bool = false,
        tracking: ExerciseTracking = .weightAndReps
    ) {
        self.name = name
        self.equipment = equipment
        self.pattern = pattern
        self.mechanic = mechanic
        self.primaryMuscles = primaryMuscles
        self.secondaryMuscles = secondaryMuscles
        self.isLengthenedBiased = isLengthenedBiased
        self.tracking = tracking
    }

    /// A draft pre-filled from a library exercise, for "Duplicate as my own".
    public init(copying entry: LibraryExercise) {
        self.init(
            name: entry.name + " (Copy)", equipment: entry.equipment, pattern: entry.pattern, mechanic: entry.mechanic,
            primaryMuscles: entry.primaryMuscles, secondaryMuscles: entry.secondaryMuscles,
            isLengthenedBiased: entry.isLengthenedBiased, tracking: entry.tracking
        )
    }
}
