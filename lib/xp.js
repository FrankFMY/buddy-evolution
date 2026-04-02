'use strict';

const {
  XP_PER_TOOL_CALL, XP_PER_FILE_EDIT, XP_PER_TEST_RUN,
  XP_PER_10_MINUTES, XP_DURATION_CAP, XP_SESSION_FLAT,
  STREAK_MULTIPLIER_INCREMENT, STREAK_MULTIPLIER_CAP,
  LEVEL_THRESHOLDS, TIER_LEVELS, STAT_NAMES,
} = require('./constants');

function getStreakMultiplier(days) {
  if (days <= 0) return 1.0;
  return Math.min(
    STREAK_MULTIPLIER_CAP,
    1.0 + (days - 1) * STREAK_MULTIPLIER_INCREMENT
  );
}

function calculateBaseXP(metrics) {
  const toolXP = metrics.toolCalls * XP_PER_TOOL_CALL;
  const editXP = metrics.fileEdits * XP_PER_FILE_EDIT;
  const testXP = metrics.testRuns * XP_PER_TEST_RUN;
  const durationXP = Math.min(
    XP_DURATION_CAP,
    Math.floor(metrics.durationMinutes / 10) * XP_PER_10_MINUTES
  );
  return XP_SESSION_FLAT + toolXP + editXP + testXP + durationXP;
}

function calculateSessionXP(metrics, streakDays) {
  const base = calculateBaseXP(metrics);
  const multiplier = getStreakMultiplier(streakDays);
  return Math.floor(base * multiplier);
}

function updateStreak(soul, sessionDate) {
  const today = sessionDate || new Date().toISOString().slice(0, 10);
  const last = soul.streak.lastSessionDate;

  if (!last) {
    // First ever session
    soul.streak.currentDays = 1;
  } else if (last === today) {
    // Same day, no change
  } else {
    const lastDate = new Date(last + 'T00:00:00Z');
    const todayDate = new Date(today + 'T00:00:00Z');
    const diffDays = Math.round((todayDate - lastDate) / 86400000);

    if (diffDays === 1) {
      soul.streak.currentDays++;
    } else if (diffDays > 1) {
      soul.streak.currentDays = 1; // streak broken
    }
  }

  soul.streak.lastSessionDate = today;
  if (soul.streak.currentDays > soul.streak.longestDays) {
    soul.streak.longestDays = soul.streak.currentDays;
  }
}

function getLevelFromXP(totalXP) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getTierFromLevel(level) {
  const tiers = Object.entries(TIER_LEVELS).sort((a, b) => b[1] - a[1]);
  for (const [tier, minLevel] of tiers) {
    if (level >= minLevel) return tier;
  }
  return 'hatchling';
}

function getXPForNextLevel(level) {
  if (level >= LEVEL_THRESHOLDS.length) return null; // max level
  return LEVEL_THRESHOLDS[level]; // 0-indexed: level N needs threshold[N]
}

function checkLevelUp(soul) {
  const oldLevel = soul.progression.level;
  const newLevel = getLevelFromXP(soul.progression.totalXP);
  const newTier = getTierFromLevel(newLevel);

  const result = {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    oldTier: soul.progression.tier,
    newTier,
    tierChanged: newTier !== soul.progression.tier,
  };

  soul.progression.level = newLevel;
  soul.progression.tier = newTier;

  // Record tier transition timestamps
  if (result.tierChanged && newTier !== 'hatchling') {
    if (!soul.progression.evolvedAt[newTier]) {
      soul.progression.evolvedAt[newTier] = new Date().toISOString();
    }
  }

  return result;
}

// Stat growth from session metrics
function calculateStatGrowth(metrics) {
  // SNARK grows from high tool density (many tool calls in short time = intense session)
  const toolDensity = metrics.durationMinutes > 0
    ? metrics.toolCalls / metrics.durationMinutes
    : 0;

  return {
    debugging: (metrics.fileEdits * 2 + metrics.testRuns * 5) * 0.1,
    patience:  metrics.durationMinutes * 0.05,
    chaos:     metrics.toolCalls > 0
      ? (metrics.rejectedToolCalls / metrics.toolCalls) * 10
      : 0,
    wisdom:    (metrics.estimatedOutputChars || 0) * 0.0001,
    snark:     toolDensity > 0.2 ? (toolDensity - 0.2) * 3 : 0, // grows from active sessions (>0.2 tools/min = 1 tool per 5 min)
  };
}

function applyDiminishingReturns(rawGrowth, currentGrowth) {
  if (rawGrowth <= 0) return 0;
  return rawGrowth * (100 / (100 + currentGrowth));
}

function applyStatGrowth(soul, metrics) {
  const rawGrowth = calculateStatGrowth(metrics);
  for (const stat of STAT_NAMES) {
    const raw = rawGrowth[stat] || 0;
    const current = soul.stats.growth[stat] || 0;
    soul.stats.growth[stat] = current + applyDiminishingReturns(raw, current);
  }
}

function getEffectiveStat(base, growth) {
  return Math.min(200, Math.max(1, Math.round(base + growth)));
}

function formatProgressBar(current, max, width = 20) {
  if (!max || max <= 0) return '█'.repeat(width);
  const ratio = Math.min(1, Math.max(0, current / max));
  const filled = Math.round(ratio * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

module.exports = {
  calculateSessionXP,
  getStreakMultiplier,
  updateStreak,
  getLevelFromXP,
  getTierFromLevel,
  getXPForNextLevel,
  checkLevelUp,
  applyStatGrowth,
  getEffectiveStat,
  formatProgressBar,
};
