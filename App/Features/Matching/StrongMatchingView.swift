import SwiftUI
import WorkoutCore

/// Links imported Strong exercise names to library exercises, or keeps them as the owner's own.
///
/// Pushed from Settings, so it has no navigation stack of its own. Each unmatched exercise gets a
/// card with the closest library exercises. Nothing is deleted: matching moves history.
struct StrongMatchingView: View {
    @Bindable var model: StrongMatchingModel

    @State private var pendingMerge: StrongMatchingModel.PendingMerge?
    @State private var searchingFor: ExerciseCatalog.UnmatchedImport?
    /// The library exercise picked in the search sheet, confirmed once the sheet has closed.
    @State private var pickedFromSearch: StrongMatchingModel.PendingMerge?
    @State private var taggingFor: ExerciseCatalog.UnmatchedImport?
    @State private var isConfirmingMatchAll = false

    var body: some View {
        content
            .background(AppColor.background)
            .navigationTitle("Match exercises")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Match all suggested") { isConfirmingMatchAll = true }
                        .disabled(model.topSuggestionMatches.isEmpty || model.isWorking)
                }
            }
            .task { await model.observe() }
            .sheet(
                item: $searchingFor,
                onDismiss: {
                    pendingMerge = pickedFromSearch
                    pickedFromSearch = nil
                },
                content: { item in
                    LibraryExercisePicker(search: model.librarySearch) { entry in
                        pickedFromSearch = .init(unmatched: item, target: entry)
                        searchingFor = nil
                    }
                }
            )
            .sheet(item: $taggingFor) { item in
                OwnExerciseForm(name: item.exercise.name) { name, primary, secondary in
                    model.keepAsOwn(item, named: name, primary: primary, secondary: secondary)
                }
            }
            .sheet(isPresented: $isConfirmingMatchAll) {
                MatchAllConfirmation(matches: model.topSuggestionMatches) { model.acceptAllTopSuggestions() }
            }
            .confirmationDialog(
                "Match exercise",
                isPresented: Binding(get: { pendingMerge != nil }, set: { if !$0 { pendingMerge = nil } }),
                titleVisibility: .visible,
                presenting: pendingMerge
            ) { pending in
                Button("Match") { model.merge(pending.unmatched, into: pending.target.id) }
            } message: { pending in
                Text(pending.message)
            }
            .alert(
                "Something went wrong",
                isPresented: Binding(get: { model.errorMessage != nil }, set: { if !$0 { model.errorMessage = nil } })
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(model.errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if !model.hasLoaded {
            ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if model.unmatched.isEmpty {
            EmptyStateView(
                title: "All matched",
                message: "Every imported exercise is linked to the library or tagged as your own."
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.l) {
                    Text("These names from Strong aren’t in the library yet. Match each to a library exercise to count its sets per muscle. History moves with it; nothing is deleted.")
                        .font(AppFont.body)
                        .foregroundStyle(AppColor.textSecondary)
                    ForEach(model.unmatched) { item in card(for: item) }
                }
                .padding(Spacing.l)
            }
            .disabled(model.isWorking)
        }
    }

    private func card(for item: ExerciseCatalog.UnmatchedImport) -> some View {
        let suggestions = model.suggestions(for: item)
        return Card {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.exercise.name)
                    .font(AppFont.headline)
                    .foregroundStyle(AppColor.textPrimary)
                Text(StrongMatchingModel.usageText(for: item))
                    .font(AppFont.callout.monospacedDigit())
                    .foregroundStyle(AppColor.textTertiary)
            }
            .padding(Spacing.m)

            if suggestions.isEmpty {
                HairlineDivider()
                Text("No close matches in the library.")
                    .font(AppFont.callout)
                    .foregroundStyle(AppColor.textTertiary)
                    .padding(Spacing.m)
            }
            ForEach(suggestions) { entry in
                HairlineDivider()
                HStack(spacing: Spacing.m) {
                    MatchingCandidateRow(entry: entry)
                    Spacer(minLength: Spacing.s)
                    Button("Match") { pendingMerge = .init(unmatched: item, target: entry) }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                }
                .padding(Spacing.m)
            }

            HairlineDivider()
            HStack {
                Button("Search library…") { searchingFor = item }
                Spacer()
                Button("Keep as my own") { taggingFor = item }
            }
            .font(AppFont.callout)
            .padding(Spacing.m)
        }
    }
}

// MARK: - Keep as my own

/// The "Keep as my own" form: a name plus primary and secondary muscles, as plain checkmark lists.
/// T-004 builds the polished muscle picker; this stays deliberately simple.
private struct OwnExerciseForm: View {
    /// Called with the final name and the chosen muscles in head-to-toe order.
    let onSave: (String, [Muscle], [Muscle]) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var primary: Set<Muscle> = []
    @State private var secondary: Set<Muscle> = []

    init(name: String, onSave: @escaping (String, [Muscle], [Muscle]) -> Void) {
        self.onSave = onSave
        _name = State(initialValue: name)
    }

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !primary.isEmpty
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("Name", text: $name)
                        .font(AppFont.body)
                } header: {
                    SectionLabel("Name")
                }
                .listRowBackground(AppColor.surface)

                Section {
                    ForEach(Muscle.allCases, id: \.self) { muscle in
                        checkRow(muscle, isSelected: primary.contains(muscle)) {
                            toggle(muscle, in: &primary)
                            secondary.remove(muscle)
                        }
                    }
                } header: {
                    SectionLabel("Primary muscles")
                } footer: {
                    Text("The muscles that do most of the work. Pick at least one.")
                }
                .listRowBackground(AppColor.surface)

                Section {
                    ForEach(Muscle.allCases, id: \.self) { muscle in
                        checkRow(muscle, isSelected: secondary.contains(muscle)) {
                            toggle(muscle, in: &secondary)
                        }
                        .disabled(primary.contains(muscle))
                    }
                } header: {
                    SectionLabel("Secondary muscles")
                }
                .listRowBackground(AppColor.surface)
            }
            .scrollContentBackground(.hidden)
            .background(AppColor.background)
            .navigationTitle("Keep as my own")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(
                            name,
                            Muscle.allCases.filter(primary.contains),
                            Muscle.allCases.filter(secondary.contains)
                        )
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
    }

    private func checkRow(_ muscle: Muscle, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(muscle.displayName)
                    .font(AppFont.body)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(AppColor.accent)
                }
            }
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .foregroundStyle(AppColor.textPrimary)
    }

    private func toggle(_ muscle: Muscle, in set: inout Set<Muscle>) {
        if !set.insert(muscle).inserted { set.remove(muscle) }
    }
}

// MARK: - Match all

/// Lists every Strong name with the library exercise it would be merged into, and asks for a go-ahead.
private struct MatchAllConfirmation: View {
    let matches: [StrongMatchingModel.PendingMerge]
    let onConfirm: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.m) {
                    Text("Each Strong name moves, with its history, into the library exercise next to it. Exercises without a suggestion are left alone.")
                        .font(AppFont.callout)
                        .foregroundStyle(AppColor.textSecondary)
                    Card {
                        ForEach(Array(matches.enumerated()), id: \.offset) { index, match in
                            if index > 0 { HairlineDivider() }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(match.unmatched.exercise.name)
                                    .font(AppFont.body)
                                    .foregroundStyle(AppColor.textPrimary)
                                Label(match.target.name, systemImage: "arrow.right")
                                    .font(AppFont.callout)
                                    .foregroundStyle(AppColor.textSecondary)
                            }
                            .padding(Spacing.m)
                        }
                    }
                }
                .padding(Spacing.l)
            }
            .background(AppColor.background)
            .safeAreaInset(edge: .bottom) {
                Button {
                    onConfirm()
                    dismiss()
                } label: {
                    Text("Match \(matches.count) exercises").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(matches.isEmpty)
                .padding(Spacing.l)
                .background(AppColor.background)
            }
            .navigationTitle("Match all suggested")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Preview

#Preview("Unmatched exercises") {
    MatchingPreview()
}

/// Builds an in-memory database holding three Strong exercises that are not in the library,
/// by running a tiny synthetic CSV through the real importer.
private struct MatchingPreview: View {
    @State private var model: StrongMatchingModel?

    /// Names from the owner's real export that the library lacks; the CSV rows are invented.
    private static let strongNames = ["Bayesian Cable Curl", "Upper Seated Row", "Lat Machine Pull Over"]

    var body: some View {
        NavigationStack {
            if let model { StrongMatchingView(model: model) }
        }
        .task {
            let environment = AppEnvironment.preview()
            do {
                try Self.seed(environment)
                model = environment.makeStrongMatchingModel()
            } catch {
                Log.ui.error("Preview seeding failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    private static func seed(_ environment: AppEnvironment) throws {
        var lines = ["Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE"]
        for (index, name) in strongNames.enumerated() {
            for day in 1...(index + 2) {
                for set in 1...3 {
                    lines.append("2024-02-\(String(format: "%02d", day)) 10:00:00,Preview,1h,\(name),\(set),30.0,10.0,0,0.0,,,8")
                }
            }
        }
        let plan = StrongImportPlan.make(rows: try StrongWorkoutsFile.parse(lines.joined(separator: "\n")))
        let importer = StrongImporter(database: environment.database, snapshotDirectory: environment.snapshotDirectory)
        _ = try importer.importPlan(plan)
    }
}
