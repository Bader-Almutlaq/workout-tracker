import Foundation
import GRDB

/// The "Is this right?" check for one set while it is being logged.
///
/// It runs the same rules as the import review (``SetPlausibility``), so there is one
/// definition of "suspicious". The only difference is the neighbours: while logging there
/// is no future, so the set is judged against the owner's most recent finished sessions of
/// that exercise only.
///
/// Heuristic (no literature applies); see ``SetPlausibility``.
public enum LiveSetCheck {
    /// The finding for a candidate set of `exerciseID`, judged against the owner's most recent
    /// finished sessions of that exercise (up to ``SetPlausibility/Threshold/neighbourSessions``,
    /// newest first, excluding `workoutID`).
    ///
    /// Only completed sets of finished workouts count as history; the workout being logged
    /// and planned (not yet completed) sets are ignored.
    ///
    /// - Parameters:
    ///   - weightKilograms: The typed load in kilograms.
    ///   - kind: Warm-ups are never flagged.
    ///   - workoutID: The workout being logged, if it should be left out of the history.
    /// - Returns: `nil` when the set looks normal, or when there are fewer than
    ///   ``SetPlausibility/Threshold/minimumNeighbourSessions`` past sessions to judge by.
    ///   A working set of zero reps is always reported (``SetPlausibility/Issue/zeroReps``),
    ///   as in the import review. ``SetPlausibility/Finding/id`` is 0: there is no line number.
    public static func finding(
        exerciseID: Int64, weightKilograms: Double, reps: Int, kind: SetKind,
        excludingWorkout workoutID: Int64?, _ db: Database
    ) throws -> SetPlausibility.Finding? {
        let candidate = SetPlausibility.Observation(
            id: 0, exerciseKey: "candidate", sessionKey: "candidate", date: .now, kind: kind,
            weightKilograms: weightKilograms, reps: reps
        )
        let past = try pastSessions(exerciseID: exerciseID, excludingWorkout: workoutID, db)
        return SetPlausibility.check(candidate, against: past)
    }

    /// The newest finished sessions of the exercise, each reduced the way the import review does.
    private static func pastSessions(
        exerciseID: Int64, excludingWorkout workoutID: Int64?, _ db: Database
    ) throws -> [SetPlausibility.SessionSummary] {
        let rows = try Row.fetchAll(db, sql: """
            SELECT w.id AS workoutId, w.startedAt, s.kind, s.weightKilograms, s.reps
            FROM workoutSet s
            JOIN workoutExercise we ON we.id = s.workoutExerciseId
            JOIN workout w ON w.id = we.workoutId
            WHERE we.exerciseId = ? AND s.isCompleted = 1 AND w.isInProgress = 0 AND w.id IS NOT ?
              AND w.id IN (
                  SELECT w2.id FROM workout w2
                  JOIN workoutExercise we2 ON we2.workoutId = w2.id
                  JOIN workoutSet s2 ON s2.workoutExerciseId = we2.id
                  WHERE we2.exerciseId = ? AND s2.isCompleted = 1 AND w2.isInProgress = 0 AND w2.id IS NOT ?
                  GROUP BY w2.id ORDER BY w2.startedAt DESC LIMIT ?
              )
            """, arguments: [
                exerciseID, workoutID, exerciseID, workoutID, SetPlausibility.Threshold.neighbourSessions
            ])
        // The table's CHECK constraint guarantees a valid kind, so compactMap drops nothing in practice.
        let observations = rows.enumerated().compactMap { index, row -> SetPlausibility.Observation? in
            guard let kind = SetKind(rawValue: row["kind"]) else { return nil }
            return SetPlausibility.Observation(
                id: index, exerciseKey: "history", sessionKey: String(row["workoutId"] as Int64),
                date: row["startedAt"], kind: kind, weightKilograms: row["weightKilograms"], reps: row["reps"]
            )
        }
        return SetPlausibility.SessionSummary.make(from: observations)
    }
}
