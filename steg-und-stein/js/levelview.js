import * as THREE from 'three';
import { boxGeometry, geo, voxMesh } from './voxel.js';
import * as M from './models.js';
import { scene, water, BED, LAND_TOP, SAND_TOP, PIECE_TOP, burst, animate, ease, toScreen } from './scene.js';
import { raftPos, findPath, mulberry32, hashString } from './puzzle.js';

export const STEP = 0.5; // Sekunden pro Schritt (Tiere und Flöße)

const lerp = (a, b, t) => a + (b - a) * t;
const WINDOW_GEO = new THREE.BoxGeometry(0.14, 0.12, 0.01);
const STREAK_GEO = new THREE.BoxGeometry(0.22, 0.01, 0.04);
const STREAK_MAT = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 });

export const animalGeo = (id) => geo('animal:' + id, M.ANIMALS[id].build);

const BF_COLORS = ['#ffb3c6', '#fff2a8', '#c8b6ff', '#a8e6ff'];

// Schmetterling, der über (cx, cz) herumflattert. Nach "stay" Sekunden fliegt er davon.
export function createButterfly(parent, cx, cz, stay = 8) {
  const color = BF_COLORS[Math.floor(Math.random() * BF_COLORS.length)];
  const mesh = new THREE.Group();
  const wl = voxMesh(geo('bfl' + color, () => M.butterflyWing(color)), { cast: false });
  const wr = voxMesh(geo('bfl' + color, () => M.butterflyWing(color)), { cast: false });
  mesh.add(wl, wr, voxMesh(geo('bfbody', () => [M.b(0, 0, 0, 0.04, 0.04, 0.22, '#5a4a4a')]), { cast: false }));
  mesh.scale.setScalar(1.4);
  parent.add(mesh);
  const bf = { mesh, wl, wr, caught: false, gone: false, cx, cz, stay, ax: 0.8 + Math.random(), az: 0.6 + Math.random(), sp: 0.5 + Math.random() * 0.4, ph: Math.random() * 6, life: 0 };
  updateButterfly(bf, 0, 0);
  return bf;
}

export function updateButterfly(bf, dt, t) {
  if (bf.caught) return;
  bf.life += dt;
  const k = bf.life * bf.sp + bf.ph;
  const away = Math.max(0, bf.life - bf.stay);
  bf.mesh.position.set(bf.cx + Math.sin(k) * bf.ax, 0.9 + Math.sin(k * 2.3) * 0.25 + away * 1.2, bf.cz + Math.sin(k * 0.7) * bf.az - away * 0.8);
  bf.mesh.rotation.y = k;
  const flap = Math.sin(t * 20 + bf.ph) * 0.9;
  bf.wl.rotation.z = flap;
  bf.wr.rotation.z = Math.PI - flap;
  if (away > 4 && !bf.gone) {
    bf.gone = true;
    bf.mesh.removeFromParent();
  }
}

// Fängt einen Schmetterling nahe am Bildschirmpunkt; gibt seine Bildschirmposition zurück.
export function catchButterfly(list, sx, sy) {
  for (const bf of list) {
    if (bf.caught || bf.gone) continue;
    const p = toScreen(bf.mesh.position);
    if (Math.hypot(p.x - sx, p.y - sy) < 48) {
      bf.caught = true;
      burst(bf.mesh.position.clone(), ['#fff2a8', '#ffffff', '#ffb3c6'], 14, { speed: 1.4, up: 1.2, size: 0.05, gravity: 1 });
      animate(0.3, (k) => bf.mesh.scale.setScalar(1.4 * (1 - k)), () => bf.mesh.removeFromParent());
      return p;
    }
  }
  return null;
}

export class LevelView {
  constructor(level, board, hooks = {}) {
    this.level = level;
    this.board = board;
    this.hooks = hooks;
    this.group = new THREE.Group();
    this.ox = -(level.W - 1) / 2;
    this.oz = -(level.H - 1) / 2;
    this.pieceMeshes = new Map();
    this.disposables = [];
    this.clock = 0;
    this.walk = null;
    this.butterflies = [];
    this.bubbleLayer = document.getElementById('bubbles');
    this.build();
    scene.add(this.group);
  }

  wx(x) {
    return x + this.ox;
  }

  wz(y) {
    return y + this.oz;
  }

  bounds() {
    const { W, H } = this.level;
    return { minX: this.ox - 0.5, maxX: this.ox + W - 0.5, minZ: this.oz - 0.5, maxZ: this.oz + H - 0.5, minY: 0, maxY: 0.9 };
  }

  // ------------------------------------------------------------ Aufbau

  build() {
    const { level } = this;
    const r = mulberry32(hashString('deko:' + level.id));
    const boxes = [];
    const startTiles = new Set(level.animals.map((a) => a.start.join(',')));
    for (let y = 0; y < level.H; y++) {
      for (let x = 0; x < level.W; x++) {
        const t = level.tiles[y][x];
        const X = this.wx(x);
        const Z = this.wz(y);
        if (t === '#' || t === 'H' || t === 'T') {
          boxes.push(...M.landBoxes(X, Z, LAND_TOP, (x + y) % 2 === 0));
          if (t === 'T') boxes.push(...M.treeBoxes(X, Z, LAND_TOP, r));
          else if (t === '#' && !startTiles.has(`${x},${y}`) && r() < 0.35) boxes.push(...M.decorBoxes(X, Z, LAND_TOP, r));
        } else if (t === 'R') boxes.push(...M.rockBoxes(X, Z, BED));
        else if (t === '~') boxes.push(...M.sandBoxes(X, Z, SAND_TOP, BED));
        else if (t === ':') boxes.push(M.b(X, BED + 0.02, Z, 1, 0.04, 1, '#9fcfc6'));
        else if (t === '.' || t === '=') boxes.push(M.b(X, BED + 0.02, Z, 0.92, 0.04, 0.92, '#f6ead0'));
      }
    }
    // Schilf und Seerosen rund ums Brett
    for (let y = -3; y < level.H + 3; y++) {
      for (let x = -3; x < level.W + 3; x++) {
        if (x >= 0 && y >= 0 && x < level.W && y < level.H) continue;
        const v = r();
        if (v < 0.1) boxes.push(...M.reedBoxes(this.wx(x), this.wz(y), r));
        else if (v < 0.2) boxes.push(...M.lilyBoxes(this.wx(x) + (r() - 0.5) * 0.5, this.wz(y) + (r() - 0.5) * 0.5, r));
      }
    }
    const g = boxGeometry(boxes);
    this.disposables.push(g);
    const mesh = voxMesh(g, { cast: true, receive: true });
    this.group.add(mesh);

    // Häuser
    this.houses = {};
    for (const a of level.animals) {
      const color = M.ANIMALS[a.id].color;
      const house = voxMesh(geo('house' + color, () => M.houseBoxes(color)), { cast: true, receive: true });
      house.position.set(this.wx(a.home[0]), LAND_TOP, this.wz(a.home[1]) - 0.12);
      const winMat = new THREE.MeshLambertMaterial({ color: '#8fb8c8', emissive: '#000000' });
      this.disposables.push(winMat);
      for (const wx of [-0.19, 0.19]) {
        const win = new THREE.Mesh(WINDOW_GEO, winMat);
        win.position.set(wx, 0.3, 0.285);
        house.add(win);
      }
      this.group.add(house);
      this.houses[a.key] = { mesh: house, winMat };
    }

    // Tiere
    this.animals = {};
    for (const a of level.animals) {
      const root = new THREE.Group();
      const body = voxMesh(animalGeo(a.id), { cast: true });
      root.add(body);
      root.position.set(this.wx(a.start[0]), LAND_TOP, this.wz(a.start[1]));
      this.group.add(root);
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      this.bubbleLayer.append(bubble);
      this.animals[a.key] = { def: a, root, body, bubble, phase: r() * 6, happy: false, poke: 0, home: false };
    }

    // Schwimmstege
    this.jetties = [];
    for (let y = 0; y < level.H; y++) {
      for (let x = 0; x < level.W; x++) {
        if (level.tiles[y][x] !== '=') continue;
        const m = voxMesh(geo('jetty', M.jettyBoxes), { cast: true, receive: true });
        m.position.set(this.wx(x), 0, this.wz(y));
        this.group.add(m);
        this.jetties.push(m);
      }
    }

    // Flöße und Strömungsstreifen
    this.rafts = level.rafts.map((raft) => {
      const m = voxMesh(geo('raft', M.raftBoxes), { cast: true, receive: true });
      this.group.add(m);
      const streaks = [];
      const [x0, y0] = raft.lane[0];
      const [x1, y1] = raft.lane[raft.lane.length - 1];
      for (let i = 0; i < raft.lane.length * 2; i++) {
        const s = new THREE.Mesh(STREAK_GEO, STREAK_MAT);
        if (x0 === x1) s.rotation.y = Math.PI / 2;
        this.group.add(s);
        streaks.push({ mesh: s, u: r() * raft.lane.length, off: (r() - 0.5) * 0.6 });
      }
      return { def: raft, mesh: m, streaks, a: [this.wx(x0), this.wz(y0)], b: [this.wx(x1), this.wz(y1)] };
    });

    this.dots = new THREE.Group();
    this.group.add(this.dots);
  }

  dispose() {
    scene.remove(this.group);
    for (const d of this.disposables) d.dispose();
    for (const a of Object.values(this.animals)) a.bubble.remove();
  }

  // ------------------------------------------------------------ Höhen & Zeit

  raftWorld(i, clock) {
    const raft = this.level.rafts[i];
    const i0 = Math.floor(clock);
    const f = ease.inOut(clock - i0);
    const [x0, y0] = raftPos(raft, i0);
    const [x1, y1] = raftPos(raft, i0 + 1);
    return [this.wx(lerp(x0, x1, f)), this.wz(lerp(y0, y1, f))];
  }

  heightAt(x, y, step) {
    if (this.board.pieceAt(x, y)) return PIECE_TOP;
    const t = this.board.tile(x, y);
    if (t === '#' || t === 'H' || t === 'T') return LAND_TOP;
    if (t === '~') return SAND_TOP;
    if (t === '=') return water.level + 0.24;
    if (this.board.raftAt(x, y, step) >= 0) return water.level + 0.12;
    return water.level;
  }

  // ------------------------------------------------------------ Teile

  addPiece(piece) {
    const isStone = piece.type === 'stone';
    const mesh = voxMesh(isStone ? geo('stone', () => M.stoneBoxes(BED)) : geo('plank', () => M.plankBoxes(BED)), { cast: true, receive: true });
    const cx = piece.cells.reduce((s, c) => s + c[0], 0) / piece.cells.length;
    const cy = piece.cells.reduce((s, c) => s + c[1], 0) / piece.cells.length;
    mesh.position.set(this.wx(cx), 0, this.wz(cy));
    if (piece.dir === 'v') mesh.rotation.y = Math.PI / 2;
    this.group.add(mesh);
    this.pieceMeshes.set(piece, mesh);
    animate(0.35, (k) => {
      mesh.position.y = (1 - ease.out(k)) * 1.2;
      const s = k < 1 ? 0.85 + 0.15 * ease.back(k) : 1;
      mesh.scale.set(s, 1, s);
    }, () => burst(new THREE.Vector3(mesh.position.x, water.level + 0.05, mesh.position.z), ['#ffffff', '#d6f3f5'], 10, { speed: 1.2, up: 1.8, size: 0.06 }));
  }

  removePiece(piece) {
    const mesh = this.pieceMeshes.get(piece);
    if (!mesh) return;
    this.pieceMeshes.delete(piece);
    burst(new THREE.Vector3(mesh.position.x, 0.25, mesh.position.z), ['#ffffff', '#d6d2df'], 6, { speed: 1, up: 1.5 });
    animate(0.25, (k) => {
      mesh.position.y = ease.out(k) * 0.8;
      mesh.scale.setScalar(1 - k);
    }, () => mesh.removeFromParent());
  }

  clearPieces() {
    for (const piece of [...this.pieceMeshes.keys()]) this.removePiece(piece);
  }

  // ------------------------------------------------------------ Status

  showPaths(paths) {
    this.dots.clear();
    let offset = 0;
    for (const a of this.level.animals) {
      const view = this.animals[a.key];
      const path = paths[a.key];
      const was = view.happy;
      view.happy = !!path;
      view.bubble.textContent = path ? '♥' : '?';
      view.bubble.classList.toggle('happy', !!path);
      if (path && !was) {
        view.poke = 1;
        this.hooks.onHappy?.(a);
      }
      if (!path) continue;
      const color = M.ANIMALS[a.id].color;
      const seen = new Set();
      for (const p of path.slice(1, -1)) {
        const k = `${p.x},${p.y}`;
        if (p.raft || seen.has(k)) continue;
        seen.add(k);
        const dot = voxMesh(geo('dot' + color, () => [M.b(0, 0, 0, 0.14, 0.02, 0.14, color)]), { cast: false });
        dot.position.set(this.wx(p.x) + offset, this.heightAt(p.x, p.y, 0) + 0.015, this.wz(p.y) + offset);
        this.dots.add(dot);
      }
      offset += 0.12;
    }
  }

  poke(key) {
    const v = this.animals[key];
    if (v) v.poke = 1;
  }

  animalScreen(key) {
    const v = this.animals[key];
    return toScreen(v.root.position.clone().add(new THREE.Vector3(0, 0.3, 0)));
  }

  shake(key) {
    const v = this.animals[key];
    animate(0.5, (k) => (v.body.rotation.y = Math.sin(k * Math.PI * 6) * 0.4 * (1 - k)));
  }

  // ------------------------------------------------------------ Spaziergang

  startWalk(onArrive, onDone) {
    const t0 = Math.ceil(this.clock + 0.05);
    const paths = {};
    for (const a of this.level.animals) {
      paths[a.key] = findPath(this.board, a, t0);
      if (!paths[a.key]) return false;
    }
    const longest = Math.max(...Object.values(paths).map((p) => p.length));
    this.walk = { t0, paths, longest, onArrive, onDone, done: false };
    this.dots.clear();
    for (const v of Object.values(this.animals)) v.bubble.classList.add('hidden');
    this.spawnButterflies(3);
    return true;
  }

  spawnButterflies(n) {
    const b = this.bounds();
    for (let i = 0; i < n; i++) {
      this.butterflies.push(createButterfly(this.group, lerp(b.minX + 1, b.maxX - 1, Math.random()), lerp(b.minZ + 1, b.maxZ - 1, Math.random())));
    }
  }

  catchAt(sx, sy) {
    const p = catchButterfly(this.butterflies, sx, sy);
    if (p) this.hooks.onButterfly?.(p);
    return !!p;
  }

  // ------------------------------------------------------------ Update

  update(dt, t) {
    this.clock += dt / STEP;
    const clock = this.clock;
    for (const j of this.jetties) j.position.y = water.level + 0.2;
    this.rafts.forEach((r, i) => {
      const [x, z] = this.raftWorld(i, clock);
      r.mesh.position.set(x, water.level + 0.06, z);
      const len = r.def.lane.length;
      for (const s of r.streaks) {
        s.u = (s.u + dt * 0.7) % len;
        const k = s.u / Math.max(1, len - 1);
        const across = r.a[0] === r.b[0] ? [s.off, 0] : [0, s.off];
        s.mesh.position.set(lerp(r.a[0], r.b[0], k) + across[0], water.level + 0.03, lerp(r.a[1], r.b[1], k) + across[1]);
        s.mesh.visible = k <= 1;
      }
    });

    const w = this.walk;
    for (const [key, v] of Object.entries(this.animals)) {
      if (v.home) continue;
      if (w) this.walkAnimal(key, v, w, clock);
      else {
        const [x, y] = v.def.start;
        v.root.position.y = this.heightAt(x, y, 0);
        const bob = v.happy ? Math.abs(Math.sin(t * 5 + v.phase)) * 0.06 : 0;
        v.body.position.y = bob + v.poke * Math.sin(v.poke * Math.PI) * 0.3;
        v.body.scale.y = 1 + Math.sin(t * 2.2 + v.phase) * 0.025;
      }
      v.poke = Math.max(0, v.poke - dt * 2.5);
      if (!w) {
        const s = this.animalScreen(key);
        v.bubble.style.transform = `translate(${s.x}px, ${s.y - 46}px)`;
      }
    }

    if (w && !w.done) {
      const s = clock - w.t0;
      if (Object.values(this.animals).every((v) => v.home) && s > w.longest + 0.6) {
        w.done = true;
        w.onDone?.();
      }
    }

    for (const bf of this.butterflies) updateButterfly(bf, dt, t);
  }

  walkAnimal(key, v, w, clock) {
    const path = w.paths[key];
    const s = clock - w.t0;
    if (s < 0) return;
    const idx = Math.floor(s);
    if (idx >= path.length - 1) {
      v.home = true;
      this.enterHouse(key, v);
      return;
    }
    const f = ease.inOut(s - idx);
    const from = path[idx];
    const to = path[idx + 1];
    const last = idx + 1 === path.length - 1 ? 0.3 : 0; // vor der Haustür stehen bleiben
    const moved = from.x !== to.x || from.y !== to.y;
    const riding = from.raft && to.raft;
    const h0 = this.heightAt(from.x, from.y, w.t0 + idx);
    const h1 = this.heightAt(to.x, to.y, w.t0 + idx + 1);
    v.root.position.set(this.wx(lerp(from.x, to.x, f)), lerp(h0, h1, f), this.wz(lerp(from.y, to.y, f)) + last * f);
    v.body.position.y = moved && !riding ? Math.sin(f * Math.PI) * 0.22 : 0;
    if (moved && !riding) v.root.rotation.y = Math.atan2(to.x - from.x, to.y - from.y);
  }

  enterHouse(key, v) {
    const house = this.houses[key];
    const start = v.root.position.clone();
    const door = house.mesh.position.clone().add(new THREE.Vector3(0, 0, 0.18));
    v.root.rotation.y = Math.PI;
    animate(0.45, (k) => {
      v.root.position.lerpVectors(start, door, k);
      v.body.scale.setScalar(1 - k * 0.9);
    }, () => {
      v.root.visible = false;
      house.winMat.emissive.set('#ffd98a');
      burst(house.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)), ['#ff8fa3', '#ffb3c6', '#ffffff'], 12, { speed: 0.8, up: 2.2, size: 0.07, gravity: 2 });
      animate(0.4, (k) => house.mesh.scale.set(1 + Math.sin(k * Math.PI) * 0.12, 1 - Math.sin(k * Math.PI) * 0.08, 1 + Math.sin(k * Math.PI) * 0.12));
      this.walk.onArrive?.(v.def);
    });
  }
}
