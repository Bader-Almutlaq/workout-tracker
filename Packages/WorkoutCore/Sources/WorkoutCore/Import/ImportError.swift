import Foundation

/// Reasons a Strong export can't be read.
public enum ImportError: Error, LocalizedError, Equatable {
    /// The file has no header row.
    case emptyFile
    /// A quoted field is never closed.
    case unterminatedQuote(line: Int)
    /// A required column is missing, e.g. "Exercise Name".
    case missingColumn(String)
    /// A value can't be read, e.g. a date or number in an unexpected format.
    case invalidValue(column: String, value: String, line: Int)
    /// The file isn't a Strong workouts or measurements export.
    case unrecognisedFile(String)

    public var errorDescription: String? {
        switch self {
        case .emptyFile:
            "The file is empty."
        case .unterminatedQuote(let line):
            "The file is damaged: a quoted value starting near line \(line) never ends."
        case .missingColumn(let name):
            "This doesn't look like a Strong export: the \"\(name)\" column is missing."
        case .invalidValue(let column, let value, let line):
            "Line \(line): \"\(value)\" isn't a valid \(column)."
        case .unrecognisedFile(let name):
            "\(name) isn't a Strong workouts or measurements export."
        }
    }
}
