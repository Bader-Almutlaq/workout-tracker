import SwiftUI
import WorkoutCore

/// All workouts, newest first, grouped by month.
struct HistoryView: View {
    let model: HistoryModel

    var body: some View {
        NavigationStack {
            Group {
                if model.workoutCount == 0 {
                    EmptyStateView(title: "No workouts yet", message: "Import your Strong history from Settings.")
                } else {
                    list
                }
            }
            .background(AppColor.background)
            .navigationTitle("History")
            .navigationDestination(for: Int64.self) { workoutID in
                WorkoutDetailView(model: WorkoutDetailModel(database: model.database, workoutID: workoutID))
            }
        }
        .task { await model.observe() }
    }

    private var list: some View {
        List {
            ForEach(model.sections) { section in
                Section {
                    ForEach(section.workouts) { workout in
                        NavigationLink(value: workout.id) { row(workout) }
                            .listRowBackground(AppColor.surface)
                    }
                } header: {
                    SectionLabel(section.month.formatted(.dateTime.month(.wide).year()))
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }

    private func row(_ workout: WorkoutHistory.Summary) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.m) {
            VStack(alignment: .leading, spacing: 2) {
                Text(workout.startedAt.formatted(.dateTime.weekday(.abbreviated)))
                    .font(AppFont.caption).foregroundStyle(AppColor.textTertiary)
                Text(workout.startedAt.formatted(.dateTime.day()))
                    .font(AppFont.headline.monospacedDigit()).foregroundStyle(AppColor.textPrimary)
            }
            .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(workout.name).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                Text("\(workout.exerciseCount) exercises · \(workout.setCount) sets")
                    .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}
