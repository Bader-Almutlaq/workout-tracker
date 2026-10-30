import SwiftUI
import WorkoutCore

/// One exercise: the muscles it trains, how often it has been done, recent sessions, and the
/// actions to duplicate, edit or archive it.
struct ExerciseDetailView: View {
    @State private var model: ExerciseDetailModel
    @State private var sheetModel: CustomExerciseModel?

    /// `@State` keeps the first model alive when the list rebuilds its navigation destination.
    init(model: ExerciseDetailModel) {
        _model = State(initialValue: model)
    }

    var body: some View {
        Group {
            if let detail = model.detail {
                content(detail)
            } else if let error = model.errorMessage {
                EmptyStateView(title: "Couldn't load this exercise", message: error)
            } else if model.hasLoaded {
                EmptyStateView(title: "Exercise not found", message: "It no longer exists.")
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(AppColor.background)
        .navigationTitle(model.detail?.exercise.name ?? "")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if model.detail != nil {
                ToolbarItem(placement: .primaryAction) { actionsMenu }
            }
        }
        .task { await model.observe() }
        .sheet(item: $sheetModel) { sheetModel in
            CustomExerciseView(model: sheetModel)
        }
    }

    private var actionsMenu: some View {
        Menu("Actions", systemImage: "ellipsis.circle") {
            if model.isLibraryExercise {
                Button("Duplicate as my own", systemImage: "plus.square.on.square") {
                    sheetModel = model.makeDuplicateModel()
                }
            } else {
                Button("Edit", systemImage: "pencil") {
                    sheetModel = model.makeEditModel()
                }
            }
            Button(
                model.isArchived ? "Unarchive" : "Archive",
                systemImage: model.isArchived ? "tray.and.arrow.up" : "archivebox"
            ) {
                model.toggleArchived()
            }
        }
    }

    private func content(_ detail: ExerciseCatalog.Detail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.l) {
                musclesCard(detail)
                if let usage = model.usageLine {
                    usageCard(usage)
                }
                if !detail.recentSessions.isEmpty {
                    recentCard(detail.recentSessions)
                }
                if !detail.aliases.isEmpty {
                    Text("Also known as: \(detail.aliases.joined(separator: ", "))")
                        .font(AppFont.callout)
                        .foregroundStyle(AppColor.textTertiary)
                }
                if let message = model.errorMessage {
                    Text(message).font(AppFont.callout).foregroundStyle(AppColor.Status.critical)
                }
            }
            .padding(Spacing.l)
        }
    }

    // MARK: Cards

    private func musclesCard(_ detail: ExerciseCatalog.Detail) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.m) {
                muscleGroup("Primary", muscles: detail.primaryMuscles, color: AppColor.accent)
                muscleGroup("Secondary", muscles: detail.secondaryMuscles, color: AppColor.textSecondary)
                if !model.characteristicsLine.isEmpty {
                    Text(model.characteristicsLine)
                        .font(AppFont.callout)
                        .foregroundStyle(AppColor.textTertiary)
                }
                if model.isArchived {
                    Text("Archived: hidden from search, history kept.")
                        .font(AppFont.callout)
                        .foregroundStyle(AppColor.textTertiary)
                }
            }
            .padding(Spacing.m)
        }
    }

    @ViewBuilder
    private func muscleGroup(_ title: String, muscles: [Muscle], color: Color) -> some View {
        if !muscles.isEmpty {
            VStack(alignment: .leading, spacing: Spacing.s) {
                SectionLabel(title)
                FlowLayout(spacing: Spacing.s) {
                    ForEach(muscles, id: \.self) { muscle in
                        Text(muscle.displayName)
                            .font(AppFont.callout)
                            .foregroundStyle(color)
                            .padding(.horizontal, Spacing.m)
                            .padding(.vertical, Spacing.xs)
                            .overlay {
                                RoundedRectangle(cornerRadius: Radius.small)
                                    .strokeBorder(AppColor.borderStrong, lineWidth: 0.5)
                            }
                    }
                }
            }
        }
    }

    private func usageCard(_ usage: String) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(usage).font(AppFont.headline).foregroundStyle(AppColor.textPrimary)
                if let first = model.firstUsedLine {
                    Text(first).font(AppFont.callout).foregroundStyle(AppColor.textSecondary)
                }
                if let last = model.lastUsedLine {
                    Text(last).font(AppFont.callout).foregroundStyle(AppColor.textSecondary)
                }
            }
            .padding(Spacing.m)
        }
    }

    private func recentCard(_ sessions: [ExerciseCatalog.Detail.Session]) -> some View {
        Card {
            SectionLabel("Recent")
                .padding(.horizontal, Spacing.m)
                .padding(.top, Spacing.m)
                .padding(.bottom, Spacing.s)
            ForEach(sessions) { session in
                HairlineDivider()
                HStack(spacing: Spacing.m) {
                    Text(ExerciseDetailModel.dateText(session.startedAt))
                        .font(AppFont.body).foregroundStyle(AppColor.textSecondary)
                    Spacer()
                    Text(ExerciseDetailModel.topSetText(session))
                        .font(AppFont.body.monospacedDigit()).foregroundStyle(AppColor.textPrimary)
                    Text(ExerciseDetailModel.workSetsText(session))
                        .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                }
                .padding(.horizontal, Spacing.m)
                .padding(.vertical, Spacing.s)
            }
        }
    }
}

/// Lays out chips left to right and wraps onto a new line when a row is full.
private struct FlowLayout: Layout {
    var spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arranged(in: proposal.width ?? .infinity, subviews: subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let layout = arranged(in: bounds.width, subviews: subviews)
        for (subview, origin) in zip(subviews, layout.origins) {
            subview.place(at: CGPoint(x: bounds.minX + origin.x, y: bounds.minY + origin.y), proposal: .unspecified)
        }
    }

    private func arranged(in width: CGFloat, subviews: Subviews) -> (size: CGSize, origins: [CGPoint]) {
        var origins: [CGPoint] = []
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0, usedWidth: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0, x + size.width > width {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            origins.append(CGPoint(x: x, y: y))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
            usedWidth = max(usedWidth, x - spacing)
        }
        return (CGSize(width: usedWidth, height: y + rowHeight), origins)
    }
}

#Preview {
    // The first library exercise has no history in the preview database; that is the empty-usage state.
    NavigationStack {
        ExerciseDetailView(
            model: AppEnvironment.preview().exercises.makeDetailModel(exerciseID: 1)
        )
    }
}
