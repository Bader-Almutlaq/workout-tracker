import Foundation
import GRDB

/// One training session. Table `workout`.
public struct Workout: Codable, Sendable, Identifiable, Hashable, FetchableRecord, MutablePersistableRecord {
    public var id: Int64?
    public var startedAt: Date
    public var endedAt: Date?
    public var name: String
    public var notes: String?
    public var source: RecordSource
    /// Identifies the workout in its source, e.g. "strong:2021-11-20 20:53:38".
    /// Unique, so importing the same file twice adds nothing.
    public var sourceKey: String?

    public init(
        id: Int64? = nil, startedAt: Date, endedAt: Date? = nil, name: String, notes: String? = nil,
        source: RecordSource, sourceKey: String? = nil
    ) {
        self.id = id
        self.startedAt = startedAt
        self.endedAt = endedAt
        self.name = name
        self.notes = notes
        self.source = source
        self.sourceKey = sourceKey
    }

    public static let databaseTableName = "workout"

    public mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
