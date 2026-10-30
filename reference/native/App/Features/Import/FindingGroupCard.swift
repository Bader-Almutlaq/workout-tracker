import SwiftUI
import WorkoutCore

/// The suspicious sets of one exercise in one session, with fix/keep actions.
struct FindingGroupCard: View {
    let group: StrongImportModel.FindingGroup
    let model: StrongImportModel
    /// Asks the parent to show the "enter your own value" dialog.
    let onEdit: (StrongImportModel.FindingGroup.Item) -> Void

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(group.exerciseName)
                    .font(AppFont.headline)
                    .foregroundStyle(AppColor.textPrimary)
                Text(group.date.formatted(date: .abbreviated, time: .omitted))
                    .font(AppFont.callout)
                    .foregroundStyle(AppColor.textTertiary)
            }
            .padding(Spacing.m)

            ForEach(group.items) { item in
                HairlineDivider()
                itemRow(item)
            }

            if group.items.count > 1 {
                HairlineDivider()
                HStack {
                    Button("Keep all as logged") { model.keep(group.items) }
                    Spacer()
                    if group.items.contains(where: { $0.finding.suggestion != nil }) {
                        Button("Use suggestions") { model.applySuggestions(in: group) }
                    }
                }
                .font(AppFont.callout)
                .padding(Spacing.m)
            }
        }
    }

    private func itemRow(_ item: StrongImportModel.FindingGroup.Item) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            HStack(alignment: .firstTextBaseline) {
                Text("\(item.set.weight.formatted(in: item.set.entryUnit)) × \(item.set.reps)")
                    .font(AppFont.body.monospacedDigit())
                    .foregroundStyle(AppColor.textPrimary)
                Spacer()
                Label(explanation(item), systemImage: "exclamationmark.triangle")
                    .font(AppFont.callout)
                    .foregroundStyle(AppColor.Status.warning)
                    .labelStyle(.titleAndIcon)
            }
            HStack(spacing: Spacing.m) {
                if let suggestion = item.finding.suggestion {
                    Button("Use \(suggestionText(item, suggestion))") { model.applySuggestion(item) }
                        .buttonStyle(.borderedProminent)
                }
                Button("Keep") { model.keep([item]) }
                    .buttonStyle(.bordered)
                Button("Edit…") { onEdit(item) }
                    .buttonStyle(.bordered)
            }
            .font(AppFont.callout)
            .controlSize(.small)
        }
        .padding(Spacing.m)
    }

    private func explanation(_ item: StrongImportModel.FindingGroup.Item) -> String {
        let finding = item.finding
        switch finding.issue {
        case .weightTooHigh, .weightTooLow:
            return "usually ~\(Weight(kilograms: finding.typical).formatted(in: item.set.entryUnit))"
        case .repsTooHigh:
            return "usually ~\(Int(finding.typical.rounded())) reps"
        case .zeroReps:
            return "0 reps"
        }
    }

    private func suggestionText(_ item: StrongImportModel.FindingGroup.Item, _ suggestion: Double) -> String {
        switch item.finding.issue {
        case .weightTooHigh, .weightTooLow: Weight(kilograms: suggestion).formatted(in: item.set.entryUnit)
        case .repsTooHigh, .zeroReps: "\(Int(suggestion.rounded())) reps"
        }
    }
}
