'use strict';

const ACHIEVEMENTS = [
  // === CODING ===
  {
    id: 'first_steps', name: 'First Steps', category: 'coding',
    description: 'Complete your first session',
    trigger: (_s, soul) => soul.lifetime.sessions >= 1,
    xp: 100, rarity: 'common',
  },
  {
    id: 'getting_comfortable', name: 'Getting Comfortable', category: 'coding',
    description: 'Complete 10 sessions',
    trigger: (_s, soul) => soul.lifetime.sessions >= 10,
    xp: 200, rarity: 'common',
    progress: (soul) => ({ current: soul.lifetime.sessions, target: 10 }),
  },
  {
    id: 'centurion', name: 'Centurion', category: 'coding',
    description: 'Complete 100 sessions',
    trigger: (_s, soul) => soul.lifetime.sessions >= 100,
    xp: 1000, rarity: 'uncommon',
    progress: (soul) => ({ current: soul.lifetime.sessions, target: 100 }),
  },
  {
    id: 'veteran', name: 'Veteran', category: 'coding',
    description: 'Complete 500 sessions',
    trigger: (_s, soul) => soul.lifetime.sessions >= 500,
    xp: 3000, rarity: 'rare',
    progress: (soul) => ({ current: soul.lifetime.sessions, target: 500 }),
  },
  {
    id: 'living_legend', name: 'Living Legend', category: 'coding',
    description: 'Complete 1,000 sessions',
    trigger: (_s, soul) => soul.lifetime.sessions >= 1000,
    xp: 10000, rarity: 'legendary',
    progress: (soul) => ({ current: soul.lifetime.sessions, target: 1000 }),
  },
  {
    id: 'the_architect', name: 'The Architect', category: 'coding',
    description: '20+ file edits in one session',
    trigger: (session) => session.fileEdits >= 20,
    xp: 500, rarity: 'rare',
  },
  {
    id: 'tool_master', name: 'Tool Master', category: 'coding',
    description: '100+ tool calls in one session',
    trigger: (session) => session.toolCalls >= 100,
    xp: 400, rarity: 'uncommon',
  },
  {
    id: 'wordsmith', name: 'Wordsmith', category: 'coding',
    description: 'Massive output session (200K+ characters)',
    trigger: (session) => (session.estimatedOutputChars || 0) >= 200000,
    xp: 600, rarity: 'rare',
  },

  // === TESTING ===
  {
    id: 'first_test', name: 'First Test', category: 'testing',
    description: 'Run tests in a session',
    trigger: (session) => session.testRuns >= 1,
    xp: 100, rarity: 'common',
  },
  {
    id: 'test_enthusiast', name: 'Test Enthusiast', category: 'testing',
    description: '10+ test runs in one session',
    trigger: (session) => session.testRuns >= 10,
    xp: 300, rarity: 'uncommon',
  },
  {
    id: 'test_marathon', name: 'Test Marathon', category: 'testing',
    description: '50+ test runs in one session',
    trigger: (session) => session.testRuns >= 50,
    xp: 1000, rarity: 'epic',
  },
  {
    id: 'test_driven', name: 'Test-Driven', category: 'testing',
    description: 'Run tests in 10 consecutive sessions',
    trigger: (_s, soul) => (soul.achievements.progress.test_driven?.current || 0) >= 10,
    xp: 800, rarity: 'rare',
    progress: (soul) => ({ current: soul.achievements.progress.test_driven?.current || 0, target: 10 }),
  },

  // === DEBUGGING ===
  {
    id: 'persistence', name: 'Persistence', category: 'debugging',
    description: '5+ rejected tool calls, still complete work',
    trigger: (session) => session.rejectedToolCalls >= 5 && session.fileEdits > 0,
    xp: 300, rarity: 'uncommon',
  },
  {
    id: 'against_all_odds', name: 'Against All Odds', category: 'debugging',
    description: '20+ rejected tool calls, still complete work',
    trigger: (session) => session.rejectedToolCalls >= 20 && session.fileEdits > 0,
    xp: 800, rarity: 'epic',
  },
  {
    id: 'unbreakable', name: 'Unbreakable', category: 'debugging',
    description: '0 rejected calls in a session with 50+ total calls',
    trigger: (session) => session.rejectedToolCalls === 0 && session.toolCalls >= 50,
    xp: 500, rarity: 'rare',
  },
  {
    id: 'context_survivor', name: 'Context Survivor', category: 'debugging',
    description: 'Productive work after context reset',
    trigger: () => false, // Not detectable in v1 — context resets not in transcript
    xp: 400, rarity: 'uncommon',
  },

  // === CONSISTENCY ===
  {
    id: 'streak_week', name: 'Streak: Week', category: 'consistency',
    description: '7 consecutive days',
    trigger: (_s, soul) => soul.streak.currentDays >= 7,
    xp: 500, rarity: 'common',
  },
  {
    id: 'streak_month', name: 'Streak: Month', category: 'consistency',
    description: '30 consecutive days',
    trigger: (_s, soul) => soul.streak.currentDays >= 30,
    xp: 2000, rarity: 'rare',
    progress: (soul) => ({ current: soul.streak.currentDays, target: 30 }),
  },
  {
    id: 'streak_quarter', name: 'Streak: Quarter', category: 'consistency',
    description: '90 consecutive days',
    trigger: (_s, soul) => soul.streak.currentDays >= 90,
    xp: 5000, rarity: 'epic',
    progress: (soul) => ({ current: soul.streak.currentDays, target: 90 }),
  },
  {
    id: 'streak_year', name: 'Streak: Year', category: 'consistency',
    description: '365 consecutive days',
    trigger: (_s, soul) => soul.streak.currentDays >= 365,
    xp: 20000, rarity: 'legendary',
    progress: (soul) => ({ current: soul.streak.currentDays, target: 365 }),
  },
  {
    id: 'early_bird', name: 'Early Bird', category: 'consistency',
    description: 'Session started before 7 AM local',
    trigger: (session) => {
      if (!session.startTime) return false;
      return session.startTime.getHours() < 7;
    },
    xp: 100, rarity: 'common', repeatable: true,
  },
  {
    id: 'night_owl', name: 'Night Owl', category: 'consistency',
    description: 'Session active past midnight',
    trigger: (session) => {
      if (!session.endTime) return false;
      const startH = session.startTime?.getHours();
      const endH = session.endTime.getHours();
      return (startH >= 22 && endH < 7) || (startH > endH);
    },
    xp: 100, rarity: 'common', repeatable: true,
  },
  {
    id: 'marathon', name: 'Marathon', category: 'consistency',
    description: 'Session longer than 4 hours',
    trigger: (session) => session.durationMinutes >= 240,
    xp: 600, rarity: 'rare',
  },

  // === EXPLORATION ===
  {
    id: 'tourist', name: 'Tourist', category: 'exploration',
    description: 'Work in 5 different projects',
    trigger: (_s, soul) => Object.keys(soul.familiarity).length >= 5,
    xp: 400, rarity: 'uncommon',
    progress: (soul) => ({ current: Object.keys(soul.familiarity).length, target: 5 }),
  },
  {
    id: 'globe_trotter', name: 'Globe Trotter', category: 'exploration',
    description: 'Work in 20 different projects',
    trigger: (_s, soul) => Object.keys(soul.familiarity).length >= 20,
    xp: 1500, rarity: 'epic',
    progress: (soul) => ({ current: Object.keys(soul.familiarity).length, target: 20 }),
  },
  {
    id: 'deep_roots', name: 'Deep Roots', category: 'exploration',
    description: 'Reach Expert familiarity (50+ touches) on 5 files',
    trigger: (_s, soul) => countExpertFiles(soul) >= 5,
    xp: 800, rarity: 'rare',
    progress: (soul) => ({ current: countExpertFiles(soul), target: 5 }),
  },
  {
    id: 'homecoming', name: 'Homecoming', category: 'exploration',
    description: 'Return to a file after 30+ days',
    trigger: (session, soul) => hasHomecoming(session, soul, 30),
    xp: 200, rarity: 'common',
  },
  {
    id: 'old_friend', name: 'Old Friend', category: 'exploration',
    description: 'Return to an Expert file after 60+ days away',
    trigger: (session, soul) => hasOldFriend(session, soul),
    xp: 500, rarity: 'rare',
  },

  // === META ===
  {
    id: 'pet_day', name: 'Pet Day', category: 'meta',
    description: 'Pet buddy 10 times in one session',
    trigger: () => false, // Not implementable in v1 — /buddy pet is being removed
    xp: 50, rarity: 'common',
  },
  {
    id: 'first_evolution', name: 'First Evolution', category: 'meta',
    description: 'Make first evolution choice (level 5)',
    trigger: (_s, soul) => soul.progression.evolutionPath.length >= 1,
    xp: 1000, rarity: 'uncommon',
  },
  {
    id: 'final_form', name: 'Final Form', category: 'meta',
    description: 'Make second evolution choice (level 10)',
    trigger: (_s, soul) => soul.progression.evolutionPath.length >= 2,
    xp: 3000, rarity: 'rare',
  },
  {
    id: 'the_collector', name: 'The Collector', category: 'meta',
    description: 'Earn 20 different achievements',
    trigger: (_s, soul) => soul.achievements.earned.length >= 20,
    xp: 2000, rarity: 'epic',
    progress: (soul) => ({ current: soul.achievements.earned.length, target: 20 }),
  },
  {
    id: 'happy_birthday', name: 'Happy Birthday', category: 'meta',
    description: 'Use buddy on 1-year hatch anniversary',
    trigger: (_s, soul) => {
      const hatched = new Date(soul.identity.hatchedAt);
      const now = new Date();
      return now.getMonth() === hatched.getMonth()
        && now.getDate() === hatched.getDate()
        && now.getFullYear() > hatched.getFullYear();
    },
    xp: 5000, rarity: 'legendary', hidden: true,
  },
  {
    id: 'completionist', name: 'Completionist', category: 'meta',
    description: 'Earn all non-hidden achievements',
    trigger: (_s, soul) => {
      // Exclude: hidden, self, and v1-unimplementable achievements
      const V1_DISABLED = new Set(['completionist', 'pet_day', 'first_evolution', 'final_form', 'context_survivor']);
      const required = ACHIEVEMENTS.filter(a => !a.hidden && !V1_DISABLED.has(a.id));
      const earnedIds = new Set(soul.achievements.earned.map(e => e.id));
      return required.every(a => earnedIds.has(a.id));
    },
    xp: 10000, rarity: 'legendary', hidden: true,
  },
];

// --- Helper functions ---

function countExpertFiles(soul) {
  let count = 0;
  for (const project of Object.values(soul.familiarity)) {
    if (!project.files) continue;
    for (const file of Object.values(project.files)) {
      if (file.touches >= 50) count++;
    }
  }
  return count;
}

function hasHomecoming(session, soul, minDays) {
  const today = new Date().toISOString().slice(0, 10);
  const editedFiles = session.filesEditedList || [];

  for (const filePath of editedFiles) {
    for (const project of Object.values(soul.familiarity)) {
      if (!project.files || !project.files[filePath]) continue;
      const lastTouched = project.files[filePath].last;
      if (!lastTouched) continue;
      const daysSince = Math.round(
        (new Date(today) - new Date(lastTouched)) / 86400000
      );
      if (daysSince >= minDays) return true;
    }
  }
  return false;
}

function hasOldFriend(session, soul) {
  const today = new Date().toISOString().slice(0, 10);
  const editedFiles = session.filesEditedList || [];

  for (const filePath of editedFiles) {
    for (const project of Object.values(soul.familiarity)) {
      if (!project.files || !project.files[filePath]) continue;
      const file = project.files[filePath];
      if (file.touches < 50) continue; // not Expert
      const daysSince = Math.round(
        (new Date(today) - new Date(file.last)) / 86400000
      );
      if (daysSince >= 60) return true;
    }
  }
  return false;
}

// --- Main detection ---

function checkAchievements(session, soul) {
  const earnedIds = new Set(soul.achievements.earned.map(e => e.id));
  const newlyEarned = [];

  for (const achievement of ACHIEVEMENTS) {
    if (earnedIds.has(achievement.id) && !achievement.repeatable) continue;

    try {
      if (achievement.trigger(session, soul)) {
        newlyEarned.push(achievement);
        if (!achievement.repeatable) {
          soul.achievements.earned.push({
            id: achievement.id,
            at: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Skip broken triggers gracefully
    }
  }

  return newlyEarned;
}

function updateProgress(soul) {
  const earnedIds = new Set(soul.achievements.earned.map(e => e.id));
  const progress = {};

  for (const achievement of ACHIEVEMENTS) {
    if (earnedIds.has(achievement.id)) continue;
    if (!achievement.progress) continue;

    try {
      const p = achievement.progress(soul);
      if (p && p.current < p.target) {
        progress[achievement.id] = p;
      }
    } catch {
      // Skip broken progress functions
    }
  }

  soul.achievements.progress = progress;
}

// Track test-driven streak (consecutive sessions with tests)
// Only reset on "real" sessions (10+ tool calls) — a 2-min check-in shouldn't break the streak
function updateTestDrivenStreak(soul, session) {
  if (!soul.achievements.progress.test_driven) {
    soul.achievements.progress.test_driven = { current: 0, target: 10 };
  }
  if (session.testRuns >= 1) {
    soul.achievements.progress.test_driven.current++;
  } else if (session.toolCalls >= 10) {
    // Only reset if it was a real coding session without tests
    soul.achievements.progress.test_driven.current = 0;
  }
  // Short sessions (< 10 tool calls) don't affect the streak
}

module.exports = { ACHIEVEMENTS, checkAchievements, updateProgress, updateTestDrivenStreak };
