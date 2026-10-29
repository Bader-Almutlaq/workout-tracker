import SwiftUI
import WorkoutCore

/// The Workout tab: the logging screen while a workout is in progress, otherwise a place to start one.
struct WorkoutTabView: View {
    @Bindable var model: WorkoutTabModel

    var body: some View {
        Group {
            if let active = model.active {
                ActiveWorkoutView(model: active).id(active.workoutID)
            } else if model.hasLoadedActive {
                startScreen
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(AppColor.background)
        .task { await model.observeActiveWorkout() }
        .task { await model.observeRecentWorkouts() }
        .sheet(item: $model.finishOutcome) { FinishSummaryView(outcome: $0) }
    }

    // MARK: Start screen

    private var startScreen: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.xl) {
                    if let message = model.queue.errorMessage {
                        ErrorBanner(message: message, onDismiss: model.queue.dismissError)
                    }
                    Button("Start empty workout") { model.startEmptyWorkout() }
                        .buttonStyle(.primary)
                    if !model.recentWorkouts.isEmpty { recentSection }
                }
                .padding(Spacing.l)
            }
            .background(AppColor.background)
            .navigationTitle("Workout")
        }
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            SectionLabel("Repeat a past workout")
            Card {
                ForEach(Array(model.recentWorkouts.enumerated()), id: \.element.id) { position, workout in
                    if position > 0 { HairlineDivider() }
                    Button {
                        model.repeatWorkout(workout)
                    } label: {
                        HStack(spacing: Spacing.m) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(workout.name).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                                Text(workout.startedAt.formatted(date: .abbreviated, time: .omitted))
                                    .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                            }
                            Spacer(minLength: Spacing.s)
                            Text(workout.exerciseCount == 1 ? "1 exercise" : "\(workout.exerciseCount) exercises")
                                .font(AppFont.callout.monospacedDigit())
                                .foregroundStyle(AppColor.textSecondary)
                        }
                        .padding(Spacing.m)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

#if DEBUG
#Preview("Empty tab, no history") {
    WorkoutTabView(model: AppEnvironment.preview().workoutTab)
}

#Preview("Empty tab, with history") {
    WorkoutTabView(model: WorkoutPreviewData.environment(withActiveWorkout: false).workoutTab)
}

#Preview("Workout in progress") {
    WorkoutTabView(model: WorkoutPreviewData.environment(withActiveWorkout: true).workoutTab)
}
#endif
