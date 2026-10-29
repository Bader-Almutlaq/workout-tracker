import Foundation

/// A parsed CSV file: a header row plus data rows, all as strings.
///
/// Follows RFC 4180: fields may be wrapped in double quotes, quoted fields may
/// contain the delimiter, line breaks and doubled quotes (`""` → `"`).
/// Both `\n` and `\r\n` line endings are accepted. A UTF-8 byte-order mark is ignored.
public struct CSVTable: Sendable, Equatable {
    /// Column names from the first row, trimmed of surrounding whitespace.
    public let header: [String]
    /// Data rows. Each has exactly `header.count` fields (short rows are padded with "").
    public let rows: [[String]]

    /// Parses `text`. The delimiter is detected from the header line:
    /// semicolon if it contains more semicolons than commas, otherwise comma.
    /// - Throws: ``ImportError/emptyFile`` if there is no header row,
    ///   ``ImportError/unterminatedQuote(line:)`` if a quoted field never closes.
    public init(parsing text: String) throws {
        let body = text.hasPrefix("\u{FEFF}") ? String(text.dropFirst()) : text
        let firstLine = body.prefix { $0 != "\n" && $0 != "\r" }
        let delimiter: Character =
            firstLine.filter { $0 == ";" }.count > firstLine.filter { $0 == "," }.count ? ";" : ","

        let records = try Self.records(in: body, delimiter: delimiter)
        guard let header = records.first, !(header.count == 1 && header[0].isEmpty) else {
            throw ImportError.emptyFile
        }
        self.header = header.map { $0.trimmingCharacters(in: .whitespaces) }
        self.rows = records.dropFirst()
            .filter { !($0.count == 1 && $0[0].isEmpty) }  // skip blank lines
            .map { row in row.count >= header.count ? row : row + Array(repeating: "", count: header.count - row.count) }
    }

    /// Index of the first column whose name matches any of `names` (case-insensitive).
    public func columnIndex(_ names: String...) -> Int? {
        header.firstIndex { column in names.contains { $0.caseInsensitiveCompare(column) == .orderedSame } }
    }

    /// Splits `text` into records of fields, honouring quotes.
    private static func records(in text: String, delimiter: Character) throws -> [[String]] {
        var records: [[String]] = []
        var record: [String] = []
        var field = ""
        var inQuotes = false
        var line = 1
        var iterator = text.makeIterator()
        var pending: Character? = nil

        func next() -> Character? {
            if let character = pending { pending = nil; return character }
            return iterator.next()
        }

        while let character = next() {
            if inQuotes {
                if character == "\"" {
                    let following = next()
                    if following == "\"" { field.append("\"") } else { inQuotes = false; pending = following }
                } else {
                    if character == "\n" || character == "\r\n" { line += 1 }
                    field.append(character)
                }
                continue
            }
            switch character {
            case "\"" where field.isEmpty:
                inQuotes = true
            case delimiter:
                record.append(field)
                field = ""
            case "\n", "\r\n", "\r":
                record.append(field)
                records.append(record)
                record = []
                field = ""
                line += 1
            default:
                field.append(character)
            }
        }
        if inQuotes { throw ImportError.unterminatedQuote(line: line) }
        if !field.isEmpty || !record.isEmpty {
            record.append(field)
            records.append(record)
        }
        return records
    }
}
