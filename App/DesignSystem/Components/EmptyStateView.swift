import SwiftUI

/// A one-line empty state: what this screen will show and what to do next.
/// No illustrations, per `docs/DESIGN.md`.
struct EmptyStateView: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: Spacing.s) {
            Text(title)
                .font(AppFont.headline)
                .foregroundStyle(AppColor.textPrimary)
            Text(message)
                .font(AppFont.body)
                .foregroundStyle(AppColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColor.background)
    }
}
