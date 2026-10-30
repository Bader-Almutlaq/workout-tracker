import Foundation
import GRDB

/// A body measurement at a point in time. Table `bodyMeasurement`.
public struct BodyMeasurement: Codable, Sendable, Identifiable, Hashable, FetchableRecord, MutablePersistableRecord {
    public var id: Int64?
    public var takenAt: Date
    /// Slug such as "waist", "left-bicep" or "bodyweight".
    public var site: String
    /// Centimetres for circumferences; kilograms when `site` is ``bodyweightSite``.
    public var value: Double
    public var source: RecordSource

    /// The `site` value used for bodyweight entries.
    public static let bodyweightSite = "bodyweight"

    public init(id: Int64? = nil, takenAt: Date, site: String, value: Double, source: RecordSource) {
        self.id = id
        self.takenAt = takenAt
        self.site = site
        self.value = value
        self.source = source
    }

    public static let databaseTableName = "bodyMeasurement"

    public mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
