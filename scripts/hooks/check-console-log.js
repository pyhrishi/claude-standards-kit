#!/usr/bin/env node
/**
 * FF Hook: check-console-log
 * Warns when console.log is found in backend files.
 * Uses structured logger instead.
 */
const fs = require('fs');
const filePath = process.env.TOOL_INPUT_FILE_PATH || '';
if (!filePath || !fs.existsSync(filePath)) process.exit(0);

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const violations = [];

lines.forEach((line, i) => {
  if (line.includes('console.log') && !line.trim().startsWith('//')) {
    violations.push(`  Line ${i + 1}: ${line.trim()}`);
  }
});

if (violations.length > 0) {
  console.error(`[FF Hook BE-04-09] console.log found in ${filePath}`);
  console.error('Use structured logger with traceId instead:');
  console.error('  logger.info({ traceId, message: "..." })');
  violations.forEach(v => console.error(v));
  // Warning only — exit 0 to not block
}
process.exit(0);
