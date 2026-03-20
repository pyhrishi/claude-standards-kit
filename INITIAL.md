# FraudFighter — New Service Bootstrap
> Claude Code reads this ONCE when you open a brand new FF service. Delete after use.

## Run this bootstrap sequence

Ask the user:
1. **Service name?** (e.g. `ff-scoring-service`, `ff-alert-service`, `ff-rules-service`)
2. **Language + framework?** (Java 17 + Spring Boot 3 / Node.js 20 + Express / Python 3.11 + FastAPI)
3. **DB tables this service owns?** (comma-separated, e.g. `ff_transactions, ff_scores`)
4. **Other FF services this calls?** (e.g. `ff-entity-service, ff-rules-service`)

Then generate in order:

### 1. Fill in `.ai/context/tech-stack.md` with the answers above

### 2. Create folder structure
```
src/
  controllers/    HTTP only — validate input, call service, return response
  services/       Business logic only — no HTTP, no direct DB
  repositories/   DB access only — no business logic
  models/         ORM entities / DB models
  dtos/           Request and Response DTOs (UserRequestDTO, UserResponseDTO)
  exceptions/     Custom exception classes per category
  middleware/     Auth (JWT), logging, rate limiting, validation
  config/         App config (no secrets here)
  utils/          logger, responseBuilder, requestId generator
tests/
  unit/           Service + repository unit tests (80%+ coverage target)
  integration/    Layer integration (Testcontainers)
  api/            Full HTTP round-trip tests
```

### 3. Generate boilerplate files

**Global exception handler** in `src/exceptions/GlobalExceptionHandler`
- Catches all unhandled exceptions
- Maps to FF standard error response format
- Never exposes stack traces to clients
- Logs with requestId + traceId

**Structured logger** in `src/utils/logger`
- Outputs JSON to stdout
- Auto-injects `traceId` from Jaeger headers
- Fields: `timestamp`, `level`, `service`, `traceId`, `spanId`, `message`
- NEVER logs: passwords, tokens, PII, card numbers

**JWT middleware** in `src/middleware/auth`
- Validates RS256 JWT from `Authorization: Bearer <token>`
- Checks: signature, expiry, audience, issuer
- Extracts roles: `ff_admin`, `ff_analyst_l1`, `ff_analyst_l2`, `ff_risk_manager`, `ff_compliance`

**Response builder** in `src/utils/responseBuilder`
```json
// Success: { "status":"success", "data":{}, "message":"...", "requestId":"uuid" }
// Error:   { "status":"error", "error":"...", "message":"...", "path":"...", "requestId":"uuid", "timestamp":"..." }
```

**Health check** `GET /health → { "status":"ok", "service":"<name>", "timestamp":"..." }`

**`.env.example`** — all required env vars, no real values
```
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
JWT_ISSUER=
JWT_AUDIENCE=
JAEGER_ENDPOINT=
SERVICE_NAME=
PORT=8080
```

**`Dockerfile`** — multi-stage build, non-root user, health check

### 4. Validate
- Logger outputs structured JSON with traceId ✓
- Health endpoint returns correct format ✓
- Exception handler returns FF error format ✓
- No secrets in any generated file ✓

### 5. Delete this file
