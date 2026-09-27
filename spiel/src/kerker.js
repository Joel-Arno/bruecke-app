/* =====================================================================
   KERKER-WISCHER: Daten
   ===================================================================== */
const HEROES = {
  ritter:    { name: 'Ritter',    hp: 12, armor: 3, ability: 'wirbel',   charge: 5,
               passive: 'Startet mit 3 Rüstung.', unlock: '' },
  schurkin:  { name: 'Schurkin',  hp: 9,  armor: 0, ability: 'schatten', charge: 4,
               passive: 'Goldkarten bringen ihr 50 % mehr.', unlock: 'Besiege einen Boss.' },
  magierin:  { name: 'Magierin',  hp: 8,  armor: 0, ability: 'feuer',    charge: 4,
               passive: 'Tränke heilen bei ihr 2 Leben mehr.', unlock: 'Erreiche Etage 3 im Abenteuer.' },
  berserker: { name: 'Berserker', hp: 14, armor: 0, ability: 'rage',     charge: 6,
               passive: 'Heilt 1 Leben, wenn er ohne Waffe siegt.', unlock: 'Besiege insgesamt 150 Monster.' }
};
const HERO_IDS = Object.keys(HEROES);
const ABILITIES = {
  wirbel:   { name: 'Wirbelschlag',    target: '',        desc: 'Trifft alle angrenzenden Monster mit 4 Schaden.' },
  schatten: { name: 'Schattenschritt', target: 'any',     desc: 'Tausche den Platz mit einer beliebigen Karte, ohne sie auszulösen.' },
  feuer:    { name: 'Feuerball',       target: 'monster', desc: 'Trifft ein beliebiges Monster mit 7 Schaden.' },
  rage:     { name: 'Raserei',         target: '',        desc: 'Die nächsten 3 Kämpfe: halber Schaden ohne Waffe, Waffen nutzen sich nicht ab.' }
};
const FLOORS = [
  { name: 'Modergewölbe',  boss: 'waechter', hp: 12 },
  { name: 'Spinnengrotte', boss: 'koenigin', hp: 16 },
  { name: 'Knochenhalle',  boss: 'knochen',  hp: 20 },
  { name: 'Schattenreich', boss: 'schatten', hp: 25 },
  { name: 'Drachenhort',   boss: 'drache',   hp: 32 }
];
const BOSSES = {
  waechter: { name: 'Kerkerwächter',  art: 'Der Kerkerwächter',  every: 0, badge: 'shield',
              mech: 'Gepanzert: Waffen richten höchstens 4 Schaden pro Schlag an.' },
  koenigin: { name: 'Spinnenkönigin', art: 'Die Spinnenkönigin', every: 4, badge: 'egg',
              mech: 'Lässt alle 4 Züge eine Giftspinne schlüpfen. Ohne Waffe vergiftet sie dich.' },
  knochen:  { name: 'Knochenkönig',   art: 'Der Knochenkönig',   every: 0, badge: 'heart',
              mech: 'Heilt sich jeden Zug um 1. Triff ihn hart und schnell.' },
  schatten: { name: 'Schattenfürst',  art: 'Der Schattenfürst',  every: 3, badge: 'bolt',
              mech: 'Springt alle 3 Züge an einen anderen Platz.' },
  drache:   { name: 'Uralter Drache', art: 'Der Uralte Drache',  every: 4, badge: 'flame',
              mech: 'Speit alle 4 Züge Feuer über seine ganze Reihe und Spalte.' }
};
const BOSS_IDS = Object.keys(BOSSES);
const BOSS_AT = 15, ENDLESS_EVERY = 18;
const MONSTERS = {
  slime:  { name: 'Schleim',    art: 'Ein Schleim',      desc: 'Schwach, aber zahlreich. Stärke 1 bis 3.' },
  bat:    { name: 'Fledermaus', art: 'Eine Fledermaus',  desc: 'Flink und bissig. Stärke 4 bis 6.' },
  skull:  { name: 'Skelett',    art: 'Ein Skelett',      desc: 'Klappert durch die Gänge. Stärke 7 bis 9.' },
  demon:  { name: 'Dämon',      art: 'Ein Dämon',        desc: 'Glühende Augen, harte Schläge. Stärke 10 bis 12.' },
  ogre:   { name: 'Oger',       art: 'Ein Oger',         desc: 'Der Stärkste der gewöhnlichen Monster. Ab Stärke 13.' },
  spider: { name: 'Giftspinne', art: 'Eine Giftspinne',  desc: 'Vergiftet dich, wenn du sie ohne Waffe bekämpfst.' },
  ghost:  { name: 'Geist',      art: 'Ein Geist',        desc: 'Waffen gleiten durch ihn. Er verblasst jeden Zug um 1.' },
  mimic:  { name: 'Mimic',      art: 'Ein Mimic',        desc: 'Tarnt sich als Truhe. Lässt doppelt Gold fallen.' }
};
const CARDS = {
  weapon:   { name: 'Waffe',   ic: 'sword',    desc: 'Fängt Schaden ab und nutzt sich dabei ab.' },
  armor:    { name: 'Rüstung', ic: 'armor',    desc: 'Schluckt Schaden, bevor du Leben verlierst.' },
  potion:   { name: 'Trank',   ic: 'potion',   desc: 'Heilt so viele Leben, wie die Zahl zeigt.' },
  gold:     { name: 'Gold',    ic: 'coin',     desc: 'Für Händler und für deinen Schatz.' },
  chest:    { name: 'Truhe',   ic: 'chest',    desc: 'Gold, Heilung, Ausrüstung oder ein Relikt.' },
  bomb:     { name: 'Bombe',   ic: 'bomb',     desc: 'Explodiert bei 0 und trifft alle Nachbarfelder.' },
  trap:     { name: 'Falle',   ic: 'trap',     desc: 'Kostet Leben, wenn du drauftrittst.' },
  shrine:   { name: 'Schrein', ic: 'shrine',   desc: 'Wähle eines von drei Relikten.' },
  merchant: { name: 'Händler', ic: 'merchant', desc: 'Kauf mit dem Gold dieses Laufs ein.' }
};
const RELICS = {
  vampir:    { name: 'Vampirzahn',       desc: 'Jeder Sieg heilt 1 Leben.' },
  phoenix:   { name: 'Phönixfeder',      desc: 'Einmal pro Lauf: Statt zu sterben, stehst du mit 6 Leben wieder auf.' },
  schleif:   { name: 'Schleifstein',     desc: 'Aufgenommene Waffen haben +2 Stärke.' },
  kraeuter:  { name: 'Kräuterbeutel',    desc: 'Tränke heilen 3 Leben mehr.' },
  eisen:     { name: 'Eisenhaut',        desc: '+4 maximale Leben, sofort geheilt.' },
  dornen:    { name: 'Dornenpanzer',     desc: 'Zu Beginn jeder Etage +4 Rüstung, jetzt sofort auch.' },
  midas:     { name: 'Midas-Ring',       desc: 'Goldkarten sind 50 % mehr wert.' },
  horn:      { name: 'Kriegshorn',       desc: 'Deine Heldenfähigkeit lädt doppelt so schnell.' },
  stiefel:   { name: 'Giftstiefel',      desc: 'Immun gegen Gift und Fallen.' },
  glueck:    { name: 'Glücksmünze',      desc: 'Kritische Treffer werden dreimal so häufig.' },
  auge:      { name: 'Adlerauge',        desc: 'Du erkennst Mimics, und Truhen geben mehr Gold.' },
  kanone:    { name: 'Glaskanone',       desc: 'Waffen +4 Stärke, aber −4 maximale Leben.' },
  feuerfest: { name: 'Feuerfest',        desc: 'Explosionen und Drachenfeuer verletzen dich nicht.' },
  feilscher: { name: 'Feilscher-Siegel', desc: 'Händler verlangen 40 % weniger.' },
  titan:     { name: 'Titanenherz',      desc: 'Jeder Bosssieg: +3 maximale Leben und volle Heilung.' }
};
const RELIC_IDS = Object.keys(RELICS);
const MODS = {
  goldrausch: { name: 'Goldrausch',    desc: 'Goldkarten sind doppelt so viel wert.' },
  pulverfass: { name: 'Pulverfass',    desc: 'Überall liegen Bomben.' },
  glaskanone: { name: 'Glasknochen',   desc: 'Waffen +3 Stärke, aber nur halbe Leben.' },
  schreine:   { name: 'Heilige Nacht', desc: 'Schreine sind dreimal so häufig.' },
  giftnebel:  { name: 'Giftnebel',     desc: 'Alle 8 Züge wirst du vergiftet.' },
  markttag:   { name: 'Markttag',      desc: 'Händler sind häufig und 30 % günstiger.' },
  blutmond:   { name: 'Blutmond',      desc: 'Viele Monster sind Elite und lassen Gold fallen.' }
};
const MOD_IDS = Object.keys(MODS);
const TIPS = {
  c_armor:    ['Rüstung', 'Fängt Schaden ab, bevor du Leben verlierst. Mehrere Rüstungen stapeln sich.'],
  c_chest:    ['Truhe', 'Enthält Gold, Heilung, Ausrüstung und selten sogar ein Relikt.'],
  c_bomb:     ['Bombe', 'Zählt jeden Zug herunter. Bei 0 trifft sie alle Nachbarfelder, auch dich. Tritt drauf, um sie zu entschärfen.'],
  c_trap:     ['Stachelfalle', 'Kostet Leben, wenn du drauftrittst. Rüstung fängt den Schaden ab.'],
  c_shrine:   ['Schrein', 'Tritt drauf und wähle eines von drei Relikten. Relikte wirken bis zum Ende des Laufs.'],
  c_merchant: ['Händler', 'Tauscht Gold aus diesem Lauf gegen Heilung, Waffen und Relikte.'],
  m_spider:   ['Giftspinne', 'Wer sie ohne Waffe bekämpft, wird vergiftet und verliert 3 Züge lang je 1 Leben.'],
  m_ghost:    ['Geist', 'Waffen gleiten durch ihn hindurch. Dafür verblasst er jeden Zug um 1.'],
  m_mimic:    ['Mimic', 'Manche Truhen beißen. Achte auf Truhen, die zucken.'],
  elite:      ['Elite-Monster', 'Stärker als normal, aber sie lassen so viel Gold fallen, wie ihre Zahl zeigt.']
};
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const weaponName = v => v <= 3 ? 'Dolch' : v <= 6 ? 'Schwert' : v <= 9 ? 'Streitklinge' : 'Runenklinge';
const dailyHero = (key = todayKey()) => HERO_IDS[hashStr('held-' + key) % HERO_IDS.length];
const dailyMod = (key = todayKey()) => MOD_IDS[hashStr('mod-' + key) % MOD_IDS.length];
const MODE_NAME = { adv: 'Abenteuer', end: 'Endlos', daily: 'Tagesgruft' };

/* =====================================================================
   ZUSTAND UND HILFSFUNKTIONEN
   ===================================================================== */
const board = $('#board'), nodes = new Map();
const kScreen = $('#kerker'), kWrap = $('#kBoardWrap'), kBannerEl = $('#kBanner'), kTipEl = $('#kTip');
let k = null;          // laufender Lauf (wird komplett gespeichert)
let T = null;          // Daten des aktuellen Zugs
let kBusy = false;     // Eingabe gesperrt, solange Banner laufen
let heartTimer = 0;
const tipQ = [];

// Spiel-Zufall mit gespeichertem Zustand, damit Tagesgruft und Fortsetzen stimmen
function R(){
  const a = k.rs = (k.rs + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
function pickW(list){
  let sum = 0; for (const [, w] of list) sum += w;
  let r = R() * sum;
  for (const [t, w] of list){ if ((r -= w) < 0) return t; }
  return list[0][0];
}
const has = id => k.relics.includes(id);
const colOf = i => i % 3, rowOf = i => (i / 3) | 0;
const adjacent = (a, b) => Math.abs(colOf(a) - colOf(b)) + Math.abs(rowOf(a) - rowOf(b)) === 1;
function nbrs(i){
  const out = [];
  if (rowOf(i) > 0) out.push(i - 3);
  if (rowOf(i) < 2) out.push(i + 3);
  if (colOf(i) > 0) out.push(i - 1);
  if (colOf(i) < 2) out.push(i + 1);
  return out;
}
function mk(type, val = 0, extra = {}){
  return Object.assign({ id: k.uid++, type, val, rot: (vr() * 4 - 2).toFixed(2) + 'deg' }, extra);
}
const isAdv = () => k.mode !== 'end';
const heroCard = () => k.grid[k.pos];
function level(){ return isAdv() ? (k.floor - 1) * 3 + 1 + Math.floor(k.floorSteps / 6) : 1 + Math.floor(k.steps / 12); }
const bossEvery = () => isAdv() ? BOSS_AT : ENDLESS_EVERY;
function cardName(c){
  if (c.type === 'boss') return BOSSES[c.boss].name;
  if (c.type === 'monster') return MONSTERS[c.kind].name;
  return CARDS[c.type] ? CARDS[c.type].name : '';
}
function cardArt(c){
  if (c.type === 'boss') return BOSSES[c.boss].art;
  if (c.type === 'monster') return MONSTERS[c.kind].art;
  return cardName(c);
}
function critChance(){ return has('glueck') ? .36 : .12; }
const say = m => { if (m) T.msg.push(m); };

/* =====================================================================
   KARTEN ERZEUGEN
   ===================================================================== */
function spawn(initial = false){
  if (!initial && !k.bossOut && k.floorSteps >= bossEvery()) return makeBoss();
  const F = k.floor, L = level(), luck = D.kerker.up.luck, m = k.mod;
  const onBoard = t => k.grid.some(c => c && c.type === t);
  const t = pickW([
    ['monster', initial ? 30 : 42],
    ['weapon', 14],
    ['potion', 12 + luck * 2],
    ['gold', m === 'goldrausch' ? 20 : 16],
    ['chest', 5 + luck * 2],
    ['armor', 6],
    ['bomb', initial ? 0 : m === 'pulverfass' ? 11 : F >= 2 ? 4 : 0],
    ['trap', initial ? 0 : F >= 2 ? 2.5 + F * .5 : 0],
    ['shrine', initial || k.shrineCd > 0 || onBoard('shrine') ? 0 : m === 'schreine' ? 4 : 1.2],
    ['merchant', initial || k.merchantCd > 0 || onBoard('merchant') ? 0 : m === 'markttag' ? 4.5 : 1.6]
  ]);
  switch (t){
    case 'monster':  return makeMonster(F, L, initial);
    case 'weapon':   return mk('weapon', ri(2, Math.min(3 + Math.ceil(L * .8), 13)));
    case 'potion':   return mk('potion', ri(2, Math.min(3 + Math.ceil(L / 2), 10)));
    case 'gold':     return mk('gold', ri(1, Math.min(2 + L, 16)));
    case 'chest':    return mk('chest', 0, { mimic: F >= 2 && R() < (F >= 3 ? .25 : .12) });
    case 'armor':    return mk('armor', ri(2, 3 + Math.ceil(F / 2)));
    case 'bomb':     return mk('bomb', ri(3, 5), { fresh: true });
    case 'trap':     return mk('trap', ri(2, 2 + F));
    case 'shrine':   k.shrineCd = 10; return mk('shrine');
    default:         k.merchantCd = 12; return mk('merchant');
  }
}
function makeMonster(F, L, initial){
  const r = R();
  if (!initial && F >= 2 && r < .13){ const v = ri(2, 3 + F); return mk('monster', v, { kind: 'spider', orig: v }); }
  if (!initial && F >= 3 && r < .23){ const v = ri(3, 5 + F); return mk('monster', v, { kind: 'ghost', orig: v, fresh: true }); }
  // Im Endlos-Modus steigt die Obergrenze mit jedem besiegten Boss weiter
  const cap = isAdv() ? 14 : 14 + (F - 1) * 2;
  const lo = 1 + Math.floor(L / (isAdv() ? 5 : 4)), hi = Math.max(lo, Math.min(2 + L, cap));
  let v = initial ? ri(1, 3) : ri(lo, hi);
  const kind = v <= 3 ? 'slime' : v <= 6 ? 'bat' : v <= 9 ? 'skull' : v <= 12 ? 'demon' : 'ogre';
  const elite = !initial && L >= 3 && R() < (k.mod === 'blutmond' ? .3 : Math.min(.2, .03 + F * .012));
  if (elite) v += 3;
  return mk('monster', v, { kind, elite, orig: v });
}
function makeBoss(){
  let id, hp;
  if (isAdv()){ const f = FLOORS[Math.min(k.floor, 5) - 1]; id = f.boss; hp = f.hp; }
  else { id = BOSS_IDS[Math.floor(R() * BOSS_IDS.length)]; hp = 12 + 6 * (k.floor - 1); }
  k.bossOut = true; k.bossNew = id;
  return mk('boss', hp, { boss: id, max: hp, cd: BOSSES[id].every, fresh: true });
}

/* =====================================================================
   NEUER LAUF
   ===================================================================== */
function newRun(mode){
  const hero = mode === 'daily' ? dailyHero() : D.kerker.hero;
  const H = HEROES[hero], up = D.kerker.up;
  const seed = mode === 'daily' ? hashStr('gruft-' + todayKey()) : (Date.now() ^ Math.floor(vr() * 0x7fffffff)) >>> 0;
  k = {
    mode, hero, mod: mode === 'daily' ? dailyMod() : null, rs: seed | 0, uid: 1,
    grid: [], pos: 4,
    maxHp: H.hp + up.hp * 2, hp: 0, armor: H.armor + up.armor * 2, wpn: [0, 2, 3, 5][up.wpn] || 0, gold: 0, poison: 0,
    steps: 0, floor: 1, floorSteps: 0, bossOut: false, bossNew: null,
    relics: [], phoenixUsed: false, charge: Math.min(up.charge, H.charge - 1), rage: 0,
    streak: 0, bestStreak: 0, crits: 0, kills: 0, bosses: 0,
    shrineCd: 4, merchantCd: 8, pending: up.relic ? 'startRelic' : null, offer: null, shop: null,
    intro: true, over: false, won: false, dead: false, killer: '', lastLog: ''
  };
  if (k.mod === 'glaskanone') k.maxHp = Math.ceil(k.maxHp / 2);
  if (k.mod === 'glaskanone' && k.wpn) k.wpn += 3;
  k.hp = k.maxHp;
  for (let i = 0; i < 9; i++) k.grid[i] = i === 4 ? mk('hero') : spawn(true);
}
function startRun(mode){
  const kd = D.kerker;
  if (mode !== 'daily' && !kd.heroes[kd.hero]){ Sfx.lock(); return; }
  if (kd.run && !kd.run.over) settleAbandon(kd.run);
  newRun(mode);
  D.stats.kRuns++;
  if (mode === 'daily'){
    const today = todayKey(), dd = kd.daily;
    if (dd.key !== today){
      dd.streak = dd.last && dayDiff(dd.last, today) === 1 ? dd.streak + 1 : 1;
      dd.last = today; dd.key = today; dd.best = 0; dd.runs = 0;
    }
    dd.runs++;
    unlock('k_daily');
  }
  kd.run = k; save();
  if (current === 'kerker') SCREENS.kerker.enter(); else go('kerker');
}
function settleAbandon(run){
  // Aufgegebener Lauf: Gold landet trotzdem im Schatz
  D.kerker.bank += run.gold;
  D.kerker.best = Math.max(D.kerker.best, run.gold);
  D.kerker.run = null;
}
function saveRun(){ if (k && !k.over){ D.kerker.run = k; save(); } }

/* =====================================================================
   DARSTELLUNG
   ===================================================================== */
function codexId(c){
  if (c.type === 'monster') return 'm_' + c.kind;
  if (c.type === 'boss') return 'b_' + c.boss;
  if (c.type === 'hero') return '';
  return 'c_' + c.type;
}
function discover(id){
  if (!id || D.kerker.codex[id]) return;
  D.kerker.codex[id] = 1;
  if (TIPS[id] && !D.tips[id]) tipQ.push(id);
  if (Object.keys(MONSTERS).every(m => D.kerker.codex['m_' + m])) unlock('k_codex');
}
function cardInner(c){
  switch (c.type){
    case 'hero': {
      const foot = [];
      if (k.armor) foot.push(`<span class="badge b-armor">${icon('armor')}${k.armor}</span>`);
      if (k.poison) foot.push(`<span class="badge b-poison">${icon('drop')}${k.poison}</span>`);
      if (k.rage) foot.push(`<span class="badge b-rage">Raserei ${k.rage}</span>`);
      return `<div class="top"><span class="cv">${k.hp}</span>${k.wpn ? `<span class="badge">${icon('sword')}${k.wpn}</span>` : ''}</div>${icon(k.hero)}<div class="hero-foot">${foot.length ? foot.join('') : `<span class="cn">${HEROES[k.hero].name}</span>`}</div>`;
    }
    case 'monster': {
      let badge = '';
      if (c.elite) badge = '<span class="badge b-elite">Elite</span>';
      else if (c.kind === 'ghost') badge = `<span class="badge b-fade">${icon('clock')}</span>`;
      else if (c.kind === 'spider') badge = `<span class="badge b-poison">${icon('drop')}</span>`;
      return `<div class="top"><span class="cv">${c.val}</span>${badge}</div>${icon(c.kind)}<span class="cn">${MONSTERS[c.kind].name}</span>`;
    }
    case 'boss': {
      const B = BOSSES[c.boss];
      let badge;
      if (c.boss === 'waechter') badge = `<span class="badge b-cd">${icon('shield')}4</span>`;
      else if (c.boss === 'knochen') badge = `<span class="badge b-cd">${icon('heart')}+1</span>`;
      else badge = `<span class="badge b-cd ${c.cd <= 1 ? 'hot' : ''}">${icon(B.badge)}${c.cd}</span>`;
      return `<div class="top"><span class="cv">${c.val}</span>${badge}</div>${icon(c.boss)}<span class="cn">${B.name}</span>`;
    }
    case 'chest': {
      const seen = c.mimic && has('auge');
      return `<div class="top"><span class="cv">?</span>${seen ? '<span class="badge b-elite">Mimic</span>' : ''}</div>${icon(seen ? 'mimic' : 'chest')}<span class="cn">Truhe</span>`;
    }
    case 'weapon': return `<div class="top"><span class="cv">${c.val}</span></div>${icon('sword')}<span class="cn">${weaponName(c.val)}</span>`;
    case 'shrine': case 'merchant': return `<div class="top"><span class="cv">&nbsp;</span></div>${icon(c.type)}<span class="cn">${CARDS[c.type].name}</span>`;
    default: return `<div class="top"><span class="cv">${c.val}</span></div>${icon(CARDS[c.type].ic)}<span class="cn">${CARDS[c.type].name}</span>`;
  }
}
function cardLabel(c){
  switch (c.type){
    case 'hero': return `${HEROES[k.hero].name}, ${k.hp} Leben` + (k.wpn ? `, Waffe ${k.wpn}` : '') + (k.armor ? `, Rüstung ${k.armor}` : '');
    case 'monster': return `${MONSTERS[c.kind].name}, Stärke ${c.val}` + (c.elite ? ', Elite' : '');
    case 'boss': return `${BOSSES[c.boss].name}, ${c.val} Leben`;
    case 'chest': case 'shrine': case 'merchant': return CARDS[c.type].name;
    default: return `${cardName(c)} ${c.val}`;
  }
}
function hotCells(){
  const hot = new Set();
  k.grid.forEach((c, i) => {
    if (c.type === 'bomb' && c.val <= 1){ hot.add(i); nbrs(i).forEach(j => hot.add(j)); }
    if (c.type === 'boss' && c.boss === 'drache' && c.cd <= 1){
      for (let j = 0; j < 9; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i))) hot.add(j);
    }
  });
  return hot;
}
function isTarget(c){
  if (!k.targeting) return false;
  const tg = ABILITIES[HEROES[k.hero].ability].target;
  if (tg === 'monster') return c.type === 'monster' || c.type === 'boss';
  return c.type !== 'hero';
}
function render(initial = false){
  const hc = colOf(k.pos), hr = rowOf(k.pos), hot = hotCells();
  k.grid.forEach((c, i) => {
    let n = nodes.get(c.id);
    const fresh = !n;
    if (fresh){
      n = document.createElement('div');
      n.innerHTML = '<div class="ci"></div>';
      n.style.setProperty('--rot', c.rot);
      nodes.set(c.id, n);
      board.appendChild(n);
    }
    const col = colOf(i), row = rowOf(i);
    n.style.setProperty('--c', col);
    n.style.setProperty('--r', row);
    n.dataset.i = i;
    const cls = ['card', 't-' + c.type];
    if (c.kind) cls.push('k-' + c.kind);
    if (c.type !== 'hero' && Math.abs(col - hc) + Math.abs(row - hr) > 1 && !k.targeting) cls.push('far');
    if (fresh || n.classList.contains('spawn')) cls.push('spawn');
    if (c.elite) cls.push('elite');
    if (c.type === 'chest' && c.mimic) cls.push('mimic-tell');
    if (hot.has(i)) cls.push('hot');
    if (isTarget(c)) cls.push('tgt');
    n.className = cls.join(' ');
    if (fresh){
      if (initial) n.firstChild.style.animationDelay = (i * 35) + 'ms';
      setTimeout(() => { n.classList.remove('spawn'); n.firstChild.style.animationDelay = ''; }, initial ? 700 : 400);
    }
    const html = cardInner(c);
    if (n._html !== html){ n.firstChild.innerHTML = html; n._html = html; }
    n.setAttribute('aria-label', cardLabel(c));
    discover(codexId(c));
    if (c.elite && !D.tips.elite && !tipQ.includes('elite')) tipQ.push('elite');
  });
  board.classList.toggle('targeting', !!k.targeting);
}
function removeNode(c){
  const n = c && nodes.get(c.id);
  if (!n) return;
  nodes.delete(c.id);
  n.classList.add('gone');
  setTimeout(() => n.remove(), 260);
}
function fxAt(i, text, kind){
  const e = document.createElement('div');
  e.className = 'fx ' + kind;
  e.style.setProperty('--c', colOf(i)); e.style.setProperty('--r', rowOf(i));
  e.innerHTML = `<span>${text}</span>`;
  board.appendChild(e);
  setTimeout(() => e.remove(), 1050);
}
function anim(c, cls){
  const n = c && nodes.get(c.id);
  if (!n) return;
  const ci = n.firstChild;
  ci.classList.remove(cls); void ci.offsetWidth; ci.classList.add(cls);
  ci.addEventListener('animationend', () => ci.classList.remove(cls), { once: true });
}
function quake(n){
  if (reduceMotion) return;
  kWrap.classList.remove('quake1', 'quake2'); void kWrap.offsetWidth; kWrap.classList.add('quake' + n);
}
function log(html){ k.lastLog = html; $('#kLog').innerHTML = html; }

function hud(){
  const low = k.hp <= Math.max(3, Math.floor(k.maxHp * .3));
  $('#kHp').textContent = `${k.hp}/${k.maxHp}`;
  $('#kHpBar').style.width = clamp(k.hp / k.maxHp * 100, 0, 100) + '%';
  $('#kHpBox').classList.toggle('low', low);
  $('#kWpn').textContent = k.wpn || '–';
  $('#kGold').textContent = k.gold;
  const bossCard = k.grid.find(c => c.type === 'boss');
  if (isAdv()){
    $('#kLvlLbl').textContent = 'Etage';
    $('#kLvl').textContent = `${Math.min(k.floor, 5)}/5`;
    $('#kFloorName').textContent = FLOORS[Math.min(k.floor, 5) - 1].name;
  } else {
    $('#kLvlLbl').textContent = 'Tiefe';
    $('#kLvl').textContent = k.steps;
    $('#kFloorName').textContent = 'Endlose Tiefe';
  }
  const left = bossEvery() - k.floorSteps;
  $('#kSub').textContent = bossCard ? `${BOSSES[bossCard.boss].name} ist da`
    : k.won ? 'Bezwungen' : `Boss in ${Math.max(0, left)} ${plural(Math.max(0, left), 'Zug', 'Zügen')}`;
  const tag = $('#kModeTag');
  tag.textContent = k.mode === 'daily' ? MODS[k.mod].name : MODE_NAME[k.mode];
  tag.className = 'tb-mode' + (k.mode === 'daily' ? ' daily' : '');
  const danger = low && !k.over;
  kScreen.classList.toggle('danger', danger);
  if (danger && !heartTimer) heartTimer = setInterval(() => { if (current === 'kerker' && !sheetOpen()) Sfx.heart(); }, 1150);
  if (!danger && heartTimer){ clearInterval(heartTimer); heartTimer = 0; }
  // Fähigkeit
  const H = HEROES[k.hero], A = ABILITIES[H.ability], ready = k.charge >= H.charge;
  const ab = $('#kAbility');
  ab.className = 'ability' + (ready && !k.targeting ? ' ready' : '') + (k.targeting ? ' active' : '');
  ab.innerHTML = `<span class="ab-ring" style="--p:${Math.min(1, k.charge / H.charge)}"><span>${icon(k.hero)}</span></span>
    <span class="ab-text"><b>${A.name}</b><small>${k.targeting ? 'Ziel antippen' : ready ? 'Bereit! Antippen' : `${k.charge}/${H.charge} Siege`}</small></span>`;
  ab.setAttribute('aria-label', `${A.name}: ${ready ? 'bereit' : `${k.charge} von ${H.charge} Siegen geladen`}`);
  // Relikte und Serie
  const rs = $('#kRelics');
  rs.innerHTML = (k.relics.length ? k.relics.map(id => icon('r_' + id, 'r-' + id)).join('') : '<span class="empty">Noch keine Relikte</span>')
    + (k.streak >= 2 ? `<span class="streak">Serie ×${k.streak}</span>` : '');
}

/* =====================================================================
   EFFEKTE: Partikel auf einer Leinwand über dem Spielfeld
   ===================================================================== */
const FX = (() => {
  const cv = $('#kFx'), cx = cv.getContext('2d');
  let parts = [], raf = 0, W = 0, H = 0, dpr = 1, last = 0;
  const WARM = { red: '#C4622D', deep: '#9C4B21', gold: '#F2C14E', cream: '#F5F0E6', petrol: '#2B4C5C', green: '#5E8C61', smoke: '#8C8272', fire: '#E0583A' };
  const PAPER = { red: '#D2413A', deep: '#A5302A', gold: '#E8C21C', cream: '#2B2B30', petrol: '#2F5DA8', green: '#2F8A55', smoke: '#6C6B73', fire: '#E0583A' };
  const pal = () => isPaper() ? PAPER : WARM;
  function resize(){
    const r = kScreen.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    W = r.width; H = r.height;
  }
  function center(i){
    const s = kScreen.getBoundingClientRect(), b = board.getBoundingClientRect(), g = 10;
    const cw = (b.width - 2 * g) / 3, ch = (b.height - 2 * g) / 3;
    return { x: b.left - s.left + colOf(i) * (cw + g) + cw / 2, y: b.top - s.top + rowOf(i) * (ch + g) + ch / 2, w: cw, h: ch };
  }
  function elCenter(el){
    const s = kScreen.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { x: b.left - s.left + b.width / 2, y: b.top - s.top + b.height / 2 };
  }
  function add(p){
    if (reduceMotion && p.kind !== 'coin') return;
    parts.push(p);
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(loop); }
  }
  function burst(x, y, n, colors, o = {}){
    for (let j = 0; j < n; j++){
      const a = (o.dir != null ? o.dir + (vr() - .5) * (o.spread || 1) : vr() * 6.283), v = (o.v || 160) * (.4 + vr() * .8);
      add({ kind: o.kind || 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g ?? 320, life: (o.life || .6) * (.6 + vr() * .6), max: o.life || .6,
            size: (o.size || 4) * (.6 + vr() * .8), col: colors[j % colors.length], rot: vr() * 6.28, vr: (vr() - .5) * 10, grow: o.grow || 0 });
    }
  }
  function loop(ts){
    const dt = Math.min(.05, (ts - last) / 1000); last = ts;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    const paper = isPaper();
    for (const p of parts){
      if (p.delay > 0){ p.delay -= dt; continue; }
      p.life -= dt;
      if (p.kind === 'coin'){
        p.t = Math.min(1, p.t + dt / p.dur);
        const u = 1 - p.t, e = p.t * p.t;
        p.x = u * u * p.x0 + 2 * u * p.t * p.cx + e * p.x1;
        p.y = u * u * p.y0 + 2 * u * p.t * p.cy + e * p.y1;
        if (p.t >= 1){ p.life = 0; if (p.onArrive) p.onArrive(); }
      } else if (p.kind === 'ring' || p.kind === 'flash'){
        p.r += p.vr * dt;
      } else if (p.kind === 'ball'){
        p.t = Math.min(1, p.t + dt / p.dur);
        p.x = lerp(p.x0, p.x1, p.t); p.y = lerp(p.y0, p.y1, p.t) - Math.sin(p.t * Math.PI) * 30;
        if (vr() < .7) burst(p.x, p.y, 1, [pal().fire, pal().gold], { v: 40, life: .35, size: 5, g: -60 });
        if (p.t >= 1){ p.life = 0; if (p.onArrive) p.onArrive(); }
      } else {
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.rot += p.vr * dt; p.size += p.grow * dt;
      }
      const al = clamp(p.life / p.max, 0, 1);
      cx.globalAlpha = p.kind === 'coin' || p.kind === 'ball' ? 1 : al;
      draw(p, paper, al);
    }
    cx.globalAlpha = 1;
    parts = parts.filter(p => p.life > 0);
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) cx.clearRect(0, 0, W, H);
  }
  function draw(p, paper){
    const c = cx;
    if (p.kind === 'coin'){
      c.beginPath(); c.arc(p.x, p.y, 7, 0, 7);
      c.fillStyle = paper ? 'rgba(244,217,58,.9)' : '#F2C14E'; c.fill();
      c.lineWidth = paper ? 1.6 : 2; c.strokeStyle = paper ? '#2B2B30' : '#D69E2E'; c.stroke();
      return;
    }
    if (p.kind === 'ball'){
      c.beginPath(); c.arc(p.x, p.y, 10, 0, 7); c.fillStyle = pal().fire; c.fill();
      c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fillStyle = pal().gold; c.fill();
      return;
    }
    if (p.kind === 'ring'){
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.lineWidth = p.w || 4; c.strokeStyle = p.col;
      if (paper) c.setLineDash([6, 5]);
      c.stroke(); c.setLineDash([]);
      return;
    }
    if (p.kind === 'flash'){
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fillStyle = p.col; c.fill();
      return;
    }
    if (p.kind === 'smoke'){
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, 7);
      if (paper){ c.lineWidth = 1.4; c.strokeStyle = p.col; c.stroke(); } else { c.fillStyle = p.col; c.fill(); }
      return;
    }
    if (p.kind === 'conf'){
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col;
      if (paper){ c.strokeStyle = p.col; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.stroke(); }
      else c.fillRect(-4, -2.5, 8, 5);
      c.restore();
      return;
    }
    if (paper){
      c.strokeStyle = p.col; c.lineWidth = 1.8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); c.stroke();
    } else {
      c.fillStyle = p.col; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  const api = {
    resize,
    clear(){ parts = []; },
    splat(i, cols){ if (!board.isConnected) return; const c = center(i); burst(c.x, c.y, 14, cols, { v: 190, life: .55, size: 5 }); },
    hurt(i){ const c = center(i); burst(c.x, c.y, 10, [pal().red, pal().deep], { v: 150, life: .5, size: 4 }); },
    hit(i){ const c = center(i); burst(c.x, c.y, 8, [pal().cream, pal().gold], { v: 220, life: .35, size: 3, g: 0 }); },
    coins(i, n){
      const from = center(i), to = elCenter($('#kGoldBox'));
      for (let j = 0; j < n; j++){
        add({ kind: 'coin', x0: from.x + (vr() - .5) * 30, y0: from.y + (vr() - .5) * 30, x1: to.x, y1: to.y,
              cx: from.x + (vr() - .5) * 160, cy: Math.min(from.y, to.y) - 40 - vr() * 60, x: from.x, y: from.y,
              t: 0, dur: .5 + vr() * .25, delay: j * .05, life: 5, max: 5,
              onArrive: j === n - 1 ? () => { const b = $('#kGoldBox'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } : null });
      }
    },
    explosion(i){
      const c = center(i), P = pal();
      add({ kind: 'flash', x: c.x, y: c.y, r: 10, vr: 260, life: .22, max: .22, col: isPaper() ? 'rgba(224,88,58,.35)' : 'rgba(242,193,78,.8)' });
      add({ kind: 'ring', x: c.x, y: c.y, r: 12, vr: 420, w: 6, life: .4, max: .4, col: P.fire });
      burst(c.x, c.y, 34, [P.fire, P.gold, P.red, P.deep], { v: 380, life: .7, size: 6 });
      burst(c.x, c.y, 10, [isPaper() ? P.smoke : 'rgba(80,72,60,.55)'], { kind: 'smoke', v: 70, life: 1.1, size: 12, g: -40, grow: 26 });
    },
    whirl(i){
      const c = center(i), P = pal();
      add({ kind: 'ring', x: c.x, y: c.y, r: 20, vr: 300, w: 8, life: .45, max: .45, col: P.gold });
      add({ kind: 'ring', x: c.x, y: c.y, r: 10, vr: 220, w: 4, life: .5, max: .5, col: P.cream });
      burst(c.x, c.y, 18, [P.gold, P.cream], { v: 280, life: .5, size: 4, g: 0 });
    },
    fireball(from, to, done){
      const a = center(from), b = center(to);
      if (reduceMotion){ done(); return; }
      add({ kind: 'ball', x0: a.x, y0: a.y, x1: b.x, y1: b.y, x: a.x, y: a.y, t: 0, dur: .35, life: 2, max: 2, onArrive: () => { api.explosionSmall(to); done(); } });
    },
    explosionSmall(i){ const c = center(i), P = pal(); burst(c.x, c.y, 22, [P.fire, P.gold, P.red], { v: 260, life: .55, size: 5 }); },
    poof(i){ const c = center(i), P = pal(); burst(c.x, c.y, 12, [isPaper() ? P.petrol : 'rgba(40,36,60,.6)', P.smoke], { kind: 'smoke', v: 90, life: .7, size: 9, g: -30, grow: 18 }); },
    phoenix(i){ const c = center(i), P = pal(); burst(c.x, c.y + 20, 40, [P.fire, P.gold, P.red], { dir: -Math.PI / 2, spread: 1.4, v: 320, life: 1, size: 5, g: 120 }); add({ kind: 'ring', x: c.x, y: c.y, r: 20, vr: 360, w: 6, life: .5, max: .5, col: P.gold }); },
    sparkle(i){ const c = center(i), P = pal(); burst(c.x, c.y, 24, [P.gold, P.cream, P.petrol], { v: 200, life: .8, size: 4, g: -40 }); },
    rage(i){ const c = center(i), P = pal(); add({ kind: 'ring', x: c.x, y: c.y, r: 15, vr: 260, w: 7, life: .5, max: .5, col: P.red }); burst(c.x, c.y, 16, [P.red, P.deep], { v: 220, life: .5, size: 5, g: 0 }); },
    burn(i){ const c = center(i), P = pal(); burst(c.x, c.y + c.h / 3, 14, [P.fire, P.gold, P.red], { dir: -Math.PI / 2, spread: 1, v: 200, life: .6, size: 6, g: -60 }); },
    death(i){ const c = center(i), P = pal(); burst(c.x, c.y, 40, [P.red, P.deep, P.cream], { v: 300, life: 1, size: 6 }); },
    confetti(){
      const P = pal(), cols = [P.gold, P.red, P.petrol, P.green, P.fire];
      for (let j = 0; j < 90; j++) add({ kind: 'conf', x: vr() * W, y: -20 - vr() * H * .4, vx: (vr() - .5) * 80, vy: 60 + vr() * 120, g: 90, life: 3, max: 3, size: 5, col: cols[j % cols.length], rot: vr() * 6, vr: (vr() - .5) * 12, grow: 0 });
    }
  };
  return api;
})();
function splatColors(c){
  const P = isPaper();
  if (c.kind === 'ghost') return P ? ['#8FA8CC', '#2B2B30'] : ['#CFDCE0', '#AEBEC4'];
  if (c.kind === 'spider') return P ? ['#2F8A55', '#2B2B30'] : ['#7A9A3A', '#1E3641'];
  if (c.kind === 'mimic') return P ? ['#9A6A43', '#E8C21C'] : ['#8A5A36', '#F2C14E'];
  if (c.type === 'boss') return P ? ['#D2413A', '#E8C21C', '#2B2B30'] : ['#C4622D', '#F2C14E', '#1E3641'];
  return P ? ['#D2413A', '#A5302A'] : ['#C4622D', '#9C4B21'];
}

/* =====================================================================
   SPIELZUG
   ===================================================================== */
function canAct(){ return k && !k.over && !kBusy && current === 'kerker' && !sheetOpen() && !k.pending; }
function beginTurn(){ T = { kills: 0, msg: [], hurt: 0, bossDown: null }; hideTip(); }

function move(dir){
  if (!canAct()) return;
  if (k.targeting){ setTargeting(false); }
  const [dx, dy] = DIRS[dir];
  const c = colOf(k.pos) + dx, r = rowOf(k.pos) + dy;
  if (c < 0 || c > 2 || r < 0 || r > 2){ Sfx.bump(); anim(heroCard(), 'shake'); return; }
  const ti = r * 3 + c;
  beginTurn();
  k.steps++; k.floorSteps++; D.stats.kSteps++;
  const moveIn = interact(ti);
  if (!k.dead && moveIn) shift(ti, dx, dy);
  endTurn();
}
function shift(ti, dx, dy){
  const t = k.grid[ti], hero = heroCard();
  if (t !== hero) removeNode(t);
  let cc = colOf(k.pos), cr = rowOf(k.pos);
  k.grid[ti] = hero;
  for (;;){
    const bc = cc - dx, br = cr - dy;
    if (bc < 0 || bc > 2 || br < 0 || br > 2) break;
    k.grid[cr * 3 + cc] = k.grid[br * 3 + bc];
    cc = bc; cr = br;
  }
  k.pos = ti;
  k.grid[cr * 3 + cc] = spawn();
  Sfx.step();
}

function interact(ti){
  const t = k.grid[ti];
  switch (t.type){
    case 'monster': case 'boss': return fight(t, ti);
    case 'weapon': {
      const v = t.val + (has('schleif') ? 2 : 0) + (has('kanone') ? 4 : 0) + (k.mod === 'glaskanone' ? 3 : 0);
      const old = k.wpn;
      k.wpn = v;
      fxAt(ti, `Stärke ${v}`, 'muted');
      say(`${weaponName(t.val)} aufgenommen: Stärke <b>${v}</b>.` + (old ? ` Die alte Waffe (${old}) bleibt liegen.` : ''));
      Sfx.weapon();
      return true;
    }
    case 'armor': {
      k.armor = Math.min(20, k.armor + t.val);
      fxAt(ti, '+' + t.val, 'armor');
      say(`Rüstung <b>+${t.val}</b>. Sie schluckt Schaden, bevor du Leben verlierst.`);
      Sfx.shield();
      return true;
    }
    case 'potion': {
      const g = heal(t.val + (has('kraeuter') ? 3 : 0) + (k.hero === 'magierin' ? 2 : 0));
      fxAt(ti, '+' + g, 'good');
      say(g ? `Trank getrunken: <b>+${g}</b> Leben.` : 'Trank getrunken, aber du warst schon voll.');
      Sfx.potion();
      return true;
    }
    case 'gold': {
      const g = goldValue(t.val);
      gainGold(g, ti);
      say(`<b>+${g}</b> Gold.`);
      Sfx.coin();
      return true;
    }
    case 'chest': return openChest(t, ti);
    case 'bomb':
      gainGold(3, ti);
      say('Bombe entschärft: <b>+3</b> Gold.');
      Sfx.defuse();
      return true;
    case 'trap':
      if (has('stiefel')){ say('Deine Giftstiefel schützen dich vor der Falle.'); Sfx.defuse(); return true; }
      Sfx.trap();
      hurt(t.val, 'trap', 'Eine Stachelfalle');
      say(`Stachelfalle! <b>−${t.val}</b>.`);
      return true;
    case 'shrine':
      k.pending = 'shrine';
      say('Ein Schrein leuchtet auf.');
      Sfx.relic();
      return true;
    case 'merchant':
      k.pending = 'merchant'; k.shop = null;
      say('Der Händler breitet seine Waren aus.');
      Sfx.shop();
      return true;
  }
  return true;
}

function fight(t, ti){
  const boss = t.type === 'boss', name = cardName(t), rage = k.rage > 0;
  if (rage) k.rage--;
  if (k.wpn > 0 && t.kind !== 'ghost'){
    let dmg = Math.min(k.wpn, t.val);
    const capped = boss && t.boss === 'waechter' && dmg > 4;
    if (capped) dmg = 4;
    const crit = R() < critChance();
    t.val -= dmg;
    if (!crit && !rage) k.wpn -= dmg;
    if (crit){
      k.crits++; fxAt(ti, 'Kritisch!', 'crit'); Sfx.crit(); buzz([20, 20, 40]);
      if (k.crits >= 5) unlock('k_crit');
    }
    if (t.val <= 0){
      killed(t, ti, 'weapon');
      say(`${name} besiegt. ` + (crit ? 'Kritischer Treffer, deine Waffe bleibt heil.' : rage ? 'Die Raserei schont deine Waffe.' : k.wpn ? `Deine Waffe hält noch <b>${k.wpn}</b>.` : 'Deine Waffe ist verbraucht.'));
      return true;
    }
    fxAt(ti, '−' + dmg, 'bad'); anim(t, 'flash'); FX.hit(ti);
    if (!crit) Sfx.clash();
    buzz(25);
    say((k.wpn ? `Treffer! ${name} hat noch <b>${t.val}</b>, deine Waffe noch <b>${k.wpn}</b>.` : `Deine Waffe ist zerbrochen. ${name} hat noch <b>${t.val}</b>.`)
      + (capped ? ' Der Panzer lässt nur 4 Schaden durch.' : ''));
    return false;
  }
  // Ohne Waffe: der Held steckt den Schaden ein
  const dmg = rage ? Math.floor(t.val / 2) : t.val;
  hurt(dmg, 'fight', cardArt(t));
  if (k.dead) return false;
  if (t.kind === 'spider' || (boss && t.boss === 'koenigin')) poison(3);
  let extra = '';
  if (k.hero === 'berserker'){ const g = heal(1); if (g) extra = ' Blutdurst: <b>+1</b> Leben.'; }
  killed(t, ti, 'hand');
  say(`${name} ohne Waffe besiegt: <b>−${dmg}</b> Leben.` + extra
    + (t.kind === 'ghost' && k.wpn ? ' Waffen gleiten durch Geister.' : '')
    + (rage ? ' Die Raserei halbiert den Schaden.' : ''));
  return true;
}

function killed(t, ti, how){
  k.kills++; T.kills++; D.stats.kKills++;
  if (how !== 'ability') addCharge(has('horn') ? 2 : 1);
  if (has('vampir')) heal(1);
  if (t.elite) gainGold(t.orig || t.val, ti);
  if (t.kind === 'mimic') gainGold((t.orig || 4) * 2, ti);
  Sfx.kill(); buzz(15);
  FX.splat(ti, splatColors(t));
  unlock('k_first');
  if (t.type === 'boss') bossDown(t, ti);
}
function bossDown(t, ti){
  k.bosses++; D.stats.kBosses++;
  k.bossOut = false;
  unlock('k_boss');
  const bonus = 10 * k.floor;
  gainGold(bonus, ti);
  T.bossDown = { boss: t.boss, floor: k.floor, bonus };
  quake(2); buzz([60, 40, 100]);
  // Nächste Etage beginnt sofort, damit neue Karten schon zur neuen Etage gehören
  k.floor++; k.floorSteps = 0;
  if (isAdv() && k.floor > 5){ k.won = true; return; }
  if (has('dornen')) k.armor = Math.min(20, k.armor + 4);
  if (has('titan')){ k.maxHp += 3; k.hp = k.maxHp; }
  if (isAdv()){
    D.kerker.bestFloor = Math.max(D.kerker.bestFloor, k.floor);
    if (k.floor >= 3) unlock('k_floor3');
  }
  checkHeroUnlocks();
}
function addCharge(n){
  const H = HEROES[k.hero], before = k.charge;
  k.charge = Math.min(H.charge, k.charge + n);
  if (before < H.charge && k.charge >= H.charge){ say(`<b>${ABILITIES[H.ability].name}</b> ist bereit!`); tone(880, .12, 'triangle', .05); }
}
function hurt(n, src, who){
  if (n <= 0 || k.dead) return 0;
  if (src !== 'poison' && k.armor > 0){
    const a = Math.min(k.armor, n);
    k.armor -= a; n -= a;
    fxAt(k.pos, '−' + a, 'armor');
    Sfx.armor();
  }
  if (n > 0){
    k.hp -= n; T.hurt += n;
    fxAt(k.pos, '−' + n, src === 'poison' ? 'poison' : 'bad');
    anim(heroCard(), 'shake');
    if (src === 'poison') Sfx.poison();
    else { Sfx.hit(); buzz(n >= 5 ? [60, 30, 60] : 50); FX.hurt(k.pos); }
    if (n >= 5) quake(n >= 8 ? 2 : 1);
  }
  if (k.hp <= 0){
    if (has('phoenix') && !k.phoenixUsed){
      k.phoenixUsed = true; k.hp = Math.min(6, k.maxHp); k.poison = 0;
      FX.phoenix(k.pos); Sfx.phoenix(); buzz([40, 30, 40, 30, 120]); unlock('k_phoenix');
      say('<b>Die Phönixfeder verbrennt</b> und du stehst wieder auf!');
    } else {
      k.hp = 0; k.dead = true; k.killer = who || 'Etwas';
    }
  }
  return n;
}
function heal(n){
  const g = Math.max(0, Math.min(n, k.maxHp - k.hp));
  k.hp += g;
  if (g) anim(heroCard(), 'heal');
  return g;
}
function poison(n){
  if (has('stiefel')) return;
  k.poison = Math.min(9, k.poison + n);
  say(`<b>Vergiftet!</b>`);
  Sfx.poison();
}
function goldValue(v){
  const mul = (1 + (has('midas') ? .5 : 0) + (k.hero === 'schurkin' ? .5 : 0)) * (k.mod === 'goldrausch' ? 2 : 1);
  return Math.max(1, Math.round(v * mul));
}
function gainGold(g, ti){
  if (g <= 0) return;
  k.gold += g; D.stats.kGold += g;
  fxAt(ti, '+' + g, 'gold');
  FX.coins(ti, Math.min(8, 2 + Math.floor(g / 3)));
  if (k.gold >= 200) unlock('k_rich');
}
function openChest(t, ti){
  if (t.mimic){
    t.type = 'monster'; t.kind = 'mimic'; t.mimic = false;
    t.val = t.orig = ri(4, 5 + k.floor * 2);
    Sfx.reveal(); buzz([40, 20, 80]); quake(1); anim(t, 'flash');
    unlock('k_mimic');
    hurt(2, 'bite', 'Ein Mimic');
    say(`<b>Die Truhe beißt!</b> Ein Mimic mit Stärke ${t.val}.`);
    return false;
  }
  const L = level(), r = R();
  if (r < .45){
    const g = Math.round(ri(5, 9 + L * 2) * (has('auge') ? 1.5 : 1));
    gainGold(g, ti); say(`Truhe geöffnet: <b>+${g}</b> Gold.`);
  } else if (r < .63){
    const g = heal(6); fxAt(ti, '+' + g, 'good');
    say(g ? `Truhe geöffnet: ein Heiltrank, <b>+${g}</b> Leben.` : 'Truhe geöffnet: ein Heiltrank, aber du warst schon voll.');
  } else if (r < .78){
    const w = ri(4, 6 + Math.ceil(L / 2)) + (has('schleif') ? 2 : 0) + (has('kanone') ? 4 : 0);
    if (w > k.wpn){ k.wpn = w; fxAt(ti, `Stärke ${w}`, 'muted'); say(`Truhe geöffnet: ${weaponName(w)} mit Stärke <b>${w}</b>.`); }
    else { gainGold(5, ti); say('Truhe geöffnet: eine schwächere Waffe. Du verkaufst sie für <b>5</b> Gold.'); }
  } else if (r < .9){
    k.armor = Math.min(20, k.armor + 3); fxAt(ti, '+3', 'armor');
    say('Truhe geöffnet: Rüstung <b>+3</b>.');
  } else {
    k.pending = 'chestRelic';
    say('<b>In der Truhe liegt ein Relikt!</b>');
  }
  Sfx.chest();
  return true;
}

function endTurn(){
  if (!k.dead){
    if (T.kills > 0){
      k.streak++;
      k.bestStreak = Math.max(k.bestStreak, k.streak);
      D.stats.kBestStreak = Math.max(D.stats.kBestStreak, k.streak);
      if (k.streak >= 3){ const b = Math.min(10, k.streak); gainGold(b, k.pos); say(`Serie ×${k.streak}: <b>+${b}</b> Bonus-Gold!`); Sfx.streak(k.streak); }
      if (k.streak >= 5) unlock('k_streak');
    } else k.streak = 0;
    if (k.poison > 0){ k.poison--; hurt(1, 'poison', 'Das Gift'); }
    if (!k.dead && k.mod === 'giftnebel' && k.steps % 8 === 0) poison(2);
    if (!k.dead) tickCards();
  }
  if (k.shrineCd > 0) k.shrineCd--;
  if (k.merchantCd > 0) k.merchantCd--;
  finishTurn();
}
function tickCards(){
  const booms = [];
  for (const c of k.grid.slice()){
    const i = k.grid.indexOf(c);
    if (i < 0) continue;
    if (c.fresh){ c.fresh = false; continue; }
    if (c.type === 'bomb'){
      c.val--;
      if (c.val <= 0) booms.push(c); else if (c.val === 1) Sfx.tick();
    } else if (c.type === 'monster' && c.kind === 'ghost'){
      c.val--;
      if (c.val <= 0){ removeNode(c); k.grid[i] = mk('gold', 1); fxAt(i, 'verblasst', 'muted'); }
    } else if (c.type === 'boss') bossTick(c, i);
    if (k.dead) return;
  }
  while (booms.length && !k.dead){
    const b = booms.shift(), i = k.grid.indexOf(b);
    if (i >= 0) explode(i, booms);
  }
}
function explode(i, queue){
  const bomb = k.grid[i];
  Sfx.explode(); buzz([70, 30, 110]); quake(2); FX.explosion(i);
  removeNode(bomb);
  k.grid[i] = spawn();
  let kills = 0;
  for (const j of nbrs(i)){
    const t = k.grid[j];
    if (t.type === 'hero'){
      if (has('feuerfest')) fxAt(j, 'geschützt', 'muted');
      else hurt(5, 'bomb', 'Eine Explosion');
    } else if (t.type === 'monster' || t.type === 'boss'){
      t.val -= 6;
      if (t.val <= 0){
        kills++;
        killed(t, j, 'bomb');
        removeNode(t);
        k.grid[j] = t.type === 'boss' ? mk('gold', 5) : mk('gold', Math.max(1, Math.ceil((t.orig || 2) / 2)));
      } else { fxAt(j, '−6', 'bad'); anim(t, 'flash'); }
    } else if (t.type === 'bomb'){
      if (!queue.includes(t)) queue.push(t);
    } else if (t.type !== 'shrine' && t.type !== 'merchant'){
      removeNode(t);
      k.grid[j] = spawn();
      fxAt(j, 'zerstört', 'muted');
    }
    if (k.dead) break;
  }
  say(kills ? `Explosion! <b>${kills}</b> ${plural(kills, 'Monster', 'Monster')} ${plural(kills, 'wird', 'werden')} zu Gold.` : 'Eine Bombe explodiert!');
  if (kills >= 2) unlock('k_bomb');
}
function bossTick(c, i){
  const B = BOSSES[c.boss];
  if (c.boss === 'knochen'){
    if (c.val < c.max){ c.val++; fxAt(i, '+1', 'poison'); Sfx.regen(); }
    return;
  }
  if (!B.every) return;
  c.cd--;
  if (c.cd > 0) return;
  c.cd = B.every;
  if (c.boss === 'koenigin'){
    const loot = ['gold', 'potion', 'weapon', 'armor', 'chest', 'trap'];
    const cand = [];
    for (let j = 0; j < 9; j++) if (j !== i && j !== k.pos && loot.includes(k.grid[j].type)) cand.push(j);
    if (!cand.length) return;
    const near = cand.filter(j => adjacent(j, i)), pool = near.length ? near : cand;
    const j = pool[Math.floor(R() * pool.length)];
    removeNode(k.grid[j]);
    const v = ri(2, 2 + k.floor);
    k.grid[j] = mk('monster', v, { kind: 'spider', orig: v });
    fxAt(j, 'Ei!', 'bad'); Sfx.egg(); FX.poof(j);
    say('Die Spinnenkönigin lässt eine Giftspinne schlüpfen!');
  } else if (c.boss === 'schatten'){
    const cand = [];
    for (let j = 0; j < 9; j++) if (j !== i && j !== k.pos) cand.push(j);
    const j = cand[Math.floor(R() * cand.length)];
    [k.grid[i], k.grid[j]] = [k.grid[j], k.grid[i]];
    [c, k.grid[i]].forEach(x => { const n = nodes.get(x.id); if (n){ n.classList.add('teleport'); setTimeout(() => n.classList.remove('teleport'), 60); } });
    FX.poof(i); FX.poof(j); Sfx.teleport();
    say('Der Schattenfürst springt an einen anderen Platz!');
  } else if (c.boss === 'drache'){
    const cells = [];
    for (let j = 0; j < 9; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i))) cells.push(j);
    cells.forEach(j => { FX.burn(j); anim(k.grid[j], 'burn'); });
    Sfx.fire(); quake(1); buzz(80);
    if (cells.includes(k.pos)){
      if (has('feuerfest')) say('Feueratem! Aber du bist <b>feuerfest</b>.');
      else { const d = 3 + k.floor; hurt(d, 'fire', 'Das Drachenfeuer'); say(`<b>Feueratem!</b> Die Flammen treffen dich: <b>−${d}</b>.`); }
    } else say('Der Drache speit Feuer, aber du stehst außerhalb der Flammen.');
  }
}

function finishTurn(){
  render(); hud();
  log(T.msg.join(' '));
  checkHeroUnlocks();
  if (k.relics.length >= 5) unlock('k_relics');
  if (k.mode === 'end'){ if (k.steps >= 100) unlock('k_deep'); if (k.steps >= 200) unlock('k_deep2'); }
  if (k.dead) return die();
  saveRun();
  afterTurn();
}
async function afterTurn(){
  const bd = T.bossDown, bossNew = k.bossNew;
  if (!bd && !k.won && !bossNew){ if (k.pending) handlePending(); else showTips(); return; }
  kBusy = true;
  if (bd){
    Sfx.floor(); FX.confetti();
    if (!k.won){
      k.pending = k.pending || 'bossRelic';
      saveRun();
      await banner(kBannerEl, { kind: 'win', ic: bd.boss, eyebrow: 'Boss besiegt · +' + bd.bonus + ' Gold',
        title: isAdv() ? `Etage ${k.floor}: ${FLOORS[k.floor - 1].name}` : `Tiefe ${k.steps}`,
        sub: isAdv() ? 'Die Monster hier sind stärker. Wähle zuerst ein Relikt.' : 'Es geht noch tiefer. Wähle zuerst ein Relikt.' }, 2100);
      Music.play('gruft');
    }
  }
  if (k.won){ kBusy = false; return win(); }
  if (bossNew && k.bossNew){
    k.bossNew = null; saveRun();
    Sfx.boss(); buzz([80, 40, 80, 40, 160]); quake(2);
    Music.play('boss');
    const B = BOSSES[bossNew];
    await banner(kBannerEl, { kind: 'boss', ic: bossNew, eyebrow: isAdv() ? `Etage ${k.floor} · Boss` : `Tiefe ${k.steps} · Boss`, title: B.name, sub: B.mech }, 2400);
  }
  kBusy = false;
  if (k.pending) handlePending(); else showTips();
}

/* =====================================================================
   HELDENFÄHIGKEITEN
   ===================================================================== */
function setTargeting(on){
  k.targeting = on;
  render(); hud();
}
function abilityPress(){
  if (!k || k.over || kBusy || sheetOpen() || k.pending || current !== 'kerker') return;
  const H = HEROES[k.hero], A = ABILITIES[H.ability];
  if (k.targeting){ setTargeting(false); log('Abgebrochen.'); return; }
  if (k.charge < H.charge){
    const n = H.charge - k.charge;
    Sfx.lock(); log(`Noch <b>${n}</b> ${plural(n, 'Sieg', 'Siege')} bis ${A.name}.`);
    return;
  }
  if (A.target){
    Sfx.ui();
    setTargeting(true);
    log(A.target === 'monster' ? 'Tippe auf das Monster, das der Feuerball treffen soll.' : 'Tippe auf die Karte, mit der du den Platz tauschen willst.');
    return;
  }
  useAbility(-1);
}
function useAbility(ti){
  const H = HEROES[k.hero];
  k.targeting = false;
  beginTurn();
  k.charge = 0;
  Sfx.ability(); buzz([30, 20, 60]);
  const finish = () => finishTurn();
  switch (H.ability){
    case 'wirbel': {
      FX.whirl(k.pos); quake(1);
      let n = 0;
      for (const j of nbrs(k.pos)){
        const t = k.grid[j];
        if (t.type !== 'monster' && t.type !== 'boss') continue;
        t.val -= 4;
        if (t.val <= 0){
          n++; killed(t, j, 'ability'); removeNode(t);
          k.grid[j] = t.type === 'boss' ? mk('gold', 5) : mk('gold', Math.max(1, Math.ceil((t.orig || 2) / 2)));
        } else { fxAt(j, '−4', 'bad'); anim(t, 'flash'); }
      }
      say('<b>Wirbelschlag!</b> ' + (n ? `${n} ${plural(n, 'Monster fällt', 'Monster fallen')} und ${plural(n, 'wird', 'werden')} zu Gold.` : 'Alle Nachbarn getroffen.'));
      return finish();
    }
    case 'feuer': {
      const t = k.grid[ti];
      kBusy = true;
      FX.fireball(k.pos, ti, () => {
        kBusy = false;
        Sfx.explode(); quake(1);
        t.val -= 7;
        if (t.val <= 0){
          killed(t, ti, 'ability'); removeNode(t);
          k.grid[ti] = t.type === 'boss' ? mk('gold', 5) : mk('gold', Math.max(1, Math.ceil((t.orig || 2) / 2)));
          say(`<b>Feuerball!</b> ${cardName(t)} verbrennt zu Gold.`);
        } else { fxAt(ti, '−7', 'bad'); anim(t, 'flash'); say(`<b>Feuerball!</b> ${cardName(t)} hat noch <b>${t.val}</b>.`); }
        finish();
      });
      return;
    }
    case 'schatten': {
      const a = k.pos;
      [k.grid[a], k.grid[ti]] = [k.grid[ti], k.grid[a]];
      k.pos = ti;
      FX.poof(a); FX.poof(ti); Sfx.teleport();
      say('<b>Schattenschritt!</b> Du tauschst lautlos den Platz.');
      return finish();
    }
    case 'rage':
      k.rage = 3;
      FX.rage(k.pos);
      say('<b>Raserei!</b> Die nächsten 3 Kämpfe kosten ohne Waffe nur halben Schaden, und Waffen nutzen sich nicht ab.');
      return finish();
  }
}

/* =====================================================================
   RELIKTE, HÄNDLER, SCHREINE
   ===================================================================== */
function takeRelic(id){
  k.relics.push(id);
  D.stats.kRelics++;
  discover('r_' + id);
  if (id === 'eisen'){ k.maxHp += 4; k.hp += 4; }
  if (id === 'dornen') k.armor = Math.min(20, k.armor + 4);
  if (id === 'kanone'){ k.maxHp = Math.max(1, k.maxHp - 4); k.hp = Math.min(k.hp, k.maxHp); if (k.wpn) k.wpn += 4; }
  if (id === 'schleif' && k.wpn) k.wpn += 2;
  Sfx.relic(); FX.sparkle(k.pos);
  if (k.relics.length >= 5) unlock('k_relics');
}
function relicOffer(){
  const pool = RELIC_IDS.filter(id => !k.relics.includes(id));
  const out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return out;
}
function handlePending(){
  if (!k || !k.pending || k.over) return;
  const p = k.pending;
  if (p === 'merchant') return merchantSheet();
  if (!k.offer) { k.offer = relicOffer(); saveRun(); }
  const titles = { startRelic: ['Reliquienjäger', 'Dein Lauf beginnt mit einem Relikt deiner Wahl.'],
                   shrine: ['Ein Schrein', 'Wähle ein Relikt. Es wirkt bis zum Ende dieses Laufs.'],
                   bossRelic: ['Beute des Bosses', 'Wähle ein Relikt für den weiteren Weg.'],
                   chestRelic: ['Ein Relikt in der Truhe', 'Wähle eines der drei Relikte.'] };
  const [title, sub] = titles[p] || titles.shrine;
  const done = () => { k.pending = null; k.offer = null; saveRun(); closeSheet(); render(); hud(); showTips(); };
  if (!k.offer.length){
    gainGold(15, k.pos);
    k.pending = null; k.offer = null; saveRun(); render(); hud(); log('Du besitzt schon alle Relikte. <b>+15</b> Gold stattdessen.');
    return;
  }
  sheet(`<h2>${title}</h2><p>${sub}</p>
    <div class="offers">${k.offer.map(id => `<button type="button" class="offer" data-act="take" data-id="${id}">${icon('r_' + id, 'r-' + id)}<span class="info"><b>${RELICS[id].name}</b><span>${RELICS[id].desc}</span></span></button>`).join('')}</div>
    <button type="button" class="btn ghost" data-act="skip">Keins nehmen (+10 Gold)</button>`,
    {
      take: b => { const id = b.dataset.id; takeRelic(id); log(`Relikt erhalten: <b>${RELICS[id].name}</b>. ${RELICS[id].desc}`); done(); },
      skip: () => { k.gold += 10; D.stats.kGold += 10; log('Du lässt die Relikte liegen und nimmst <b>10</b> Gold.'); done(); }
    });
}
function merchantSheet(){
  const F = k.floor, disc = (has('feilscher') ? .6 : 1) * (k.mod === 'markttag' ? .7 : 1);
  const price = v => Math.max(1, Math.round(v * disc));
  if (!k.shop){
    const w = ri(4 + F, 6 + F * 2) + (has('schleif') ? 2 : 0) + (has('kanone') ? 4 : 0);
    const pool = RELIC_IDS.filter(id => !k.relics.includes(id));
    const rid = pool.length ? pool[Math.floor(R() * pool.length)] : null;
    k.shop = [
      { id: 'heal',   ic: 'potion', cls: 't-potion', name: 'Großer Heiltrank', desc: 'Heilt 10 Leben.', cost: price(6 + F * 2) },
      { id: 'weapon', ic: 'sword',  cls: 't-weapon', name: `${weaponName(w)} (Stärke ${w})`, desc: 'Ersetzt deine aktuelle Waffe.', cost: price(4 + w * 2), val: w },
      { id: 'armor',  ic: 'armor',  cls: 't-armor',  name: 'Rüstung +5', desc: 'Schluckt die nächsten 5 Schaden.', cost: price(8 + F * 2) }
    ];
    if (rid) k.shop.push({ id: 'relic', ic: 'r_' + rid, icCls: 'r-' + rid, name: RELICS[rid].name, desc: RELICS[rid].desc, cost: price(26 + F * 6), rid });
    saveRun();
  }
  sheet(`<h2>Der Händler</h2><p class="bank">${icon('coin', 'cur-kerker')} Dein Gold: <b>${k.gold}</b></p>
    <div class="offers">${k.shop.map((it, n) => `<div class="shop-item ${it.cls || ''} ${it.sold ? 'sold' : ''}">${icon(it.ic, it.icCls || '')}
      <span class="info"><b>${it.name}</b><span>${it.desc}</span></span>
      ${it.sold ? '<span class="maxed">Gekauft</span>' : `<button type="button" class="btn small" data-act="buy" data-n="${n}" ${k.gold < it.cost ? 'disabled' : ''}>${it.cost}</button>`}</div>`).join('')}</div>
    <p class="fine">Gekauftes Gold fehlt am Ende im Schatz. Gut überlegen!</p>
    <button type="button" class="btn sec" data-act="leave">Weiterziehen</button>`,
    {
      buy: b => {
        const it = k.shop[+b.dataset.n];
        if (!it || it.sold || k.gold < it.cost) return;
        k.gold -= it.cost; it.sold = true;
        if (it.id === 'heal'){ const g = heal(10); log(`Heiltrank: <b>+${g}</b> Leben.`); Sfx.potion(); }
        if (it.id === 'weapon'){ k.wpn = it.val; log(`Neue Waffe: Stärke <b>${it.val}</b>.`); Sfx.weapon(); }
        if (it.id === 'armor'){ k.armor = Math.min(20, k.armor + 5); log('Rüstung <b>+5</b>.'); Sfx.shield(); }
        if (it.id === 'relic'){ takeRelic(it.rid); log(`Relikt gekauft: <b>${RELICS[it.rid].name}</b>.`); }
        Sfx.shop(); saveRun(); render(); hud(); merchantSheet();
      },
      leave: () => { k.pending = null; k.shop = null; saveRun(); closeSheet(); render(); hud(); showTips(); }
    });
}
function relicListSheet(){
  sheet(`<h2>Deine Relikte</h2>
    ${k.relics.length ? `<ul class="list">${k.relics.map(id => `<li>${icon('r_' + id, 'r-' + id)}<div class="info"><b>${RELICS[id].name}${id === 'phoenix' && k.phoenixUsed ? ' (verbraucht)' : ''}</b><span>${RELICS[id].desc}</span></div></li>`).join('')}</ul>`
      : '<p>Noch keine. Relikte gibt es in Schreinen, bei Bossen, manchmal in Truhen und beim Händler.</p>'}
    <button type="button" class="btn sec" data-act="close">Schließen</button>`, { close: closeSheet }, closeSheet);
}

/* =====================================================================
   HINWEISE
   ===================================================================== */
function showTips(){
  if (!k || kBusy || sheetOpen() || !kTipEl.hidden) return;
  while (tipQ.length && D.tips[tipQ[0]]) tipQ.shift();
  if (!tipQ.length) return;
  const id = tipQ.shift(), [title, text] = TIPS[id];
  D.tips[id] = 1; save();
  const ic = id === 'elite' ? 'skull' : id.startsWith('m_') ? id.slice(2) : CARDS[id.slice(2)].ic;
  const cls = id.startsWith('m_') ? 't-monster k-' + id.slice(2) : id === 'elite' ? 't-monster' : 't-' + id.slice(2);
  kTipEl.className = 'tipnote ' + cls;
  kTipEl.innerHTML = `${icon(ic)}<span><b>Neu: ${title}</b><span>${text}</span><small>Antippen zum Schließen</small></span>`;
  kTipEl.hidden = false;
}
function hideTip(){ kTipEl.hidden = true; }
kTipEl.addEventListener('click', () => { Sfx.ui(); hideTip(); setTimeout(showTips, 150); });

function howtoSheet(then){
  sheet(`<h2>So geht’s</h2>
    <div class="howto"><ol>
      <li>${icon('ritter')}<p><b>Wischen oder tippen</b>Dein Held zieht auf ein Nachbarfeld. Die Karten dahinter rücken nach, und eine neue kommt dazu.</p></li>
      <li>${icon('skull')}<p><b>Monster</b>Die Zahl ist der Schaden. Mit einer Waffe fängt die Waffe ihn ab und nutzt sich dabei ab.</p></li>
      <li>${icon('armor')}<p><b>Rüstung, Tränke, Gold</b>Rüstung schluckt Schaden, Tränke heilen, Gold füllt deinen Schatz für Upgrades.</p></li>
      <li>${icon('bolt')}<p><b>Heldenfähigkeit</b>Jeder Sieg lädt sie auf. Ist sie voll, tippst du unten links drauf.</p></li>
      <li>${icon('waechter')}<p><b>Bosse und Relikte</b>Nach 15 Zügen kommt der Boss der Etage. Besiegst du ihn, wählst du ein Relikt und steigst tiefer.</p></li>
    </ol></div>
    <button type="button" class="btn" data-act="ok">Verstanden</button>`,
    { ok: () => { closeSheet(); if (then) then(); } }, () => { closeSheet(); if (then) then(); });
}

/* =====================================================================
   ENDE EINES LAUFS
   ===================================================================== */
function checkHeroUnlocks(){
  const h = D.kerker.heroes;
  const got = [];
  if (!h.schurkin && D.stats.kBosses >= 1){ h.schurkin = true; got.push('schurkin'); }
  if (!h.magierin && D.kerker.bestFloor >= 3){ h.magierin = true; got.push('magierin'); }
  if (!h.berserker && D.stats.kKills >= 150){ h.berserker = true; got.push('berserker'); }
  if (got.length){
    save();
    got.forEach(id => toast(HEROES[id].name, 'Neuer Held freigeschaltet', id, 'relic'));
    if (HERO_IDS.every(id => h[id])) unlock('k_heroes');
  }
  return got;
}
function dailyScore(){ return k.gold + 25 * Math.min(5, k.floor - 1) + (k.won ? 100 : 0); }
function settle(){
  const kd = D.kerker;
  kd.run = null;
  const res = { newBest: k.gold > kd.best, newDepth: false, daily: null };
  kd.best = Math.max(kd.best, k.gold);
  kd.bank += k.gold;
  if (k.mode === 'end'){ res.newDepth = k.steps > kd.bestDepth; kd.bestDepth = Math.max(kd.bestDepth, k.steps); }
  if (isAdv()) kd.bestFloor = Math.max(kd.bestFloor, k.won ? 6 : k.floor);
  if (k.won){
    D.stats.kWins++;
    kd.winsBy[k.hero] = (kd.winsBy[k.hero] || 0) + 1;
    unlock('k_win');
    if (HERO_IDS.every(id => kd.winsBy[id])) unlock('k_allwin');
  }
  if (k.mode === 'daily'){
    const score = dailyScore(), dd = kd.daily;
    res.daily = { score, newBest: score > dd.best };
    dd.best = Math.max(dd.best, score);
  }
  res.unlocked = checkHeroUnlocks();
  save();
  return res;
}
function die(){
  k.over = true;
  render(); hud();
  log(T.msg.concat(`<b>${k.killer}</b> hat dich erwischt.`).join(' '));
  Sfx.death(); buzz([90, 50, 160]); quake(2); FX.death(k.pos);
  Music.stop();
  const res = settle();
  kBusy = true;
  setTimeout(() => { kBusy = false; endSheet(res); }, wait(1200));
}
function win(){
  k.over = true;
  render(); hud();
  Sfx.victory(); FX.confetti(); buzz([60, 40, 60, 40, 200]);
  Music.play('menu');
  const res = settle();
  kBusy = true;
  banner(kBannerEl, { kind: 'win', ic: k.hero, eyebrow: MODE_NAME[k.mode] + ' geschafft', title: 'Der Drache ist besiegt!', sub: `${HEROES[k.hero].name} hat alle fünf Etagen bezwungen.` }, 2800)
    .then(() => { kBusy = false; endSheet(res); });
}
function endSheet(res){
  if (current !== 'kerker') return;
  const adv = isAdv(), won = k.won;
  const where = adv ? (won ? 'alle 5' : `${Math.min(k.floor, 5)}/5`) : k.steps;
  const tags = [];
  if (res.newBest && k.gold > 0) tags.push('Neuer Gold-Rekord');
  if (res.newDepth) tags.push('Neuer Tiefen-Rekord');
  if (res.daily && res.daily.newBest && res.daily.score > 0) tags.push('Tagesrekord');
  const text = won ? `${HEROES[k.hero].name} hat den Kerker bezwungen. Dein Gold wandert in den Schatz.`
    : k.quit ? 'Du hast den Lauf beendet. Dein Gold wandert in den Schatz.'
    : `${k.killer} hat dich erwischt. Dein Gold wandert trotzdem in den Schatz.`;
  sheet(`${tags.map(t => `<span class="new">${t}</span>`).join('')}
    <h2>${won ? 'Sieg!' : k.quit ? 'Lauf beendet' : 'Gefallen'}</h2>
    <p>${text}</p>
    <div class="stats">
      <div class="stat"><span>Gold</span><b>${k.gold}</b></div>
      <div class="stat"><span>${adv ? 'Etage' : 'Tiefe'}</span><b>${where}</b></div>
      <div class="stat"><span>Rekord</span><b>${D.kerker.best}</b></div>
      <div class="stat"><span>Siege</span><b>${k.kills}</b></div>
      <div class="stat"><span>Beste Serie</span><b>${k.bestStreak}</b></div>
      <div class="stat"><span>Relikte</span><b>${k.relics.length}</b></div>
    </div>
    ${res.daily ? `<p class="fine">Tagesgruft: <b>${res.daily.score}</b> Punkte (Gold, 25 pro Etage, 100 für den Sieg). Heute bestes Ergebnis: <b>${D.kerker.daily.best}</b>.</p>` : ''}
    ${(res.unlocked || []).map(id => `<div class="unlock-line">${icon(id)}<span><b>Neuer Held: ${HEROES[id].name}.</b> Wähle ${id === 'berserker' ? 'ihn' : 'sie'} im Menü.</span></div>`).join('')}
    <div class="row">
      <button type="button" class="btn" data-act="again">Nochmal</button>
      <button type="button" class="btn sec" data-act="menu">Zum Menü</button>
    </div>`,
    { again: () => startRun(k.mode), menu: () => go('kmenu') });
}
function pauseSheet(){
  if (!k || k.over) return;
  const where = isAdv() ? `Etage ${Math.min(k.floor, 5)}` : `Tiefe ${k.steps}`;
  sheet(`<h2>Pause</h2><p>${HEROES[k.hero].name} · ${MODE_NAME[k.mode]} · ${where} · <b>${k.gold}</b> Gold</p>
    <button type="button" class="btn" data-act="resume">Weiterspielen</button>
    <div class="row">
      <button type="button" class="btn sec" data-act="relics">Relikte</button>
      <button type="button" class="btn sec" data-act="howto">So geht’s</button>
    </div>
    <div class="row">
      <button type="button" class="btn sec" data-act="menu">Zum Menü</button>
      <button type="button" class="btn ghost" data-act="quit">Lauf beenden</button>
    </div>
    <p class="fine">Im Menü bleibt dein Lauf gespeichert. Beim Beenden kommt dein Gold in den Schatz.</p>`,
    {
      resume: closeSheet,
      relics: () => { relicListSheet(); sheetActs.close = pauseSheet; },
      howto: () => howtoSheet(pauseSheet),
      menu: () => go('kmenu'),
      quit: () => {
        sheet(`<h2>Lauf beenden?</h2><p>Du bekommst <b>${k.gold}</b> Gold für deinen Schatz. Der Lauf ist danach vorbei.</p>
          <div class="row"><button type="button" class="btn" data-act="yes">Beenden</button><button type="button" class="btn sec" data-act="no">Zurück</button></div>`,
          { yes: () => { k.quit = true; k.over = true; const res = settle(); Music.play('menu'); render(); hud(); endSheet(res); }, no: pauseSheet }, pauseSheet);
      }
    }, closeSheet);
}

/* =====================================================================
   KERKER-MENÜ
   ===================================================================== */
function codexSheet(back){
  const cx = D.kerker.codex;
  const tile = (id, ic, name, desc, cls, icCls = '') => cx[id]
    ? `<div class="codex-tile ${cls}">${icon(ic, icCls)}<b>${name}</b><span>${desc}</span></div>`
    : `<div class="codex-tile">${icon(ic, 'unknown')}<b>???</b><span>Noch nicht entdeckt</span></div>`;
  const total = Object.keys(MONSTERS).length + BOSS_IDS.length + Object.keys(CARDS).length + RELIC_IDS.length;
  const found = Object.keys(cx).length;
  sheet(`<h2>Kompendium</h2><p>${found} von ${total} entdeckt.</p>
    <h3>Monster</h3><div class="codex">${Object.entries(MONSTERS).map(([id, m]) => tile('m_' + id, id, m.name, m.desc, 't-monster k-' + id)).join('')}</div>
    <h3>Bosse</h3><div class="codex">${BOSS_IDS.map(id => tile('b_' + id, id, BOSSES[id].name, BOSSES[id].mech, 't-boss')).join('')}</div>
    <h3>Karten</h3><div class="codex">${Object.entries(CARDS).map(([id, c]) => tile('c_' + id, c.ic, c.name, c.desc, 't-' + id)).join('')}</div>
    <h3>Relikte</h3><div class="codex">${RELIC_IDS.map(id => tile('r_' + id, 'r_' + id, RELICS[id].name, RELICS[id].desc, '', 'r-' + id)).join('')}</div>
    <button type="button" class="btn sec" data-act="back">Zurück</button>`, { back }, back);
}
function renderKMenu(){
  const kd = D.kerker;
  $('#kmSub').textContent = `Schatz ${fmt(kd.bank)} Gold`;
  const run = kd.run, res = $('#kResume');
  if (run && !run.over){
    const where = run.mode === 'end' ? `Tiefe ${run.steps}` : `Etage ${Math.min(run.floor, 5)}`;
    res.innerHTML = `<b>Lauf fortsetzen</b><span>${HEROES[run.hero].name} · ${MODE_NAME[run.mode]} · ${where} · ${run.gold} Gold · ${run.hp} Leben</span>`;
    res.hidden = false;
  } else res.hidden = true;
  $('#kHeroes').innerHTML = HERO_IDS.map(id => {
    const H = HEROES[id], locked = !kd.heroes[id];
    return `<button type="button" class="hero-tile ${locked ? 'locked' : ''}" role="radio" aria-checked="${kd.hero === id}" data-hero="${id}" aria-label="${H.name}${locked ? ', gesperrt' : ''}">
      <span class="portrait">${icon(id)}</span><b>${H.name}</b><small>${H.hp} Leben</small>${locked ? icon('lock', 'lock') : ''}</button>`;
  }).join('');
  const H = HEROES[kd.hero], A = ABILITIES[H.ability], locked = !kd.heroes[kd.hero];
  const wins = kd.winsBy[kd.hero] || 0;
  $('#kHeroInfo').innerHTML = `<p><b>${H.name}</b> · ${H.hp} Leben${H.armor ? `, ${H.armor} Rüstung` : ''}${wins ? ` · ${wins} ${plural(wins, 'Sieg', 'Siege')}` : ''}</p>
    <p><b>Passiv:</b> ${H.passive}</p>
    <p><b>${A.name}</b> (lädt in ${H.charge} Siegen): ${A.desc}</p>
    ${locked ? `<p class="lockline">Freischalten: ${H.unlock}</p>` : ''}`;
  const today = todayKey(), dd = kd.daily, played = dd.key === today;
  const dh = HEROES[dailyHero()], dm = MODS[dailyMod()];
  const advTxt = kd.bestFloor > 5 ? 'Schon bezwungen. Schaffst du es mit jedem Helden?' : kd.bestFloor ? `Bisher bis Etage ${kd.bestFloor}.` : 'Dein erster Abstieg wartet.';
  $('#kModes').innerHTML = `
    <button type="button" class="mode" data-mode="adv" ${locked ? 'aria-disabled="true"' : ''}><b>Abenteuer</b><span>5 Etagen, 5 Bosse. ${advTxt}</span></button>
    <button type="button" class="mode alt" data-mode="end" ${locked ? 'aria-disabled="true"' : ''}><b>Endlos</b><span>Immer tiefer, alle 18 Züge ein Boss. Rekord: Tiefe ${kd.bestDepth}.</span></button>
    <button type="button" class="mode daily" data-mode="daily">${played ? '' : '<span class="new-dot">Heute neu</span>'}<b>Tagesgruft</b>
      <span>Heute mit ${dh.name} · ${dm.name}: ${dm.desc}${played ? ` Dein Tagesrekord: ${dd.best}.` : ''}${dd.streak > 1 ? ` Serie: ${dd.streak} Tage.` : ''}</span></button>`;
}
$('#kHeroes').addEventListener('click', e => {
  const b = e.target.closest('[data-hero]');
  if (!b) return;
  const id = b.dataset.hero;
  if (!D.kerker.heroes[id]){ Sfx.lock(); }
  else Sfx.ui();
  D.kerker.hero = id; save();
  renderKMenu();
});
$('#kModes').addEventListener('click', e => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  const mode = b.dataset.mode;
  if (mode !== 'daily' && !D.kerker.heroes[D.kerker.hero]){
    Sfx.lock();
    toast(`${HEROES[D.kerker.hero].name} ist noch gesperrt`, HEROES[D.kerker.hero].unlock, 'lock', null);
    return;
  }
  Sfx.ui();
  const run = D.kerker.run;
  if (run && !run.over){
    sheet(`<h2>Neuen Lauf starten?</h2><p>Dein aktueller Lauf endet dann. Seine <b>${run.gold}</b> Gold kommen in den Schatz.</p>
      <div class="row"><button type="button" class="btn" data-act="yes">Neu starten</button><button type="button" class="btn sec" data-act="no">Abbrechen</button></div>`,
      { yes: () => startRun(mode), no: closeSheet }, closeSheet);
    return;
  }
  startRun(mode);
});
$('#kResume').addEventListener('click', () => {
  Sfx.ui();
  k = D.kerker.run;
  if (k) go('kerker');
});
$('#kmUpgrades').addEventListener('click', () => { Sfx.ui(); openShop('kerker', () => { closeSheet(); renderKMenu(); }); });
$('#kmCodex').addEventListener('click', () => { Sfx.ui(); codexSheet(closeSheet); });
$('#kmHelp').addEventListener('click', () => { Sfx.ui(); howtoSheet(null); });

SCREENS.kmenu = {
  enter(){ renderKMenu(); Music.play('menu'); },
  restyle(){ renderKMenu(); }
};

/* =====================================================================
   KERKER-SPIEL: Bildschirm und Eingabe
   ===================================================================== */
SCREENS.kerker = {
  enter(){
    if (!k){ k = D.kerker.run; }
    if (!k){ setTimeout(() => go('kmenu'), 0); return; }
    k.targeting = false;
    board.innerHTML = ''; nodes.clear();
    hideTip(); kBannerEl.hidden = true;
    T = { kills: 0, msg: [], hurt: 0, bossDown: null };
    render(true); hud();
    $('#kLog').innerHTML = k.lastLog || '';
    requestAnimationFrame(() => FX.resize());
    Music.play(k.grid.some(c => c.type === 'boss') ? 'boss' : 'gruft');
    if (k.intro){
      k.intro = false; saveRun();
      kBusy = true;
      const sub = k.mode === 'daily' ? `${HEROES[k.hero].name} · ${MODS[k.mod].desc}`
        : k.mode === 'end' ? 'Alle 18 Züge wartet ein Boss. Wie tief kommst du?'
        : `Etage 1 von 5. Nach 15 Zügen erscheint der ${BOSSES.waechter.name}.`;
      banner(kBannerEl, { ic: k.hero, eyebrow: k.mode === 'daily' ? `Tagesgruft · ${MODS[k.mod].name}` : MODE_NAME[k.mode], title: k.mode === 'end' ? 'Endlose Tiefe' : FLOORS[0].name, sub }, 2000)
        .then(() => {
          kBusy = false;
          if (!D.tips.howto){ D.tips.howto = 1; save(); howtoSheet(() => { if (k.pending) handlePending(); else showTips(); }); }
          else if (k.pending) handlePending();
          else showTips();
        });
    } else if (k.pending) handlePending();
    else showTips();
  },
  leave(){
    if (k && k.targeting) k.targeting = false;
    kBusy = false;
    hideTip(); FX.clear();
    if (heartTimer){ clearInterval(heartTimer); heartTimer = 0; }
    kScreen.classList.remove('danger');
    if (k && !k.over) saveRun();
    if (k && k.over) k = null;
  },
  restyle(){ if (k){ render(); hud(); } }
};

let swipe = null;
board.addEventListener('pointerdown', e => { swipe = { x: e.clientX, y: e.clientY, id: e.pointerId, target: e.target }; });
window.addEventListener('pointerup', e => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, s = swipe;
  swipe = null;
  if (!k || current !== 'kerker' || kBusy || sheetOpen()) return;
  if (Math.hypot(dx, dy) > 24 && !k.targeting){
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    return;
  }
  const el = s.target.closest && s.target.closest('.card');
  if (!el || el.classList.contains('gone')) return;
  const i = +el.dataset.i;
  if (k.targeting){
    if (i === k.pos){ setTargeting(false); log('Abgebrochen.'); return; }
    if (isTarget(k.grid[i])) useAbility(i); else Sfx.bump();
    return;
  }
  if (i === k.pos) return;
  if (!adjacent(i, k.pos)){ if (canAct()) Sfx.bump(); return; }
  const hc = colOf(k.pos), hr = rowOf(k.pos), c = colOf(i), r = rowOf(i);
  move(c > hc ? 'right' : c < hc ? 'left' : r > hr ? 'down' : 'up');
});
window.addEventListener('pointercancel', () => { swipe = null; });
$('#kAbility').addEventListener('click', abilityPress);
$('#kRelics').addEventListener('click', () => { if (!k || k.over || kBusy) return; Sfx.ui(); relicListSheet(); });
$('#kPause').addEventListener('click', () => { if (!k || kBusy) return; Sfx.ui(); pauseSheet(); });
window.addEventListener('resize', () => { if (current === 'kerker') FX.resize(); });
