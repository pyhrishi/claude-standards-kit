# /project:checkpoint
Save verification state at a logical milestone.

Record in `.ai/context/session-state.md`:
1. **Milestone:** what was just completed
2. **State:** files changed, tests passing, coverage %, build status
3. **Open:** what remains to be done in this session
4. **Risks:** anything that could break if context is compacted now

Use before: major refactor · switching services · long pause · /compact
