# Workout Tracker

A personal iPhone workout tracker that replaces Strong. It keeps the full Strong history, has a large exercise library and gives literature-based analytics. No AI, no social, no subscriptions.

- **Agents start here:** `AGENTS.md` (rules, start-of-session routine), then `docs/tasks/BOARD.md`
- **Plan and status:** `docs/PLAN.md`
- **How agents share work (tasks, review, handoff):** `docs/agents/WORKFLOW.md`
- **How the code is organised:** `docs/ARCHITECTURE.md`
- **Where data lives, backups, Strong import format:** `docs/DATA.md`
- **Visual design and charts:** `docs/DESIGN.md`
- **Why things are the way they are:** `docs/DECISIONS.md`
- **The research behind every formula:** `reports/Workout tracker app research.md`

## Everyday commands

```bash
make help     # list commands
make test     # run the logic tests on the Mac
make build    # build the app for the simulator
make verify   # tests + build (required before any task is done)
make sim      # run the app in the iPhone simulator
```

## Installing on the iPhone (free Apple ID)

One-time setup:
1. Xcode → Settings → Accounts → add your Apple ID. Note the "Personal Team" ID.
2. Copy `Config/Local.xcconfig.example` to `Config/Local.xcconfig` and put the team ID in it.
3. Run `make project`, then open `WorkoutTracker.xcodeproj` in Xcode.
4. Connect the iPhone, select it as the run destination, and press Run (▶).
5. On the iPhone: Settings → Privacy & Security → Developer Mode → on (it restarts), then Settings → General → VPN & Device Management → trust your Apple ID.
6. In the app: Settings → Choose folder… → pick or create a folder in iCloud Drive for backups.

Every week (free installs expire after 7 days): connect the iPhone and press Run again. **Your data stays.** Never delete the app to fix a signing problem; if you ever must, restore from the iCloud backup afterwards.
