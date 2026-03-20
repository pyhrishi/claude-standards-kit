# FraudFighter — Domain Glossary
> Claude reads this for naming accuracy across all generated code.

| Term | Code name | DB table |
|---|---|---|
| Transaction | `FraudTransaction` | `ff_transactions` |
| Decision | `FraudDecision` enum (PASS/REVIEW/BLOCK) | — |
| Score | `fraudScore` Double/float 0.0–1.0 | — |
| Alert | `FraudAlert` | `ff_alerts` |
| Case | `InvestigationCase` | `ff_cases` |
| Rule | `DetectionRule` | `ff_rules` |
| Rule version | `RuleVersion` | `ff_rule_versions` |
| Entity profile | `EntityProfile` | `ff_entity_profiles` |
| Typology | `FraudTypology` enum | — |
| STR / SAR | `RegulatoryReport` | `ff_reports` |
| Threshold | — | `ff_rule_thresholds` |
| Inline path | Sync scoring P99 ≤ 10ms | — |
| Near-RT path | Async Kafka P99 ≤ 100ms | — |
| Tenant | `tenantId` (UUID) | `tenant_id` on all tables |

## Entity types (FraudEntityType enum)
CUSTOMER · ACCOUNT · DEVICE · IP · MERCHANT · COUNTERPARTY

## Jurisdictions in scope
PoC: India, Philippines
MVP Phase I: Nepal, UK, UAE, Bahrain, US

## Role names (use exactly)
`ff_admin` · `ff_analyst_l1` · `ff_analyst_l2` · `ff_risk_manager` · `ff_compliance`
