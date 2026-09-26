import * as THREE from 'three';

// Höhen in der Welt
export const WATER_HIGH = 0;
export const WATER_LOW = -0.32;
export const BED = -0.75;
export const LAND_TOP = 0.25;
export const SAND_TOP = -0.14;
export const PIECE_TOP = 0.21;

export const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

export const scene = new THREE.Scene();
const FOG = new THREE.Color('#9fd6d8');
scene.background = FOG;
scene.fog = new THREE.Fog(FOG, 16, 34);

scene.add(new THREE.HemisphereLight('#fff4ec', '#8fbfd6', 1.25));
export const sun = new THREE.DirectionalLight('#ffe6cc', 1.75);
sun.position.set(-4, 10, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.radius = 4;
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
scene.add(sun, sun.target);

export const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

// ------------------------------------------------------------------ Wasser

const waterGeo = new THREE.PlaneGeometry(140, 140, 70, 70);
waterGeo.rotateX(-Math.PI / 2);
const waterBase = waterGeo.attributes.position.array.slice();
const waterMat = new THREE.MeshPhongMaterial({
  color: '#5fc1cc',
  transparent: true,
  opacity: 0.72,
  shininess: 70,
  specular: '#ffffff',
  flatShading: true,
});
const waterMesh = new THREE.Mesh(waterGeo, waterMat);
waterMesh.receiveShadow = true;
scene.add(waterMesh);

const bed = new THREE.Mesh(new THREE.PlaneGeometry(140, 140).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#d9c79c' }));
bed.position.y = BED;
bed.receiveShadow = true;
scene.add(bed);

export const water = { level: WATER_HIGH, target: WATER_HIGH };

function updateWater(dt, t) {
  water.level += (water.target - water.level) * (1 - Math.exp(-dt * 2.2));
  const pos = waterGeo.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = waterBase[i];
    const z = waterBase[i + 2];
    pos[i + 1] = water.level + Math.sin(x * 0.9 + t * 1.1) * 0.022 + Math.cos(z * 1.1 + t * 0.8) * 0.022;
  }
  waterGeo.attributes.position.needsUpdate = true;
}

// ------------------------------------------------------------------ Kamera

const tmpV = new THREE.Vector3();
let fitState = null;

// Kamera so setzen, dass der Kasten vollständig in den freien Bildbereich passt.
export function fitCamera(box, opt = {}) {
  fitState = { box, opt };
  applyFit();
}

function applyFit() {
  if (!fitState) return;
  const { box, opt } = fitState;
  const { top = 0.14, bottom = 0.2, side = 0.05, elev = 0.98, yaw = 0 } = opt;
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const cx = (box.minX + box.maxX) / 2;
  const cz = (box.minZ + box.maxZ) / 2;
  const target = new THREE.Vector3(cx, 0, cz);
  const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(elev), Math.sin(elev), Math.cos(yaw) * Math.cos(elev));
  const corners = [];
  for (const x of [box.minX, box.maxX]) for (const z of [box.minZ, box.maxZ]) for (const y of [box.minY ?? 0, box.maxY ?? 0.8]) corners.push(new THREE.Vector3(x, y, z));
  const bandW = 2 - side * 4;
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
  let hi = 80;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const e = extent(mid);
    if (e.x1 - e.x0 <= bandW && e.y1 - e.y0 <= bandH) hi = mid;
    else lo = mid;
  }
  const e = extent(hi);
  // Nebel beginnt erst hinter dem Brett, egal wie weit die Kamera weg ist
  scene.fog.near = hi + 4;
  scene.fog.far = hi + 30;
  const wantY = bottom - top;
  const haveY = (e.y0 + e.y1) / 2;
  const haveX = (e.x0 + e.x1) / 2;
  // Bildausschnitt verschieben: positives y schiebt den Inhalt nach oben.
  camera.setViewOffset(w, h, (haveX * w) / 2, ((wantY - haveY) * h) / 2, w, h);
  camera.updateProjectionMatrix();
  sun.target.position.copy(target);
  sun.position.copy(target).add(new THREE.Vector3(-4, 10, 5));
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  applyFit();
});
renderer.setSize(window.innerWidth, window.innerHeight, false);

// Bildschirmpunkt → Punkt auf einer waagrechten Ebene
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
export function rayFrom(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster;
}
export function groundPoint(clientX, clientY, y = 0.15) {
  const ray = rayFrom(clientX, clientY).ray;
  if (Math.abs(ray.direction.y) < 1e-6) return null;
  const t = (y - ray.origin.y) / ray.direction.y;
  if (t < 0) return null;
  return ray.origin.clone().addScaledVector(ray.direction, t);
}

export function toScreen(v) {
  tmpV.copy(v).project(camera);
  return { x: ((tmpV.x + 1) / 2) * window.innerWidth, y: ((1 - tmpV.y) / 2) * window.innerHeight, visible: tmpV.z < 1 };
}

// ------------------------------------------------------------------ Animationen

const anims = [];
export function animate(dur, fn, done) {
  const a = { t: 0, dur, fn, done };
  anims.push(a);
  fn(0);
  return a;
}
export const ease = {
  out: (k) => 1 - (1 - k) ** 3,
  inOut: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2),
  back: (k) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2,
};

// ------------------------------------------------------------------ Partikel

const PMAX = 200;
const partMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), PMAX);
partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
partMesh.frustumCulled = false;
scene.add(partMesh);
const parts = Array.from({ length: PMAX }, () => ({ life: 0, shown: false }));
const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const EU = new THREE.Euler();
const P3 = new THREE.Vector3();
const S3 = new THREE.Vector3();
const C = new THREE.Color();
for (let i = 0; i < PMAX; i++) {
  partMesh.setMatrixAt(i, M4.makeScale(0, 0, 0));
  partMesh.setColorAt(i, C.set('#ffffff'));
}
let pNext = 0;

export function burst(pos, colors, n, o = {}) {
  for (let k = 0; k < n; k++) {
    const i = pNext;
    pNext = (pNext + 1) % PMAX;
    const a = Math.random() * Math.PI * 2;
    const sp = (o.speed ?? 1.5) * (0.4 + Math.random() * 0.8);
    Object.assign(parts[i], {
      life: (o.life ?? 0.8) * (0.6 + Math.random() * 0.6),
      x: pos.x, y: pos.y, z: pos.z,
      vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: (o.up ?? 2) * (0.5 + Math.random()),
      s: (o.size ?? 0.07) * (0.6 + Math.random() * 0.8),
      g: o.gravity ?? 6, r: Math.random() * 6, shown: true,
    });
    partMesh.setColorAt(i, C.set(colors[k % colors.length]));
  }
  partMesh.instanceColor.needsUpdate = true;
}

function updateParticles(dt) {
  let dirty = false;
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i];
    if (p.life <= 0) {
      if (p.shown) {
        partMesh.setMatrixAt(i, M4.makeScale(0, 0, 0));
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
    p.r += dt * 4;
    const s = p.s * Math.min(1, p.life / 0.25);
    Q.setFromEuler(EU.set(p.r, p.r * 0.7, 0));
    partMesh.setMatrixAt(i, M4.compose(P3.set(p.x, p.y, p.z), Q, S3.set(s, s, s)));
    dirty = true;
  }
  if (dirty) partMesh.instanceMatrix.needsUpdate = true;
}

// ------------------------------------------------------------------ Schleife

const updaters = new Set();
export function onUpdate(fn) {
  updaters.add(fn);
  return () => updaters.delete(fn);
}

let last = performance.now();
let speed = 1; // nur für Tests schneller
export const setSpeed = (v) => (speed = v);
export let time = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000) * speed;
  last = now;
  time += dt;
  updateWater(dt, time);
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
  for (const fn of updaters) fn(dt, time);
  updateParticles(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  last = performance.now();
});
