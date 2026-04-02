#!/usr/bin/env node
'use strict';

const path = require('path');

const libDir = path.join(__dirname, '..', 'lib');
const { ensureDataDir, loadSoul, createSoul } = require(path.join(libDir, 'soul'));
const { updateStreak } = require(path.join(libDir, 'xp'));
const { generateCompanionContext } = require(path.join(libDir, 'personality'));

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  ensureDataDir();
  let soul = loadSoul();
  let isFirstRun = false;

  if (!soul) {
    soul = createSoul();
    isFirstRun = true;
  }

  const today = new Date().toISOString().slice(0, 10);
  updateStreak(soul, today);

  // Reset session counter for PostToolUse milestone tracking
  const counterFile = path.join(require(path.join(libDir, 'constants')).DATA_DIR, '.session-counter');
  try { require('fs').writeFileSync(counterFile, '{"tools":0,"edits":0,"tests":0,"reads":0}'); } catch {}

  // Generate rich companion context that shapes Claude's behavior
  const context = generateCompanionContext(soul, isFirstRun);

  process.stdout.write(context);
  process.exit(0);
}

main().catch(err => {
  process.stderr.write(`[buddy-evolution] session-start error: ${err.message}\n`);
  process.exit(0);
});
