import Foundation
import GRDB

/// An exercise in the library, e.g. "Bench Press (Barbell)". Table `exercise`.
public struct Exercise: Codable, Sendable, Identifiable, Hashable, FetchableRecord, MutablePersistableRecord {
    public var id: Int64?
    /// Display name, "Movement (Equipment)". Unique, case-insensitive.
    public var name: String
    public var equipment: String?
    public var movementPattern: String?
    /// "compound" or "isolation".
    public var mechanic: String?
    public var source: RecordSource
    /// Unit the logging screen uses for this exercise (see `docs/DESIGN.md` → Units).
    public var defaultEntryUnit: WeightUnit
    public var isArchived: Bool
    public var createdAt: Date

    public init(
        id: Int64? = nil, name: String, equipment: String? = nil, movementPattern: String? = nil,
        mechanic: String? = nil, source: RecordSource, defaultEntryUnit: WeightUnit = .kilograms,
        isArchived: Bool = false, createdAt: Date = .now
    ) {
        self.id = id
        self.name = name
        self.equipment = equipment
        self.movementPattern = movementPattern
        self.mechanic = mechanic
        self.source = source
        self.defaultEntryUnit = defaultEntryUnit
        self.isArchived = isArchived
        self.createdAt = createdAt
    }

    public static let databaseTableName = "exercise"

    public mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
