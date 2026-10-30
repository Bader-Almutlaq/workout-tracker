import Foundation
import GRDB

/// An exercise the owner can log, e.g. "Bench Press (Barbell)". Table `exercise`.
///
/// Rows come from three places (``source``): the built-in library (seeded by
/// ``ExerciseLibrarySeeder``, `libraryKey` set), the Strong import (names not in
/// the library), and exercises the owner creates.
public struct Exercise: Codable, Sendable, Identifiable, Hashable, FetchableRecord, MutablePersistableRecord {
    public var id: Int64?
    /// Display name, "Movement (Equipment)". Unique, case-insensitive.
    public var name: String
    public var equipment: Equipment?
    public var movementPattern: MovementPattern?
    public var mechanic: Mechanic?
    public var source: RecordSource
    /// The ``LibraryExercise/key`` this row mirrors; `nil` for custom and unmatched Strong exercises.
    public var libraryKey: String?
    /// Loads the target muscle hardest at long lengths (report, "long-muscle-length emphasis").
    public var isLengthenedBiased: Bool
    /// What a set records (weight and reps, reps only, time…).
    public var tracking: ExerciseTracking
    /// Unit the logging screen uses for this exercise (see `docs/DESIGN.md` → Units).
    public var defaultEntryUnit: WeightUnit
    /// Hidden from search and pickers; history is kept.
    public var isArchived: Bool
    public var createdAt: Date

    public init(
        id: Int64? = nil, name: String, equipment: Equipment? = nil, movementPattern: MovementPattern? = nil,
        mechanic: Mechanic? = nil, source: RecordSource, libraryKey: String? = nil,
        isLengthenedBiased: Bool = false, tracking: ExerciseTracking = .weightAndReps,
        defaultEntryUnit: WeightUnit = .kilograms, isArchived: Bool = false, createdAt: Date = .now
    ) {
        self.id = id
        self.name = name
        self.equipment = equipment
        self.movementPattern = movementPattern
        self.mechanic = mechanic
        self.source = source
        self.libraryKey = libraryKey
        self.isLengthenedBiased = isLengthenedBiased
        self.tracking = tracking
        self.defaultEntryUnit = defaultEntryUnit
        self.isArchived = isArchived
        self.createdAt = createdAt
    }

    public static let databaseTableName = "exercise"

    public mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
