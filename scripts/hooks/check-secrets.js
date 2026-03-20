#!/usr/bin/env node
/**
 * FF Hook: check-secrets
 * Blocks writes containing hardcoded secrets.
 * Rule BE-09-01.
 */
const content = process.env.TOOL_INPUT_NEW_STRING || process.env.TOOL_INPUT_CONTENT || '';
if (!content) process.exit(0);

const patterns = [
  { re: /password\s*=\s*["'][^"']{4,}["']/i, label: 'hardcoded password' },
  { re: /api[_-]?key\s*=\s*["'][^"']{8,}["']/i, label: 'hardcoded API key' },
  { re: /secret\s*=\s*["'][^"']{8,}["']/i, label: 'hardcoded secret' },
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key' },
  { re: /sk-[a-zA-Z0-9]{32,}/, label: 'API secret key' },
  { re: /ghp_[a-zA-Z0-9]{36}/, label: 'GitHub token' },
  { re: /postgresql:\/\/[^:]+:[^@]+@/, label: 'DB connection string with credentials' },
];

const found = patterns.filter(p => p.re.test(content));
if (found.length > 0) {
  console.error('[FF Hook BE-09-01] BLOCKED: Hardcoded secret detected');
  found.forEach(f => console.error(`  - ${f.label}`));
  console.error('Use environment variables or AWS Secrets Manager instead.');
  process.exit(2); // Exit 2 = block the tool call
}
process.exit(0);
