import SwiftUI

/// A divider matching the card's hairline border.
struct HairlineDivider: View {
    var body: some View {
        Rectangle()
            .fill(AppColor.border)
            .frame(height: 0.5)
    }
}
