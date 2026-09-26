// Spielstand im localStorage. Falls der Speicher gesperrt ist (privater Modus), läuft das Spiel trotzdem.
const KEY = 'schatzhuepfer:v1';

const DEFAULTS = {
  best: 0,
  fish: 0,
  owned: ['gollum'],
  selected: 'gollum',
  daily: { date: '', best: 0, tries: 0 },
  bonusDate: '',
  muted: false,
  games: 0,
};

export function todayKey(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
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
  if (!Array.isArray(save.owned) || !save.owned.includes('gollum')) save.owned = ['gollum', ...(save.owned || [])];
  return save;
}

export function persist(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Speichern nicht möglich, dann eben nur für diese Sitzung.
  }
}
