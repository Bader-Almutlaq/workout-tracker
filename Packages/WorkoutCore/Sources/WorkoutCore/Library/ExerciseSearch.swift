import Foundation

/// In-memory exercise search over the whole library plus the user's custom exercises.
///
/// About 600 entries are indexed once; ``results(for:filter:now:)`` runs on every keystroke
/// and ``suggestions(forName:limit:)`` maps imported names to the closest entries.
/// Everything is normalised with ``SearchText``, so slang ("rdl", "db"), plurals and
/// minor typos are handled identically for queries, names and aliases.
public struct ExerciseSearch: Sendable {
    /// One searchable exercise: the library or custom exercise as it exists in the database.
    public struct Entry: Sendable, Hashable, Identifiable {
        /// Database row id of the exercise.
        public var id: Int64
        /// Display name, e.g. "Lateral Raise (Dumbbell)".
        public var name: String
        /// Other names and slang that should also find this exercise.
        public var aliases: [String]
        /// What it is performed with; nil for custom exercises without equipment.
        public var equipment: Equipment?
        /// Prime movers. ``Filter/muscle`` matches these only.
        public var primaryMuscles: [Muscle]
        /// Synergists; shown but not filtered on.
        public var secondaryMuscles: [Muscle]
        /// True for exercises the user created.
        public var isCustom: Bool
        /// Number of workouts the exercise appears in; drives ordering of otherwise equal matches.
        public var usageCount: Int
        /// When it was last logged; nil if never.
        public var lastUsedAt: Date?

        /// Creates an entry; every field is stored as given.
        public init(
            id: Int64,
            name: String,
            aliases: [String] = [],
            equipment: Equipment? = nil,
            primaryMuscles: [Muscle] = [],
            secondaryMuscles: [Muscle] = [],
            isCustom: Bool = false,
            usageCount: Int = 0,
            lastUsedAt: Date? = nil
        ) {
            self.id = id
            self.name = name
            self.aliases = aliases
            self.equipment = equipment
            self.primaryMuscles = primaryMuscles
            self.secondaryMuscles = secondaryMuscles
            self.isCustom = isCustom
            self.usageCount = usageCount
            self.lastUsedAt = lastUsedAt
        }
    }

    /// Narrows a search to part of the library. The default value lets everything through.
    public struct Filter: Sendable, Equatable {
        /// Keeps entries whose PRIMARY muscles include this one.
        public var muscle: Muscle?
        /// Keeps entries performed with this equipment.
        public var equipment: Equipment?
        /// Keeps only user-created exercises.
        public var customOnly: Bool

        /// Creates a filter; with no arguments it is "no filter".
        public init(muscle: Muscle? = nil, equipment: Equipment? = nil, customOnly: Bool = false) {
            self.muscle = muscle
            self.equipment = equipment
            self.customOnly = customOnly
        }

        func allows(_ entry: Entry) -> Bool {
            if let muscle, !entry.primaryMuscles.contains(muscle) { return false }
            if let equipment, entry.equipment != equipment { return false }
            if customOnly, !entry.isCustom { return false }
            return true
        }
    }

    /// How well a query token matched a field token. Raw values are the strict-mode score
    /// for one token; ``Tuning/suggestionWeight`` gives the soft-mode weight.
    enum MatchKind: Double {
        case fuzzy = 10
        case prefix = 20
        case exact = 30

        /// Share of a token a suggestion match is worth, so an exact word beats a prefix or a typo.
        var suggestionWeight: Double {
            switch self {
            case .exact: Tuning.exactSuggestionWeight
            case .prefix: Tuning.prefixSuggestionWeight
            case .fuzzy: Tuning.fuzzySuggestionWeight
            }
        }
    }

    /// Every score and threshold in one place. All are heuristics tuned by hand against the
    /// bundled library (see `ExerciseSearchTests`); no published source applies.
    enum Tuning {
        /// Heuristic: query tokens shorter than this only match whole words ("a" must not match everything).
        static let minimumPrefixLength = 2
        /// Heuristic: shortest query token that tolerates a typo; shorter words differ too easily ("bar" vs "bat").
        static let minimumFuzzyLength = 4
        /// Heuristic: longest query token that still allows only one typo.
        static let singleTypoMaximumLength = 7
        /// Heuristic: typos allowed in a token up to ``singleTypoMaximumLength`` letters.
        static let shortTokenTypos = 1
        /// Heuristic: typos allowed in longer tokens.
        static let longTokenTypos = 2
        /// Heuristic: a multi-word query must have at least this many letters once joined to match inside a name ("pull down" in "pulldown").
        static let minimumSubstringLength = 4

        /// Heuristic: field whose whole text equals the query; large enough to beat every other term.
        static let exactNameBonus = 1000.0
        /// Heuristic: name beginning with the query words, last one possibly partial ("lat pull" for "Lat Pulldown").
        static let namePrefixBonus = 500.0
        /// Heuristic: alias equal to the query; below a name hit because aliases are shared by sibling variants.
        static let exactAliasBonus = 300.0
        /// Heuristic: alias beginning with the query.
        static let aliasPrefixBonus = 150.0
        /// Heuristic: any match on the name beats an alias-only match; roughly the value of a name starting with the query's first word.
        static let nameMatchBonus = 200.0
        /// Heuristic: score of a match found only by removing separators ("pull down" for "Pulldown"); about one fuzzy token.
        static let substringMatchScore = 15.0
        /// Heuristic: points lost per word of the field the query did not mention, so "Lateral Raise (Dumbbell)" beats "Seated Lateral Raise (Dumbbell)".
        static let unmatchedTokenPenalty = 3.0
        /// Heuristic: points per doubling of `usageCount + 1`; 100 uses is worth about 27 points, enough to reorder siblings but not to beat a better word match.
        static let usageScale = 4.0
        /// Heuristic: bonus for an exercise used within ``recencyWindow``.
        static let recencyBonus = 6.0
        /// Heuristic: how recent counts as "recently used" (30 days).
        static let recencyWindow: TimeInterval = 30 * 24 * 60 * 60

        /// Heuristic: soft-mode weight of an exact word.
        static let exactSuggestionWeight = 1.0
        /// Heuristic: soft-mode weight of a word that only starts like the entry's ("under" for "underhand").
        static let prefixSuggestionWeight = 0.9
        /// Heuristic: soft-mode weight of a typo match.
        static let fuzzySuggestionWeight = 0.8
        /// Heuristic: multiplier on a suggestion matched through an alias, so that a name matching equally well wins
        /// ("high to low crossover" must not outrank a real "Low to High Cable Crossover").
        static let aliasSuggestionFactor = 0.95
        /// Heuristic: suggestions scoring below this are noise; a single shared word out of six words per side scores about 0.17, two out of five about 0.4.
        static let minimumSuggestionScore = 0.34
    }

    /// Searchable text of one name or alias: tokens plus the equipment words, so an alias such as
    /// "palms up wrist curl" still matches a query that adds "dumbbell".
    private struct Field: Sendable {
        /// Tokens of the text itself followed by any equipment tokens it lacks.
        var tokens: [String]
        /// How many leading ``tokens`` came from the text itself.
        var ownTokenCount: Int
        /// ``tokens`` concatenated, for matching across a space ("pull down").
        var joined: String
        /// Only the text's own tokens concatenated, for exact equality ignoring spaces.
        var ownJoined: String
        var isName: Bool

        init(text: String, equipmentTokens: [String], isName: Bool) {
            let own = SearchText.tokens(text)
            tokens = own + equipmentTokens.filter { !own.contains($0) }
            ownTokenCount = own.count
            joined = tokens.joined()
            ownJoined = own.joined()
            self.isName = isName
        }

        var ownTokens: ArraySlice<String> { tokens.prefix(ownTokenCount) }
    }

    private struct Indexed: Sendable {
        var entry: Entry
        var fields: [Field]
    }

    private let indexed: [Indexed]

    /// Indexes `entries` (normalising names and aliases once) for fast repeated searches.
    public init(entries: [Entry]) {
        indexed = entries.map { entry in
            // Bodyweight has no word in the name, so adding one would only dilute matches.
            let equipmentTokens = entry.equipment.flatMap { $0 == .bodyweight ? nil : SearchText.tokens($0.displayName) } ?? []
            let fields = [Field(text: entry.name, equipmentTokens: equipmentTokens, isName: true)]
                + entry.aliases.map { Field(text: $0, equipmentTokens: equipmentTokens, isName: false) }
            return Indexed(entry: entry, fields: fields)
        }
    }

    // MARK: Strict search

    /// Entries matching `query`, best first, for the search box.
    ///
    /// An empty query returns every entry passing `filter`, most used first, then by name.
    /// Otherwise an entry matches when every query token matches a token of its name, or
    /// every query token matches a token of one alias (see ``SearchText`` for normalisation).
    /// A query token matches by equality, by prefix (tokens of two or more letters), or
    /// within one typo (four or more letters) or two typos (eight or more), including a typo
    /// in the first letters of a longer word. A multi-word query also matches when its words,
    /// joined, appear inside the joined name ("pull down" finds "Pulldown").
    ///
    /// Ranking: exact name, then name starting with the query, then name over alias matches,
    /// then exact over prefix over typo matches, then a boost for usage count and recent use
    /// (`now` decides what is recent). Ties go to the shorter name, then alphabetical order.
    public func results(for query: String, filter: Filter = .init(), now: Date = .now) -> [Entry] {
        let candidates = indexed.filter { filter.allows($0.entry) }
        let queryTokens = SearchText.tokens(query)
        guard !queryTokens.isEmpty else {
            return candidates.map(\.entry).sorted { lhs, rhs in
                if lhs.usageCount != rhs.usageCount { return lhs.usageCount > rhs.usageCount }
                return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
            }
        }

        let queryJoined = queryTokens.joined()
        var scored: [(entry: Entry, score: Double)] = []
        for candidate in candidates {
            let relevance = candidate.fields.compactMap { Self.fieldScore($0, queryTokens: queryTokens, queryJoined: queryJoined) }.max()
            guard let relevance else { continue }
            scored.append((candidate.entry, relevance + Self.popularityScore(candidate.entry, now: now)))
        }
        return scored.sorted { lhs, rhs in
            if lhs.score != rhs.score { return lhs.score > rhs.score }
            if lhs.entry.name.count != rhs.entry.name.count { return lhs.entry.name.count < rhs.entry.name.count }
            return lhs.entry.name.localizedCaseInsensitiveCompare(rhs.entry.name) == .orderedAscending
        }.map(\.entry)
    }

    /// Relevance of one field to the query, or nil when the field does not match.
    private static func fieldScore(_ field: Field, queryTokens: [String], queryJoined: String) -> Double? {
        var score = 0.0
        var everyTokenMatched = true
        for token in queryTokens {
            guard let kind = bestMatch(of: token, in: field.tokens) else {
                everyTokenMatched = false
                break
            }
            score += kind.rawValue
        }
        if !everyTokenMatched {
            guard queryTokens.count > 1,
                  queryJoined.count >= Tuning.minimumSubstringLength,
                  field.joined.contains(queryJoined)
            else { return nil }
            score = Tuning.substringMatchScore
        }

        let isExact = Array(field.ownTokens) == queryTokens || field.ownJoined == queryJoined
        if isExact {
            score += field.isName ? Tuning.exactNameBonus : Tuning.exactAliasBonus
        } else if startsWith(field, queryTokens: queryTokens) {
            score += field.isName ? Tuning.namePrefixBonus : Tuning.aliasPrefixBonus
        }
        if field.isName { score += Tuning.nameMatchBonus }
        let unmatched = max(0, field.ownTokenCount - queryTokens.count)
        return score - Double(unmatched) * Tuning.unmatchedTokenPenalty
    }

    /// True when the field's own tokens begin with the query tokens, the last one possibly partial.
    private static func startsWith(_ field: Field, queryTokens: [String]) -> Bool {
        guard queryTokens.count <= field.ownTokenCount else { return false }
        for (index, token) in queryTokens.enumerated() {
            let fieldToken = field.tokens[index]
            let isLast = index == queryTokens.count - 1
            if isLast ? !fieldToken.hasPrefix(token) : fieldToken != token { return false }
        }
        return true
    }

    private static func popularityScore(_ entry: Entry, now: Date) -> Double {
        var score = Tuning.usageScale * log2(1 + Double(max(0, entry.usageCount)))
        if let last = entry.lastUsedAt, now.timeIntervalSince(last) <= Tuning.recencyWindow {
            score += Tuning.recencyBonus
        }
        return score
    }

    // MARK: Soft matching

    /// The entries closest to an imported exercise name, best first, at most `limit`.
    ///
    /// For names that do not match any entry exactly, such as "Low To High Single Arm Cable Cross Over".
    /// Not every word has to match. The score is Dice-style coverage:
    /// (query words matched + entry words matched) / (query words + entry words), with a
    /// prefix match worth 0.9 of a word and a typo match 0.8. Adjacent query words may be
    /// joined to match one entry word ("cross" + "over" = "crossover") and the reverse. The
    /// best of the name and each alias counts (an alias match is worth 0.95 of the same match on the name), and the equipment word counts like any other.
    /// Entries scoring below 0.34 are not returned.
    public func suggestions(forName name: String, limit: Int = 3) -> [Entry] {
        let queryTokens = SearchText.tokens(name)
        guard !queryTokens.isEmpty, limit > 0 else { return [] }
        var scored: [(entry: Entry, score: Double)] = []
        for candidate in indexed {
            let score = candidate.fields.map {
                Self.coverage(queryTokens: queryTokens, fieldTokens: $0.tokens) * ($0.isName ? 1 : Tuning.aliasSuggestionFactor)
            }.max() ?? 0
            if score >= Tuning.minimumSuggestionScore { scored.append((candidate.entry, score)) }
        }
        return scored.sorted { lhs, rhs in
            if lhs.score != rhs.score { return lhs.score > rhs.score }
            if lhs.entry.name.count != rhs.entry.name.count { return lhs.entry.name.count < rhs.entry.name.count }
            return lhs.entry.name.localizedCaseInsensitiveCompare(rhs.entry.name) == .orderedAscending
        }.prefix(limit).map(\.entry)
    }

    /// Dice coverage in 0...1 of `queryTokens` by `fieldTokens`; each field token is used at most once.
    private static func coverage(queryTokens: [String], fieldTokens: [String]) -> Double {
        var used = [Bool](repeating: false, count: fieldTokens.count)
        var queryCredit = 0.0
        var fieldCredit = 0.0
        var index = 0
        while index < queryTokens.count {
            let token = queryTokens[index]
            if index + 1 < queryTokens.count {
                let pair = token + queryTokens[index + 1]
                if let slot = fieldTokens.indices.first(where: { !used[$0] && fieldTokens[$0] == pair }) {
                    used[slot] = true
                    queryCredit += 2
                    fieldCredit += 1
                    index += 2
                    continue
                }
            }
            index += 1

            var best: (slot: Int, kind: MatchKind)?
            for slot in fieldTokens.indices where !used[slot] {
                guard let kind = matchKind(of: token, against: fieldTokens[slot]) else { continue }
                if let current = best, current.kind.rawValue >= kind.rawValue { continue }
                best = (slot, kind)
            }
            if best?.kind != .exact,
               let slot = fieldTokens.indices.dropLast().first(where: { !used[$0] && !used[$0 + 1] && fieldTokens[$0] + fieldTokens[$0 + 1] == token }) {
                used[slot] = true
                used[slot + 1] = true
                queryCredit += 1
                fieldCredit += 2
            } else if let best {
                used[best.slot] = true
                queryCredit += best.kind.suggestionWeight
                fieldCredit += best.kind.suggestionWeight
            }
        }
        return (queryCredit + fieldCredit) / Double(queryTokens.count + fieldTokens.count)
    }

    // MARK: Token matching

    /// The strongest way `queryToken` matches any of `fieldTokens`, or nil.
    private static func bestMatch(of queryToken: String, in fieldTokens: [String]) -> MatchKind? {
        var best: MatchKind?
        for fieldToken in fieldTokens {
            guard let kind = matchKind(of: queryToken, against: fieldToken) else { continue }
            if kind == .exact { return .exact }
            if let current = best, current.rawValue >= kind.rawValue { continue }
            best = kind
        }
        return best
    }

    /// How `queryToken` matches `fieldToken`: equal, prefix of it, or within the typo allowance
    /// of the whole token or of its prefix of the same length ("bayseian" ~ "bayesian", "latteral" ~ "lateral").
    private static func matchKind(of queryToken: String, against fieldToken: String) -> MatchKind? {
        if queryToken == fieldToken { return .exact }
        let length = queryToken.count
        if length >= Tuning.minimumPrefixLength, fieldToken.hasPrefix(queryToken) { return .prefix }
        guard length >= Tuning.minimumFuzzyLength else { return nil }
        let limit = length <= Tuning.singleTypoMaximumLength ? Tuning.shortTokenTypos : Tuning.longTokenTypos
        if SearchText.editDistance(queryToken, fieldToken, limit: limit) != nil { return .fuzzy }
        if fieldToken.count > length,
           SearchText.editDistance(queryToken, String(fieldToken.prefix(length)), limit: limit) != nil {
            return .fuzzy
        }
        return nil
    }
}
