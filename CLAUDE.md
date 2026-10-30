@AGENTS.md

## Claude Code notes

- Subagents: give a cheaper model (Sonnet or Haiku) tasks that have a written brief in `docs/tasks/` with clear acceptance criteria. Keep design decisions, cross-cutting changes and reviews on the lead model. See `docs/agents/WORKFLOW.md` → *Choosing a model*.
- Parallel subagents that write code must not share files. Give each its own task file and, when possible, its own git worktree (run `make install` in a new worktree).
- Seeing the app: start `make dev` in the background, then use the built-in browser tools at 430 × 932 (dark and light), and `make sim-safari` plus the iOS Simulator tools for a check in real iPhone Safari.
