import Testing
@testable import WorkoutCore

struct SearchTextTests {
    @Test func lowercasesFoldsDiacriticsAndSplitsOnPunctuation() {
        #expect(SearchText.tokens("Triceps Pushdown (Cable - Rope)") == ["tricep", "pushdown", "cable", "rope"])
        #expect(SearchText.tokens("Café-Curl_2x") == ["cafe", "curl", "2x"])
        #expect(SearchText.tokens("  ,.- ").isEmpty)
        #expect(SearchText.tokens("").isEmpty)
    }

    @Test func apostrophesJoinInsteadOfSplitting() {
        #expect(SearchText.tokens("Farmer's Walk") == ["farmer", "walk"])
        #expect(SearchText.tokens("farmers walk") == ["farmer", "walk"])
    }

    @Test func singularisesOneTrailingSOnlyOnLongTokens() {
        #expect(SearchText.tokens("raises") == ["raise"])
        #expect(SearchText.tokens("triceps biceps lats") == ["tricep", "bicep", "lat"])
        #expect(SearchText.tokens("press") == ["press"])
        #expect(SearchText.tokens("abs") == ["abs"])
        #expect(SearchText.tokens("cross") == ["cross"])
        #expect(SearchText.tokens("dips") == ["dip"])
    }

    @Test func expandsSlangIntoSeveralTokens() {
        #expect(SearchText.tokens("RDL") == ["romanian", "deadlift"])
        #expect(SearchText.tokens("db row") == ["dumbbell", "row"])
        #expect(SearchText.tokens("OHP") == ["overhead", "press"])
        #expect(SearchText.tokens("pullups") == ["pull", "up"])
        #expect(SearchText.tokens("tris") == ["tricep"])
        #expect(SearchText.tokens("delts") == ["delt"])
    }

    @Test func latIsNotExpandedBecauseItIsAmbiguous() {
        #expect(SearchText.tokens("lat") == ["lat"])
    }

    @Test func queryAndNameNormaliseIdentically() {
        #expect(SearchText.tokens("Lateral Raise (Dumbbell)") == SearchText.tokens("lateral raises db"))
    }

    @Test func everySlangValueIsLowercase() {
        for (key, words) in GymSlang.expansions {
            #expect(key == key.lowercased())
            #expect(words.allSatisfy { $0 == $0.lowercased() && !$0.isEmpty })
        }
    }

    @Test func editDistanceCountsEditsAndTranspositions() {
        #expect(SearchText.editDistance("curl", "curl", limit: 2) == 0)
        #expect(SearchText.editDistance("curl", "curls", limit: 2) == 1)
        #expect(SearchText.editDistance("curl", "crul", limit: 2) == 1)
        #expect(SearchText.editDistance("bayseian", "bayesian", limit: 2) == 1)
        #expect(SearchText.editDistance("latteral", "lateral", limit: 2) == 1)
        #expect(SearchText.editDistance("kitten", "sitting", limit: 3) == 3)
    }

    @Test func editDistanceReturnsNilBeyondTheLimit() {
        #expect(SearchText.editDistance("kitten", "sitting", limit: 2) == nil)
        #expect(SearchText.editDistance("row", "squat", limit: 1) == nil)
        #expect(SearchText.editDistance("a", "abcd", limit: 2) == nil)
        #expect(SearchText.editDistance("curl", "curl", limit: -1) == nil)
    }

    @Test func editDistanceHandlesEmptyStrings() {
        #expect(SearchText.editDistance("", "", limit: 1) == 0)
        #expect(SearchText.editDistance("", "ab", limit: 2) == 2)
        #expect(SearchText.editDistance("ab", "", limit: 1) == nil)
    }
}
