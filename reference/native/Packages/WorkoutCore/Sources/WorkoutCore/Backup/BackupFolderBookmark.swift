import Foundation

/// Remembers the backup folder the owner picked, across app launches.
///
/// iOS only lets an app use a folder chosen in the Files picker while it holds
/// a *security-scoped bookmark* to it. This type stores that bookmark in
/// `UserDefaults` and opens access around each use. It works on a free
/// Personal Team, unlike an app-owned iCloud container (see `docs/DECISIONS.md`).
public struct BackupFolderBookmark: Sendable {
    /// `UserDefaults` suite holding the bookmark; `nil` = the app's standard defaults.
    /// Stored as a name (not a `UserDefaults` instance) so this type is `Sendable`.
    private let suiteName: String?
    private let key: String

    /// - Parameters:
    ///   - suiteName: Defaults suite for the bookmark. Pass a unique suite in tests and previews.
    ///   - key: Defaults key for the bookmark data.
    public init(suiteName: String? = nil, key: String = "backupFolderBookmark") {
        self.suiteName = suiteName
        self.key = key
    }

    private var defaults: UserDefaults { UserDefaults(suiteName: suiteName) ?? .standard }

    /// Whether a folder has been chosen.
    public var isSet: Bool { defaults.data(forKey: key) != nil }

    /// Saves `folder`, as returned by the Files folder picker.
    public func save(_ folder: URL) throws {
        let data = try withAccess(to: folder) { try folder.bookmarkData() }
        defaults.set(data, forKey: key)
    }

    /// Forgets the folder. Existing backups in it are not touched.
    public func clear() {
        defaults.removeObject(forKey: key)
    }

    /// Resolves the saved folder, refreshing the bookmark if iOS marked it stale.
    /// - Returns: `nil` when no folder has been chosen.
    /// - Throws: ``BackupError/folderUnavailable`` if the bookmark no longer resolves.
    public func resolve() throws -> URL? {
        guard let data = defaults.data(forKey: key) else { return nil }
        var isStale = false
        guard let url = try? URL(resolvingBookmarkData: data, bookmarkDataIsStale: &isStale) else {
            throw BackupError.folderUnavailable
        }
        if isStale { try save(url) }
        return url
    }

    /// Runs `body` with permission to use the saved folder.
    /// - Throws: ``BackupError/noFolderChosen`` when no folder is saved.
    public func withFolder<T>(_ body: (URL) throws -> T) throws -> T {
        guard let folder = try resolve() else { throw BackupError.noFolderChosen }
        return try withAccess(to: folder) { try body(folder) }
    }

    /// Opens security-scoped access for the duration of `body`. On the Mac
    /// (tests, not sandboxed) access isn't needed and the call is a no-op.
    private func withAccess<T>(to url: URL, _ body: () throws -> T) throws -> T {
        let didStart = url.startAccessingSecurityScopedResource()
        defer { if didStart { url.stopAccessingSecurityScopedResource() } }
        return try body()
    }
}
