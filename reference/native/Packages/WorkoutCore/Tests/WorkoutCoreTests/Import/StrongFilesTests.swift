import Foundation
import Testing
@testable import WorkoutCore

@Suite("Strong export files")
struct StrongFilesTests {
    @Test("Older layout: rows, set orders, durations, notes and quoted names")
    func olderLayout() throws {
        let rows = try StrongWorkoutsFile.parse(StrongFixtures.olderLayout, timeZone: StrongFixtures.utc)
        #expect(rows.count == 6)
        #expect(rows[0].workoutName == "Push, heavy")
        #expect(rows[0].content == .set(order: "W"))
        #expect(rows[0].durationSeconds == 4020.0)  // 1h 7m
        #expect(rows[0].workoutNotes == "Felt good")
        #expect(rows[0].rpe == nil)
        #expect(rows[1].weightValue == 61.23)
        #expect(rows[1].line == 3)
        #expect(rows[5].content == .set(order: "D"))
    }

    @Test("Newer layout: semicolons, Note and Rest Timer rows, decimal RPE")
    func newerLayout() throws {
        let rows = try StrongWorkoutsFile.parse(StrongFixtures.newerLayout, timeZone: StrongFixtures.utc)
        #expect(rows.map(\.content) == [.set(order: "1"), .note, .restTimer, .set(order: "2")])
        #expect(rows[0].rpe == 8.5)
        #expect(rows[0].durationSeconds == 3600)
        #expect(rows[1].notes == "Use the wide bar")
    }

    @Test("Durations in every format Strong uses", arguments: [
        ("1h 7m", 4020.0), ("59m", 3540.0), ("45s", 45.0), ("3600", 3600.0),
    ])
    func durations(text: String, seconds: Double) {
        #expect(StrongWorkoutsFile.parseDuration(text) == seconds)
    }

    @Test("Missing columns and bad dates are reported with their line")
    func errors() {
        #expect(throws: ImportError.missingColumn("Exercise Name")) {
            try StrongWorkoutsFile.parse("Date,Workout Name,Set Order\n")
        }
        let badDate = "Date,Workout Name,Exercise Name,Set Order\n01/02/2024,A,B,1"
        #expect(throws: ImportError.invalidValue(column: "Date", value: "01/02/2024", line: 2)) {
            try StrongWorkoutsFile.parse(badDate)
        }
    }

    @Test("Measurements: site slugs and inches converted to centimetres")
    func measurements() throws {
        let values = try StrongMeasurementsFile.parse(StrongFixtures.waist, timeZone: StrongFixtures.utc)
        #expect(values.map(\.site) == ["waist", "waist"])
        #expect(values[0].value == 78)
        #expect(abs(values[1].value - 78.74) < 1e-9)
        #expect(StrongMeasurementsFile.siteSlug("Left Bicep") == "left-bicep")
        #expect(StrongMeasurementsFile.siteSlug("Body Weight") == BodyMeasurement.bodyweightSite)
    }
}
