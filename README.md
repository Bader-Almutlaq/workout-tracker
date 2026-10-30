# Workout Tracker

A personal workout tracker that replaces Strong: an offline web app on the iPhone Home Screen. It keeps every Strong workout, has a large modern exercise library, and gives science-based analytics. No accounts, no cloud, no ads; data never leaves the phone.

**Agents start at [`AGENTS.md`](AGENTS.md).** The plan and status are in [`docs/PLAN.md`](docs/PLAN.md), the task board in [`docs/tasks/BOARD.md`](docs/tasks/BOARD.md), and the way agents work together in [`docs/agents/WORKFLOW.md`](docs/agents/WORKFLOW.md).

## Commands

```bash
make install   # once, after cloning
make dev       # run the app at http://localhost:5173
make verify    # lint, type checks, tests and build: must pass before any task is done
make help      # everything else
```

## Putting it on the iPhone

1. Open the app's web address in **Safari** on the iPhone.
2. Tap **Share → Add to Home Screen**.
3. Open it from the Home Screen icon from then on. It works offline and never expires.

Back up from Settings now and then (one tap, saved to iCloud Drive). Deleting the Home Screen icon deletes the data on the phone; a backup brings it back.
