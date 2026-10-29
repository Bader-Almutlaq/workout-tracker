import Foundation

/// Everything a Strong import would write, worked out in memory so the owner
/// can review it before anything touches the database.
///
/// Building a plan never fails: rows were already validated by the parsers.
/// Rebuild it with new ``StrongImportOptions`` whenever the owner changes a decision.
public struct StrongImportPlan: Sendable {
    /// A set ready to store, weights already in kilograms.
    public struct PlannedSet: Sendable, Equatable {
        /// Line in the export, for the review screen.
        public var line: Int
        public var position: Int
        public var kind: SetKind
        public var weightKilograms: Double
        public var entryUnit: WeightUnit
        public var reps: Int
        public var rpe: Double?
        public var durationSeconds: Double?
        public var distanceMeters: Double?
        public var notes: String?
        /// Whether the owner corrected this set in the review.
        public var isCorrected: Bool
    }

    /// One exercise entry within a workout.
    public struct PlannedExercise: Sendable, Equatable {
        public var name: String
        public var position: Int
        public var notes: String?
        public var sets: [PlannedSet]
    }

    /// One workout.
    public struct PlannedWorkout: Sendable, Equatable {
        /// "strong:" + the exported start timestamp; makes re-imports idempotent.
        public var sourceKey: String
        public var startedAt: Date
        public var endedAt: Date?
        public var name: String
        public var notes: String?
        public var exercises: [PlannedExercise]
    }

    /// Per-exercise overview for the review screen.
    public struct ExerciseOverview: Sendable, Equatable, Identifiable {
        public var name: String
        /// Unit the export writes this exercise in (resolved or overridden).
        public var columnUnit: WeightUnit
        /// What the resolver found, kept even when overridden.
        public var verdict: ExportUnitResolver.Verdict
        public var isOverridden: Bool
        public var setCount: Int
        public var firstDate: Date
        public var lastDate: Date
        public var id: String { name }
    }

    /// Totals for verifying the import against the file.
    public struct Totals: Sendable, Equatable {
        public var workouts = 0
        public var sets = 0
        public var workSets = 0
        /// Σ weight × reps over non-warm-up sets, in kilograms.
        public var volumeKilograms = 0.0
        public var firstDate: Date?
        public var lastDate: Date?
        /// Rest-timer rows skipped (newer exports only).
        public var skippedRestTimerRows = 0
    }

    public var workouts: [PlannedWorkout]
    public var exercises: [ExerciseOverview]
    /// Suspicious sets, minus those the owner confirmed or corrected.
    public var findings: [SetPlausibility.Finding]
    public var measurements: [BodyMeasurement]
    public var totals: Totals

    /// Builds the plan.
    /// - Parameters:
    ///   - rows: From ``StrongWorkoutsFile/parse(_:timeZone:)``.
    ///   - measurements: From ``StrongMeasurementsFile``; may be empty.
    ///   - options: The owner's review decisions.
    public static func make(
        rows: [StrongRow], measurements: [BodyMeasurement] = [], options: StrongImportOptions = .init()
    ) -> StrongImportPlan {
        let setRows = rows.filter { if case .set = $0.content { true } else { false } }
        let units = resolveUnits(setRows: setRows, overrides: options.unitOverrides)

        var totals = Totals()
        totals.skippedRestTimerRows = rows.count { $0.content == .restTimer }

        let workouts = groupIntoWorkouts(rows).map { workoutRows in
            makeWorkout(from: workoutRows, units: units, corrections: options.corrections)
        }
        for workout in workouts {
            totals.workouts += 1
            for set in workout.exercises.flatMap(\.sets) {
                totals.sets += 1
                if set.kind.isWork {
                    totals.workSets += 1
                    totals.volumeKilograms += set.weightKilograms * Double(set.reps)
                }
            }
        }
        totals.firstDate = workouts.map(\.startedAt).min()
        totals.lastDate = workouts.map(\.startedAt).max()

        return StrongImportPlan(
            workouts: workouts,
            exercises: makeOverviews(setRows: setRows, units: units, overrides: options.unitOverrides),
            findings: findings(in: workouts, excluding: options.confirmedLines),
            measurements: measurements,
            totals: totals
        )
    }

    // MARK: - Steps

    private static func resolveUnits(
        setRows: [StrongRow], overrides: [String: WeightUnit]
    ) -> [String: ExportUnitResolver.Verdict] {
        Dictionary(grouping: setRows, by: \.exerciseName).mapValues { rows in
            var verdict = ExportUnitResolver.resolve(values: rows.map(\.weightValue))
            if let override = overrides[rows[0].exerciseName] { verdict.columnUnit = override }
            return verdict
        }
    }

    /// Splits rows into workouts, keeping file order. Strong writes each
    /// workout's rows contiguously, keyed by its start timestamp.
    private static func groupIntoWorkouts(_ rows: [StrongRow]) -> [[StrongRow]] {
        var groups: [[StrongRow]] = []
        for row in rows {
            if let last = groups.last?.last, last.workoutKey == row.workoutKey {
                groups[groups.count - 1].append(row)
            } else {
                groups.append([row])
            }
        }
        return groups
    }

    private static func makeWorkout(
        from rows: [StrongRow], units: [String: ExportUnitResolver.Verdict],
        corrections: [Int: StrongImportOptions.Correction]
    ) -> PlannedWorkout {
        let first = rows[0]
        var exercises: [PlannedExercise] = []
        for row in rows where row.content != .restTimer {
            // A new exercise entry starts whenever the exercise name changes.
            if exercises.last?.name != row.exerciseName {
                exercises.append(PlannedExercise(name: row.exerciseName, position: exercises.count, notes: nil, sets: []))
            }
            let index = exercises.count - 1
            switch row.content {
            case .note:
                exercises[index].notes = [exercises[index].notes, row.notes].compactMap { $0 }.joined(separator: "\n").nilIfEmpty
            case .set(let order):
                let columnUnit = units[row.exerciseName]?.columnUnit ?? .kilograms
                exercises[index].sets.append(
                    makeSet(row, order: order, position: exercises[index].sets.count,
                            columnUnit: columnUnit, correction: corrections[row.line])
                )
            case .restTimer:
                break
            }
        }
        return PlannedWorkout(
            sourceKey: "strong:" + first.workoutKey,
            startedAt: first.startedAt,
            endedAt: first.durationSeconds.map { first.startedAt.addingTimeInterval($0) },
            name: first.workoutName,
            notes: rows.lazy.compactMap(\.workoutNotes).first,
            exercises: exercises.filter { !$0.sets.isEmpty || $0.notes != nil }
        )
    }

    private static func makeSet(
        _ row: StrongRow, order: String, position: Int, columnUnit: WeightUnit,
        correction: StrongImportOptions.Correction?
    ) -> PlannedSet {
        let kind: SetKind = switch order.uppercased() {
        case "W": .warmup
        case "D": .drop
        case "F": .failure
        default: .working
        }
        let exported = Weight(row.weightValue, unit: columnUnit)
        let entryUnit = Weight.inferredEntryUnit(value: row.weightValue, columnUnit: columnUnit) ?? columnUnit
        return PlannedSet(
            line: row.line,
            position: position,
            kind: kind,
            weightKilograms: correction?.weightKilograms ?? exported.kilograms,
            entryUnit: entryUnit,
            reps: correction?.reps ?? row.reps,
            rpe: row.rpe.flatMap { (1...10).contains($0) ? $0 : nil },
            durationSeconds: row.seconds,
            distanceMeters: row.distanceMeters,
            notes: row.notes,
            isCorrected: correction != nil
        )
    }

    private static func makeOverviews(
        setRows: [StrongRow], units: [String: ExportUnitResolver.Verdict], overrides: [String: WeightUnit]
    ) -> [ExerciseOverview] {
        Dictionary(grouping: setRows, by: \.exerciseName).compactMap { name, rows in
            guard let verdict = units[name] else { return nil }
            let dates = rows.map(\.startedAt)
            return ExerciseOverview(
                name: name,
                columnUnit: verdict.columnUnit,
                verdict: ExportUnitResolver.resolve(values: rows.map(\.weightValue)),
                isOverridden: overrides[name] != nil,
                setCount: rows.count,
                firstDate: dates.min() ?? .distantPast,
                lastDate: dates.max() ?? .distantPast
            )
        }
        .sorted { $0.setCount > $1.setCount }
    }

    private static func findings(in workouts: [PlannedWorkout], excluding confirmed: Set<Int>) -> [SetPlausibility.Finding] {
        // Corrected sets still serve as history for their neighbours; they just aren't reported.
        let sets = workouts.flatMap { workout in
            workout.exercises.flatMap { exercise in exercise.sets.map { (workout, exercise.name, $0) } }
        }
        let corrected = Set(sets.filter { $0.2.isCorrected }.map { $0.2.line })
        let observations = sets.map { workout, exerciseName, set in
            SetPlausibility.Observation(
                id: set.line, exerciseKey: exerciseName, sessionKey: workout.sourceKey,
                date: workout.startedAt, kind: set.kind, weightKilograms: set.weightKilograms, reps: set.reps
            )
        }
        return SetPlausibility.findings(in: observations).filter { !confirmed.contains($0.id) && !corrected.contains($0.id) }
    }
}
