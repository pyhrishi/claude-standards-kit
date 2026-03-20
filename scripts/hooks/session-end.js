#!/usr/bin/env node
/**
 * FF Hook: session-end
 * Saves a brief session summary when Claude Code stops.
 */
const fs = require('fs');
const path = require('path');

const stateFile = path.join(process.cwd(), '.ai/context/session-state.md');
const timestamp = new Date().toISOString();

// Read existing state if present
let existing = '';
if (fs.existsSync(stateFile)) {
  existing = fs.readFileSync(stateFile, 'utf8');
}

// Append session end marker
const entry = `\n---\n## Session ended: ${timestamp}\n`;
fs.writeFileSync(stateFile, existing + entry);
console.log(`[FF] Session state saved to .ai/context/session-state.md`);
