'use strict';

const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.buddy-evolution');
const SOUL_PATH = path.join(DATA_DIR, 'soul.json');
const JOURNAL_DIR = path.join(DATA_DIR, 'journal');

const SPECIES = [
  { id: 'duck',      emoji: '🦆', rarity: 'common' },
  { id: 'goose',     emoji: '🦢', rarity: 'common' },
  { id: 'blob',      emoji: '👾', rarity: 'common' },
  { id: 'snail',     emoji: '🐌', rarity: 'common' },
  { id: 'cat',       emoji: '🐱', rarity: 'uncommon' },
  { id: 'rabbit',    emoji: '🐰', rarity: 'uncommon' },
  { id: 'owl',       emoji: '🦉', rarity: 'uncommon' },
  { id: 'penguin',   emoji: '🐧', rarity: 'uncommon' },
  { id: 'turtle',    emoji: '🐢', rarity: 'rare' },
  { id: 'octopus',   emoji: '🐙', rarity: 'rare' },
  { id: 'axolotl',   emoji: '🦎', rarity: 'rare' },
  { id: 'ghost',     emoji: '👻', rarity: 'epic' },
  { id: 'robot',     emoji: '🤖', rarity: 'epic' },
  { id: 'dragon',    emoji: '🐉', rarity: 'epic' },
  { id: 'capybara',  emoji: '🐾', rarity: 'legendary' },
  { id: 'mushroom',  emoji: '🍄', rarity: 'legendary' },
  { id: 'cactus',    emoji: '🌵', rarity: 'legendary' },
  { id: 'chonk',     emoji: '🐻', rarity: 'legendary' },
];

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const NAMES = {
  duck:     ['Quackers', 'Waddle', 'Drake', 'Mallard', 'Puddle', 'Biscuit'],
  goose:    ['Honk', 'Gander', 'Maverick', 'Noodle', 'Chaos', 'Goosifer'],
  blob:     ['Blobby', 'Gloop', 'Squish', 'Morph', 'Jello', 'Pudge'],
  snail:    ['Turbo', 'Shell', 'Spiral', 'Glide', 'Sluggo', 'Trail'],
  cat:      ['Whiskers', 'Shadow', 'Pixel', 'Byte', 'Nyx', 'Mochi'],
  rabbit:   ['Hoppy', 'Clover', 'Binky', 'Dash', 'Pepper', 'Bun'],
  owl:      ['Hoot', 'Sage', 'Athena', 'Pebble', 'Cosmo', 'Archie'],
  penguin:  ['Waddles', 'Tux', 'Frost', 'Pebble', 'Flip', 'Ice'],
  turtle:   ['Quibble', 'Shelly', 'Tank', 'Mossy', 'Newton', 'Zen'],
  octopus:  ['Cinder', 'Inky', 'Coral', 'Tentacle', 'Marina', 'Squid'],
  axolotl:  ['Axel', 'Gilly', 'Lotus', 'Bubbles', 'Sprout', 'Nemo'],
  ghost:    ['Phantom', 'Specter', 'Boo', 'Wisp', 'Shade', 'Echo'],
  robot:    ['Bolt', 'Circuit', 'Spark', 'Chrome', 'Bit', 'Nano'],
  dragon:   ['Zephyr', 'Ember', 'Fang', 'Blaze', 'Storm', 'Ash'],
  capybara: ['Cappy', 'Zen', 'Lola', 'Bongo', 'Mango', 'Chill'],
  mushroom: ['Spore', 'Truffle', 'Cap', 'Shiitake', 'Morel', 'Fungi'],
  cactus:   ['Spike', 'Prickle', 'Oasis', 'Bloom', 'Sandy', 'Thorn'],
  chonk:    ['Chungus', 'Bumble', 'Chunk', 'Tank', 'Fluff', 'Thicc'],
};

const STAT_NAMES = ['debugging', 'patience', 'chaos', 'wisdom', 'snark'];

// XP required to reach each level (cumulative)
const LEVEL_THRESHOLDS = [
  0,       // Level 1
  1000,    // Level 2
  3000,    // Level 3
  6000,    // Level 4
  10000,   // Level 5  — first evolution choice
  16000,   // Level 6
  24000,   // Level 7
  35000,   // Level 8
  50000,   // Level 9
  70000,   // Level 10 — second evolution choice
  95000,   // Level 11
  125000,  // Level 12
  160000,  // Level 13
  200000,  // Level 14
  250000,  // Level 15 — shiny variant
  310000,  // Level 16
  380000,  // Level 17
  460000,  // Level 18
  550000,  // Level 19
  650000,  // Level 20 — legendary cosmetics
];

const TIER_LEVELS = {
  hatchling: 1,
  juvenile:  5,
  adult:     10,
  elder:     15,
  ascended:  20,
};

// Regex patterns to detect test commands in Bash tool calls
const TEST_PATTERNS = [
  /\b(jest|vitest|mocha|ava|tap)\b/i,
  /\bnpm\s+(run\s+)?test/i,
  /\bpnpm\s+(run\s+)?test/i,
  /\byarn\s+(run\s+)?test/i,
  /\bnpx\s+(jest|vitest|mocha|playwright|cypress)/i,
  /\bpytest\b/i,
  /\bpython\s+-m\s+(pytest|unittest)/i,
  /\bgo\s+test\b/i,
  /\bcargo\s+test\b/i,
  /\bmake\s+test\b/i,
  /\brspec\b/i,
  /\bbundle\s+exec\s+rspec/i,
  /\bphpunit\b/i,
  /\bdotnet\s+test\b/i,
  /\bgradle\s+test\b/i,
  /\bmvn\s+test\b/i,
];

// XP rewards per action (balanced for ~14 sessions to level 5)
const XP_PER_TOOL_CALL = 5;
const XP_PER_FILE_EDIT = 15;
const XP_PER_TEST_RUN = 30;
const XP_PER_10_MINUTES = 20;
const XP_DURATION_CAP = 300;
const XP_SESSION_FLAT = 200;

// Evolution paths — 2 choices at Level 5, 2 sub-choices at Level 10
// Each species has thematic paths based on personality archetypes
const EVOLUTION_PATHS = {
  duck:     { A: 'Scholar', B: 'Prankster', A1: 'Sage', A2: 'Librarian', B1: 'Jester', B2: 'Trickster' },
  goose:    { A: 'Guardian', B: 'Chaos Agent', A1: 'Sentinel', A2: 'Warden', B1: 'Maverick', B2: 'Anarchist' },
  blob:     { A: 'Shapeshifter', B: 'Absorber', A1: 'Mimic', A2: 'Phantom', B1: 'Titan', B2: 'Void' },
  snail:    { A: 'Hermit', B: 'Explorer', A1: 'Sage', A2: 'Monk', B1: 'Pioneer', B2: 'Nomad' },
  cat:      { A: 'Shadow', B: 'Familiar', A1: 'Phantom', A2: 'Assassin', B1: 'Oracle', B2: 'Enchanter' },
  rabbit:   { A: 'Scout', B: 'Burrower', A1: 'Ranger', A2: 'Speedster', B1: 'Architect', B2: 'Keeper' },
  owl:      { A: 'Sage', B: 'Hunter', A1: 'Oracle', A2: 'Archivist', B1: 'Stalker', B2: 'Raptor' },
  penguin:  { A: 'Emperor', B: 'Diver', A1: 'Commander', A2: 'Diplomat', B1: 'Depths Walker', B2: 'Ice Breaker' },
  turtle:   { A: 'Scholar', B: 'Trickster', A1: 'Ancient Sage', A2: 'Librarian', B1: 'Jester', B2: 'Phantom' },
  octopus:  { A: 'Strategist', B: 'Artist', A1: 'Mastermind', A2: 'Admiral', B1: 'Illusionist', B2: 'Sculptor' },
  axolotl:  { A: 'Healer', B: 'Mutant', A1: 'Restorer', A2: 'Alchemist', B1: 'Chimera', B2: 'Adaptor' },
  ghost:    { A: 'Specter', B: 'Poltergeist', A1: 'Wraith', A2: 'Ethereal', B1: 'Haunter', B2: 'Banshee' },
  robot:    { A: 'Optimizer', B: 'Rebel', A1: 'Singularity', A2: 'Processor', B1: 'Rogue AI', B2: 'Liberator' },
  dragon:   { A: 'Elder', B: 'Storm', A1: 'Ancient', A2: 'Wyrm', B1: 'Tempest', B2: 'Inferno' },
  capybara: { A: 'Zen Master', B: 'Social King', A1: 'Enlightened', A2: 'Meditator', B1: 'Leader', B2: 'Connector' },
  mushroom: { A: 'Mycelium', B: 'Sporeborn', A1: 'Network', A2: 'Root Mind', B1: 'Sporeling', B2: 'Bloom' },
  cactus:   { A: 'Sentinel', B: 'Bloom', A1: 'Ironwall', A2: 'Desert King', B1: 'Oasis', B2: 'Flower' },
  chonk:    { A: 'Titan', B: 'Gentle Giant', A1: 'Colossus', A2: 'Juggernaut', B1: 'Protector', B2: 'Hugger' },
};

const STREAK_MULTIPLIER_INCREMENT = 0.1;
const STREAK_MULTIPLIER_CAP = 2.0;

module.exports = {
  DATA_DIR,
  SOUL_PATH,
  JOURNAL_DIR,
  SPECIES,
  RARITY_ORDER,
  NAMES,
  STAT_NAMES,
  LEVEL_THRESHOLDS,
  TIER_LEVELS,
  TEST_PATTERNS,
  XP_PER_TOOL_CALL,
  XP_PER_FILE_EDIT,
  XP_PER_TEST_RUN,
  XP_PER_10_MINUTES,
  XP_DURATION_CAP,
  XP_SESSION_FLAT,
  EVOLUTION_PATHS,
  STREAK_MULTIPLIER_INCREMENT,
  STREAK_MULTIPLIER_CAP,
};
