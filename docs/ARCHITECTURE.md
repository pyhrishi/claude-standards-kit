# FraudFighter — Architecture Reference
> Load when designing services, integrations, or data flows.

## System overview
```
                    +---------------------------+
                    |       API Gateway          |
                    |  auth · rate limit · route |
                    +------------+--------------+
         +-------------------+---+-------------------+
         |                   |                       |
+--------+--------+  +-------+-------+  +-----------+------+
| Scoring Service |  | Alert Service |  | Rules Service    |
|  P99 <= 10ms    |  | case creation |  | CRUD + eval      |
+--------+--------+  +-------+-------+  +------------------+
         |                   |
         +------- Kafka (ff.transactions.raw) ------+
                             |                      |
                    +--------+----------+  +---------+--------+
                    | PostgreSQL (RDS)   |  | Entity Service   |
                    | ff_transactions   |  | ff_entity_profs  |
                    | ff_alerts         |  +---------+--------+
                    | ff_cases          |            |
                    | ff_rules          |  ElastiCache Redis
                    +-------------------+  (entity cache TTL 5m)
```

## Service boundaries — strict, no cross-service direct DB access
| Service | Owns | Never touches |
|---|---|---|
| ff-scoring-service | ff_transactions, ff_scores | ff_cases, ff_rules directly |
| ff-alert-service | ff_alerts, ff_cases | ff_transactions raw data |
| ff-rules-service | ff_rules, ff_rule_versions | scoring logic |
| ff-entity-service | ff_entity_profiles | transaction scoring |
| ff-reporting-service | ff_reports | real-time paths |

## Data paths
- **Inline (<= 10ms):** HTTP → Scoring → Rules eval → ML score → Decision → Response
- **Near-RT (<= 100ms):** Kafka → Enrichment → Pattern detection → Alert → Case
- **Batch:** Nightly → Backtest → Model retraining feedback loop

## Infrastructure (AWS)
| Component | Service | Notes |
|---|---|---|
| Compute | EKS (Kubernetes) | Each service = separate Deployment |
| Database | RDS PostgreSQL 15 | Per-service schema, ff_ prefix |
| Streaming | Kafka (MSK) | Topic: ff.transactions.raw |
| Cache | ElastiCache Redis | Entity profiles, rule cache |
| ML inference | SageMaker / in-process ONNX | Must fit 5ms budget |
| Tracing | Jaeger | traceId in every log + outbound header |
| Dashboards | Grafana + Loki | Structured JSON logs only |
| Metrics | Prometheus | /metrics endpoint on every service |
| Secrets | AWS Secrets Manager | Never env files in source |
| Auth | Keycloak on EKS | JWT RS256, realm per product |

## Multi-tenancy
- `tenant_id` column on ALL ff_ tables — non-nullable
- PostgreSQL row-level security enforces tenant isolation
- Keycloak JWT claim `tenant_id` routed by middleware
- No query may omit `tenant_id` filter — reviewer flag: `DB-TENANT-01`

## Circuit breakers — required, no exceptions
- ML scoring service: CB + fallback to rules-only decision (within SLA)
- External enrichment APIs: timeout 2s + CB + log degraded mode
- Kafka consumer: dead-letter topic `ff.transactions.dlq` for poison messages

## Kafka topics
| Topic | Producer | Consumer | Retention |
|---|---|---|---|
| ff.transactions.raw | Ingest API | Scoring Service | 7 days |
| ff.decisions.output | Scoring Service | Alert Service | 7 days |
| ff.alerts.created | Alert Service | Case Service, Reporting | 30 days |
| ff.transactions.dlq | Kafka (auto) | Ops monitoring | 14 days |
