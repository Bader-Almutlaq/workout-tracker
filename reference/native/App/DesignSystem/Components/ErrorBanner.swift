import SwiftUI

/// A small inline banner for a message the owner needs to read, with a button to dismiss it.
///
/// Status colors are always paired with an icon and text, per `docs/DESIGN.md`.
struct ErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.s) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(AppColor.Status.serious)
            Text(message)
                .foregroundStyle(AppColor.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
            Button(action: onDismiss) {
                Image(systemName: "xmark").foregroundStyle(AppColor.textSecondary)
            }
            .accessibilityLabel("Dismiss")
        }
        .font(AppFont.callout)
        .padding(Spacing.m)
        .background(AppColor.surfaceRaised, in: .rect(cornerRadius: Radius.small))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.small).strokeBorder(AppColor.border, lineWidth: 0.5)
        }
    }
}

#Preview {
    ErrorBanner(message: "RPE must be between 1 and 10 (got 11.0).", onDismiss: {})
        .padding()
        .background(AppColor.background)
}
