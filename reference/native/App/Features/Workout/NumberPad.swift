import SwiftUI

/// The keypad shown at the bottom of the logging screen while a weight, reps or RPE cell is being
/// edited. It replaces the system keyboard, which hides the sets and has no − / + or Next.
///
/// Layout (four columns):
///
///     1  2  3  −
///     4  5  6  +
///     7  8  9  Next
///     .  0  ⌫  Done
struct NumberPad: View {
    /// A key that types into the cell.
    enum Key: Equatable {
        case digit(Int)
        case decimalPoint
        case backspace
    }

    /// What the cell holds, e.g. "WEIGHT · KG".
    let title: String
    /// Whether the decimal point works. Reps and seconds are whole numbers.
    let allowsDecimal: Bool
    /// A failed save to show above the keys, or `nil`.
    let errorMessage: String?
    let onDismissError: () -> Void
    let onKey: (Key) -> Void
    /// −1 for the − key, +1 for the + key.
    let onStep: (Double) -> Void
    let onNext: () -> Void
    let onDone: () -> Void

    /// Height of a key; the same as the primary button, above the 44 pt minimum tap target.
    private static let keyHeight = PrimaryButtonStyle.height
    /// Opacity of a key that does nothing right now.
    private static let disabledOpacity = 0.4

    var body: some View {
        VStack(spacing: Spacing.s) {
            if let errorMessage {
                ErrorBanner(message: errorMessage, onDismiss: onDismissError)
            }
            SectionLabel(title)
                .frame(maxWidth: .infinity, alignment: .leading)
            Grid(horizontalSpacing: Spacing.s, verticalSpacing: Spacing.s) {
                GridRow {
                    digit(1); digit(2); digit(3)
                    key("−", label: "Decrease") { onStep(-1) }
                }
                GridRow {
                    digit(4); digit(5); digit(6)
                    key("+", label: "Increase") { onStep(1) }
                }
                GridRow {
                    digit(7); digit(8); digit(9)
                    key("Next", label: "Next field", tint: AppColor.accent, action: onNext)
                }
                GridRow {
                    key(".", label: "Decimal point") { onKey(.decimalPoint) }
                        .disabled(!allowsDecimal)
                        .opacity(allowsDecimal ? 1 : Self.disabledOpacity)
                    digit(0)
                    Button { onKey(.backspace) } label: {
                        Image(systemName: "delete.left")
                            .font(AppFont.headline)
                            .foregroundStyle(AppColor.textPrimary)
                            .frame(maxWidth: .infinity, minHeight: Self.keyHeight)
                            .background(AppColor.surfaceRaised, in: .rect(cornerRadius: Radius.small))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Delete")
                    Button("Done", action: onDone)
                        .buttonStyle(.primary)
                }
            }
        }
        .padding(.horizontal, Spacing.l)
        .padding(.vertical, Spacing.m)
        .background(AppColor.surface.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) { HairlineDivider() }
    }

    private func digit(_ number: Int) -> some View {
        key(String(number), label: String(number)) { onKey(.digit(number)) }
    }

    private func key(
        _ text: String, label: String, tint: Color = AppColor.textPrimary, action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(text)
                .font(AppFont.title.monospacedDigit())
                .foregroundStyle(tint)
                .frame(maxWidth: .infinity, minHeight: Self.keyHeight)
                .background(AppColor.surfaceRaised, in: .rect(cornerRadius: Radius.small))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

#Preview("Pad") {
    VStack {
        Spacer()
        NumberPad(
            title: "Weight · lb", allowsDecimal: true, errorMessage: nil, onDismissError: {},
            onKey: { _ in }, onStep: { _ in }, onNext: {}, onDone: {}
        )
    }
    .background(AppColor.background)
}

#Preview("Pad with error") {
    VStack {
        Spacer()
        NumberPad(
            title: "RPE", allowsDecimal: true, errorMessage: "RPE must be between 1 and 10 (got 11.0).",
            onDismissError: {}, onKey: { _ in }, onStep: { _ in }, onNext: {}, onDone: {}
        )
    }
    .background(AppColor.background)
}
