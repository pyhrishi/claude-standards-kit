# FraudFighter — Claude Code
**Product:** FraudFighter (ff_) | FRAML ecosystem | Pillar 04 Backend + 03 UI
**SLA:** Inline P99 ≤ 10ms · Near-RT P99 ≤ 100ms · Uptime 99.99%
**Volume:** 10M–100M+ transactions/day

## Step 1 — Always load FF-BRAIN first
`.ai/context/FF-BRAIN.md` — the domain brain. Load before anything else, every session.

## Step 2 — Load the task context module
| Task | Load |
|---|---|
| Transaction scoring · ML · inline/near-RT path | `FF-BRAIN` + `ff-scoring-context.md` |
| Rules engine · CRUD · simulation · versioning | `FF-BRAIN` + `ff-rules-engine-context.md` |
| Alerts · Cases · investigation workflow | `FF-BRAIN` + `ff-alert-investigation-context.md` + `rae-case-architecture.md` |
| Entity profiles · linkage · mule networks | `FF-BRAIN` + `ff-entity-profiles-context.md` |
| SAR · STR · regulatory reports · filing | `FF-BRAIN` + `ff-regulatory-reporting-context.md` |
| Dashboards · KPIs · operational monitoring | `FF-BRAIN` + `ff-dashboard-context.md` |
| Case/Alert/Hit/Check hierarchy only | `FF-BRAIN` + `rae-case-architecture.md` |
| Any backend work (general) | `FF-BRAIN` + `docs/CLAUDE_BACKEND.md` |
| API endpoint design | `FF-BRAIN` + `docs/CLAUDE_BACKEND.md` + `.ai/standards/api.md` |
| DB schema / migration | `FF-BRAIN` + `docs/CLAUDE_BACKEND.md` + `.ai/standards/db.md` |
| Frontend / UI | `FF-BRAIN` + `docs/CLAUDE_FRONTEND.md` |
| New service from scratch | `FF-BRAIN` then `/project:scaffold` |
| Architecture / integration | `FF-BRAIN` + `docs/ARCHITECTURE.md` |
| Security audit | `FF-BRAIN` then `/project:security` |

## Non-negotiable (always active)
- `Controller → Service → Repository → Database` — no bypassing
- All logs: structured JSON with `traceId` — never `console.log`
- No secrets in code — env vars or AWS Secrets Manager only
- JWT (RS256) validated in middleware — RBAC at service layer
- DB tables: `ff_` prefix, snake_case, plural, 5 audit columns + `tenant_id`
- Error responses: `{ status, error, message, path, requestId, timestamp }`
- Unit tests mandatory — 80%+ service layer coverage — deployment blocked if fail
- Empty list = `[]` not `null` — timestamps ISO 8601 UTC
- RAE hierarchy: Hit → Alert → Check → Case — 1 Alert = 1 Rule/Watchlist, never more

## Violation quick-ref (use rule IDs in PR comments)
`BE-01-02` business logic in controller | `BE-01-03` direct DB in service
`BE-03-01` scattered try-catch | `BE-04-09` console.log / plain text log
`BE-09-01` hardcoded secret | `DB-07-01` missing FK index
`API-04-05` wrong HTTP status | `UI-01-15` hex colour in component
`RAE-01` multiple rules merged into one Alert | `RAE-02` transaction treated as investigation object

## Commands
`/project:review` · `/project:test` · `/project:security` · `/project:scaffold` · `/project:explain`
`/project:learn` · `/project:checkpoint` · `/project:verify` · `/project:plan`
