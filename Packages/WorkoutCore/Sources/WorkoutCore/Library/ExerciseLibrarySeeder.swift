import Foundation
import GRDB

/// Copies the built-in ``ExerciseLibrary`` into the database, so exercises can be
/// logged, searched and counted per muscle with plain SQL.
///
/// Runs at every launch but does work only when the library version changed.
/// It never deletes rows and never touches the owner's history, archive flags or
/// entry units. For each library exercise it:
/// 1. finds the row already linked by `libraryKey`, or else a row with the same
///    name (case-insensitive) or alias, and links it: this is how a Strong exercise called exactly
///    "Squat (Barbell)" becomes the library's squat without a merge;
/// 2. otherwise inserts a new row;
/// 3. rewrites the library-owned fields (name, equipment, pattern, mechanic,
///    lengthened flag, tracking) and its muscle links.
public enum ExerciseLibrarySeeder {
    /// What one seeding run did.
    public struct Result: Sendable, Equatable {
        public var inserted = 0
        public var linked = 0
        public var updated = 0
        /// `true` when the stored version already matched and nothing ran.
        public var skipped = false
    }

    /// Seeds `library` into `database` if its version differs from the stored one.
    @discardableResult
    public static func seed(_ library: ExerciseLibrary, into database: AppDatabase) throws -> Result {
        let result = try database.writer.write { db -> Result in
            if try AppSetting.seededLibraryVersion.value(db) == String(library.version) {
                return Result(skipped: true)
            }
            var result = Result()
            for entry in library.exercises {
                try seed(entry, db, result: &result)
            }
            try AppSetting.seededLibraryVersion.set(String(library.version), db)
            return result
        }
        if !result.skipped {
            Log.database.notice(
                "Library v\(library.version) seeded: \(result.inserted) new, \(result.linked) linked, \(result.updated) updated"
            )
        }
        return result
    }

    private static func seed(_ entry: LibraryExercise, _ db: Database, result: inout Result) throws {
        var exercise: Exercise
        if let linked = try Exercise.filter(Column("libraryKey") == entry.key).fetchOne(db) {
            exercise = linked
            result.updated += 1
        } else if let id = try ExerciseNameResolver.exerciseID(named: entry.name, db),
                  let sameName = try Exercise.fetchOne(db, key: id), sameName.libraryKey == nil {
            exercise = sameName
            exercise.source = .library
            exercise.libraryKey = entry.key
            result.linked += 1
        } else {
            exercise = Exercise(name: entry.name, source: .library, libraryKey: entry.key)
            result.inserted += 1
        }

        if exercise.name.caseInsensitiveCompare(entry.name) != .orderedSame,
           try ExerciseNameResolver.exerciseID(named: entry.name, db) != nil {
            // A renamed library entry collides with another row's name; keep the old name rather than fail the seed.
            Log.database.error("Library rename to \(entry.name, privacy: .public) skipped: name in use")
        } else {
            exercise.name = entry.name
        }
        exercise.equipment = entry.equipment
        exercise.movementPattern = entry.pattern
        exercise.mechanic = entry.mechanic
        exercise.isLengthenedBiased = entry.isLengthenedBiased
        exercise.tracking = entry.tracking
        try exercise.save(db)

        guard let exerciseID = exercise.id else { return }
        try ExerciseMuscle.filter(Column("exerciseId") == exerciseID).deleteAll(db)
        for muscle in entry.primaryMuscles {
            try ExerciseMuscle(exerciseId: exerciseID, muscle: muscle, role: .primary).insert(db)
        }
        for muscle in entry.secondaryMuscles {
            try ExerciseMuscle(exerciseId: exerciseID, muscle: muscle, role: .secondary).insert(db)
        }
    }
}
