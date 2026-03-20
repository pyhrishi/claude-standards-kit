# FF Entity Profiles Context
> Load when working on: entity risk profiles · entity linkage · mule network detection · entity-centric signals · Entity Hero integration
> Always load with: `docs/CLAUDE_BACKEND.md`

---

## Entity-Centric Architecture

FraudFighter is entity-centric — every risk signal is anchored to an entity.
Entity profiles are the cross-signal intelligence layer that connects:
- transaction behavior
- device usage patterns
- geolocation history
- network linkages
- historical fraud signals

---

## Entity Types

```java
enum FraudEntityType {
  ACCOUNT,        // customer bank/wallet account
  DEVICE,         // mobile or web device (fingerprint)
  IP_ADDRESS,     // network identifier
  GEOLOCATION,    // location (city/region/country level)
  MERCHANT,       // payment endpoint / payee
  FRAUD_NETWORK   // linked group of entities (mule network)
}
```

Every FF entity is also linked to a RAE entity via `entity_id` (shared UUID across RAE apps).
Entity Hero is the **master source of entity data** — FF reads, not writes, to entity master.

---

## DB Schema — `ff_entity_profiles`

```sql
ff_entity_profiles (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id           UUID NOT NULL,
  entity_id           UUID NOT NULL,              -- shared RAE entity ID (from Entity Hero)
  entity_type         VARCHAR(50) NOT NULL,
  risk_score          DECIMAL(5,4),               -- 0.0–1.0, updated by Entity Risk Model
  risk_category       VARCHAR(20),                -- LOW, MEDIUM, HIGH, CRITICAL
  fraud_history_count INT DEFAULT 0,              -- confirmed fraud events
  last_scored_at      TIMESTAMPTZ,
  linked_entities     JSONB,                      -- { entityId, entityType, linkType, strength }
  behavioral_baseline JSONB,                      -- normal behavior patterns (velocity, geo, etc.)
  feature_vector      JSONB,                      -- ML feature store snapshot
  network_flags       JSONB,                      -- mule network indicators
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          VARCHAR(255) NOT NULL,
  modified_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_by         VARCHAR(255) NOT NULL
  -- NOTE: no deleted_at — entity profiles are never deleted, only updated
)
```

---

## Entity Linkage — how FF detects coordinated fraud

```
Entity linkage types:
  SHARED_DEVICE     — two accounts use the same device fingerprint
  SHARED_IP         — two accounts originate from the same IP
  TRANSFER_CHAIN    — Account A → Account B (direct fund transfer)
  COMMON_MERCHANT   — multiple accounts transact with same suspicious merchant
  GEO_CLUSTER       — multiple accounts active from same location in short window
  NETWORK_MEMBER    — entity flagged as part of known fraud network
```

Linkage graph is stored in `linked_entities` JSONB on each profile AND in
`ff_entity_links` table for queryable graph traversal:

```sql
ff_entity_links (
  id              BIGINT GENERATED ALWAYS AS IDENTITY,
  tenant_id       UUID NOT NULL,
  entity_id_a     UUID NOT NULL,
  entity_id_b     UUID NOT NULL,
  link_type       VARCHAR(50) NOT NULL,
  link_strength   DECIMAL(3,2),           -- 0.0–1.0, confidence of linkage
  detected_at     TIMESTAMPTZ NOT NULL,
  source          VARCHAR(50) NOT NULL,   -- ML_MODEL, RULE_DETECTION, ANALYST_MANUAL
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

---

## Mule Network Detection

The Mule Network Model identifies coordinated fraud rings:

```
Detection signals:
  - Account receives funds → immediately transfers out (structuring pattern)
  - Account linked to multiple flagged devices
  - Transfer chain: A → B → C → D → external (layering)
  - All accounts in chain onboarded within short window
  - Common beneficial ownership or contact details

Output:
  - FraudEntityType.FRAUD_NETWORK entity created
  - All linked accounts flagged as NETWORK_MEMBER
  - Master Case created grouping all individual Cases
  - Check type: MULE_NETWORK on all affected Cases
```

---

## Entity Hero Integration

Entity Hero is the source of truth for entity master data.
FF reads entity data from Entity Hero via API — never writes back.

```
EntityHeroClient.getEntityProfile(entityId, tenantId)
  → returns: { name, type, riskRating, kycStatus, onboardingDate, jurisdictions[] }

EntityHeroClient.getEntityHistory(entityId, tenantId)
  → returns: list of significant entity events (KYC updates, risk rating changes)
```

Circuit breaker required on all Entity Hero calls.
If Entity Hero is unavailable: use cached `ff_entity_profiles` data, log degraded mode.

---

## Redis Cache Pattern

```
Cache key:   ff:entity:{tenantId}:{entityId}
TTL:         5 minutes (inline path) · 15 minutes (near-RT path)
Eviction:    Invalidate on confirmed fraud event or entity risk score change ≥ 0.1
Fallback:    DB query → `ff_entity_profiles`
```

Entity profiles are the **most performance-critical cache** in FF.
Every inline scoring request reads the entity profile. Cache miss = potential SLA breach.

---

## Behavioral Baseline

Each entity has a baseline representing normal behavior:
```json
{
  "avgTransactionAmount": 4500.00,
  "maxDailyTransactions": 8,
  "typicalChannels": ["UPI", "NEFT"],
  "typicalGeoCountries": ["IN"],
  "typicalHoursOfActivity": [9, 10, 11, 14, 15, 16, 17],
  "typicalMerchantCategories": ["RETAIL", "UTILITIES"]
}
```

Baseline updated nightly by the Behavioral Anomaly Model.
Significant deviations from baseline increase `fraudScore` contribution.

---

## Critical Rules

- [MUST] Entity profiles are never deleted — append/update only
- [MUST] `entity_id` must match the RAE-level entity ID (from Entity Hero) — no FF-local IDs
- [MUST] Every inline scoring request reads entity profile from Redis cache first
- [MUST] Circuit breaker on Entity Hero client — degraded mode uses cached profile
- [SHOULD] Behavioral baseline recalculated nightly for active entities
- [AVOID] FF writing directly to Entity Hero — FF reads only, Entity Hero owns entity master data
- [AVOID] Creating FF-local entity IDs separate from RAE entity IDs — single entity ID across all RAE apps
