# Single entry point for building and testing. Run `make help`.
# Works even when xcode-select points at the Command Line Tools.

export DEVELOPER_DIR ?= /Applications/Xcode.app/Contents/Developer

PROJECT   := WorkoutTracker.xcodeproj
SCHEME    := WorkoutTracker
CORE_DIR  := Packages/WorkoutCore
SIM_DEST  := generic/platform=iOS Simulator
DERIVED   := build/DerivedData

.PHONY: help project test build verify sim screenshot build-device import-report format clean

help: ## List available commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-14s %s\n", $$1, $$2}'

project: ## Regenerate the Xcode project from project.yml
	xcodegen generate --quiet

test: ## Run WorkoutCore unit tests on the Mac
	cd $(CORE_DIR) && swift test

build: project ## Build the app for the iOS Simulator (no signing)
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination '$(SIM_DEST)' \
		-derivedDataPath $(DERIVED) CODE_SIGNING_ALLOWED=NO build -quiet

verify: test build ## Tests + app build. Must pass before a task is done

SIM_DEVICE ?= iPhone 17 Pro
APP_PATH   := $(DERIVED)/Build/Products/Debug-iphonesimulator/WorkoutTracker.app
BUNDLE_ID  := com.ketchup.workouttracker

sim: project ## Build, install and launch on the simulator (SIM_DEVICE="iPhone 17 Pro")
	xcrun simctl boot "$(SIM_DEVICE)" 2>/dev/null || true
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination 'platform=iOS Simulator,name=$(SIM_DEVICE)' \
		-derivedDataPath $(DERIVED) CODE_SIGNING_ALLOWED=NO build -quiet
	xcrun simctl install "$(SIM_DEVICE)" "$(APP_PATH)"
	xcrun simctl launch "$(SIM_DEVICE)" $(BUNDLE_ID)

screenshot: ## Save a simulator screenshot to build/screenshots/<timestamp>.png
	mkdir -p build/screenshots
	xcrun simctl io "$(SIM_DEVICE)" screenshot "build/screenshots/$$(date +%Y%m%d-%H%M%S).png"

build-device: project ## Build signed for a connected iPhone (needs Config/Local.xcconfig)
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination 'generic/platform=iOS' \
		-derivedDataPath $(DERIVED) -allowProvisioningUpdates build -quiet

import-report: ## Dry-run the Strong importer on export_data/ and print a report
	cd $(CORE_DIR) && swift run --quiet StrongImportReport "$(CURDIR)/export_data"

format: ## Format all Swift files in place
	swift format --in-place --recursive App $(CORE_DIR)/Sources $(CORE_DIR)/Tests

clean: ## Remove build products
	rm -rf build $(CORE_DIR)/.build
