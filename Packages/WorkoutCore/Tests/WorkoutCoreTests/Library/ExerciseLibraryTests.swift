import Foundation
import Testing
@testable import WorkoutCore

@Suite("Built-in exercise library")
struct ExerciseLibraryTests {
    @Test("The bundled file loads and passes validation")
    func bundledLoads() throws {
        let library = try ExerciseLibrary.bundled()
        #expect(library.exercises.count > 400)
        #expect(library.version >= 1)
    }

    @Test("Names follow Strong's style: bare for bodyweight, bracketed equipment otherwise")
    func naming() throws {
        let names = Set(try ExerciseLibrary.bundled().exercises.map(\.name))
        for expected in ["Squat (Barbell)", "Pull Up", "Pull Up (Weighted)", "Lateral Raise (Dumbbell)",
                         "Triceps Pushdown (Cable - Straight Bar)", "Hanging Leg Raise", "Calf Press on Leg Press"] {
            #expect(names.contains(expected), "missing \(expected)")
        }
    }

    @Test("Delts are split: lateral raise is side delt, reverse fly is rear delt")
    func deltSplit() throws {
        let byName = Dictionary(uniqueKeysWithValues: try ExerciseLibrary.bundled().exercises.map { ($0.name, $0) })
        #expect(byName["Lateral Raise (Dumbbell)"]?.primaryMuscles == [.sideDelt])
        #expect(byName["Reverse Fly (Machine)"]?.primaryMuscles == [.rearDelt])
        #expect(byName["Overhead Press (Barbell)"]?.primaryMuscles == [.frontDelt])
    }

    @Test("Variants inherit family fields and can override them")
    func variantOverrides() throws {
        let byName = Dictionary(uniqueKeysWithValues: try ExerciseLibrary.bundled().exercises.map { ($0.name, $0) })
        #expect(byName["Triceps Extension (Cable)"]?.isLengthenedBiased == true)
        #expect(byName["Triceps Extension (Machine)"]?.isLengthenedBiased == false)
        #expect(byName["Deadlift (Trap Bar)"]?.primaryMuscles.first == .quads)
        #expect(byName["Pull Up"]?.tracking == .bodyweightReps)
        #expect(byName["Plank"]?.tracking == .duration)
        #expect(byName["Chest Fly (Machine)"]?.aliases.contains("pec deck") == true)
    }

    @Test("Keys are stable slugs of the name")
    func keys() {
        #expect(ExerciseLibrary.key(forName: "Triceps Pushdown (Cable - Rope)") == "triceps-pushdown-cable-rope")
        #expect(ExerciseLibrary.key(forName: "Farmer's Walk (Dumbbell)") == "farmer-s-walk-dumbbell")
    }

    @Test("Duplicate names are rejected")
    func duplicates() {
        let json = #"{"version": 1, "families": [{"movement": "Row", "pattern": "horizontal-pull", "mechanic": "compound", "primary": ["lats"], "variants": ["cable", "cable"]}]}"#
        #expect(throws: ExerciseLibraryError.duplicateName("Row (Cable)")) { try ExerciseLibrary(json: Data(json.utf8)) }
    }

    @Test("A muscle can't be both primary and secondary")
    func overlap() {
        let json = #"{"version": 1, "families": [{"movement": "Row", "pattern": "horizontal-pull", "mechanic": "compound", "primary": ["lats"], "secondary": ["lats"], "variants": ["cable"]}]}"#
        #expect(throws: ExerciseLibraryError.muscleListedTwice(exercise: "Row (Cable)", muscle: .lats)) {
            try ExerciseLibrary(json: Data(json.utf8))
        }
    }

    @Test("Unknown muscle slugs fail to decode")
    func unknownMuscle() {
        let json = #"{"version": 1, "families": [{"movement": "Row", "pattern": "horizontal-pull", "mechanic": "compound", "primary": ["delts"], "variants": ["cable"]}]}"#
        #expect(throws: (any Error).self) { try ExerciseLibrary(json: Data(json.utf8)) }
    }
}
