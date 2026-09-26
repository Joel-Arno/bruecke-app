// Voxel-Modelle. Züge und Figuren schauen nach +z.
export const b = (x, y, z, w, h, d, c) => ({ p: [x, y, z], s: [w, h, d], c });

export const COLORS = [
  { id: 'rot', name: 'Rot', hex: '#ef5350', dark: '#c62828' },
  { id: 'blau', name: 'Blau', hex: '#42a5f5', dark: '#1565c0' },
  { id: 'gelb', name: 'Gelb', hex: '#ffca28', dark: '#f9a825' },
  { id: 'gruen', name: 'Grün', hex: '#66bb6a', dark: '#2e7d32' },
  { id: 'lila', name: 'Lila', hex: '#ab47bc', dark: '#6a1b9a' },
];
export const GOLD = { id: 'gold', name: 'Gold', hex: '#ffd54f', dark: '#ff8f00' };

const SKIN = '#ffcc99';
const WHEEL = '#37474f';

// ------------------------------------------------------------------ Umgebung

export function groundBoxes(cols, rows) {
  const out = [];
  const ox = -(cols - 1) / 2;
  const oz = -(rows - 1) / 2;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) out.push(b(x + ox, -0.1, y + oz, 1, 0.2, 1, (x + y) % 2 ? '#9ccc65' : '#8bc34a'));
  }
  // Rand: Weg, Zaun und etwas Landschaft drumherum
  const W = cols + 2;
  const H = rows + 2;
  for (let y = -1; y <= rows; y++) {
    for (let x = -1; x <= cols; x++) {
      if (x >= 0 && y >= 0 && x < cols && y < rows) continue;
      out.push(b(x + ox, -0.1, y + oz, 1, 0.2, 1, '#d7c29a'));
    }
  }
  const fence = '#fff3e0';
  for (let x = -0.5; x <= cols - 0.5; x += 0.5) {
    for (const z of [-0.62, rows - 0.38]) out.push(b(x + ox, 0.2, z + oz, 0.08, 0.4, 0.08, fence));
  }
  for (let z = -0.5; z <= rows - 0.5; z += 0.5) {
    for (const x of [-0.62, cols - 0.38]) out.push(b(x + ox, 0.2, z + oz, 0.08, 0.4, 0.08, fence));
  }
  out.push(b(ox + (cols - 1) / 2, 0.28, oz - 0.62, cols + 0.3, 0.05, 0.05, fence));
  out.push(b(ox + (cols - 1) / 2, 0.28, oz + rows - 0.38, cols + 0.3, 0.05, 0.05, fence));
  out.push(b(ox - 0.62, 0.28, oz + (rows - 1) / 2, 0.05, 0.05, rows + 0.3, fence));
  out.push(b(ox + cols - 0.38, 0.28, oz + (rows - 1) / 2, 0.05, 0.05, rows + 0.3, fence));
  // Wiese weit draußen
  out.push(b(0, -0.25, 0, W + 30, 0.2, H + 30, '#7cb342'));
  return out;
}

export function treeBoxes(x, z, r) {
  const leaf = ['#43a047', '#2e7d32', '#66bb6a'][Math.floor(r() * 3)];
  const h = 0.5 + r() * 0.5;
  return [
    b(x, 0.2, z, 0.2, 0.4, 0.2, '#6d4c41'),
    b(x, 0.4 + h / 2, z, 0.72, h, 0.72, leaf),
    b(x, 0.45 + h, z, 0.44, 0.2, 0.44, leaf),
  ];
}

export function rockBoxes(x, z) {
  return [b(x, 0.18, z, 0.7, 0.36, 0.6, '#9e9e9e'), b(x - 0.05, 0.4, z + 0.05, 0.42, 0.1, 0.36, '#bdbdbd')];
}

export function flowerBoxes(x, z, r) {
  const c = ['#fff176', '#f48fb1', '#ffffff', '#ce93d8'][Math.floor(r() * 4)];
  return [b(x, 0.06, z, 0.04, 0.12, 0.04, '#558b2f'), b(x, 0.14, z, 0.1, 0.06, 0.1, c)];
}

// ------------------------------------------------------------------ Schienen

const DIRV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// Schienenstück für eine Zelle, das die Richtungen a und b verbindet (z.B. 'N','S' oder 'N','E').
export function railBoxes(a, c) {
  const out = [];
  const [ax, az] = DIRV[a];
  const [cx, cz] = DIRV[c];
  if (ax === -cx && az === -cz) {
    const along = ax !== 0; // entlang x
    for (let i = -2; i <= 2; i++) {
      const t = i * 0.22;
      out.push(along ? b(t, 0.02, 0, 0.1, 0.04, 0.72, '#8d6e63') : b(0, 0.02, t, 0.72, 0.04, 0.1, '#8d6e63'));
    }
    for (const s of [-0.2, 0.2]) out.push(along ? b(0, 0.07, s, 1, 0.05, 0.06, '#b0bec5') : b(s, 0.07, 0, 0.06, 0.05, 1, '#b0bec5'));
    return out;
  }
  // Kurve: Mittelpunkt in der Ecke zwischen a und c
  const mx = (ax + cx) * 0.5;
  const mz = (az + cz) * 0.5;
  const t0 = Math.atan2(-cz * 0.5, -cx * 0.5);
  let t1 = Math.atan2(-az * 0.5, -ax * 0.5);
  let d = t1 - t0;
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  const steps = 7;
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (d * i) / steps;
    if (i % 2 === 1 || i === 0 || i === steps) {
      const r = 0.5;
      out.push(b(mx + Math.cos(t) * r, 0.02, mz + Math.sin(t) * r, 0.18, 0.04, 0.18, '#8d6e63'));
    }
  }
  for (const r of [0.3, 0.7]) {
    const n = r < 0.5 ? 6 : 10;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (d * i) / n;
      out.push(b(mx + Math.cos(t) * r, 0.07, mz + Math.sin(t) * r, 0.09, 0.05, 0.09, '#b0bec5'));
    }
  }
  return out;
}

// ------------------------------------------------------------------ Züge

export const LOCOS = [
  { id: 'dampf', name: 'Dampflok Emma', price: 0, kind: 'steam', body: '#e53935', trim: '#263238', roof: '#212121' },
  { id: 'wald', name: 'Waldbahn', price: 40, kind: 'steam', body: '#43a047', trim: '#3e2723', roof: '#795548' },
  { id: 'blitz', name: 'Blauer Blitz', price: 100, kind: 'electric', body: '#1e88e5', trim: '#eceff1', roof: '#90a4ae' },
  { id: 'post', name: 'Postzug', price: 180, kind: 'electric', body: '#fdd835', trim: '#263238', roof: '#f57f17' },
  { id: 'nacht', name: 'Nachtexpress', price: 300, kind: 'steam', body: '#4527a0', trim: '#ffd54f', roof: '#1a1033' },
  { id: 'gold', name: 'Goldlok', price: 500, kind: 'electric', body: '#ffc107', trim: '#fff8e1', roof: '#ff8f00' },
];

function wheels(len) {
  const out = [];
  for (const z of [-len * 0.28, len * 0.28]) for (const x of [-0.29, 0.29]) out.push(b(x, 0.12, z, 0.08, 0.2, 0.2, WHEEL));
  return out;
}

export function locoBoxes(skin) {
  const { body, trim, roof } = skin;
  if (skin.kind === 'electric') {
    return [
      ...wheels(0.8),
      b(0, 0.16, 0, 0.56, 0.1, 0.8, trim),
      b(0, 0.42, 0, 0.6, 0.42, 0.82, body),
      b(0, 0.66, 0, 0.5, 0.06, 0.7, roof),
      b(0, 0.5, 0.415, 0.44, 0.16, 0.02, '#b3e5fc'),
      b(0, 0.5, -0.415, 0.44, 0.16, 0.02, '#b3e5fc'),
      b(0.305, 0.5, 0.1, 0.02, 0.14, 0.3, '#b3e5fc'),
      b(-0.305, 0.5, 0.1, 0.02, 0.14, 0.3, '#b3e5fc'),
      b(0, 0.3, 0.415, 0.5, 0.05, 0.02, trim),
      b(0.16, 0.26, 0.42, 0.08, 0.06, 0.02, '#fff59d'),
      b(-0.16, 0.26, 0.42, 0.08, 0.06, 0.02, '#fff59d'),
      // Stromabnehmer
      b(0, 0.74, 0, 0.04, 0.1, 0.04, trim),
      b(0, 0.8, 0.08, 0.04, 0.04, 0.2, trim),
      b(0, 0.84, 0.16, 0.34, 0.03, 0.04, trim),
    ];
  }
  return [
    ...wheels(0.8),
    b(0, 0.16, 0, 0.56, 0.1, 0.82, trim),
    // Kessel vorne
    b(0, 0.38, 0.12, 0.44, 0.36, 0.56, body),
    b(0, 0.38, 0.41, 0.38, 0.3, 0.02, trim),
    b(0, 0.44, 0.425, 0.1, 0.1, 0.02, '#fff59d'),
    b(0, 0.18, 0.46, 0.5, 0.12, 0.08, trim),
    b(0, 0.64, 0.3, 0.14, 0.2, 0.14, trim),
    b(0, 0.76, 0.3, 0.2, 0.05, 0.2, trim),
    b(0, 0.6, 0.02, 0.12, 0.08, 0.12, '#ffd54f'),
    // Führerhaus hinten
    b(0, 0.46, -0.26, 0.58, 0.5, 0.3, body),
    b(0, 0.73, -0.26, 0.64, 0.06, 0.38, roof),
    b(0.295, 0.54, -0.26, 0.02, 0.16, 0.18, '#b3e5fc'),
    b(-0.295, 0.54, -0.26, 0.02, 0.16, 0.18, '#b3e5fc'),
  ];
}

export function wagonBoxes(color) {
  const c = color.hex;
  const glass = '#e3f2fd';
  return [
    ...wheels(0.7),
    b(0, 0.16, 0, 0.52, 0.1, 0.72, '#455a64'),
    b(0, 0.4, 0, 0.56, 0.38, 0.72, c),
    b(0, 0.62, 0, 0.62, 0.06, 0.78, color.dark),
    b(0.285, 0.46, 0.14, 0.02, 0.14, 0.2, glass),
    b(0.285, 0.46, -0.14, 0.02, 0.14, 0.2, glass),
    b(-0.285, 0.46, 0.14, 0.02, 0.14, 0.2, glass),
    b(-0.285, 0.46, -0.14, 0.02, 0.14, 0.2, glass),
    // Fahrgast schaut aus dem Fenster
    b(0.29, 0.47, 0.14, 0.02, 0.08, 0.08, SKIN),
    b(-0.29, 0.47, -0.14, 0.02, 0.08, 0.08, SKIN),
  ];
}

export function tenderBoxes(skin) {
  return [
    ...wheels(0.6),
    b(0, 0.16, 0, 0.52, 0.1, 0.62, skin.trim),
    b(0, 0.34, 0, 0.54, 0.26, 0.6, skin.body),
    b(0, 0.49, 0, 0.44, 0.06, 0.5, '#212121'),
    b(0.1, 0.53, 0.08, 0.14, 0.05, 0.14, '#37474f'),
    b(-0.12, 0.53, -0.1, 0.12, 0.05, 0.12, '#37474f'),
  ];
}

// ------------------------------------------------------------------ Fahrgäste & Bahnhöfe

export function personBoxes(color) {
  return [
    b(-0.06, 0.08, 0, 0.08, 0.16, 0.1, '#37474f'),
    b(0.06, 0.08, 0, 0.08, 0.16, 0.1, '#37474f'),
    b(0, 0.27, 0, 0.24, 0.22, 0.16, color.hex),
    b(0.15, 0.3, 0, 0.06, 0.16, 0.08, color.hex),
    b(-0.15, 0.3, 0, 0.06, 0.16, 0.08, color.hex),
    b(0, 0.46, 0, 0.18, 0.16, 0.16, SKIN),
    b(0.045, 0.48, 0.081, 0.03, 0.03, 0.01, '#263238'),
    b(-0.045, 0.48, 0.081, 0.03, 0.03, 0.01, '#263238'),
    b(0, 0.56, 0, 0.22, 0.04, 0.22, color.dark),
    b(0, 0.6, 0, 0.14, 0.06, 0.14, color.dark),
    // Koffer
    b(0.2, 0.1, 0.08, 0.1, 0.14, 0.16, '#8d6e63'),
  ];
}

export function stationBoxes(color) {
  const out = [
    b(0, 0.03, 0, 0.96, 0.06, 0.96, '#cfd8dc'),
    b(0, 0.065, 0.44, 0.96, 0.01, 0.06, color.hex),
    b(0, 0.065, -0.44, 0.96, 0.01, 0.06, color.hex),
  ];
  for (const x of [-0.42, 0.42]) for (const z of [-0.42, 0.42]) out.push(b(x, 0.5, z, 0.06, 0.9, 0.06, '#eceff1'));
  out.push(b(0, 0.98, 0, 1.06, 0.08, 1.06, color.hex));
  out.push(b(0, 1.06, 0, 0.8, 0.08, 0.8, color.dark));
  out.push(b(0, 1.14, 0, 0.5, 0.08, 0.5, color.hex));
  // Schild
  out.push(b(0.42, 1.34, 0.42, 0.04, 0.3, 0.04, '#eceff1'));
  out.push(b(0.42, 1.5, 0.42, 0.28, 0.2, 0.04, '#ffffff'));
  out.push(b(0.42, 1.5, 0.445, 0.18, 0.1, 0.01, color.hex));
  return out;
}

export function ringBoxes(color) {
  return [b(0, 0.012, 0, 0.62, 0.02, 0.62, color.hex)];
}
