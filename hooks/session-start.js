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
    // CRITICAL: check if file exists on disk before creating new soul.
    // Race condition: context compaction triggers SessionStart while file is mid-write.
    // If file exists but can't parse → skip, don't overwrite. It'll be readable next time.
    const fs = require('fs');
    const { SOUL_PATH } = require(path.join(libDir, 'constants'));
    if (fs.existsSync(SOUL_PATH) && fs.statSync(SOUL_PATH).size > 0) {
      // Try restoring from backup
      const backupDir = path.join(path.dirname(SOUL_PATH), 'backups');
      try {
        const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('soul-')).sort().reverse();
        for (const backup of backups) {
          try {
            soul = JSON.parse(fs.readFileSync(path.join(backupDir, backup), 'utf-8'));
            break; // Found valid backup
          } catch {}
        }
      } catch {}
      if (!soul) process.exit(0); // No valid backup, skip entirely
    } else {
      soul = createSoul();
      isFirstRun = true;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  updateStreak(soul, today);

  // Reset session counter for PostToolUse milestone tracking
  const counterFile = path.join(require(path.join(libDir, 'constants')).DATA_DIR, '.session-counter');
  try { require('fs').writeFileSync(counterFile, '{"tools":0,"edits":0,"tests":0,"reads":0}'); } catch {}

  // Generate rich companion context that shapes Claude's behavior
  const context = generateCompanionContext(soul, isFirstRun);

  // Build visible greeting for terminal (stderr)
  const { getStreakMultiplier, getXPForNextLevel } = require(path.join(libDir, 'xp'));
  const { LEVEL_THRESHOLDS } = require(path.join(libDir, 'constants'));
  const emoji = soul.identity.emoji || '🐾';
  const tier = soul.progression.tier.charAt(0).toUpperCase() + soul.progression.tier.slice(1);
  const streakMult = getStreakMultiplier(soul.streak.currentDays);
  const streakStr = streakMult > 1.0 ? ` (🔥 ${streakMult.toFixed(1)}x)` : '';
  const nextXP = getXPForNextLevel(soul.progression.level);
  const xpStr = nextXP
    ? `${soul.progression.totalXP.toLocaleString('en-US')} / ${nextXP.toLocaleString('en-US')} XP`
    : `${soul.progression.totalXP.toLocaleString('en-US')} XP (MAX)`;
  const dayWord = soul.streak.currentDays === 1 ? 'day' : 'days';
  const evoStr = soul.progression.evolutionPath.length > 0 ? ' ' + soul.progression.evolutionPath.join(' → ') : '';

  const greetLines = [];
  if (isFirstRun) {
    greetLines.push(`${emoji} A wild ${soul.identity.species} appeared! Meet ${soul.identity.name}!`);
    greetLines.push(`   Rarity: ${soul.identity.rarity} | Personality: ${soul.identity.personality}`);
  } else {
    greetLines.push(`${emoji} ${soul.identity.name} | Level ${soul.progression.level} ${tier}${evoStr} | ${xpStr} | Streak: ${soul.streak.currentDays} ${dayWord}${streakStr}`);
    if (soul.lastSession) {
      const ls = soul.lastSession;
      const parts = [`+${ls.xp.toLocaleString('en-US')} XP`];
      if (ls.achievements?.length > 0) parts.push(ls.achievements.slice(0, 2).join(', '));
      if (ls.levelBefore !== ls.levelAfter) parts.push(`Level ${ls.levelBefore} → ${ls.levelAfter}`);
      greetLines.push(`   Last: ${parts.join(' | ')}`);
    }
  }
  process.stderr.write(greetLines.join('\n') + '\n');

  // Stdout: full context for Claude
  process.stdout.write(context);
  process.exit(0);
}

main().catch(err => {
  process.stderr.write(`[buddy-evolution] session-start error: ${err.message}\n`);
  process.exit(0);
});
