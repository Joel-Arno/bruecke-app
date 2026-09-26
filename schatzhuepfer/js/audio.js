// Alle Geräusche werden live mit der Web-Audio-API erzeugt, es gibt keine Sounddateien.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Browser erlauben Ton erst nach einer Berührung, deshalb bei jeder Eingabe aufrufen.
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
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  get ok() {
    return this.ctx && !this.muted && this.ctx.state === 'running';
  }

  tone(f, d, { type = 'square', v = 0.1, to = null, at = 0 } = {}) {
    if (!this.ok) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + d + 0.02);
  }

  noise(d, { v = 0.3, f = 1200, to = null, type = 'lowpass', at = 0 } = {}) {
    if (!this.ok) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(f, t);
    if (to) filter.frequency.exponentialRampToValueAtTime(to, t + d);
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(filter).connect(g).connect(this.out);
    src.start(t);
    src.stop(t + d + 0.02);
  }

  hop() { this.tone(430, 0.07, { v: 0.05, to: 700 }); }
  bump() { this.tone(160, 0.08, { v: 0.07, to: 90 }); }
  coin() {
    this.tone(988, 0.07, { v: 0.06 });
    this.tone(1319, 0.14, { v: 0.06, at: 0.06 });
  }
  bigCoin() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.1, { v: 0.06, at: i * 0.06 })); }
  splash() {
    this.noise(0.5, { v: 0.4, f: 2500, to: 250 });
    this.tone(320, 0.25, { type: 'sine', v: 0.15, to: 70 });
  }
  crash() {
    this.noise(0.3, { v: 0.45, f: 1400, to: 150 });
    this.tone(140, 0.3, { type: 'sawtooth', v: 0.12, to: 45 });
  }
  bell() { this.tone(1450, 0.12, { type: 'triangle', v: 0.07 }); }
  horn() {
    this.tone(233, 0.55, { type: 'sawtooth', v: 0.06 });
    this.tone(294, 0.55, { type: 'sawtooth', v: 0.05 });
  }
  sink() { this.tone(500, 0.3, { type: 'sine', v: 0.08, to: 120 }); }
  power() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', v: 0.09, at: i * 0.06 })); }
  eagle() {
    this.tone(2200, 0.6, { type: 'sawtooth', v: 0.05, to: 900 });
    this.noise(0.6, { v: 0.12, f: 3000, type: 'bandpass' });
  }
  buy() { [523, 784, 1047, 1568].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', v: 0.1, at: i * 0.08 })); }
  click() { this.tone(660, 0.04, { v: 0.04 }); }
  record() { [659, 784, 988, 1319, 1568].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', v: 0.1, at: 0.2 + i * 0.09 })); }
}
