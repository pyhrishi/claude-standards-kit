# BACKEND STANDARDS v1.1 — ALWAYS APPLY
> Scope: ALL backend services. Products: TransactComply (tc) · FraudFighter (ff)
> Severity: [MUST] = blocks merge · [SHOULD] = default · [AVOID] = never do
> v1.1 changes marked 🆕

---

## LAYERED ARCHITECTURE

```
Client → Controller → Service → Repository → Database
```

| Layer | Responsibility | Must NOT contain |
|---|---|---|
| Controller | HTTP request/response, input validation, call service | Business logic, DB queries |
| Service | Business logic, orchestration, rules | HTTP concerns, direct DB calls |
| Repository / DAO | All DB queries and ORM calls | Business logic, HTTP concerns |
| Database | Storage, integrity constraints | Application logic |

- [MUST] Follow Controller → Service → Repository → Database — no layer bypassing
- [MUST] Controllers delegate immediately to service — no business logic in controllers
- [MUST] Services use repositories for all DB access — no direct DB calls in services
- [MUST] Dependency injection throughout — no manual `new ServiceClass()` in controllers
- [SHOULD] Each layer tested independently with separate unit tests
- [AVOID] Controller calling repository directly · fat controllers · logic mixed with HTTP

---

## CODING STANDARDS

### Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Class | PascalCase | `UserService`, `PaymentController` |
| Method / variable | camelCase | `getUserById()`, `transactionAmount` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Packages | lowercase.dot.separated | `com.zigram.ff.service` |
| DB entities | PascalCase | `UserEntity`, `TransactionEntity` |
| DTOs | PascalCase + DTO suffix | `UserRequestDTO`, `TransactionResponseDTO` |
| Interfaces | PascalCase with I prefix 🆕 | `IUserRepository`, `IPaymentGateway` |

- [MUST] Self-explanatory names — no single letters except loop counters
- [MUST] Consistent convention across entire service codebase
- [MUST] Methods do one thing — name describes exactly what it does
- [MUST] No magic numbers — all constants named and centralised
- [MUST] All code linted before commit — no linter violations in PRs
- [SHOULD] Methods under ~30 lines · each file single responsibility
- [AVOID] Abbreviations: usrMgr, txnPrc, calcAmt · commented-out code in commits

---

## EXCEPTION HANDLING

> Single global exception handler — no scattered try-catch anywhere

### Error Response Format v1.1 🆕
> path is NOT returned to clients — logged server-side only.
> requestId is a short opaque token, NOT a full UUID.

```json
{
  "timestamp": "2026-03-12T10:30:00Z",
  "status": 400,
  "error": "Invalid Request",
  "message": "User ID is required",
  "requestId": "short-opaque-token"
}
```
Note: path NOT returned to client — logged server-side only

| Exception Type | HTTP Status |
|---|---|
| Validation | 400 |
| Authentication | 401 |
| Authorization | 403 |
| Not Found | 404 |
| Business Rule | 422 |
| Conflict | 409 |
| External Service | 502 |
| Unhandled | 500 |

- [MUST] BE-03-01: single global exception handler — no per-endpoint try-catch
- [MUST] BE-03-02: error responses contain: timestamp, status, error, message, requestId — NO path, NO full UUID 🆕
- [MUST] BE-03-03: HTTP 500 never exposes stack traces or DB errors to client
- [MUST] BE-03-04: all exceptions logged with: requestId, user, endpoint, params, stack trace
- [MUST] BE-03-05: custom exception classes per category — not generic RuntimeException
- [SHOULD] BE-03-06: business rule exceptions include machine-readable error code
- [AVOID] BE-03-07: swallowing exceptions with generic message — always log and rethrow
- [AVOID] BE-03-08: HTTP 200 with error body — always use correct status code
- [AVOID] BE-03-09: exposing internal endpoint path in client-facing error responses 🆕
- [AVOID] BE-03-10: using full UUID as requestId in error responses — short opaque token only 🆕

---

## LOGGING

### Log Levels
| Level | Use for |
|---|---|
| INFO | Significant business events — be selective 🆕 |
| DEBUG | Technical detail — disabled in production |
| WARN | Non-fatal issues: slow query, retry, fallback |
| ERROR | Failures requiring investigation |

### Structured JSON Format (mandatory)
```json
{
  "timestamp": "2026-03-12T10:30:00.123Z",
  "level": "INFO",
  "service": "ff-scoring-service",
  "traceId": "abc123",
  "spanId": "def456",
  "action": "ScoreTransaction",
  "durationMs": 7,
  "message": "Transaction scored"
}
```

### OBSERVABILITY STACK 🆕
Jaeger (distributed tracing) + Grafana Loki (log dashboards).
Every log must include traceId. Every inter-service call propagates trace headers.

- [MUST] BE-04-01: all logs structured JSON — no plain text
- [MUST] BE-04-02: every log includes: timestamp, level, service, traceId, message
- [MUST] BE-04-03: Jaeger traceId propagated through all inter-service calls via HTTP headers
- [MUST] BE-04-04: ERROR logs include full exception context and stack trace
- [MUST] BE-04-05: never log: passwords, tokens, PII, card numbers, national IDs
- [SHOULD] BE-04-06: log INFO for significant business events only — be selective; excessive INFO logging increases latency and memory consumption 🆕
- [SHOULD] BE-04-07: DEBUG off in production by default
- [SHOULD] BE-04-08: log duration for all external calls (DB, APIs, cache)
- [AVOID] BE-04-09: console.log or System.out.println — use structured logging utility
- [AVOID] BE-04-10: logging inside tight loops — aggregate and log once

---

## SECURITY

### Authentication
```
Authorization: Bearer <jwt_token>
```
Validate: RS256 signature · not expired · correct audience + issuer · not revoked

- [MUST] BE-05-00: JWT token expiry set per agreed standard — short-lived access tokens (15-60 min) + refresh token rotation 🆕
- [MUST] BE-05-01: all endpoints behind auth middleware — no unprotected endpoints without explicit documentation
- [MUST] BE-05-02: JWT validated in middleware — signature, expiry, audience, issuer — not in individual service methods
- [SHOULD] BE-05-02a: custom authorization schemes (API keys, OAuth2 scopes, role hierarchies) allowed per service requirements — must be documented and approved 🆕
- [MUST] BE-05-03: RBAC enforced at service layer — not only at the gateway
- [MUST] BE-05-04: every action verified — caller owns or has permission for the resource
- [MUST] BE-05-05: sensitive data encrypted at rest with AES-256
- [MUST] BE-05-06: all inter-service comms HTTPS/TLS 1.2+ — no plaintext HTTP
- [MUST] BE-05-07: secure headers on all responses: HSTS, X-Content-Type-Options, X-Frame-Options, CSP
- [MUST] BE-05-08: no hardcoded secrets — all from secrets manager or env vars
- [SHOULD] BE-05-09: mTLS for service-to-service in production
- [AVOID] BE-05-10: logging sensitive data: passwords, full tokens, card numbers, national IDs
- [AVOID] BE-05-11: trusting user-supplied input for authorization without server-side verification

---

## VALIDATION

> AUTH FIRST, THEN VALIDATE 🆕
> Authentication middleware runs FIRST — before the controller is reached.
> Only authenticated requests proceed to input validation at the controller.

| Layer | Validates | When |
|---|---|---|
| Controller | Required fields, data types, string lengths, formats | Before calling service |
| Service | Business rules, entity exists, state transitions, permissions | Before calling repository |
| Repository | DB constraints: FK, uniqueness, NOT NULL | Last line of defence only |

- [MUST] BE-06-01: all required fields validated at controller before service is called
- [MUST] BE-06-02: data types validated: integers, dates, UUIDs, booleans
- [MUST] BE-06-03: string length limits enforced — no unbounded inputs
- [MUST] BE-06-04: email, phone, URL, date formats validated against patterns
- [MUST] BE-06-05: validation errors return HTTP 400 with field name and specific issue
- [MUST] BE-06-06: all list/filter inputs sanitized before DB queries — prevent SQL injection
- [SHOULD] BE-06-07: validation rules centralised in shared validator classes
- [SHOULD] BE-06-08: numeric inputs validated for min/max range
- [AVOID] BE-06-09: trusting client-supplied IDs for authorization without server-side verification
- [AVOID] BE-06-10: empty string as valid value for required fields — treat as missing

---

## API RESPONSE STANDARDIZATION

```json
// Success — single
{ "status": "success", "data": {"userId": 1042}, "message": "User retrieved", "requestId": "uuid" }

// Success — list
{ "status": "success", "data": [...], "pagination": {"page":1,"pageSize":20,"total":150,"totalPages":8}, "message": "...", "requestId": "uuid" }

// Error v1.1 — path NOT exposed, requestId is short opaque token 🆕
{ "status": "error", "message": "User not found", "error": "Resource Not Found",
  "timestamp": "2026-03-12T10:30:00Z", "requestId": "short-opaque-token" }
```

- [MUST] BE-07-01: success responses: status("success"), data, message, requestId
- [MUST] BE-07-02: error responses: status("error"), message, error, timestamp, requestId — NO path, NO full UUID 🆕
- [MUST] BE-07-03: all field names camelCase — never snake_case or PascalCase
- [MUST] BE-07-04: empty list = [] not null
- [MUST] BE-07-05: timestamps ISO 8601 UTC: 2026-03-12T10:30:00Z
- [MUST] BE-07-06: requestId in every response — short opaque correlation token 🆕
- [AVOID] BE-07-07: inconsistent structures across endpoints of same service
- [AVOID] BE-07-08: HTTP 200 with status:"error" — use correct status codes

---

## DEPENDENCY MANAGEMENT

- [MUST] BE-08-01: all dependencies approved by engineering before introduction
- [MUST] BE-08-02: versions pinned exactly — no ^, ~, or + ranges
- [MUST] BE-08-03: CVE scanning in CI/CD on every build (OWASP or Snyk)
- [MUST] BE-08-04: critical/high CVE findings block deployment — must be resolved
- [MUST] BE-08-05: no unused dependencies — remove before merging
- [SHOULD] BE-08-06: review and update dependencies at least quarterly
- [AVOID] BE-08-08: adding library for problem solvable with standard library
- [AVOID] BE-08-09: SNAPSHOT or pre-release versions in production

---

## CONFIGURATION MANAGEMENT

> Never hardcode. All env-specific config from env vars, config files, or secrets manager.

### Config Sources v1.1 🆕
| Config Type | Source |
|---|---|
| DB credentials | Secrets manager or environment variables 🆕 |
| API keys / tokens | Secrets manager |
| Service endpoints | Environment variables — internal cluster URLs for co-deployed services 🆕 |
| Feature flags | Environment variables |
| Non-sensitive config | YAML config files (committed to VCS) |
| Certificates / keys | Secrets manager or blob storage as text file (reference path via env var) 🆕 |

- [MUST] BE-09-01: no hardcoded env-specific values — all from env vars or config
- [MUST] BE-09-02: all secrets in secrets manager
- [MUST] BE-09-03: separate config per environment: dev, staging, production
- [MUST] BE-09-04: config files committed — secrets files NEVER committed
- [MUST] BE-09-05: validate required config on startup — fail fast with clear error if missing
- [MUST] BE-09-05a: service-to-service URLs for co-deployed services must use internal cluster URLs — never external DNS within same cluster 🆕
- [SHOULD] BE-09-05b: non-sensitive env config may use env vars directly; secrets always in secrets manager 🆕
- [SHOULD] BE-09-06: non-secret config changes do not require redeployment
- [AVOID] BE-09-07: committing .env, secrets.yml, or any file with credentials
- [AVOID] BE-09-08: production credentials in dev or staging

---

## TESTING — DEPLOYMENT BLOCKED IF TESTS FAIL

| Test Type | Tools | Coverage |
|---|---|---|
| Unit | JUnit 5 / Jest / PyTest | 80%+ on service + repository layers |
| Integration | Testcontainers | All critical flows |
| API | Postman Newman / REST Assured | All endpoints: happy path, errors, auth, 404, 500 |

- [MUST] BE-10-01: unit tests for all service methods — deployment blocked if fail
- [MUST] BE-10-02: 80%+ line coverage on service and repository layers
- [MUST] BE-10-03: all tests in CI/CD before any deployment
- [MUST] BE-10-04: unit tests mock all external deps — no real DB or API calls
- [MUST] BE-10-05: tests deterministic — no flaky or time-dependent tests
- [MUST] BE-10-06: API tests cover: happy path, validation errors, auth failure, 404, 500
- [SHOULD] BE-10-07: integration tests use Testcontainers for real DB
- [SHOULD] BE-10-08: test naming: methodName_scenario_expectedResult
- [AVOID] BE-10-09: tests that depend on execution order
- [AVOID] BE-10-10: testing implementation details — test behaviour and outcomes

---

## CHECKLIST — BEFORE EVERY BACKEND PR IS MERGED

### Architecture
- [ ] Controller: HTTP + validation only — no business logic
- [ ] Service: business logic only — no direct DB calls
- [ ] Repository: DB access only — no business logic
- [ ] DI used throughout — no manual new ServiceClass()

### Code
- [ ] Interfaces named with I prefix (IUserRepository) 🆕
- [ ] Names self-explanatory — no abbreviations
- [ ] No magic numbers · linter passes · no commented-out code

### Errors & Logging
- [ ] Global exception handler — no scattered try-catch
- [ ] Error responses: NO path, NO full UUID as requestId 🆕
- [ ] All logs structured JSON with traceId
- [ ] INFO logging selective — not every minor event 🆕

### Security
- [ ] JWT expiry set per standard 🆕
- [ ] Auth middleware runs BEFORE validation 🆕
- [ ] RBAC at service layer · no hardcoded secrets · inputs sanitized

### Config
- [ ] No hardcoded URLs — internal cluster URLs for co-deployed services 🆕
- [ ] Certificates from blob storage or secrets manager 🆕
- [ ] Config validates on startup

### Tests
- [ ] 80%+ coverage on service layer · tests deterministic · CI green
