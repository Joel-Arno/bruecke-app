import * as THREE from 'three';
import { geo, voxMesh } from './voxel.js';

// Kurzform für einen Quader: Mitte (x, y, z), Größe (w, h, d), Farbe.
export const b = (x, y, z, w, h, d, c) => ({ p: [x, y, z], s: [w, h, d], c });
export const shift = (boxes, dx, dy, dz) =>
  boxes.map((q) => ({ ...q, p: [q.p[0] + dx, q.p[1] + dy, q.p[2] + dz] }));

// ---------------------------------------------------------------- Umgebung

export const LEAF = ['#4caf50', '#43a047', '#66bb6a', '#388e3c'];

export function treeBoxes(x, z, h, leaf) {
  return [
    b(x, 0.15, z, 0.28, 0.3, 0.28, '#7b5431'),
    b(x, 0.3 + h / 2, z, 0.78, h, 0.78, leaf),
    b(x, 0.3 + h - 0.06, z, 0.8, 0.12, 0.8, leaf === '#388e3c' ? '#43a047' : '#5cb860'),
  ];
}

export function rockBoxes(x, z) {
  return [
    b(x, 0.17, z, 0.66, 0.34, 0.58, '#9e9e9e'),
    b(x - 0.05, 0.37, z + 0.03, 0.42, 0.08, 0.36, '#bdbdbd'),
  ];
}

export function stumpBoxes(x, z) {
  return [b(x, 0.12, z, 0.42, 0.24, 0.42, '#8d6e63'), b(x, 0.245, z, 0.34, 0.01, 0.34, '#d7b899')];
}

export function decorBoxes(x, z, r) {
  const ox = (r() - 0.5) * 0.6;
  const oz = (r() - 0.5) * 0.6;
  if (r() < 0.6) {
    return [
      b(x + ox, 0.05, z + oz, 0.07, 0.1, 0.07, '#6fb63a'),
      b(x + ox + 0.08, 0.04, z + oz + 0.03, 0.07, 0.08, 0.07, '#6fb63a'),
    ];
  }
  const petals = ['#ff7043', '#fff176', '#f48fb1', '#ffffff', '#ce93d8'];
  return [
    b(x + ox, 0.06, z + oz, 0.03, 0.12, 0.03, '#558b2f'),
    b(x + ox, 0.14, z + oz, 0.1, 0.06, 0.1, petals[Math.floor(r() * petals.length)]),
  ];
}

// ---------------------------------------------------------------- Fahrzeuge (Front zeigt nach +x)

export const CAR_LEN = 1.5;
export function carBoxes(color) {
  const glass = '#b3e5fc';
  const boxes = [
    b(0, 0.32, 0, 1.5, 0.34, 0.8, color),
    b(-0.12, 0.62, 0, 0.8, 0.28, 0.72, color),
    b(-0.12, 0.765, 0, 0.7, 0.01, 0.62, '#ffffff'),
    b(0.29, 0.62, 0, 0.02, 0.2, 0.6, glass),
    b(-0.53, 0.62, 0, 0.02, 0.2, 0.6, glass),
    b(-0.12, 0.63, 0.365, 0.62, 0.18, 0.02, glass),
    b(-0.12, 0.63, -0.365, 0.62, 0.18, 0.02, glass),
    b(0.76, 0.34, 0.26, 0.02, 0.1, 0.14, '#fff59d'),
    b(0.76, 0.34, -0.26, 0.02, 0.1, 0.14, '#fff59d'),
    b(-0.76, 0.36, 0.26, 0.02, 0.08, 0.14, '#e53935'),
    b(-0.76, 0.36, -0.26, 0.02, 0.08, 0.14, '#e53935'),
  ];
  for (const wx of [0.45, -0.45]) for (const wz of [0.37, -0.37]) boxes.push(b(wx, 0.14, wz, 0.3, 0.28, 0.1, '#263238'));
  return boxes;
}

export const TRUCK_LEN = 2.6;
export function truckBoxes(color, cargo) {
  const glass = '#b3e5fc';
  const boxes = [
    b(0, 0.22, 0, 2.6, 0.14, 0.74, '#37474f'),
    b(0.95, 0.55, 0, 0.7, 0.72, 0.8, color),
    b(1.305, 0.68, 0, 0.02, 0.24, 0.66, glass),
    b(1.0, 0.7, 0.405, 0.4, 0.2, 0.02, glass),
    b(1.0, 0.7, -0.405, 0.4, 0.2, 0.02, glass),
    b(1.305, 0.35, 0.28, 0.02, 0.1, 0.12, '#fff59d'),
    b(1.305, 0.35, -0.28, 0.02, 0.1, 0.12, '#fff59d'),
    b(-0.35, 0.68, 0, 1.85, 0.95, 0.84, cargo),
    b(-0.35, 0.55, 0.425, 1.85, 0.1, 0.01, color),
    b(-0.35, 0.55, -0.425, 1.85, 0.1, 0.01, color),
  ];
  for (const wx of [0.95, -0.1, -0.85]) for (const wz of [0.38, -0.38]) boxes.push(b(wx, 0.15, wz, 0.32, 0.3, 0.1, '#263238'));
  return boxes;
}

const TRAIN_CAR = 2.8;
const TRAIN_GAP = 0.12;
export const trainLength = (wagons) => TRAIN_CAR * (wagons + 1) + TRAIN_GAP * wagons;

export function trainBoxes(color, wagons) {
  const boxes = [];
  const glass = '#b3e5fc';
  const wheels = (cx) => {
    for (const wx of [0.9, -0.9]) for (const wz of [0.33, -0.33]) boxes.push(b(cx + wx, 0.14, wz, 0.4, 0.28, 0.12, '#263238'));
  };
  // Lok (Front bei x = 0)
  const lc = -TRAIN_CAR / 2;
  boxes.push(
    b(lc, 0.64, 0, TRAIN_CAR, 0.92, 0.86, color),
    b(lc, 1.13, 0, TRAIN_CAR - 0.3, 0.06, 0.7, '#cfd8dc'),
    b(0.01, 0.84, 0, 0.02, 0.26, 0.64, glass),
    b(0.01, 0.42, 0, 0.02, 0.12, 0.24, '#fff59d'),
    b(0.08, 0.2, 0, 0.14, 0.12, 0.8, '#455a64'),
    b(lc, 0.44, 0.435, TRAIN_CAR, 0.1, 0.01, '#fdd835'),
    b(lc, 0.44, -0.435, TRAIN_CAR, 0.1, 0.01, '#fdd835'),
    b(lc + 0.8, 0.84, 0.435, 0.6, 0.24, 0.01, glass),
    b(lc + 0.8, 0.84, -0.435, 0.6, 0.24, 0.01, glass),
  );
  wheels(lc);
  for (let k = 1; k <= wagons; k++) {
    const c = -k * (TRAIN_CAR + TRAIN_GAP) - TRAIN_CAR / 2;
    boxes.push(
      b(c, 0.63, 0, TRAIN_CAR, 0.88, 0.86, '#eceff1'),
      b(c, 1.1, 0, TRAIN_CAR - 0.2, 0.06, 0.74, '#b0bec5'),
      b(c, 0.44, 0.435, TRAIN_CAR, 0.1, 0.01, color),
      b(c, 0.44, -0.435, TRAIN_CAR, 0.1, 0.01, color),
    );
    for (const wx of [-0.95, -0.32, 0.32, 0.95]) {
      boxes.push(b(c + wx, 0.82, 0.435, 0.44, 0.24, 0.01, '#90caf9'));
      boxes.push(b(c + wx, 0.82, -0.435, 0.44, 0.24, 0.01, '#90caf9'));
    }
    wheels(c);
  }
  return shift(boxes, trainLength(wagons) / 2, 0, 0);
}

// ---------------------------------------------------------------- Wasser

export function logBoxes(len) {
  const L = len - 0.06;
  return [
    b(0, -0.1, 0, L, 0.36, 0.78, '#8d5a2b'),
    b(0, 0.085, -0.18, L - 0.3, 0.01, 0.08, '#6d4320'),
    b(0.2, 0.085, 0.16, L - 0.8, 0.01, 0.07, '#6d4320'),
    b(L / 2 + 0.01, -0.1, 0, 0.02, 0.28, 0.66, '#d7a86e'),
    b(-L / 2 - 0.01, -0.1, 0, 0.02, 0.28, 0.66, '#d7a86e'),
  ];
}

export function padBoxes(wobbly) {
  if (wobbly) {
    return [
      b(0, -0.25, 0, 0.78, 0.05, 0.78, '#a5c95a'),
      b(0.15, -0.224, 0.1, 0.2, 0.01, 0.16, '#8d6e3f'),
      b(-0.2, -0.224, -0.15, 0.14, 0.01, 0.12, '#8d6e3f'),
    ];
  }
  return [
    b(0, -0.25, 0, 0.78, 0.05, 0.78, '#43a047'),
    b(0.25, -0.224, -0.25, 0.22, 0.01, 0.22, '#5cc6f2'),
    b(-0.2, -0.2, 0.18, 0.12, 0.05, 0.12, '#f48fb1'),
    b(-0.2, -0.17, 0.18, 0.05, 0.02, 0.05, '#fff176'),
  ];
}

// ---------------------------------------------------------------- Stachelfalle

export function spikeBoxes() {
  const boxes = [b(0, 0.02, 0, 0.7, 0.04, 0.7, '#78909c')];
  for (const sx of [-0.18, 0.18]) {
    for (const sz of [-0.18, 0.18]) {
      boxes.push(b(sx, 0.17, sz, 0.12, 0.28, 0.12, '#b0bec5'));
      boxes.push(b(sx, 0.35, sz, 0.06, 0.1, 0.06, '#eceff1'));
    }
  }
  return boxes;
}

// ---------------------------------------------------------------- Sammelsachen

function fishBoxes(golden) {
  const body = golden ? '#ffca28' : '#4fa3e0';
  const belly = golden ? '#fff176' : '#e3f2fd';
  const fin = golden ? '#ff8f00' : '#1e6fb8';
  return [
    b(0, 0, 0, 0.36, 0.2, 0.1, body),
    b(0.02, -0.06, 0, 0.3, 0.06, 0.11, belly),
    b(-0.23, 0, 0, 0.1, 0.24, 0.06, fin),
    b(0, 0.12, 0, 0.14, 0.05, 0.05, fin),
    b(0.12, 0.03, 0.055, 0.04, 0.04, 0.01, '#111111'),
    b(0.12, 0.03, -0.055, 0.04, 0.04, 0.01, '#111111'),
  ];
}

function hourglassBoxes() {
  const glass = '#b3e5fc';
  return [
    b(0, 0.2, 0, 0.34, 0.05, 0.34, '#8d6e63'),
    b(0, -0.2, 0, 0.34, 0.05, 0.34, '#8d6e63'),
    b(0, 0.1, 0, 0.22, 0.16, 0.22, glass),
    b(0, -0.1, 0, 0.22, 0.16, 0.22, glass),
    b(0, 0, 0, 0.08, 0.06, 0.08, glass),
    b(0, -0.12, 0, 0.18, 0.1, 0.18, '#ffd54f'),
    b(0.14, 0, 0.14, 0.03, 0.36, 0.03, '#6d4c41'),
    b(-0.14, 0, 0.14, 0.03, 0.36, 0.03, '#6d4c41'),
    b(0.14, 0, -0.14, 0.03, 0.36, 0.03, '#6d4c41'),
    b(-0.14, 0, -0.14, 0.03, 0.36, 0.03, '#6d4c41'),
  ];
}

function magnetBoxes() {
  return [
    b(-0.13, -0.02, 0, 0.1, 0.3, 0.12, '#e53935'),
    b(0.13, -0.02, 0, 0.1, 0.3, 0.12, '#e53935'),
    b(0, 0.13, 0, 0.36, 0.1, 0.12, '#e53935'),
    b(-0.13, -0.2, 0, 0.1, 0.08, 0.12, '#eceff1'),
    b(0.13, -0.2, 0, 0.1, 0.08, 0.12, '#eceff1'),
  ];
}

const ringGeo = new THREE.TorusGeometry(0.2, 0.06, 8, 24);
const goldMat = new THREE.MeshPhongMaterial({ color: '#ffc62b', emissive: '#7a5200', shininess: 90, specular: '#fff3c4' });

export const POWERS = {
  ring: { icon: '💍', label: 'Unsichtbar', dur: 6 },
  hourglass: { icon: '⏳', label: 'Zeitlupe', dur: 6 },
  magnet: { icon: '🧲', label: 'Fisch-Magnet', dur: 10 },
};

export function itemMesh(type) {
  if (type === 'ring') {
    const m = new THREE.Mesh(ringGeo, goldMat);
    m.castShadow = true;
    const g = new THREE.Group();
    g.add(m);
    return g;
  }
  let mesh;
  if (type === 'fish') mesh = voxMesh(geo('fish', () => fishBoxes(false)));
  else if (type === 'goldfish') mesh = voxMesh(geo('goldfish', () => fishBoxes(true)));
  else if (type === 'hourglass') mesh = voxMesh(geo('hourglass', hourglassBoxes));
  else mesh = voxMesh(geo('magnet', magnetBoxes));
  if (type === 'fish' || type === 'goldfish') mesh.scale.setScalar(1.5);
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

// ---------------------------------------------------------------- Adler (fliegt Richtung +z)

export function eagleBody() {
  return [
    b(0, 0, 0, 0.5, 0.4, 1.0, '#6d4c2f'),
    b(0, 0.1, 0.6, 0.38, 0.38, 0.38, '#fafafa'),
    b(0, 0.04, 0.86, 0.14, 0.12, 0.16, '#ffc107'),
    b(0, -0.02, 0.92, 0.1, 0.06, 0.06, '#ff8f00'),
    b(0.195, 0.16, 0.66, 0.01, 0.07, 0.07, '#111111'),
    b(-0.195, 0.16, 0.66, 0.01, 0.07, 0.07, '#111111'),
    b(0, 0, -0.62, 0.42, 0.06, 0.3, '#fafafa'),
    b(0.12, -0.28, 0.2, 0.08, 0.18, 0.08, '#ffc107'),
    b(-0.12, -0.28, 0.2, 0.08, 0.18, 0.08, '#ffc107'),
  ];
}

export function eagleWing(side) {
  return [
    b(side * 0.6, 0, 0, 1.2, 0.08, 0.6, '#5d4037'),
    b(side * 1.3, 0, -0.05, 0.3, 0.07, 0.48, '#4e342e'),
  ];
}

// ---------------------------------------------------------------- Figuren (Blick nach -z)

function gollum(skin, dark, cloth) {
  const eye = '#e9f3ff';
  const pupil = '#1b1b1b';
  return [
    // Füße und Beine
    b(-0.12, 0.03, -0.05, 0.14, 0.06, 0.24, skin),
    b(0.12, 0.03, -0.05, 0.14, 0.06, 0.24, skin),
    b(-0.12, 0.15, 0.02, 0.09, 0.2, 0.09, dark),
    b(0.12, 0.15, 0.02, 0.09, 0.2, 0.09, dark),
    // Lendenschurz
    b(0, 0.28, 0.02, 0.32, 0.1, 0.24, cloth),
    // dürrer Oberkörper mit Rippen
    b(0, 0.44, 0, 0.28, 0.26, 0.2, skin),
    b(0, 0.4, -0.105, 0.18, 0.015, 0.01, dark),
    b(0, 0.45, -0.105, 0.2, 0.015, 0.01, dark),
    b(0, 0.5, -0.105, 0.18, 0.015, 0.01, dark),
    // lange Arme
    b(-0.19, 0.41, -0.06, 0.07, 0.28, 0.07, skin),
    b(0.19, 0.41, -0.06, 0.07, 0.28, 0.07, skin),
    b(-0.19, 0.25, -0.08, 0.09, 0.06, 0.11, dark),
    b(0.19, 0.25, -0.08, 0.09, 0.06, 0.11, dark),
    // großer Kopf
    b(0, 0.74, -0.06, 0.44, 0.38, 0.4, skin),
    b(-0.26, 0.77, -0.02, 0.08, 0.15, 0.1, dark),
    b(0.26, 0.77, -0.02, 0.08, 0.15, 0.1, dark),
    // riesige Glubschaugen
    b(-0.12, 0.79, -0.25, 0.17, 0.16, 0.06, eye),
    b(0.12, 0.79, -0.25, 0.17, 0.16, 0.06, eye),
    b(-0.1, 0.78, -0.285, 0.08, 0.09, 0.01, pupil),
    b(0.1, 0.78, -0.285, 0.08, 0.09, 0.01, pupil),
    // Mund mit einem Zahn
    b(0, 0.63, -0.265, 0.16, 0.03, 0.01, '#5a3a3a'),
    b(0.04, 0.615, -0.268, 0.03, 0.03, 0.01, '#f2eed8'),
    // ein paar Haare
    b(-0.08, 0.96, 0.02, 0.03, 0.07, 0.03, '#3b3530'),
    b(0.05, 0.96, 0.08, 0.03, 0.08, 0.03, '#3b3530'),
    b(0.13, 0.95, -0.04, 0.03, 0.05, 0.03, '#3b3530'),
  ];
}

function chicken() {
  return [
    b(-0.1, 0.09, 0, 0.06, 0.18, 0.06, '#ff9800'),
    b(0.1, 0.09, 0, 0.06, 0.18, 0.06, '#ff9800'),
    b(0, 0.4, 0.02, 0.5, 0.44, 0.55, '#ffffff'),
    b(0, 0.72, -0.1, 0.4, 0.36, 0.3, '#ffffff'),
    b(0, 0.95, -0.1, 0.1, 0.14, 0.22, '#e53935'),
    b(0, 0.72, -0.3, 0.14, 0.1, 0.12, '#ff9800'),
    b(0, 0.61, -0.27, 0.08, 0.1, 0.06, '#e53935'),
    b(0.2, 0.78, -0.15, 0.02, 0.06, 0.06, '#111111'),
    b(-0.2, 0.78, -0.15, 0.02, 0.06, 0.06, '#111111'),
    b(0.27, 0.42, 0.05, 0.06, 0.22, 0.3, '#eeeeee'),
    b(-0.27, 0.42, 0.05, 0.06, 0.22, 0.3, '#eeeeee'),
    b(0, 0.56, 0.32, 0.3, 0.2, 0.1, '#ffffff'),
  ];
}

function frog() {
  return [
    b(0, 0.2, 0, 0.6, 0.34, 0.6, '#4caf50'),
    b(0, 0.45, -0.12, 0.55, 0.2, 0.34, '#4caf50'),
    b(0.18, 0.6, -0.18, 0.17, 0.16, 0.17, '#ffffff'),
    b(-0.18, 0.6, -0.18, 0.17, 0.16, 0.17, '#ffffff'),
    b(0.18, 0.6, -0.27, 0.07, 0.09, 0.01, '#111111'),
    b(-0.18, 0.6, -0.27, 0.07, 0.09, 0.01, '#111111'),
    b(0, 0.4, -0.295, 0.4, 0.03, 0.01, '#8e2c2c'),
    b(0, 0.22, -0.305, 0.4, 0.2, 0.01, '#aed581'),
    b(0.32, 0.08, 0.1, 0.16, 0.16, 0.36, '#388e3c'),
    b(-0.32, 0.08, 0.1, 0.16, 0.16, 0.36, '#388e3c'),
    b(0.2, 0.03, -0.27, 0.1, 0.06, 0.14, '#388e3c'),
    b(-0.2, 0.03, -0.27, 0.1, 0.06, 0.14, '#388e3c'),
  ];
}

function duck() {
  return [
    b(0.12, 0.03, -0.06, 0.14, 0.05, 0.2, '#ff9800'),
    b(-0.12, 0.03, -0.06, 0.14, 0.05, 0.2, '#ff9800'),
    b(0, 0.3, 0.03, 0.5, 0.4, 0.6, '#ffd43b'),
    b(0, 0.66, -0.12, 0.36, 0.34, 0.34, '#ffd43b'),
    b(0, 0.6, -0.36, 0.26, 0.08, 0.18, '#ff9800'),
    b(0.18, 0.72, -0.18, 0.02, 0.06, 0.06, '#111111'),
    b(-0.18, 0.72, -0.18, 0.02, 0.06, 0.06, '#111111'),
    b(0.27, 0.32, 0.05, 0.06, 0.22, 0.36, '#f5c518'),
    b(-0.27, 0.32, 0.05, 0.06, 0.22, 0.36, '#f5c518'),
    b(0, 0.46, 0.36, 0.2, 0.12, 0.1, '#ffd43b'),
  ];
}

function penguin() {
  return [
    b(0.1, 0.025, -0.08, 0.16, 0.05, 0.2, '#ff9800'),
    b(-0.1, 0.025, -0.08, 0.16, 0.05, 0.2, '#ff9800'),
    b(0, 0.35, 0, 0.5, 0.6, 0.45, '#263238'),
    b(0, 0.33, -0.235, 0.36, 0.44, 0.02, '#fafafa'),
    b(0, 0.8, -0.02, 0.42, 0.3, 0.4, '#263238'),
    b(0, 0.78, -0.225, 0.3, 0.18, 0.02, '#fafafa'),
    b(0.08, 0.82, -0.24, 0.05, 0.06, 0.01, '#111111'),
    b(-0.08, 0.82, -0.24, 0.05, 0.06, 0.01, '#111111'),
    b(0, 0.74, -0.29, 0.1, 0.06, 0.12, '#ff9800'),
    b(0.28, 0.38, 0, 0.06, 0.3, 0.2, '#263238'),
    b(-0.28, 0.38, 0, 0.06, 0.3, 0.2, '#263238'),
  ];
}

function robot() {
  return [
    b(0.12, 0.1, 0, 0.14, 0.2, 0.16, '#546e7a'),
    b(-0.12, 0.1, 0, 0.14, 0.2, 0.16, '#546e7a'),
    b(0, 0.4, 0, 0.5, 0.4, 0.4, '#90a4ae'),
    b(0, 0.42, -0.205, 0.26, 0.18, 0.01, '#37474f'),
    b(-0.07, 0.45, -0.212, 0.05, 0.05, 0.01, '#ff5252'),
    b(0, 0.45, -0.212, 0.05, 0.05, 0.01, '#69f0ae'),
    b(0.07, 0.45, -0.212, 0.05, 0.05, 0.01, '#ffd740'),
    b(0, 0.77, 0, 0.4, 0.3, 0.36, '#b0bec5'),
    b(0, 0.8, -0.185, 0.3, 0.08, 0.01, '#00e5ff'),
    b(0, 1.0, 0, 0.04, 0.16, 0.04, '#546e7a'),
    b(0, 1.11, 0, 0.08, 0.08, 0.08, '#ff5252'),
    b(0.31, 0.42, 0, 0.1, 0.3, 0.12, '#78909c'),
    b(-0.31, 0.42, 0, 0.1, 0.3, 0.12, '#78909c'),
  ];
}

function ghost() {
  return [
    b(-0.19, 0.2, 0, 0.16, 0.14, 0.48, '#f4f4f8'),
    b(0.19, 0.2, 0, 0.16, 0.14, 0.48, '#f4f4f8'),
    b(0, 0.18, 0, 0.14, 0.1, 0.48, '#f4f4f8'),
    b(0, 0.56, 0, 0.56, 0.62, 0.5, '#f4f4f8'),
    b(0, 0.92, 0, 0.44, 0.12, 0.4, '#f4f4f8'),
    b(0.12, 0.66, -0.255, 0.1, 0.14, 0.01, '#263238'),
    b(-0.12, 0.66, -0.255, 0.1, 0.14, 0.01, '#263238'),
    b(0, 0.5, -0.255, 0.1, 0.1, 0.01, '#455a64'),
    b(0.33, 0.52, -0.05, 0.1, 0.14, 0.14, '#f4f4f8'),
    b(-0.33, 0.52, -0.05, 0.1, 0.14, 0.14, '#f4f4f8'),
  ];
}

export const CHARACTERS = [
  { id: 'gollum', name: 'Gollum', price: 0, dust: ['#cfc6a0', '#a89f7a'], build: () => gollum('#cfc6a0', '#a89f7a', '#5d4631') },
  { id: 'huhn', name: 'Huhn', price: 50, dust: ['#ffffff', '#e53935'], build: chicken },
  { id: 'frosch', name: 'Frosch', price: 100, dust: ['#4caf50', '#aed581'], build: frog },
  { id: 'ente', name: 'Ente', price: 150, dust: ['#ffd43b', '#ff9800'], build: duck },
  { id: 'pinguin', name: 'Pinguin', price: 250, dust: ['#263238', '#fafafa'], build: penguin },
  { id: 'roboter', name: 'Roboter', price: 400, dust: ['#90a4ae', '#00e5ff'], build: robot },
  { id: 'geist', name: 'Geist', price: 600, dust: ['#f4f4f8', '#b0bec5'], opacity: 0.82, build: ghost },
  { id: 'goldgollum', name: 'Schatz-Gollum', price: 1000, dust: ['#ffca28', '#fff176'], build: () => gollum('#f4c542', '#c99a1e', '#8a6d1c') },
];

export const characterById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
export const characterGeometry = (id) => geo('char:' + id, characterById(id).build);
