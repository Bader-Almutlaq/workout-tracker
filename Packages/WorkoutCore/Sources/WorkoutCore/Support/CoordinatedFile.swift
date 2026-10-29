import Foundation

/// File operations wrapped in `NSFileCoordinator`.
///
/// Required for files in iCloud Drive: coordination stops the sync daemon from
/// reading a half-written file, and makes iCloud download a file before it is read.
enum CoordinatedFile {
    /// Copies `source` to `destination`, replacing any existing file.
    static func copy(from source: URL, to destination: URL) throws {
        try coordinate(writingAt: destination, options: .forReplacing) { url in
            let fileManager = FileManager.default
            if fileManager.fileExists(atPath: url.path) { try fileManager.removeItem(at: url) }
            try fileManager.copyItem(at: source, to: url)
        }
    }

    /// Copies `source` (possibly an iCloud file not yet downloaded) to a local `destination`.
    static func copyForReading(from source: URL, to destination: URL) throws {
        var coordinationError: NSError?
        var operationError: Error?
        NSFileCoordinator().coordinate(readingItemAt: source, options: [], error: &coordinationError) { url in
            do { try FileManager.default.copyItem(at: url, to: destination) } catch { operationError = error }
        }
        if let error = coordinationError ?? operationError { throw error }
    }

    /// Deletes the file at `url`.
    static func delete(_ url: URL) throws {
        try coordinate(writingAt: url, options: .forDeleting) { url in
            try FileManager.default.removeItem(at: url)
        }
    }

    private static func coordinate(
        writingAt url: URL, options: NSFileCoordinator.WritingOptions, _ body: (URL) throws -> Void
    ) throws {
        var coordinationError: NSError?
        var operationError: Error?
        NSFileCoordinator().coordinate(writingItemAt: url, options: options, error: &coordinationError) { url in
            do { try body(url) } catch { operationError = error }
        }
        if let error = coordinationError ?? operationError { throw error }
    }
}
