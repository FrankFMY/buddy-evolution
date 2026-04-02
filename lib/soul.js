'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
  DATA_DIR, SOUL_PATH, JOURNAL_DIR,
  SPECIES, NAMES, STAT_NAMES, RARITY_ORDER,
} = require('./constants');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(JOURNAL_DIR, { recursive: true });
}

function loadSoul() {
  try {
    const raw = fs.readFileSync(SOUL_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // If file exists but is corrupted (race condition during write),
    // return null but DON'T let createSoul overwrite it.
    // Mark that file exists so session-start knows not to create a new one.
    if (fs.existsSync(SOUL_PATH)) {
      loadSoul._fileExistsButCorrupt = true;
    }
    return null;
  }
}
loadSoul._fileExistsButCorrupt = false;

function saveSoul(soul) {
  ensureDataDir();
  // Backup before overwrite (keep last 3 backups)
  try {
    if (fs.existsSync(SOUL_PATH)) {
      const backupDir = path.join(DATA_DIR, 'backups');
      fs.mkdirSync(backupDir, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      fs.copyFileSync(SOUL_PATH, path.join(backupDir, `soul-${ts}.json`));
      // Prune old backups, keep last 3
      const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('soul-')).sort().reverse();
      for (const old of backups.slice(3)) {
        fs.unlinkSync(path.join(backupDir, old));
      }
    }
  } catch {
    // Backup failure shouldn't block save
  }
  const tmp = SOUL_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(soul, null, 2), 'utf-8');
  fs.renameSync(tmp, SOUL_PATH);
}

// Deterministic PRNG seeded from a string (mulberry32)
function seededRng(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function () {
    h |= 0; h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pickSpecies(rng) {
  // Weighted selection: group species by rarity, pick rarity first, then species
  const weights = { common: 0.45, uncommon: 0.25, rare: 0.15, epic: 0.10, legendary: 0.05 };
  const roll = rng();
  let cumulative = 0;
  let selectedRarity = 'common';
  for (const rarity of RARITY_ORDER) {
    cumulative += weights[rarity];
    if (roll < cumulative) { selectedRarity = rarity; break; }
  }
  const candidates = SPECIES.filter(s => s.rarity === selectedRarity);
  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx];
}

function pickName(speciesId, rng) {
  const pool = NAMES[speciesId] || ['Buddy'];
  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

function generateBaseStats(rng) {
  const stats = {};
  // Pick one peak stat (70-95) and one dump stat (5-20), rest scattered (30-70)
  const shuffled = [...STAT_NAMES].sort(() => rng() - 0.5);
  const peak = shuffled[0];
  const dump = shuffled[shuffled.length - 1];

  for (const stat of STAT_NAMES) {
    if (stat === peak) {
      stats[stat] = Math.floor(rng() * 26) + 70; // 70-95
    } else if (stat === dump) {
      stats[stat] = Math.floor(rng() * 16) + 5;  // 5-20
    } else {
      stats[stat] = Math.floor(rng() * 41) + 30;  // 30-70
    }
  }
  return stats;
}

function createSoul() {
  const seed = `${os.hostname()}:${os.userInfo().username}:buddy-evolution`;
  const rng = seededRng(seed);

  const species = pickSpecies(rng);
  const name = pickName(species.id, rng);
  const baseStats = generateBaseStats(rng);

  const soul = {
    version: 2,
    identity: {
      species: species.id,
      name,
      rarity: species.rarity,
      emoji: species.emoji,
      personality: pickPersonality(rng),
      hatchedAt: new Date().toISOString(),
      seed: crypto.createHash('sha256').update(seed).digest('hex').slice(0, 12),
    },
    progression: {
      level: 1,
      totalXP: 0,
      tier: 'hatchling',
      evolutionPath: [],
      evolvedAt: { juvenile: null, adult: null, elder: null, ascended: null },
    },
    stats: {
      base: baseStats,
      growth: Object.fromEntries(STAT_NAMES.map(s => [s, 0])),
    },
    streak: {
      currentDays: 0,
      longestDays: 0,
      lastSessionDate: null,
    },
    achievements: {
      earned: [],
      progress: {},
    },
    familiarity: {},
    cosmetics: {
      hat: null,
      color: 'default',
      shiny: false,
      title: null,
    },
    lifetime: {
      sessions: 0,
      durationMinutes: 0,
      toolCalls: 0,
      rejectedToolCalls: 0,
      fileEdits: 0,
      testRuns: 0,
      bashCalls: 0,
      readCalls: 0,
      grepCalls: 0,
    },
  };

  ensureDataDir();
  saveSoul(soul);
  return soul;
}

function pickPersonality(rng) {
  const personalities = [
    'methodical', 'curious', 'playful', 'stoic',
    'enthusiastic', 'sarcastic', 'gentle', 'bold',
    'analytical', 'dreamy', 'protective', 'mischievous',
  ];
  return personalities[Math.floor(rng() * personalities.length)];
}

// Get the species object for a soul
function getSpeciesInfo(soul) {
  return SPECIES.find(s => s.id === soul.identity.species) || SPECIES[0];
}

module.exports = { ensureDataDir, loadSoul, saveSoul, createSoul, getSpeciesInfo };
