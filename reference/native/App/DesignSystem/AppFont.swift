import SwiftUI

/// Type scale from `docs/DESIGN.md`. System font (SF Pro) throughout.
///
/// Numbers in tables, set rows and axes add `.monospacedDigit()` so columns align.
enum AppFont {
    /// Hero number, e.g. current e1RM.
    static let display = Font.system(size: 34, weight: .semibold)
    /// Screen titles.
    static let title = Font.system(size: 22, weight: .semibold)
    /// Card titles and exercise names.
    static let headline = Font.system(size: 15, weight: .semibold)
    /// Default text.
    static let body = Font.system(size: 15, weight: .regular)
    /// Labels and chips.
    static let callout = Font.system(size: 13, weight: .medium)
    /// Section labels and axis titles. Use through ``SectionLabel`` for casing and tracking.
    static let caption = Font.system(size: 11, weight: .medium)
}
