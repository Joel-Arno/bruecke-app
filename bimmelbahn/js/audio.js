// Geräusche, live mit Web Audio erzeugt.
const PENTA = [0, 2, 4, 7, 9];
const note = (base, s) => base * 2 ** ((PENTA[((s % 5) + 5) % 5] + 12 * Math.floor(s / 5)) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.on = true;
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.5;
        this.out.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, len);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  get ok() {
    return this.on && this.ctx && this.ctx.state === 'running';
  }

  tone(f, d, { type = 'triangle', v = 0.1, to = null, at = 0 } = {}) {
    if (!this.ok) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  noise(d, { v = 0.1, f = 1000, to = null, type = 'lowpass', at = 0 } = {}) {
    if (!this.ok) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d);
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl).connect(g).connect(this.out);
    s.start(t);
    s.stop(t + d + 0.05);
  }

  chuff() { this.noise(0.09, { v: 0.035, f: 900, to: 300 }); }
  turn() { this.tone(520, 0.05, { type: 'square', v: 0.03 }); }
  whistle() {
    this.tone(880, 0.5, { type: 'sine', v: 0.08 });
    this.tone(1108, 0.5, { type: 'sine', v: 0.06 });
  }
  pickup(k = 0) { [0, 4].forEach((s, i) => this.tone(note(660, s + k), 0.12, { v: 0.08, at: i * 0.06 })); }
  deliver(n) {
    for (let i = 0; i < Math.min(n + 2, 9); i++) this.tone(note(523, i), 0.22, { v: 0.09, at: i * 0.07 });
  }
  gold() { [7, 9, 10, 12].forEach((s, i) => this.tone(note(523, s), 0.2, { type: 'sine', v: 0.08, at: i * 0.05 })); }
  angry() { this.tone(300, 0.35, { type: 'sawtooth', v: 0.05, to: 150 }); }
  crash() {
    this.noise(0.6, { v: 0.4, f: 2000, to: 120 });
    this.tone(160, 0.5, { type: 'sawtooth', v: 0.12, to: 40 });
  }
  levelUp() { [0, 2, 4, 7].forEach((s, i) => this.tone(note(523, s + 5), 0.25, { v: 0.08, at: i * 0.09 })); }
  click() { this.tone(700, 0.04, { type: 'square', v: 0.03 }); }
  buy() { [0, 4, 7, 12].forEach((s, i) => this.tone(note(392, s), 0.2, { v: 0.1, at: i * 0.08 })); }
}
