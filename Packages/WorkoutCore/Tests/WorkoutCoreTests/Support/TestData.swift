import Foundation
import GRDB

/// Shared fixtures for tests. Raw SQL keeps them independent of record types.
enum TestData {
    /// Inserts one exercise, one workout, one workout-exercise and one set.
    static func insertWorkoutWithOneSet(_ db: Database) throws {
        try db.execute(sql: """
            INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Squat (Barbell)', 'custom', '2026-01-01');
            INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01 10:00:00', 'Legs', 'app');
            INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
            INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe)
                VALUES (1, 0, 'working', 140, 'kg', 5, 8);
            """)
    }

    /// Number of workouts in the database.
    static func workoutCount(_ db: Database) throws -> Int {
        try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM workout") ?? 0
    }

    /// A fresh, empty temporary folder.
    static func temporaryDirectory() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appending(path: "WorkoutCoreTests-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// A UTC date from components.
    static func date(_ year: Int, _ month: Int, _ day: Int, _ hour: Int = 12) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .gmt
        return calendar.date(from: DateComponents(year: year, month: month, day: day, hour: hour)) ?? .distantPast
    }
}
