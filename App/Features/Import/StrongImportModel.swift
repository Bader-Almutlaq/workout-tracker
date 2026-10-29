import Foundation
import Observation
import WorkoutCore

/// Drives the Strong import: read the picked files, build a reviewable plan,
/// apply the owner's decisions, then write it to the database.
///
/// Parsing and planning run off the main thread (23k rows take a moment).
@MainActor
@Observable
final class StrongImportModel {
    enum Phase: Equatable {
        case pickingFiles
        case working(String)
        case reviewing
        case finished(StrongImporter.Result)
        case failed(String)
    }

    /// Suspicious sets from one exercise in one session, reviewed together.
    struct FindingGroup: Identifiable {
        struct Item: Identifiable {
            var finding: SetPlausibility.Finding
            var set: StrongImportPlan.PlannedSet
            var id: Int { finding.id }
        }

        var id: String
        var date: Date
        var exerciseName: String
        var items: [Item]
    }

    private(set) var phase: Phase = .pickingFiles
    private(set) var plan: StrongImportPlan?
    private(set) var options = StrongImportOptions()
    private(set) var sourceFileNames: [String] = []

    private var rows: [StrongRow] = []
    private var measurements: [BodyMeasurement] = []
    private let importer: StrongImporter

    init(importer: StrongImporter) {
        self.importer = importer
    }

    /// Exercises the export writes in pounds, shown first in the review because they're the surprising ones.
    var poundExercises: [StrongImportPlan.ExerciseOverview] {
        plan?.exercises.filter { $0.columnUnit == .pounds || $0.isOverridden } ?? []
    }

    /// Findings grouped by session and exercise, oldest first.
    var findingGroups: [FindingGroup] {
        guard let plan else { return [] }
        let items = plan.findings.compactMap { finding -> (StrongImportPlan.SetContext, FindingGroup.Item)? in
            guard let context = plan.setsByLine[finding.id] else { return nil }
            return (context, FindingGroup.Item(finding: finding, set: context.set))
        }
        let grouped = Dictionary(grouping: items) { context, _ in "\(context.workoutStartedAt.timeIntervalSince1970)|\(context.exerciseName)" }
        return grouped.map { key, pairs in
            FindingGroup(id: key, date: pairs[0].0.workoutStartedAt, exerciseName: pairs[0].0.exerciseName, items: pairs.map(\.1))
        }
        .sorted { $0.date < $1.date }
    }

    /// Number of sets the owner has corrected or confirmed.
    var reviewedCount: Int { options.corrections.count + options.confirmedLines.count }

    // MARK: - Loading

    /// Reads the files picked in the Files app. Measurement files are recognised by their header.
    func load(_ urls: [URL]) {
        phase = .working("Reading files…")
        sourceFileNames = urls.map(\.lastPathComponent).sorted()
        Task {
            let result = await Task.detached { () -> Result<([StrongRow], [BodyMeasurement]), any Error> in
                Result {
                    var rows: [StrongRow] = []
                    var measurements: [BodyMeasurement] = []
                    for url in urls {
                        let didStart = url.startAccessingSecurityScopedResource()
                        defer { if didStart { url.stopAccessingSecurityScopedResource() } }
                        let text = try String(contentsOf: url, encoding: .utf8)
                        if StrongMeasurementsFile.matches(try CSVTable(parsing: text)) {
                            measurements += try StrongMeasurementsFile.parse(text)
                        } else {
                            rows += try StrongWorkoutsFile.parse(text)
                        }
                    }
                    return (rows, measurements)
                }
            }.value

            switch result {
            case .success(let (rows, measurements)) where rows.isEmpty && measurements.isEmpty:
                phase = .failed("No workouts or measurements were found in the chosen files.")
            case .success(let (rows, measurements)):
                self.rows = rows
                self.measurements = measurements
                await rebuild()
            case .failure(let error):
                Log.importer.error("Reading export failed: \(error.localizedDescription, privacy: .public)")
                phase = .failed(error.localizedDescription)
            }
        }
    }

    // MARK: - Review decisions

    /// Sets which unit an exercise's column is in.
    func setColumnUnit(_ unit: WeightUnit, for exerciseName: String) {
        options.unitOverrides[exerciseName] = unit
        Task { await rebuild() }
    }

    /// Accepts the suggested correction for `item`.
    func applySuggestion(_ item: FindingGroup.Item) {
        guard let suggestion = item.finding.suggestion else { return }
        options.corrections[item.id] = correction(for: item.finding.issue, value: suggestion)
        Task { await rebuild() }
    }

    /// Accepts the suggestion for every item in `group` that has one, and keeps the rest.
    func applySuggestions(in group: FindingGroup) {
        for item in group.items {
            if let suggestion = item.finding.suggestion {
                options.corrections[item.id] = correction(for: item.finding.issue, value: suggestion)
            } else {
                options.confirmedLines.insert(item.id)
            }
        }
        Task { await rebuild() }
    }

    /// Marks the sets as correct as logged.
    func keep(_ items: [FindingGroup.Item]) {
        options.confirmedLines.formUnion(items.map(\.id))
        Task { await rebuild() }
    }

    /// Replaces a set's weight (typed in `unit`) or reps with the owner's own value.
    func correct(_ item: FindingGroup.Item, weight: Double?, unit: WeightUnit, reps: Int?) {
        options.corrections[item.id] = StrongImportOptions.Correction(
            weightKilograms: weight.map { Weight($0, unit: unit).kilograms }, reps: reps
        )
        Task { await rebuild() }
    }

    /// Clears every review decision.
    func resetDecisions() {
        options = StrongImportOptions()
        Task { await rebuild() }
    }

    // MARK: - Import

    /// Writes the reviewed plan to the database.
    func importNow() {
        guard let plan else { return }
        phase = .working("Importing \(plan.totals.workouts) workouts…")
        let importer = importer
        Task {
            let result = await Task.detached { Result { try importer.importPlan(plan) } }.value
            switch result {
            case .success(let counts): phase = .finished(counts)
            case .failure(let error):
                Log.importer.error("Import failed: \(error.localizedDescription, privacy: .public)")
                phase = .failed("Nothing was imported. \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Private

    private func rebuild() async {
        let rows = rows, measurements = measurements, options = options
        if plan == nil { phase = .working("Checking \(rows.count) sets…") }
        let plan = await Task.detached { StrongImportPlan.make(rows: rows, measurements: measurements, options: options) }.value
        // Ignore stale results if the owner changed a decision meanwhile.
        guard options == self.options else { return }
        self.plan = plan
        phase = .reviewing
    }

    private func correction(for issue: SetPlausibility.Issue, value: Double) -> StrongImportOptions.Correction {
        switch issue {
        case .repsTooHigh, .zeroReps: .init(reps: Int(value.rounded()))
        case .weightTooHigh, .weightTooLow: .init(weightKilograms: value)
        }
    }
}

extension StrongImportModel: Identifiable {
    /// Lets the model drive `.sheet(item:)`: each new model is a new sheet.
    nonisolated var id: ObjectIdentifier { ObjectIdentifier(self) }
}
