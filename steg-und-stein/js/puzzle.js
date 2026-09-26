// Reine Rätsel-Logik ohne Grafik: Karte lesen, begehbare Felder, Wegsuche, Löser, Tagesrätsel.
// Läuft im Browser und in Node (für die Level-Prüfung).
//
// Kartenzeichen:
//   .  Wasser (hier dürfen Steine und Planken hin)
//   #  Wiese
//   T  Baum (Wiese, aber nicht begehbar)
//   R  Fels im Wasser (nichts geht)
//   ~  Sandbank: nur bei Ebbe begehbar
//   =  Schwimmsteg: nur bei Flut begehbar
//   :  Strömung (Floß-Bahn, hier kann man nichts bauen)
//   a–d  Starthaus eines Tieres,  A–D  sein Zuhause

export const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export function parseLevel(def) {
  const H = def.map.length;
  const W = def.map[0].length;
  const tiles = [];
  const starts = {};
  const homes = {};
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      const ch = def.map[y][x] ?? '.';
      if (ch >= 'a' && ch <= 'd') {
        starts[ch] = [x, y];
        row.push('#');
      } else if (ch >= 'A' && ch <= 'D') {
        homes[ch.toLowerCase()] = [x, y];
        row.push('H');
      } else row.push(ch);
    }
    tiles.push(row);
  }
  const animals = Object.entries(def.animals).map(([key, id]) => ({ key, id, start: starts[key], home: homes[key] }));
  for (const a of animals) {
    if (!a.start || !a.home) throw new Error(`Level ${def.id}: Tier ${a.key} ohne Start oder Zuhause`);
  }
  const rafts = (def.rafts || []).map((r) => {
    const [x0, y0] = r.from;
    const [x1, y1] = r.to;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1;
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    const lane = Array.from({ length: n }, (_, i) => [x0 + dx * i, y0 + dy * i]);
    for (const [x, y] of lane) tiles[y][x] = ':';
    return { lane, offset: r.offset || 0 };
  });
  let period = 1;
  for (const r of rafts) {
    const p = Math.max(1, 2 * (r.lane.length - 1));
    period = (period * p) / gcd(period, p);
  }
  const hasTide = tiles.some((row) => row.some((t) => t === '~' || t === '='));
  return { ...def, W, H, tiles, animals, rafts, period, hasTide, stones: def.stones || 0, planks: def.planks || 0 };
}

export function raftPos(raft, t) {
  const n = raft.lane.length;
  if (n === 1) return raft.lane[0];
  const P = 2 * (n - 1);
  const k = (((t + raft.offset) % P) + P) % P;
  return raft.lane[k < n ? k : P - k];
}

export class Board {
  constructor(level) {
    this.level = level;
    this.pieces = [];
    this.grid = new Map();
    this.tide = 'high';
  }

  key(x, y) {
    return y * this.level.W + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.level.W && y < this.level.H;
  }

  tile(x, y) {
    return this.inBounds(x, y) ? this.level.tiles[y][x] : 'R';
  }

  pieceAt(x, y) {
    return this.grid.get(this.key(x, y)) || null;
  }

  staticWalkable(x, y) {
    if (!this.inBounds(x, y)) return false;
    if (this.grid.has(this.key(x, y))) return true;
    const t = this.level.tiles[y][x];
    if (t === '#' || t === 'H') return true;
    if (t === '~') return this.tide === 'low';
    if (t === '=') return this.tide === 'high';
    return false;
  }

  raftAt(x, y, t) {
    const rafts = this.level.rafts;
    for (let i = 0; i < rafts.length; i++) {
      const [rx, ry] = raftPos(rafts[i], t);
      if (rx === x && ry === y) return i;
    }
    return -1;
  }

  walkable(x, y, t) {
    return this.staticWalkable(x, y) || this.raftAt(x, y, t) >= 0;
  }

  canBuild(x, y) {
    return this.inBounds(x, y) && this.level.tiles[y][x] === '.' && !this.grid.has(this.key(x, y));
  }

  count(type) {
    return this.pieces.filter((p) => p.type === type).length;
  }

  left(type) {
    return (type === 'stone' ? this.level.stones : this.level.planks) - this.count(type);
  }

  // Liefert das Teil, das an (x, y) passen würde, ohne es zu legen.
  fit(type, x, y, dir = 'h') {
    if (type === 'stone') return this.canBuild(x, y) ? { type, cells: [[x, y]] } : null;
    const [dx, dy] = dir === 'h' ? [1, 0] : [0, 1];
    if (this.canBuild(x, y) && this.canBuild(x + dx, y + dy)) return { type, dir, cells: [[x, y], [x + dx, y + dy]] };
    if (this.canBuild(x, y) && this.canBuild(x - dx, y - dy)) return { type, dir, cells: [[x - dx, y - dy], [x, y]] };
    return null;
  }

  add(piece) {
    this.pieces.push(piece);
    for (const [x, y] of piece.cells) this.grid.set(this.key(x, y), piece);
    return piece;
  }

  remove(piece) {
    this.pieces = this.pieces.filter((p) => p !== piece);
    for (const [x, y] of piece.cells) this.grid.delete(this.key(x, y));
  }

  clear() {
    this.pieces = [];
    this.grid.clear();
  }

  signature() {
    return this.pieces
      .map((p) => p.cells.map((c) => c.join(',')).join('|'))
      .sort()
      .join(';') + this.tide;
  }
}

// Breitensuche über (Feld, Zeit): Tiere dürfen warten und auf Flößen mitfahren.
export function findPath(board, animal, t0 = 0, maxSteps = 90) {
  const { W, H, rafts } = board.level;
  const P = board.level.period;
  const [gx, gy] = animal.home;
  const seen = new Uint8Array(W * H * P);
  const mark = (x, y, t) => {
    const i = ((t % P) * H + y) * W + x;
    if (seen[i]) return false;
    seen[i] = 1;
    return true;
  };
  let frontier = [{ x: animal.start[0], y: animal.start[1], prev: null, raft: false }];
  mark(animal.start[0], animal.start[1], t0);
  for (let step = 0; step <= maxSteps; step++) {
    const t = t0 + step;
    const next = [];
    for (const node of frontier) {
      if (node.x === gx && node.y === gy) {
        const path = [];
        for (let n = node; n; n = n.prev) path.push({ x: n.x, y: n.y, raft: n.raft });
        return path.reverse();
      }
      const onRaft = !board.staticWalkable(node.x, node.y) ? board.raftAt(node.x, node.y, t) : -1;
      const push = (x, y, raft) => {
        if (mark(x, y, t + 1)) next.push({ x, y, prev: node, raft });
      };
      if (onRaft >= 0) {
        const [rx, ry] = raftPos(rafts[onRaft], t + 1);
        push(rx, ry, true);
      } else if (board.staticWalkable(node.x, node.y)) push(node.x, node.y, false);
      for (const [dx, dy] of DIRS) {
        const nx = node.x + dx;
        const ny = node.y + dy;
        if (!board.inBounds(nx, ny)) continue;
        if (board.staticWalkable(nx, ny)) push(nx, ny, false);
        else if (board.raftAt(nx, ny, t + 1) >= 0) push(nx, ny, true);
      }
    }
    if (!next.length) return null;
    frontier = next;
  }
  return null;
}

export function allPaths(board, t0 = 0) {
  const out = {};
  for (const a of board.level.animals) out[a.key] = findPath(board, a, t0);
  return out;
}

export function starsFor(level, used) {
  if (used <= level.par) return 3;
  if (used <= level.par + 1) return 2;
  return 1;
}

// ------------------------------------------------------------------ Löser

// Optimistische Reichweite: Strömungsfelder zählen als begehbar.
function optimisticRegion(board, from) {
  const { W } = board.level;
  const seen = new Set([from[1] * W + from[0]]);
  const queue = [from];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = ny * W + nx;
      if (seen.has(k) || !board.inBounds(nx, ny)) continue;
      if (board.staticWalkable(nx, ny) || board.tile(nx, ny) === ':') {
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}

// Untere Schranke: wie viele Wasserfelder muss ein Tier mindestens überbrücken?
function minCost(board, animal) {
  const { W, H } = board.level;
  const plankOk = board.left('plank') > 0;
  const stoneOk = board.left('stone') > 0;
  const waterCost = plankOk ? 0.5 : 1;
  if (!plankOk && !stoneOk) return findPath(board, animal) ? 0 : Infinity;
  const dist = new Float64Array(W * H).fill(Infinity);
  const [sx, sy] = animal.start;
  dist[sy * W + sx] = 0;
  const queue = [[sx, sy, 0]];
  while (queue.length) {
    queue.sort((a, b) => b[2] - a[2]);
    const [x, y, d] = queue.pop();
    if (d > dist[y * W + x]) continue;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!board.inBounds(nx, ny)) continue;
      let c;
      if (board.staticWalkable(nx, ny) || board.tile(nx, ny) === ':') c = 0;
      else if (board.canBuild(nx, ny)) c = waterCost;
      else continue;
      const nd = d + c;
      if (nd < dist[ny * W + nx]) {
        dist[ny * W + nx] = nd;
        queue.push([nx, ny, nd]);
      }
    }
  }
  return dist[animal.home[1] * W + animal.home[0]];
}

function solvedNow(board) {
  return board.level.animals.every((a) => findPath(board, a));
}

// Nur Teile neben dem Gebiet, das ein noch nicht angekommenes Tier schon erreicht:
// Jeder Weg dieses Tieres muss irgendwann genau dort das nächste Teil benutzen.
function candidates(board, animal) {
  const { W } = board.level;
  const region = optimisticRegion(board, animal.start);
  const adj = (x, y) => DIRS.some(([dx, dy]) => region.has((y + dy) * W + (x + dx)) && board.inBounds(x + dx, y + dy));
  const out = [];
  const seen = new Set();
  for (let y = 0; y < board.level.H; y++) {
    for (let x = 0; x < W; x++) {
      if (!board.canBuild(x, y)) continue;
      if (board.left('stone') > 0 && adj(x, y)) out.push({ type: 'stone', cells: [[x, y]] });
      if (board.left('plank') > 0) {
        for (const dir of ['h', 'v']) {
          const [dx, dy] = dir === 'h' ? [1, 0] : [0, 1];
          if (!board.canBuild(x + dx, y + dy)) continue;
          if (!adj(x, y) && !adj(x + dx, y + dy)) continue;
          const sig = `${x},${y},${dir}`;
          if (!seen.has(sig)) {
            seen.add(sig);
            out.push({ type: 'plank', dir, cells: [[x, y], [x + dx, y + dy]] });
          }
        }
      }
    }
  }
  return out;
}

function search(board, k, seen, deadline) {
  const open = board.level.animals.filter((a) => !findPath(board, a));
  if (!open.length) return board.pieces.map((p) => ({ ...p, cells: p.cells.map((c) => [...c]) }));
  if (k === 0 || Date.now() > deadline) return null;
  const sig = board.signature() + k;
  if (seen.has(sig)) return null;
  seen.add(sig);
  let focus = open[0];
  let worst = -1;
  for (const a of open) {
    const c = minCost(board, a);
    if (Math.ceil(c - 1e-9) > k) return null;
    if (c > worst) {
      worst = c;
      focus = a;
    }
  }
  for (const c of candidates(board, focus)) {
    board.add(c);
    const r = search(board, k - 1, seen, deadline);
    board.remove(c);
    if (r) return r;
  }
  return null;
}

// Kleinste Zahl an Teilen, mit der alle Tiere heimkommen.
export function solve(level, { maxPieces = 8, timeMs = 20000 } = {}) {
  const deadline = Date.now() + timeMs;
  const tides = level.hasTide ? ['high', 'low'] : ['high'];
  for (let k = 0; k <= maxPieces; k++) {
    for (const tide of tides) {
      const board = new Board(level);
      board.tide = tide;
      const pieces = search(board, k, new Set(), deadline);
      if (pieces) return { par: k, tide, pieces };
      if (Date.now() > deadline) return null;
    }
  }
  return null;
}

// Schnelle obere Schranke: Tier für Tier den billigsten Steinweg legen.
export function greedySolution(level) {
  let best = null;
  for (const tide of level.hasTide ? ['high', 'low'] : ['high']) {
    const board = new Board({ ...level, stones: 99, planks: 0 });
    board.tide = tide;
    let ok = true;
    for (const a of level.animals) {
      if (findPath(board, a)) continue;
      const cells = cheapestWaterCells(board, a);
      if (!cells) {
        ok = false;
        break;
      }
      for (const [x, y] of cells) board.add({ type: 'stone', cells: [[x, y]] });
      if (!findPath(board, a)) {
        ok = false;
        break;
      }
    }
    if (ok && (!best || board.pieces.length < best.par)) best = { par: board.pieces.length, tide, pieces: board.pieces };
  }
  return best;
}

function cheapestWaterCells(board, animal) {
  const { W, H } = board.level;
  const dist = new Float64Array(W * H).fill(Infinity);
  const prev = new Int32Array(W * H).fill(-1);
  const [sx, sy] = animal.start;
  dist[sy * W + sx] = 0;
  const queue = [[sx, sy, 0]];
  while (queue.length) {
    queue.sort((a, b) => b[2] - a[2]);
    const [x, y, d] = queue.pop();
    if (d > dist[y * W + x]) continue;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!board.inBounds(nx, ny)) continue;
      const c = board.staticWalkable(nx, ny) ? 0 : board.canBuild(nx, ny) ? 1 : Infinity;
      if (c === Infinity || d + c >= dist[ny * W + nx]) continue;
      dist[ny * W + nx] = d + c;
      prev[ny * W + nx] = y * W + x;
      queue.push([nx, ny, d + c]);
    }
  }
  const goal = animal.home[1] * W + animal.home[0];
  if (dist[goal] === Infinity) return null;
  const cells = [];
  for (let k = goal; k >= 0; k = prev[k]) {
    const x = k % W;
    const y = Math.floor(k / W);
    if (board.canBuild(x, y)) cells.push([x, y]);
  }
  return cells;
}

// ------------------------------------------------------------------ Tagesrätsel

function randomDef(rng, pool, day) {
  const W = 7;
  const H = 9;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const blob = (x, y, n, ch) => {
    for (let i = 0; i < n; i++) {
      if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = ch;
      if (rng() < 0.5) x += rng() < 0.5 ? -1 : 1;
      else y += rng() < 0.5 ? -1 : 1;
    }
  };
  const two = rng() < 0.45;
  // Startinsel unten, Zuhause oben (bei zwei Tieren gekreuzt)
  const starts = [[ri(0, 2), ri(7, 8)], [ri(4, 6), ri(7, 8)]];
  const homes = [[ri(4, 6), ri(0, 1)], [ri(0, 2), ri(0, 1)]];
  const keys = two ? ['a', 'b'] : ['a'];
  if (!two) {
    starts[0][0] = ri(0, 6);
    homes[0][0] = ri(0, 6);
  }
  keys.forEach((k, i) => {
    blob(starts[i][0], starts[i][1], ri(1, 3), '#');
    blob(homes[i][0], homes[i][1], ri(1, 3), '#');
  });
  for (let i = 0, n = ri(3, 6); i < n; i++) blob(ri(0, 6), ri(2, 6), ri(1, 3), '#');
  const tide = rng() < 0.35;
  if (tide) {
    blob(ri(0, 6), ri(2, 6), ri(2, 4), '~');
    if (rng() < 0.6) blob(ri(0, 6), ri(2, 6), ri(1, 2), '=');
  }
  for (let i = 0, n = ri(1, 4); i < n; i++) {
    const x = ri(0, 6);
    const y = ri(1, 7);
    if (g[y][x] === '.') g[y][x] = 'R';
    else if (g[y][x] === '#' && rng() < 0.5) g[y][x] = 'T';
  }
  keys.forEach((k, i) => {
    g[starts[i][1]][starts[i][0]] = k;
    g[homes[i][1]][homes[i][0]] = k.toUpperCase();
  });
  const animals = {};
  const shuffled = [...pool].sort(() => rng() - 0.5);
  keys.forEach((k, i) => (animals[k] = shuffled[i % shuffled.length]));
  return { id: 'tag-' + day, name: 'Tagesrätsel', map: g.map((r) => r.join('')), animals, stones: 9 };
}

export function dailyLevel(day, pool) {
  const rng = mulberry32(hashString('steg-und-stein:' + day));
  const stop = Date.now() + 2500;
  for (let attempt = 0; attempt < 60; attempt++) {
    const def = randomDef(rng, pool, day);
    let level;
    try {
      level = parseLevel(def);
    } catch {
      continue;
    }
    if (new Board(level).level.animals.every((a) => findPath(new Board(level), a))) continue;
    if (new Board({ ...level }).level.hasTide) {
      const low = new Board(level);
      low.tide = 'low';
      if (level.animals.every((a) => findPath(low, a))) continue;
    }
    const greedy = greedySolution(level);
    if (!greedy || greedy.par < 3 || greedy.par > 7) continue;
    // Genau lösen, wenn es schnell geht; sonst gilt die gierige Lösung als Maßstab.
    const exact = Date.now() < stop ? solve(level, { maxPieces: greedy.par - 1, timeMs: 400 }) : null;
    const sol = exact && exact.par < greedy.par ? exact : greedy;
    if (sol.par < 3) continue;
    def.par = sol.par;
    def.stones = sol.par + 2;
    return parseLevel(def);
  }
  return null;
}
