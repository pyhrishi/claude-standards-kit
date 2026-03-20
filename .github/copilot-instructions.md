# Copilot Instructions — Enterprise Application Standards

These instructions apply to every suggestion in this repository.

## ALWAYS DO

**Database**
- snake_case for all table/column names
- Plural table names: `users`, `orders`, `products`
- Primary key: `id` (UUID v4 preferred)
- Foreign keys: `<table>_id` format
- Add `created_at`, `updated_at`, `deleted_at` to every table
- Use `deleted_at` nullable timestamp for soft deletes (not boolean)
- Generate versioned migration files for all schema changes
- Make migrations backward compatible

**API**
- Plural nouns in paths: `/users`, `/orders`
- Correct HTTP verbs only (GET/POST/PUT/PATCH/DELETE)
- Wrap all responses: `{ "data": ..., "meta": {}, "errors": [] }`
- ISO 8601 UTC timestamps: `2024-01-15T10:30:00Z`
- Return `[]` not `null` for empty arrays
- Version all APIs in URL: `/v1/`, `/v2/`
- Error format: `{ "code", "message", "details", "request_id" }`
- Rate limit all endpoints

**Frontend**
- TypeScript types for all component props
- Business logic in hooks/services, not components
- Design tokens for all colors, spacing, typography
- WCAG 2.1 AA accessibility standards
- React Query or SWR for server state

**Backend**
- Business logic only in service layer
- Stateless services
- DB access through repository/DAO only
- Structured JSON logging with trace_id
- All config from environment variables
- Secrets from secret manager only
- 80%+ unit test coverage for services

**Architecture**
- Services own their data exclusively
- Circuit breakers on all external calls
- OpenTelemetry tracing on all services

## NEVER DO

- Verbs in API paths (`/getUser`, `/createOrder`)
- `is_deleted` boolean for soft deletes
- Hardcoded secrets, API keys, connection strings
- Business logic in database triggers
- Log PII, passwords, or payment data
- Return HTTP 200 with error content in body
- Auth tokens in URL query parameters
- Cross-service direct database access
- Inline styles in frontend components
- Redux for remote/server state
- `null` for empty array fields in API responses
- Manual SQL schema changes (always use migrations)
- `.env` files committed to git

## RULE REFERENCE
Rule IDs follow format: `{PILLAR}-{SECTION}-{NUMBER}` (e.g., `DB-01-02`, `API-02-01`)
Full standards: `.ai/standards/` directory in this project
