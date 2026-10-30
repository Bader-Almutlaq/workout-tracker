import Foundation
import GRDB

/// Read-only queries behind the Exercises tab, exercise pickers and the Strong matching screen.
public enum ExerciseCatalog {
    /// One exercise with everything its detail screen shows.
    public struct Detail: Sendable, Equatable {
        /// One past session of this exercise, for the "Recent" list.
        public struct Session: Sendable, Equatable, Identifiable {
            public var workoutID: Int64
            public var startedAt: Date
            /// Sets other than warm-ups.
            public var workSetCount: Int
            /// The heaviest non-warm-up set (ties: more reps), or `nil` if the session had only warm-ups.
            public var topSet: WorkoutSet?
            public var id: Int64 { workoutID }
        }

        public var exercise: Exercise
        public var primaryMuscles: [Muscle]
        public var secondaryMuscles: [Muscle]
        /// Built-in slang plus names merged into this exercise.
        public var aliases: [String]
        public var workoutCount: Int
        public var setCount: Int
        public var firstUsedAt: Date?
        public var lastUsedAt: Date?
        /// Newest first, at most ``recentSessionLimit``.
        public var recentSessions: [Session]
    }

    /// An imported Strong exercise not yet matched to the library.
    public struct UnmatchedImport: Sendable, Equatable, Identifiable {
        public var exercise: Exercise
        public var workoutCount: Int
        public var setCount: Int
        public var id: Int64? { exercise.id }
    }

    /// How many sessions the detail screen lists.
    public static let recentSessionLimit = 10

    /// Search entries for every exercise that isn't archived.
    ///
    /// - Parameter library: supplies the built-in aliases of library exercises; pass `nil` to omit them.
    public static func entries(library: ExerciseLibrary?, _ db: Database) throws -> [ExerciseSearch.Entry] {
        let rows = try Row.fetchAll(db, sql: """
            SELECT e.id, e.name, e.equipment, e.source, e.libraryKey,
                   COUNT(DISTINCT we.workoutId) AS usageCount, MAX(w.startedAt) AS lastUsedAt
            FROM exercise e
            LEFT JOIN workoutExercise we ON we.exerciseId = e.id
            LEFT JOIN workout w ON w.id = we.workoutId
            WHERE e.isArchived = 0
            GROUP BY e.id
            """)
        let muscles = try musclesByExercise(db)
        let storedAliases = try aliasesByExercise(db)
        let libraryAliases = libraryAliasesByKey(library)

        return rows.map { row in
            let id: Int64 = row["id"]
            let libraryKey: String? = row["libraryKey"]
            let source = RecordSource(rawValue: row["source"]) ?? .custom
            return ExerciseSearch.Entry(
                id: id,
                name: row["name"],
                aliases: (libraryKey.flatMap { libraryAliases[$0] } ?? []) + (storedAliases[id] ?? []),
                equipment: (row["equipment"] as String?).flatMap(Equipment.init(rawValue:)),
                primaryMuscles: muscles[id]?.primary ?? [],
                secondaryMuscles: muscles[id]?.secondary ?? [],
                isCustom: source != .library,
                usageCount: row["usageCount"],
                lastUsedAt: row["lastUsedAt"]
            )
        }
    }

    /// ``entries(library:_:)``, re-delivered whenever exercises, aliases or logged workouts change.
    public static func observeEntries(
        in database: AppDatabase, library: ExerciseLibrary?
    ) -> some AsyncSequence<[ExerciseSearch.Entry], any Error> {
        ValueObservation.tracking { db in try entries(library: library, db) }.values(in: database.writer)
    }

    /// One exercise in full, or `nil` if it no longer exists.
    public static func detail(exerciseID: Int64, library: ExerciseLibrary?, _ db: Database) throws -> Detail? {
        guard let exercise = try Exercise.fetchOne(db, key: exerciseID) else { return nil }
        let muscles = try musclesByExercise(db, exerciseID: exerciseID)[exerciseID]
        let libraryAliases = exercise.libraryKey.flatMap { libraryAliasesByKey(library)[$0] } ?? []
        let stored = try aliasesByExercise(db)[exerciseID] ?? []

        let usage = try Row.fetchOne(db, sql: """
            SELECT COUNT(DISTINCT we.workoutId) AS workouts, COUNT(s.id) AS sets,
                   MIN(w.startedAt) AS first, MAX(w.startedAt) AS last
            FROM workoutExercise we
            JOIN workout w ON w.id = we.workoutId
            LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id
            WHERE we.exerciseId = ?
            """, arguments: [exerciseID])

        return Detail(
            exercise: exercise,
            primaryMuscles: muscles?.primary ?? [],
            secondaryMuscles: muscles?.secondary ?? [],
            aliases: libraryAliases + stored,
            workoutCount: usage?["workouts"] ?? 0,
            setCount: usage?["sets"] ?? 0,
            firstUsedAt: usage?["first"],
            lastUsedAt: usage?["last"],
            recentSessions: try recentSessions(exerciseID: exerciseID, db)
        )
    }

    /// ``detail(exerciseID:library:_:)``, re-delivered on every change.
    public static func observeDetail(
        exerciseID: Int64, in database: AppDatabase, library: ExerciseLibrary?
    ) -> some AsyncSequence<Detail?, any Error> {
        ValueObservation.tracking { db in try detail(exerciseID: exerciseID, library: library, db) }.values(in: database.writer)
    }

    /// Imported Strong exercises not yet matched to the library, most used first.
    public static func unmatchedImports(_ db: Database) throws -> [UnmatchedImport] {
        let rows = try Row.fetchAll(db, sql: """
            SELECT e.id, COUNT(DISTINCT we.workoutId) AS workouts, COUNT(s.id) AS sets
            FROM exercise e
            LEFT JOIN workoutExercise we ON we.exerciseId = e.id
            LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id
            WHERE e.source = ?
            GROUP BY e.id
            ORDER BY sets DESC, e.name
            """, arguments: [RecordSource.strong.rawValue])
        let exercises = try Exercise.fetchAll(db, keys: rows.map { $0["id"] as Int64 })
        let byID = Dictionary(uniqueKeysWithValues: exercises.compactMap { exercise in exercise.id.map { ($0, exercise) } })
        return rows.compactMap { row in
            byID[row["id"]].map { UnmatchedImport(exercise: $0, workoutCount: row["workouts"], setCount: row["sets"]) }
        }
    }

    /// ``unmatchedImports(_:)``, re-delivered on every change.
    public static func observeUnmatchedImports(in database: AppDatabase) -> some AsyncSequence<[UnmatchedImport], any Error> {
        ValueObservation.tracking(unmatchedImports).values(in: database.writer)
    }

    // MARK: - Private

    private static func musclesByExercise(
        _ db: Database, exerciseID: Int64? = nil
    ) throws -> [Int64: (primary: [Muscle], secondary: [Muscle])] {
        var request = ExerciseMuscle.all()
        if let exerciseID { request = request.filter(Column("exerciseId") == exerciseID) }
        var result: [Int64: (primary: [Muscle], secondary: [Muscle])] = [:]
        for link in try request.fetchAll(db) {
            switch link.role {
            case .primary: result[link.exerciseId, default: ([], [])].primary.append(link.muscleId)
            case .secondary: result[link.exerciseId, default: ([], [])].secondary.append(link.muscleId)
            }
        }
        return result.mapValues { ($0.primary.sorted(), $0.secondary.sorted()) }
    }

    private static func aliasesByExercise(_ db: Database) throws -> [Int64: [String]] {
        Dictionary(grouping: try ExerciseAlias.order(Column("alias")).fetchAll(db), by: \.exerciseId)
            .mapValues { $0.map(\.alias) }
    }

    private static func libraryAliasesByKey(_ library: ExerciseLibrary?) -> [String: [String]] {
        Dictionary(uniqueKeysWithValues: (library?.exercises ?? []).map { ($0.key, $0.aliases) })
    }

    private static func recentSessions(exerciseID: Int64, _ db: Database) throws -> [Detail.Session] {
        let rows = try Row.fetchAll(db, sql: """
            SELECT w.id AS workoutID, w.startedAt, we.id AS entryID
            FROM workoutExercise we JOIN workout w ON w.id = we.workoutId
            WHERE we.exerciseId = ?
            ORDER BY w.startedAt DESC
            LIMIT ?
            """, arguments: [exerciseID, recentSessionLimit])
        let entryIDs: [Int64] = rows.map { $0["entryID"] }
        let sets = try WorkoutSet.filter(entryIDs.contains(Column("workoutExerciseId"))).fetchAll(db)
        let setsByEntry = Dictionary(grouping: sets, by: \.workoutExerciseId)

        var sessions: [Detail.Session] = []
        for row in rows {
            let workoutID: Int64 = row["workoutID"]
            let work = (setsByEntry[row["entryID"]] ?? []).filter { $0.kind.isWork }
            let top = work.max { ($0.weightKilograms, $0.reps) < ($1.weightKilograms, $1.reps) }
            if let index = sessions.firstIndex(where: { $0.workoutID == workoutID }) {
                // The same exercise twice in one workout: merge into one session.
                sessions[index].workSetCount += work.count
                if let top, top.weightKilograms > sessions[index].topSet?.weightKilograms ?? -1 { sessions[index].topSet = top }
            } else {
                sessions.append(Detail.Session(workoutID: workoutID, startedAt: row["startedAt"], workSetCount: work.count, topSet: top))
            }
        }
        return sessions
    }
}
