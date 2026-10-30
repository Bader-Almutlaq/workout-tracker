import SwiftUI

/// Small uppercase label above a group of content, e.g. "BACKUPS".
struct SectionLabel: View {
    let text: String

    init(_ text: String) {
        self.text = text
    }

    var body: some View {
        Text(text.uppercased())
            .font(AppFont.caption)
            .tracking(0.4)
            .foregroundStyle(AppColor.textTertiary)
    }
}
