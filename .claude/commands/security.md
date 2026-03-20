# /project:security
Security audit of the current file. Delegate to ff-security-reviewer subagent.

Check for all of the following. Report severity: CRITICAL / HIGH / MEDIUM.
CRITICAL and HIGH block merge — must be fixed.

| Check | Severity |
|---|---|
| Hardcoded secret, password, API key, connection string | CRITICAL |
| SQL injection: raw string concatenation in queries | CRITICAL |
| PII in logs: account numbers, names, national IDs, device IDs | CRITICAL |
| Amount + account ID logged together | HIGH |
| Missing JWT validation on protected endpoint | CRITICAL |
| Missing RBAC check in service method | HIGH |
| Missing tenant_id filter on DB query | CRITICAL |
| Weak crypto: MD5, SHA-1, HS256 JWT signing, DES | HIGH |
| PII fields stored unencrypted | HIGH |
| External service call without circuit breaker + timeout | HIGH |
| Missing input sanitisation before DB query | HIGH |
| Inline CSS (style={{}}) in component | MEDIUM |
| Inline JS handler (onclick=) in markup | MEDIUM |

For each finding: severity · file location · exact line · recommended fix.
