// Spielstand im localStorage. Ist der Speicher gesperrt, läuft das Spiel trotzdem (nur ohne Speichern).
const KEY = 'steg-und-stein:v1';

const DEFAULTS = {
  stars: {}, // Level-ID -> beste Sternzahl
  shells: 0,
  animals: [], // gerettete Tiere in Einzugsreihenfolge
  decor: [], // { id, x, y } auf der Heimatinsel
  daily: { date: '', stars: 0 },
  hintsSeen: [],
  sfx: true,
  music: true,
};

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadSave() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    stored = {};
  }
  const save = { ...structuredClone(DEFAULTS), ...stored };
  save.daily = { ...DEFAULTS.daily, ...(stored.daily || {}) };
  return save;
}

export function persist(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // nicht speicherbar
  }
}
