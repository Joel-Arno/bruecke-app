import * as THREE from 'three';
import { boxGeometry, geo, voxMesh, MAT } from './voxel.js';
import * as M from './models.js';
import { Sound } from './audio.js';

const $ = (id) => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const COLS = 9;
const ROWS = 14;
const OX = -(COLS - 1) / 2;
const OZ = -(ROWS - 1) / 2;
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const dirName = (dx, dy) => (dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N');
const opposite = { N: 'S', S: 'N', E: 'W', W: 'E' };

// ------------------------------------------------------------------ Spielstand

const SAVE_KEY = 'bimmelbahn:v1';
const save = (() => {
  const d = { best: 0, tickets: 0, owned: ['dampf'], loco: 'dampf', sound: true, tutorial: false, games: 0 };
  try {
    return { ...d, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') };
  } catch {
    return d;
  }
})();
const persist = () => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // nicht speicherbar
  }
};
const sound = new Sound();
sound.on = save.sound;
const skin = () => M.LOCOS.find((l) => l.id === save.loco) || M.LOCOS[0];

// ------------------------------------------------------------------ Szene

const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#7cb342');
scene.add(new THREE.HemisphereLight('#ffffff', '#6d8f4a', 1.5));
const sun = new THREE.DirectionalLight('#fff3e0', 2.0);
sun.position.set(-4, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.radius = 3;
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 10, bottom: -10, near: 1, far: 40 });
scene.add(sun, sun.target);
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);

const world = (x, y) => [x + OX, y + OZ];

scene.add(voxMesh(boxGeometry(M.groundBoxes(COLS, ROWS)), { cast: true, receive: true }));
{
  // Landschaft außerhalb des Zauns
  let s = 11;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const deco = [];
  for (let y = -6; y < ROWS + 6; y++) {
    for (let x = -6; x < COLS + 6; x++) {
      if (x >= -1 && y >= -1 && x <= COLS && y <= ROWS) continue;
      const v = r();
      const [wx, wz] = world(x, y);
      if (v < 0.22) deco.push(...M.treeBoxes(wx, wz, r));
      else if (v < 0.3) deco.push(...M.flowerBoxes(wx + (r() - 0.5) * 0.6, wz + (r() - 0.5) * 0.6, r));
    }
  }
  scene.add(voxMesh(boxGeometry(deco), { cast: true, receive: true }));
}

// Kamera so einstellen, dass das Spielfeld zwischen HUD oben und Rand unten passt
const tmpV = new THREE.Vector3();
function fitCamera() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const elev = 1.2;
  const dir = new THREE.Vector3(0, Math.sin(elev), Math.cos(elev));
  const target = new THREE.Vector3(0, 0, 0);
  const corners = [];
  for (const x of [OX - 0.8, -OX + 0.8]) for (const z of [OZ - 0.8, -OZ + 0.8]) for (const y of [0, 0.6]) corners.push(new THREE.Vector3(x, y, z));
  const top = 0.1;
  const bottom = 0.03;
  const bandW = 2 - 0.06;
  const bandH = 2 - (top + bottom) * 2;
  const extent = (d) => {
    camera.position.copy(target).addScaledVector(dir, d);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const c of corners) {
      tmpV.copy(c).project(camera);
      x0 = Math.min(x0, tmpV.x);
      x1 = Math.max(x1, tmpV.x);
      y0 = Math.min(y0, tmpV.y);
      y1 = Math.max(y1, tmpV.y);
    }
    return { x0, x1, y0, y1 };
  };
  let lo = 2;
  let hi = 100;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const e = extent(mid);
    if (e.x1 - e.x0 <= bandW && e.y1 - e.y0 <= bandH) hi = mid;
    else lo = mid;
  }
  const e = extent(hi);
  camera.setViewOffset(w, h, 0, ((bottom - top - (e.y0 + e.y1) / 2) * h) / 2, w, h);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fitCamera);
fitCamera();

function toScreen(x, y, z) {
  tmpV.set(x, y, z).project(camera);
  return { x: ((tmpV.x + 1) / 2) * window.innerWidth, y: ((1 - tmpV.y) / 2) * window.innerHeight };
}

// ------------------------------------------------------------------ Partikel

const PMAX = 220;
const pmesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), PMAX);
pmesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
pmesh.frustumCulled = false;
scene.add(pmesh);
const parts = Array.from({ length: PMAX }, () => ({ life: 0, shown: false }));
const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const EU = new THREE.Euler();
const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const COL = new THREE.Color();
for (let i = 0; i < PMAX; i++) {
  pmesh.setMatrixAt(i, M4.makeScale(0, 0, 0));
  pmesh.setColorAt(i, COL.set('#fff'));
}
let pNext = 0;
function burst(x, y, z, colors, n, o = {}) {
  for (let k = 0; k < n; k++) {
    const i = pNext;
    pNext = (pNext + 1) % PMAX;
    const a = Math.random() * Math.PI * 2;
    const sp = (o.speed ?? 2) * (0.4 + Math.random() * 0.8);
    Object.assign(parts[i], {
      life: (o.life ?? 0.8) * (0.6 + Math.random() * 0.6), x, y, z,
      vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: (o.up ?? 2.5) * (0.5 + Math.random()),
      s: (o.size ?? 0.08) * (0.6 + Math.random() * 0.8), g: o.gravity ?? 8, grow: o.grow ?? 0, r: Math.random() * 6, shown: true,
    });
    pmesh.setColorAt(i, COL.set(colors[k % colors.length]));
  }
  pmesh.instanceColor.needsUpdate = true;
}
function updateParticles(dt) {
  let dirty = false;
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i];
    if (p.life <= 0) {
      if (p.shown) {
        pmesh.setMatrixAt(i, M4.makeScale(0, 0, 0));
        p.shown = false;
        dirty = true;
      }
      continue;
    }
    p.life -= dt;
    p.vy -= p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.s += p.grow * dt;
    p.r += dt * 3;
    const s = p.s * Math.min(1, p.life / 0.25);
    Q.setFromEuler(EU.set(p.r, p.r * 0.6, 0));
    pmesh.setMatrixAt(i, M4.compose(V1.set(p.x, p.y, p.z), Q, V2.set(s, s, s)));
    dirty = true;
  }
  if (dirty) pmesh.instanceMatrix.needsUpdate = true;
}

function floater(text, x, y, z, cls = '') {
  const p = toScreen(x, y, z);
  const el = document.createElement('div');
  el.className = 'floater ' + cls;
  el.textContent = text;
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
  $('floaters').append(el);
  setTimeout(() => el.remove(), 1300);
}

// ------------------------------------------------------------------ Spielzustand

let G = null; // aktuelle Runde
let mode = 'ready'; // ready | play | crash | over | paused
let shake = 0;

const trainGroup = new THREE.Group();
scene.add(trainGroup);
const boardGroup = new THREE.Group();
scene.add(boardGroup);

const colorOf = (id) => (id === 'gold' ? M.GOLD : M.COLORS.find((c) => c.id === id));

function newGame() {
  boardGroup.clear();
  trainGroup.clear();
  G = {
    pos: [{ x: 4, y: ROWS - 3 }, { x: 4, y: ROWS - 2 }],
    prev: [{ x: 4, y: ROWS - 3 }, { x: 4, y: ROWS - 2 }],
    cars: ['loco', 'tender'],
    carMeshes: [],
    carKeys: [],
    rails: [],
    grow: 0,
    dir: 'N',
    queue: [],
    stepT: 0,
    score: 0,
    delivered: 0,
    tickets: 0,
    hearts: 3,
    colors: 2,
    stations: new Map(),
    passengers: [],
    blocked: new Map(),
    spawnT: 0.6,
    angles: [],
    lowWarned: false,
    cause: '',
  };
  let s = Date.now() % 100000;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 3; i++) addObstacle(r);
  for (let i = 0; i < G.colors; i++) placeStation(M.COLORS[i]);
  for (let i = 0; i < 2; i++) spawnPassenger();
  syncTrain(true);
  mode = 'ready';
  $('hud').classList.remove('hidden');
  $('start').classList.remove('hidden');
  $('over').classList.add('hidden');
  $('pause').classList.add('hidden');
  updateHud();
}

// ------------------------------------------------------------------ Felder

const key = (x, y) => `${x},${y}`;
const inside = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
function stationAt(x, y) {
  for (const st of G.stations.values()) if (st.x === x && st.y === y && !st.moving) return st;
  return null;
}
const passengerAt = (x, y) => G.passengers.find((p) => p.x === x && p.y === y && !p.leaving);
const inBody = (x, y) => G.pos.some((p) => p.x === x && p.y === y);

function freeCell(minDist = 3) {
  const head = G.pos[0];
  const [fx, fy] = DIRS[G.dir];
  for (let tries = 0; tries < 200; tries++) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (G.blocked.has(key(x, y)) || stationAt(x, y) || passengerAt(x, y) || inBody(x, y)) continue;
    if (Math.abs(x - head.x) + Math.abs(y - head.y) < minDist) continue;
    // nicht direkt vor die Lok
    let ahead = false;
    for (let k = 1; k <= 3; k++) if (head.x + fx * k === x && head.y + fy * k === y) ahead = true;
    if (ahead) continue;
    return { x, y };
  }
  return null;
}

function addObstacle(r = Math.random) {
  const c = freeCell(4);
  if (!c) return;
  // Hindernisse nicht in Ecken-Sackgassen: nie direkt an zwei Rändern gleichzeitig
  if ((c.x === 0 || c.x === COLS - 1) && (c.y === 0 || c.y === ROWS - 1)) return;
  const [wx, wz] = world(c.x, c.y);
  const boxes = r() < 0.75 ? M.treeBoxes(0, 0, r) : M.rockBoxes(0, 0);
  const mesh = voxMesh(boxGeometry(boxes), { cast: true, receive: true });
  mesh.position.set(wx, 0, wz);
  boardGroup.add(mesh);
  G.blocked.set(key(c.x, c.y), mesh);
  pop(mesh);
  burst(wx, 0.3, wz, ['#81c784', '#aed581'], 8, { speed: 1.2 });
}

function placeStation(color) {
  const c = freeCell(3);
  if (!c) return;
  const [wx, wz] = world(c.x, c.y);
  const group = new THREE.Group();
  group.add(voxMesh(geo('station' + color.id, () => M.stationBoxes(color)), { cast: true, receive: true }));
  const arrow = voxMesh(geo('arrow' + color.id, () => [M.b(0, 0, 0, 0.26, 0.1, 0.26, color.hex), M.b(0, -0.1, 0, 0.14, 0.1, 0.14, color.hex)]), { cast: false });
  arrow.position.y = 1.7;
  arrow.visible = false;
  group.add(arrow);
  group.position.set(wx, 0, wz);
  boardGroup.add(group);
  const old = G.stations.get(color.id);
  if (old) {
    const m = old.group;
    animate(0.3, (k) => m.scale.setScalar(1 - k), () => m.removeFromParent());
  }
  G.stations.set(color.id, { color, x: c.x, y: c.y, group, arrow, moving: false });
  pop(group);
}

function spawnPassenger() {
  const c = freeCell(3);
  if (!c) return;
  const active = M.COLORS.slice(0, G.colors);
  // Farben bevorzugen, die gerade selten warten
  const counts = active.map((col) => G.passengers.filter((p) => p.color.id === col.id).length);
  const min = Math.min(...counts);
  const pool = active.filter((_, i) => counts[i] === min);
  const color = G.delivered > 4 && Math.random() < 0.08 ? M.GOLD : pool[Math.floor(Math.random() * pool.length)];
  const [wx, wz] = world(c.x, c.y);
  const group = new THREE.Group();
  const body = voxMesh(geo('person' + color.id, () => M.personBoxes(color)), { cast: true });
  const ring = voxMesh(geo('ring' + color.id, () => M.ringBoxes(color)), { cast: false, receive: true });
  group.add(ring, body);
  group.position.set(wx, 0, wz);
  group.rotation.y = Math.random() * Math.PI * 2;
  boardGroup.add(group);
  const patience = Math.max(15, 27 - G.delivered * 0.22) * (color.id === 'gold' ? 0.7 : 1);
  G.passengers.push({ x: c.x, y: c.y, color, group, body, ring, t: patience, max: patience, leaving: false, ph: Math.random() * 6 });
  pop(group);
}

// ------------------------------------------------------------------ Zug

function carKey(i) {
  const c = G.cars[i];
  if (c === 'loco') return 'loco:' + save.loco;
  if (c === 'tender') return 'tender:' + save.loco;
  return 'wagon:' + c;
}

function carGeo(k) {
  const [type, id] = k.split(':');
  if (type === 'loco') return geo(k, () => M.locoBoxes(skin()));
  if (type === 'tender') return geo(k, () => M.tenderBoxes(skin()));
  return geo(k, () => M.wagonBoxes(colorOf(id)));
}

// Wagen- und Schienen-Meshes an den aktuellen Zug anpassen
function syncTrain(reset = false) {
  const n = G.pos.length;
  for (let i = 0; i < n; i++) {
    const k = carKey(i);
    if (G.carKeys[i] !== k) {
      if (G.carMeshes[i]) G.carMeshes[i].removeFromParent();
      const m = voxMesh(carGeo(k), { cast: true });
      trainGroup.add(m);
      G.carMeshes[i] = m;
      G.carKeys[i] = k;
      if (!reset) pop(m, 0.25);
    }
    if (!G.rails[i]) {
      const r = voxMesh(geo('rail:NS', () => M.railBoxes('N', 'S')), { cast: false, receive: true });
      trainGroup.add(r);
      G.rails[i] = r;
    }
  }
  for (let i = n; i < G.carMeshes.length; i++) {
    G.carMeshes[i]?.removeFromParent();
    G.rails[i]?.removeFromParent();
  }
  G.carMeshes.length = n;
  G.carKeys.length = n;
  G.rails.length = n;
  // Schienen: jede Zelle verbindet zum Vorder- und Hinterwagen
  for (let i = 0; i < n; i++) {
    const p = G.pos[i];
    let a;
    let c;
    const toPrev = i > 0 ? dirName(G.pos[i - 1].x - p.x, G.pos[i - 1].y - p.y) : null;
    const toNext = i < n - 1 ? dirName(G.pos[i + 1].x - p.x, G.pos[i + 1].y - p.y) : null;
    if (toPrev && toNext) [a, c] = [toPrev, toNext];
    else if (toNext) [a, c] = [opposite[toNext], toNext];
    else if (toPrev) [a, c] = [toPrev, opposite[toPrev]];
    else [a, c] = [G.dir, opposite[G.dir]];
    const pair = [a, c].sort().join('');
    const r = G.rails[i];
    r.geometry = geo('rail:' + pair, () => M.railBoxes(pair[0], pair[1]));
    const [wx, wz] = world(p.x, p.y);
    r.position.set(wx, 0, wz);
  }
  if (reset) {
    G.angles = G.pos.map(() => Math.PI);
    placeCars(1);
  }
}

function placeCars(k) {
  for (let i = 0; i < G.pos.length; i++) {
    const m = G.carMeshes[i];
    const to = G.pos[i];
    const from = G.prev[i] || to;
    const [x0, z0] = world(from.x, from.y);
    const [x1, z1] = world(to.x, to.y);
    m.position.set(lerp(x0, x1, k), 0, lerp(z0, z1, k));
    // Blickrichtung: zum Vorderwagen hin, sonst Fahrtrichtung
    let target;
    if (i === 0) {
      const [dx, dy] = DIRS[G.dir];
      target = Math.atan2(dx, dy);
    } else {
      const f = G.pos[i - 1];
      const pf = G.prev[i - 1] || f;
      const fx = lerp(pf.x, f.x, k) - lerp(from.x, to.x, k);
      const fy = lerp(pf.y, f.y, k) - lerp(from.y, to.y, k);
      target = Math.atan2(fx, fy);
    }
    let a = G.angles[i] ?? target;
    let d = target - a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a += d * (i === 0 ? 0.35 : 0.5);
    G.angles[i] = a;
    m.rotation.y = a;
    m.position.y = mode === 'play' ? Math.abs(Math.sin((performance.now() / 90) + i)) * 0.015 : 0;
  }
}

function interval() {
  return Math.max(0.15, 0.34 - G.delivered * 0.005);
}

function turn(d) {
  if (mode === 'ready') start(d);
  if (mode !== 'play') return;
  const last = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
  if (d === last || d === opposite[last]) return;
  if (G.queue.length < 2) {
    G.queue.push(d);
    sound.turn();
  }
}

function turnRelative(side) {
  const last = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
  const [dx, dy] = DIRS[last];
  const [nx, ny] = side < 0 ? [dy, -dx] : [-dy, dx];
  turn(dirName(nx, ny));
}

function start(d) {
  mode = 'play';
  $('start').classList.add('hidden');
  sound.whistle();
  if (d && d !== opposite[G.dir]) G.dir = d;
  G.stepT = 0;
  save.games++;
  if (!save.tutorial) toast('Fahr über die Fahrgäste, um sie einzusammeln!', 3500);
}

function step() {
  if (G.queue.length) G.dir = G.queue.shift();
  const head = G.pos[0];
  const [dx, dy] = DIRS[G.dir];
  const nx = head.x + dx;
  const ny = head.y + dy;
  const tailLeaves = G.grow === 0;
  const hitsBody = G.pos.some((p, i) => p.x === nx && p.y === ny && !(tailLeaves && i === G.pos.length - 1));
  if (!inside(nx, ny)) return crash('Gegen den Zaun gefahren!');
  if (G.blocked.has(key(nx, ny))) return crash('Da stand ein Baum im Weg!');
  if (hitsBody) return crash('In den eigenen Zug gefahren!');

  G.prev = G.pos.map((p) => ({ ...p }));
  G.pos.unshift({ x: nx, y: ny });
  if (G.grow > 0) G.grow--;
  else G.pos.pop();

  if (skin().kind === 'steam') {
    sound.chuff();
    const [wx, wz] = world(head.x, head.y);
    burst(wx, 0.85, wz, ['#ffffff', '#eceff1'], 2, { speed: 0.3, up: 0.8, gravity: -0.4, size: 0.12, grow: 0.25, life: 0.9 });
  }

  const p = passengerAt(nx, ny);
  if (p) pickup(p);
  const st = stationAt(nx, ny);
  if (st) deliver(st);
  syncTrain();
}

function pickup(p) {
  G.passengers = G.passengers.filter((q) => q !== p);
  p.group.removeFromParent();
  G.cars.push(p.color.id);
  G.grow++;
  const [wx, wz] = world(p.x, p.y);
  burst(wx, 0.5, wz, [p.color.hex, '#ffffff'], 10, { speed: 1.5 });
  sound.pickup(M.COLORS.indexOf(p.color));
  if (p.color.id === 'gold') floater('Goldgast!', wx, 1, wz, 'gold');
  if (!save.tutorial && G.cars.length === 3) toast(`Bring den Fahrgast zum ${p.color.id === 'gold' ? 'einem beliebigen' : p.color.name.toLowerCase() + 'en'} Bahnhof!`, 3500);
  G.spawnT = Math.min(G.spawnT, 1.2);
  updateHud();
}

function deliver(st) {
  const matches = (c) => c === st.color.id || c === 'gold';
  const n = G.cars.filter((c, i) => i > 1 && c === st.color.id).length;
  const gold = G.cars.filter((c, i) => i > 1 && c === 'gold').length;
  if (!n && !gold) return;
  G.cars = G.cars.filter((c, i) => i <= 1 || !matches(c));
  G.pos = G.pos.slice(0, G.cars.length);
  G.prev = G.prev.slice(0, G.cars.length);
  G.grow = Math.max(0, G.cars.length - G.pos.length);
  const points = (n * (n + 1)) / 2 + gold * 5;
  G.score += points;
  G.delivered += n + gold;
  G.tickets += n + gold;
  const [wx, wz] = world(st.x, st.y);
  burst(wx, 1.1, wz, [st.color.hex, '#ffffff', '#ffd54f'], 16 + n * 4, { speed: 2.4, up: 3.5 });
  floater(`+${points}`, wx, 1.2, wz, 'big');
  if (n >= 2) setTimeout(() => floater(`Kombo ×${n}!`, wx, 1.8, wz, 'combo'), 180);
  sound.deliver(n + gold);
  if (gold) sound.gold();
  if (!save.tutorial) {
    save.tutorial = true;
    persist();
    toast('Super! Mehrere gleiche Farben auf einmal geben Extrapunkte.', 3500);
  }
  // Neue Farbe freischalten
  const want = G.delivered >= 35 ? 5 : G.delivered >= 18 ? 4 : G.delivered >= 6 ? 3 : 2;
  if (want > G.colors) {
    G.colors = want;
    const col = M.COLORS[want - 1];
    setTimeout(() => {
      if (!G || mode !== 'play') return;
      placeStation(col);
      toast(`Neue Linie: ${col.name}! Und etwas schneller.`, 2600);
      sound.levelUp();
    }, 600);
  }
  // Ab und zu wächst ein Baum, ab und zu zieht ein Bahnhof um
  if (Math.floor((G.delivered - n - gold) / 7) < Math.floor(G.delivered / 7) && G.blocked.size < 12) setTimeout(() => G && mode === 'play' && addObstacle(), 900);
  if (G.delivered >= 10 && Math.random() < 0.45) {
    st.moving = true;
    setTimeout(() => G && mode === 'play' && placeStation(st.color), 1100);
  }
  updateHud();
}

function crash(text) {
  mode = 'crash';
  G.cause = text;
  shake = 0.5;
  sound.crash();
  navigator.vibrate?.(180);
  G.carMeshes.forEach((m, i) => {
    const vx = (Math.random() - 0.5) * 3;
    const vz = (Math.random() - 0.5) * 3;
    const spin = (Math.random() - 0.5) * 10;
    const y0 = m.position.y;
    setTimeout(() => {
      animate(0.9, (k) => {
        m.position.x += vx * 0.016;
        m.position.z += vz * 0.016;
        m.position.y = y0 + Math.sin(k * Math.PI) * 0.8;
        m.rotation.z += spin * 0.016;
      });
      burst(m.position.x, 0.4, m.position.z, ['#ff7043', '#ffca28', '#9e9e9e'], 8, { speed: 2.5 });
    }, i * 60);
  });
  setTimeout(gameOver, 1300);
}

function gameOver() {
  mode = 'over';
  const record = G.score > save.best;
  if (record) save.best = G.score;
  save.tickets += G.tickets;
  G.banked = true;
  persist();
  $('o-title').textContent = G.cause;
  $('o-score').textContent = G.score;
  $('o-best').textContent = save.best;
  $('o-tickets').textContent = `+${G.tickets}`;
  $('o-record').classList.toggle('hidden', !record || G.score === 0);
  const next = M.LOCOS.find((l) => !save.owned.includes(l.id));
  $('o-shop-dot').classList.toggle('hidden', !(next && save.tickets >= next.price));
  $('over').classList.remove('hidden');
  overArmed = false;
  setTimeout(() => (overArmed = true), 500);
  updateHud();
}
let overArmed = false;

// ------------------------------------------------------------------ Kleine Animationen

const anims = [];
function animate(dur, fn, done) {
  anims.push({ t: 0, dur, fn, done });
}
function pop(obj, dur = 0.35) {
  animate(dur, (k) => obj.scale.setScalar(k < 1 ? 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2 : 1));
}

// ------------------------------------------------------------------ Update

function update(dt) {
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    a.t += dt;
    const k = Math.min(1, a.t / a.dur);
    a.fn(k);
    if (k >= 1) {
      anims.splice(i, 1);
      a.done?.();
    }
  }
  if (!G) return;
  const t = performance.now() / 1000;

  if (mode === 'play') {
    G.stepT += dt;
    while (G.stepT >= interval() && mode === 'play') {
      G.stepT -= interval();
      step();
    }
    // Fahrgäste werden ungeduldig
    for (const p of G.passengers) {
      if (p.leaving) continue;
      p.t -= dt;
      const frac = Math.max(0, p.t / p.max);
      p.ring.scale.set(0.25 + frac * 0.75, 1, 0.25 + frac * 0.75);
      p.ring.visible = frac > 0.3 || Math.floor(t * 6) % 2 === 0;
      if (frac < 0.3 && !G.lowWarned && !save.tutorial) {
        G.lowWarned = true;
        toast('Beeil dich! Wartende Fahrgäste werden ungeduldig.', 3000);
      }
      if (p.t <= 0) passengerLeaves(p);
    }
    G.spawnT -= dt;
    const want = Math.min(1 + G.colors, 5);
    if (G.spawnT <= 0 && G.passengers.filter((p) => !p.leaving).length < want) {
      spawnPassenger();
      G.spawnT = 1 + Math.random() * 1.5;
    }
  }

  for (const p of G.passengers) {
    if (p.leaving) continue;
    const near = Math.abs(p.x - G.pos[0].x) + Math.abs(p.y - G.pos[0].y) <= 2;
    const low = p.t / p.max < 0.3;
    p.body.position.y = near || low ? Math.abs(Math.sin(t * (low ? 14 : 8) + p.ph)) * 0.12 : 0;
    if (near) p.group.rotation.y = Math.atan2(G.pos[0].x - p.x, G.pos[0].y - p.y);
  }
  const onboard = new Set(G.cars.slice(2));
  for (const st of G.stations.values()) {
    st.arrow.visible = onboard.has(st.color.id) || (onboard.has('gold') && !st.moving);
    st.arrow.position.y = 1.75 + Math.sin(t * 5) * 0.08;
    st.arrow.rotation.y = t * 2;
  }

  if (mode === 'play' || mode === 'ready') placeCars(mode === 'play' ? Math.min(1, G.stepT / interval()) : 1);
}

function passengerLeaves(p) {
  p.leaving = true;
  G.hearts--;
  sound.angry();
  const [wx, wz] = world(p.x, p.y);
  floater('Hmpf!', wx, 0.9, wz, 'angry');
  animate(0.5, (k) => {
    p.group.position.y = k * 0.6;
    p.group.scale.setScalar(1 - k);
  }, () => {
    p.group.removeFromParent();
    G.passengers = G.passengers.filter((q) => q !== p);
  });
  updateHud();
  $('hearts').classList.remove('hurt');
  void $('hearts').offsetWidth;
  $('hearts').classList.add('hurt');
  if (G.hearts <= 0) {
    mode = 'crash';
    G.cause = 'Zu viele Fahrgäste sind sauer!';
    setTimeout(gameOver, 900);
  }
}

// ------------------------------------------------------------------ Schleife

let last = performance.now();
let speed = 1; // nur für Tests
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000) * speed;
  last = now;
  if (mode !== 'paused') {
    update(dt);
    updateParticles(dt);
  }
  if (shake > 0) {
    shake = Math.max(0, shake - dt);
    scene.position.set((Math.random() - 0.5) * shake * 0.4, 0, (Math.random() - 0.5) * shake * 0.4);
  } else scene.position.set(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ Oberfläche

function updateHud() {
  $('score').textContent = G.score;
  $('best').textContent = `Rekord ${Math.max(save.best, G.score)}`;
  $('hearts').textContent = '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(3 - Math.max(0, G.hearts));
  $('tickets').textContent = save.tickets + (G.banked ? 0 : G.tickets);
  $('sound').textContent = save.sound ? '🔊' : '🔇';
  $('shop-tickets').textContent = save.tickets;
}

let toastTimer = 0;
function toast(text, ms = 2400) {
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('hidden', 'show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

function pause() {
  if (mode !== 'play') return;
  mode = 'paused';
  $('pause').classList.remove('hidden');
}
function resume() {
  if (mode !== 'paused') return;
  mode = 'play';
  $('pause').classList.add('hidden');
  last = performance.now();
}

// Lokschuppen
let thumbR = null;
const thumbs = {};
function thumb(loco) {
  if (thumbs[loco.id]) return thumbs[loco.id];
  try {
    if (!thumbR) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setPixelRatio(1);
      r.setSize(160, 160);
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight('#ffffff', '#8a8a8a', 1.8));
      const d = new THREE.DirectionalLight('#ffffff', 1.8);
      d.position.set(3, 4, 4);
      sc.add(d);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
      cam.position.set(1.4, 1.1, 1.5);
      cam.lookAt(0, 0.38, 0);
      thumbR = { r, sc, cam };
    }
    const mesh = new THREE.Mesh(boxGeometry(M.locoBoxes(loco)), MAT);
    thumbR.sc.add(mesh);
    thumbR.r.render(thumbR.sc, thumbR.cam);
    thumbs[loco.id] = thumbR.r.domElement.toDataURL('image/png');
    thumbR.sc.remove(mesh);
    mesh.geometry.dispose();
  } catch {
    thumbs[loco.id] = '';
  }
  return thumbs[loco.id];
}

function renderShop() {
  $('shop-tickets').textContent = save.tickets;
  const grid = $('shop-grid');
  grid.innerHTML = '';
  for (const l of M.LOCOS) {
    const owned = save.owned.includes(l.id);
    const active = save.loco === l.id;
    const card = document.createElement('div');
    card.className = 'card' + (active ? ' active' : '');
    card.innerHTML = `<div class="pic"><img src="${thumb(l)}" alt=""></div><b>${l.name}</b>`;
    const btn = document.createElement('button');
    btn.className = 'btn small';
    if (active) {
      btn.textContent = 'Im Einsatz';
      btn.disabled = true;
    } else if (owned) {
      btn.textContent = 'Einsetzen';
      btn.onclick = () => {
        save.loco = l.id;
        persist();
        sound.click();
        renderShop();
        if (mode === 'ready' || mode === 'over') newGame();
      };
    } else {
      btn.textContent = `🎫 ${l.price}`;
      btn.disabled = save.tickets < l.price;
      btn.onclick = () => {
        if (save.tickets < l.price) return;
        save.tickets -= l.price;
        save.owned.push(l.id);
        save.loco = l.id;
        persist();
        sound.buy();
        toast(`${l.name} steht bereit!`);
        renderShop();
        if (mode === 'ready' || mode === 'over') newGame();
      };
    }
    card.append(btn);
    grid.append(card);
  }
}

function openShop() {
  if (mode === 'play') pause();
  renderShop();
  $('shop').classList.remove('hidden');
}

// ------------------------------------------------------------------ Eingabe

let touch = null;
window.addEventListener('pointerdown', (e) => {
  sound.unlock();
  if (!e.isPrimary || e.target.closest('.ui')) return;
  touch = { x: e.clientX, y: e.clientY, fired: false };
});
window.addEventListener('pointermove', (e) => {
  if (!touch || touch.fired || !e.isPrimary) return;
  const dx = e.clientX - touch.x;
  const dy = e.clientY - touch.y;
  if (Math.hypot(dx, dy) < 24) return;
  touch.fired = true;
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'E' : 'W');
  else turn(dy > 0 ? 'S' : 'N');
});
window.addEventListener('pointerup', (e) => {
  if (!touch || !e.isPrimary) return;
  const t = touch;
  touch = null;
  if (t.fired) return;
  if (mode === 'ready') return start(null);
  if (mode === 'play') turnRelative(e.clientX < window.innerWidth / 2 ? -1 : 1);
});
window.addEventListener('pointercancel', () => (touch = null));
window.addEventListener('keydown', (e) => {
  const map = { ArrowUp: 'N', KeyW: 'N', ArrowDown: 'S', KeyS: 'S', ArrowLeft: 'W', KeyA: 'W', ArrowRight: 'E', KeyD: 'E' };
  if (map[e.code]) {
    e.preventDefault();
    sound.unlock();
    if (mode === 'over' && overArmed) return newGame();
    turn(map[e.code]);
  } else if (e.code === 'Space') {
    e.preventDefault();
    if (mode === 'over' && overArmed) newGame();
    else if (mode === 'ready') start(null);
  } else if (e.code === 'Escape' || e.code === 'KeyP') {
    if (mode === 'play') pause();
    else if (mode === 'paused') resume();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pause();
    persist();
  }
  last = performance.now();
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

function on(id, fn) {
  $(id).addEventListener('click', (e) => {
    e.stopPropagation();
    sound.unlock();
    fn();
  });
}
on('btn-again', () => overArmed && (sound.click(), newGame()));
on('btn-shop', openShop);
on('btn-shop2', () => overArmed && openShop());
on('btn-pause', pause);
on('btn-resume', resume);
on('btn-restart', () => {
  sound.click();
  newGame();
});
on('shop-close', () => {
  sound.click();
  $('shop').classList.add('hidden');
  const next = M.LOCOS.find((l) => !save.owned.includes(l.id));
  $('o-shop-dot').classList.toggle('hidden', !(next && save.tickets >= next.price));
});
on('sound', () => {
  save.sound = !save.sound;
  sound.on = save.sound;
  persist();
  updateHud();
  sound.click();
});

// ------------------------------------------------------------------ Start

newGame();
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && window.isSecureContext && window.top === window.self) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

if (new URLSearchParams(location.search).has('debug')) {
  window.__debug = { get G() { return G; }, get mode() { return mode; }, save, turn, step, toScreen, world, setSpeed: (v) => (speed = v), inside, key };
}
