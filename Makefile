# Single entry point for building and testing. Run `make help`.
# Works even when xcode-select points at the Command Line Tools.

export DEVELOPER_DIR ?= /Applications/Xcode.app/Contents/Developer

PROJECT   := WorkoutTracker.xcodeproj
SCHEME    := WorkoutTracker
CORE_DIR  := Packages/WorkoutCore
SIM_DEST  := generic/platform=iOS Simulator
DERIVED   := build/DerivedData

.PHONY: help project test build build-device format clean

help: ## List available commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-14s %s\n", $$1, $$2}'

project: ## Regenerate the Xcode project from project.yml
	xcodegen generate --quiet

test: ## Run WorkoutCore unit tests on the Mac
	cd $(CORE_DIR) && swift test

build: project ## Build the app for the iOS Simulator (no signing)
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination '$(SIM_DEST)' \
		-derivedDataPath $(DERIVED) CODE_SIGNING_ALLOWED=NO build -quiet

build-device: project ## Build signed for a connected iPhone (needs Config/Local.xcconfig)
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination 'generic/platform=iOS' \
		-derivedDataPath $(DERIVED) -allowProvisioningUpdates build -quiet

format: ## Format all Swift files in place
	swift format --in-place --recursive App $(CORE_DIR)/Sources $(CORE_DIR)/Tests

clean: ## Remove build products
	rm -rf build $(CORE_DIR)/.build
