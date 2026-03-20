# FF Rules Engine Context
> Load when working on: rule CRUD · rule versioning · simulation · rule promotion · AI rule optimization · threshold management
> Always load with: `docs/CLAUDE_BACKEND.md`

---

## Rules Engine Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Rules Engine                        │
│                                                      │
│  Rule Builder     →  create / edit / configure rules │
│  Knowledge Base   →  templates, best practices       │
│  Inference Engine →  real-time rule evaluation       │
│  AI Optimizer     →  auto-recommendations, conflict  │
└─────────────────────────────────────────────────────┘
```

Three inference modes — all handled by the same engine:
- **Statistical models** — threshold-based, aggregation-based
- **Heuristic models** — pattern matching, sequence detection
- **AI/LLM-based detection** — complex scenario inference (FF-specific capability)

---

## Rule Lifecycle — the only valid state machine

```
DRAFT → SIMULATION → PENDING_APPROVAL → ACTIVE → DEPRECATED
          ↑                                 ↓
          └─────── (test failed, revise) ───┘
```

- Rules NEVER go directly from DRAFT to ACTIVE — simulation first, always
- Rules can be enabled/disabled without code deployment (AC1 from PRD)
- Every state transition logged with: `userId`, `timestamp`, `justification` (AC2)
- Simulation shows alert volume impact before activation (AC3)

---

## DB Schema — `ff_rules`

```sql
ff_rules (
  id              BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id       UUID NOT NULL,
  rule_name       VARCHAR(255) NOT NULL,
  rule_code       VARCHAR(100) NOT NULL UNIQUE,  -- machine identifier
  description     TEXT,
  check_type      VARCHAR(100) NOT NULL,          -- maps to RAE Check category
  channel         VARCHAR(50),                    -- NULL = applies to all channels
  jurisdiction    VARCHAR(10),                    -- NULL = applies to all jurisdictions
  status          VARCHAR(50) NOT NULL,           -- DRAFT, SIMULATION, PENDING_APPROVAL, ACTIVE, DEPRECATED
  rule_definition JSONB NOT NULL,                 -- threshold config, conditions, logic
  severity        VARCHAR(20) NOT NULL,           -- LOW, MEDIUM, HIGH, CRITICAL
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      VARCHAR(255) NOT NULL,
  modified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_by     VARCHAR(255) NOT NULL,
  deleted_at      TIMESTAMPTZ
)
```

## DB Schema — `ff_rule_versions`

```sql
ff_rule_versions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY,
  rule_id         BIGINT NOT NULL REFERENCES ff_rules(id),
  tenant_id       UUID NOT NULL,
  version_number  INT NOT NULL,
  effective_from  TIMESTAMPTZ NOT NULL,
  effective_to    TIMESTAMPTZ,                    -- NULL = currently active version
  rule_definition JSONB NOT NULL,
  change_summary  TEXT,
  approved_by     VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      VARCHAR(255) NOT NULL
)
```

## DB Schema — `ff_rule_thresholds`

```sql
ff_rule_thresholds (
  id              BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id       UUID NOT NULL,
  threshold_key   VARCHAR(100) NOT NULL,   -- e.g. BLOCK_THRESHOLD, REVIEW_THRESHOLD
  threshold_value DECIMAL(5,4) NOT NULL,   -- e.g. 0.8500, 0.5000
  channel         VARCHAR(50),             -- NULL = global default
  jurisdiction    VARCHAR(10),             -- NULL = global default
  effective_from  TIMESTAMPTZ NOT NULL,
  effective_to    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      VARCHAR(255) NOT NULL,
  modified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_by     VARCHAR(255) NOT NULL
)
```

---

## API Endpoints

```
POST   /api/v1/Rules/CreateRule
GET    /api/v1/Rules/GetRuleById?ruleId=
GET    /api/v1/Rules/GetRulesByChannel?channel=&status=
PUT    /api/v1/Rules/UpdateRule
PUT    /api/v1/Rules/UpdateRuleStatus        -- enable / disable
DELETE /api/v1/Rules/DeleteRule              -- soft delete only, sets deleted_at

POST   /api/v1/Rules/SimulateRule            -- runs rule on historical data, returns impact
POST   /api/v1/Rules/PromoteRule             -- SIMULATION → PENDING_APPROVAL
POST   /api/v1/Rules/ApproveRule             -- PENDING_APPROVAL → ACTIVE (ff_risk_manager only)

GET    /api/v1/Rules/GetRuleVersions?ruleId=
GET    /api/v1/Rules/GetThresholds?channel=&jurisdiction=
PUT    /api/v1/Rules/UpdateThreshold         -- ff_admin only

GET    /api/v1/Rules/GetOptimizationSuggestions   -- AI-generated recommendations
POST   /api/v1/Rules/ApplyOptimization            -- one-click apply
GET    /api/v1/Rules/GetConflictReport            -- detect conflicting rules
```

---

## RBAC on Rule Operations

| Operation | Required role |
|---|---|
| Create / edit rule (DRAFT) | `ff_analyst_l2`, `ff_admin` |
| Run simulation | `ff_analyst_l2`, `ff_risk_manager`, `ff_admin` |
| Promote to PENDING_APPROVAL | `ff_analyst_l2`, `ff_admin` |
| Approve to ACTIVE | `ff_risk_manager`, `ff_admin` only |
| Enable / disable active rule | `ff_risk_manager`, `ff_admin` only |
| Update thresholds | `ff_admin` only |
| View rules | all FF roles |

---

## Simulation — what it must do

1. Run rule against last 30/60/90 days of historical `ff_transactions` (configurable window)
2. Compute: estimated alert volume · estimated false positive rate · comparison vs current ruleset
3. Show: "current ruleset: 450 alerts/day → proposed: 520 alerts/day (+15.6%)"
4. Simulation NEVER touches production data or creates real Hits/Alerts
5. Simulation results stored in `ff_simulation_results`, TTL 7 days

---

## AI-Native Rule Optimization (FF-specific capability)

The rules engine includes ML-powered optimization:

- **Performance monitoring** — tracks precision/recall per rule in production
- **Auto-recommendations** — suggests threshold adjustments based on false positive rate
- **Conflict detection** — identifies overlapping rules that double-count signals
- **Pattern-based generation** — suggests new rules from emerging fraud patterns
- **One-click optimization** — applies recommended changes after risk manager approval

Generated suggestions appear as DRAFT rules — they follow the same lifecycle (simulation → approval → active).

---

## Check Types — map rules to the RAE Check category

```java
enum FraudCheckType {
  // Fraud Monitoring Checks (FF)
  BEHAVIORAL_FRAUD,
  SUSPICIOUS_ACCESS,
  IDENTITY_THEFT_RISK,
  ACCOUNT_TAKEOVER,
  MULE_NETWORK,
  CARD_FRAUD,
  PAYMENT_FRAUD,
  CROSS_BORDER_FRAUD,

  // Transaction Monitoring Checks (shared with Transact Comply)
  SMURFING,
  SUDDEN_TRANSACTION_SPIKE,
  REPAYMENTS_EXCEEDING_INCOME,

  // Screening Checks (shared with PreScreening.io)
  SANCTIONS,
  PEP,
  WATCHLIST
}
```

Every rule must be assigned a `check_type`. This is how Hits group into Alerts group into Checks.

---

## Critical Rules

- [MUST] No rule goes ACTIVE without simulation — enforce in state machine
- [MUST] Every rule change logged with userId + timestamp + justification
- [MUST] Decision thresholds read from `ff_rule_thresholds` — never from application config
- [MUST] Rule approval (PENDING → ACTIVE) requires `ff_risk_manager` or `ff_admin` role
- [SHOULD] Rules scoped to channel + jurisdiction where possible — global rules are expensive
- [AVOID] Deleting rules — soft delete only (sets `deleted_at`), versions preserved
- [AVOID] Rule logic embedded in application code — all logic in `rule_definition` JSONB
