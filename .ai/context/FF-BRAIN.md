# FF-BRAIN — FraudFighter Domain Brain
> ALWAYS LOADED. Every session. Every service. Every task.
> This is the single source of truth for what FraudFighter IS and how it thinks.
> Load specific context modules for deeper work — see routing table below.

---

## What FraudFighter Is

FraudFighter is an **AI-native fraud monitoring and prevention platform** inside ZIGRAM's
FRAML ecosystem (Fraud + Anti-Money Laundering). It is one of six RAE applications.

It produces three decisions on every transaction: **PASS · REVIEW · BLOCK**

It operates across two performance tiers:
- **Inline path** — synchronous, real-time, P99 ≤ 30ms — auth/block decisions
- **Near-RT path** — Kafka-async, deeper analysis, P99 ≤ 100ms — pattern/correlation

Target: 10M–100M+ transactions/day · 99.99% uptime · multi-tenant · multi-jurisdiction

---

## Where FF Sits in the RAE Ecosystem

```
RAE (Risk Application Ecosystem)
  ├── PreScreening.io     Name screening, watchlist monitoring          [LIVE]
  ├── Transact Comply     Transaction monitoring, AML rule detection    [LIVE]
  ├── Entity Hero         Entity lifecycle, onboarding risk             [LIVE]
  ├── Fraud Fighter       Fraud monitoring, behavioral fraud detection  [IN DEVELOPMENT]
  ├── Privacy Panda       Data privacy monitoring                       [PLANNED]
  └── Diligence Dragon    Due diligence, reputational risk              [PLANNED]
```

FF feeds into the **same RAE case hierarchy** as all other RAE apps.
FF Hits, Alerts, Checks, and Cases must conform to the canonical RAE model.
→ See `.ai/context/rae-case-architecture.md` for the full hierarchy spec.

---

## The Four Detection Engines (always work together)

```
Transaction / Entity Activity
        ↓
┌───────────────────────────────────────────────────────┐
│  1. Rules Engine        — configurable, threshold-based│
│  2. ML Models           — behavioral, anomaly, network │
│  3. Behavioral Analytics — pattern deviation scoring  │
│  4. Entity Risk Intel   — cross-signal entity profiles │
└───────────────────────────────────────────────────────┘
        ↓
  FraudDecision (PASS / REVIEW / BLOCK)
        ↓
  Hit → Alert → Check → Case  (RAE hierarchy)
```

---

## Non-Negotiable Domain Facts

**1. Default language — .NET (C#)**
FraudFighter backend services are built in **.NET (C#)** by default.
All generated code, boilerplate, patterns, and examples must use .NET / C# unless the service's
`.ai/context/tech-stack.md` explicitly specifies a different language.

```csharp
// Default stack
// Language:   C# (.NET 8)
// Framework:  ASP.NET Core Web API
// ORM:        Entity Framework Core
// Testing:    xUnit + Moq
// Migrations: EF Core Migrations
```

**2. FraudDecision enum — never use raw strings**
```csharp
// C# (.NET — default)
public enum FraudDecision { Pass, Review, Block }
```
```ts
const FraudDecision = Object.freeze({ PASS:'PASS', REVIEW:'REVIEW', BLOCK:'BLOCK' })
```
```python
class FraudDecision(Enum): PASS='PASS'; REVIEW='REVIEW'; BLOCK='BLOCK'
```

**3. Decision thresholds — read from `ff_rule_thresholds`, never hardcode**
```
Score ≥ 0.85  →  BLOCK
Score 0.50–0.84  →  REVIEW
Score < 0.50  →  PASS
```

**4. RAE hierarchy — 1 rule = 1 Alert, always**
```
Hit (rule fires) → Alert (1 rule) → Check (category) → Case (entity container)
```
A transaction is evidence on a Hit. It is NOT a Hit.

**5. ML models in production**
| Model | Detects |
|---|---|
| Transaction Fraud Model | Anomalous transaction behavior |
| Entity Risk Model | Entity risk profile evaluation |
| Behavioral Anomaly Model | Deviations from normal behavior |
| Account Takeover Model | Unauthorized account access |
| Mule Network Model | Coordinated fraud account networks |

**6. Multi-entity monitoring** — FF analyzes signals across:
`ACCOUNT` · `DEVICE` · `IP_ADDRESS` · `GEOLOCATION` · `MERCHANT` · `FRAUD_NETWORK`

**7. The investigation lifecycle — always this order**
```
Data Ingestion → Fraud Analysis → Decisioning → Investigation → Reporting
```

---

## Core DB Tables (ff_ prefix, every table has tenant_id)

| Table | Owned by |
|---|---|
| `ff_transactions` | ff-scoring-service |
| `ff_scores` | ff-scoring-service |
| `ff_hits` | ff-scoring-service |
| `ff_alerts` | ff-alert-service |
| `ff_checks` | ff-alert-service |
| `ff_cases` | ff-alert-service |
| `ff_rules` | ff-rules-service |
| `ff_rule_versions` | ff-rules-service |
| `ff_rule_thresholds` | ff-rules-service |
| `ff_entity_profiles` | ff-entity-service |
| `ff_reports` | ff-reporting-service |
| `ff_audit_logs` | shared / all services |

Every table has: `id` · `created_at` · `created_by` · `modified_at` · `modified_by` · `deleted_at` · `tenant_id`

---

## Roles (use exactly these strings)
`ff_admin` · `ff_analyst_l1` · `ff_analyst_l2` · `ff_risk_manager` · `ff_compliance`

---

## Context Module Routing — Load When Needed

| Working on | Load |
|---|---|
| Transaction scoring, inline/near-RT path, ML integration | `ff-scoring-context.md` |
| Rules engine, rule CRUD, simulation, versioning | `ff-rules-engine-context.md` |
| Alerts, cases, investigation workflow, case management | `ff-alert-investigation-context.md` + `rae-case-architecture.md` |
| Entity profiles, entity risk, linkage, mule networks | `ff-entity-profiles-context.md` |
| SAR/STR reports, regulatory filing, jurisdiction handling | `ff-regulatory-reporting-context.md` |
| Dashboards, KPIs, operational monitoring | `ff-dashboard-context.md` |

---

## Platform Architecture (4 layers — always reference this)

```
Intelligence Layer   AI models · analytics · scoring engines
Application Layer    Case management · monitoring dashboards
Support Layer        API integration · deployments · operational support
Data Layer           Rule libraries · watchlists · sanctions lists
```

---

## What NOT to do (domain-level AVOID)

- [AVOID] Treating a transaction as an investigation object — it is evidence on a Hit
- [AVOID] Hardcoding decision thresholds — always read from `ff_rule_thresholds`
- [AVOID] Creating more than 1 Alert per rule/watchlist trigger
- [AVOID] Putting ML scoring on the alert creation path — ML is on the inline scoring path
- [AVOID] Skipping the Check layer — every Alert must belong to a Check
- [AVOID] Creating a Case without an owning entity
