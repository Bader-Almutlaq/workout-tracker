import Foundation

/// Text normalisation shared by every exercise search, so a query and an exercise name
/// are always reduced to comparable tokens the same way.
enum SearchText {
    /// Fixed parameters of the normalisation rules.
    enum Rules {
        /// A token must be longer than this to lose a trailing "s", so "abs" and "ups" stay whole.
        static let maximumLengthKeptPlural = 3
        /// Characters dropped without splitting the word, so "farmer's" becomes "farmers"
        /// instead of the stray one-letter token "s".
        static let joiningCharacters: Set<Character> = ["'", "\u{2019}"]
    }

    /// Splits `text` into lowercase, accent-free word tokens.
    ///
    /// Steps: fold case and diacritics; treat every character that is not a letter or digit
    /// as a separator; expand gym slang via ``GymSlang`` (one token may become several);
    /// then singularise. Edge cases: empty or all-punctuation text gives no tokens.
    /// - Returns: Tokens in reading order, duplicates kept.
    static func tokens(_ text: String) -> [String] {
        let folded = text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil).lowercased()
        var words: [String] = []
        var current = ""
        for character in folded {
            if character.isLetter || character.isNumber {
                current.append(character)
            } else if Rules.joiningCharacters.contains(character) {
                continue
            } else if !current.isEmpty {
                words.append(current)
                current = ""
            }
        }
        if !current.isEmpty { words.append(current) }
        return words.flatMap { GymSlang.expansions[$0] ?? [$0] }.map(singularised)
    }

    /// Drops one trailing "s" from tokens longer than three letters that do not end in "ss":
    /// "raises" → "raise", "triceps" → "tricep", but "press" and "abs" are unchanged.
    static func singularised(_ token: String) -> String {
        guard token.count > Rules.maximumLengthKeptPlural,
              token.hasSuffix("s"),
              !token.hasSuffix("ss")
        else { return token }
        return String(token.dropLast())
    }

    /// Optimal-string-alignment distance between `a` and `b`: the fewest single-character
    /// insertions, deletions, substitutions and adjacent transpositions that turn one into the other.
    ///
    /// Cheap by design for per-keystroke use: returns `nil` as soon as the distance is
    /// certain to exceed `limit` (length difference, or every cell of two consecutive rows over the limit).
    /// - Parameter limit: Largest distance worth reporting; negative values never match.
    /// - Returns: The distance, or `nil` when it is greater than `limit`.
    static func editDistance(_ a: String, _ b: String, limit: Int) -> Int? {
        guard limit >= 0 else { return nil }
        let left = Array(a.unicodeScalars)
        let right = Array(b.unicodeScalars)
        guard abs(left.count - right.count) <= limit else { return nil }
        if left.isEmpty || right.isEmpty {
            let distance = max(left.count, right.count)
            return distance <= limit ? distance : nil
        }

        var beforePrevious = [Int](repeating: 0, count: right.count + 1)
        var previous = Array(0...right.count)
        var current = [Int](repeating: 0, count: right.count + 1)
        var previousRowMinimum = 0
        for i in 1...left.count {
            current[0] = i
            var rowMinimum = i
            for j in 1...right.count {
                let substitutionCost = left[i - 1] == right[j - 1] ? 0 : 1
                var value = min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + substitutionCost)
                if i > 1, j > 1, left[i - 1] == right[j - 2], left[i - 2] == right[j - 1] {
                    value = min(value, beforePrevious[j - 2] + 1)
                }
                current[j] = value
                rowMinimum = min(rowMinimum, value)
            }
            // A transposition reads two rows back, so one bad row is not yet proof.
            if min(rowMinimum, previousRowMinimum) > limit { return nil }
            previousRowMinimum = rowMinimum
            (beforePrevious, previous, current) = (previous, current, beforePrevious)
        }
        let distance = previous[right.count]
        return distance <= limit ? distance : nil
    }
}
