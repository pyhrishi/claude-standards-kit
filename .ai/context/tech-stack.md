# FraudFighter — Service Tech Stack
> Fill in once per service before first coding session.

## Service Identity
- **Service name:** [e.g. ff-scoring-service]
- **Purpose:** [one-line description]

## Language & Framework
- **Language:** [Java 17 / Node.js 20 / Python 3.11]
- **Framework:** [Spring Boot 3.x / Express 4.x / FastAPI 0.x]
- **Build tool:** [Maven / Gradle / npm / pip]

## Database
- **Engine:** PostgreSQL 15 (RDS)
- **ORM:** [Hibernate JPA / Prisma / SQLAlchemy]
- **Table prefix:** ff_
- **Migrations:** [Flyway / Liquibase / Alembic]

## Auth
- **Method:** JWT RS256 via Keycloak
- **Roles:** ff_admin · ff_analyst_l1 · ff_analyst_l2 · ff_risk_manager · ff_compliance

## Observability
- **Tracing:** Jaeger (inject traceId + spanId into every log + outbound header)
- **Dashboards:** Grafana Loki (structured JSON logs only)
- **Metrics:** Prometheus (/metrics endpoint)

## Infrastructure
- **Compute:** AWS EKS
- **Streaming:** Kafka (AWS MSK) — topic: ff.transactions.raw
- **Cache:** AWS ElastiCache Redis
- **Secrets:** AWS Secrets Manager

## SLA
- Inline scoring: P99 ≤ 10ms
- Near-real-time: P99 ≤ 100ms
- Uptime: 99.99%
