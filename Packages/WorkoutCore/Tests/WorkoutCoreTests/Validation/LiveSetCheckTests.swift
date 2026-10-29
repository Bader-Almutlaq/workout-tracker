import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Live typo check")
struct LiveSetCheckTests {
    /// A database with a squat (id 1) and one finished weekly session of it per entry in
    /// `weights`, each with one working set at `reps` reps. Session ids start at 1.
    private func makeDatabase(weights: [Double] = [100, 100, 100, 100], reps: Int = 8) throws -> AppDatabase {
        let database = try AppDatabase.inMemory()
        try database.writer.write { db in
            try db.execute(sql: """
                INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Squat (Barbell)', 'custom', '2026-01-01');
                """)
            for (index, weight) in weights.enumerated() {
                try insertSession(id: Int64(index + 1), day: index + 1, weight: weight, reps: reps, db)
            }
        }
        return database
    }

    /// One workout on 2026-01-`day` with one working set. Defaults to a finished session with a completed set.
    private func insertSession(
        id: Int64, day: Int, weight: Double, reps: Int, inProgress: Bool = false, completed: Bool = true, _ db: Database
    ) throws {
        try db.execute(sql: """
            INSERT INTO workout (id, startedAt, name, source, isInProgress) VALUES (?, ?, 'Legs', 'app', ?);
            INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (?, ?, 1, 0);
            INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted)
            VALUES (?, 0, 'working', ?, 'kg', ?, ?);
            """, arguments: [
                id, String(format: "2026-01-%02d 10:00:00", day), inProgress, id, id, id, weight, reps, completed
            ])
    }

    private func check(
        _ database: AppDatabase, weight: Double, reps: Int, kind: SetKind = .working, excluding: Int64? = nil
    ) throws -> SetPlausibility.Finding? {
        try database.writer.read { db in
            try LiveSetCheck.finding(
                exerciseID: 1, weightKilograms: weight, reps: reps, kind: kind, excludingWorkout: excluding, db
            )
        }
    }

    @Test("A normal set is not flagged")
    func normal() throws {
        let database = try makeDatabase()
        #expect(try check(database, weight: 105, reps: 8) == nil)
    }

    @Test("An extra zero is flagged as too high and the decimal shift is suggested")
    func extraZero() throws {
        let database = try makeDatabase()
        let finding = try #require(try check(database, weight: 1000, reps: 8))
        #expect(finding.issue == .weightTooHigh)
        #expect(finding.typical == 100)
        #expect(finding.suggestion == 100)
    }

    @Test("A missed digit is flagged as too low")
    func missedDigit() throws {
        let database = try makeDatabase()
        let finding = try #require(try check(database, weight: 10, reps: 8))
        #expect(finding.issue == .weightTooLow)
        #expect(finding.suggestion == 100)
    }

    @Test("A weight typed in pounds on a kilogram lift suggests the kilogram value")
    func wrongUnit() throws {
        let database = try makeDatabase()
        let finding = try #require(try check(database, weight: 220.462, reps: 8))
        #expect(finding.issue == .weightTooHigh)
        let suggestion = try #require(finding.suggestion)
        #expect(abs(suggestion - 100) < 0.01)
    }

    @Test("80 reps where 8 is typical is flagged and 8 is suggested")
    func extraZeroReps() throws {
        let database = try makeDatabase()
        let finding = try #require(try check(database, weight: 100, reps: 80))
        #expect(finding.issue == .repsTooHigh)
        #expect(finding.typical == 8)
        #expect(finding.suggestion == 8)
    }

    @Test("Fewer than three past sessions is not enough to judge")
    func tooLittleHistory() throws {
        let database = try makeDatabase(weights: [100, 100])
        #expect(try check(database, weight: 1000, reps: 80) == nil)
    }

    @Test("Warm-ups are never flagged")
    func warmup() throws {
        let database = try makeDatabase()
        #expect(try check(database, weight: 1000, reps: 80, kind: .warmup) == nil)
    }

    @Test("A working set of zero reps is reported even without history")
    func zeroReps() throws {
        let database = try makeDatabase(weights: [])
        #expect(try check(database, weight: 100, reps: 0)?.issue == .zeroReps)
    }

    @Test("The workout in progress and planned sets are not history")
    func ignoresUnfinished() throws {
        let database = try makeDatabase(weights: [100, 100])
        try database.writer.write { db in
            try insertSession(id: 3, day: 3, weight: 100, reps: 8, inProgress: true, db)
            try insertSession(id: 4, day: 4, weight: 100, reps: 8, completed: false, db)
        }
        #expect(try check(database, weight: 1000, reps: 8) == nil)
    }

    @Test("excludingWorkout leaves that workout out of the history")
    func excludesWorkout() throws {
        let database = try makeDatabase(weights: [100, 100, 100])
        #expect(try check(database, weight: 1000, reps: 8)?.issue == .weightTooHigh)
        #expect(try check(database, weight: 1000, reps: 8, excluding: 3) == nil)
    }

    @Test("Only the newest four sessions set what is typical")
    func newestSessionsOnly() throws {
        let database = try makeDatabase(weights: [40, 40, 40, 100, 100, 100, 100])
        #expect(try check(database, weight: 105, reps: 8) == nil)
        #expect(try check(database, weight: 30, reps: 8)?.issue == .weightTooLow)
    }
}
