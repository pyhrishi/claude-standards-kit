# /project:review
Standards compliance review of the current file. Delegate to ff-code-reviewer subagent.

1. Load `.ai/standards/backend.md` (or `ui.md` for frontend files)
2. Load `docs/CLAUDE_BACKEND.md` for FF-specific patterns
3. Check every [MUST] rule systematically
4. Report each violation:
   - Rule ID (e.g. BE-01-02, DB-07-01)
   - Line number
   - What is wrong
   - Exact fix (show the corrected code)
5. Check FF-specific issues:
   - SLA risk: blocking I/O or sync external call on inline scoring path
   - PII logging: amount + account ID logged together
   - Missing circuit breaker on external service call
   - Missing tenant_id filter on any DB query
   - FraudDecision raw string instead of enum
6. End with: PASS / FAIL · violation count · severity summary
