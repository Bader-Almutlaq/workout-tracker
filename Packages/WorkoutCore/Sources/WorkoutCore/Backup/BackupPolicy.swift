import Foundation

/// When automatic backups run, and which old backups are kept.
///
/// Heuristic (no literature applies): frequent enough that at most a few
/// minutes of logging can be lost, sparse enough that the folder stays small.
public enum BackupPolicy {
    /// Minimum gap between automatic backups (taken when the app goes to the background).
    public static let minimumAutomaticInterval: TimeInterval = 15 * 60

    /// Days for which the newest backup of each day is kept.
    public static let dailyRetentionDays = 14

    /// Whether an automatic backup should run now.
    /// - Parameter lastBackupAt: Time of the newest existing backup, or `nil` if none.
    public static func isAutomaticBackupDue(lastBackupAt: Date?, now: Date) -> Bool {
        guard let lastBackupAt else { return true }
        return now.timeIntervalSince(lastBackupAt) >= minimumAutomaticInterval
    }

    /// The backups retention would delete.
    ///
    /// Keeps:
    /// - the newest backup overall,
    /// - the newest backup of each UTC day within the last ``dailyRetentionDays`` days,
    /// - the newest backup of each UTC calendar month, forever.
    ///
    /// Everything else is returned for deletion.
    public static func backupsToDelete(from backups: [BackupFile], now: Date) -> [BackupFile] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .gmt
        let dailyCutoff = calendar.date(byAdding: .day, value: -dailyRetentionDays, to: now) ?? now

        var keep = Set<BackupFile>()
        var newestPerDay: [DateComponents: BackupFile] = [:]
        var newestPerMonth: [DateComponents: BackupFile] = [:]

        for backup in backups.sorted(by: >) {  // newest first, so the first seen per bucket wins
            if keep.isEmpty { keep.insert(backup) }
            let month = calendar.dateComponents([.year, .month], from: backup.createdAt)
            if newestPerMonth[month] == nil { newestPerMonth[month] = backup }
            if backup.createdAt >= dailyCutoff {
                let day = calendar.dateComponents([.year, .month, .day], from: backup.createdAt)
                if newestPerDay[day] == nil { newestPerDay[day] = backup }
            }
        }
        keep.formUnion(newestPerDay.values)
        keep.formUnion(newestPerMonth.values)
        return backups.filter { !keep.contains($0) }.sorted()
    }
}
