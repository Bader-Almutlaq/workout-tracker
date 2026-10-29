/// One exercise from the built-in library, fully resolved (family fields merged
/// with its variant's overrides).
public struct LibraryExercise: Sendable, Hashable, Identifiable {
    /// Stable identifier derived from the name, e.g. "lateral-raise-dumbbell".
    /// Stored in `exercise.libraryKey`; it ties database rows to library entries across app updates.
    public var key: String
    /// Display name in Strong's style: "Movement (Equipment)", or the bare movement for bodyweight.
    public var name: String
    public var equipment: Equipment
    public var pattern: MovementPattern
    public var mechanic: Mechanic
    /// Prime movers, in order of emphasis. Never empty.
    public var primaryMuscles: [Muscle]
    /// Meaningful synergists. Never overlaps `primaryMuscles`.
    public var secondaryMuscles: [Muscle]
    /// Loads the target muscle hardest at long lengths (report, "long-muscle-length emphasis").
    public var isLengthenedBiased: Bool
    public var tracking: ExerciseTracking
    /// Other names and gym slang that should find this exercise in search.
    public var aliases: [String]

    public var id: String { key }
}
