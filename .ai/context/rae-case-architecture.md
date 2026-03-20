# RAE Investigative Case Architecture
> Source: ZIGRAM Risk Application Ecosystem (RAE) — Memo, 11 March 2026, Author: Abhishek Bali
> Scope: ALL ZIGRAM applications — PreScreening.io · Transact Comply · Entity Hero · Fraud Fighter · Privacy Panda · Diligence Dragon
> Load this whenever generating code that touches Cases, Alerts, Hits, Checks, or investigation workflows.

---

## The Four-Layer Hierarchy — Canonical, Non-Negotiable

```
Entity Activity → Raw Signals → Rules Engine → Risk Signals
                                                     ↓
                                                    Hit        ← atomic risk signal (1 rule fires)
                                                     ↓
                                                   Alert       ← 1 rule OR 1 watchlist = 1 Alert
                                                     ↓
                                                   Check       ← investigation category grouping Alerts
                                                     ↓
                                                    Case        ← entity investigation container
                                                     ↓
                                               [Master Case]   ← optional grouping of Cases
```

Signal aggregation always flows upward: Hit → Alert → Check → Case.
Investigation navigation always flows downward: Case → Check → Alert → Hit.

---

## Layer Definitions

### Hit — Atomic Risk Signal
- Smallest unit. Generated when a single rule condition evaluates to true.
- A Hit exists ONLY when a rule fires.
- A Hit references evidence: transactions, system events, entity attributes, behavioral signals.
- Transactions/activities are NOT Hits — they are evidence attached to Hits.
- DB object: `rae_hits` (or application-specific: `ff_hits`, `tc_hits`, `ps_hits`)

```
Examples:
  sanctions match detected
  smurfing transaction pattern detected
  suspicious login activity
  identity information modification
  abnormal behavioral pattern
  behavioral fraud signal
```

### Alert — Rule-Level Risk Signal
- Aggregates all Hits produced by a SINGLE rule OR a single watchlist definition.
- **1 Alert = 1 Rule OR 1 Watchlist OR 1 Watchlist Definition** — this is a hard constraint.
- One Alert may contain many Hits.
- DB object: `rae_alerts`

```
Example:
  Rule: Smurfing Detection
  Alert: "Smurfing Rule Triggered"
    └ Hit 1 (txn_001 — $4,900)
    └ Hit 2 (txn_002 — $4,800)
    └ Hit 3 (txn_003 — $4,750)
```

**Two aggregation modes (client-configurable):**
- `STATIC` — Alert contents fixed once created. New triggers create a new Alert.
- `CONTINUOUS` — New Hits appended to existing open Alert when rule triggers again.

### Check — Investigation Category
- Groups Alerts that belong to the same investigation category.
- The primary unit analysts interact with when reviewing a Case.
- Some Checks are system-defined; some are client-configurable.
- A Check may contain multiple Alerts.
- Checks and Alerts exist structurally even with zero Hits. They become visible in the UI only when Alerts contain Hits (unless analyst is viewing detailed case logs).
- DB object: `rae_checks`

```
Check types by application domain:

SCREENING CHECKS (PreScreening.io)
  Politically Exposed Persons
  Sanctions
  India Watchlists

TRANSACTION MONITORING CHECKS (Transact Comply)
  Smurfing
  Sudden Transaction Spikes
  Repayments Exceeding Declared Income

FRAUD MONITORING CHECKS (Fraud Fighter)
  Behavioral Fraud
  Suspicious Access
  Identity Theft Risk

LIFECYCLE MONITORING CHECKS (Entity Hero)
  ReKYC Trigger
```

```
Example — multiple Alerts inside one Check:
  Check: Sanctions
    └ Alert: UN Sanctions
    └ Alert: OFAC Sanctions
    └ Alert: EU Sanctions
```

### Case — Entity Investigation Container
- One Case per entity investigation.
- Contains: Checks, Alerts, Hits, investigator notes, decisions, evidence, audit trail, regulatory reporting actions.
- Cases are entity-centric — always anchored to a single entity.
- DB object: `rae_cases` (or `ff_cases`, `tc_cases`, etc.)

**Case creation triggers:**
1. **Risk Signal Detected** — first Hit generated for an entity → Case auto-created
2. **Explicit Green Case** — workflow requires proof of clean evaluation (onboarding, regulatory verification) → Case created with no Hits, status = GREEN

**Severity exists at every level:** Hit severity → Alert severity → Check severity → Case severity. Propagation logic is defined in the scoring specification (separate doc).

**Case timeline** is an analytical view (sort by time / severity / category / signal type), not a structural property.

### Master Case — Multi-Entity or Multi-Application Grouping
- Optional. Groups multiple Cases together.
- Contains Cases ONLY — never contains Checks, Alerts, or Hits directly.
- DB object: `rae_master_cases`

```
Use case 1 — Multi-Entity Investigation:
  Master Case
    └ Case — Entity A (individual)
    └ Case — Entity B (related organization)
    └ Case — Entity C (linked account)

Use case 2 — Multi-Application Investigation:
  Master Case
    └ Case — AML Screening (from Transact Comply)
    └ Case — Fraud Monitoring (from Fraud Fighter)
    └ Case — Privacy Monitoring (from Privacy Panda)
```

---

## What Is an Entity?

Any object capable of generating risk signals:
`INDIVIDUAL` · `ORGANIZATION` · `ACCOUNT` · `VESSEL` · `AIRCRAFT` · `ARTWORK` · `EVENT` · `IP_ADDRESS`

Entity type is a required field on every Case. No Case exists without an owning entity.

---

## Applications That Feed the RAE Case System

| Application | Domain | Case source status |
|---|---|---|
| PreScreening.io | Name screening, watchlist monitoring | Current |
| Transact Comply | Transaction monitoring, behavioral rule detection | Current |
| Entity Hero | Entity lifecycle, onboarding risk, ongoing monitoring | Current |
| **Fraud Fighter** | **Fraud monitoring, behavioral fraud detection** | **Planned (active development)** |
| Privacy Panda | Data privacy monitoring, suspicious data access | Planned |
| Diligence Dragon | Due diligence intelligence, reputational risk | Planned |

All applications normalize their risk signals into the same Hit → Alert → Check → Case hierarchy.

---

## Naming Conventions for Code

Always use these exact names. Never invent synonyms.

| Concept | Class/enum name | DB table (RAE-level) | DB table (FF-specific) |
|---|---|---|---|
| Hit | `RaeHit` | `rae_hits` | `ff_hits` |
| Alert | `RaeAlert` | `rae_alerts` | `ff_alerts` |
| Check | `RaeCheck` | `rae_checks` | `ff_checks` |
| Case | `RaeCase` / `InvestigationCase` | `rae_cases` | `ff_cases` |
| Master Case | `MasterCase` | `rae_master_cases` | — |
| Alert aggregation mode | `AlertAggregationMode` enum | — | — |
| Case creation reason | `CaseCreationReason` enum | — | — |
| Entity type | `RaeEntityType` enum | — | — |

```java
// Enums — always use these, never raw strings
enum AlertAggregationMode { STATIC, CONTINUOUS }
enum CaseCreationReason { RISK_SIGNAL_DETECTED, EXPLICIT_GREEN }
enum RaeCaseStatus { OPEN, UNDER_REVIEW, ESCALATED, CLOSED, GREEN }
enum RaeEntityType { INDIVIDUAL, ORGANIZATION, ACCOUNT, VESSEL, AIRCRAFT, ARTWORK, EVENT, IP_ADDRESS }
```

---

## Critical Rules for Code Generation

- [MUST] 1 Alert = 1 Rule OR 1 Watchlist — never aggregate multiple rules into one Alert
- [MUST] Transactions/activities are NOT investigation objects — they are evidence on Hits
- [MUST] Master Case contains Cases only — never Checks, Alerts, or Hits directly
- [MUST] Every Case has an owning entity — no orphan Cases
- [MUST] Case severity is derived from Check/Alert/Hit severities — never stored independently without propagation logic
- [MUST] All Case-related tables include `tenant_id` — multi-tenant isolation applies at every level
- [MUST] Checks and Alerts are created structurally even before Hits exist — existence ≠ visibility
- [SHOULD] Use `CaseCreationReason` enum to distinguish risk-signal Cases from green Cases
- [AVOID] Conflating Hit with Transaction — a transaction is evidence, a Hit is the risk signal
- [AVOID] Creating direct relationships between Master Cases and Hits/Alerts/Checks
