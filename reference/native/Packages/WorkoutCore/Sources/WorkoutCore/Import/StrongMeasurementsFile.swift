import Foundation

/// Reads one Strong body-measurement export (e.g. `strong_waist.csv`).
///
/// Header: `Date,Measurement Type,Value,Unit,Source`. Strong writes one file
/// per measurement site. Circumferences are stored in centimetres; a
/// bodyweight file is stored in kilograms under ``BodyMeasurement/bodyweightSite``.
public enum StrongMeasurementsFile {
    /// Whether `table` looks like a measurements export (used to sort picked files).
    public static func matches(_ table: CSVTable) -> Bool {
        table.columnIndex("Measurement Type") != nil && table.columnIndex("Value") != nil
    }

    /// Parses the file's text.
    /// - Parameter timeZone: Zone the timestamps are in (Strong writes local time).
    public static func parse(_ text: String, timeZone: TimeZone = .current) throws -> [BodyMeasurement] {
        let table = try CSVTable(parsing: text)
        guard let date = table.columnIndex("Date") else { throw ImportError.missingColumn("Date") }
        guard let type = table.columnIndex("Measurement Type") else { throw ImportError.missingColumn("Measurement Type") }
        guard let value = table.columnIndex("Value") else { throw ImportError.missingColumn("Value") }
        let unit = table.columnIndex("Unit")

        let formatter = StrongTimestamp.makeFormatter(timeZone: timeZone)

        return try table.rows.enumerated().map { index, fields in
            let line = index + 2
            guard let takenAt = formatter.date(from: fields[date]) else {
                throw ImportError.invalidValue(column: "Date", value: fields[date], line: line)
            }
            guard let number = Double(fields[value].replacingOccurrences(of: ",", with: ".")) else {
                throw ImportError.invalidValue(column: "Value", value: fields[value], line: line)
            }
            let unitText = unit.map { fields[$0].lowercased() } ?? "cm"
            let site = siteSlug(fields[type])
            return BodyMeasurement(
                takenAt: takenAt, site: site, value: normalise(number, unit: unitText), source: .strong
            )
        }
    }

    /// "Left Bicep" → "left-bicep"; any bodyweight label → ``BodyMeasurement/bodyweightSite``.
    static func siteSlug(_ type: String) -> String {
        let lowered = type.lowercased().trimmingCharacters(in: .whitespaces)
        if lowered == "weight" || lowered.contains("body weight") || lowered == "bodyweight" {
            return BodyMeasurement.bodyweightSite
        }
        return lowered.split(whereSeparator: { !$0.isLetter && !$0.isNumber }).joined(separator: "-")
    }

    /// Converts to the stored unit: cm for circumferences, kg for bodyweight.
    static func normalise(_ value: Double, unit: String) -> Double {
        switch unit {
        case "in", "inch", "inches": value * Constants.centimetresPerInch
        case "lb", "lbs": Weight(value, unit: .pounds).kilograms
        default: value
        }
    }

    enum Constants {
        /// Exact, by international definition (1959).
        static let centimetresPerInch = 2.54
    }
}
