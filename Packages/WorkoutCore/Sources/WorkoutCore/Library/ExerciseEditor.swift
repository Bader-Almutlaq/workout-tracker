import Foundation
import GRDB

/// Every change the owner makes to the exercise list: create, edit, archive and merge.
///
/// Library exercises are read-only (they are rewritten on each library update);
/// custom and unmatched Strong exercises can be edited.
public struct ExerciseEditor: Sendable {
    public let database: AppDatabase
    /// Where the snapshot taken before a merge goes.
    public let snapshotDirectory: URL?

    public init(database: AppDatabase, snapshotDirectory: URL?) {
        self.database = database
        self.snapshotDirectory = snapshotDirectory
    }

    /// Creates a custom exercise. Returns its ID.
    @discardableResult
    public func create(_ draft: CustomExerciseDraft) throws -> Int64 {
        let draft = try validated(draft)
        return try database.writer.write { db in
            try ensureNameFree(draft.name, except: nil, db)
            var exercise = Exercise(name: draft.name, source: .custom)
            apply(draft, to: &exercise)
            try exercise.insert(db)
            guard let id = exercise.id else { throw ExerciseEditError.notFound }
            try replaceMuscles(of: id, with: draft, db)
            return id
        }
    }

    /// Edits a custom or Strong exercise. Its history is untouched.
    public func update(_ exerciseID: Int64, with draft: CustomExerciseDraft) throws {
        let draft = try validated(draft)
        try database.writer.write { db in
            guard var exercise = try Exercise.fetchOne(db, key: exerciseID) else { throw ExerciseEditError.notFound }
            guard exercise.libraryKey == nil else { throw ExerciseEditError.libraryExerciseIsReadOnly }
            try ensureNameFree(draft.name, except: exerciseID, db)
            apply(draft, to: &exercise)
            if exercise.source == .strong { exercise.source = .custom }
            try exercise.update(db)
            try replaceMuscles(of: exerciseID, with: draft, db)
        }
    }

    /// Hides or shows an exercise in search and pickers. History is kept either way.
    public func setArchived(_ isArchived: Bool, exerciseID: Int64) throws {
        try database.writer.write { db in
            try db.execute(sql: "UPDATE exercise SET isArchived = ? WHERE id = ?", arguments: [isArchived, exerciseID])
        }
    }

    /// Moves all history of `sourceID` onto `targetID`, then removes the source.
    ///
    /// Used to match an imported Strong exercise to a library one. The source's
    /// name (and any aliases it had) become aliases of the target, so future
    /// imports of that name land on the target. If the target had no history,
    /// it adopts the source's entry unit. A snapshot is written first.
    /// - Returns: The number of workout entries moved.
    @discardableResult
    public func merge(_ sourceID: Int64, into targetID: Int64) throws -> Int {
        guard sourceID != targetID else { throw ExerciseEditError.mergeIntoItself }
        if let snapshotDirectory {
            let url = try AppDatabase.writeSnapshot(of: database.writer, into: snapshotDirectory)
            Log.database.notice("Pre-merge snapshot: \(url.lastPathComponent, privacy: .public)")
        }
        return try database.writer.write { db in
            guard let source = try Exercise.fetchOne(db, key: sourceID),
                  var target = try Exercise.fetchOne(db, key: targetID) else { throw ExerciseEditError.notFound }

            let targetHasHistory = try WorkoutExercise.filter(Column("exerciseId") == targetID).fetchCount(db) > 0
            if !targetHasHistory {
                target.defaultEntryUnit = source.defaultEntryUnit
                try target.update(db)
            }
            try db.execute(sql: "UPDATE workoutExercise SET exerciseId = ? WHERE exerciseId = ?", arguments: [targetID, sourceID])
            let moved = db.changesCount
            try db.execute(sql: "UPDATE exerciseAlias SET exerciseId = ? WHERE exerciseId = ?", arguments: [targetID, sourceID])
            try ExerciseAlias(alias: source.name, exerciseId: targetID).insert(db, onConflict: .replace)
            try Exercise.deleteOne(db, key: sourceID)
            Log.database.notice("Merged \(source.name, privacy: .public) into \(target.name, privacy: .public): \(moved) entries")
            return moved
        }
    }

    // MARK: - Private

    private func validated(_ draft: CustomExerciseDraft) throws -> CustomExerciseDraft {
        var draft = draft
        draft.name = draft.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !draft.name.isEmpty else { throw ExerciseEditError.emptyName }
        guard !draft.primaryMuscles.isEmpty else { throw ExerciseEditError.noPrimaryMuscle }
        draft.secondaryMuscles.removeAll { draft.primaryMuscles.contains($0) }
        return draft
    }

    private func ensureNameFree(_ name: String, except exerciseID: Int64?, _ db: Database) throws {
        if let existing = try ExerciseNameResolver.exerciseID(named: name, db), existing != exerciseID {
            throw ExerciseEditError.nameInUse(name)
        }
    }

    private func apply(_ draft: CustomExerciseDraft, to exercise: inout Exercise) {
        exercise.name = draft.name
        exercise.equipment = draft.equipment
        exercise.movementPattern = draft.pattern
        exercise.mechanic = draft.mechanic
        exercise.isLengthenedBiased = draft.isLengthenedBiased
        exercise.tracking = draft.tracking
    }

    private func replaceMuscles(of exerciseID: Int64, with draft: CustomExerciseDraft, _ db: Database) throws {
        try ExerciseMuscle.filter(Column("exerciseId") == exerciseID).deleteAll(db)
        for muscle in draft.primaryMuscles {
            try ExerciseMuscle(exerciseId: exerciseID, muscle: muscle, role: .primary).insert(db)
        }
        for muscle in draft.secondaryMuscles {
            try ExerciseMuscle(exerciseId: exerciseID, muscle: muscle, role: .secondary).insert(db)
        }
    }
}
