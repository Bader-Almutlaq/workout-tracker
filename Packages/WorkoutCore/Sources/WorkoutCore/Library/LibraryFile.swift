/// The on-disk format of `Resources/library.json`: movement families, each
/// listing the equipment it can be done with.
///
/// A family states the muscles and pattern once; each variant inherits them and
/// may override any field. ``ExerciseLibrary`` expands families into
/// ``LibraryExercise`` values. Edit the JSON, not this type, to add exercises,
/// and bump `version` so installed apps re-seed.
struct LibraryFile: Decodable, Sendable {
    /// Increment on every change to the file. Seeding is skipped when the stored version matches.
    var version: Int
    var families: [Family]

    /// One movement, such as "Lateral Raise", and its equipment variants.
    struct Family: Decodable, Sendable {
        /// Name without equipment, e.g. "Bench Press - Close Grip".
        var movement: String
        var pattern: MovementPattern
        var mechanic: Mechanic
        var primary: [Muscle]
        var secondary: [Muscle]?
        var aliases: [String]?
        /// True when the exercise loads the target muscle hardest at long lengths
        /// (report, "long-muscle-length emphasis"; Maeo 2022, Wolf 2023).
        var lengthened: Bool?
        /// Overrides the tracking inferred from equipment.
        var tracking: ExerciseTracking?
        var variants: [Variant]
    }

    /// An equipment variant. In JSON either a bare equipment slug (`"dumbbell"`)
    /// or an object that overrides family fields.
    struct Variant: Decodable, Sendable {
        var equipment: Equipment
        /// Full display name, replacing the generated "Movement (Equipment)".
        var name: String?
        var primary: [Muscle]?
        var secondary: [Muscle]?
        /// Added to the family's aliases.
        var aliases: [String]?
        var lengthened: Bool?
        var tracking: ExerciseTracking?

        private enum CodingKeys: String, CodingKey {
            case equipment, name, primary, secondary, aliases, lengthened, tracking
        }

        init(from decoder: any Decoder) throws {
            if let equipment = try? decoder.singleValueContainer().decode(Equipment.self) {
                self.equipment = equipment
                return
            }
            let container = try decoder.container(keyedBy: CodingKeys.self)
            equipment = try container.decode(Equipment.self, forKey: .equipment)
            name = try container.decodeIfPresent(String.self, forKey: .name)
            primary = try container.decodeIfPresent([Muscle].self, forKey: .primary)
            secondary = try container.decodeIfPresent([Muscle].self, forKey: .secondary)
            aliases = try container.decodeIfPresent([String].self, forKey: .aliases)
            lengthened = try container.decodeIfPresent(Bool.self, forKey: .lengthened)
            tracking = try container.decodeIfPresent(ExerciseTracking.self, forKey: .tracking)
        }
    }
}
