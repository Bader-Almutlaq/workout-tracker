# T-005: Build the Strong matching screen (link imported names to the library)

- **Milestone:** M2
- **Depends on:** T-001, T-002, T-003 (all done)
- **Model tier:** mid

## Goal

After an import, some Strong exercise names don't exactly match a library exercise. Examples: "Bayesian Cable Curl", "Upper Seated Row", "Lat Machine Pull Over", "Cable Grip". Those exercises have no muscle tags, so analytics can't count them. This screen lists them, suggests the closest library exercises, and lets the owner either merge one into a library exercise (its history moves over) or keep it as their own and tag its muscles.

## Read first

- `AGENTS.md`, `docs/DESIGN.md`, `docs/DECISIONS.md` (the entries "Merging an exercise keeps its old name as an alias" and "Library exercises are read-only").
- Style references: `App/Features/Import/StrongImportView.swift` and `FindingGroupCard.swift`, and `App/DesignSystem/`.
- Core API:
  - `Queries/ExerciseCatalog.swift`: `observeUnmatchedImports(in:)` and `UnmatchedImport` (exercise, workoutCount, setCount); `entries(library:_:)` for building the search.
  - `Library/ExerciseSearch.swift`: `suggestions(forName:limit:)` and `results(for:filter:now:)`.
  - `Library/ExerciseEditor.swift`: `merge(_:into:)` (snapshot first; returns the moved count) and `update(_:with:)` (turns a Strong exercise into a custom one with muscles).
- `App/AppEnvironment.swift` exposes `database`, `library` and `exerciseEditor`.

## Scope

- **Create:** `App/Features/Matching/StrongMatchingModel.swift`, `StrongMatchingView.swift`, `LibraryExercisePicker.swift`.
- **Edit:** `App/Features/Settings/SettingsView.swift`. Add a row under the Import section, "Match Strong exercises", with a trailing count of unmatched exercises, pushing or presenting the screen. Hide the row when the count is 0. Also edit `App/AppEnvironment.swift` to add only a `makeStrongMatchingModel()` factory, appended at the end of the class.
- **Do not touch:** WorkoutCore, `App/Features/Exercises/` (another agent is building it in parallel), RootView.
- For the muscle tagging step, don't build a muscle picker. "Keep as my own" opens a simple form with name, primary muscles and secondary muscles. Use a plain multi-select `List` with `EditButton`-style checkmarks, kept inside `StrongMatchingView.swift` as a private view. T-004 builds the polished picker; the lead may unify them later.

## Specification

**StrongMatchingModel** (`@MainActor @Observable`):
- Observes unmatched imports.
- Holds an `ExerciseSearch` built from `ExerciseCatalog.entries` restricted to library entries (`!isCustom`). Rebuild it when entries change, or load it once on appear; that's fine.
- `suggestions(for:)` returns up to 3 entries.
- Actions:
  - `merge(_ unmatched:, into entryID:)`
  - `keepAsOwn(_ unmatched:, primary:, secondary:)`: calls `update` with a draft named as the exercise, with the muscles chosen.
  - `acceptAllTopSuggestions()`: merges every unmatched exercise whose top suggestion exists, after a confirmation that lists the pairs.
- Errors surface in an alert.

**StrongMatchingView** (title "Match exercises"):
- An intro line in `textSecondary`: "These names from Strong aren't in the library yet. Match each to a library exercise to count its sets per muscle. History moves with it; nothing is deleted."
- One card per unmatched exercise, most sets first:
  - **Title:** the Strong name, with "236 sessions · 1,402 sets" below it.
  - **Suggestions:** up to 3 rows, each with the library name and its primary muscles in `textTertiary`, and a "Match" button.
  - **"Search library…":** opens LibraryExercisePicker, a searchable list using `results(for:)`; tapping an entry picks it.
  - **"Keep as my own":** opens the muscle form described in *Scope*.
- Confirm a merge with a confirmation dialog: "Move 236 sessions of “Bayesian Cable Curl” into “Bayesian Curl (Cable)”?"
- Toolbar "Match all suggested" runs `acceptAllTopSuggestions` (with confirmation). It's disabled when no suggestions exist.
- When the list is empty: `EmptyStateView(title: "All matched", message: "Every imported exercise is linked to the library or tagged as your own.")`.

**General:**
- Design tokens only.
- Dark and light both checked.
- No business logic in views.
- Log failures with `Log.ui`.
- `///` doc comments everywhere.

## Acceptance criteria

- [ ] `make verify` passes with no new warnings.
- [ ] Previews: the preview environment has no Strong exercises, so the preview inserts 3 with `ExerciseEditor` or SQL through the model's database and shows the list.
- [ ] Simulator (if a runtime is installed): import a synthetic CSV, or use the preview data; merge one; it disappears; "Keep as my own" with muscles also removes it from the list. Screenshots in dark and light. If no runtime is installed, say so in the handoff.
- [ ] Handoff filled in.

## Handoff

- **Status:** review. `make verify` passes (112 core tests, iOS simulator build, no warnings). Not run on a simulator (see below).
- **What was done:** "Match Strong exercises" screen. `StrongMatchingModel` observes `ExerciseCatalog.observeUnmatchedImports` and `observeEntries` (library entries only), caches up to 3 suggestions per exercise, and offers `merge`, `keepAsOwn` and `acceptAllTopSuggestions`. Merges and edits run off the main thread; errors show in an alert and go to `Log.ui`. The view has one card per exercise (suggestions with "Match", "Search library…", "Keep as my own"), a merge confirmation dialog, a "Match all suggested" toolbar button that opens a sheet listing every pair, and the "All matched" empty state. `keepAsOwn` keeps the exercise's equipment, pattern, mechanic and tracking, and takes the name and muscles from a simple form. Settings gets a "Match Strong exercises" row with the unmatched count under Import, hidden at 0. The preview imports a small synthetic CSV through the real importer to create three Strong exercises.
- **Files touched:** created `App/Features/Matching/StrongMatchingModel.swift`, `StrongMatchingView.swift` (also holds the private `OwnExerciseForm` and `MatchAllConfirmation`), `LibraryExercisePicker.swift` (also holds `MatchingCandidateRow`). Edited `App/Features/Settings/SettingsView.swift` and `App/AppEnvironment.swift` (`makeStrongMatchingModel()` at the end of the class).
- **Decisions taken:**
  - The row is a `Button` that sets a flag used by `.navigationDestination(isPresented:)`, not a `NavigationLink`. Matching the last exercise hides the row, and a link would pop the screen from under the owner.
  - "Match all" uses a sheet, not a dialog: 30 pairs don't fit in a dialog message.
  - `keepAsOwn` has an optional `named:` because the form lets the owner rename.
- **Open questions / left over:**
  - **RootView must pass the factory.** `SettingsView` has a new `makeMatchingModel: (() -> StrongMatchingModel)?` parameter defaulting to `nil` (RootView was out of scope), and with `nil` the row never shows. The lead needs to change RootView to `SettingsView(backup: environment.backupSettings, makeImportModel: environment.makeImportModel, makeMatchingModel: environment.makeStrongMatchingModel)`.
  - "Match all" takes one snapshot per merge (core behavior of `ExerciseEditor.merge`). With ~30 exercises that is ~30 snapshots; the lead may want a batch merge or snapshot pruning in WorkoutCore.
  - The muscle form is deliberately plain; unify with T-004's picker later.
  - No view-level tests: the App has no test target. The matching logic is already covered by `ExerciseSearchTests` and `ExerciseEditorTests`.
- **How it was verified:** `make verify` (tests plus the unsigned simulator build). `xcrun simctl list runtimes` shows no iOS runtime installed, so I did not run `make sim`, check dark and light mode, or take screenshots. The `#Preview("Unmatched exercises")` is untested for the same reason.
