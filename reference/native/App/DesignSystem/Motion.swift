import SwiftUI

/// Animation from `docs/DESIGN.md`: 150-200 ms ease-out, no bounces.
enum Motion {
    /// The one animation used for state changes (0.18 s ease-out).
    static let standard = Animation.easeOut(duration: 0.18)
}
