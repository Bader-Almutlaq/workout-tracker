import Foundation

/// The built-in exercise library: about 420 exercises in Strong's naming style,
/// with muscles tagged to the ``Muscle`` taxonomy.
///
/// Source of truth is `Resources/library.json` (hand-curated; see
/// `docs/DECISIONS.md`). This type loads it, expands each family into its
/// equipment variants, and validates the result.
public struct ExerciseLibrary: Sendable {
    /// The file's version. ``ExerciseLibrarySeeder`` re-seeds when it changes.
    public let version: Int
    /// Every exercise, in file order.
    public let exercises: [LibraryExercise]

    /// Loads the library bundled with WorkoutCore.
    public static func bundled() throws -> ExerciseLibrary {
        guard let url = Bundle.module.url(forResource: "library", withExtension: "json") else {
            throw ExerciseLibraryError.resourceMissing
        }
        return try ExerciseLibrary(json: Data(contentsOf: url))
    }

    /// Parses and validates library JSON. Internal so tests can feed small files.
    init(json: Data) throws {
        let file = try JSONDecoder().decode(LibraryFile.self, from: json)
        let exercises = file.families.flatMap(Self.expand)
        try Self.validate(exercises)
        self.version = file.version
        self.exercises = exercises
    }

    /// The display name for `movement` done with `equipment`: "Movement (Equipment)",
    /// or just "Movement" for bodyweight, matching Strong's built-in names.
    public static func name(movement: String, equipment: Equipment) -> String {
        equipment == .bodyweight ? movement : "\(movement) (\(equipment.displayName))"
    }

    /// Turns a display name into a stable key: lowercase ASCII words joined by hyphens.
    /// "Triceps Pushdown (Cable - Rope)" → "triceps-pushdown-cable-rope".
    public static func key(forName name: String) -> String {
        name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil)
            .lowercased()
            .split { !$0.isLetter && !$0.isNumber }
            .joined(separator: "-")
    }

    private static func expand(_ family: LibraryFile.Family) -> [LibraryExercise] {
        family.variants.map { variant in
            let name = variant.name ?? Self.name(movement: family.movement, equipment: variant.equipment)
            return LibraryExercise(
                key: key(forName: name),
                name: name,
                equipment: variant.equipment,
                pattern: family.pattern,
                mechanic: family.mechanic,
                primaryMuscles: variant.primary ?? family.primary,
                secondaryMuscles: variant.secondary ?? family.secondary ?? [],
                isLengthenedBiased: variant.lengthened ?? family.lengthened ?? false,
                tracking: variant.tracking ?? family.tracking ?? defaultTracking(for: variant.equipment),
                aliases: (family.aliases ?? []) + (variant.aliases ?? [])
            )
        }
    }

    private static func defaultTracking(for equipment: Equipment) -> ExerciseTracking {
        switch equipment {
        case .bodyweight, .weighted, .assisted: .bodyweightReps
        default: .weightAndReps
        }
    }

    private static func validate(_ exercises: [LibraryExercise]) throws {
        var seenKeys: Set<String> = []
        for exercise in exercises {
            guard seenKeys.insert(exercise.key).inserted else {
                throw ExerciseLibraryError.duplicateName(exercise.name)
            }
            guard !exercise.primaryMuscles.isEmpty else {
                throw ExerciseLibraryError.noPrimaryMuscle(exercise.name)
            }
            if let overlap = Set(exercise.primaryMuscles).intersection(exercise.secondaryMuscles).first {
                throw ExerciseLibraryError.muscleListedTwice(exercise: exercise.name, muscle: overlap)
            }
        }
    }
}
