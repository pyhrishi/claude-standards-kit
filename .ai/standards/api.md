# API STANDARDS — ALWAYS APPLY
> Scope: ALL API development. Products: TransactComply (tc) · FraudFighter (ff)
> Severity: [MUST] = blocks merge · [SHOULD] = default, deviation needs comment · [AVOID] = never do

---

## HTTP METHODS

| Method | Idempotent | Use For |
|---|---|---|
| GET | Yes | Read/retrieve. **Never modifies state.** |
| POST | No | Create a resource or non-idempotent action |
| PUT | Yes | Full resource replacement — client sends complete object |
| PATCH | No | Partial update — only changed fields in body |
| DELETE | Yes | Remove resource. 204 even if already deleted. |

- [MUST] GET has zero side effects — no state changes in a GET handler
- [MUST] PUT = full replace · PATCH = partial — never swap them
- [AVOID] Using POST for everything · modifying state in GET

---

## NAMING CONVENTIONS

**Format:** `/api/v{n}/{Resource}/{PascalCaseVerb+Descriptor}`

```
/api/v1/Projects/GetProjectsByClientId
/api/v1/Cases/GetCaseManagerData
/api/v1/Users/CreateUser
/api/v1/Roles/GetRolesByProjectId
/api/v1/Entities/UpdateEntityStatus
```

- [MUST] Action names are PascalCase: `GetProjectsByClientId` `CreateUser` `DeleteCase`
- [MUST] Start with a verb: `Get` `Create` `Update` `Delete` `Search` `Validate` `Process`
- [MUST] Name must be self-explanatory without reading documentation
- [MUST] Include the key filter when it narrows results: `GetProjectsByClientId` not `GetProjects`
- [AVOID] Generic names: `/GetData` `/Process` `/Execute` · abbreviations · snake_case · kebab-case

**CORRECT:** `/api/v1/Projects/GetProjectsByClientId`
**WRONG:** `/api/getprojects` · `/api/data` · `/api/v1/projects/get_projects_by_client_id`

---

## VERSIONING  ⚠ NOT CURRENTLY IN USE — REQUIRED GOING FORWARD

- [MUST] All new endpoints versioned from day one: `/api/v1/` `/api/v2/`
- [MUST] Version in the URL path — never in headers or query params
- [MUST] Breaking changes (removed fields, type changes, new required params) = new major version
- [MUST] Deprecated endpoints return `Deprecation: true` + `Sunset: <date>` headers
- [SHOULD] Non-breaking additive changes (new optional fields) may stay in same version
- [AVOID] Changing behavior of an existing version silently

```
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: </api/v2/Projects/GetProjectsByClientId>; rel="successor-version"
```

---

## RESPONSE STANDARDS

### Field naming — camelCase always
```json
{ "roleId": 1, "roleName": "admin", "displayName": "Project Admin" }
```
Never `RoleId` (PascalCase) or `role_name` (snake_case).

### Standard envelope — all responses
```json
// Success
{ "success": true, "data": { ... } or [ ... ], "meta": { "requestId": "uuid", "timestamp": "ISO8601", "pagination": { ... } } }

// Error
{ "success": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...], "requestId": "uuid" } }
```

### HTTP Status Codes
| Code | When |
|---|---|
| 200 | Successful GET / PUT / PATCH |
| 201 | Resource created (POST) — include `Location` header |
| 204 | Successful DELETE or no-body action |
| 400 | Invalid input, missing fields, validation failure |
| 401 | Missing or invalid token — must re-authenticate |
| 403 | Authenticated but not authorized |
| 404 | Resource does not exist |
| 409 | Conflict — duplicate resource, business rule violation |
| 422 | Well-formed request but fails business validation |
| 429 | Rate limit exceeded — include `Retry-After` header |
| 500 | Unhandled server error — never expose stack trace |

- [MUST] All fields camelCase · all responses in standard envelope
- [MUST] Timestamps: ISO 8601 UTC `2024-01-15T10:30:00Z`
- [MUST] Empty lists = `[]` not `null` · Content-Type: `application/json`
- [MUST] Error body includes `code` (machine) + `message` (human) + `requestId`
- [AVOID] HTTP 200 with error content in body · exposing stack traces or DB errors

---

## AUTHENTICATION & SECURITY

### JWT — Primary Auth
- [MUST] JWT passed in `Authorization: Bearer <token>` header
- [MUST] Every token must have `exp` claim — no non-expiring tokens ever
- [MUST] Expiry times agreed with engineering — not set arbitrarily
- [MUST] Sign with RS256 (asymmetric) — never HS256 in production
- [MUST] Token revocation mechanism must exist
- [AVOID] JWT in localStorage · tokens in URL query params

```json
// Required JWT claims
{ "sub": "user_id", "iat": 1705312200, "exp": 1705313100,
  "jti": "unique-id", "roles": ["admin"], "product": "tc" }
```

### API Keys — M2M & Cross-Ecosystem
- [MUST] API keys for machine-to-machine and cross-AML-ecosystem calls only
- [MUST] Passed in `X-API-Key` header — never in URL
- [MUST] Keys have expiry + rotation schedule agreed with engineering
- [MUST] Stored in secrets manager — never hardcoded or in env files

### Encryption
- [MUST] HTTPS / TLS 1.2+ everywhere — no HTTP in any environment
- [MUST] mTLS preferred for service-to-service API calls
- [MUST] AES-256 symmetric · RSA-2048+ or ECC asymmetric
- [AVOID] MD5, SHA-1, RC4, DES, 3DES — use SHA-256+

---

## PAGINATION, FILTERING & SORTING  ⚠ MANDATORY ON ALL LIST ENDPOINTS

### Pagination — required on every list endpoint
```
GET /api/v1/Projects/GetProjectsByClientId?clientId=123&page=1&pageSize=20
```
```json
"meta": { "pagination": { "page": 1, "pageSize": 20, "total": 247, "totalPages": 13, "hasNextPage": true } }
```
- [MUST] All list endpoints paginated — no unbounded result sets
- [MUST] `page` + `pageSize` query params · response includes full pagination meta
- [MUST] Default and max `pageSize` agreed with engineering per endpoint

### Filtering
```
GET /api/v1/Cases/GetCasesByStatus?status=active&clientId=123&fromDate=2024-01-01&toDate=2024-03-31
```
- [MUST] Filter params are camelCase query params matching response field names
- [MUST] Date filters use ISO 8601: `fromDate=2024-01-01`
- [AVOID] Encoding filters in the endpoint name — use `GetCases?status=active` not `GetActiveCases`

### Sorting
```
GET /api/v1/Projects/GetProjectsByClientId?sortBy=createdAt&sortOrder=desc
```
- [MUST] `sortBy` (camelCase field name) + `sortOrder` (`asc`/`desc`)
- [SHOULD] Sensible default sort on all lists (e.g. `createdAt desc`)

---

## DOCUMENTATION

- [MUST] Every endpoint has an OpenAPI 3.0 / Swagger spec
- [MUST] Docs include: description, all params, request body schema, all response schemas including errors
- [MUST] Updated in same PR as the code change — never a follow-up
- [MUST] Swagger UI available in dev and staging
- [AVOID] Word or Confluence docs as the only documentation source

---

## RATE LIMITING  — values agreed with engineering

- [MUST] All endpoints have rate limiting — no unthrottled endpoints in production
- [MUST] Exceeding limit = HTTP 429 + `Retry-After` header
- [MUST] Return on every response: `X-RateLimit-Limit` · `X-RateLimit-Remaining` · `X-RateLimit-Reset`
- [SHOULD] Different limits for authenticated vs unauthenticated · user JWT vs service API key
- [SHOULD] Rate limiting at API gateway layer — not inside each service

---

## TESTING

- [MUST] Unit tests mandatory for every endpoint — **deployment BLOCKED if tests fail**
- [MUST] 80% coverage minimum on controllers and services
- [MUST] Tests cover: happy path · all validation errors · auth failure · 404 · 500
- [MUST] Tests run in CI/CD before deployment to any environment
- [MUST] VAPT before every production release
- [MUST] Critical/High VAPT findings block release — no exceptions
- [MUST] OWASP API Security Top 10 tested for every API
- [AVOID] Tests that hit real databases — use mocks or in-memory DB

**OWASP API Top 10 — check each:**
```
API1  Broken Object Level Auth    — caller owns the resource?
API2  Broken Authentication       — JWT validated, expiry checked?
API3  Broken Object Property Auth — no over-exposed fields in response?
API4  Unrestricted Resource Use   — rate limits + pagination limits?
API5  Broken Function Level Auth  — role checks on every endpoint?
API7  Security Misconfiguration   — HTTPS, CORS locked, debug off?
API9  Improper Inventory Mgmt     — all endpoints documented, no shadow APIs?
```

---

## REUSABLE COMPONENTS — ALWAYS USE, NEVER REIMPLEMENT

| Component | Use It For |
|---|---|
| Auth middleware | JWT validation + role checks — applied at router level |
| Error handling module | All error catching, formatting, status mapping |
| Database access layer (DAL) | All DB queries — no direct DB in controllers |
| Validation middleware | All input validation (body, query, path) before business logic |
| Logging utility | All logging — structured JSON with trace ID, no `console.log` |
| Pagination helper | Parse page/pageSize, build pagination meta |
| Response builder | Construct standard `{ success, data, meta }` envelope |
| Rate limiter | Applied at gateway/middleware — shared across endpoints |

- [MUST] Never reimplement auth, error handling, logging, or validation per-endpoint
- [MUST] All DB access through DAL — no raw queries in controllers or services

---

## SOLID PRINCIPLES

| | Rule | Applied |
|---|---|---|
| **S** Single Responsibility | One class = one job | Controller = HTTP only · Service = business logic · Repository = DB |
| **O** Open/Closed | Extend, don't modify | New auth method = new implementation, not editing JWT module |
| **L** Liskov Substitution | Subtypes are substitutable | MockEmailService works wherever EmailService is expected |
| **I** Interface Segregation | Depend only on what you use | IReadRepository ≠ IWriteRepository |
| **D** Dependency Inversion | Depend on abstractions | Controllers receive IUserService via DI — not concrete class |

- [MUST] Controller → Service → Repository layering — no business logic in controllers
- [MUST] Dependency injection throughout — no manual `new Service()` in controllers
- [SHOULD] Design patterns agreed with engineering before adoption

---

## LIBRARY GOVERNANCE — PRE-APPROVAL REQUIRED

- [MUST] All third-party libraries pre-approved by engineering before use
- [MUST] Active maintenance — last release within 12 months
- [MUST] No critical or high CVEs at time of adoption
- [MUST] License compatible with commercial use (MIT, Apache 2.0, BSD preferred — no GPL)
- [MUST] Pinned versions — no `^` or `~` wildcards in dependency files
- [MUST] Dependency vulnerability scanning in CI/CD on every build
- [AVOID] Libraries abandoned (no commits 18+ months) or single-maintainer
- [AVOID] Installing a library for a single utility function — implement it directly

**Evaluation checklist:** active maintenance · no CVEs · compatible license · adequate docs · community size (npm >100k/week) · transitive deps reviewed · approved by engineering

---

## CHECKLIST — BEFORE EVERY API ENDPOINT IS MERGED

```
[ ] Correct HTTP method used · no side effects in GET
[ ] URL follows /api/v{n}/{Resource}/{PascalCaseAction} format
[ ] Response uses standard envelope · camelCase fields · correct HTTP status code
[ ] JWT auth applied · expiry set · agreed with engineering
[ ] Pagination + filtering + sorting implemented (list endpoints)
[ ] OpenAPI/Swagger spec updated in same PR
[ ] Unit tests written · coverage ≥ 80% · CI passes
[ ] Rate limiting configured
[ ] VAPT findings addressed (pre-production)
[ ] Reusable components used — no reimplementation of auth/logging/errors
[ ] SOLID principles followed · design pattern agreed if new pattern introduced
[ ] All libraries pre-approved · pinned versions
```

## Section 14 — Latency & TPS Standards

> LATENCY IS NON-FUNCTIONAL REQUIREMENT — declare tier for every endpoint, load test before every release.
> Current LIVE production baseline: 30–50ms/transaction (Tier 2 standard APIs).

### Latency Tiers (declare in every API spec)
| Tier | API Type | P95 | P99 | Examples |
|---|---|---|---|---|
| Tier 1 Real-Time Inline | Sync inline decisioning | ≤8ms | ≤10ms | FF ScoreTransaction, card auth |
| Tier 2 Live Transactional | Standard CRUD/workflow | ≤30ms | ≤50ms | GetUserById, CreateCase — LIVE baseline |
| Tier 3 Near Real-Time | Async enrichment | ≤80ms | ≤100ms | Alert creation, entity enrichment |
| Tier 4 Batch/Reporting | Reports, exports, dashboards | ≤2s | ≤5s | GetFraudKPIs, ExportReport |

### TPS Targets
| Product | Current TPS | Scale TPS |
|---|---|---|
| FraudFighter inline | 1,000 | 10,000+ |
| FraudFighter near-RT | 5,000 | 50,000+ |
| TransactComply | 500 | 2,000 |
| PreScreening.io | 200 | 1,000 |

### Rules
[MUST] API-14-01: declare latency tier in API spec
[MUST] API-14-02: measure latency at controller entry/exit — not at load balancer
[MUST] API-14-03: Prometheus /metrics on every service — P50,P90,P95,P99 per endpoint
[MUST] API-14-04: Grafana alert on P99 breach for 3+ consecutive minutes
[MUST] API-14-05: load test before every production release — sustain declared TPS within tier P99
[SHOULD] API-14-06: document latency budget per endpoint (DB + external calls + logic + serialization)
[SHOULD] API-14-07: circuit breaker timeout tuned to preserve latency SLA
[AVOID] API-14-08: sync external calls on Tier 1 without hard timeout ≤4ms + circuit breaker
[AVOID] API-14-09: unbounded DB queries on Tier 1/2 — all queries must filter on indexed columns
[AVOID] API-14-10: deploying without a passing load test at declared TPS target
