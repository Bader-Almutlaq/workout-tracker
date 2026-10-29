@AGENTS.md

## Claude Code notes

- Subagents: give a cheaper model (Sonnet or Haiku) tasks that have a written brief in `docs/tasks/` with clear acceptance criteria. Keep design decisions, cross-cutting changes and reviews on the lead model. See `docs/agents/WORKFLOW.md` → *Choosing a model*.
- Parallel subagents that write code must not share files. Give each its own task file and, when possible, its own git worktree.
- The iOS Simulator tools (`mcp__Claude_Code_iOS_Simulator__*`) can screenshot and tap the running app; `make sim` installs it first.
