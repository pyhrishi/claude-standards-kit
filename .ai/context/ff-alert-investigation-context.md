# FF Alert & Investigation Context
> Load when working on: alert lifecycle · case creation · investigation workflow · case management · analyst UI · SLA timers
> Always load with: `docs/CLAUDE_BACKEND.md` + `.ai/context/rae-case-architecture.md`

---

## Alert Lifecycle

```
Hit created (rule fires on near-RT path)
  ↓
AlertAggregationService
  ↓ [check: does an open Alert exist for this rule + entity?]
  ├── NO  → Create new Alert (status: OPEN)
  └── YES (continuous mode) → Append Hit to existing Alert
  ↓
CheckGroupingService
  ↓ [group Alert into its Check category]
  ├── Check exists for entity → Add Alert to existing Check
  └── No Check → Create Check (check_type from rule definition)
  ↓
CaseUpdateService
  ↓ [update or create the entity's Case]
  ├── Case exists (OPEN or UNDER_REVIEW) → Add Check to Case, recalculate severity
  └── No Case → Create new Case (CaseCreationReason.RISK_SIGNAL_DETECTED)
  ↓
Kafka: ff.alerts.created → downstream consumers (reporting, dashboard)
```

---

## Alert Priority Queues — SLA timers start on creation

| Priority | Score range | SLA for L1 triage | SLA for L2 review |
|---|---|---|---|
| HIGH | ≥ 0.85 | 2 hours | 8 hours |
| MEDIUM | 0.60–0.84 | 8 hours | 24 hours |
| LOW | 0.50–0.59 | 24 hours | 72 hours |

SLA countdown tracked in `ff_alert_slas`. Timer pauses when status = PENDING_INFO.
Breached SLAs trigger escalation to `ff_risk_manager`.

---

## DB Schema — `ff_alerts`

```sql
ff_alerts (
  id                BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id         UUID NOT NULL,
  entity_id         UUID NOT NULL,
  entity_type       VARCHAR(50) NOT NULL,
  rule_id           BIGINT NOT NULL REFERENCES ff_rules(id),
  check_id          BIGINT NOT NULL REFERENCES ff_checks(id),
  case_id           BIGINT REFERENCES ff_cases(id),
  alert_name        VARCHAR(255) NOT NULL,
  status            VARCHAR(50) NOT NULL,    -- OPEN, ASSIGNED, UNDER_REVIEW, PENDING_INFO, CLOSED, AUTO_CLOSED
  priority          VARCHAR(20) NOT NULL,    -- HIGH, MEDIUM, LOW
  fraud_score       DECIMAL(5,4),
  aggregation_mode  VARCHAR(20) NOT NULL,    -- STATIC, CONTINUOUS
  assigned_to       VARCHAR(255),
  closed_at         TIMESTAMPTZ,
  closure_reason    VARCHAR(50),             -- TRUE_POSITIVE, FALSE_POSITIVE, INCONCLUSIVE
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        VARCHAR(255) NOT NULL,
  modified_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_by       VARCHAR(255) NOT NULL,
  deleted_at        TIMESTAMPTZ
)
```

## DB Schema — `ff_cases`

```sql
ff_cases (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id             UUID NOT NULL,
  case_reference        VARCHAR(100) NOT NULL UNIQUE,  -- human-readable: FF-2026-00001234
  entity_id             UUID NOT NULL,
  entity_type           VARCHAR(50) NOT NULL,
  master_case_id        BIGINT REFERENCES ff_master_cases(id),
  status                VARCHAR(50) NOT NULL,     -- OPEN, UNDER_REVIEW, ESCALATED, PENDING_INFO, CLOSED, GREEN
  severity              VARCHAR(20) NOT NULL,     -- LOW, MEDIUM, HIGH, CRITICAL
  creation_reason       VARCHAR(50) NOT NULL,     -- RISK_SIGNAL_DETECTED, EXPLICIT_GREEN
  assigned_to           VARCHAR(255),
  assigned_team         VARCHAR(100),
  sar_required          BOOLEAN DEFAULT FALSE,
  sar_filing_deadline   TIMESTAMPTZ,
  jurisdiction          VARCHAR(10),
  closed_at             TIMESTAMPTZ,
  closure_outcome       VARCHAR(50),              -- CONFIRMED_FRAUD, FALSE_POSITIVE, INCONCLUSIVE, REFERRED
  narrative             TEXT,                     -- investigator's case summary
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            VARCHAR(255) NOT NULL,
  modified_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_by           VARCHAR(255) NOT NULL,
  deleted_at            TIMESTAMPTZ
)
```

---

## Case Status Flow

```
OPEN
  ↓  [analyst picks up]
UNDER_REVIEW
  ↓  [needs more info from client]        ↓  [escalate to L2/L3]
PENDING_INFO                           ESCALATED
  ↓  [info received]                       ↓
UNDER_REVIEW ──────────────────────────────┘
  ↓  [decision made]
CLOSED (outcome: CONFIRMED_FRAUD | FALSE_POSITIVE | INCONCLUSIVE | REFERRED)

Special: GREEN (no Hits found, created by explicit workflow — e.g. onboarding check)
```

---

## Investigation Workflow — analyst journey

```
1. Alert Queue  →  filter by priority/channel/jurisdiction/assigned
2. Alert Detail →  view Hits, evidence (transactions), entity profile snapshot
3. Case View    →  all Checks for this entity, timeline, related entities
4. Investigation Actions:
   - Add note (timestamped, immutable once saved)
   - Request additional info (status → PENDING_INFO)
   - Escalate (status → ESCALATED, notify L2/L3)
   - Link related entities (creates Master Case if needed)
   - File SAR/STR (status → sar_required = true, deadline set by jurisdiction)
   - Close (must select closure_outcome + write narrative)
5. Audit Trail  →  every action recorded in ff_audit_logs (immutable)
```

---

## Auto-Closure (configurable per tenant)

High-volume, low-risk alerts can be auto-closed based on configurable rules:
- Auto-close if: score < threshold AND entity risk = LOW AND no prior confirmed fraud
- Auto-closure rules stored in `ff_auto_closure_rules` table
- Auto-closed alerts logged with `closure_reason = AUTO_CLOSED`, never deleted
- Auto-closure rate monitored in dashboards — alert ops team if rate changes ±10%

---

## Master Case — when to create

```
Create Master Case when:
  - 2+ entities are linked (e.g. mule network: account A transfers to B, B to C)
  - Multi-application signals (FF alert + PreScreening.io sanctions match on same entity)
  - Investigator manually links cases

Master Case contains:
  - ff_cases (linked cases) — never Hits, Alerts, or Checks directly
  - combined narrative
  - assigned senior investigator
```

---

## Notification triggers

| Event | Notify | Channel |
|---|---|---|
| HIGH priority alert created | Assigned analyst + L2 backup | In-app + email |
| SLA breach (triage) | Analyst + risk manager | In-app + email |
| SLA breach (review) | Risk manager + compliance | Email |
| Case escalated | Assigned L2/L3 analyst | In-app + email |
| SAR deadline < 48h | Compliance officer | Email (urgent) |
| Auto-closure rate anomaly | Ops team | In-app |

---

## RBAC on Investigation Actions

| Action | Minimum role |
|---|---|
| View alerts and cases | `ff_analyst_l1` |
| Add notes, change status | `ff_analyst_l1` |
| Escalate | `ff_analyst_l1` |
| Close case (L1 queue) | `ff_analyst_l1` |
| Close case (escalated) | `ff_analyst_l2` |
| File SAR | `ff_compliance` |
| Override auto-closure rule | `ff_risk_manager` |
| View all tenants' cases | `ff_admin` only |

---

## Critical Rules

- [MUST] Every case closure requires a `closure_outcome` + `narrative` — no empty closures
- [MUST] Investigator notes are immutable once saved — append only, never edit/delete
- [MUST] SLA timers start at alert creation, not at assignment
- [MUST] `ff_audit_logs` entry created for EVERY status change, note, and action
- [MUST] SAR filing deadline computed automatically from jurisdiction rules on case creation
- [SHOULD] Auto-closed alerts reviewed by risk manager in weekly batch
- [AVOID] Deleting Cases or Alerts — soft delete only (`deleted_at`)
- [AVOID] Changing `case_reference` after creation — it is the external-facing identifier
