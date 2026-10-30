import Foundation

/// The name of a backup file and the moment it encodes.
///
/// Format: `WorkoutTracker-YYYY-MM-DDTHH-mm-ssZ.sqlite`, in UTC, so names sort
/// chronologically. Files that don't match the pattern are never treated as
/// backups, and so are never deleted by retention.
public struct BackupFile: Hashable, Sendable, Comparable {
    /// When the snapshot was taken, truncated to whole seconds.
    public let createdAt: Date

    /// Creates the descriptor for a snapshot taken at `createdAt`.
    public init(createdAt: Date) {
        self.createdAt = Date(timeIntervalSince1970: createdAt.timeIntervalSince1970.rounded(.down))
    }

    /// Parses a file name. Also accepts iCloud's placeholder for a file that
    /// hasn't downloaded yet (`.WorkoutTracker-….sqlite.icloud`).
    /// - Returns: `nil` if `fileName` isn't a backup name.
    public init?(fileName: String) {
        var name = fileName
        if name.hasPrefix("."), name.hasSuffix(".icloud") {
            name = String(name.dropFirst().dropLast(".icloud".count))
        }
        guard name.hasPrefix(Self.prefix), name.hasSuffix(Self.fileExtension) else { return nil }
        let stamp = String(name.dropFirst(Self.prefix.count).dropLast(Self.fileExtension.count))
        guard let date = Self.makeFormatter().date(from: stamp) else { return nil }
        self.createdAt = date
    }

    /// The file name on disk, e.g. `WorkoutTracker-2026-10-29T15-30-00Z.sqlite`.
    public var fileName: String {
        Self.prefix + Self.makeFormatter().string(from: createdAt) + Self.fileExtension
    }

    public static func < (lhs: BackupFile, rhs: BackupFile) -> Bool {
        lhs.createdAt < rhs.createdAt
    }

    private static let prefix = "WorkoutTracker-"
    private static let fileExtension = ".sqlite"

    /// A new formatter per call: `DateFormatter` isn't thread-safe to share,
    /// and backups are rare enough that the cost is irrelevant.
    private static func makeFormatter() -> DateFormatter {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.dateFormat = "yyyy-MM-dd'T'HH-mm-ss'Z'"
        return formatter
    }
}
