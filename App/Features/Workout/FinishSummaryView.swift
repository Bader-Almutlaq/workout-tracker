import SwiftUI
import WorkoutCore

/// The sheet shown after Finish: what was saved, or a note that nothing was. One Done button;
/// no praise or celebration (`AGENTS.md` product rules).
struct FinishSummaryView: View {
    let outcome: FinishOutcome

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                switch outcome {
                case .saved(let summary): saved(summary)
                case .nothingLogged:
                    EmptyStateView(title: "Nothing logged", message: "Nothing was logged, so the workout was discarded.")
                }
            }
            .background(AppColor.background)
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                Button("Done") { dismiss() }
                    .buttonStyle(.primary)
                    .padding(Spacing.l)
            }
        }
        .presentationBackground(AppColor.background)
    }

    private func saved(_ summary: FinishSummary) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.l) {
                Text(summary.name).font(AppFont.title).foregroundStyle(AppColor.textPrimary)
                Card {
                    HStack(alignment: .top, spacing: Spacing.m) {
                        stat("Duration", summary.duration.clockText)
                        stat("Sets", String(summary.completedSets))
                        stat("Volume load", Weight(kilograms: summary.volumeKilograms).formatted(in: .kilograms))
                    }
                    .padding(Spacing.m)
                }
                Card {
                    ForEach(Array(summary.lines.enumerated()), id: \.element.id) { position, line in
                        if position > 0 { HairlineDivider() }
                        HStack {
                            Text(line.exerciseName).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                            Spacer(minLength: Spacing.s)
                            Text(line.setCount == 1 ? "1 set" : "\(line.setCount) sets")
                                .font(AppFont.callout.monospacedDigit())
                                .foregroundStyle(AppColor.textSecondary)
                        }
                        .padding(Spacing.m)
                    }
                }
            }
            .padding(Spacing.l)
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            SectionLabel(label)
            Text(value)
                .font(AppFont.headline.monospacedDigit())
                .foregroundStyle(AppColor.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview("Saved") {
    FinishSummaryView(outcome: .saved(FinishSummary(
        id: 1, name: "Evening workout", duration: 3_725, completedSets: 7, volumeKilograms: 3_412.5,
        lines: [
            FinishSummary.Line(id: 1, exerciseName: "Bench Press (Barbell)", setCount: 4),
            FinishSummary.Line(id: 2, exerciseName: "Lateral Raise (Dumbbell)", setCount: 3)
        ]
    )))
}

#Preview("Nothing logged") {
    FinishSummaryView(outcome: .nothingLogged)
}
