# buddy-evolution

Companion progression system for Claude Code. Your buddy lives in Claude's personality — shaping greetings, reactions, and communication style based on your coding activity.

Born from the community response to Anthropic's `/buddy` April Fools feature. The ASCII pet is gone, but the companion lives on — inside Claude itself.

## Features

- **Companion personality** — 12 personality types that shape how Claude communicates (analytical, playful, stoic, bold, etc.)
- **Mood system** — 7 moods based on streak, level, and recent achievements
- **34 achievements** across 6 categories — Coding, Testing, Debugging, Consistency, Exploration, Meta
- **XP & leveling** — 20 levels with streak multipliers up to 2x
- **Stat growth** — DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK evolve from your activity patterns
- **Evolution paths** — choose your buddy's evolution at Level 5 and 10 (18 species x 4 final forms)
- **Session journal** — automatic monthly logs with weekly summaries
- **Session recap** — Claude greets you with what happened last session
- **File familiarity** — track files across projects (New → Familiar → Expert → Nostalgic)
- **Per-project stats** — XP and sessions tracked per project
- **Desktop notifications** — OS-native alerts on achievement unlock (Linux/macOS)
- **Visual dashboard** — HTML stats page with charts, achievement grid, evolution tree
- **Zero dependencies** — pure Node.js, no npm install required
- **Fully local** — no data leaves your machine

## Install

Run these two commands inside Claude Code:

```
/plugin marketplace add FrankFMY/buddy-evolution
/plugin install buddy-evolution@buddy-evolution
```

Restart Claude Code. Your buddy will greet you on the next session start:

```
🐙 A wild octopus appeared! Meet Cinder!
   Rarity: rare | Personality: analytical
   Your companion will track your progress across sessions.
```

After your first session ends, you'll see:

```
🐙 Session complete! +615 XP
   Level 2 ████████████░░░░░░░░ 1,615 / 3,000 XP
   🏆 First Steps — Complete your first session (+100 XP)
```

And on the next start:

```
🐙 Cinder welcomes you! Level 2 Hatchling ████████░░░░░░░ 1,615 / 3,000 XP
   Streak: 1 day | Sessions: 1
   Last session: +615 XP | 🏆 First Steps | Level 1 → 2
```

### Alternative: manual install

Clone the repo and add hooks to `~/.claude/settings.json` manually:

```bash
git clone https://github.com/FrankFMY/buddy-evolution ~/buddy-evolution
```

Add to your `~/.claude/settings.json` inside the `"hooks"` object:

```json
"SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/buddy-evolution/hooks/session-start.js", "timeout": 5 }] }],
"SessionEnd": [{ "hooks": [{ "type": "command", "command": "node ~/buddy-evolution/hooks/session-end.js", "timeout": 30 }] }]
```

## Commands

| Command | Description |
|---|---|
| `/buddy-evolution:stats` | Level, XP, stats, streak, top files, top projects |
| `/buddy-evolution:achievements` | Earned, in-progress, locked achievements |
| `/buddy-evolution:journal` | Recent session history + weekly summaries |
| `/buddy-evolution:evolve` | Choose evolution path (Level 5 / 10) |
| `/buddy-evolution:rename` | Rename your buddy |
| `/buddy-evolution:export` | Generate shareable stats card |
| `/buddy-evolution:dashboard` | Open visual HTML dashboard in browser |
| `/buddy-evolution:help` | How the plugin works |

## How It Works

```
Session Start ──→ Inject companion personality + greeting directive
       │                Claude greets with buddy stats, reflects personality
       │
   You code normally (buddy personality shapes Claude's style)
       │
Session End ────→ Parse transcript ──→ Extract metrics
                                           │
                    ┌──────────────────────┤
                    │                      │
              Update stats          Check achievements
              Calculate XP          Update familiarity
              Check level up        Desktop notifications
                    │                      │
                    └──────────┬───────────┘
                               │
                    Save soul + journal entry
                    Print summary + progress bar
```

### XP Sources

| Source | XP |
|---|---|
| Session completion | 200 (flat) |
| Tool call | 5 each |
| File edit | 15 each |
| Test run | 30 each |
| Duration | 20 per 10 min (capped at 300) |
| Streak multiplier | 1.0x → 2.0x over 11 consecutive days |

### Evolution

At Level 5 and 10, your buddy can evolve. Each of the 18 species has unique evolution paths — 2 choices at Level 5, then 2 sub-choices at Level 10, giving 4 possible final forms per species. Use `/buddy-evolution:evolve` to choose.

```
🐙 Cinder is ready to evolve!

  [A] Strategist — calculated, always three steps ahead
  [B] Artist — creative, sees patterns others miss
```

### Achievements

<details>
<summary>View all 34 achievements</summary>

#### Coding
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| First Steps | First session | 100 | Common |
| Getting Comfortable | 10 sessions | 200 | Common |
| Centurion | 100 sessions | 1,000 | Uncommon |
| Veteran | 500 sessions | 3,000 | Rare |
| Living Legend | 1,000 sessions | 10,000 | Legendary |
| The Architect | 20+ file edits/session | 500 | Rare |
| Tool Master | 100+ tool calls/session | 400 | Uncommon |
| Wordsmith | 100K+ output tokens/session | 600 | Rare |

#### Testing
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| First Test | Run tests | 100 | Common |
| Test Enthusiast | 10+ test runs | 300 | Uncommon |
| Test Marathon | 50+ test runs | 1,000 | Epic |
| Test-Driven | Tests in 10 consecutive sessions | 800 | Rare |

#### Debugging
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Persistence | 5+ rejected calls, still finish work | 300 | Uncommon |
| Against All Odds | 20+ rejected calls, still finish work | 800 | Epic |
| Unbreakable | 0 rejected in 50+ call session | 500 | Rare |
| Context Survivor | Productive work after context reset | 400 | Uncommon |

#### Consistency
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Streak: Week | 7 days | 500 | Common |
| Streak: Month | 30 days | 2,000 | Rare |
| Streak: Quarter | 90 days | 5,000 | Epic |
| Streak: Year | 365 days | 20,000 | Legendary |
| Early Bird ♻️ | Session before 7 AM | 100 | Common |
| Night Owl ♻️ | Session past midnight | 100 | Common |
| Marathon | 4+ hour session | 600 | Rare |

#### Exploration
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Tourist | 5 projects | 400 | Uncommon |
| Globe Trotter | 20 projects | 1,500 | Epic |
| Deep Roots | Expert on 5 files | 800 | Rare |
| Homecoming | Return after 30+ days | 200 | Common |
| Old Friend | Return to Expert file after 60+ days | 500 | Rare |

#### Meta
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Pet Day | Pet buddy 10 times | 50 | Common |
| First Evolution | Level 5 evolution choice | 1,000 | Uncommon |
| Final Form | Level 10 evolution choice | 3,000 | Rare |
| The Collector | 20 achievements | 2,000 | Epic |
| 🔒 Hidden | ??? | ??? | Legendary |
| 🔒 Hidden | ??? | ??? | Legendary |

</details>

## Data

All data is stored locally at `~/.buddy-evolution/`:

```
~/.buddy-evolution/
├── soul.json              # Companion state (identity, stats, achievements, progression)
└── journal/
    ├── 2026-04.md         # April sessions + weekly summaries
    └── 2026-05.md         # May sessions
```

Nothing is sent externally. Your data stays on your machine.

## Background

On April 1, 2026, Anthropic released `/buddy` — a Tamagotchi-style ASCII companion for Claude Code. The community loved it and immediately started designing progression systems. Anthropic confirmed it was April Fools only.

This plugin implements the community-designed [buddy evolution specification](https://github.com/Hegemon78/buddy-evolution-spec):
- Achievement-based progression (not idle grinding)
- Stats that reflect your coding patterns
- Session journal with weekly summaries
- File familiarity tracking
- Evolution branching paths

## Contributing

Issues and PRs welcome. The plugin is designed to be extensible:
- Add achievements in `lib/achievements.js`
- Add species or tune XP in `lib/constants.js`
- Add skills in `skills/`

## License

MIT
