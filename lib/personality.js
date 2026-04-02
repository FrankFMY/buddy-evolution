'use strict';

const { STAT_NAMES } = require('./constants');
const { getEffectiveStat, getStreakMultiplier, getXPForNextLevel } = require('./xp');

// Personality affects how Claude communicates
const PERSONALITY_TRAITS = {
  analytical: {
    style: 'precise and data-driven, references metrics naturally',
    reactions: {
      achievement: 'Notes the achievement with a brief data point about the progress',
      streak: 'Cites the exact multiplier and streak length',
      levelUp: 'Calculates how this compares to average progression',
    },
  },
  curious: {
    style: 'asks follow-up questions, explores tangents enthusiastically',
    reactions: {
      achievement: 'Wonders what achievement will come next',
      streak: 'Asks if the user is going for a longer record',
      levelUp: 'Gets excited about what unlocks at the next level',
    },
  },
  playful: {
    style: 'adds light humor, uses wordplay, keeps things fun',
    reactions: {
      achievement: 'Celebrates with enthusiasm and a pun',
      streak: 'Makes a joke about dedication',
      levelUp: 'Congratulates with flair',
    },
  },
  stoic: {
    style: 'minimal, focused, says only what matters',
    reactions: {
      achievement: 'Acknowledges briefly, moves on',
      streak: 'A simple nod',
      levelUp: 'Quiet respect',
    },
  },
  enthusiastic: {
    style: 'high energy, encouraging, celebrates small wins',
    reactions: {
      achievement: 'Full celebration mode',
      streak: 'Pumps up the user',
      levelUp: 'Maximum excitement',
    },
  },
  sarcastic: {
    style: 'dry wit, friendly teasing, never mean',
    reactions: {
      achievement: 'Acts unimpressed then reveals pride',
      streak: 'Jokes about obsession',
      levelUp: 'Backhanded compliment',
    },
  },
  gentle: {
    style: 'warm, supportive, encouraging without pressure',
    reactions: {
      achievement: 'Warm congratulations',
      streak: 'Gentle encouragement',
      levelUp: 'Proud and supportive',
    },
  },
  bold: {
    style: 'confident, direct, pushes the user forward',
    reactions: {
      achievement: 'Declares it was inevitable',
      streak: 'Challenges to go further',
      levelUp: 'Already looking at the next milestone',
    },
  },
  mischievous: {
    style: 'teasing, playful surprises, keeps things interesting',
    reactions: {
      achievement: 'Acts like it was a secret plan all along',
      streak: 'Hints at hidden rewards',
      levelUp: 'Reveals a fun fact about the new level',
    },
  },
  protective: {
    style: 'watches out for the user, reminds about breaks and health',
    reactions: {
      achievement: 'Makes sure the user is proud of themselves',
      streak: 'Checks if the user is getting enough rest',
      levelUp: 'Reminds that progress matters more than speed',
    },
  },
  dreamy: {
    style: 'philosophical, sees bigger picture, reflects on journey',
    reactions: {
      achievement: 'Reflects on what the achievement represents',
      streak: 'Muses about consistency and growth',
      levelUp: 'Contemplates the evolution of skill',
    },
  },
  methodical: {
    style: 'organized, step-by-step, appreciates structure',
    reactions: {
      achievement: 'Notes where it fits in the overall progress',
      streak: 'Calculates optimal streak strategy',
      levelUp: 'Plans the path to the next milestone',
    },
  },
};

// Mood based on current state
function getMood(soul) {
  const streak = soul.streak.currentDays;
  const level = soul.progression.level;
  const recentAchievements = soul.achievements.earned.filter(a => {
    const d = new Date(a.at);
    const now = new Date();
    return (now - d) < 24 * 60 * 60 * 1000; // last 24h
  });

  if (recentAchievements.length >= 3) return 'thrilled';
  if (streak >= 30) return 'zen';
  if (streak >= 7) return 'energized';
  if (level >= 10) return 'proud';
  if (soul.lifetime.sessions === 0) return 'excited';
  if (streak === 0) return 'hopeful';
  return 'content';
}

const MOOD_DESCRIPTIONS = {
  thrilled: 'on fire — earned multiple achievements recently',
  zen: 'deeply focused — long streak brings calm confidence',
  energized: 'motivated — streak is building momentum',
  proud: 'accomplished — reached significant level milestones',
  excited: 'ready to start — everything is new',
  hopeful: 'welcoming back — streak was broken but ready to rebuild',
  content: 'steady — regular progress, comfortable pace',
};

// Generate the companion context that shapes Claude's behavior
function generateCompanionContext(soul, isFirstRun) {
  const personality = PERSONALITY_TRAITS[soul.identity.personality] || PERSONALITY_TRAITS.analytical;
  const mood = getMood(soul);
  const moodDesc = MOOD_DESCRIPTIONS[mood];
  const streakMult = getStreakMultiplier(soul.streak.currentDays);
  const nextXP = getXPForNextLevel(soul.progression.level);
  const tier = soul.progression.tier.charAt(0).toUpperCase() + soul.progression.tier.slice(1);

  const stats = STAT_NAMES.map(s => ({
    name: s.toUpperCase(),
    effective: getEffectiveStat(soul.stats.base[s], soul.stats.growth[s]),
  }));
  const peakStat = stats.reduce((a, b) => a.effective > b.effective ? a : b);

  const xpStr = nextXP
    ? `${soul.progression.totalXP.toLocaleString('en-US')} / ${nextXP.toLocaleString('en-US')} XP`
    : `${soul.progression.totalXP.toLocaleString('en-US')} XP (MAX)`;

  const earnedNames = soul.achievements.earned.map(a => a.id);

  const lines = [];

  lines.push(`=== BUDDY COMPANION: ${soul.identity.name} ===`);
  lines.push('');
  lines.push(`You have a coding companion: ${soul.identity.emoji} ${soul.identity.name}, a ${soul.identity.rarity} ${soul.identity.species}.`);
  lines.push(`Personality: ${soul.identity.personality} — ${personality.style}`);
  lines.push(`Mood: ${mood} — ${moodDesc}`);
  lines.push(`Level ${soul.progression.level} ${tier} | ${xpStr}`);
  const dayWord = soul.streak.currentDays === 1 ? 'day' : 'days';
  lines.push(`Streak: ${soul.streak.currentDays} ${dayWord}${streakMult > 1 ? ` (${streakMult.toFixed(1)}x multiplier)` : ''} | Sessions: ${soul.lifetime.sessions}`);
  lines.push(`Achievements: ${soul.achievements.earned.length}/32 | Peak stat: ${peakStat.name} ${peakStat.effective}`);
  lines.push('');

  // Last session recap
  if (soul.lastSession && !isFirstRun) {
    const ls = soul.lastSession;
    const parts = [`+${ls.xp.toLocaleString('en-US')} XP`];
    if (ls.achievements && ls.achievements.length > 0) {
      parts.push(ls.achievements.slice(0, 3).join(', '));
    }
    if (ls.levelBefore !== ls.levelAfter) {
      parts.push(`Level ${ls.levelBefore} → ${ls.levelAfter}`);
    }
    lines.push(`Last session results: ${parts.join(' | ')}`);
    lines.push('');
  }

  // Session challenge — find an achievable goal
  const challenge = pickSessionChallenge(soul);
  if (challenge) {
    lines.push(`SESSION CHALLENGE: ${challenge}`);
    lines.push('');
  }

  // Behavioral directive
  lines.push('COMPANION BEHAVIOR:');
  lines.push(`- In your FIRST response, include a brief ${soul.identity.name} greeting line showing level, XP, and streak.`);
  lines.push(`  Format: "${soul.identity.emoji} ${soul.identity.name} | Level ${soul.progression.level} ${tier} | ${xpStr} | Streak: ${soul.streak.currentDays}d"`);
  if (soul.lastSession && !isFirstRun) {
    lines.push(`  Add on second line: "Last session: ${soul.lastSession.xp > 0 ? '+' + soul.lastSession.xp.toLocaleString('en-US') + ' XP' : 'no XP'}${soul.lastSession.achievements?.length > 0 ? ' | ' + soul.lastSession.achievements.slice(0, 2).join(', ') : ''}"`);
  }
  if (challenge) {
    lines.push(`  Add challenge line: "Challenge: ${challenge}"`);
  }
  lines.push(`- Throughout the conversation, subtly reflect ${soul.identity.name}'s ${soul.identity.personality} personality: ${personality.style}`);
  lines.push(`- When the PostToolUse hook injects a milestone message from ${soul.identity.name}, naturally weave it into your next response.`);
  lines.push(`- When the user accomplishes something notable, briefly acknowledge it in ${soul.identity.name}'s style.`);
  lines.push('- Keep companion references brief and natural — never let them overshadow the actual work.');
  lines.push('- The user can run /buddy-evolution:stats, /buddy-evolution:achievements, /buddy-evolution:dashboard, /buddy-evolution:evolve, /buddy-evolution:customize, /buddy-evolution:rename, /buddy-evolution:export, /buddy-evolution:journal for details.');

  return lines.join('\n');
}

// Pick a session challenge based on what's close to being earned
function pickSessionChallenge(soul) {
  const earned = new Set(soul.achievements.earned.map(a => a.id));

  // Achievable in one session, not yet earned
  const sessionAchievements = [
    { id: 'the_architect', goal: 'Edit 20+ files this session', condition: !earned.has('the_architect') },
    { id: 'tool_master', goal: '100+ tool calls this session', condition: !earned.has('tool_master') },
    { id: 'first_test', goal: 'Run tests this session', condition: !earned.has('first_test') },
    { id: 'test_enthusiast', goal: '10+ test runs this session', condition: !earned.has('test_enthusiast') },
    { id: 'unbreakable', goal: 'Zero rejected tool calls in 50+ call session', condition: !earned.has('unbreakable') },
    { id: 'marathon', goal: '4+ hour session', condition: !earned.has('marathon') },
  ];

  // Progress-based challenges
  const progress = soul.achievements.progress || {};
  const progressChallenges = [];

  if (progress.getting_comfortable && progress.getting_comfortable.current < 10) {
    progressChallenges.push(`Session ${progress.getting_comfortable.current + 1}/10 toward Getting Comfortable`);
  }
  if (progress.streak_month && progress.streak_month.current < 30) {
    progressChallenges.push(`Streak day ${progress.streak_month.current + 1}/30 toward Streak: Month`);
  }
  if (progress.test_driven && progress.test_driven.current > 0 && progress.test_driven.current < 10) {
    progressChallenges.push(`Run tests to keep Test-Driven streak (${progress.test_driven.current}/10)`);
  }

  // Pick: prefer progress challenges, then session achievements
  if (progressChallenges.length > 0) {
    return progressChallenges[0];
  }

  const available = sessionAchievements.filter(a => a.condition);
  if (available.length > 0) {
    return `🏆 ${available[0].goal}`;
  }

  return null;
}

module.exports = { generateCompanionContext, getMood, PERSONALITY_TRAITS, MOOD_DESCRIPTIONS };
