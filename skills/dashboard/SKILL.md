---
name: dashboard
description: Open an interactive HTML dashboard showing all buddy stats, achievements, evolution tree, top files, and session journal. Use when the user wants to see their buddy visually, open dashboard, view progress, or wants a visual overview.
---

# Buddy Dashboard

Generate and open an interactive HTML dashboard with full buddy stats visualization.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. If it doesn't exist, tell the user to start a new session first
3. Find the plugin installation by running:
```bash
PLUGIN_DIR=$(find ~/.claude/plugins -path "*/buddy-evolution*/lib/dashboard.js" -printf "%h/..\n" 2>/dev/null | head -1) && node -e "const s=JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.buddy-evolution/soul.json','utf8')); const d=require('$PLUGIN_DIR/lib/dashboard'); console.log(d.saveDashboard(s));"
```
4. If that fails, generate the dashboard manually: read soul.json, and create an HTML file at `~/.buddy-evolution/dashboard.html` with the buddy stats formatted as a dark-themed web page.
5. Tell the user the path and suggest opening:
   - Linux: `xdg-open ~/.buddy-evolution/dashboard.html`
   - macOS: `open ~/.buddy-evolution/dashboard.html`

## What the dashboard shows

- Hero card with species emoji, rarity, personality, level, tier
- XP progress bar with current/next level
- Streak counter with multiplier and record
- Session count and total hours
- All 5 stats with growth bars (peak stat highlighted)
- Evolution tree showing chosen/available paths
- Full 34-achievement grid — earned, in-progress, locked, hidden (rarity-colored)
- Top 10 most-edited files with familiarity level
- Per-project XP breakdown
- Recent journal entries
