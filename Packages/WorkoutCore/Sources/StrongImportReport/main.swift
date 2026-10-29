// Prints what importing a Strong export would do, without touching any database.
// Usage: swift run StrongImportReport <export folder or strong_workouts.csv>
//
// For checking the importer against the owner's real file, which tests must
// never read (see AGENTS.md).

import Foundation
import WorkoutCore

let arguments = CommandLine.arguments.dropFirst()
guard let path = arguments.first else {
    print("Usage: StrongImportReport <export folder or strong_workouts.csv>")
    exit(2)
}

let url = URL(filePath: path)
var isDirectory: ObjCBool = false
FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
let files = isDirectory.boolValue
    ? try FileManager.default.contentsOfDirectory(at: url, includingPropertiesForKeys: nil).filter { $0.pathExtension == "csv" }
    : [url]

var rows: [StrongRow] = []
var measurements: [BodyMeasurement] = []
for file in files.sorted(by: { $0.lastPathComponent < $1.lastPathComponent }) {
    let text = try String(contentsOf: file, encoding: .utf8)
    if StrongMeasurementsFile.matches(try CSVTable(parsing: text)) {
        measurements += try StrongMeasurementsFile.parse(text)
    } else {
        rows += try StrongWorkoutsFile.parse(text)
    }
}

let plan = StrongImportPlan.make(rows: rows, measurements: measurements)
let totals = plan.totals
let dateStyle = Date.FormatStyle(date: .abbreviated, time: .omitted)
func kg(_ value: Double) -> String {
    Weight(kilograms: value).displayValue(in: .kilograms).formatted(.number.precision(.fractionLength(0...2)))
}

print("""
    Rows read:        \(rows.count)
    Workouts:         \(totals.workouts)
    Sets:             \(totals.sets) (\(totals.workSets) excluding warm-ups)
    Volume:           \(kg(totals.volumeKilograms)) kg
    Dates:            \(totals.firstDate?.formatted(dateStyle) ?? "-") → \(totals.lastDate?.formatted(dateStyle) ?? "-")
    Measurements:     \(measurements.count) across \(Set(measurements.map(\.site)).count) sites
    Rest-timer rows:  \(totals.skippedRestTimerRows) skipped

    Exercises written in pounds (kg votes / lb votes):
    """)
for exercise in plan.exercises where exercise.columnUnit == .pounds {
    print("  \(exercise.name): \(exercise.verdict.kilogramVotes)/\(exercise.verdict.poundVotes)")
}
print("Exercises in kg with any lb votes:")
for exercise in plan.exercises where exercise.columnUnit == .kilograms && exercise.verdict.poundVotes > 0 {
    print("  \(exercise.name): \(exercise.verdict.kilogramVotes)/\(exercise.verdict.poundVotes)")
}

print("\nSuspicious sets: \(plan.findings.count)")
for finding in plan.findings {
    guard let context = plan.setsByLine[finding.id] else { continue }
    let set = context.set
    let suggestion = finding.suggestion.map { " → maybe \(kg($0))" } ?? ""
    print("  line \(finding.id) \(context.workoutStartedAt.formatted(dateStyle)) \(context.exerciseName): \(kg(set.weightKilograms)) kg × \(set.reps) — \(finding.issue.rawValue), typical \(kg(finding.typical))\(suggestion)")
}
