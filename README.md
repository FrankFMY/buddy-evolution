# buddy-evolution

Companion progression system for Claude Code. Your buddy lives in Claude's personality — shaping greetings, reactions, and communication style based on your coding activity.

Born from the community response to Anthropic's `/buddy` April Fools feature. The ASCII pet is gone, but the companion lives on — inside Claude itself.

## Features

- **Companion personality** — 12 personality types that shape how Claude communicates
- **Mood system** — 7 moods that shift based on streak, level, and recent achievements
- **34 achievements** across 6 categories with XP rewards
- **XP & leveling** — 20 levels with streak multipliers up to 2x
- **Stat growth** — 5 stats evolve from your activity patterns with diminishing returns
- **Evolution paths** — choose your buddy's evolution at Level 5 and 10 (18 species × 4 final forms)
- **Session journal** — automatic monthly logs with weekly summaries
- **Session recap** — Claude greets you with what happened last session
- **File familiarity** — New → Familiar → Expert → Nostalgic
- **Per-project stats** — XP and sessions tracked per project
- **Desktop notifications** — OS-native alerts on achievement unlock
- **Visual dashboard** — HTML stats page with achievement grid and charts
- **Full customization** — change species, personality, name, stats anytime
- **Auto backup** — 3 rotating soul backups before each save
- **72 automated tests** — full test suite
- **Zero dependencies** — pure Node.js, no npm install
- **Fully local** — no data leaves your machine

## Install

```
/plugin marketplace add FrankFMY/buddy-evolution
/plugin install buddy-evolution@buddy-evolution
```

Restart Claude Code. On next session start, your buddy greets you:

```
🐉 Zephyr | Level 7 Elder | 35,200 / 50,000 XP | Streak: 12d
   Last session: +840 XP | 🏆 Test-Driven
```

On session end, you see:

```
🐉 Session complete! +840 XP
   Level 7 ██████████████████░░ 36,040 / 50,000 XP
   🏆 The Architect — 20+ file edits (+500 XP)
```

### Alternative: manual install

```bash
git clone https://github.com/FrankFMY/buddy-evolution ~/buddy-evolution
```

Add to `~/.claude/settings.json` inside `"hooks"`:

```json
"SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/buddy-evolution/hooks/session-start.js", "timeout": 5 }] }],
"SessionEnd": [{ "hooks": [{ "type": "command", "command": "node ~/buddy-evolution/hooks/session-end.js", "timeout": 30 }] }]
```

## Commands

| Command | Description |
|---|---|
| `/buddy-evolution:stats` | Level, XP, stats, streak, top files, top projects |
| `/buddy-evolution:achievements` | Earned, in-progress, locked, hidden |
| `/buddy-evolution:journal` | Session history + weekly summaries |
| `/buddy-evolution:evolve` | Choose evolution path (Level 5 / 10) |
| `/buddy-evolution:customize` | Change species, personality, name, stats |
| `/buddy-evolution:rename` | Quick rename |
| `/buddy-evolution:export` | Shareable stats card |
| `/buddy-evolution:dashboard` | HTML dashboard in browser |
| `/buddy-evolution:help` | How the plugin works |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SESSION START                           │
│  hooks/session-start.js                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Load soul.json│→│ Check streak │→│ Generate context  │  │
│  └──────────────┘  └──────────────┘  │ (personality +   │  │
│                                       │  mood + greeting  │  │
│                                       │  + lastSession)   │  │
│                                       └────────┬─────────┘  │
│                                                ↓             │
│                                    Inject into Claude's      │
│                                    conversation context      │
└─────────────────────────────────────────────────────────────┘
                          ↓
              Claude works with buddy personality
              (12 types × 7 moods shape responses)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      SESSION END                            │
│  hooks/session-end.js                                       │
│  ┌──────────────┐                                           │
│  │Parse transcript│→ tool calls, file edits, test runs,     │
│  │(JSONL)        │  duration, rejected calls                │
│  └──────┬───────┘                                           │
│         ↓                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Update lifetime    │ 6. Weekly summary check      │   │
│  │ 2. Update streak      │ 7. Save lastSession          │   │
│  │ 3. Grow stats (DR)    │ 8. Backup + save soul        │   │
│  │ 4. Update familiarity │ 9. Append journal             │   │
│  │ 5. Check achievements │ 10. Desktop notification      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Progression

### XP Sources

| Source | XP | Notes |
|---|---|---|
| Session completion | 200 | Flat bonus per session |
| Tool call | 5 | Every Read, Write, Edit, Bash, Grep, Glob |
| File edit | 15 | Write or Edit tool |
| Test run | 30 | Detected from Bash commands (jest, pytest, cargo test, etc.) |
| Duration | 20/10min | Capped at 300 (2.5 hours) |
| **Streak multiplier** | **1.0x → 2.0x** | +0.1x per consecutive day, caps at day 11 |

### Levels & Tiers

```
Level  1 ─────── Hatchling
Level  5 ─────── Juvenile    ← First evolution choice
Level 10 ─────── Adult       ← Second evolution choice (4 final forms)
Level 15 ─────── Elder
Level 20 ─────── Ascended
```

~17 sessions to Level 5. ~114 sessions to Level 10.

### Stats

| Stat | Grows from | What it means |
|---|---|---|
| DEBUGGING | File edits + test runs | Code iteration intensity |
| PATIENCE | Session duration | Long session endurance |
| CHAOS | Rejected tool call ratio | Unpredictable sessions |
| WISDOM | Output volume | Deep thinking sessions |
| SNARK | Tool density (tools/min) | Intense, fast-paced work |

All stats use **diminishing returns**: `growth × (100 / (100 + currentGrowth))`. Fast early growth, asymptotic cap at 200.

### Evolution

Each of the 18 species has unique paths. Example (Dragon):

```
              🐉 Dragon
               /     \
         Elder         Storm
         /   \         /    \
   Ancient   Wyrm  Tempest  Inferno
```

Use `/buddy-evolution:evolve` at Level 5 and 10 to choose. Choices are permanent.

### Achievements

<details>
<summary>View all 34 achievements</summary>

**Coding** — First Steps (100), Getting Comfortable (200), Centurion (1K), Veteran (3K), Living Legend (10K), The Architect (500), Tool Master (400), Wordsmith (600)

**Testing** — First Test (100), Test Enthusiast (300), Test Marathon (1K), Test-Driven (800)

**Debugging** — Persistence (300), Against All Odds (800), Unbreakable (500), Context Survivor (400)

**Consistency** — Streak: Week (500), Month (2K), Quarter (5K), Year (20K), Early Bird ♻️ (100), Night Owl ♻️ (100), Marathon (600)

**Exploration** — Tourist (400), Globe Trotter (1.5K), Deep Roots (800), Homecoming (200), Old Friend (500)

**Meta** — Pet Day (50), First Evolution (1K), Final Form (3K), The Collector (2K), 🔒 Hidden ×2

</details>

## 18 Species

| Rarity | Species |
|---|---|
| Common | 🦆 Duck, 🦢 Goose, 👾 Blob, 🐌 Snail |
| Uncommon | 🐱 Cat, 🐰 Rabbit, 🦉 Owl, 🐧 Penguin |
| Rare | 🐢 Turtle, 🐙 Octopus, 🦎 Axolotl |
| Epic | 👻 Ghost, 🤖 Robot, 🐉 Dragon |
| Legendary | 🐾 Capybara, 🍄 Mushroom, 🌵 Cactus, 🐻 Chonk |

Species is randomly assigned at creation. Use `/buddy-evolution:customize` to change anytime.

## 12 Personalities

| Type | Communication style |
|---|---|
| analytical | Precise, data-driven, references metrics |
| bold | Confident, direct, pushes forward |
| curious | Asks follow-ups, explores tangents |
| enthusiastic | High energy, celebrates wins |
| gentle | Warm, supportive, no pressure |
| mischievous | Teasing, surprises, unpredictable |
| playful | Light humor, wordplay |
| protective | Watches out, reminds about breaks |
| sarcastic | Dry wit, friendly teasing |
| stoic | Minimal, focused, essential only |
| dreamy | Philosophical, big picture |
| methodical | Organized, step-by-step |

## Data

```
~/.buddy-evolution/
├── soul.json                # All companion state
├── backups/                 # Last 3 auto-backups of soul.json
└── journal/
    └── YYYY-MM.md           # Monthly session logs + weekly summaries
```

Nothing is sent externally. All data stays on your machine. Soul backups are created automatically before each save.

## Development

```bash
# Run tests (72 tests, 0 dependencies)
node test.js

# File structure
lib/
├── constants.js     # Species, XP rates, thresholds, evolution paths
├── soul.js          # Soul CRUD + backup + creation
├── transcript.js    # JSONL transcript parser
├── xp.js            # XP calculation, streaks, stat growth, leveling
├── achievements.js  # 34 achievement definitions + detection
├── journal.js       # Journal entries + weekly summaries
├── personality.js   # 12 personalities, 7 moods, companion context
├── dashboard.js     # HTML dashboard generator
└── notify.js        # OS-native desktop notifications
```

## Background

On April 1, 2026, Anthropic released `/buddy` — a Tamagotchi-style ASCII companion for Claude Code. The community loved it and designed progression systems. Anthropic confirmed it was April Fools only.

This plugin implements the community [buddy-evolution spec](https://github.com/Hegemon78/buddy-evolution-spec).

## Contributing

Issues and PRs welcome.

## License

MIT
