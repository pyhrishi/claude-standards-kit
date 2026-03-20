#!/usr/bin/env node
/**
 * FF Hook: check-tenant-id
 * Warns when a repository file is written without tenant_id in queries.
 * Rule DB-TENANT-01.
 */
const fs = require('fs');
const filePath = process.env.TOOL_INPUT_FILE_PATH || '';
if (!filePath || !fs.existsSync(filePath)) process.exit(0);

const content = fs.readFileSync(filePath, 'utf8');
// Only check files that look like repository/DAO files
if (!filePath.match(/repositor|dao|query/i)) process.exit(0);

// Look for query patterns without tenant_id
const hasQuery = content.match(/SELECT|findBy|findAll|WHERE/i);
const hasTenantId = content.match(/tenant_id|tenantId/i);

if (hasQuery && !hasTenantId) {
  console.error(`[FF Hook DB-TENANT-01] WARNING: Repository file may be missing tenant_id filter`);
  console.error(`File: ${filePath}`);
  console.error('All FF queries must filter by tenant_id for multi-tenant isolation.');
  console.error('Add: WHERE tenant_id = :tenantId (or equivalent for your ORM)');
}
process.exit(0);
