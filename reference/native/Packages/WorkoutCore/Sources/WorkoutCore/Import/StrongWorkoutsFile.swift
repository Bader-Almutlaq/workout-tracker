import Foundation

/// Reads a Strong workouts export (`strong_workouts.csv`) into ``StrongRow``s.
///
/// Accepts both layouts seen in the wild (see `docs/DATA.md`):
/// - **Older**, comma-delimited: `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE`, with durations like `1h 7m`.
/// - **Newer**, semicolon-delimited: `Workout #;Date;Workout Name;Duration (sec);Exercise Name;Set Order;Weight (kg);Reps;RPE;Distance (meters);Seconds;Notes;Workout Notes`.
public enum StrongWorkoutsFile {
    /// Parses the file's text.
    /// - Parameter timeZone: Zone the export's timestamps are in. Strong writes
    ///   local time, so this defaults to the device's zone.
    /// - Throws: ``ImportError`` if a required column is missing or a value is malformed.
    public static func parse(_ text: String, timeZone: TimeZone = .current) throws -> [StrongRow] {
        let table = try CSVTable(parsing: text)
        let columns = try Columns(table)
        let dateFormatter = StrongTimestamp.makeFormatter(timeZone: timeZone)

        return try table.rows.enumerated().map { index, fields in
            let line = index + 2  // +1 for 1-based, +1 for the header
            func field(_ column: Int?) -> String {
                guard let column else { return "" }
                return fields[column].trimmingCharacters(in: .whitespaces)
            }
            func number(_ column: Int?, _ name: String) throws -> Double? {
                let raw = field(column).replacingOccurrences(of: ",", with: ".")
                guard !raw.isEmpty else { return nil }
                guard let value = Double(raw) else { throw ImportError.invalidValue(column: name, value: raw, line: line) }
                return value
            }

            let dateText = field(columns.date)
            guard let startedAt = dateFormatter.date(from: dateText) else {
                throw ImportError.invalidValue(column: "Date", value: dateText, line: line)
            }
            let order = field(columns.setOrder)
            let content: StrongRow.Content = switch order.lowercased() {
            case "note": .note
            case "rest timer": .restTimer
            default: .set(order: order)
            }

            return StrongRow(
                line: line,
                workoutKey: dateText,
                startedAt: startedAt,
                workoutName: field(columns.workoutName),
                durationSeconds: parseDuration(field(columns.duration)),
                exerciseName: field(columns.exerciseName),
                content: content,
                weightValue: try number(columns.weight, "weight") ?? 0,
                reps: Int((try number(columns.reps, "reps") ?? 0).rounded()),
                rpe: try number(columns.rpe, "RPE"),
                distanceMeters: try number(columns.distance, "distance").flatMap { $0 > 0 ? $0 : nil },
                seconds: try number(columns.seconds, "seconds").flatMap { $0 > 0 ? $0 : nil },
                notes: field(columns.notes).nilIfEmpty,
                workoutNotes: field(columns.workoutNotes).nilIfEmpty
            )
        }
    }

    /// Reads "1h 7m", "59m", "45s" or a plain number of seconds.
    /// - Returns: Seconds, or `nil` for an empty or unreadable value (duration is informational only).
    static func parseDuration(_ text: String) -> Double? {
        if text.isEmpty { return nil }
        if let seconds = Double(text) { return seconds }
        var total = 0.0
        var matched = false
        for part in text.split(separator: " ") {
            guard let unit = part.last, let amount = Double(part.dropLast()) else { return nil }
            switch unit {
            case "h": total += amount * 3600
            case "m": total += amount * 60
            case "s": total += amount
            default: return nil
            }
            matched = true
        }
        return matched ? total : nil
    }

    /// Column positions, resolved by header name so column order doesn't matter.
    private struct Columns {
        let date, workoutName, exerciseName, setOrder: Int
        let duration, weight, reps, rpe, distance, seconds, notes, workoutNotes: Int?

        init(_ table: CSVTable) throws {
            func required(_ names: String...) throws -> Int {
                guard let index = names.lazy.compactMap({ table.columnIndex($0) }).first else {
                    throw ImportError.missingColumn(names[0])
                }
                return index
            }
            date = try required("Date")
            workoutName = try required("Workout Name")
            exerciseName = try required("Exercise Name")
            setOrder = try required("Set Order")
            duration = table.columnIndex("Duration") ?? table.columnIndex("Duration (sec)")
            weight = table.columnIndex("Weight") ?? table.columnIndex("Weight (kg)") ?? table.columnIndex("Weight (lbs)")
            reps = table.columnIndex("Reps")
            rpe = table.columnIndex("RPE")
            distance = table.columnIndex("Distance") ?? table.columnIndex("Distance (meters)")
            seconds = table.columnIndex("Seconds")
            notes = table.columnIndex("Notes")
            workoutNotes = table.columnIndex("Workout Notes")
        }
    }
}
