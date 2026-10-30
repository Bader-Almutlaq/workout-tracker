@AGENTS.md

## Claude Code notes

- Subagents: give a cheaper model (Sonnet or Haiku) tasks that have a written brief in `docs/tasks/` with clear acceptance criteria. Keep design decisions, cross-cutting changes and reviews on the lead model. See `docs/agents/WORKFLOW.md` → *Choosing a model*.
- Parallel subagents that write code must not share files. Give each its own task file and, when possible, its own git worktree (run `make install` in a new worktree).
- Seeing the app: start `make dev` in the background, then use the built-in browser tools at 430 × 932 (dark and light), and `make sim-safari` plus the iOS Simulator tools for a check in real iPhone Safari.
- Codex is installed and signed in (`codex`, ChatGPT account). For a well-specified task, run it in its own worktree in the background:
  `git worktree add .claude/worktrees/T-NNN -b task/T-NNN-name web && cd .claude/worktrees/T-NNN && make install`, then
  `codex exec -m gpt-6.1-terra -c model_reasoning_effort=high -s workspace-write -C "<worktree>" -o "<worktree>/codex-report.md" "<prompt>" < /dev/null`.
  Terra at high effort is the default implementer (cheaper, so more can run at once); use `gpt-6.1-sol` for harder work. Review its branch like any other.
