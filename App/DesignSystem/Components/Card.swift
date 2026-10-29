import SwiftUI

/// A surface with a hairline border and no shadow: the basic container.
struct Card<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AppColor.surface, in: .rect(cornerRadius: Radius.medium))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.medium)
                    .strokeBorder(AppColor.border, lineWidth: 0.5)
            }
    }
}
