# Native app (archived, read-only)

The first version of this app was native Swift. It moved to a web app on 2026-10-30 (see `docs/DECISIONS.md`).

This folder is the **specification for the port**: when a task says "port `X.swift`", read it here, along with its tests in `Packages/WorkoutCore/Tests/`, and reproduce the behaviour and every test case in TypeScript under `src/core`.

- Don't build, edit or import anything here.
- The complete native app, with its git history, is on the `native-archive` branch.
- Delete this folder once every milestone it covers (W1–W3) is ported.
