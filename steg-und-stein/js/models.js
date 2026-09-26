// Alle Voxel-Modelle in weichen Pastellfarben. Figuren schauen nach +z (zur Kamera).
export const b = (x, y, z, w, h, d, c) => ({ p: [x, y, z], s: [w, h, d], c });
export const shift = (boxes, dx, dy, dz) => boxes.map((q) => ({ ...q, p: [q.p[0] + dx, q.p[1] + dy, q.p[2] + dz] }));

const EYE = '#2b2230';
const CHEEK = '#f7a8b8';

// Augen und Bäckchen vorne auf einem Kopf mit Mitte (hx, hy) und Vorderseite hz.
function face(hx, hy, hz, spread = 0.09, cheeks = true) {
  const out = [
    b(hx - spread, hy + 0.02, hz + 0.005, 0.05, 0.07, 0.01, EYE),
    b(hx + spread, hy + 0.02, hz + 0.005, 0.05, 0.07, 0.01, EYE),
  ];
  if (cheeks) {
    out.push(b(hx - spread - 0.04, hy - 0.05, hz + 0.004, 0.06, 0.035, 0.01, CHEEK));
    out.push(b(hx + spread + 0.04, hy - 0.05, hz + 0.004, 0.06, 0.035, 0.01, CHEEK));
  }
  return out;
}

// ------------------------------------------------------------------ Tiere

function ente() {
  return [
    b(-0.08, 0.02, 0.04, 0.09, 0.04, 0.14, '#f4a340'),
    b(0.08, 0.02, 0.04, 0.09, 0.04, 0.14, '#f4a340'),
    b(0, 0.18, -0.02, 0.36, 0.26, 0.4, '#ffd97a'),
    b(0, 0.24, -0.25, 0.16, 0.1, 0.1, '#ffd97a'),
    b(0.19, 0.2, -0.02, 0.04, 0.14, 0.24, '#f7c95c'),
    b(-0.19, 0.2, -0.02, 0.04, 0.14, 0.24, '#f7c95c'),
    b(0, 0.44, 0.06, 0.28, 0.26, 0.26, '#ffd97a'),
    b(0, 0.4, 0.23, 0.16, 0.06, 0.1, '#f4a340'),
    ...face(0, 0.46, 0.19, 0.08),
  ];
}

function frosch() {
  return [
    b(0, 0.13, 0, 0.44, 0.24, 0.38, '#8fd47e'),
    b(0, 0.13, 0.19, 0.3, 0.16, 0.01, '#d6f2c4'),
    b(-0.13, 0.3, 0.06, 0.13, 0.12, 0.13, '#8fd47e'),
    b(0.13, 0.3, 0.06, 0.13, 0.12, 0.13, '#8fd47e'),
    b(-0.13, 0.31, 0.128, 0.06, 0.07, 0.01, EYE),
    b(0.13, 0.31, 0.128, 0.06, 0.07, 0.01, EYE),
    b(0, 0.17, 0.195, 0.2, 0.025, 0.01, '#5a8f4e'),
    b(-0.2, 0.06, 0.14, 0.12, 0.05, 0.14, '#79c16a'),
    b(0.2, 0.06, 0.14, 0.12, 0.05, 0.14, '#79c16a'),
    b(-0.24, 0.07, -0.12, 0.12, 0.1, 0.2, '#79c16a'),
    b(0.24, 0.07, -0.12, 0.12, 0.1, 0.2, '#79c16a'),
    b(-0.17, 0.16, 0.195, 0.05, 0.03, 0.01, CHEEK),
    b(0.17, 0.16, 0.195, 0.05, 0.03, 0.01, CHEEK),
  ];
}

function igel() {
  const spike = '#8a6a55';
  const out = [
    b(0, 0.16, -0.04, 0.4, 0.28, 0.4, spike),
    b(0, 0.32, -0.06, 0.32, 0.08, 0.32, '#7a5c48'),
    b(0, 0.15, 0.17, 0.26, 0.2, 0.08, '#f1dcc0'),
    b(0, 0.13, 0.23, 0.07, 0.06, 0.06, EYE),
    b(-0.08, 0.02, 0.1, 0.08, 0.04, 0.08, '#e0c3a3'),
    b(0.08, 0.02, 0.1, 0.08, 0.04, 0.08, '#e0c3a3'),
    ...face(0, 0.19, 0.21, 0.07),
  ];
  for (const [x, z] of [[-0.14, -0.2], [0.14, -0.2], [0, -0.24], [-0.2, 0], [0.2, 0]]) out.push(b(x, 0.3, z, 0.08, 0.1, 0.08, '#6b4f3d'));
  return out;
}

function hase() {
  return [
    b(-0.08, 0.03, 0.06, 0.1, 0.06, 0.16, '#e9e4ef'),
    b(0.08, 0.03, 0.06, 0.1, 0.06, 0.16, '#e9e4ef'),
    b(0, 0.17, -0.03, 0.32, 0.26, 0.34, '#f4f1f7'),
    b(0, 0.17, -0.22, 0.12, 0.12, 0.08, '#ffffff'),
    b(0, 0.42, 0.04, 0.28, 0.26, 0.26, '#f4f1f7'),
    b(-0.07, 0.66, 0.02, 0.07, 0.24, 0.05, '#f4f1f7'),
    b(0.07, 0.66, 0.02, 0.07, 0.24, 0.05, '#f4f1f7'),
    b(-0.07, 0.66, 0.047, 0.035, 0.18, 0.01, '#f7b6c8'),
    b(0.07, 0.66, 0.047, 0.035, 0.18, 0.01, '#f7b6c8'),
    b(0, 0.39, 0.175, 0.05, 0.04, 0.01, '#f08aa4'),
    ...face(0, 0.44, 0.17, 0.08),
  ];
}

function schildkroete() {
  return [
    b(0, 0.14, -0.04, 0.44, 0.2, 0.44, '#7fae6b'),
    b(0, 0.26, -0.04, 0.3, 0.08, 0.3, '#6b9a5a'),
    b(0, 0.305, -0.04, 0.12, 0.01, 0.12, '#a5c98f'),
    b(0, 0.06, -0.04, 0.48, 0.06, 0.48, '#c9b38b'),
    b(0, 0.17, 0.24, 0.18, 0.16, 0.16, '#b6d69a'),
    ...face(0, 0.19, 0.32, 0.05, false),
    b(-0.17, 0.04, 0.16, 0.1, 0.08, 0.1, '#b6d69a'),
    b(0.17, 0.04, 0.16, 0.1, 0.08, 0.1, '#b6d69a'),
    b(-0.17, 0.04, -0.22, 0.1, 0.08, 0.1, '#b6d69a'),
    b(0.17, 0.04, -0.22, 0.1, 0.08, 0.1, '#b6d69a'),
  ];
}

function fuchs() {
  return [
    b(-0.08, 0.04, 0.06, 0.08, 0.08, 0.1, '#4a3a3a'),
    b(0.08, 0.04, 0.06, 0.08, 0.08, 0.1, '#4a3a3a'),
    b(0, 0.18, -0.04, 0.3, 0.24, 0.38, '#f4a261'),
    b(0, 0.16, 0.14, 0.18, 0.16, 0.03, '#fff4e6'),
    b(0, 0.22, -0.3, 0.14, 0.14, 0.22, '#f4a261'),
    b(0, 0.22, -0.43, 0.1, 0.1, 0.06, '#fff4e6'),
    b(0, 0.42, 0.06, 0.3, 0.24, 0.24, '#f4a261'),
    b(0, 0.37, 0.2, 0.14, 0.1, 0.08, '#fff4e6'),
    b(0, 0.4, 0.245, 0.05, 0.04, 0.01, EYE),
    b(-0.1, 0.6, 0.04, 0.08, 0.12, 0.05, '#e38b4a'),
    b(0.1, 0.6, 0.04, 0.08, 0.12, 0.05, '#e38b4a'),
    ...face(0, 0.46, 0.18, 0.08),
  ];
}

function schaf() {
  const wool = '#fbf8f2';
  return [
    b(-0.1, 0.06, 0.08, 0.07, 0.12, 0.07, '#5a4a4a'),
    b(0.1, 0.06, 0.08, 0.07, 0.12, 0.07, '#5a4a4a'),
    b(-0.1, 0.06, -0.14, 0.07, 0.12, 0.07, '#5a4a4a'),
    b(0.1, 0.06, -0.14, 0.07, 0.12, 0.07, '#5a4a4a'),
    b(0, 0.24, -0.03, 0.4, 0.26, 0.44, wool),
    b(0, 0.39, -0.03, 0.3, 0.06, 0.34, wool),
    b(0, 0.3, 0.23, 0.2, 0.2, 0.14, '#6d5a5a'),
    b(0, 0.41, 0.22, 0.24, 0.06, 0.14, wool),
    b(-0.14, 0.32, 0.22, 0.08, 0.05, 0.08, '#6d5a5a'),
    b(0.14, 0.32, 0.22, 0.08, 0.05, 0.08, '#6d5a5a'),
    b(-0.05, 0.32, 0.301, 0.04, 0.05, 0.01, '#ffffff'),
    b(0.05, 0.32, 0.301, 0.04, 0.05, 0.01, '#ffffff'),
  ];
}

function biber() {
  return [
    b(0, 0.17, -0.02, 0.38, 0.3, 0.38, '#a47551'),
    b(0, 0.15, 0.17, 0.24, 0.2, 0.02, '#c9a07a'),
    b(0, 0.05, -0.32, 0.26, 0.05, 0.26, '#6f5a4e'),
    b(0, 0.42, 0.06, 0.3, 0.22, 0.26, '#a47551'),
    b(0, 0.36, 0.2, 0.14, 0.08, 0.02, '#c9a07a'),
    b(0, 0.305, 0.205, 0.08, 0.05, 0.01, '#ffffff'),
    b(-0.12, 0.54, 0.04, 0.07, 0.06, 0.05, '#8a6040'),
    b(0.12, 0.54, 0.04, 0.07, 0.06, 0.05, '#8a6040'),
    ...face(0, 0.46, 0.19, 0.08),
  ];
}

function otter() {
  return [
    b(0, 0.14, -0.06, 0.28, 0.22, 0.46, '#8c7462'),
    b(0, 0.1, -0.36, 0.1, 0.08, 0.22, '#7a6352'),
    b(0, 0.36, 0.12, 0.26, 0.3, 0.2, '#8c7462'),
    b(0, 0.32, 0.225, 0.18, 0.16, 0.02, '#e8dccf'),
    b(0, 0.5, 0.14, 0.26, 0.18, 0.2, '#8c7462'),
    b(0, 0.46, 0.245, 0.14, 0.08, 0.02, '#e8dccf'),
    b(0, 0.49, 0.26, 0.05, 0.04, 0.01, EYE),
    b(-0.1, 0.25, 0.23, 0.07, 0.07, 0.05, '#7a6352'),
    b(0.1, 0.25, 0.23, 0.07, 0.07, 0.05, '#7a6352'),
    ...face(0, 0.53, 0.24, 0.07, true),
  ];
}

function eule() {
  return [
    b(-0.07, 0.02, 0.06, 0.08, 0.04, 0.1, '#f2b66d'),
    b(0.07, 0.02, 0.06, 0.08, 0.04, 0.1, '#f2b66d'),
    b(0, 0.26, 0, 0.36, 0.48, 0.3, '#a58bb8'),
    b(0, 0.2, 0.155, 0.22, 0.26, 0.01, '#e7dcef'),
    b(-0.19, 0.24, 0, 0.04, 0.3, 0.22, '#8f76a3'),
    b(0.19, 0.24, 0, 0.04, 0.3, 0.22, '#8f76a3'),
    b(-0.08, 0.4, 0.155, 0.13, 0.13, 0.01, '#ffffff'),
    b(0.08, 0.4, 0.155, 0.13, 0.13, 0.01, '#ffffff'),
    b(-0.08, 0.4, 0.162, 0.06, 0.06, 0.01, EYE),
    b(0.08, 0.4, 0.162, 0.06, 0.06, 0.01, EYE),
    b(0, 0.33, 0.165, 0.05, 0.05, 0.02, '#f2b66d'),
    b(-0.12, 0.53, 0, 0.07, 0.08, 0.1, '#8f76a3'),
    b(0.12, 0.53, 0, 0.07, 0.08, 0.1, '#8f76a3'),
  ];
}

function schwein() {
  return [
    b(-0.1, 0.05, 0.08, 0.08, 0.1, 0.08, '#e99aa8'),
    b(0.1, 0.05, 0.08, 0.08, 0.1, 0.08, '#e99aa8'),
    b(-0.1, 0.05, -0.14, 0.08, 0.1, 0.08, '#e99aa8'),
    b(0.1, 0.05, -0.14, 0.08, 0.1, 0.08, '#e99aa8'),
    b(0, 0.24, -0.03, 0.4, 0.3, 0.46, '#f7b8c4'),
    b(0, 0.26, 0.21, 0.16, 0.12, 0.04, '#f08fa2'),
    b(-0.035, 0.26, 0.232, 0.03, 0.04, 0.01, '#b85b6e'),
    b(0.035, 0.26, 0.232, 0.03, 0.04, 0.01, '#b85b6e'),
    b(-0.13, 0.42, 0.16, 0.08, 0.07, 0.06, '#f08fa2'),
    b(0.13, 0.42, 0.16, 0.08, 0.07, 0.06, '#f08fa2'),
    b(0, 0.3, -0.28, 0.05, 0.05, 0.05, '#f08fa2'),
    ...face(0, 0.33, 0.2, 0.1),
  ];
}

function maus() {
  return [
    b(0, 0.14, -0.02, 0.3, 0.24, 0.34, '#b8b1bd'),
    b(0, 0.14, 0.155, 0.18, 0.16, 0.02, '#ece6ef'),
    b(0, 0.05, -0.3, 0.04, 0.04, 0.26, '#f0a8b8'),
    b(0, 0.34, 0.06, 0.24, 0.2, 0.22, '#b8b1bd'),
    b(-0.15, 0.48, 0.04, 0.15, 0.15, 0.04, '#b8b1bd'),
    b(0.15, 0.48, 0.04, 0.15, 0.15, 0.04, '#b8b1bd'),
    b(-0.15, 0.48, 0.062, 0.09, 0.09, 0.01, '#f7b6c8'),
    b(0.15, 0.48, 0.062, 0.09, 0.09, 0.01, '#f7b6c8'),
    b(0, 0.31, 0.19, 0.05, 0.04, 0.02, '#f08aa4'),
    ...face(0, 0.36, 0.17, 0.065),
  ];
}

export const ANIMALS = {
  ente: { name: 'Erna', species: 'Ente', art: 'die', color: '#ffc94d', build: ente, fact: 'Liebt Pfützen und singt morgens ziemlich schief.' },
  frosch: { name: 'Fritz', species: 'Frosch', art: 'der', color: '#6cc46b', build: frosch, fact: 'Kann weiter springen als er denkt, traut sich aber selten.' },
  igel: { name: 'Ida', species: 'Igel', art: 'der', color: '#c08a6a', build: igel, fact: 'Sammelt Herbstblätter und sortiert sie nach Farbe.' },
  hase: { name: 'Hanno', species: 'Hase', art: 'der', color: '#f2a7c3', build: hase, fact: 'Hat immer eine Möhre für Notfälle dabei.' },
  schildkroete: { name: 'Toni', species: 'Schildkröte', art: 'die', color: '#7bb07a', build: schildkroete, fact: 'Kommt nie zu spät. Sagt sie zumindest.' },
  fuchs: { name: 'Fine', species: 'Fuchs', art: 'der', color: '#f08a4b', build: fuchs, fact: 'Kennt jede Abkürzung, nimmt aber lieber den schönen Weg.' },
  schaf: { name: 'Wolle', species: 'Schaf', art: 'das', color: '#b9b3e8', build: schaf, fact: 'Strickt Mützen für alle, auch für die Fische.' },
  biber: { name: 'Bruno', species: 'Biber', art: 'der', color: '#b7825a', build: biber, fact: 'Hat die erste Planke im Schilf gelegt. Erzählt es gern.' },
  otter: { name: 'Olli', species: 'Otter', art: 'der', color: '#6fb4d8', build: otter, fact: 'Schläft am liebsten auf dem Rücken im Fluss.' },
  eule: { name: 'Ulla', species: 'Eule', art: 'die', color: '#a58bd0', build: eule, fact: 'Liest nachts Geschichten vor. Alle schlafen nach Seite zwei ein.' },
  schwein: { name: 'Rosa', species: 'Schwein', art: 'das', color: '#f28fa6', build: schwein, fact: 'Findet Schlamm bei Ebbe einfach herrlich.' },
  maus: { name: 'Mira', species: 'Maus', art: 'die', color: '#9aa8c8', build: maus, fact: 'Die Kleinste auf der Insel und die mit der lautesten Stimme.' },
};
export const ANIMAL_ORDER = Object.keys(ANIMALS);
export const fullName = (id) => `${ANIMALS[id].name} ${ANIMALS[id].art} ${ANIMALS[id].species}`;

// ------------------------------------------------------------------ Welt

export const PAL = {
  grass: '#9fd98a',
  grass2: '#93d17e',
  earth: '#c9a57a',
  earthDark: '#b48e64',
  sand: '#f1dfb0',
  sandDark: '#e3cc94',
  stone: '#b9b4c4',
  stoneTop: '#d6d2df',
  wood: '#c79a6b',
  woodDark: '#a87b52',
  rock: '#a7a3b5',
  leaf: ['#7cc47a', '#8fd18a', '#6bb88f', '#a5d67a'],
  trunk: '#9c7456',
};

export function landBoxes(x, z, top, variant) {
  const g = variant ? PAL.grass : PAL.grass2;
  return [b(x, top - 0.06, z, 1, 0.12, 1, g), b(x, (top - 0.12 - 0.75) / 2, z, 0.98, top - 0.12 + 0.75, 0.98, PAL.earth)];
}

export function treeBoxes(x, z, top, r) {
  const leaf = PAL.leaf[Math.floor(r() * PAL.leaf.length)];
  const h = 0.35 + r() * 0.3;
  return [
    b(x, top + 0.14, z, 0.14, 0.28, 0.14, PAL.trunk),
    b(x, top + 0.28 + h / 2, z, 0.56, h, 0.56, leaf),
    b(x, top + 0.28 + h + 0.08, z, 0.36, 0.16, 0.36, leaf),
  ];
}

export function rockBoxes(x, z, bottom) {
  return [
    b(x - 0.08, (bottom + 0.3) / 2, z + 0.05, 0.62, 0.3 - bottom, 0.56, '#7d7890'),
    b(x + 0.16, (bottom + 0.44) / 2, z - 0.12, 0.34, 0.44 - bottom, 0.34, '#6f6a82'),
    b(x - 0.1, 0.31, z + 0.08, 0.34, 0.03, 0.28, '#8fb87a'),
    b(x + 0.18, 0.45, z - 0.1, 0.16, 0.03, 0.16, '#8fb87a'),
  ];
}

export function sandBoxes(x, z, top, bottom) {
  return [b(x, top - 0.04, z, 1, 0.08, 1, PAL.sand), b(x, (top - 0.08 + bottom) / 2, z, 0.96, top - 0.08 - bottom, 0.96, PAL.sandDark)];
}

export function decorBoxes(x, z, top, r) {
  const ox = (r() - 0.5) * 0.6;
  const oz = (r() - 0.5) * 0.6;
  const petals = ['#ffffff', '#ffd6e0', '#fff2a8', '#d9c8ff', '#ffc2a8'];
  if (r() < 0.5) return [b(x + ox, top + 0.05, z + oz, 0.05, 0.1, 0.05, '#6fb35f'), b(x + ox + 0.07, top + 0.04, z + oz + 0.03, 0.05, 0.08, 0.05, '#6fb35f')];
  return [b(x + ox, top + 0.05, z + oz, 0.03, 0.1, 0.03, '#6fb35f'), b(x + ox, top + 0.12, z + oz, 0.09, 0.05, 0.09, petals[Math.floor(r() * petals.length)])];
}

export function reedBoxes(x, z, r) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const h = 0.3 + r() * 0.35;
    const px = x + (r() - 0.5) * 0.6;
    const pz = z + (r() - 0.5) * 0.6;
    out.push(b(px, -0.2 + h / 2, pz, 0.04, h + 0.2, 0.04, '#7fae6b'));
    if (r() < 0.5) out.push(b(px, h - 0.12, pz, 0.07, 0.14, 0.07, '#9c7456'));
  }
  return out;
}

export function lilyBoxes(x, z, r) {
  const out = [b(x, 0.01, z, 0.36, 0.02, 0.36, '#7cc47a')];
  if (r() < 0.4) out.push(b(x + 0.05, 0.05, z - 0.04, 0.1, 0.06, 0.1, '#ffd6e0'));
  return out;
}

// Stein, der vom Seegrund bis knapp über die Flut reicht
export function stoneBoxes(bottom) {
  return [
    b(0, (bottom + 0.1) / 2, 0, 0.78, 0.1 - bottom, 0.78, PAL.stone),
    b(0, 0.15, 0, 0.7, 0.1, 0.7, PAL.stoneTop),
    b(0.1, 0.205, -0.08, 0.3, 0.01, 0.24, '#e6e3ec'),
  ];
}

// Planke über zwei Felder in x-Richtung, Mitte bei 0
export function plankBoxes(bottom) {
  const out = [b(0, 0.17, 0, 1.9, 0.08, 0.62, PAL.wood)];
  for (const z of [-0.155, 0.155]) out.push(b(0, 0.2115, z, 1.86, 0.005, 0.02, PAL.woodDark));
  for (const x of [-0.8, 0.8]) for (const z of [-0.24, 0.24]) out.push(b(x, (bottom + 0.13) / 2, z, 0.08, 0.13 - bottom, 0.08, PAL.woodDark));
  return out;
}

export function jettyBoxes() {
  const out = [b(0, 0, 0, 0.94, 0.08, 0.94, '#d8b07f')];
  for (const x of [-0.24, 0, 0.24]) out.push(b(x, 0.041, 0, 0.02, 0.005, 0.92, '#b88c5a'));
  for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) out.push(b(x, -0.1, z, 0.08, 0.2, 0.08, '#a87b52'));
  return out;
}

export function raftBoxes() {
  const out = [];
  for (const z of [-0.3, -0.1, 0.1, 0.3]) out.push(b(0, 0, z, 0.86, 0.12, 0.18, z % 0.2 ? '#c79a6b' : '#bb8d5f'));
  out.push(b(-0.3, 0.065, 0, 0.06, 0.01, 0.84, '#8f6a48'), b(0.3, 0.065, 0, 0.06, 0.01, 0.84, '#8f6a48'));
  out.push(b(0.32, 0.3, -0.3, 0.04, 0.5, 0.04, '#8f6a48'), b(0.4, 0.46, -0.3, 0.14, 0.1, 0.01, '#ff9bb0'));
  return out;
}

export function houseBoxes(roof) {
  return [
    b(0, 0.24, 0, 0.62, 0.48, 0.56, '#fff4e3'),
    b(0, 0.53, 0, 0.74, 0.12, 0.68, roof),
    b(0, 0.63, 0, 0.56, 0.1, 0.68, roof),
    b(0, 0.71, 0, 0.34, 0.08, 0.68, roof),
    b(0.2, 0.72, -0.15, 0.1, 0.2, 0.1, '#d9a07a'),
    b(0, 0.15, 0.285, 0.18, 0.3, 0.02, '#a87b52'),
    b(0.06, 0.16, 0.297, 0.03, 0.03, 0.01, '#ffd97a'),
    b(0, 0.02, 0.36, 0.3, 0.04, 0.14, '#e8dccb'),
  ];
}

// ------------------------------------------------------------------ Heimatinsel-Deko

export const DECOR = {
  blumen: { name: 'Blumenbeet', price: 4, build: () => [b(0, 0.05, 0, 0.7, 0.1, 0.7, '#a0785a'), ...[[-0.2, -0.2, '#ffb3c6'], [0.2, -0.2, '#fff2a8'], [-0.2, 0.2, '#d9c8ff'], [0.2, 0.2, '#ffc2a8'], [0, 0, '#ffffff']].flatMap(([x, z, c]) => [b(x, 0.15, z, 0.04, 0.12, 0.04, '#6fb35f'), b(x, 0.23, z, 0.12, 0.07, 0.12, c)])] },
  busch: { name: 'Busch', price: 4, build: () => [b(0, 0.2, 0, 0.6, 0.4, 0.6, '#7cc47a'), b(0.05, 0.44, 0, 0.4, 0.12, 0.4, '#8fd18a'), b(0.18, 0.3, 0.3, 0.06, 0.06, 0.02, '#ff8fa3'), b(-0.15, 0.2, 0.3, 0.06, 0.06, 0.02, '#ff8fa3')] },
  steine: { name: 'Steinmännchen', price: 5, build: () => [b(0, 0.06, 0, 0.36, 0.12, 0.32, '#b9b4c4'), b(0.02, 0.17, 0, 0.26, 0.1, 0.24, '#c9c4d4'), b(0, 0.26, 0, 0.18, 0.08, 0.16, '#d6d2df'), b(0, 0.33, 0, 0.1, 0.06, 0.1, '#e6e3ec')] },
  pilze: { name: 'Pilzkreis', price: 6, build: () => [[-0.22, 0], [0.22, 0.05], [0, -0.22], [0.05, 0.24], [0, 0]].flatMap(([x, z], i) => [b(x, 0.07, z, 0.06, 0.14, 0.06, '#fff4e3'), b(x, 0.16, z, i === 4 ? 0.22 : 0.14, 0.06, i === 4 ? 0.22 : 0.14, '#f28b8b'), b(x + 0.02, 0.195, z, 0.03, 0.01, 0.03, '#ffffff')]) },
  vogelhaus: { name: 'Vogelhaus', price: 8, build: () => [b(0, 0.3, 0, 0.06, 0.6, 0.06, '#a87b52'), b(0, 0.66, 0, 0.26, 0.2, 0.22, '#fff4e3'), b(0, 0.8, 0, 0.32, 0.08, 0.28, '#6fb4d8'), b(0, 0.66, 0.115, 0.07, 0.07, 0.01, '#5a4a4a')] },
  laterne: { name: 'Laterne', price: 8, glow: true, build: () => [b(0, 0.35, 0, 0.06, 0.7, 0.06, '#5a5470'), b(0, 0.76, 0, 0.18, 0.16, 0.18, '#ffe9a8'), b(0, 0.87, 0, 0.22, 0.05, 0.22, '#5a5470')] },
  zaun: { name: 'Zaun', price: 3, build: () => [b(-0.4, 0.18, 0, 0.07, 0.36, 0.07, '#e8dccb'), b(0, 0.18, 0, 0.07, 0.36, 0.07, '#e8dccb'), b(0.4, 0.18, 0, 0.07, 0.36, 0.07, '#e8dccb'), b(0, 0.26, 0, 0.94, 0.05, 0.03, '#e8dccb'), b(0, 0.12, 0, 0.94, 0.05, 0.03, '#e8dccb')] },
  bank: { name: 'Bank', price: 10, build: () => [b(0, 0.2, 0, 0.8, 0.05, 0.3, '#c79a6b'), b(0, 0.36, -0.13, 0.8, 0.16, 0.04, '#c79a6b'), b(-0.34, 0.1, 0, 0.06, 0.2, 0.26, '#8f6a48'), b(0.34, 0.1, 0, 0.06, 0.2, 0.26, '#8f6a48')] },
  apfelbaum: { name: 'Apfelbaum', price: 10, build: () => [b(0, 0.25, 0, 0.16, 0.5, 0.16, '#9c7456'), b(0, 0.72, 0, 0.7, 0.5, 0.7, '#7cc47a'), b(0, 1.02, 0, 0.44, 0.14, 0.44, '#8fd18a'), b(0.36, 0.7, 0.1, 0.08, 0.08, 0.08, '#f26b6b'), b(-0.2, 0.82, 0.36, 0.08, 0.08, 0.08, '#f26b6b'), b(0.1, 0.58, 0.36, 0.08, 0.08, 0.08, '#f26b6b')] },
  boot: { name: 'Ruderboot', price: 15, build: () => [b(0, 0.08, 0, 0.8, 0.16, 0.42, '#6fb4d8'), b(0, 0.17, 0, 0.72, 0.02, 0.34, '#fff4e3'), b(0.45, 0.1, 0, 0.1, 0.12, 0.26, '#6fb4d8'), b(0, 0.22, 0.1, 0.9, 0.03, 0.03, '#c79a6b')] },
  brunnen: { name: 'Brunnen', price: 18, build: () => [b(0, 0.15, 0, 0.7, 0.3, 0.7, '#c9c4d4'), b(0, 0.29, 0, 0.5, 0.02, 0.5, '#7fd3d6'), b(-0.3, 0.55, 0, 0.06, 0.5, 0.06, '#a87b52'), b(0.3, 0.55, 0, 0.06, 0.5, 0.06, '#a87b52'), b(0, 0.84, 0, 0.8, 0.08, 0.5, '#e38b8b')] },
  windrad: { name: 'Windmühle', price: 30, build: () => [b(0, 0.4, 0, 0.5, 0.8, 0.5, '#fff4e3'), b(0, 0.86, 0, 0.56, 0.14, 0.56, '#e38b8b'), b(0, 0.96, 0, 0.36, 0.08, 0.36, '#e38b8b'), b(0, 0.3, 0.255, 0.14, 0.24, 0.01, '#a87b52'), b(0, 0.7, 0.3, 0.08, 0.08, 0.08, '#8f6a48')], blades: true },
  leuchtturm: { name: 'Leuchtturm', price: 45, glow: true, build: () => [b(0, 0.35, 0, 0.5, 0.7, 0.5, '#fff4e3'), b(0, 0.3, 0, 0.52, 0.14, 0.52, '#e38b8b'), b(0, 0.9, 0, 0.42, 0.4, 0.42, '#fff4e3'), b(0, 0.85, 0, 0.44, 0.12, 0.44, '#e38b8b'), b(0, 1.2, 0, 0.3, 0.2, 0.3, '#ffe9a8'), b(0, 1.35, 0, 0.38, 0.1, 0.38, '#5a5470')] },
};

export function bladesBoxes() {
  return [b(0, 0, 0, 0.1, 0.9, 0.02, '#c79a6b'), b(0, 0, 0, 0.9, 0.1, 0.02, '#c79a6b'), b(0, 0.3, 0.01, 0.16, 0.3, 0.01, '#fff4e3'), b(0, -0.3, 0.01, 0.16, 0.3, 0.01, '#fff4e3'), b(0.3, 0, 0.01, 0.3, 0.16, 0.01, '#fff4e3'), b(-0.3, 0, 0.01, 0.3, 0.16, 0.01, '#fff4e3')];
}

export function butterflyWing(color) {
  return [b(0.1, 0, 0, 0.2, 0.01, 0.22, color), b(0.08, 0, -0.14, 0.14, 0.01, 0.1, color)];
}

export function shellBoxes() {
  return [b(0, 0.04, 0, 0.2, 0.08, 0.16, '#ffd6c9'), b(0, 0.09, 0, 0.14, 0.04, 0.12, '#ffe7de')];
}
