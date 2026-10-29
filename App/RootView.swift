import SwiftUI

/// The tab bar. Workout and Analytics are placeholders until their milestone
/// (see `docs/PLAN.md`).
struct RootView: View {
    let environment: AppEnvironment

    var body: some View {
        TabView {
            Tab("Workout", systemImage: "figure.strengthtraining.traditional") {
                EmptyStateView(title: "Workout", message: "Logging arrives in milestone M3.")
            }
            Tab("History", systemImage: "calendar") {
                HistoryView(model: environment.history)
            }
            Tab("Exercises", systemImage: "list.bullet") {
                ExercisesView(model: environment.exercises)
            }
            Tab("Analytics", systemImage: "chart.xyaxis.line") {
                EmptyStateView(title: "Analytics", message: "Charts arrive in milestones M5–M6.")
            }
            Tab("Settings", systemImage: "gearshape") {
                SettingsView(
                    backup: environment.backupSettings,
                    makeImportModel: environment.makeImportModel,
                    makeMatchingModel: environment.makeStrongMatchingModel
                )
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
