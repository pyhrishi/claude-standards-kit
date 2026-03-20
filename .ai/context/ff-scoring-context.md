# FF Scoring Context
> Load when working on: transaction scoring · inline path · near-RT path · ML model integration · SLA constraints
> Always load with: `docs/CLAUDE_BACKEND.md`

---

## Two Scoring Paths — Never Conflate Them

```
INLINE PATH (≤ 10ms P99)               NEAR-RT PATH (≤ 100ms P99)
─────────────────────────────          ─────────────────────────────
HTTP request → ScoreTransaction        Kafka consumer → ff.transactions.raw
Rules eval (budget: 4ms)               Deep correlation + pattern detection
ML score   (budget: 4ms)               Multi-transaction behavioral analysis
Entity cache lookup (Redis, 1ms)       Mule network detection
Decision returned in response          Alert creation → Case enrichment
```

Rule: **Alert creation NEVER happens on the inline path.** Inline returns a decision only.
Near-RT handles aggregation, Hit creation, Alert creation, Case updates.

---

## Inline Scoring Flow (exact)

```
POST /api/v1/Transactions/ScoreTransaction
  ↓
IngestController  [HTTP + input validation only]
  ↓
TransactionService.score(txn)  [business logic]
  ├── RulesEngineClient.evaluate(txn)         timeout: 4ms, CB fallback: rules-only
  ├── MLScoringClient.score(txn)              timeout: 4ms, CB fallback: score=0.0
  ├── EntityRiskRepository.getProfile(id)     Redis cache first (TTL 5min), then DB
  └── [decision computed, NO alert created]
  ↓
ScoringResponseDTO {
  decision: FraudDecision,
  fraudScore: Double,           // 0.0–1.0
  rulesFired: List<String>,
  modelVersion: String,
  requestId: UUID,
  latencyMs: Long
}
```

## Near-RT Flow (Kafka)

```
Kafka topic: ff.transactions.raw
  ↓
ScoringConsumer
  ↓
EnrichmentService  [deep entity enrichment, behavioral analysis]
  ↓
HitGenerationService  [creates ff_hits for fired rules]
  ↓
AlertAggregationService  [1 rule = 1 Alert, static or continuous mode]
  ↓
CaseUpdateService  [creates or updates ff_cases for the entity]
  ↓
Kafka topic: ff.decisions.output  [downstream consumers: alert-service, reporting]
```

---

## ScoringRequestDTO — required fields

```java
class ScoringRequestDTO {
  UUID transactionId;        // required — unique txn identifier
  UUID tenantId;             // required — multi-tenant isolation
  UUID entityId;             // required — account/customer being scored
  String entityType;         // required — ACCOUNT, DEVICE, IP_ADDRESS, MERCHANT
  BigDecimal amount;         // required for financial transactions
  String currency;           // ISO 4217
  String channel;            // CARD, UPI, NEFT, RTGS, CRYPTO, WALLET
  String merchantId;         // nullable
  String deviceId;           // nullable — links to device entity
  String ipAddress;          // nullable — links to IP entity
  GeoLocation geolocation;   // nullable
  Instant transactionTime;   // required — ISO 8601 UTC
  Map<String, Object> metadata; // extensible, channel-specific fields
}
```

---

## ScoringResponseDTO — always return exactly this

```java
class ScoringResponseDTO {
  FraudDecision decision;      // PASS, REVIEW, BLOCK
  Double fraudScore;           // 0.0–1.0
  List<String> rulesFired;     // rule IDs that contributed
  String modelVersion;         // ML model version used
  String requestId;            // UUID — for log correlation
  Long latencyMs;              // actual processing time
  Instant timestamp;           // ISO 8601 UTC
}
```

---

## ML Models — integration contract

Each model is called via `MLScoringClient` with a consistent interface:

```java
interface MLScoringClient {
  ModelScore score(ScoringRequestDTO request);  // timeout: 4ms
  // Returns: { modelId, score, confidence, topFeatures[], modelVersion }
}
```

Models available:
| Model ID | Detects | Input features |
|---|---|---|
| `txn-fraud-v1` | Anomalous transaction behavior | amount, channel, time, merchant, history |
| `entity-risk-v1` | Entity risk profile | entity attributes, historical signals |
| `behavioral-anomaly-v1` | Behavior deviation | velocity, location, device patterns |
| `account-takeover-v1` | Unauthorized access | login patterns, device changes, geo shifts |
| `mule-network-v1` | Coordinated fraud networks | account linkage, transfer patterns |

**If ML service is down: circuit breaker activates, score defaults to 0.0, rules-only decision.**
This must NOT result in an incorrect BLOCK — log degraded mode, use conservative threshold.

---

## Rules Engine — inline evaluation contract

```java
interface RulesEngineClient {
  RulesEvaluationResult evaluate(ScoringRequestDTO request);  // timeout: 4ms
  // Returns: { rulesFired[], aggregateRuleScore, thresholdBreached }
}
```

Rules evaluate against: AML rules · fraud detection rules · thresholds · watchlists ·
behavioral models · regulatory lists · event monitoring rules

---

## Entity Cache (Redis)

```
Key pattern:  ff:entity:{tenantId}:{entityId}
TTL:          5 minutes
On miss:      fetch from ff_entity_profiles table, populate cache
On update:    invalidate cache immediately, repopulate on next read
```

Never block the inline path on a cache miss that requires a slow DB query.
If entity profile fetch exceeds 1ms budget: return cached risk score or default = 0.3.

---

## SLA Enforcement Rules

- [MUST] Total inline response time ≤ 10ms P99 — measured at controller entry/exit
- [MUST] Rules evaluation ≤ 4ms — timeout + CB
- [MUST] ML scoring ≤ 4ms — timeout + CB
- [MUST] Entity cache lookup ≤ 1ms — Redis only, no DB on inline path
- [MUST] Circuit breaker on both RulesEngineClient and MLScoringClient
- [MUST] Fallback decision is NEVER automatically BLOCK — conservative fallback only
- [AVOID] Any synchronous I/O beyond Redis and the two service calls on the inline path
- [AVOID] Alert creation, case creation, or DB writes on the inline path

---

## Channels in scope

```java
enum TransactionChannel {
  CARD,           // credit/debit card
  UPI,            // Unified Payments Interface (India)
  NEFT, RTGS,     // bank transfers
  CRYPTO,         // cryptocurrency
  WALLET,         // digital wallet / PPI
  REMITTANCE,     // cross-border money transfer
  LENDING,        // loan disbursement / repayment
  BANKING         // core banking account activity
}
```
