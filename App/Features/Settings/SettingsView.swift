import SwiftUI
import UniformTypeIdentifiers

/// Settings: Strong import, backups and restore.
struct SettingsView: View {
    @Bindable var backup: BackupSettingsModel
    /// Creates a fresh import flow each time the sheet opens.
    let makeImportModel: () -> StrongImportModel

    @State private var importModel: StrongImportModel?

    @State private var isPickingFolder = false
    @State private var isPickingRestoreFile = false
    @State private var pendingRestoreURL: URL?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.xl) {
                    importSection
                    backupSection
                    restoreSection
                }
                .padding(Spacing.l)
            }
            .background(AppColor.background)
            .navigationTitle("Settings")
        }
        .task { backup.refresh() }
        .sheet(item: $importModel) { model in
            StrongImportView(model: model)
                .interactiveDismissDisabled()
        }
        .fileImporter(isPresented: $isPickingFolder, allowedContentTypes: [.folder]) { result in
            if case .success(let url) = result { backup.chooseFolder(url) }
        }
        .fileImporter(isPresented: $isPickingRestoreFile, allowedContentTypes: [.item]) { result in
            if case .success(let url) = result { pendingRestoreURL = url }
        }
        .confirmationDialog(
            "Replace all current data with this backup?",
            isPresented: Binding(get: { pendingRestoreURL != nil }, set: { if !$0 { pendingRestoreURL = nil } }),
            titleVisibility: .visible
        ) {
            Button("Restore", role: .destructive) {
                if let url = pendingRestoreURL { backup.restore(from: url) }
                pendingRestoreURL = nil
            }
        } message: {
            Text("Your current data is saved as a safety snapshot on this phone first.")
        }
        .alert("Backup problem", isPresented: Binding(get: { backup.errorMessage != nil }, set: { if !$0 { backup.errorMessage = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(backup.errorMessage ?? "")
        }
    }

    private var importSection: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            SectionLabel("Import")
            Card {
                Button("Import from Strong…") { importModel = makeImportModel() }
                    .padding(Spacing.m)
            }
            Text("Safe to repeat: workouts already imported are skipped.")
                .font(AppFont.callout)
                .foregroundStyle(AppColor.textTertiary)
        }
    }

    private var backupSection: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            SectionLabel("Backups")
            Card {
                row(label: "Folder", value: backup.folderName ?? "Not chosen")
                HairlineDivider()
                row(label: "Last backup", value: lastBackupText)
                HairlineDivider()
                HStack(spacing: Spacing.m) {
                    Button(backup.folderName == nil ? "Choose folder…" : "Change folder…") { isPickingFolder = true }
                        .buttonStyle(.bordered)
                    Spacer()
                    if backup.isWorking { ProgressView() }
                    Button("Back up now") { backup.backUpNow() }
                        .buttonStyle(.borderedProminent)
                        .disabled(backup.folderName == nil || backup.isWorking)
                }
                .padding(Spacing.m)
            }
            Text("Pick a folder in iCloud Drive. The app backs up there automatically when you leave it, at most every 15 minutes, keeping one backup per day for 14 days and one per month forever.")
                .font(AppFont.callout)
                .foregroundStyle(AppColor.textTertiary)
            if let status = backup.statusMessage {
                Label(status, systemImage: "checkmark.circle")
                    .font(AppFont.callout)
                    .foregroundStyle(AppColor.Status.good)
            }
        }
    }

    private var restoreSection: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            SectionLabel("Restore")
            Card {
                Button("Restore from a backup file…") { isPickingRestoreFile = true }
                    .foregroundStyle(AppColor.Status.critical)
                    .padding(Spacing.m)
                    .disabled(backup.isWorking)
            }
        }
    }

    private var lastBackupText: String {
        guard let date = backup.lastBackupAt else { return "Never" }
        return date.formatted(.relative(presentation: .named))
    }

    private func row(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(AppFont.body)
                .foregroundStyle(AppColor.textSecondary)
            Spacer()
            Text(value)
                .font(AppFont.body)
                .foregroundStyle(AppColor.textPrimary)
                .lineLimit(1)
        }
        .padding(Spacing.m)
    }
}

#Preview {
    let environment = AppEnvironment.preview()
    SettingsView(backup: environment.backupSettings, makeImportModel: environment.makeImportModel)
}
