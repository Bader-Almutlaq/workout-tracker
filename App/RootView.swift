import SwiftUI

/// The tab bar. Tabs other than Settings are placeholders until their milestone
/// (see `.claude/PLAN.md`).
struct RootView: View {
    let environment: AppEnvironment

    var body: some View {
        TabView {
            Tab("Workout", systemImage: "figure.strengthtraining.traditional") {
                EmptyStateView(title: "Workout", message: "Logging arrives in milestone M3.")
            }
            Tab("History", systemImage: "calendar") {
                EmptyStateView(title: "History", message: "Your Strong history appears here after the import (M1).")
            }
            Tab("Exercises", systemImage: "list.bullet") {
                EmptyStateView(title: "Exercises", message: "The exercise library arrives in milestone M2.")
            }
            Tab("Analytics", systemImage: "chart.xyaxis.line") {
                EmptyStateView(title: "Analytics", message: "Charts arrive in milestones M5–M6.")
            }
            Tab("Settings", systemImage: "gearshape") {
                SettingsView(backup: environment.backupSettings)
            }
        }
        .tint(AppColor.accent)
        // Learn the last backup time at launch so the first automatic backup is throttled correctly.
        .task { environment.backupSettings.refresh() }
    }
}

#Preview {
    RootView(environment: .preview())
}
