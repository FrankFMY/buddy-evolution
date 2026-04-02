---
name: dashboard
description: Open an interactive HTML dashboard showing all buddy stats, achievements, evolution tree, top files, and session journal. Use when the user wants to see their buddy visually, open dashboard, view progress, or wants a visual overview.
---

# Buddy Dashboard

Generate and open an interactive HTML dashboard with full buddy stats visualization.

## Instructions

1. Run this command to generate the dashboard:
```bash
node -e "const s = require('/home/user/projects/buddy-evolution/lib/soul').loadSoul(); const d = require('/home/user/projects/buddy-evolution/lib/dashboard'); const p = d.saveDashboard(s); console.log(p);"
```

2. The command outputs the path to the generated HTML file (e.g., `/home/user/.buddy-evolution/dashboard.html`)
3. Tell the user the dashboard has been generated and show the path
4. If the user is on a machine with a browser, suggest opening it:
   - Linux: `xdg-open ~/.buddy-evolution/dashboard.html`
   - macOS: `open ~/.buddy-evolution/dashboard.html`

## What the dashboard shows

- Hero card with species, rarity, personality, level, tier
- XP progress bar with current/next level
- Streak counter with multiplier
- Session count and total hours
- All 5 stats with growth bars
- Evolution tree showing chosen/available paths
- Full achievement grid (34 achievements) — earned, in-progress, locked, hidden
- Top 10 most-edited files
- Per-project XP breakdown
- Recent journal entries
