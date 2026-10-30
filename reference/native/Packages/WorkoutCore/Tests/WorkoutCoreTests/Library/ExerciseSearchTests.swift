import Foundation
import Testing
@testable import WorkoutCore

struct ExerciseSearchTests {
    // MARK: Fixture

    private static func entry(
        _ id: Int64,
        _ name: String,
        aliases: [String] = [],
        equipment: Equipment? = nil,
        primary: [Muscle] = [],
        custom: Bool = false,
        usage: Int = 0,
        lastUsed: Date? = nil
    ) -> ExerciseSearch.Entry {
        ExerciseSearch.Entry(
            id: id, name: name, aliases: aliases, equipment: equipment, primaryMuscles: primary,
            isCustom: custom, usageCount: usage, lastUsedAt: lastUsed
        )
    }

    private static let now = Date(timeIntervalSince1970: 1_800_000_000)

    private static let fixture: [ExerciseSearch.Entry] = [
        entry(1, "Lateral Raise (Dumbbell)", equipment: .dumbbell, primary: [.sideDelt]),
        entry(2, "Lateral Raise (Cable)", equipment: .cable, primary: [.sideDelt]),
        entry(3, "Seated Lateral Raise (Dumbbell)", equipment: .dumbbell, primary: [.sideDelt]),
        entry(4, "Bayesian Curl (Cable)", aliases: ["bayesian cable curl"], equipment: .cable, primary: [.biceps]),
        entry(5, "Romanian Deadlift (Barbell)", aliases: ["rdl"], equipment: .barbell, primary: [.hamstrings, .glutes]),
        entry(6, "Romanian Deadlift (Dumbbell)", aliases: ["rdl"], equipment: .dumbbell, primary: [.hamstrings, .glutes]),
        entry(7, "Lat Pulldown (Cable)", equipment: .cable, primary: [.lats]),
        entry(8, "Pulldown (Machine)", equipment: .machine, primary: [.lats]),
        entry(9, "Pull Up", equipment: .bodyweight, primary: [.lats]),
        entry(10, "Triceps Pushdown (Cable - Rope)", equipment: .cable, primary: [.triceps]),
        entry(11, "Wrist Curl (Dumbbell)", aliases: ["palms up wrist curl"], equipment: .dumbbell, primary: [.forearmFlexors]),
        entry(12, "My Cable Thing", equipment: .cable, primary: [.chest], custom: true),
        entry(13, "Cable Crossover", equipment: .cable, primary: [.chest]),
        entry(14, "Bench Press (Barbell)", equipment: .barbell, primary: [.chest]),
        entry(15, "Bench Dip", equipment: .bodyweight, primary: [.triceps]),
    ]

    private static func names(_ entries: [ExerciseSearch.Entry]) -> [String] { entries.map(\.name) }

    private let search = ExerciseSearch(entries: ExerciseSearchTests.fixture)

    // MARK: Strict search

    @Test func exactNameBeatsLongerNames() {
        let found = search.results(for: "pull up", now: Self.now)
        #expect(found.first?.name == "Pull Up")
    }

    @Test func slangAndTyposAndPluralsStillFind() {
        #expect(search.results(for: "latteral raises db", now: Self.now).first?.name == "Lateral Raise (Dumbbell)")
        #expect(search.results(for: "bayseian", now: Self.now).first?.name == "Bayesian Curl (Cable)")
        #expect(search.results(for: "bay", now: Self.now).first?.name == "Bayesian Curl (Cable)")
        #expect(search.results(for: "triceps", now: Self.now).first?.name == "Triceps Pushdown (Cable - Rope)")
    }

    @Test func aliasMatchesWhenNameDoesNot() {
        let found = search.results(for: "rdl", now: Self.now)
        #expect(Self.names(found).prefix(2).sorted() == ["Romanian Deadlift (Barbell)", "Romanian Deadlift (Dumbbell)"])
        #expect(search.results(for: "palms up", now: Self.now).first?.name == "Wrist Curl (Dumbbell)")
    }

    @Test func spaceInsideAWordStillMatches() {
        let found = Self.names(search.results(for: "pull down", now: Self.now))
        #expect(found.contains("Lat Pulldown (Cable)"))
        #expect(found.contains("Pulldown (Machine)"))
        #expect(found.first == "Pulldown (Machine)")
    }

    @Test func everyQueryTokenMustMatch() {
        #expect(search.results(for: "lateral squat", now: Self.now).isEmpty)
        #expect(search.results(for: "zzzz", now: Self.now).isEmpty)
    }

    @Test func singleLetterTokensOnlyMatchWholeWords() {
        #expect(search.results(for: "b", now: Self.now).isEmpty)
    }

    @Test func fewerExtraWordsRankHigher() {
        let found = search.results(for: "lateral raise dumbbell", now: Self.now)
        #expect(Self.names(found) == ["Lateral Raise (Dumbbell)", "Seated Lateral Raise (Dumbbell)"])
    }

    @Test func equipmentWordsMatchEvenWhenNameLacksThem() {
        let custom = ExerciseSearch(entries: [Self.entry(1, "Zottman Curl", equipment: .dumbbell)])
        #expect(custom.results(for: "dumbbell zottman", now: Self.now).count == 1)
    }

    @Test func usageBoostReordersOtherwiseEqualMatches() {
        let unused = [
            Self.entry(1, "Curl (Cable)", equipment: .cable),
            Self.entry(2, "Curl (Band)", equipment: .band),
        ]
        #expect(Self.names(ExerciseSearch(entries: unused).results(for: "curl", now: Self.now)) == ["Curl (Band)", "Curl (Cable)"])
        var used = unused
        used[0].usageCount = 30
        #expect(Self.names(ExerciseSearch(entries: used).results(for: "curl", now: Self.now)) == ["Curl (Cable)", "Curl (Band)"])
    }

    @Test func recentUseBreaksTies() {
        let recent = Self.now.addingTimeInterval(-3 * 86_400)
        let old = Self.now.addingTimeInterval(-90 * 86_400)
        let entries = [
            Self.entry(1, "Curl (Cable)", equipment: .cable, lastUsed: old),
            Self.entry(2, "Curl (Band)", equipment: .band, lastUsed: recent),
        ]
        #expect(Self.names(ExerciseSearch(entries: entries).results(for: "curl", now: Self.now)).first == "Curl (Band)")
    }

    @Test func usageDoesNotBeatABetterWordMatch() {
        let entries = [
            Self.entry(1, "Row (Cable)", equipment: .cable, usage: 200),
            Self.entry(2, "Rowing Machine", equipment: .machine),
        ]
        #expect(ExerciseSearch(entries: entries).results(for: "row", now: Self.now).first?.name == "Row (Cable)")
        #expect(ExerciseSearch(entries: entries).results(for: "rowing", now: Self.now).first?.name == "Rowing Machine")
    }

    @Test func emptyQueryListsEverythingByUsageThenName() {
        let entries = [
            Self.entry(1, "bravo"),
            Self.entry(2, "Alpha"),
            Self.entry(3, "Charlie", usage: 5),
        ]
        let ordered = ExerciseSearch(entries: entries)
        #expect(Self.names(ordered.results(for: "", now: Self.now)) == ["Charlie", "Alpha", "bravo"])
        #expect(Self.names(ordered.results(for: "   ", now: Self.now)) == ["Charlie", "Alpha", "bravo"])
    }

    // MARK: Filters

    @Test func muscleFilterMatchesPrimaryMusclesOnly() {
        var entries = Self.fixture
        entries.append(ExerciseSearch.Entry(id: 99, name: "Incline Press", primaryMuscles: [.chest], secondaryMuscles: [.triceps]))
        let search = ExerciseSearch(entries: entries)
        let triceps = search.results(for: "", filter: .init(muscle: .triceps), now: Self.now)
        #expect(Set(Self.names(triceps)) == ["Triceps Pushdown (Cable - Rope)", "Bench Dip"])
    }

    @Test func equipmentAndCustomFiltersCombineWithQuery() {
        let cable = search.results(for: "", filter: .init(equipment: .cable), now: Self.now)
        #expect(cable.allSatisfy { $0.equipment == .cable })
        #expect(cable.count == 6)
        let custom = search.results(for: "", filter: .init(customOnly: true), now: Self.now)
        #expect(Self.names(custom) == ["My Cable Thing"])
        let queried = search.results(for: "cable", filter: .init(muscle: .chest), now: Self.now)
        #expect(Set(Self.names(queried)) == ["My Cable Thing", "Cable Crossover"])
    }

    @Test func defaultFilterIsNoFilter() {
        #expect(ExerciseSearch.Filter() == ExerciseSearch.Filter(muscle: nil, equipment: nil, customOnly: false))
        #expect(search.results(for: "", now: Self.now).count == Self.fixture.count)
    }

    // MARK: Suggestions

    @Test func suggestionsJoinAdjacentWords() {
        let found = search.suggestions(forName: "Cable Cross Over")
        #expect(found.first?.name == "Cable Crossover")
    }

    @Test func suggestionsDropUnrelatedNames() {
        #expect(search.suggestions(forName: "Zercher Squat").isEmpty)
        #expect(search.suggestions(forName: "").isEmpty)
    }

    @Test func suggestionsRespectLimitAndOrder() {
        let found = search.suggestions(forName: "Lateral Raise Dumbbell", limit: 2)
        #expect(found.count == 2)
        #expect(found.first?.name == "Lateral Raise (Dumbbell)")
    }

    @Test func suggestionsUseAliasesAndEquipment() {
        let found = search.suggestions(forName: "Seated Palms Up Wrist Curl (Dumbbell)")
        #expect(found.first?.name == "Wrist Curl (Dumbbell)")
    }

    // MARK: Bundled library

    private static func bundledSearch() throws -> ExerciseSearch {
        let library = try ExerciseLibrary.bundled()
        let entries = library.exercises.enumerated().map { offset, exercise in
            ExerciseSearch.Entry(
                id: Int64(offset + 1), name: exercise.name, aliases: exercise.aliases, equipment: exercise.equipment,
                primaryMuscles: exercise.primaryMuscles, secondaryMuscles: exercise.secondaryMuscles
            )
        }
        return ExerciseSearch(entries: entries)
    }

    private func top(_ query: String, _ count: Int, in search: ExerciseSearch) -> [String] {
        Array(Self.names(search.results(for: query, now: Self.now)).prefix(count))
    }

    @Test func bundledLibrarySearchBehavesOnRealNames() throws {
        let search = try Self.bundledSearch()
        #expect(top("rdl", 3, in: search).contains("Romanian Deadlift (Barbell)"))
        #expect(top("bay", 5, in: search).contains("Bayesian Curl (Cable)"))
        #expect(top("latteral raise db", 1, in: search) == ["Lateral Raise (Dumbbell)"])
        #expect(top("ohp", 3, in: search).contains("Overhead Press (Barbell)"))
        let pulldowns = Self.names(search.results(for: "pull down", now: Self.now))
        #expect(pulldowns.prefix(5).allSatisfy { $0.localizedCaseInsensitiveContains("pulldown") })
        #expect(!pulldowns.isEmpty)
    }

    @Test func bundledLibrarySuggestionsMapImportedNames() throws {
        let search = try Self.bundledSearch()
        func best(_ name: String, _ count: Int = 1) -> [String] {
            Array(Self.names(search.suggestions(forName: name, limit: count)))
        }
        #expect(best("Bayesian Cable Curl").first == "Bayesian Curl (Cable)")
        #expect(best("Lat Machine Pull Over").first == "Pullover (Machine)")
        #expect(best("Low To High Single Arm Cable Cross Over").first == "Low to High Cable Crossover")
        #expect(best("Under Grip Row", 3).contains("Bent Over Row - Underhand (Barbell)"))
        #expect(best("Seated Palms Up Wrist Curl (Dumbbell)").first == "Wrist Curl (Dumbbell)")
        #expect(best("Reverse Forearm Extension").first?.hasPrefix("Reverse Wrist Curl") == true)
    }

    @Test func bundledLibraryEmptyQueryAndSearchSpeed() throws {
        let search = try Self.bundledSearch()
        #expect(search.results(for: "", now: Self.now).count > 400)
        let clock = ContinuousClock()
        let elapsed = clock.measure {
            for query in ["l", "la", "lat", "late", "latte", "latter", "latteral raise"] {
                _ = search.results(for: query, now: Self.now)
            }
        }
        #expect(elapsed < .milliseconds(500))
    }
}
