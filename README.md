# Claude Code AI Standards Kit
> Production-ready Claude Code scaffold for FraudFighter services.
> Based on the everything-claude-code architecture (affaan-m/everything-claude-code).

Drop into any FF service repository. All AI tools enforce standards automatically.

## Setup (2 minutes)

```bash
# 1. Copy into service root
unzip ff-standards-kit.zip
cp -r ff-standards-kit/. your-ff-service/

# 2. Fill in service details
nano .ai/context/tech-stack.md

# 3. Open Claude Code — CLAUDE.md is read automatically
# For a new service: Claude reads INITIAL.md and bootstraps everything
# For existing: run /project:review for a baseline violation report
```

## What's inside

```
CLAUDE.md              Root instructions — loaded every session automatically (~400 tokens)
INITIAL.md             New service bootstrap — run once then delete
AGENTS.md              Subagent definitions — universal, read by Claude Code/Cursor/Codex

docs/
  CLAUDE_BACKEND.md    FF backend rules + scoring flow + SLA constraints (~900 tokens)
  CLAUDE_FRONTEND.md   FF frontend rules + UI patterns (~400 tokens)
  ARCHITECTURE.md      Service boundaries, Kafka topics, AWS infra (~700 tokens)

.claude/
  commands/            Slash commands (9 total)
    plan.md         → /project:plan        Feature planning before code
    review.md       → /project:review      Standards compliance check
    test.md         → /project:test        Generate full test suite
    security.md     → /project:security    Security audit
    scaffold.md     → /project:scaffold    New service from scratch
    explain.md      → /project:explain     Plain-language file explanation
    learn.md        → /project:learn       Extract session patterns
    checkpoint.md   → /project:checkpoint  Save milestone state
    verify.md       → /project:verify      Full verification loop
  agents/              Subagent definitions (5 total)
    ff-planner.md         Feature planning
    ff-code-reviewer.md   Standards + correctness review
    ff-security-reviewer.md  Security audit
    ff-tdd-guide.md       Test-driven development
    ff-db-reviewer.md     Schema + query review
  settings.json        Token optimization (sonnet default, thinking 10k, compact at 50%)

hooks/
  hooks.json           Hook definitions
scripts/hooks/         Node.js hook implementations
  check-console-log.js   Warns on console.log in backend files
  check-secrets.js       BLOCKS writes with hardcoded secrets
  check-tenant-id.js     Warns on queries missing tenant_id
  session-start.js       Loads session context on start
  session-end.js         Saves session state on stop

contexts/
  dev.md               Development mode context
  review.md            Review mode context
  research.md          Research mode context

.ai/standards/         Full standards files (load on demand)
  backend.md  api.md  db.md  ui.md

.ai/context/           Per-service context (fill in once)
  tech-stack.md        Language, framework, DB, auth, infra
  domain-glossary.md   FF domain terms -> code names
  learned-patterns.md  Auto-updated by /project:learn
  session-state.md     Auto-updated by hooks

.cursor/rules/         Cursor AI integration
.github/               VS Code Copilot integration
```

## Slash commands

| Command | What it does | Delegates to |
|---|---|---|
| `/project:plan` | Feature plan before any code | ff-planner |
| `/project:review` | Standards compliance check (PASS/FAIL + rule IDs) | ff-code-reviewer |
| `/project:test` | Generate full test suite | ff-tdd-guide |
| `/project:security` | Security audit (CRITICAL/HIGH/MEDIUM) | ff-security-reviewer |
| `/project:scaffold` | New service from scratch | — |
| `/project:explain` | Plain-language file explanation | — |
| `/project:learn` | Extract session patterns to learned-patterns.md | — |
| `/project:checkpoint` | Save milestone to session-state.md | — |
| `/project:verify` | Build + test + review + security in sequence | all agents |

## Token budget

| Session type | Files loaded | ~Tokens |
|---|---|---|
| Every session (auto) | CLAUDE.md only | ~400 |
| Backend task | + CLAUDE_BACKEND.md | ~1,300 |
| New endpoint | + CLAUDE_BACKEND.md + api.md | ~4,000 |
| DB schema | + CLAUDE_BACKEND.md + db.md | ~3,300 |
| Full context | All docs + all standards | ~11,200 |

## Hooks (automatic)

The hooks run automatically — no configuration needed:
- **Pre-write:** Blocks any file write containing hardcoded secrets
- **Post-write:** Warns on console.log in backend files
- **Post-write:** Warns on repository files missing tenant_id
- **Session start:** Loads previous session state and learned patterns
- **Session stop:** Saves session state summary

## Token optimization settings

`.claude/settings.json` is pre-configured per ECC recommendations:
- Default model: Sonnet (not Opus) — handles 80%+ of FF coding tasks
- MAX_THINKING_TOKENS: 10,000 (down from 31,999 default)
- Auto-compact at 50% context (not 95% default) — better quality in long sessions
- Subagent model: Haiku for simple delegated tasks

Switch to Opus for deep architecture work: `/model opus`

## Monorepo setup

For a monorepo with multiple FF services:
```
ff-monorepo/
  CLAUDE.md           Root standards (global)
  AGENTS.md           Root agent definitions (global)
  .ai/standards/      Shared standards
  services/
    ff-scoring-service/
      CLAUDE.md       Service-specific context (short, references root)
      .ai/context/tech-stack.md
    ff-alert-service/
      CLAUDE.md
      .ai/context/tech-stack.md
```
