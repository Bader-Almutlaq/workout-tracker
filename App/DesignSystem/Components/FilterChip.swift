import SwiftUI

/// A rounded chip for one filter. Idle chips are quiet; an active chip gets the accent fill and
/// a stronger border, and shows the chosen value as its title (for example "Side delts").
///
/// This is only the look. Wrap it in a `Button` or `Menu` to make it respond.
struct FilterChip: View {
    let title: String
    let isActive: Bool
    /// Shows a small chevron, for chips that open a menu.
    var showsChevron = false

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: Spacing.xs) {
            Text(title)
            if showsChevron {
                Image(systemName: "chevron.down").font(AppFont.caption)
            }
        }
        .font(AppFont.callout)
        .foregroundStyle(isActive ? AppColor.accent : AppColor.textSecondary)
        .padding(.horizontal, Spacing.m)
        .padding(.vertical, Spacing.s)
        .background(isActive ? activeFill : Color.clear, in: .rect(cornerRadius: Radius.small))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.small)
                .strokeBorder(isActive ? AppColor.borderStrong : AppColor.border, lineWidth: 0.5)
        }
        .contentShape(.rect(cornerRadius: Radius.small))
    }

    /// `accentSubtle` from `docs/DESIGN.md`: the accent at 16% in dark mode and 12% in light mode.
    /// `AppColor` has no such token yet, so it is derived here from the accent.
    private var activeFill: Color {
        AppColor.accent.opacity(colorScheme == .dark ? Opacity.accentSubtleDark : Opacity.accentSubtleLight)
    }

    /// Fill strengths of `accentSubtle` (`docs/DESIGN.md`, colour table).
    private enum Opacity {
        static let accentSubtleDark = 0.16
        static let accentSubtleLight = 0.12
    }
}

#Preview {
    HStack {
        FilterChip(title: "Muscle", isActive: false, showsChevron: true)
        FilterChip(title: "Side delts", isActive: true, showsChevron: true)
        FilterChip(title: "Mine", isActive: true)
    }
    .padding()
    .background(AppColor.background)
}
