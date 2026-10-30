import SwiftUI

/// The owner's choice of light or dark appearance, set in Settings.
///
/// `system` follows the phone's setting. The other two force one look, whatever the phone is set to.
/// It is a display preference only, so it lives in `UserDefaults` (via `@AppStorage`) rather than in
/// the database, and backups don't carry it.
enum AppearancePreference: String, CaseIterable, Identifiable {
    case system
    case dark
    case light

    /// The `UserDefaults` key that `@AppStorage` reads and writes.
    static let storageKey = "appearancePreference"

    var id: Self { self }

    /// The label shown in the Settings picker.
    var displayName: String {
        switch self {
        case .system: "System"
        case .dark: "Dark"
        case .light: "Light"
        }
    }

    /// The scheme passed to `preferredColorScheme`. `nil` means "follow the phone".
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .dark: .dark
        case .light: .light
        }
    }
}
