import SwiftUI
import WorkoutCore

/// One past workout: each exercise with its sets, weights in the unit they were typed in.
struct WorkoutDetailView: View {
    let model: WorkoutDetailModel

    var body: some View {
        Group {
            if let detail = model.detail {
                content(detail)
            } else if let error = model.errorMessage {
                EmptyStateView(title: "Couldn't load this workout", message: error)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(AppColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }

    private func content(_ detail: WorkoutHistory.Detail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.l) {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(detail.workout.name).font(AppFont.title).foregroundStyle(AppColor.textPrimary)
                    Text(detail.workout.startedAt.formatted(date: .complete, time: .shortened))
                        .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                    if let notes = detail.workout.notes {
                        Text(notes).font(AppFont.body).foregroundStyle(AppColor.textSecondary)
                    }
                }
                ForEach(detail.entries) { entry in
                    entryCard(entry)
                }
            }
            .padding(Spacing.l)
        }
    }

    private func entryCard(_ entry: WorkoutHistory.Detail.Entry) -> some View {
        Card {
            Text(entry.exercise.name)
                .font(AppFont.headline)
                .foregroundStyle(AppColor.textPrimary)
                .padding(Spacing.m)
            if let notes = entry.entry.notes {
                Text(notes)
                    .font(AppFont.callout).foregroundStyle(AppColor.textSecondary)
                    .padding([.horizontal, .bottom], Spacing.m)
            }
            ForEach(Array(entry.sets.enumerated()), id: \.element.id) { _, set in
                HairlineDivider()
                setRow(set, workingIndex: workingIndex(of: set, in: entry.sets))
            }
        }
    }

    private func setRow(_ set: WorkoutSet, workingIndex: Int?) -> some View {
        HStack(spacing: Spacing.m) {
            Text(label(for: set, workingIndex: workingIndex))
                .font(AppFont.callout.monospacedDigit())
                .foregroundStyle(set.kind == .working ? AppColor.textTertiary : AppColor.accent)
                .frame(width: 20, alignment: .leading)
            Text(set.weightKilograms > 0 ? set.weight.formatted(in: set.entryUnit) : "Bodyweight")
                .font(AppFont.body.monospacedDigit())
                .foregroundStyle(AppColor.textPrimary)
            Text("× \(set.reps)")
                .font(AppFont.body.monospacedDigit())
                .foregroundStyle(AppColor.textPrimary)
            Spacer()
            if let rpe = set.rpe {
                Text("RPE \(rpe.formatted(.number.precision(.fractionLength(0...1))))")
                    .font(AppFont.callout.monospacedDigit())
                    .foregroundStyle(AppColor.textSecondary)
            }
        }
        .padding(.horizontal, Spacing.m)
        .padding(.vertical, Spacing.s)
    }

    /// "W", "D", "F" for special sets, otherwise the working-set number.
    private func label(for set: WorkoutSet, workingIndex: Int?) -> String {
        switch set.kind {
        case .warmup: "W"
        case .drop: "D"
        case .failure: "F"
        case .working: workingIndex.map { String($0) } ?? ""
        }
    }

    private func workingIndex(of set: WorkoutSet, in sets: [WorkoutSet]) -> Int? {
        guard set.kind == .working else { return nil }
        return sets.filter { $0.kind == .working && $0.position <= set.position }.count
    }
}
