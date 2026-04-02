---
name: customize
description: Customize your buddy — change species, personality, name, or stats. Use when the user wants to change their buddy's species, switch personality, reroll, customize, or create a custom build.
---

# Customize Buddy

Let the user fully customize their companion. All progression (XP, level, achievements) is preserved.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. Show current build:
   ```
   Current: {emoji} {name} — {rarity} {species} ({personality})
   Stats: DBG {n} | PAT {n} | CHS {n} | WIS {n} | SNK {n}
   ```
3. Ask what they want to change. Options:
   - **Species**: duck, goose, blob, snail, cat, rabbit, owl, penguin, turtle, octopus, axolotl, ghost, robot, dragon, capybara, mushroom, cactus, chonk
   - **Personality**: analytical, curious, playful, stoic, enthusiastic, sarcastic, gentle, bold, mischievous, protective, dreamy, methodical
   - **Name**: any string
   - **Stats**: 5 stats (DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK). Each 1-100. Must have one peak (70-100) and one dump (1-20).

4. When the user confirms, edit `~/.buddy-evolution/soul.json`:
   - Change `identity.species`, `identity.personality`, `identity.name` as requested
   - Update `identity.emoji` to match species:
     duck🦆 goose🪿 blob🫠 snail🐌 cat🐱 rabbit🐰 owl🦉 penguin🐧 turtle🐢 octopus🐙 axolotl🦎 ghost👻 robot🤖 dragon🐉 capybara🦫 mushroom🍄 cactus🌵 chonk🐻
   - Update `identity.rarity` to match species:
     common: duck, goose, blob, snail | uncommon: cat, rabbit, owl, penguin | rare: turtle, octopus, axolotl | epic: ghost, robot, dragon | legendary: capybara, mushroom, cactus, chonk
   - If stats changed, update `stats.base` (do NOT touch `stats.growth` — that's earned)
   - If species changed and `evolutionPath` is not empty, warn that evolution will reset
   - Do NOT change progression, achievements, lifetime, familiarity, streak

5. Confirm: "Customized! {emoji} {name} the {species} ({personality}) — takes effect next session."

## Personality descriptions

| Personality | Style |
|---|---|
| analytical | precise, data-driven, references metrics |
| curious | asks follow-ups, explores tangents |
| playful | light humor, wordplay, fun |
| stoic | minimal, focused, essential only |
| enthusiastic | high energy, encouraging, celebrates wins |
| sarcastic | dry wit, friendly teasing |
| gentle | warm, supportive, no pressure |
| bold | confident, direct, pushes forward |
| mischievous | teasing, surprises, unpredictable |
| protective | watches out, reminds about breaks |
| dreamy | philosophical, big picture |
| methodical | organized, step-by-step |

## Rules

- Preserve ALL progression data (XP, level, achievements, lifetime stats, familiarity)
- Only modify identity fields and optionally stats.base
- Warn before resetting evolutionPath on species change
