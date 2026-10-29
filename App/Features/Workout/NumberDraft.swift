import Foundation

/// The text being typed into one cell on the number pad.
///
/// It only edits text: turning the text into a weight, rep count or RPE, and saving it, is
/// ``ActiveWorkoutModel``'s job. The first key pressed replaces the value the cell started with
/// (so typing "140" over "135" gives 140, not 135140), then keys append as usual.
struct NumberDraft: Equatable {
    /// Most characters a cell accepts, so a stuck key can't build an absurd number.
    private static let maximumLength = 7

    /// What the cell shows while it is being edited. Always uses "." as the decimal point.
    private(set) var text: String
    private let original: String
    private var replacesOnNextKey = true

    /// Starts a draft showing `text`, e.g. "135". Pass "" for an empty cell.
    init(text: String) {
        self.text = text
        self.original = text
    }

    /// Whether the text differs from what the cell started with; unchanged drafts are not saved.
    var hasChanged: Bool { text != original }

    /// The typed number, or `nil` when the text is empty.
    var value: Double? { Double(text) }

    /// Types one digit (0 to 9).
    mutating func append(digit: Int) {
        guard (0...9).contains(digit) else { return }
        startTypingIfNeeded()
        guard text.count < Self.maximumLength else { return }
        text = text == "0" ? String(digit) : text + String(digit)
    }

    /// Types the decimal point; ignored when the text already has one.
    mutating func appendDecimalPoint() {
        startTypingIfNeeded()
        guard !text.contains("."), text.count < Self.maximumLength else { return }
        text = text.isEmpty ? "0." : text + "."
    }

    /// Removes the last character.
    mutating func deleteLast() {
        replacesOnNextKey = false
        text = String(text.dropLast())
    }

    /// Moves the value by `delta`, keeping it inside `range`. An empty draft counts as 0.
    mutating func step(by delta: Double, within range: ClosedRange<Double>) {
        replacesOnNextKey = false
        let stepped = min(max((value ?? 0) + delta, range.lowerBound), range.upperBound)
        text = Self.text(for: stepped)
    }

    /// The draft text for `value`: no grouping separators, at most two decimals ("135", "2.5").
    static func text(for value: Double) -> String {
        value.formatted(.number.locale(Locale(identifier: "en_US_POSIX")).grouping(.never).precision(.fractionLength(0...2)))
    }

    private mutating func startTypingIfNeeded() {
        guard replacesOnNextKey else { return }
        replacesOnNextKey = false
        text = ""
    }
}
