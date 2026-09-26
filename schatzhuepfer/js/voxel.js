import * as THREE from 'three';

// Ein gemeinsames Material für alles: Farben stecken in den Vertices.
export const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });

// Jede Fläche: Normale n und zwei Achsen u, v mit u × v = n (gegen den Uhrzeigersinn von außen).
const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
];
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const tmpColor = new THREE.Color();

/**
 * Baut aus vielen Quadern eine einzige Geometrie mit Vertex-Farben.
 * Box-Format: { p: [x, y, z], s: [breite, höhe, tiefe], c: '#farbe' }
 * Unterseiten werden weggelassen, weil die Kamera immer von oben schaut.
 */
export function boxGeometry(boxes, bottom = false) {
  const pos = [];
  const nor = [];
  const col = [];
  const idx = [];
  for (const box of boxes) {
    const c = box.p;
    const h = [box.s[0] / 2, box.s[1] / 2, box.s[2] / 2];
    tmpColor.set(box.c);
    for (const f of FACES) {
      if (!bottom && f.n[1] === -1) continue;
      const base = pos.length / 3;
      for (const [su, sv] of CORNERS) {
        for (let a = 0; a < 3; a++) pos.push(c[a] + (f.n[a] + f.u[a] * su + f.v[a] * sv) * h[a]);
        nor.push(f.n[0], f.n[1], f.n[2]);
        col.push(tmpColor.r, tmpColor.g, tmpColor.b);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

// Geometrien, die oft vorkommen (Autos, Stämme, Figuren …), nur einmal bauen.
const cache = new Map();
export function geo(key, build) {
  let g = cache.get(key);
  if (!g) {
    g = boxGeometry(build());
    cache.set(key, g);
  }
  return g;
}

export function voxMesh(geometry, { cast = true, receive = false, material = MAT } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
