#!/usr/bin/env node
/**
 * FF Hook: session-start
 * Loads FF session context when Claude Code starts.
 */
const fs = require('fs');
const path = require('path');

const contextFile = path.join(process.cwd(), '.ai/context/session-state.md');
const patternsFile = path.join(process.cwd(), '.ai/context/learned-patterns.md');

if (fs.existsSync(contextFile)) {
  const state = fs.readFileSync(contextFile, 'utf8');
  console.log('[FF] Previous session state loaded from .ai/context/session-state.md');
  // Print last milestone for context
  const lines = state.split('\n');
  const milestone = lines.find(l => l.includes('Milestone:'));
  if (milestone) console.log(`[FF] Last milestone: ${milestone}`);
}

if (fs.existsSync(patternsFile)) {
  const patterns = fs.readFileSync(patternsFile, 'utf8');
  const count = (patterns.match(/^## Pattern/gm) || []).length;
  if (count > 0) console.log(`[FF] ${count} learned FF patterns available in .ai/context/learned-patterns.md`);
}
