// Prüft alle Levels mit dem Löser: lösbar? Stimmt "par"? Reicht das Material?
// Aufruf: node tools/check-levels.mjs [level-id] [--show]
import { LEVELS } from '../js/levels.js';
import { parseLevel, solve } from '../js/puzzle.js';

const only = process.argv.find((a) => /^\d-\d$/.test(a));
const show = process.argv.includes('--show');
// --free: mit reichlich Material lösen, um den echten Bedarf zu sehen
const free = process.argv.includes('--free');
let bad = 0;
for (const def of LEVELS) {
  if (only && def.id !== only) continue;
  const level = parseLevel(free ? { ...def, stones: 12, planks: def.planks ? 4 : 0 } : def);
  const t0 = Date.now();
  const sol = solve(level, { maxPieces: 9, timeMs: 60000 });
  const ms = Date.now() - t0;
  const problems = [];
  if (!sol) problems.push('NICHT LÖSBAR');
  else {
    if (sol.par !== def.par) problems.push(`par ist ${sol.par}, eingetragen ${def.par}`);
    const s = sol.pieces.filter((p) => p.type === 'stone').length;
    const p = sol.pieces.filter((p) => p.type === 'plank').length;
    if (s > level.stones || p > level.planks) problems.push(`Material zu knapp (${s} Steine, ${p} Planken)`);
    if (free) problems.push(`braucht ${s} Steine, ${p} Planken (eingetragen ${def.stones || 0}/${def.planks || 0})`);
  }
  if (problems.length) bad++;
  console.log(`${def.id.padEnd(4)} ${def.name.padEnd(20)} par=${sol ? sol.par : '-'} tide=${sol ? sol.tide : '-'} ${ms}ms ${problems.join(', ')}`);
  if (show && sol) {
    const g = def.map.map((r) => r.split(''));
    for (const pc of sol.pieces) for (const [x, y] of pc.cells) g[y][x] = pc.type === 'stone' ? 'o' : pc.dir === 'h' ? '-' : '|';
    console.log(g.map((r) => '     ' + r.join('')).join('\n'));
  }
}
process.exit(bad ? 1 : 0);
