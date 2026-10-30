import Testing
@testable import WorkoutCore

@Suite("Weight conversion and entry-unit inference")
struct WeightTests {
    @Test("Pounds convert to kilograms with the exact 1959 factor")
    func poundsToKilograms() {
        #expect(Weight(135, unit: .pounds).kilograms == 135 * 0.45359237)
        #expect(Weight(100, unit: .kilograms).kilograms == 100)
    }

    @Test("Round trip kg → lb → kg is lossless")
    func roundTrip() {
        let weight = Weight(kilograms: 102.5)
        #expect(abs(Weight(weight.value(in: .pounds), unit: .pounds).kilograms - 102.5) < 1e-9)
    }

    @Test("Display snaps Strong's rounded conversions back to what was typed",
          arguments: [(61.23, 135.0), (49.9, 110.0), (47.17, 104.0), (27.22, 60.0)])
    func displaySnapsToTypedPounds(kilograms: Double, pounds: Double) {
        #expect(Weight(kilograms: kilograms).displayValue(in: .pounds) == pounds)
    }

    @Test("Display keeps non-round values to two decimals")
    func displayRoundsToHundredths() {
        #expect(Weight(kilograms: 20.4).displayValue(in: .pounds) == 44.97)
    }

    @Test("Round values are inferred as typed in the column's unit",
          arguments: [(0.0, WeightUnit.kilograms), (102.5, .kilograms), (61.25, .kilograms), (140.0, .pounds), (121.25, .pounds)])
    func infersColumnUnit(value: Double, column: WeightUnit) {
        #expect(Weight.inferredEntryUnit(value: value, columnUnit: column) == column)
    }

    @Test("In a kg column, Strong-converted whole pounds are inferred as typed in lb",
          arguments: [61.23, 49.9, 47.17, 27.22, 54.43])
    func infersPoundsInKilogramColumn(value: Double) {
        #expect(Weight.inferredEntryUnit(value: value, columnUnit: .kilograms) == .pounds)
    }

    @Test("In a lb column, Strong-converted kilograms are inferred as typed in kg",
          arguments: [99.21, 63.93, 35.27, 70.55, 119.05])
    func infersKilogramsInPoundColumn(value: Double) {
        #expect(Weight.inferredEntryUnit(value: value, columnUnit: .pounds) == .kilograms)
    }

    @Test("Values that fit neither grid are not guessed")
    func refusesToGuess() {
        #expect(Weight.inferredEntryUnit(value: 99.21, columnUnit: .kilograms) == nil)
        #expect(Weight.inferredEntryUnit(value: 41.3, columnUnit: .kilograms) == nil)
        #expect(Weight.inferredEntryUnit(value: 61.23, columnUnit: .pounds) == nil)
    }

    @Test("Toggle flips the unit")
    func toggle() {
        #expect(WeightUnit.kilograms.toggled == .pounds)
        #expect(WeightUnit.pounds.toggled == .kilograms)
    }
}
