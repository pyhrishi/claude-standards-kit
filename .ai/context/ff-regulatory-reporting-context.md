# FF Regulatory Reporting Context
> Load when working on: SAR/STR generation · regulatory reports · jurisdiction handling · filing deadlines · MIS reports
> Always load with: `docs/CLAUDE_BACKEND.md`

---

## Regulatory Report Types

| Report | Full name | Trigger |
|---|---|---|
| SAR | Suspicious Activity Report | US, UK, Australia, Singapore |
| STR | Suspicious Transaction Report | India, UAE, Bahrain, Philippines, Nepal |
| SMR | Suspicious Matter Report | Australia (AUSTRAC) |
| TTR | Threshold Transaction Report | Transactions above regulatory threshold |

The correct report type is determined by: `entity.jurisdiction` + `case.jurisdiction`.

---

## Jurisdictions in Scope

| Phase | Jurisdictions |
|---|---|
| PoC | India, Philippines |
| MVP Phase I | Nepal, UK, UAE, Bahrain, US |
| MVP Phase II | Australia, Singapore, Saudi Arabia, South Africa, Sri Lanka, Indonesia |

```java
enum FFJurisdiction {
  IN,   // India — STR, filing to FIU-IND
  PH,   // Philippines — STR, filing to AMLC
  NP,   // Nepal — STR
  GB,   // United Kingdom — SAR, filing to NCA
  AE,   // UAE — STR/SAR, filing to CBUAE
  BH,   // Bahrain — STR
  US,   // United States — SAR, filing to FinCEN
  AU,   // Australia — SMR, filing to AUSTRAC
  SG,   // Singapore — STR, filing to MAS
  // ... Phase II jurisdictions
}
```

---

## Filing Deadlines (by jurisdiction)

| Jurisdiction | Filing window after suspicion | Clock starts |
|---|---|---|
| India (FIU-IND) | 7 days | Date suspicion raised |
| US (FinCEN) | 30 days (60 if no suspect) | Date suspicion raised |
| UK (NCA) | ASAP — no fixed deadline | Date knowledge acquired |
| UAE (CBUAE) | Immediately (same day if possible) | Date of transaction |
| Philippines (AMLC) | 5 working days | Date of transaction |
| Bahrain | 3 working days | Date suspicion raised |
| Nepal | 3 days | Date suspicion raised |

Filing deadline is **auto-calculated and set on `ff_cases.sar_filing_deadline`** when `sar_required = true`.
System triggers escalation notification when deadline < 48 hours.

---

## DB Schema — `ff_reports`

```sql
ff_reports (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id           UUID NOT NULL,
  case_id             BIGINT NOT NULL REFERENCES ff_cases(id),
  report_type         VARCHAR(20) NOT NULL,        -- SAR, STR, SMR, TTR
  jurisdiction        VARCHAR(10) NOT NULL,
  status              VARCHAR(50) NOT NULL,         -- DRAFT, UNDER_REVIEW, APPROVED, FILED, REJECTED
  report_reference    VARCHAR(100),                -- regulator-assigned reference (after filing)
  narrative           TEXT NOT NULL,
  subject_entity_id   UUID NOT NULL,
  reporting_entity    VARCHAR(255) NOT NULL,        -- the financial institution filing
  filing_deadline     TIMESTAMPTZ,
  filed_at            TIMESTAMPTZ,
  filed_by            VARCHAR(255),
  regulator_response  TEXT,
  export_format       VARCHAR(20),                 -- XML, PDF, JSON (depends on jurisdiction)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          VARCHAR(255) NOT NULL,
  modified_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_by         VARCHAR(255) NOT NULL
)
```

---

## Report Generation Flow

```
Case status = ESCALATED or CONFIRMED_FRAUD
  ↓
Compliance officer reviews case
  ↓
POST /api/v1/Reports/InitiateReport { caseId, reportType, jurisdiction }
  ↓
ReportingService.generateDraft(case)
  - Pulls: case narrative, entity details, transaction evidence, alert summary
  - Pre-fills: subject entity data, institution data, jurisdiction-specific fields
  - Auto-selects: correct report type based on jurisdiction
  ↓
Report status: DRAFT
  ↓
Compliance officer edits narrative, reviews evidence
  ↓
POST /api/v1/Reports/SubmitForReview → status: UNDER_REVIEW
  ↓
MLRO / Senior compliance approves
  ↓
POST /api/v1/Reports/ApproveReport → status: APPROVED
  ↓
POST /api/v1/Reports/FileReport → export to regulator format → status: FILED
  - Updates ff_cases.sar_required = true, filed_at = now()
```

---

## API Endpoints

```
POST   /api/v1/Reports/InitiateReport
GET    /api/v1/Reports/GetReportById?reportId=
GET    /api/v1/Reports/GetReportsByCase?caseId=
GET    /api/v1/Reports/GetPendingFilings?jurisdiction=&dueBefore=
PUT    /api/v1/Reports/UpdateReportNarrative
POST   /api/v1/Reports/SubmitForReview
POST   /api/v1/Reports/ApproveReport          -- MLRO / ff_compliance role only
POST   /api/v1/Reports/FileReport             -- generates export, marks filed
GET    /api/v1/Reports/ExportReport?reportId=&format=XML|PDF
GET    /api/v1/Reports/GetFilingDeadlines?jurisdiction=&daysAhead=
```

---

## MIS and Operational Reports (downloadable)

```
GET /api/v1/Reports/GetAlertSummary      -- alert volumes by channel, priority, disposition
GET /api/v1/Reports/GetCaseSummary       -- case outcomes, SLA compliance, investigator productivity
GET /api/v1/Reports/GetFraudKPIs         -- false positive rate, detection rate, loss prevented
GET /api/v1/Reports/GetModelPerformance  -- precision, recall, F1 per model per channel
GET /api/v1/Reports/ExportToCSV          -- any report exportable to CSV/Excel
```

---

## RBAC on Regulatory Reporting

| Action | Required role |
|---|---|
| View reports | `ff_analyst_l2`, `ff_compliance`, `ff_risk_manager`, `ff_admin` |
| Create/edit draft | `ff_compliance` |
| Submit for review | `ff_compliance` |
| Approve report | `ff_compliance` (MLRO designation) |
| File report | `ff_compliance` |
| View filing deadlines dashboard | `ff_compliance`, `ff_risk_manager` |

---

## Critical Rules

- [MUST] Filing deadline auto-set on case when `sar_required = true` — based on jurisdiction rules
- [MUST] Report narrative is the compliance officer's work — system pre-fills, human finalizes
- [MUST] Every report state transition logged in `ff_audit_logs` with userId + timestamp
- [MUST] Filed reports are immutable — `status = FILED` locks the record
- [MUST] Export format determined by jurisdiction — never let client choose format freely
- [SHOULD] 48-hour deadline warning sent to `ff_compliance` role automatically
- [AVOID] Auto-filing without human approval — always APPROVED state before FILED
- [AVOID] Storing regulator credentials in the FF database — credentials via secrets manager
