# FF Dashboard & KPIs Context
> Load when working on: dashboards · KPI endpoints · operational monitoring · MIS · charts · metrics APIs
> Always load with: `docs/CLAUDE_BACKEND.md` + `docs/CLAUDE_FRONTEND.md`

---

## Three Dashboard Types (from PRD)

### 1. Operational Dashboard (L1/L2 Analysts daily use)
- Alert volumes by priority, channel, typology
- SLA compliance rate — % of alerts triaged within SLA
- False positive rate by rule and channel
- Alerts by status (open / assigned / pending / closed today)
- Auto-refresh: 60 seconds

### 2. Management Dashboard (Risk Manager / MLRO)
- Loss prevented (BLOCK decisions × estimated fraud amount)
- Detection rate by channel and segment
- Case outcomes breakdown (confirmed fraud / FP / inconclusive)
- Investigation throughput by team / analyst
- Regulatory filing compliance (filed on time vs. late)

### 3. System Health Dashboard (Ops / Engineering)
- Inline scoring latency P50/P90/P99 — alert if P99 > 8ms
- Transactions per second (TPS) — current vs. peak capacity
- ML model inference latency per model
- Kafka consumer lag (near-RT path)
- Error rates by service
- Circuit breaker status (open / closed / half-open)

---

## Core KPI Definitions

```
False Positive Rate (FPR)   = Closed(FALSE_POSITIVE) / Total Closed Alerts × 100
True Positive Rate (TPR)    = Closed(CONFIRMED_FRAUD) / Total Closed Alerts × 100
Alert-to-Case Rate          = Cases Created / Alerts Created × 100
SLA Compliance Rate         = Alerts Triaged Within SLA / Total Alerts × 100
Auto-Closure Rate           = Auto-Closed Alerts / Total Alerts × 100
Detection Latency           = P99 of time from transaction → alert creation (near-RT path)
Inline Latency              = P99 of ScoreTransaction endpoint response time
```

---

## KPI API Endpoints

```
GET /api/v1/Dashboard/GetFraudKPIs
  ?tenantId=&from=&to=&channel=&jurisdiction=
  → { fpr, tpr, alertVolume, caseVolume, slaCompliance, lossPreventedAmount, currency }

GET /api/v1/Dashboard/GetAlertMetrics
  ?from=&to=&groupBy=PRIORITY|CHANNEL|TYPOLOGY|STATUS
  → time-series data for charting

GET /api/v1/Dashboard/GetSLAMetrics
  ?from=&to=
  → { breached, onTime, pending, byPriority: {HIGH, MEDIUM, LOW} }

GET /api/v1/Dashboard/GetModelPerformance
  ?modelId=&from=&to=
  → { precision, recall, f1Score, falsePositiveRate, alertsGenerated, modelVersion }

GET /api/v1/Dashboard/GetSystemHealth
  → { inlineLatencyP99, tps, kafkaLag, errorRate, circuitBreakers[] }

GET /api/v1/Dashboard/GetInvestigatorProductivity
  ?from=&to=
  → { byAnalyst: [{ userId, alertsClosed, avgResolutionTimeHours, fpRate }] }
```

---

## Dashboard Response Format

All dashboard endpoints follow the standard FF response with a `meta` section:

```json
{
  "status": "success",
  "data": {
    "metrics": { ... },
    "series": [ { "timestamp": "2026-03-17T00:00:00Z", "value": 450 }, ... ]
  },
  "meta": {
    "from": "2026-03-10T00:00:00Z",
    "to": "2026-03-17T00:00:00Z",
    "granularity": "DAY",
    "filters": { "channel": "UPI", "jurisdiction": "IN" }
  },
  "message": "Fraud KPIs retrieved",
  "requestId": "uuid"
}
```

---

## Frontend Dashboard Rules

- All dashboards auto-refresh every 60 seconds (configurable per tenant, min 30s)
- Role-based visibility: `ff_analyst_l1` sees operational only, `ff_risk_manager` sees all three
- All charts exportable to CSV/Excel via download button
- Date range picker: default last 7 days, max range 90 days
- Filters: channel · jurisdiction · assignee · priority — all persist in URL params
- Skeleton loading on every data fetch — never a blank chart area
- System health alerts shown as banner if P99 latency > 8ms or error rate > 1%

---

## Simulation Dashboard (separate from operational)

```
GET /api/v1/Dashboard/GetSimulationResults?simulationId=
  → { ruleName, currentAlertVolume, projectedAlertVolume, delta, fprImpact, sampleAlerts[] }
```

Simulation results shown BEFORE rule activation — analysts can compare current vs. proposed.

---

## Critical Rules

- [MUST] All dashboard endpoints support `from` + `to` date filters — no unbounded queries
- [MUST] All time-series data returned in ISO 8601 UTC
- [MUST] Role check at service layer — `ff_analyst_l1` cannot access management dashboard data
- [MUST] System health dashboard accessible to all roles — engineers and ops need visibility
- [SHOULD] Dashboard queries use pre-aggregated tables — not real-time scans of ff_alerts/ff_cases
- [SHOULD] Cache dashboard responses (TTL 60s) — dashboards are read-heavy, not write-heavy
- [AVOID] Raw SQL aggregations on transactional tables for dashboard queries — use materialized views or pre-computed metrics tables
- [AVOID] Returning unbounded result sets on chart endpoints — always paginate series data
