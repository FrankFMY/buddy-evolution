#!/usr/bin/env node
'use strict';

const path = require('path');

const libDir = path.join(__dirname, '..', 'lib');
const { ensureDataDir, loadSoul, createSoul, getSpeciesInfo } = require(path.join(libDir, 'soul'));
const { getStreakMultiplier, updateStreak, getXPForNextLevel, formatProgressBar } = require(path.join(libDir, 'xp'));
const { LEVEL_THRESHOLDS } = require(path.join(libDir, 'constants'));

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let hookData = {};
  try { hookData = JSON.parse(input); } catch {}

  ensureDataDir();
  let soul = loadSoul();
  let isFirstRun = false;

  if (!soul) {
    soul = createSoul();
    isFirstRun = true;
  }

  const today = new Date().toISOString().slice(0, 10);
  updateStreak(soul, today);

  const species = getSpeciesInfo(soul);
  const emoji = species?.emoji || '🐾';
  const streakMult = getStreakMultiplier(soul.streak.currentDays);
  const streakStr = streakMult > 1.0 ? ` (🔥 ${streakMult.toFixed(1)}x)` : '';
  const nextLevelXP = getXPForNextLevel(soul.progression.level);
  const currentLevelXP = LEVEL_THRESHOLDS[soul.progression.level - 1] || 0;

  const xpStr = nextLevelXP
    ? `${soul.progression.totalXP.toLocaleString('en-US')} / ${nextLevelXP.toLocaleString('en-US')} XP`
    : `${soul.progression.totalXP.toLocaleString('en-US')} XP (MAX)`;

  let greeting;
  if (isFirstRun) {
    greeting = [
      `${emoji} A wild ${soul.identity.species} appeared! Meet ${soul.identity.name}!`,
      `   Rarity: ${soul.identity.rarity} | Personality: ${soul.identity.personality}`,
      `   Your companion will track your progress across sessions.`,
      `   Type /buddy-evolution:help to learn more.`,
    ].join('\n');
  } else {
    const tier = soul.progression.tier.charAt(0).toUpperCase() + soul.progression.tier.slice(1);
    const dayWord = soul.streak.currentDays === 1 ? 'day' : 'days';
    const bar = nextLevelXP
      ? formatProgressBar(soul.progression.totalXP - currentLevelXP, nextLevelXP - currentLevelXP, 15)
      : '███████████████';

    const lines = [
      `${emoji} ${soul.identity.name} welcomes you! Level ${soul.progression.level} ${tier} ${bar} ${xpStr}`,
      `   Streak: ${soul.streak.currentDays} ${dayWord}${streakStr} | Sessions: ${soul.lifetime.sessions}`,
    ];

    // Show last session diff
    if (soul.lastSession) {
      const ls = soul.lastSession;
      let diffParts = [`+${ls.xp.toLocaleString('en-US')} XP`];
      if (ls.achievements && ls.achievements.length > 0) {
        const achStr = ls.achievements.slice(0, 3).map(a => `🏆 ${a}`).join(', ');
        diffParts.push(achStr);
      }
      if (ls.levelBefore !== ls.levelAfter) {
        diffParts.push(`Level ${ls.levelBefore} → ${ls.levelAfter}`);
      }
      lines.push(`   Last session: ${diffParts.join(' | ')}`);
    }

    greeting = lines.join('\n');
  }

  // Build rich context for Claude with companion directive
  const tier = soul.progression.tier.charAt(0).toUpperCase() + soul.progression.tier.slice(1);
  const earnedCount = soul.achievements.earned.length;

  const contextLines = [
    `BUDDY COMPANION SYSTEM — ${soul.identity.name} the ${soul.identity.species}`,
    `${emoji} ${soul.identity.name} | ${soul.identity.rarity} ${soul.identity.species} | ${soul.identity.personality}`,
    `Level ${soul.progression.level} ${tier} | ${xpStr} | Streak: ${soul.streak.currentDays} ${soul.streak.currentDays === 1 ? 'day' : 'days'}${streakStr}`,
    `Sessions: ${soul.lifetime.sessions} | Achievements: ${earnedCount}/32`,
  ];

  // Add last session recap
  if (soul.lastSession && !isFirstRun) {
    const ls = soul.lastSession;
    const parts = [`+${ls.xp.toLocaleString('en-US')} XP`];
    if (ls.achievements && ls.achievements.length > 0) {
      parts.push(ls.achievements.slice(0, 3).map(a => `🏆 ${a}`).join(', '));
    }
    if (ls.levelBefore !== ls.levelAfter) {
      parts.push(`Level ${ls.levelBefore} → ${ls.levelAfter}`);
    }
    contextLines.push(`Last session: ${parts.join(' | ')}`);
  }

  contextLines.push('');
  contextLines.push('DIRECTIVE: Include the buddy greeting below in your FIRST response to the user (before answering their question). Display it exactly as formatted:');
  contextLines.push(greeting);

  const output = contextLines.join('\n');
  process.stdout.write(output);
  process.exit(0);
}

main().catch(err => {
  process.stderr.write(`[buddy-evolution] session-start error: ${err.message}\n`);
  process.exit(0);
});
