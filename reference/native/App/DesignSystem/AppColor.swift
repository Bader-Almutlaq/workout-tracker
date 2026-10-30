import SwiftUI
import UIKit

/// Color tokens from `docs/DESIGN.md`. Views use these, never raw colors.
///
/// Every token adapts to light and dark appearance automatically.
enum AppColor {
    /// Screen background.
    static let background = Color(light: 0xFBFBFC, dark: 0x08090A)
    /// Cards and list rows.
    static let surface = Color(light: 0xFFFFFF, dark: 0x141516)
    /// Active rows, sheets, pressed states.
    static let surfaceRaised = Color(light: 0xF4F5F7, dark: 0x1C1D1F)
    /// Hairline borders (0.5 pt).
    static let border = Color(light: 0x000000, dark: 0xFFFFFF, opacity: 0.08)
    /// Focused inputs and selected chips.
    static let borderStrong = Color(light: 0x000000, dark: 0xFFFFFF, opacity: 0.14)

    /// Values and titles.
    static let textPrimary = Color(light: 0x0B0C0E, dark: 0xF7F8F8)
    /// Labels and previous-session values.
    static let textSecondary = Color(light: 0x5A5E66, dark: 0x9EA1A8)
    /// Units, captions, axis labels.
    static let textTertiary = Color(light: 0x8A8F98, dark: 0x62666D)

    /// The one accent: primary actions, selection, single-series chart lines.
    static let accent = Color(light: 0x5E6AD2, dark: 0x7C85E8)
    /// Selected chip fill, completed-set row tint: the accent at 12% (light) or 16% (dark).
    static let accentSubtle = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark ? UIColor(hex: 0x7C85E8, opacity: 0.16) : UIColor(hex: 0x5E6AD2, opacity: 0.12)
    })

    /// Status colors. Always pair with an icon and a label.
    enum Status {
        static let good = Color(hex: 0x0CA30C)
        static let warning = Color(hex: 0xFAB219)
        static let serious = Color(hex: 0xEC835A)
        static let critical = Color(hex: 0xD03B3B)
    }
}

extension Color {
    /// A color from a 24-bit RGB hex value, e.g. `0x5E6AD2`.
    init(hex: UInt32, opacity: Double = 1) {
        self.init(uiColor: UIColor(hex: hex, opacity: opacity))
    }

    /// A color that switches between `light` and `dark` with the system appearance.
    init(light: UInt32, dark: UInt32, opacity: Double = 1) {
        self.init(uiColor: UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light, opacity: opacity)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt32, opacity: Double) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: opacity
        )
    }
}
