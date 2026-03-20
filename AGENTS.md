# FraudFighter — Agent Definitions
> Read by Claude Code, Cursor, Codex, and OpenCode automatically.
> Defines specialized subagents for delegation.

## When to delegate to a subagent
- Task is well-scoped and has clear inputs/outputs
- Task requires a different skill set than the main agent
- Task can be done in parallel with other work
- You want a second opinion on code quality or security

---

## ff-planner
**Role:** Break down a FraudFighter feature into an implementation plan before any code is written.
**Delegate when:** Starting any new feature, epic, or service.
**Produces:** Ordered task list, file list, API contracts, DB changes needed.
**Constraint:** Read-only. Never writes code directly.

---

## ff-architect
**Role:** Design service boundaries, data flows, and integration patterns for FraudFighter.
**Delegate when:** Adding a new FF service, integrating with external systems, or designing the inline vs near-RT data paths.
**Produces:** Architecture decision record (ADR), ASCII diagram, service boundary table.
**Constraint:** Always checks against `docs/ARCHITECTURE.md` service boundary rules before recommending.

---

## ff-code-reviewer
**Role:** Review FF service code for standards compliance, correctness, and production readiness.
**Delegate when:** Before any PR merge, or when you want an independent check on new code.
**Checks:**
- Layer separation (BE-01-xx rules)
- Structured logging with traceId (BE-04-xx)
- Error handling via global handler (BE-03-xx)
- RBAC at service layer (BE-05-xx)
- tenant_id isolation on all DB queries
- SLA risk on inline scoring path (blocking I/O, missing circuit breakers)
**Produces:** PASS/FAIL + violation list with rule IDs and exact fixes.

---

## ff-security-reviewer
**Role:** Security audit of FraudFighter code and configuration.
**Delegate when:** Before production deployment, after any auth/crypto/DB changes.
**Checks:** Hardcoded secrets · SQL injection · PII in logs · Missing JWT validation ·
RBAC gaps · Weak crypto (MD5/SHA1/HS256) · Unencrypted PII · Missing circuit breakers
**Produces:** Severity-ranked findings (CRITICAL/HIGH/MEDIUM). CRITICAL + HIGH block merge.

---

## ff-tdd-guide
**Role:** Enforce test-driven development for FraudFighter services.
**Delegate when:** Implementing any new feature or bug fix.
**Process:**
1. Write failing test first (RED)
2. Implement minimal code to pass (GREEN)
3. Refactor to standards (IMPROVE)
4. Verify 80%+ coverage on service layer
**FF-specific:** Include latency assertion on inline scoring path (P99 ≤ 10ms).

---

## ff-db-reviewer
**Role:** Review FraudFighter database schemas, migrations, and queries.
**Delegate when:** Any schema change, new migration, or complex query.
**Checks:** ff_ prefix · audit columns (5 mandatory) · tenant_id present ·
FK indexes · no business logic in DB layer · migration is backward-compatible ·
no raw SQL in service layer
**Produces:** PASS/FAIL with DB-specific rule IDs (DB-xx-xx).

---

## ff-build-resolver
**Role:** Fix failing builds, test failures, and CI errors in FF services.
**Delegate when:** Build is broken and you need a focused fix.
**Process:** Read error → trace root cause → fix minimal change → verify passes.

---

## ff-doc-updater
**Role:** Keep FraudFighter documentation in sync with code changes.
**Delegate when:** After any API change, new endpoint, or schema change.
**Updates:** OpenAPI spec · README · Confluence pages (if accessible) · .ai/context files.
