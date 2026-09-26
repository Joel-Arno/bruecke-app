import * as THREE from 'three';
import { boxGeometry, geo, voxMesh } from './voxel.js';
import * as M from './models.js';

export const COLS = 4; // spielbare Spalten: -4 … 4
export const SPAN = 36; // Länge der Fahrbahn-Schleife (Fahrzeuge fahren im Kreis)
const HALF = SPAN / 2;
export const Y = { ground: 0, log: 0.08, pad: -0.225, water: -0.3 };

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const difficulty = (row) => clamp(row / 250, 0, 1);
const wrap = (x) => ((((x + HALF) % SPAN) + SPAN) % SPAN) - HALF;
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

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

const CAR_COLORS = ['#e53935', '#1e88e5', '#fdd835', '#8e24aa', '#43a047', '#fb8c00', '#00acc1', '#f06292'];
const CARGO_COLORS = ['#eceff1', '#ffe082', '#cfd8dc', '#ffccbc', '#c5e1a5'];
const TRAIN_COLORS = ['#c62828', '#1565c0', '#2e7d32', '#6a1b9a'];
const LIGHT_GEO = new THREE.BoxGeometry(0.12, 0.12, 0.03);

// Boden einer Reihe: spielbare Mitte hell, Ränder dunkler.
function groundBoxes(boxes, center, side, top = 0, h = 0.7) {
  boxes.push(M.b(0, top - h / 2, 0, 9, h, 1, center));
  boxes.push(M.b(-12.25, top - h / 2, 0, 15.5, h, 1, side));
  boxes.push(M.b(12.25, top - h / 2, 0, 15.5, h, 1, side));
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.rows = new Map();
    this.onEvent = () => {};
  }

  reset(seed) {
    for (const row of this.rows.values()) this.disposeRow(row);
    this.rows.clear();
    this.seed = seed >>> 0;
    this.rng = mulberry32(this.seed);
    this.next = -14;
    this.chunk = null;
    this.lastChunk = 'grass';
    this.sinceGrass = 0;
    this.prevType = 'grass';
    this.pathCol = 0;
    this.afterLogs = false;
    this.nextPower = 18 + Math.floor(this.rng() * 12);
    this.time = 0;
  }

  row(i) {
    return this.rows.get(i);
  }

  ensure(min, max) {
    while (this.next <= max) this.addRow(this.next++);
    for (const [i, row] of this.rows) {
      if (i < min) {
        this.disposeRow(row);
        this.rows.delete(i);
      }
    }
  }

  disposeRow(row) {
    this.scene.remove(row.group);
    for (const g of row.disposables) g.dispose();
    for (const m of row.materials) m.dispose();
  }

  // ------------------------------------------------------------ Generierung

  pickChunk(i) {
    const r = this.rng;
    const d = difficulty(i);
    const w = {
      grass: 3.4,
      road: 2.6 + 1.6 * d,
      river: 1.8 + 0.6 * d,
      rail: 0.7,
      spikes: i > 35 ? 0.8 + 0.8 * d : 0,
    };
    w[this.lastChunk] = 0;
    // Spätestens nach zwei Hindernis-Abschnitten gibt es eine Wiese zum Durchatmen.
    if (this.sinceGrass >= 2) for (const k of Object.keys(w)) if (k !== 'grass') w[k] = 0;
    const total = Object.values(w).reduce((a, v) => a + v, 0);
    let roll = r() * total;
    let type = 'grass';
    for (const [k, v] of Object.entries(w)) {
      roll -= v;
      if (roll <= 0 && v > 0) {
        type = k;
        break;
      }
    }
    let count = 1;
    const chunk = { type };
    if (type === 'grass') count = 1 + (r() < 0.4 ? 1 : 0) + (r() < 0.1 ? 1 : 0);
    else if (type === 'road') count = Math.min(5, 1 + Math.floor(r() * (2.2 + 2.5 * d)));
    else if (type === 'rail') count = r() < 0.3 ? 2 : 1;
    else if (type === 'spikes') count = 1 + (r() < 0.25 + 0.35 * d ? 1 : 0);
    else if (type === 'river') {
      chunk.kind = r() < 0.35 ? 'pads' : 'logs';
      chunk.dir = r() < 0.5 ? 1 : -1;
      count = chunk.kind === 'pads' ? 1 + (r() < 0.4 ? 1 : 0) : 1 + Math.floor(r() * (2 + d));
    }
    chunk.left = count;
    this.lastChunk = type;
    this.sinceGrass = type === 'grass' ? 0 : this.sinceGrass + 1;
    return chunk;
  }

  addRow(i) {
    const row = {
      i,
      type: 'grass',
      group: new THREE.Group(),
      movers: [],
      items: new Map(),
      blocked: new Set(),
      disposables: [],
      materials: [],
      dir: 0,
      speed: 0,
    };
    row.group.position.z = -i;
    if (i >= 5) {
      if (!this.chunk || this.chunk.left <= 0) this.chunk = this.pickChunk(i);
      this.chunk.left--;
      row.type = this.chunk.type;
    }
    const ground = [];
    const props = [];
    if (row.type === 'grass') this.buildGrass(row, ground, props);
    else if (row.type === 'road') this.buildRoad(row, ground);
    else if (row.type === 'river') this.buildRiver(row, ground);
    else if (row.type === 'rail') this.buildRail(row, ground, props);
    else if (row.type === 'spikes') this.buildSpikes(row, ground);
    this.addStatic(row, ground, false);
    this.addStatic(row, props, true);
    this.prevType = row.type;
    this.scene.add(row.group);
    this.rows.set(i, row);
  }

  addStatic(row, boxes, cast) {
    if (!boxes.length) return;
    const g = boxGeometry(boxes);
    row.disposables.push(g);
    row.group.add(voxMesh(g, { cast, receive: true }));
  }

  freeCells(row) {
    const cells = [];
    for (let c = -COLS; c <= COLS; c++) if (!row.blocked.has(c) && !row.items.has(c)) cells.push(c);
    return cells;
  }

  addItem(row, c, type) {
    if (row.items.has(c) || row.blocked.has(c)) return;
    const mesh = M.itemMesh(type);
    mesh.position.set(c, 0.35, 0);
    row.group.add(mesh);
    row.items.set(c, { c, type, mesh, phase: this.rng() * 6, flying: false });
  }

  maybeFish(row, chance) {
    const r = this.rng;
    if (row.i < 3 || r() >= chance) return;
    const cells = this.freeCells(row);
    if (cells.length) this.addItem(row, pick(r, cells), r() < 0.08 ? 'goldfish' : 'fish');
  }

  obstacle(props, c, r) {
    const v = r();
    // Im Spielfeld niedrige Bäume, damit sie die Figur nicht verdecken; am Rand dürfen sie hoch sein.
    const heights = Math.abs(c) <= COLS ? [0.35, 0.5, 0.65] : [0.5, 0.8, 1.1, 1.4];
    if (v < 0.72) props.push(...M.treeBoxes(c, 0, pick(r, heights), pick(r, M.LEAF)));
    else if (v < 0.9) props.push(...M.rockBoxes(c, 0));
    else props.push(...M.stumpBoxes(c, 0));
  }

  buildGrass(row, ground, props) {
    const r = this.rng;
    const i = row.i;
    const even = (i & 1) === 0;
    groundBoxes(ground, even ? '#a2dc5a' : '#98d352', even ? '#86c24a' : '#7fba44');

    // Ein garantiert freier Pfad schlängelt sich durch alle Wiesen.
    const free = new Set();
    let density;
    if (i < -3) density = 1;
    else if (i < 0) density = 0.4;
    else {
      const prev = this.pathCol;
      const next = i === 0 ? 0 : clamp(prev + Math.round((r() - 0.5) * 4), -3, 3);
      for (let c = Math.min(prev, next); c <= Math.max(prev, next); c++) free.add(c);
      this.pathCol = next;
      density = i < 4 ? 0.12 : this.afterLogs ? 0.08 : 0.2 + 0.14 * difficulty(i);
      if (i === 0) [-1, 0, 1].forEach((c) => free.add(c));
    }
    this.afterLogs = false;

    for (let c = -12; c <= 12; c++) {
      if (Math.abs(c) <= COLS) {
        if (!free.has(c) && r() < density) {
          row.blocked.add(c);
          this.obstacle(props, c, r);
        } else if (r() < 0.2) props.push(...M.decorBoxes(c, 0, r));
      } else if (r() < 0.55) this.obstacle(props, c, r);
      else if (r() < 0.3) props.push(...M.decorBoxes(c, 0, r));
    }

    if (i > 2 && i >= this.nextPower) {
      const cells = this.freeCells(row);
      if (cells.length) {
        this.addItem(row, pick(r, cells), pick(r, Object.keys(M.POWERS)));
        this.nextPower = i + 28 + Math.floor(r() * 24);
      }
    }
    this.maybeFish(row, 0.3);
  }

  placeMovers(row, lens, makeMesh) {
    const r = this.rng;
    const total = lens.reduce((a, l) => a + l, 0);
    const free = SPAN - total;
    const weights = lens.map(() => 0.6 + r());
    const wsum = weights.reduce((a, w) => a + w, 0);
    let x = -HALF + r() * SPAN;
    lens.forEach((len, k) => {
      const mesh = makeMesh(len);
      const cx = wrap(x + len / 2);
      mesh.position.x = cx;
      row.group.add(mesh);
      row.movers.push({ x: cx, len, mesh });
      x += len + (free * weights[k]) / wsum;
    });
  }

  buildRoad(row, ground) {
    const r = this.rng;
    const d = difficulty(row.i);
    groundBoxes(ground, '#5a6069', '#4b5058');
    if (this.prevType === 'road') {
      for (let x = -19; x < 20; x += 1.6) ground.push(M.b(x, 0.006, 0.5, 0.7, 0.012, 0.09, '#e6e6e6'));
    }
    row.dir = r() < 0.5 ? 1 : -1;
    const truck = r() < 0.3;
    row.speed = (truck ? 1.4 + r() * 1.2 : 1.8 + r() * 1.8) * (1 + 0.8 * d);
    const n = truck ? 2 + Math.floor(r() * (1.5 + 1.5 * d)) : 3 + Math.floor(r() * (1.5 + 2 * d));
    const len = truck ? M.TRUCK_LEN : M.CAR_LEN;
    this.placeMovers(row, Array(n).fill(len), () => {
      const color = pick(r, CAR_COLORS);
      let g;
      if (truck) {
        const cargo = pick(r, CARGO_COLORS);
        g = geo(`truck${color}${cargo}`, () => M.truckBoxes(color, cargo));
      } else g = geo('car' + color, () => M.carBoxes(color));
      const mesh = voxMesh(g, { cast: true });
      if (row.dir < 0) mesh.rotation.y = Math.PI;
      return mesh;
    });
    for (const m of row.movers) m.kind = truck ? 'truck' : 'car';
    this.maybeFish(row, 0.2);
  }

  buildRiver(row, ground) {
    const r = this.rng;
    const d = difficulty(row.i);
    row.kind = this.chunk.kind;
    groundBoxes(ground, '#5cc6f2', '#4bb3df', Y.water, 0.4);
    for (let k = 0; k < 7; k++) {
      ground.push(M.b(-10 + r() * 20, Y.water + 0.004, -0.35 + r() * 0.7, 0.3 + r() * 0.5, 0.008, 0.05, '#9be2fb'));
    }
    if (row.kind === 'logs') {
      row.dir = this.chunk.dir;
      this.chunk.dir *= -1;
      row.speed = (0.9 + r() * 1.1) * (1 + 0.5 * d);
      const n = 5 + (r() < 0.5 ? 1 : 0) - Math.round(d * 1.5);
      const lens = Array.from({ length: n }, () => 2 + Math.floor(r() * (d > 0.5 ? 2 : 3)));
      this.placeMovers(row, lens, (len) => voxMesh(geo('log' + len, () => M.logBoxes(len)), { cast: true, receive: true }));
      this.afterLogs = true;
    } else {
      // Seerosen: eine liegt immer auf dem freien Pfad, manche sind morsch und sinken.
      row.pads = new Map();
      for (let c = -COLS; c <= COLS; c++) {
        const must = c === this.pathCol;
        if (!must && r() >= 0.42) continue;
        const wobbly = !must && r() < 0.35;
        const mesh = voxMesh(geo(wobbly ? 'padW' : 'pad', () => M.padBoxes(wobbly)), { cast: false, receive: true });
        mesh.position.x = c;
        row.group.add(mesh);
        row.pads.set(c, { c, mesh, wobbly, state: 'ok', t: 0, sunk: false });
      }
      for (let c = -10; c <= 10; c++) {
        if (Math.abs(c) > COLS && r() < 0.25) ground.push(...M.shift(M.padBoxes(false), c, 0, 0));
      }
    }
  }

  buildRail(row, ground, props) {
    const r = this.rng;
    const d = difficulty(row.i);
    groundBoxes(ground, '#a1938a', '#8b7e76');
    for (let x = -19.5; x < 20; x += 0.65) ground.push(M.b(x, 0.03, 0, 0.22, 0.06, 0.86, '#6f4e37'));
    ground.push(M.b(0, 0.1, -0.25, 40, 0.08, 0.07, '#b7c0c8'), M.b(0, 0.1, 0.25, 40, 0.08, 0.07, '#b7c0c8'));
    // Signalmast mit zwei Warnlichtern
    const sx = -4.85;
    props.push(M.b(sx, 0.62, 0.4, 0.1, 1.24, 0.1, '#607d8b'), M.b(sx, 1.3, 0.4, 0.42, 0.22, 0.12, '#263238'));
    const lights = [-0.1, 0.1].map((dx) => {
      const mat = new THREE.MeshLambertMaterial({ color: '#4a1010', emissive: '#000000' });
      const m = new THREE.Mesh(LIGHT_GEO, mat);
      m.position.set(sx + dx, 1.3, 0.47);
      row.group.add(m);
      row.materials.push(mat);
      return m;
    });
    const dir = r() < 0.5 ? 1 : -1;
    const wagons = 2 + Math.floor(r() * 3);
    const color = pick(r, TRAIN_COLORS);
    const mesh = voxMesh(geo(`train${color}${wagons}`, () => M.trainBoxes(color, wagons)), { cast: true });
    if (dir < 0) mesh.rotation.y = Math.PI;
    mesh.visible = false;
    row.group.add(mesh);
    // Eigener Zufall pro Gleis, damit die Tages-Challenge für alle gleich läuft.
    const rr = mulberry32((this.seed ^ Math.imul(row.i + 7919, 2654435761)) >>> 0);
    row.train = { state: 'idle', timer: 1 + rr() * 4, rng: rr, dir, speed: 24 + 8 * d, len: M.trainLength(wagons), x: 0, mesh, lights, bellT: 0 };
    this.maybeFish(row, 0.2);
  }

  buildSpikes(row, ground) {
    const r = this.rng;
    const d = difficulty(row.i);
    groundBoxes(ground, '#9a8f82', '#80766b');
    row.period = 2.6 - 0.5 * d;
    const pattern = r();
    const waveDir = r() < 0.5 ? 1 : -1;
    row.spikes = [];
    for (let c = -COLS; c <= COLS; c++) {
      ground.push(M.b(c, 0.004, 0, 0.84, 0.01, 0.84, '#5d534a'));
      let phase;
      if (pattern < 0.45) phase = (waveDir * c + COLS) * 0.11 * row.period;
      else if (pattern < 0.75) phase = (((c % 2) + 2) % 2) * 0.5 * row.period;
      else phase = r() * row.period;
      const mesh = voxMesh(geo('spikes', M.spikeBoxes), { cast: true });
      mesh.position.set(c, -0.45, 0);
      row.group.add(mesh);
      row.spikes.push({ c, mesh, phase, danger: false });
    }
    this.maybeFish(row, 0.3);
  }

  // ------------------------------------------------------------ Laufzeit

  findLog(row, x, ahead = 0) {
    let best = null;
    for (const m of row.movers) {
      const mx = m.x + row.dir * row.speed * ahead;
      const dist = Math.abs(x - mx);
      if (dist <= m.len / 2 + 0.2 && (!best || dist < best.dist)) best = { log: m, x: mx, dist };
    }
    return best;
  }

  update(wdt, rdt, playerPad) {
    this.time += wdt;
    const T = this.time;
    for (const row of this.rows.values()) {
      for (const m of row.movers) {
        m.x = wrap(m.x + row.dir * row.speed * wdt);
        m.mesh.position.x = m.x;
      }
      if (row.train) this.updateTrain(row, wdt);
      if (row.spikes) {
        for (const s of row.spikes) {
          const u = (((T + s.phase) / row.period) % 1 + 1) % 1;
          const target = u < 0.55 ? -0.45 : u < 0.7 ? -0.3 : 0;
          const k = 1 - Math.exp(-wdt * (target === 0 ? 35 : 12));
          s.mesh.position.y += (target - s.mesh.position.y) * k;
          s.danger = u >= 0.72;
        }
      }
      if (row.pads) for (const p of row.pads.values()) if (p.wobbly) this.updatePad(row, p, wdt, playerPad);
      for (const it of row.items.values()) {
        if (it.flying) continue;
        it.mesh.rotation.y += rdt * 2.2;
        it.mesh.position.y = 0.35 + Math.sin(T * 3 + it.phase) * 0.06;
      }
    }
  }

  updateTrain(row, wdt) {
    const t = row.train;
    t.timer -= wdt;
    const setLights = (on) => {
      t.lights.forEach((l, k) => l.material.emissive.set(on && (k === 0) === (Math.floor(this.time * 6) % 2 === 0) ? '#ff2a2a' : '#000000'));
    };
    if (t.state === 'idle') {
      if (t.timer <= 0) {
        t.state = 'warn';
        t.timer = 1.3;
        t.bellT = 0;
      }
    } else if (t.state === 'warn') {
      setLights(true);
      t.bellT -= wdt;
      if (t.bellT <= 0) {
        this.onEvent('bell', row);
        t.bellT = 0.33;
      }
      if (t.timer <= 0) {
        t.state = 'pass';
        t.x = -t.dir * (HALF + t.len / 2);
        t.mesh.position.x = t.x;
        t.mesh.visible = true;
        this.onEvent('horn', row);
      }
    } else if (t.state === 'pass') {
      setLights(true);
      t.x += t.dir * t.speed * wdt;
      t.mesh.position.x = t.x;
      if (t.dir > 0 ? t.x - t.len / 2 > HALF : t.x + t.len / 2 < -HALF) {
        t.state = 'idle';
        t.timer = 2 + t.rng() * 5;
        t.mesh.visible = false;
        setLights(false);
      }
    }
  }

  updatePad(row, p, wdt, playerPad) {
    let targetY = 0;
    let wobble = 0;
    p.t += wdt;
    if (p.state === 'ok') {
      if (p !== playerPad) p.t = 0;
      else if (p.t > 0.3) {
        p.state = 'shake';
        p.t = 0;
      }
    } else if (p.state === 'shake') {
      wobble = Math.sin(p.t * 55) * 0.04;
      targetY = -0.02;
      if (p.t > 0.9) {
        p.state = 'sunk';
        p.t = 0;
        this.onEvent('sink', row);
      }
    } else if (p.state === 'sunk') {
      targetY = -0.35;
      if (p.t > 2.2) {
        p.state = 'rise';
        p.t = 0;
      }
    } else if (p.state === 'rise') {
      if (p.mesh.position.y > -0.02) {
        p.state = 'ok';
        p.t = 0;
      }
    }
    p.sunk = p.state === 'sunk' || p.state === 'rise';
    p.mesh.position.y += (targetY - p.mesh.position.y) * (1 - Math.exp(-wdt * 8));
    p.mesh.position.x = p.c + wobble;
  }
}
