import Foundation
import Testing
@testable import WorkoutCore

@Suite("Backup file names and retention")
struct BackupPolicyTests {
    @Test("File names round-trip and sort chronologically")
    func fileNameRoundTrip() throws {
        let file = BackupFile(createdAt: TestData.date(2026, 10, 29, 15))
        #expect(file.fileName == "WorkoutTracker-2026-10-29T15-00-00Z.sqlite")
        #expect(BackupFile(fileName: file.fileName) == file)
    }

    @Test("iCloud placeholders are recognised; unrelated files are ignored")
    func parsesOnlyBackups() {
        #expect(BackupFile(fileName: ".WorkoutTracker-2026-10-29T15-00-00Z.sqlite.icloud") != nil)
        #expect(BackupFile(fileName: "notes.txt") == nil)
        #expect(BackupFile(fileName: "WorkoutTracker-garbage.sqlite") == nil)
    }

    @Test("Automatic backups wait at least 15 minutes")
    func throttlesAutomaticBackups() {
        let now = TestData.date(2026, 10, 29)
        #expect(BackupPolicy.isAutomaticBackupDue(lastBackupAt: nil, now: now))
        #expect(!BackupPolicy.isAutomaticBackupDue(lastBackupAt: now.addingTimeInterval(-60), now: now))
        #expect(BackupPolicy.isAutomaticBackupDue(lastBackupAt: now.addingTimeInterval(-16 * 60), now: now))
    }

    @Test("Retention keeps newest per day for 14 days and newest per month forever")
    func retention() {
        let now = TestData.date(2026, 10, 29, 20)
        let todayEarly = BackupFile(createdAt: TestData.date(2026, 10, 29, 8))
        let todayLate = BackupFile(createdAt: TestData.date(2026, 10, 29, 18))
        let lastWeek = BackupFile(createdAt: TestData.date(2026, 10, 22))
        let septemberEarly = BackupFile(createdAt: TestData.date(2026, 9, 2))
        let septemberLate = BackupFile(createdAt: TestData.date(2026, 9, 28))
        let lastYear = BackupFile(createdAt: TestData.date(2025, 3, 1))

        let deleted = BackupPolicy.backupsToDelete(
            from: [todayEarly, todayLate, lastWeek, septemberEarly, septemberLate, lastYear], now: now
        )
        #expect(deleted == [septemberEarly, todayEarly])
    }

    @Test("A single backup is never deleted")
    func keepsOnlyBackup() {
        let only = BackupFile(createdAt: TestData.date(2020, 1, 1))
        #expect(BackupPolicy.backupsToDelete(from: [only], now: TestData.date(2026, 10, 29)).isEmpty)
    }
}
