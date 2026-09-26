// Sanfte Geräusche und leise Hintergrundmusik, alles live mit Web Audio erzeugt.
const PENTA = [0, 2, 4, 7, 9]; // Dur-Pentatonik
const note = (base, step) => base * 2 ** ((PENTA[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5)) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.sfxOn = true;
    this.musicOn = true;
    this.musicTimer = null;
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.55;
        this.out.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.16;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1800;
        this.musicBus.connect(lp).connect(this.out);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, len);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.syncMusic();
    } catch {
      this.ctx = null;
    }
  }

  get ready() {
    return this.ctx && this.ctx.state === 'running';
  }

  tone(f, d, { type = 'sine', v = 0.1, to = null, at = 0, attack = 0.005, bus = null } = {}) {
    if (!this.ready) return;
    if (!bus && !this.sfxOn) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(bus || this.out);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  noise(d, { v = 0.1, f = 800, to = null, type = 'lowpass', at = 0 } = {}) {
    if (!this.ready || !this.sfxOn) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const filt = c.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(f, t);
    if (to) filt.frequency.exponentialRampToValueAtTime(to, t + d);
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(filt).connect(g).connect(this.out);
    src.start(t);
    src.stop(t + d + 0.05);
  }

  plop() {
    this.tone(420, 0.18, { v: 0.2, to: 160 });
    this.noise(0.25, { v: 0.06, f: 1500, to: 300, at: 0.05 });
  }
  knock() {
    this.tone(240, 0.09, { type: 'triangle', v: 0.18 });
    this.tone(190, 0.1, { type: 'triangle', v: 0.14, at: 0.08 });
  }
  lift() { this.tone(260, 0.15, { v: 0.12, to: 520 }); }
  tide() { this.noise(1.2, { v: 0.12, f: 400, to: 1400, type: 'bandpass' }); }
  denied() { this.tone(220, 0.16, { type: 'triangle', v: 0.1, to: 180 }); }
  tap() { this.tone(880, 0.05, { v: 0.05 }); }
  happy(pitch = 0) {
    [0, 2, 4].forEach((s, i) => this.tone(note(660, s + pitch), 0.14, { type: 'triangle', v: 0.08, at: i * 0.07 }));
  }
  squeak(pitch = 0) { this.tone(note(900, pitch), 0.12, { type: 'triangle', v: 0.08, to: note(900, pitch + 2) }); }
  arrive(pitch = 0) {
    this.tone(note(523, pitch + 5), 0.5, { type: 'triangle', v: 0.1 });
    this.tone(note(523, pitch + 7), 0.6, { type: 'sine', v: 0.08, at: 0.1 });
  }
  success() { [0, 2, 4, 5, 7, 9].forEach((s, i) => this.tone(note(523, s), 0.4, { type: 'triangle', v: 0.09, at: 0.12 * i })); }
  sparkle() { [7, 9, 10].forEach((s, i) => this.tone(note(523, s), 0.18, { v: 0.07, at: i * 0.05 })); }
  build() {
    this.knock();
    [4, 7].forEach((s, i) => this.tone(note(523, s), 0.25, { type: 'triangle', v: 0.07, at: 0.12 + i * 0.1 }));
  }

  // ---------------------------------------------------------------- Musik

  setMusic(on) {
    this.musicOn = on;
    this.syncMusic();
  }

  syncMusic() {
    const play = this.musicOn && this.ready && !document.hidden;
    if (play && !this.musicTimer) {
      this.beat = 0;
      this.musicTimer = setInterval(() => this.musicTick(), 420);
    } else if (!play && this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  musicTick() {
    const chords = [0, 3, 1, 4]; // Stufen der Pentatonik als ruhige Grundtöne
    const bar = Math.floor(this.beat / 8) % chords.length;
    const root = chords[bar];
    if (this.beat % 8 === 0) {
      for (const s of [root, root + 2, root + 4]) this.tone(note(131, s), 3.4, { type: 'triangle', v: 0.05, attack: 0.8, bus: this.musicBus });
    }
    if (Math.random() < 0.55) {
      const s = root + [0, 2, 4, 5, 7][Math.floor(Math.random() * 5)];
      this.tone(note(392, s), 0.9, { type: 'sine', v: 0.09, attack: 0.01, bus: this.musicBus });
    }
    this.beat++;
  }
}
