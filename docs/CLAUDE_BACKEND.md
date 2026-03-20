# FraudFighter — Backend Rules
> Load for any backend task. Extends CLAUDE.md.
> **Default language: .NET (C# 12 / .NET 8)** — unless tech-stack.md specifies otherwise.
> Default stack: ASP.NET Core Web API · Entity Framework Core · xUnit + Moq · EF Core Migrations

## Architecture
```
Client → Controller → Service → Repository → Database
```
- **Controller** = HTTP + input validation only. No business logic.
- **Service** = Business logic + ML scoring + rules engine calls. No HTTP, no direct DB.
- **Repository** = DB queries via ORM only. No business logic.
- Dependency injection everywhere — never `new ServiceClass()` manually.

## FF Scoring Flow
```
IngestController
  → TransactionService.score(txn)
      → RulesEngineClient.evaluate(txn)        // sync, budget 4ms
      → MLScoringClient.score(txn)             // sync, budget 4ms
      → EntityRiskRepository.getProfile(id)    // Redis cache first
      → AlertService.createIfNeeded(result)    // async — off the inline path
  <- ScoringResponseDTO { decision, score, rulesFired, modelVersion, requestId }
```

## FraudDecision enum — always use this, never raw strings
```csharp
public enum FraudDecision { Pass, Review, Block }  // C# .NET (default)
```
```java
public enum FraudDecision { PASS, REVIEW, BLOCK }  // Java
```
```ts
const FraudDecision = Object.freeze({ PASS:'PASS', REVIEW:'REVIEW', BLOCK:'BLOCK' })  // TS
```
```python
class FraudDecision(Enum): PASS='PASS'; REVIEW='REVIEW'; BLOCK='BLOCK'  # Python
```

## Response format — always
```json
// Success
{ "status":"success", "data":{ "decision":"REVIEW", "score":0.87 }, "message":"Transaction scored", "requestId":"uuid" }

// Success list
{ "status":"success", "data":[...], "message":"...", "pagination":{ "page":1, "pageSize":20, "total":150, "totalPages":8 }, "requestId":"uuid" }

// Error
{ "status":"error", "error":"Validation Error", "message":"transactionId is required", "path":"/api/v1/Transactions/ScoreTransaction", "requestId":"uuid", "timestamp":"2026-03-17T10:30:00Z" }
```

## Structured log (Jaeger + Grafana Loki)
```json
{ "timestamp":"2026-03-17T10:30:00.123Z", "level":"INFO", "service":"ff-scoring-service", "traceId":"abc123", "spanId":"def456", "txnId":"txn_789", "decision":"REVIEW", "score":0.87, "latencyMs":7, "message":"Transaction scored" }
```

## DB tables (ff_ prefix always)
`ff_transactions` · `ff_alerts` · `ff_rules` · `ff_rule_versions` · `ff_entity_profiles`
`ff_cases` · `ff_reports` · `ff_audit_logs` · `ff_rule_thresholds`

**Mandatory columns on every table:**
`id` · `created_at` · `created_by` · `modified_at` · `modified_by` · `deleted_at` · `tenant_id`

## API naming (PascalCase verb-noun)
```
POST /api/v1/Transactions/ScoreTransaction
GET  /api/v1/Alerts/GetAlertsByEntityId
PUT  /api/v1/Rules/UpdateRuleStatus
POST /api/v1/Cases/CreateCase
GET  /api/v1/Dashboard/GetFraudKPIs
POST /api/v1/Reports/GenerateSAR
```

## SLA constraints — flag violations in generated code
- **Inline P99 ≤ 10ms**: zero blocking I/O, all external calls timeout ≤ 8ms + circuit breaker
- **Near-RT P99 ≤ 100ms**: Kafka consumer, async enrichment
- Alert creation ALWAYS async — never on inline path
- Redis cache entity profiles (TTL 5 min), fall through to DB on miss

## Decision thresholds (from ff_rule_thresholds — never hardcode)
Score ≥ 0.85 → BLOCK · Score 0.50–0.84 → REVIEW · Score < 0.50 → PASS

## Security
- JWT expiry set per standard — short-lived access tokens + refresh rotation
- JWT (RS256 via Keycloak) validated in middleware — once, not per-endpoint
- Roles: `ff_admin` `ff_analyst_l1` `ff_analyst_l2` `ff_risk_manager` `ff_compliance`
- RBAC check at **service layer** before business logic
- PII encrypted at rest (AES-256): account numbers, names, national IDs, device fingerprints
- Auth middleware runs FIRST — before controller validation
- Never log amount + account ID together (PII correlation risk)
- `tenant_id` filter on EVERY query — PostgreSQL row-level security

## Circuit breakers (required on all external calls)
- ML scoring: CB + fallback to rules-only decision
- External enrichment: timeout 2s + CB
- Kafka: dead-letter topic for poison messages — never halt consumer

## Testing
- Unit: service layer, mock all repos + mock ML/rules clients
- Integration: Testcontainers with real PostgreSQL
- Load: inline path sustains 1000 TPS with P99 ≤ 10ms
- Naming: `methodName_scenario_expectedResult`
