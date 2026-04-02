'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { DATA_DIR, SPECIES, RARITY_ORDER, LEVEL_THRESHOLDS, STAT_NAMES, EVOLUTION_PATHS } = require('./constants');
const { getEffectiveStat, formatProgressBar, getXPForNextLevel, getStreakMultiplier } = require('./xp');
const { ACHIEVEMENTS } = require('./achievements');

function generateDashboard(soul) {
  const species = SPECIES.find(s => s.id === soul.identity.species) || SPECIES[0];
  const nextXP = getXPForNextLevel(soul.progression.level);
  const currentLevelXP = LEVEL_THRESHOLDS[soul.progression.level - 1] || 0;
  const xpInLevel = soul.progression.totalXP - currentLevelXP;
  const xpNeeded = (nextXP || soul.progression.totalXP) - currentLevelXP;
  const xpPercent = xpNeeded > 0 ? Math.round((xpInLevel / xpNeeded) * 100) : 100;
  const streakMult = getStreakMultiplier(soul.streak.currentDays);

  const earnedIds = new Set(soul.achievements.earned.map(a => a.id));

  // Stats
  const stats = STAT_NAMES.map(s => ({
    name: s.toUpperCase(),
    base: soul.stats.base[s],
    growth: Math.round(soul.stats.growth[s]),
    effective: getEffectiveStat(soul.stats.base[s], soul.stats.growth[s]),
  }));
  const peakStat = stats.reduce((a, b) => a.effective > b.effective ? a : b);

  // Top files
  const allFiles = [];
  for (const [proj, data] of Object.entries(soul.familiarity || {})) {
    for (const [file, info] of Object.entries(data.files || {})) {
      allFiles.push({ file: path.basename(file), dir: path.basename(path.dirname(file)), touches: info.touches, last: info.last });
    }
  }
  allFiles.sort((a, b) => b.touches - a.touches);
  const topFiles = allFiles.slice(0, 10);

  // Projects
  const projects = Object.entries(soul.familiarity || {})
    .map(([dir, data]) => ({ name: path.basename(dir), sessions: data.sessions, xp: data.xpEarned || 0 }))
    .sort((a, b) => b.xp - a.xp);

  // Achievements
  const achData = ACHIEVEMENTS.map(a => {
    const earned = earnedIds.has(a.id);
    const progress = soul.achievements.progress[a.id];
    return {
      id: a.id, name: a.name, description: a.description,
      category: a.category, rarity: a.rarity,
      xp: a.xp, earned, hidden: a.hidden,
      progress: progress ? Math.round((progress.current / progress.target) * 100) : null,
      progressText: progress ? `${progress.current}/${progress.target}` : null,
    };
  });

  // Evolution
  const evoPath = soul.progression.evolutionPath || [];
  const evoPaths = EVOLUTION_PATHS[soul.identity.species] || {};

  const tier = soul.progression.tier.charAt(0).toUpperCase() + soul.progression.tier.slice(1);

  // Journal entries (last 10)
  let journalEntries = [];
  try {
    const journalDir = path.join(DATA_DIR, 'journal');
    const files = fs.readdirSync(journalDir).sort().reverse();
    for (const f of files) {
      const content = fs.readFileSync(path.join(journalDir, f), 'utf-8');
      const entries = content.split(/(?=^## \d{4}-\d{2}-\d{2})/m).filter(e => e.startsWith('## '));
      journalEntries.push(...entries.reverse());
      if (journalEntries.length >= 10) break;
    }
    journalEntries = journalEntries.slice(0, 10);
  } catch {}

  const rarityColors = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f5a623' };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${soul.identity.name} — buddy-evolution dashboard</title>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#08080d;--surface:#0f0f16;--card:#16161f;--elevated:#1e1e2a;--border:#2a2a3a;
  --text:#e8e6e3;--muted:#8888a0;--dim:#555568;
  --accent:#f5a623;--teal:#06b6d4;
  --common:#9ca3af;--uncommon:#22c55e;--rare:#3b82f6;--epic:#a855f7;--legendary:#f5a623;
}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;padding:24px}
.container{max-width:1000px;margin:0 auto}
.grid{display:grid;gap:16px}
.grid-2{grid-template-columns:1fr 1fr}
.grid-3{grid-template-columns:1fr 1fr 1fr}
@media(max-width:768px){.grid-2,.grid-3{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px}
.card-title{font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:12px}
h1{font-size:2rem;font-weight:700;margin-bottom:4px}
h2{font-size:1.2rem;font-weight:600;margin-bottom:16px;color:var(--text)}
.hero{display:flex;align-items:center;gap:24px;margin-bottom:32px}
.hero-emoji{font-size:4rem}
.hero-info h1 span{color:var(--accent)}
.hero-meta{color:var(--muted);font-size:.9rem}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.badge-common{background:#9ca3af20;color:var(--common)}
.badge-uncommon{background:#22c55e20;color:var(--uncommon)}
.badge-rare{background:#3b82f620;color:var(--rare)}
.badge-epic{background:#a855f720;color:var(--epic)}
.badge-legendary{background:#f5a62320;color:var(--legendary)}
.xp-bar{height:24px;background:var(--elevated);border-radius:12px;overflow:hidden;margin:8px 0}
.xp-fill{height:100%;background:linear-gradient(90deg,var(--teal),var(--accent));border-radius:12px;transition:width .3s}
.xp-text{display:flex;justify-content:space-between;font-size:.85rem;color:var(--muted)}
.stat-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.stat-name{width:90px;font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.stat-bar{flex:1;height:8px;background:var(--elevated);border-radius:4px;overflow:hidden}
.stat-fill{height:100%;border-radius:4px}
.stat-value{width:60px;text-align:right;font-size:.85rem;font-weight:500}
.stat-growth{color:var(--teal);font-size:.75rem}
.ach-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.ach{padding:10px 12px;background:var(--surface);border-radius:8px;border-left:3px solid;font-size:.82rem;opacity:1}
.ach.locked{opacity:.4;border-left-style:dashed}
.ach.hidden{opacity:.3;border-left-style:dotted}
.ach-name{font-weight:600}
.ach-desc{color:var(--muted);font-size:.75rem}
.ach-xp{color:var(--accent);font-size:.7rem;margin-top:2px}
.ach-progress{font-size:.7rem;color:var(--teal);margin-top:2px}
.file-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:.85rem}
.file-row:last-child{border:none}
.file-touches{color:var(--accent);font-weight:500}
.project-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)}
.project-row:last-child{border:none}
.streak-display{font-size:2.5rem;font-weight:700;color:var(--accent)}
.streak-label{color:var(--muted);font-size:.85rem}
.journal-entry{padding:12px 0;border-bottom:1px solid var(--border);font-size:.85rem;color:var(--muted)}
.journal-entry:last-child{border:none}
.journal-entry strong{color:var(--text)}
.evolution-tree{text-align:center;padding:16px;font-family:monospace;font-size:.8rem;color:var(--muted);line-height:1.8}
.evolution-tree .active{color:var(--accent);font-weight:700}
.footer{text-align:center;padding:32px 0;color:var(--dim);font-size:.8rem}
.footer a{color:var(--accent);text-decoration:none}
</style>
</head>
<body>
<div class="container">

<div class="hero">
  <div class="hero-emoji">${species.emoji}</div>
  <div class="hero-info">
    <h1>${soul.identity.name} <span>the ${soul.identity.species}</span></h1>
    <div class="hero-meta">
      <span class="badge badge-${soul.identity.rarity}">${soul.identity.rarity}</span>
      ${soul.identity.personality} · Level ${soul.progression.level} ${tier}
      ${evoPath.length > 0 ? ' · ' + evoPath.join(' → ') : ''}
    </div>
  </div>
</div>

<div class="grid grid-3" style="margin-bottom:16px">
  <div class="card">
    <div class="card-title">Experience</div>
    <div class="xp-text"><span>Level ${soul.progression.level}</span><span>${soul.progression.totalXP.toLocaleString()} / ${(nextXP || soul.progression.totalXP).toLocaleString()} XP</span></div>
    <div class="xp-bar"><div class="xp-fill" style="width:${xpPercent}%"></div></div>
    <div class="xp-text"><span>${tier}</span><span>${xpPercent}%</span></div>
  </div>
  <div class="card" style="text-align:center">
    <div class="card-title">Streak</div>
    <div class="streak-display">${soul.streak.currentDays}</div>
    <div class="streak-label">consecutive days${streakMult > 1 ? ` · ${streakMult.toFixed(1)}x multiplier` : ''}</div>
    <div class="streak-label" style="margin-top:4px">Record: ${soul.streak.longestDays} days</div>
  </div>
  <div class="card" style="text-align:center">
    <div class="card-title">Sessions</div>
    <div class="streak-display">${soul.lifetime.sessions}</div>
    <div class="streak-label">${Math.round(soul.lifetime.durationMinutes / 60)} hours total</div>
    <div class="streak-label" style="margin-top:4px">${soul.lifetime.toolCalls.toLocaleString()} tool calls</div>
  </div>
</div>

<div class="grid grid-2" style="margin-bottom:16px">
  <div class="card">
    <div class="card-title">Stats</div>
    ${stats.map(s => `
    <div class="stat-row">
      <div class="stat-name">${s.name}</div>
      <div class="stat-bar"><div class="stat-fill" style="width:${Math.min(100, s.effective / 2)}%;background:${s.name === peakStat.name ? 'var(--accent)' : 'var(--teal)'}"></div></div>
      <div class="stat-value">${s.effective} <span class="stat-growth">+${s.growth}</span></div>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-title">Evolution</div>
    <div class="evolution-tree">
      <div class="${evoPath.length === 0 ? 'active' : ''}">[ ${soul.identity.name} ]</div>
      <div>Level 5 ──┬── ${evoPath.length >= 1 ? '<span class="active">' : ''}${evoPaths.A || 'Path A'}${evoPath.length >= 1 ? '</span>' : ''}</div>
      <div>          └── ${evoPath.length >= 1 && evoPath[0] === evoPaths.B ? '<span class="active">' : ''}${evoPaths.B || 'Path B'}${evoPath.length >= 1 && evoPath[0] === evoPaths.B ? '</span>' : ''}</div>
    </div>
  </div>
</div>

<div class="card" style="margin-bottom:16px">
  <div class="card-title">Achievements — ${soul.achievements.earned.length}/32</div>
  <div class="ach-grid">
    ${achData.map(a => {
      if (a.hidden && !a.earned) return `<div class="ach hidden" style="border-color:${rarityColors[a.rarity]}"><div class="ach-name">🔒 ???</div><div class="ach-desc">Hidden achievement</div></div>`;
      const cls = a.earned ? '' : 'locked';
      return `<div class="ach ${cls}" style="border-color:${rarityColors[a.rarity]}">
        <div class="ach-name">${a.earned ? '✅' : '⬜'} ${a.name}</div>
        <div class="ach-desc">${a.description}</div>
        <div class="ach-xp">${a.xp.toLocaleString()} XP · <span class="badge badge-${a.rarity}">${a.rarity}</span></div>
        ${a.progress !== null && !a.earned ? `<div class="ach-progress">${a.progressText} (${a.progress}%)</div>` : ''}
      </div>`;
    }).join('\n    ')}
  </div>
</div>

<div class="grid grid-2" style="margin-bottom:16px">
  <div class="card">
    <div class="card-title">Top Files</div>
    ${topFiles.length > 0 ? topFiles.map(f => `
    <div class="file-row">
      <span>${f.dir}/${f.file}</span>
      <span class="file-touches">${f.touches} touches</span>
    </div>`).join('') : '<div style="color:var(--dim)">No file data yet</div>'}
  </div>
  <div class="card">
    <div class="card-title">Projects</div>
    ${projects.length > 0 ? projects.map(p => `
    <div class="project-row">
      <span>${p.name} <span style="color:var(--dim)">${p.sessions} sessions</span></span>
      <span style="color:var(--accent)">${p.xp.toLocaleString()} XP</span>
    </div>`).join('') : '<div style="color:var(--dim)">No project data yet</div>'}
  </div>
</div>

${journalEntries.length > 0 ? `
<div class="card" style="margin-bottom:16px">
  <div class="card-title">Recent Journal</div>
  ${journalEntries.map(e => `<div class="journal-entry">${e.replace(/^## /, '<strong>').replace(/\n/, '</strong><br>').replace(/\n/g, '<br>')}</div>`).join('')}
</div>` : ''}

<div class="footer">
  <a href="https://github.com/FrankFMY/buddy-evolution">buddy-evolution</a> · <a href="https://buddy.frankfmy.com">buddy.frankfmy.com</a>
  <br>Hatched ${soul.identity.hatchedAt.split('T')[0]} · Seed ${soul.identity.seed}
</div>

</div>
</body>
</html>`;
}

function saveDashboard(soul) {
  const html = generateDashboard(soul);
  const dashPath = path.join(DATA_DIR, 'dashboard.html');
  fs.writeFileSync(dashPath, html, 'utf-8');
  return dashPath;
}

module.exports = { generateDashboard, saveDashboard };
