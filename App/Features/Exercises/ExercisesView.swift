import SwiftUI
import WorkoutCore

/// Browse, search and filter every exercise; the entry point to exercise details and to creating
/// the owner's own exercises.
struct ExercisesView: View {
    @Bindable var model: ExercisesModel

    @State private var newExercise: CustomExerciseModel?

    var body: some View {
        NavigationStack {
            content
                .background(AppColor.background)
                .navigationTitle("Exercises")
                .searchable(text: $model.query, prompt: model.searchPrompt)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        Button("New exercise", systemImage: "plus") {
                            newExercise = model.makeNewExerciseModel()
                        }
                    }
                }
                .navigationDestination(for: Int64.self) { exerciseID in
                    ExerciseDetailView(model: model.makeDetailModel(exerciseID: exerciseID))
                }
        }
        .task { await model.observe() }
        .sheet(item: $newExercise) { sheetModel in
            CustomExerciseView(model: sheetModel)
        }
    }

    @ViewBuilder
    private var content: some View {
        if let message = model.errorMessage {
            EmptyStateView(title: "Couldn't load exercises", message: message)
        } else {
            VStack(spacing: 0) {
                filterRow
                if model.isBrowsing {
                    browseList
                } else {
                    resultsList
                }
            }
        }
    }

    // MARK: Filters

    private var filterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.s) {
                muscleMenu
                equipmentMenu
                Button {
                    model.filter.customOnly.toggle()
                } label: {
                    FilterChip(title: "Mine", isActive: model.filter.customOnly)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, Spacing.l)
            .padding(.vertical, Spacing.s)
        }
    }

    private var muscleMenu: some View {
        Menu {
            Button {
                model.filter.muscle = nil
            } label: {
                checkedLabel("Any muscle", isChecked: model.filter.muscle == nil)
            }
            ForEach(MusclePickerView.groups, id: \.region) { group in
                Section(group.region.displayName) {
                    ForEach(group.muscles, id: \.self) { muscle in
                        Button {
                            model.filter.muscle = muscle
                        } label: {
                            checkedLabel(muscle.displayName, isChecked: model.filter.muscle == muscle)
                        }
                    }
                }
            }
        } label: {
            FilterChip(
                title: model.filter.muscle?.displayName ?? "Muscle",
                isActive: model.filter.muscle != nil, showsChevron: true
            )
        }
    }

    private var equipmentMenu: some View {
        Menu {
            Button {
                model.filter.equipment = nil
            } label: {
                checkedLabel("Any equipment", isChecked: model.filter.equipment == nil)
            }
            ForEach(Equipment.allCases, id: \.self) { equipment in
                Button {
                    model.filter.equipment = equipment
                } label: {
                    checkedLabel(equipment.displayName, isChecked: model.filter.equipment == equipment)
                }
            }
        } label: {
            FilterChip(
                title: model.filter.equipment?.displayName ?? "Equipment",
                isActive: model.filter.equipment != nil, showsChevron: true
            )
        }
    }

    @ViewBuilder
    private func checkedLabel(_ title: String, isChecked: Bool) -> some View {
        if isChecked {
            Label(title, systemImage: "checkmark")
        } else {
            Text(title)
        }
    }

    // MARK: Lists

    /// Recent exercises, then everything alphabetically.
    private var browseList: some View {
        List {
            if !model.recent.isEmpty {
                Section {
                    ForEach(model.recent) { row($0) }
                } header: {
                    SectionLabel("Recent")
                }
            }
            ForEach(model.sections) { section in
                Section {
                    ForEach(section.entries) { row($0) }
                } header: {
                    SectionLabel(section.letter)
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }

    /// One flat list in search order, or a prompt to create the exercise when nothing matches.
    @ViewBuilder
    private var resultsList: some View {
        let results = model.results
        if results.isEmpty {
            noMatch
        } else {
            List(results) { row($0) }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
        }
    }

    private var noMatch: some View {
        let name = model.query.trimmingCharacters(in: .whitespacesAndNewlines)
        return VStack(spacing: Spacing.m) {
            Spacer()
            if name.isEmpty {
                EmptyStateView(title: "No match", message: "No exercise fits these filters.")
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                EmptyStateView(title: "No match", message: "Try another name, or create “\(name)”.")
                    .fixedSize(horizontal: false, vertical: true)
                Button("Create “\(name)”") {
                    newExercise = model.makeNewExerciseModel(name: name)
                }
                .font(AppFont.headline)
                .foregroundStyle(AppColor.accent)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }

    private func row(_ entry: ExerciseSearch.Entry) -> some View {
        NavigationLink(value: entry.id) {
            HStack(alignment: .firstTextBaseline, spacing: Spacing.m) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.name).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                    Text(model.subtitle(for: entry))
                        .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                }
                Spacer(minLength: Spacing.s)
                if entry.isCustom {
                    Text("Custom").font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                }
            }
            .padding(.vertical, Spacing.xs)
        }
        .listRowBackground(AppColor.surface)
    }
}

#Preview {
    ExercisesView(model: AppEnvironment.preview().exercises)
}
