import SwiftUI

/// The one primary action on a screen: a full-width button filled with the accent.
struct PrimaryButtonStyle: ButtonStyle {
    /// Button height; above the 44 pt minimum tap target.
    static let height: CGFloat = 48
    /// Opacity while pressed.
    private static let pressedOpacity = 0.8

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppFont.headline)
            .foregroundStyle(AppColor.background)
            .frame(maxWidth: .infinity, minHeight: Self.height)
            .background(AppColor.accent, in: .rect(cornerRadius: Radius.small))
            .opacity(configuration.isPressed ? Self.pressedOpacity : 1)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    /// The accent-filled, full-width primary button.
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
}

#Preview {
    Button("Start empty workout") {}
        .buttonStyle(.primary)
        .padding()
        .background(AppColor.background)
}
