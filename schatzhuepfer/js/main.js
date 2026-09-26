import * as THREE from 'three';
import { World, COLS, Y, clamp, difficulty, hashString } from './world.js';
import { geo, voxMesh } from './voxel.js';
import * as M from './models.js';
import { Sfx } from './audio.js';
import { loadSave, persist, todayKey } from './storage.js';

const $ = (id) => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

const HOP_TIME = 0.13;
const HOP_HEIGHT = 0.45;
const LOOK_AHEAD = 2.6;
const EAGLE_ROWS = 4; // so weit darf man hinter die Kamera zurückfallen
const SLOW_FACTOR = 0.45;

// ------------------------------------------------------------------ Grundgerüst

const save = loadSave();
const sfx = new Sfx();
sfx.muted = save.muted;

const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#5aa9c9');

scene.add(new THREE.HemisphereLight('#ffffff', '#7d8f5c', 1.7));
const sun = new THREE.DirectionalLight('#fff6e5', 2.1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 18, bottom: -18, near: 1, far: 60 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const SUN_OFFSET = new THREE.Vector3(-5, 12, 3);

const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
const CAM_OFFSET = new THREE.Vector3(1.7, 11, 8);
const camTarget = new THREE.Vector3();

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  let halfW;
  let halfH;
  if (aspect < 0.8) {
    halfW = 4.4;
    halfH = halfW / aspect;
  } else {
    halfH = 5.6;
    halfW = Math.min(halfH * aspect, 9);
    halfH = halfW / aspect;
  }
  Object.assign(camera, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const world = new World(scene);

// ------------------------------------------------------------------ Spieler

const playerMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true });
const P = {
  root: new THREE.Group(),
  pivot: new THREE.Group(),
  mesh: new THREE.Mesh(undefined, playerMat),
};
P.mesh.castShadow = true;
P.pivot.add(P.mesh);
P.root.add(P.pivot);
scene.add(P.root);

let character = M.characterById(save.selected);
function setCharacter(id) {
  character = M.characterById(id);
  P.mesh.geometry = M.characterGeometry(character.id);
  playerMat.opacity = character.opacity ?? 1;
}
setCharacter(save.selected);

function resetPlayer() {
  Object.assign(P, {
    row: 0,
    rowF: 0,
    x: 0,
    y: 0,
    hop: null,
    log: null,
    logOffset: 0,
    pad: null,
    queue: [],
    angle: Math.PI, // schaut zur Kamera
    targetAngle: Math.PI,
    alive: true,
    death: null,
    pressed: false,
    sy: 1,
    bump: null,
    power: null,
  });
  P.mesh.visible = true;
  P.pivot.position.set(0, 0, 0);
  playerMat.opacity = character.opacity ?? 1;
}

// ------------------------------------------------------------------ Adler

const eagle = new THREE.Group();
const eagleWingL = voxMesh(geo('eagleWingL', () => M.eagleWing(-1)));
const eagleWingR = voxMesh(geo('eagleWingR', () => M.eagleWing(1)));
eagleWingL.position.set(-0.24, 0.1, 0);
eagleWingR.position.set(0.24, 0.1, 0);
eagle.add(voxMesh(geo('eagleBody', M.eagleBody)), eagleWingL, eagleWingR);
eagle.scale.setScalar(1.3);
eagle.visible = false;
scene.add(eagle);
const E = { active: false, t: 0, x: 0, z: 0 };

function startEagle() {
  Object.assign(E, { active: true, t: 0, x: P.x, z: -P.rowF });
  eagle.visible = true;
}

function updateEagle(dt) {
  if (!E.active) return;
  E.t += dt;
  const reach = 0.5;
  let y;
  let z;
  if (E.t < reach) {
    const k = E.t / reach;
    z = E.z - 14 * (1 - k);
    y = 0.9 + 4 * (1 - k) * (1 - k);
  } else {
    const k = E.t - reach;
    z = E.z + k * 13;
    y = 0.9 + k * 3.5;
    P.y = y - 0.8;
    P.rowF = -z;
  }
  eagle.position.set(E.x, y, z);
  const flap = Math.sin(E.t * 22) * 0.55;
  eagleWingL.rotation.z = flap;
  eagleWingR.rotation.z = -flap;
  if (E.t > 2.2) {
    E.active = false;
    eagle.visible = false;
  }
}

// ------------------------------------------------------------------ Partikel

const PMAX = 160;
const partMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), PMAX);
partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
partMesh.frustumCulled = false;
scene.add(partMesh);
const parts = Array.from({ length: PMAX }, () => ({ life: 0, shown: false }));
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpC = new THREE.Color();
for (let i = 0; i < PMAX; i++) {
  partMesh.setMatrixAt(i, tmpM.makeScale(0, 0, 0));
  partMesh.setColorAt(i, tmpC.set('#ffffff'));
}
let pNext = 0;

function burst(x, y, z, colors, n, o = {}) {
  for (let k = 0; k < n; k++) {
    const idx = pNext;
    pNext = (pNext + 1) % PMAX;
    const a = Math.random() * Math.PI * 2;
    const sp = (o.speed ?? 2.5) * (0.4 + Math.random() * 0.8);
    Object.assign(parts[idx], {
      life: (o.life ?? 0.7) * (0.6 + Math.random() * 0.6),
      x, y, z,
      vx: Math.cos(a) * sp,
      vz: Math.sin(a) * sp,
      vy: (o.up ?? 3) * (0.5 + Math.random()),
      s: (o.size ?? 0.12) * (0.6 + Math.random() * 0.8),
      g: o.gravity ?? 12,
      rx: Math.random() * 6,
      ry: Math.random() * 6,
      shown: true,
    });
    partMesh.setColorAt(idx, tmpC.set(colors[k % colors.length]));
  }
  partMesh.instanceColor.needsUpdate = true;
}

function updateParticles(dt) {
  let dirty = false;
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i];
    if (p.life <= 0) {
      if (p.shown) {
        partMesh.setMatrixAt(i, tmpM.makeScale(0, 0, 0));
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
    p.rx += dt * 5;
    const s = p.s * Math.min(1, p.life / 0.25);
    tmpQ.setFromEuler(tmpE.set(p.rx, p.ry, 0));
    partMesh.setMatrixAt(i, tmpM.compose(tmpP.set(p.x, p.y, p.z), tmpQ, tmpS.set(s, s, s)));
    dirty = true;
  }
  if (dirty) partMesh.instanceMatrix.needsUpdate = true;
}

// ------------------------------------------------------------------ Spielzustand

let mode = 'ready'; // ready | playing | dying | over | paused
let pausedFrom = null;
let isDaily = false;
let score = 0;
let runFish = 0;
let camRow = 0;
let camX = 0;
let deathT = 0;
let deathDelay = 1;
let deathKind = '';
let unlockHinted = false;

const timeScale = () => (P.power?.type === 'hourglass' ? SLOW_FACTOR : 1);

function newRun({ daily = false, menu = false } = {}) {
  isDaily = daily;
  const seed = daily ? hashString('schatz-' + todayKey()) : (Math.random() * 2 ** 32) >>> 0;
  world.reset(seed);
  world.ensure(-14, 36);
  resetPlayer();
  E.active = false;
  eagle.visible = false;
  camRow = 0;
  camX = 0;
  score = 0;
  runFish = 0;
  unlockHinted = false;
  mode = 'ready';
  document.body.classList.remove('slowmo', 'ringfx');
  showScreen(menu ? 'menu' : null);
  $('hud').classList.toggle('hidden', menu);
  $('hint').classList.toggle('hidden', menu);
  $('daily-badge').classList.toggle('hidden', !daily);
  $('power').classList.add('hidden');
  setScore(0);
  updateFish();
  refreshMenu();
}

function startPlaying() {
  mode = 'playing';
  showScreen(null);
  $('hud').classList.remove('hidden');
  $('hint').classList.add('hidden');
}

// ------------------------------------------------------------------ Bewegung

function onMove(dx, dz) {
  sfx.unlock();
  if (mode === 'ready') startPlaying();
  if (mode !== 'playing' || !P.alive) return;
  if (P.hop) {
    if (P.queue.length < 2) P.queue.push([dx, dz]);
    return;
  }
  startHop(dx, dz);
}

function face(dx, dz) {
  P.targetAngle = dz > 0 ? 0 : dz < 0 ? Math.PI : dx < 0 ? Math.PI / 2 : -Math.PI / 2;
}

function bump(dx, dz) {
  P.bump = { t: 0, dx, dz };
  sfx.bump();
}

function snapOffset(log, rel) {
  const half = (log.len - 1) / 2;
  return clamp(Math.round(rel + half), 0, log.len - 1) - half;
}

function startHop(dx, dz) {
  face(dx, dz);
  const toRow = P.row + dz;
  const row = world.row(toRow);
  if (!row) return bump(dx, dz);
  const target = { toRow, toX: 0, toLog: null, toOffset: 0, toPad: null, toY: Y.ground };

  if (row.type === 'river' && row.kind === 'logs') {
    // Auf Baumstämmen bleibt die x-Position fließend.
    if (dz === 0 && P.log) {
      const off = P.logOffset + dx;
      if (Math.abs(off) <= (P.log.len - 1) / 2 + 0.01) {
        target.toLog = P.log;
        target.toOffset = off;
      }
    }
    if (!target.toLog) {
      const x = P.x + dx;
      const found = world.findLog(row, x, HOP_TIME * timeScale());
      if (found) {
        target.toLog = found.log;
        target.toOffset = snapOffset(found.log, x - found.x);
      } else {
        target.toX = x;
        target.toY = Y.water;
      }
    }
  } else {
    const x = Math.round(P.x) + dx;
    if (dz === 0 && Math.abs(x) > COLS) return bump(dx, dz);
    const cx = clamp(x, -COLS, COLS);
    if (row.type === 'grass' && row.blocked.has(cx)) return bump(dx, dz);
    target.toX = cx;
    if (row.type === 'river') {
      target.toPad = row.pads.get(cx) || null;
      target.toY = target.toPad ? Y.pad : Y.water;
    }
  }

  P.hop = { t: 0, fromX: P.x, fromY: P.y, fromRow: P.row, ...target };
  P.log = null;
  P.pad = null;
  sfx.hop();
}

function land() {
  const h = P.hop;
  P.hop = null;
  P.row = h.toRow;
  P.rowF = P.row;
  P.sy = 0.7; // Landungs-Squash
  const row = world.row(P.row);

  if (row.type === 'river') {
    if (row.kind === 'logs') {
      let log = h.toLog;
      let off = h.toOffset;
      if (!log) {
        const found = world.findLog(row, P.x, 0);
        if (found) {
          log = found.log;
          off = snapOffset(log, P.x - found.x);
        }
      }
      if (!log) return die('water');
      P.log = log;
      P.logOffset = off;
      P.x = log.x + off;
      P.y = Y.log;
    } else {
      const pad = row.pads.get(Math.round(P.x));
      if (!pad || pad.sunk) return die('water');
      P.pad = pad;
      P.x = pad.c;
    }
  } else {
    P.y = Y.ground;
  }

  if (P.row > score) setScore(P.row);
  const item = row.items.get(Math.round(P.x));
  if (item && !item.flying && !P.log) collect(row, item);
  if (P.queue.length) {
    const [dx, dz] = P.queue.shift();
    startHop(dx, dz);
  }
}

function updatePlayer(dt) {
  if (P.alive) {
    if (P.hop) {
      const h = P.hop;
      h.t += dt / HOP_TIME;
      const k = Math.min(h.t, 1);
      const tx = h.toLog ? h.toLog.x + h.toOffset : h.toX;
      const ty = h.toLog ? Y.log : h.toPad ? h.toPad.mesh.position.y + Y.pad : h.toY;
      P.x = lerp(h.fromX, tx, k);
      P.rowF = lerp(h.fromRow, h.toRow, k);
      P.y = lerp(h.fromY, ty, k) + Math.sin(k * Math.PI) * HOP_HEIGHT;
      if (k >= 1) land();
    } else {
      if (P.log) P.x = P.log.x + P.logOffset;
      if (P.pad) P.y = P.pad.mesh.position.y + Y.pad;
      P.rowF = P.row;
    }
    // Drehen in Blickrichtung
    let da = P.targetAngle - P.angle;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    P.angle += da * Math.min(1, dt * 22);
    // Squash & Stretch
    const targetSy = P.pressed && !P.hop ? 0.78 : P.hop ? 1.12 : 1;
    P.sy = damp(P.sy, targetSy, 22, dt);
  } else if (P.death === 'squash') {
    P.sy = damp(P.sy, 0.14, 30, dt);
  } else if (P.death === 'sink') {
    P.y -= dt * 1.4;
    if (P.y < -1.2) P.mesh.visible = false;
  }

  let bx = 0;
  let bz = 0;
  if (P.bump) {
    P.bump.t += dt / 0.14;
    const s = Math.sin(Math.min(P.bump.t, 1) * Math.PI) * 0.18;
    bx = P.bump.dx * s;
    bz = -P.bump.dz * s;
    if (P.bump.t >= 1) P.bump = null;
  }

  const sxz = P.death === 'squash' ? 1.45 : 1 + (1 - P.sy) * 0.5;
  P.root.position.set(P.x + bx, P.y, -P.rowF + bz);
  P.pivot.rotation.y = P.angle;
  P.pivot.scale.set(sxz, P.sy, sxz);

  // Ring: fast unsichtbar, kurz vor Ende flackern
  if (P.power?.type === 'ring') {
    const blink = P.power.t < 1.5 && Math.floor(P.power.t * 10) % 2 === 0;
    playerMat.opacity = blink ? 0.8 : 0.3;
  }
}

function checkHazards() {
  const rowIdx = P.hop ? (P.hop.t < 0.5 ? P.hop.fromRow : P.hop.toRow) : P.row;
  const row = world.row(rowIdx);
  const invisible = P.power?.type === 'ring';
  if (row && !invisible) {
    if (row.type === 'road') {
      for (const m of row.movers) if (Math.abs(m.x - P.x) < m.len / 2 + 0.25) return die(m.kind);
    } else if (row.type === 'rail') {
      const t = row.train;
      if (t.state === 'pass' && Math.abs(t.x - P.x) < t.len / 2 + 0.25) return die('train');
    } else if (row.type === 'spikes' && (!P.hop || P.hop.t > 0.7)) {
      const s = row.spikes[Math.round(P.x) + COLS];
      if (s && s.danger) return die('spikes');
    }
  }
  if (P.pad && P.pad.sunk) return die('water');
  if (P.log && Math.abs(P.x) > COLS + 0.9) return die('drift');
  if (P.rowF < camRow - EAGLE_ROWS) return die('eagle');
}

const DEATH_TEXT = {
  car: ['Überfahren!', 'Das Auto war schneller, mein Schatz.'],
  truck: ['Vom Laster erwischt!', 'Große Räder, großes Aua.'],
  train: ['Vom Zug erwischt!', 'Auf das Blinklicht achten!'],
  water: ['Platsch!', 'Nasse Füße, gollum, gollum…'],
  drift: ['Abgetrieben!', 'Der Stamm fuhr ohne dich weiter.'],
  spikes: ['Autsch, Stacheln!', 'Auf den Rhythmus achten.'],
  eagle: ['Vom Adler geschnappt!', 'Nicht so lange trödeln!'],
};

function die(kind) {
  if (!P.alive) return;
  P.alive = false;
  P.hop = null;
  P.queue.length = 0;
  mode = 'dying';
  deathKind = kind;
  deathT = 0;
  deathDelay = kind === 'eagle' ? 1.6 : 1.1;
  P.power = null;
  playerMat.opacity = character.opacity ?? 1;
  document.body.classList.remove('slowmo', 'ringfx');
  $('power').classList.add('hidden');
  const z = -P.rowF;
  if (kind === 'water' || kind === 'drift') {
    P.death = 'sink';
    P.y = Y.water;
    sfx.splash();
    burst(P.x, Y.water + 0.1, z, ['#ffffff', '#b3e5fc', '#4fc3f7'], 22, { speed: 1.8, up: 4.5, size: 0.1 });
    vibrate(60);
  } else if (kind === 'eagle') {
    P.death = 'eagle';
    startEagle();
    sfx.eagle();
    vibrate([40, 40, 40]);
  } else {
    P.death = 'squash';
    P.y = Math.max(0, Math.min(P.y, 0.1));
    sfx.crash();
    burst(P.x, 0.3, z, character.dust, 16, { speed: 3, up: 3.5 });
    vibrate(150);
  }
  persist(save);
}

function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // nicht unterstützt
  }
}

// ------------------------------------------------------------------ Sammeln & Power-ups

function collect(row, item) {
  row.items.delete(item.c);
  row.group.remove(item.mesh);
  const wx = item.c;
  const wz = -row.i;
  if (item.type === 'fish' || item.type === 'goldfish') {
    const value = item.type === 'goldfish' ? 5 : 1;
    save.fish += value;
    runFish += value;
    updateFish(true);
    if (value > 1) sfx.bigCoin();
    else sfx.coin();
    burst(wx, 0.4, wz, value > 1 ? ['#ffca28', '#fff176'] : ['#cfd8dc', '#90a4ae', '#ffffff'], value > 1 ? 14 : 8, { speed: 1.6, up: 2.5, size: 0.08 });
    if (!unlockHinted && cheapestLocked() && save.fish >= cheapestLocked().price) {
      unlockHinted = true;
      toast('Neue Figur freischaltbar! 🎉');
    }
  } else {
    const def = M.POWERS[item.type];
    P.power = { type: item.type, t: def.dur, dur: def.dur };
    sfx.power();
    burst(wx, 0.5, wz, ['#ffd54f', '#ffffff', '#ffecb3'], 20, { speed: 2.2, up: 3, size: 0.09 });
    $('power').classList.remove('hidden');
    $('power-icon').textContent = def.icon;
    $('power-label').textContent = def.label;
    document.body.classList.toggle('slowmo', item.type === 'hourglass');
    document.body.classList.toggle('ringfx', item.type === 'ring');
    if (item.type !== 'ring') playerMat.opacity = character.opacity ?? 1;
    toast(`${def.icon} ${def.label}!`);
  }
}

function updatePower(dt) {
  if (!P.power) return;
  P.power.t -= dt;
  $('power-bar').style.transform = `scaleX(${Math.max(0, P.power.t / P.power.dur)})`;
  if (P.power.type === 'magnet') {
    for (let r = P.row - 1; r <= P.row + 2; r++) {
      const row = world.row(r);
      if (!row) continue;
      for (const it of row.items.values()) {
        if ((it.type === 'fish' || it.type === 'goldfish') && Math.abs(it.c - P.x) <= 2.6) it.flying = true;
      }
    }
  }
  if (P.power.type === 'ring' && Math.random() < dt * 12) {
    burst(P.x + (Math.random() - 0.5) * 0.5, P.y + 0.5, -P.rowF, ['#ffd54f', '#fff8e1'], 1, { speed: 0.3, up: 1, size: 0.06, gravity: 0 });
  }
  if (P.power.t <= 0) {
    P.power = null;
    playerMat.opacity = character.opacity ?? 1;
    $('power').classList.add('hidden');
    document.body.classList.remove('slowmo', 'ringfx');
  }
}

// Vom Magneten angezogene Fische fliegen zum Spieler.
function updateFlyingItems(dt) {
  for (let r = P.row - 2; r <= P.row + 3; r++) {
    const row = world.row(r);
    if (!row) continue;
    for (const it of [...row.items.values()]) {
      if (!it.flying) continue;
      const tx = P.x;
      const ty = P.y + 0.5;
      const tz = -P.rowF + row.i; // lokal zur Reihe
      const p = it.mesh.position;
      p.x = damp(p.x, tx, 10, dt);
      p.y = damp(p.y, ty, 10, dt);
      p.z = damp(p.z, tz, 10, dt);
      it.mesh.rotation.y += dt * 10;
      if (Math.hypot(p.x - tx, p.y - ty, p.z - tz) < 0.35 && P.alive) collect(row, it);
    }
  }
}

// ------------------------------------------------------------------ Kamera

function updateCamera(dt) {
  if (mode === 'playing') camRow += (0.4 + 0.35 * difficulty(score)) * dt;
  if (P.rowF > camRow && P.death !== 'eagle') camRow = damp(camRow, P.rowF, 6, dt);
  if (P.death !== 'eagle') camX = damp(camX, clamp(P.x * 0.45, -1.6, 1.6), 4, dt);
  camTarget.set(camX, 0, -(camRow + LOOK_AHEAD));
  camera.position.copy(camTarget).add(CAM_OFFSET);
  camera.lookAt(camTarget);
  sun.position.copy(camTarget).add(SUN_OFFSET);
  sun.target.position.copy(camTarget);
}

// ------------------------------------------------------------------ Hauptschleife

world.onEvent = (type, row) => {
  if (Math.abs(row.i - P.row) > 8 || mode === 'over') return;
  if (type === 'bell') sfx.bell();
  else if (type === 'horn') sfx.horn();
  else if (type === 'sink' && row.i === P.row) sfx.sink();
};

function update(dt) {
  if (mode === 'playing') updatePower(dt);
  const wdt = dt * timeScale();
  world.update(wdt, dt, P.pad);
  updatePlayer(dt);
  if (mode === 'playing' && P.alive) checkHazards();
  updateFlyingItems(dt);
  updateCamera(dt);
  updateEagle(dt);
  updateParticles(dt);
  if (mode === 'dying') {
    deathT += dt;
    if (deathT > deathDelay) showGameOver();
  }
  const base = Math.floor(camRow);
  world.ensure(base - 14, base + 36);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (mode !== 'paused') update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ Eingabe

const SWIPE = 28;
let touch = null;

window.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary || e.target.closest('.ui')) return;
  touch = { x: e.clientX, y: e.clientY, fired: false };
  P.pressed = true;
});

window.addEventListener('pointermove', (e) => {
  if (!touch || touch.fired || !e.isPrimary) return;
  const dx = e.clientX - touch.x;
  const dy = e.clientY - touch.y;
  if (Math.hypot(dx, dy) < SWIPE) return;
  touch.fired = true;
  P.pressed = false;
  if (Math.abs(dx) > Math.abs(dy)) onMove(Math.sign(dx), 0);
  else onMove(0, dy < 0 ? 1 : -1);
});

window.addEventListener('pointerup', (e) => {
  if (!touch || !e.isPrimary) return;
  const t = touch;
  touch = null;
  P.pressed = false;
  if (!t.fired) onMove(0, 1);
});

window.addEventListener('pointercancel', () => {
  touch = null;
  P.pressed = false;
});

const KEYS = {
  ArrowUp: [0, 1], KeyW: [0, 1], Space: [0, 1],
  ArrowDown: [0, -1], KeyS: [0, -1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (mode === 'playing') pause();
    else if (mode === 'paused') resume();
    return;
  }
  const k = KEYS[e.code];
  if (!k || e.repeat) return;
  e.preventDefault();
  if (mode === 'over' && overArmed && (e.code === 'Space' || e.code === 'ArrowUp')) return again();
  if (!$('shop').classList.contains('hidden')) return;
  onMove(k[0], k[1]);
});

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (mode === 'playing') pause();
    persist(save);
  }
  last = performance.now();
});

// ------------------------------------------------------------------ Oberfläche

const SCREENS = ['menu', 'over', 'pause', 'shop'];
function showScreen(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
}

function setScore(n) {
  score = n;
  const el = $('score');
  el.textContent = n;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  $('top').textContent = `TOP ${Math.max(save.best, n)}`;
}

function updateFish(pop = false) {
  $('fish-count').textContent = save.fish;
  if (pop) {
    const el = $('fish');
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
}

let toastTimer = 0;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('hidden', 'show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

function cheapestLocked() {
  return M.CHARACTERS.filter((c) => !save.owned.includes(c.id)).sort((a, b) => a.price - b.price)[0];
}

function syncDaily() {
  const today = todayKey();
  if (save.daily.date !== today) save.daily = { date: today, best: 0, tries: 0 };
}

function refreshMenu() {
  syncDaily();
  $('menu-best').textContent = save.best;
  $('menu-fish').textContent = save.fish;
  $('daily-info').textContent = save.daily.tries ? `Heute: ${save.daily.best} · ${save.daily.tries}×` : 'Heute noch nicht gespielt';
  const next = cheapestLocked();
  $('shop-dot').classList.toggle('hidden', !(next && save.fish >= next.price));
  $('btn-sound').textContent = save.muted ? '🔇' : '🔊';
}

let overArmed = false;
function showGameOver() {
  mode = 'over';
  const record = score > save.best;
  if (record) save.best = score;
  save.games++;
  if (isDaily) {
    syncDaily();
    save.daily.tries++;
    save.daily.best = Math.max(save.daily.best, score);
  }
  persist(save);
  const [title, sub] = DEATH_TEXT[deathKind] || DEATH_TEXT.car;
  $('over-title').textContent = title;
  $('over-sub').textContent = record && score > 0 ? 'Mein Schaaatz! Neuer Rekord!' : sub;
  $('over-record').classList.toggle('hidden', !(record && score > 0));
  $('over-score').textContent = score;
  $('over-best').textContent = save.best;
  $('over-fish').textContent = `+${runFish}`;
  $('over-daily').classList.toggle('hidden', !isDaily);
  $('over-daily').textContent = `📅 Tages-Challenge · Bestwert heute: ${save.daily.best} (${save.daily.tries}×)`;
  const next = cheapestLocked();
  $('over-shop-dot').classList.toggle('hidden', !(next && save.fish >= next.price));
  showScreen('over');
  $('hud').classList.add('hidden');
  if (record && score > 0) sfx.record();
  overArmed = false;
  $('over').classList.add('disarmed');
  setTimeout(() => {
    overArmed = true;
    $('over').classList.remove('disarmed');
  }, 450);
}

function again() {
  sfx.click();
  newRun({ daily: isDaily });
}

function pause() {
  if (mode !== 'playing') return;
  pausedFrom = mode;
  mode = 'paused';
  P.pressed = false;
  touch = null;
  showScreen('pause');
}

function resume() {
  if (mode !== 'paused') return;
  mode = pausedFrom || 'playing';
  showScreen(null);
  last = performance.now();
}

function on(id, fn) {
  $(id).addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.unlock();
    fn();
  });
}

on('btn-again', () => overArmed && again());
on('btn-menu', () => {
  if (!overArmed) return;
  sfx.click();
  newRun({ menu: true });
});
on('btn-shop', () => openShop());
on('btn-shop2', () => overArmed && openShop());
on('btn-daily', () => {
  sfx.click();
  newRun({ daily: true });
});
on('btn-sound', () => {
  save.muted = !save.muted;
  sfx.muted = save.muted;
  persist(save);
  refreshMenu();
  sfx.click();
});
on('pause-btn', () => pause());
on('btn-resume', () => resume());
on('btn-quit', () => {
  sfx.click();
  persist(save);
  newRun({ menu: true });
});
on('shop-close', () => closeShop());

// ------------------------------------------------------------------ Figuren-Shop

let shopReturn = null;
let thumbs = null;

function makeThumbs() {
  const out = {};
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(160, 160);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight('#ffffff', '#8a8a8a', 1.8));
    const d = new THREE.DirectionalLight('#ffffff', 2);
    d.position.set(-2, 4, -3);
    sc.add(d);
    const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 20);
    cam.position.set(1.7, 1.6, -3.2);
    cam.lookAt(0, 0.48, 0);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true });
    for (const c of M.CHARACTERS) {
      const mesh = new THREE.Mesh(M.characterGeometry(c.id), mat);
      mat.opacity = c.opacity ?? 1;
      sc.add(mesh);
      r.render(sc, cam);
      out[c.id] = r.domElement.toDataURL('image/png');
      sc.remove(mesh);
    }
    mat.dispose();
    r.dispose();
    r.forceContextLoss();
  } catch {
    // Ohne Vorschaubilder geht es auch.
  }
  return out;
}

function openShop() {
  sfx.click();
  shopReturn = SCREENS.find((s) => !$(s).classList.contains('hidden')) || null;
  if (!thumbs) thumbs = makeThumbs();
  renderShop();
  showScreen('shop');
}

function closeShop() {
  sfx.click();
  showScreen(shopReturn);
  refreshMenu();
  if (shopReturn === 'over') {
    const next = cheapestLocked();
    $('over-shop-dot').classList.toggle('hidden', !(next && save.fish >= next.price));
  }
}

function renderShop() {
  $('shop-fish').textContent = save.fish;
  const grid = $('shop-grid');
  grid.innerHTML = '';
  for (const c of M.CHARACTERS) {
    const owned = save.owned.includes(c.id);
    const selected = save.selected === c.id;
    const card = document.createElement('div');
    card.className = 'card' + (selected ? ' selected' : '') + (owned ? '' : ' locked');
    const img = document.createElement('div');
    img.className = 'thumb';
    if (thumbs[c.id]) img.style.backgroundImage = `url(${thumbs[c.id]})`;
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = c.name;
    const btn = document.createElement('button');
    btn.className = 'btn small';
    if (selected) {
      btn.textContent = 'Gewählt ✓';
      btn.disabled = true;
    } else if (owned) {
      btn.textContent = 'Wählen';
      btn.onclick = () => {
        save.selected = c.id;
        persist(save);
        setCharacter(c.id);
        sfx.click();
        renderShop();
      };
    } else {
      btn.textContent = `🐟 ${c.price}`;
      btn.disabled = save.fish < c.price;
      btn.onclick = () => {
        if (save.fish < c.price) return;
        save.fish -= c.price;
        save.owned.push(c.id);
        save.selected = c.id;
        persist(save);
        setCharacter(c.id);
        updateFish();
        sfx.buy();
        toast(`${c.name} freigeschaltet!`);
        renderShop();
      };
    }
    card.append(img, name, btn);
    grid.append(card);
  }
}

// ------------------------------------------------------------------ Start

syncDaily();
const today = todayKey();
if (save.bonusDate !== today) {
  const first = !save.bonusDate;
  save.bonusDate = today;
  save.fish += 20;
  persist(save);
  setTimeout(() => toast(first ? 'Willkommen! Startgeschenk: +20 🐟' : 'Täglicher Bonus: +20 🐟'), 600);
}

newRun({ menu: true });
requestAnimationFrame(frame);

// Nur zum Testen: mit ?debug in der URL sind Welt und Spieler in der Konsole erreichbar.
if (new URLSearchParams(location.search).has('debug')) {
  window.__debug = {
    world,
    P,
    save,
    get mode() { return mode; },
    get camRow() { return camRow; },
    set camRow(v) { camRow = v; },
    teleport(row) {
      world.ensure(row - 14, row + 36);
      Object.assign(P, { row, rowF: row, x: 0, y: 0, log: null, pad: null, hop: null });
      camRow = row;
      if (P.row > score) setScore(row);
    },
  };
}

if ('serviceWorker' in navigator && window.isSecureContext && window.top === window.self) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
