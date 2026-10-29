import Foundation
import GRDB
import Testing
@testable import WorkoutCore

@Suite("Logging a workout live")
struct WorkoutLoggerTests {
    /// A database with a bench exercise (default unit lb) and one finished workout of it.
    private func makeLogger() throws -> (WorkoutLogger, benchID: Int64) {
        let database = try AppDatabase.inMemory()
        try database.writer.write { db in
            try db.execute(sql: """
                INSERT INTO exercise (id, name, source, defaultEntryUnit, createdAt) VALUES (1, 'Bench Press (Barbell)', 'custom', 'lb', '2026-01-01');
                INSERT INTO exercise (id, name, source, createdAt) VALUES (2, 'Squat (Barbell)', 'custom', '2026-01-01');
                INSERT INTO workout (id, startedAt, endedAt, name, source) VALUES (1, '2026-01-01 10:00:00', '2026-01-01 11:00:00', 'Push', 'app');
                INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
                INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe) VALUES
                  (1, 0, 'warmup', 40, 'kg', 10, NULL), (1, 1, 'working', 61.23497, 'lb', 8, 8), (1, 2, 'working', 61.23497, 'lb', 7, 9);
                """)
        }
        return (WorkoutLogger(database: database), 1)
    }

    private func sets(_ logger: WorkoutLogger, entry: Int64) throws -> [WorkoutSet] {
        try logger.database.writer.read { db in
            try WorkoutSet.filter(Column("workoutExerciseId") == entry).order(Column("position")).fetchAll(db)
        }
    }

    @Test("Only one workout can be in progress")
    func singleActive() throws {
        let (logger, _) = try makeLogger()
        let id = try logger.start(name: "Push")
        #expect(try logger.activeWorkoutID() == id)
        #expect(throws: WorkoutLoggerError.workoutAlreadyInProgress(workoutID: id)) { try logger.start(name: "Again") }
    }

    @Test("Adding an exercise pre-fills last session's sets as planned, in the exercise's unit")
    func prefill() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        let entry = try logger.addExercise(bench, to: workout)
        let planned = try sets(logger, entry: entry)
        #expect(planned.map(\.kind) == [.warmup, .working, .working])
        #expect(planned.map(\.reps) == [10, 8, 7])
        #expect(planned.allSatisfy { !$0.isCompleted && $0.entryUnit == .pounds })
        #expect(planned[1].weightKilograms == 61.23497)
    }

    @Test("An exercise never done before gets one empty planned set")
    func emptyPrefill() throws {
        let (logger, _) = try makeLogger()
        let workout = try logger.start(name: "Legs")
        let entry = try logger.addExercise(2, to: workout)
        let planned = try sets(logger, entry: entry)
        #expect(planned.count == 1)
        #expect(planned[0].reps == 0)
        #expect(planned[0].entryUnit == .kilograms)
    }

    @Test("Completing sets records time and the rest since the previous completed set")
    func completion() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push", at: TestData.date(2026, 2, 1, 10))
        let entry = try logger.addExercise(bench, to: workout)
        let ids = try sets(logger, entry: entry).compactMap(\.id)
        let first = TestData.date(2026, 2, 1, 10).addingTimeInterval(60)
        try logger.setCompleted(ids[0], true, at: first)
        try logger.setCompleted(ids[1], true, at: first.addingTimeInterval(150))
        let done = try sets(logger, entry: entry)
        #expect(done[0].restBeforeSeconds == nil)
        #expect(done[1].restBeforeSeconds == 150)
        try logger.setCompleted(ids[1], false)
        #expect(try sets(logger, entry: entry)[1].completedAt == nil)
    }

    @Test("Updating a set validates the numbers and stores kg exactly with the typed unit")
    func update() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        let entry = try logger.addExercise(bench, to: workout)
        let id = try #require(try sets(logger, entry: entry)[1].id)
        try logger.updateSet(id, weight: Weight(140, unit: .pounds), entryUnit: .pounds, reps: 6, rpe: 8.5, kind: .working)
        let set = try sets(logger, entry: entry)[1]
        #expect(set.weightKilograms == 140 * WeightUnit.kilogramsPerPound)
        #expect(set.reps == 6)
        #expect(throws: WorkoutLoggerError.invalidReps(-1)) {
            try logger.updateSet(id, weight: Weight(kilograms: 50), entryUnit: .kilograms, reps: -1, rpe: nil, kind: .working)
        }
        #expect(throws: WorkoutLoggerError.invalidRPE(11)) {
            try logger.updateSet(id, weight: Weight(kilograms: 50), entryUnit: .kilograms, reps: 5, rpe: 11, kind: .working)
        }
    }

    @Test("Adding a set copies the last one; deleting closes the gap")
    func addAndDelete() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        let entry = try logger.addExercise(bench, to: workout)
        try logger.addSet(to: entry)
        var all = try sets(logger, entry: entry)
        #expect(all.count == 4)
        #expect(all[3].reps == 7)
        try logger.deleteSet(try #require(all[1].id))
        all = try sets(logger, entry: entry)
        #expect(all.map(\.position) == [0, 1, 2])
    }

    @Test("Exercises can be moved and removed; positions stay dense")
    func reorder() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Full")
        let benchEntry = try logger.addExercise(bench, to: workout)
        let squatEntry = try logger.addExercise(2, to: workout)
        try logger.moveExercise(squatEntry, to: 0)
        let order = try logger.database.writer.read { db in
            try Int64.fetchAll(db, sql: "SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position", arguments: [workout])
        }
        #expect(order == [squatEntry, benchEntry])
        try logger.removeExercise(squatEntry)
        let positions = try logger.database.writer.read { db in
            try Int.fetchAll(db, sql: "SELECT position FROM workoutExercise WHERE workoutId = ?", arguments: [workout])
        }
        #expect(positions == [0])
    }

    @Test("Finishing drops planned sets and empty exercises, and ends the workout")
    func finish() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        let entry = try logger.addExercise(bench, to: workout)
        _ = try logger.addExercise(2, to: workout)
        let ids = try sets(logger, entry: entry).compactMap(\.id)
        try logger.setCompleted(ids[1], true)
        let result = try logger.finish(workout, at: TestData.date(2026, 2, 1, 11))
        #expect(result == .init(workoutID: workout, completedSets: 1, droppedSets: 3))
        try logger.database.writer.read { db in
            let finished = try #require(try Workout.fetchOne(db, key: workout))
            #expect(!finished.isInProgress)
            #expect(finished.endedAt == TestData.date(2026, 2, 1, 11))
            #expect(try WorkoutExercise.filter(Column("workoutId") == workout).fetchCount(db) == 1)
            #expect(try WorkoutSet.fetchOne(db, key: ids[1])?.position == 0)
        }
        #expect(try logger.activeWorkoutID() == nil)
    }

    @Test("Finishing with nothing completed deletes the workout")
    func finishEmpty() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        _ = try logger.addExercise(bench, to: workout)
        let result = try logger.finish(workout)
        #expect(result.workoutID == nil)
        #expect(try logger.database.writer.read { db in try Workout.fetchOne(db, key: workout) } == nil)
    }

    @Test("The live snapshot pairs each exercise with last time's sets; history hides the active workout")
    func liveSnapshot() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        _ = try logger.addExercise(bench, to: workout)
        try logger.database.writer.read { db in
            let snapshot = try #require(try LiveWorkout.snapshot(workoutID: workout, db))
            #expect(snapshot.entries.count == 1)
            #expect(snapshot.entries[0].previous.map(\.reps) == [10, 8, 7])
            #expect(try WorkoutHistory.summaries(db).map(\.id) == [1])
        }
    }

    @Test("Previous performance ignores planned sets and the workout in progress")
    func previousIgnoresPlanned() throws {
        let (logger, bench) = try makeLogger()
        let workout = try logger.start(name: "Push")
        _ = try logger.addExercise(bench, to: workout)
        let previous = try logger.database.writer.read { db in try PreviousPerformance.sets(exerciseID: bench, db) }
        #expect(previous.count == 3)
    }
}
