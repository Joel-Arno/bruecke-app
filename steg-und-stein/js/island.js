import * as THREE from 'three';
import { boxGeometry, geo, voxMesh } from './voxel.js';
import * as M from './models.js';
import { scene, LAND_TOP, BED, burst, animate, ease, toScreen, groundPoint } from './scene.js';
import { mulberry32 } from './puzzle.js';
import { animalGeo, createButterfly, updateButterfly, catchButterfly } from './levelview.js';

const MAP = [
  '..####..',
  '.######.',
  '########',
  '########',
  '########',
  '########',
  '########',
  '.######.',
  '..####..',
  '...##...',
];
// Plätze für die Häuschen, in der Reihenfolge, in der Tiere einziehen
const HOUSE_SLOTS = [[2, 0], [5, 0], [0, 2], [7, 2], [3, 2], [0, 5], [7, 5], [5, 4], [2, 4], [1, 7], [6, 7], [4, 6]];

const W = MAP[0].length;
const H = MAP.length;
const ox = -(W - 1) / 2;
const oz = -(H - 1) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

export class Island {
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.group = new THREE.Group();
    this.decor = new Map(); // "x,y" -> { id, mesh }
    this.animals = [];
    this.houses = new Map();
    this.butterflies = [];
    this.nextButterfly = 4;
    this.building = false;
    const r = mulberry32(7);
    const boxes = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (MAP[y][x] !== '#') continue;
        boxes.push(...M.landBoxes(x + ox, y + oz, LAND_TOP, (x + y) % 2 === 0));
      }
    }
    // Steg nach unten und etwas Schilf am Ufer
    boxes.push(M.b(ox + 3.5, LAND_TOP - 0.05, oz + 10, 0.6, 0.06, 1.6, '#d8b07f'));
    for (const z of [9.5, 10.6]) for (const x of [3.22, 3.78]) boxes.push(M.b(ox + x, (BED + LAND_TOP) / 2, oz + z, 0.07, LAND_TOP - BED, 0.07, '#a87b52'));
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2;
      const d = 1 + r() * 0.25;
      const x = Math.cos(a) * 5.2 * d;
      const z = Math.sin(a) * 6.3 * d;
      boxes.push(...(r() < 0.5 ? M.reedBoxes(x, z, r) : M.lilyBoxes(x, z, r)));
    }
    this.geometry = boxGeometry(boxes);
    this.group.add(voxMesh(this.geometry, { cast: true, receive: true }));

    // Raster im Baumodus
    this.grid = new THREE.Group();
    const gmat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 });
    const ggeo = new THREE.BoxGeometry(0.9, 0.01, 0.9);
    this.gridCells = new Map();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (MAP[y][x] !== '#') continue;
        const m = new THREE.Mesh(ggeo, gmat);
        m.position.set(x + ox, LAND_TOP + 0.01, y + oz);
        this.grid.add(m);
        this.gridCells.set(`${x},${y}`, m);
      }
    }
    this.grid.visible = false;
    this.group.add(this.grid);
    this.group.visible = false;
    scene.add(this.group);
  }

  bounds() {
    return { minX: ox - 0.5, maxX: ox + W - 0.5, minZ: oz - 0.5, maxZ: oz + H - 0.5, minY: 0, maxY: 1.2 };
  }

  // ------------------------------------------------------------ Inhalt aus dem Spielstand

  sync(save) {
    save.animals.forEach((id, i) => {
      if (this.houses.has(id) || i >= HOUSE_SLOTS.length) return;
      const [x, y] = HOUSE_SLOTS[i];
      const color = M.ANIMALS[id].color;
      const house = voxMesh(geo('house' + color, () => M.houseBoxes(color)), { cast: true, receive: true });
      house.position.set(x + ox, LAND_TOP, y + oz - 0.1);
      this.group.add(house);
      this.houses.set(id, { x, y, mesh: house });
      const root = new THREE.Group();
      const body = voxMesh(animalGeo(id), { cast: true });
      root.add(body);
      const start = this.freeNeighbor(x, y) || [x, y + 1];
      root.position.set(start[0] + ox, LAND_TOP, start[1] + oz);
      this.group.add(root);
      this.animals.push({ id, root, body, x: start[0], y: start[1], from: null, t: 0, wait: 1 + Math.random() * 3, jump: 0 });
    });
    const wanted = new Set(save.decor.map((d) => `${d.x},${d.y}`));
    for (const [k, d] of this.decor) {
      if (!wanted.has(k)) {
        d.mesh.removeFromParent();
        this.decor.delete(k);
      }
    }
    for (const d of save.decor) if (!this.decor.has(`${d.x},${d.y}`)) this.placeDecor(d.id, d.x, d.y, false);
    this.refreshGrid();
  }

  placeDecor(id, x, y, pop = true) {
    const def = M.DECOR[id];
    const mesh = new THREE.Group();
    mesh.add(voxMesh(geo('decor:' + id, def.build), { cast: true, receive: true }));
    if (def.blades) {
      const blades = voxMesh(geo('blades', M.bladesBoxes), { cast: true });
      blades.position.set(0, 0.7, 0.36);
      mesh.add(blades);
      mesh.userData.blades = blades;
    }
    mesh.position.set(x + ox, LAND_TOP, y + oz);
    this.group.add(mesh);
    this.decor.set(`${x},${y}`, { id, mesh });
    if (pop) {
      animate(0.35, (k) => mesh.scale.setScalar(ease.back(k)));
      burst(mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), ['#ffffff', '#fff2a8', '#c8f0c0'], 12, { speed: 1.2, up: 2 });
    }
    this.refreshGrid();
  }

  removeDecor(x, y) {
    const d = this.decor.get(`${x},${y}`);
    if (!d) return null;
    this.decor.delete(`${x},${y}`);
    animate(0.25, (k) => d.mesh.scale.setScalar(1 - k), () => d.mesh.removeFromParent());
    this.refreshGrid();
    return d.id;
  }

  // ------------------------------------------------------------ Felder

  isLand(x, y) {
    return y >= 0 && y < H && x >= 0 && x < W && MAP[y][x] === '#';
  }

  isHouse(x, y) {
    for (const h of this.houses.values()) if (h.x === x && h.y === y) return true;
    return false;
  }

  isFree(x, y) {
    return this.isLand(x, y) && !this.isHouse(x, y) && !this.decor.has(`${x},${y}`);
  }

  freeNeighbor(x, y) {
    const opts = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, c]) => this.isFree(a, c));
    return opts.length ? opts[Math.floor(Math.random() * opts.length)] : null;
  }

  refreshGrid() {
    for (const [k, m] of this.gridCells) {
      const [x, y] = k.split(',').map(Number);
      m.visible = this.isFree(x, y) || this.decor.has(k);
    }
  }

  setBuilding(on) {
    this.building = on;
    this.grid.visible = on;
  }

  tileAt(sx, sy) {
    const p = groundPoint(sx, sy, LAND_TOP);
    if (!p) return null;
    return [Math.round(p.x - ox), Math.round(p.z - oz)];
  }

  // Tier nahe am Bildschirmpunkt antippen
  pokeAt(sx, sy) {
    let best = null;
    let bestD = 50;
    for (const a of this.animals) {
      const p = toScreen(a.root.position.clone().add(new THREE.Vector3(0, 0.3, 0)));
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    if (best) best.jump = 1;
    return best?.id ?? null;
  }

  catchAt(sx, sy) {
    return catchButterfly(this.butterflies, sx, sy);
  }

  // ------------------------------------------------------------ Update

  update(dt, t) {
    if (!this.group.visible) return;
    for (const a of this.animals) {
      if (a.from) {
        a.t += dt / 0.45;
        const k = Math.min(1, a.t);
        const f = ease.inOut(k);
        a.root.position.set(lerp(a.from[0], a.x, f) + ox, LAND_TOP, lerp(a.from[1], a.y, f) + oz);
        a.body.position.y = Math.sin(k * Math.PI) * 0.18;
        if (k >= 1) a.from = null;
      } else {
        a.wait -= dt;
        if (a.wait <= 0 && !this.building) {
          const n = this.freeNeighbor(a.x, a.y);
          if (n) {
            a.from = [a.x, a.y];
            [a.x, a.y] = n;
            a.t = 0;
            a.root.rotation.y = Math.atan2(a.x - a.from[0], a.y - a.from[1]);
          }
          a.wait = 1.2 + Math.random() * 3.5;
        }
        a.body.position.y = a.jump * Math.sin(a.jump * Math.PI) * 0.45;
        a.body.scale.y = 1 + Math.sin(t * 2.2 + a.root.position.x) * 0.025;
      }
      a.jump = Math.max(0, a.jump - dt * 2);
    }
    for (const d of this.decor.values()) if (d.mesh.userData.blades) d.mesh.userData.blades.rotation.z += dt * 1.2;

    // ab und zu kommt ein Schmetterling vorbei
    this.nextButterfly -= dt;
    if (this.nextButterfly <= 0 && !this.building) {
      this.nextButterfly = 14 + Math.random() * 16;
      this.butterflies = this.butterflies.filter((bf) => !bf.gone && !bf.caught);
      if (this.butterflies.length < 2) this.butterflies.push(createButterfly(this.group, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, 12));
    }
    for (const bf of this.butterflies) updateButterfly(bf, dt, t);
  }
}
