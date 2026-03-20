# DB STANDARDS — ALWAYS APPLY
> Scope: ALL database work. Prefixes: `tc_` = TransactComply · `ff_` = FraudFighter
> Severity: [MUST] = blocks merge · [SHOULD] = default, deviation needs comment · [AVOID] = never do

---

## NAMING

**Objects (tables, views, functions, triggers, sequences)**
- [MUST] All lowercase. Product prefix first. snake_case. `tc_entitydetails` `ff_rtm`
- [MUST] Tables = plural noun after prefix. `tc_entities` `tc_transactions` `ff_alerts`
- [MUST] Lookup tables = `_ref` suffix. `tc_country_ref` `tc_status_ref`
- [MUST] Junction tables = both entity names. `tc_entity_documents` `tc_user_roles`
- [AVOID] `tbl_` / `table_` / `t_` extra prefix · abbreviations · "data" "info" "record" in names

**Columns** (no product prefix on columns)
- [MUST] Lowercase snake_case. `entity_name` `risk_score` — not `entityId` not `tc_entity_name`
- [MUST] Booleans: `is_` `has_` `can_` `should_` prefix. `is_active` `has_kyc_approval`
- [MUST] Timestamps: `_at` suffix. Dates: `_date` suffix. Money: include unit. `amount_usd` `balance_cents`
- [AVOID] Cryptic abbreviations. `rsk_scr` `ent_nm` `dtls` · single-letter names except `id`

**Constraint & index naming — all must be explicit, never unnamed**
```
PK:           CONSTRAINT <table>_pkey                      → tc_entities_pkey
FK:           CONSTRAINT <table>_<col>_fkey                → tc_entity_documents_entity_id_fkey
Unique:       CONSTRAINT <table>_<col>_unique              → tc_entities_external_ref_unique
Check:        CONSTRAINT <table>_<col>_<rule>              → tc_transactions_amount_must_be_positive
Index:        idx_<table>_<col(s)>                         → idx_tc_entity_documents_entity_id
Unique idx:   uq_<table>_<col(s)>                          → uq_tc_entities_external_ref_active
Trigger:      trg_<table>_<purpose>                        → trg_tc_entities_set_modified_at
```

---

## MANDATORY COLUMNS — EVERY TABLE, NO EXCEPTIONS

```sql
created_at   TIMESTAMPTZ  NOT NULL  DEFAULT NOW()
created_by   BIGINT       NOT NULL                 -- user ID, not username
modified_at  TIMESTAMPTZ  NOT NULL  DEFAULT NOW()  -- set by application/ORM layer on every update
modified_by  BIGINT       NOT NULL                 -- user ID, not username
deleted_at   TIMESTAMPTZ  NULL                     -- NULL = active; soft delete
```
- [MUST] All 5 on every table including lookup, junction, and audit tables
- [MUST] `TIMESTAMPTZ` always — never `TIMESTAMP` (no timezone)
- [MUST] `created_by` / `modified_by` = integer user ID — never store username or email
- [MUST] `modified_at` updated by application/ORM layer before every UPDATE — no DB triggers (triggers slow down writes and are invisible to the application)
- [MUST] Soft delete = `deleted_at` timestamp — never `is_deleted` boolean
- [AVOID] App code manually setting `created_at` or `modified_at`

---

## DATA TYPES

| Use Case | Type | Rule |
|---|---|---|
| Primary key | `BIGINT IDENTITY` | Auto-increment · column always named `id` |
| Foreign key | `BIGINT` | Match PK type of referenced table |
| External/API ID | `UUID` | Secondary `UNIQUE` column only — never the PK |
| Short text | `VARCHAR(n)` | Set an explicit meaningful max length |
| Long text | `TEXT` | Only when truly unbounded |
| Boolean | `BOOLEAN` | Never `CHAR(1)` or `TINYINT` |
| Money | `NUMERIC(p,s)` | Never `FLOAT` or `DOUBLE` — precision loss |
| Timestamp | `TIMESTAMPTZ` | Always timezone-aware |
| Date only | `DATE` | When time component is irrelevant |
| JSON/Metadata | `JSONB` | Schema-less blobs only — column named `metadata` |
| Status/Enum | `VARCHAR(50) + CHECK` | Or a `_ref` lookup table |
| Files/Binary | Object storage URL | Never store blobs in DB |

---

## KEYS & RELATIONSHIPS

- [MUST] Every table has exactly one PK: `id BIGINT GENERATED ALWAYS AS IDENTITY`
- [MUST] FK columns named `<referenced_table_singular>_id` → `entity_id` `user_id` `order_id`
- [MUST] Every FK has an explicit named CONSTRAINT and a corresponding index
- [MUST] Declare `ON DELETE` / `ON UPDATE` explicitly on every FK — never rely on defaults
- [AVOID] Natural keys (email, phone) as PKs · composite PKs on entity tables · app-only FK enforcement

**ON DELETE defaults:** use `RESTRICT` by default · `CASCADE` only with explicit documentation · `SET NULL` only on nullable FK columns

---

## NORMALIZATION & JSON

- [MUST] Normalize to 3NF. No repeating groups. No multi-value columns.
- [AVOID] `tags = "admin,user,viewer"` in one column — break into a junction table

**JSON exception** — allowed ONLY for schema-less data (KYC payloads, 3rd-party API responses, dynamic config):
- [MUST] Column named `metadata` or ending in `_metadata`
- [MUST] Never filter/query inside JSON on hot paths — promote to a column if queried often
- [AVOID] Multiple JSONB columns per table · JSON to avoid schema design

---

## NULL HANDLING

Default = `NOT NULL`. Null only when absence is a genuine, documented business state.

| Column | Null rule |
|---|---|
| `id` (PK) | NEVER NULL |
| Required FK | NOT NULL |
| Optional FK | NULL OK |
| `created_at` `modified_at` | NOT NULL |
| `created_by` `modified_by` | NOT NULL |
| `deleted_at` | NULL = active record |
| `metadata` JSONB | NULL OK |
| Business required | NOT NULL + DEFAULT if safe |

- [AVOID] Empty string `""` as substitute for NULL · nullable booleans (always TRUE or FALSE)

---

## DATA INTEGRITY

- [MUST] FK constraints declared in schema — not application-only
- [MUST] Uniqueness via named `UNIQUE` constraints
- [MUST] CHECK constraints for column-level business rules — all named explicitly
- [AVOID] Disabling FK constraints for performance · anonymous unnamed constraints
- [AVOID] DB-06-08: using DB triggers for integrity or business logic — triggers slow down the system, are invisible to the application; enforce at application/service layer instead

---

## INDEXING

- [MUST] Index every FK column. Every one. No exceptions.
- [MUST] Names: `idx_<table>_<col>` standard · `uq_<table>_<col>` unique
- [MUST] Composite indexes: highest-cardinality column first
- [SHOULD] Partial indexes for sparse data: `WHERE deleted_at IS NULL`
- [AVOID] Adding indexes without checking `EXPLAIN` first · duplicate indexes

---

## PERMISSIONS

- [MUST] App runtime role = `SELECT, INSERT, UPDATE, DELETE` on required tables only — no DDL
- [MUST] Separate migration role for schema changes (CI/CD only)
- [MUST] Audit log tables = `INSERT` only for app role — no `UPDATE` or `DELETE`
- [MUST] All `GRANT` statements via IaC — never manual grants in production
- [AVOID] Superuser credentials used by applications

| Role | Access |
|---|---|
| `<product>_app_role` | DML on required tables only |
| `<product>_migrate_role` | DDL + DML (CI/CD only) |
| `<product>_read_role` | SELECT only (reporting/BI) |
| `<product>_audit_role` | INSERT only on audit tables |

---

## AUDITING

- [MUST] Every table has all 5 mandatory audit columns (see above)
- [MUST] Compliance-critical tables need a `<table>_audit_log` side table
- [MUST] Audit log = INSERT only · never purged · app role has no UPDATE or DELETE
- [MUST] Audit log columns: `version_id` `operation` `changed_at` `changed_by` `old_values` `new_values` — version_id is a monotonic counter per record for ordering and conflict detection
- [AVOID] Storing usernames as audit performers — always store user ID

---

## STANDARD TABLE TEMPLATE

```sql
CREATE TABLE tc_<n> (
    id           BIGINT        NOT NULL GENERATED ALWAYS AS IDENTITY,
    -- your columns here --
    metadata     JSONB         NULL,            -- schema-less data only
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by   BIGINT        NOT NULL,
    modified_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    modified_by  BIGINT        NOT NULL,
    deleted_at   TIMESTAMPTZ   NULL,
    CONSTRAINT tc_<n>_pkey PRIMARY KEY (id)
    -- CONSTRAINT tc_<n>_<col>_fkey FOREIGN KEY (<col>) REFERENCES ... ON DELETE RESTRICT,
    -- CONSTRAINT tc_<n>_<col>_<rule> CHECK (...),
);
COMMENT ON TABLE tc_<n> IS '<what this table stores>';
-- modified_at set by application/ORM interceptor before SaveChanges/flush
-- No DB triggers — enforce via EF Core SaveChanges override or ORM interceptor
-- CREATE INDEX idx_tc_<n>_<fk_col> ON tc_<n> (<fk_col>);  ← for every FK
```

---

## CHECKLIST — RUN BEFORE EVERY TABLE/MIGRATION

```
[ ] Name starts with tc_ or ff_ · all lowercase · plural noun
[ ] id BIGINT IDENTITY · named id · no string PK
[ ] All 5 audit columns present · TIMESTAMPTZ · created_by/modified_by are BIGINT user IDs
[ ] Every column has explicit NOT NULL or NULL
[ ] Every FK is a named CONSTRAINT with ON DELETE declared
[ ] Every FK column has a corresponding index
[ ] All CHECK constraints named · all UNIQUE constraints named
[ ] modified_at updated by ORM interceptor/SaveChanges (no DB trigger)
[ ] No FLOAT/DOUBLE for money · no TIMESTAMP without TZ · no is_deleted boolean
[ ] Permissions set via IaC · audit log tables are INSERT only
```
