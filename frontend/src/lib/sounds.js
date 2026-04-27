/**
 * Retro arcade SFX using Web Audio API.
 * No external assets — all synthesized with oscillators + noise.
 */

let ctx = null;
let muted = false;
let masterGain = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

export function setMuted(v) {
  muted = !!v;
  try {
    localStorage.setItem("dr_muted", muted ? "1" : "0");
  } catch (_e) { /* ignore */ }
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 0.35;
  }
}

export function isMuted() {
  if (typeof muted === "boolean") {
    try {
      const stored = localStorage.getItem("dr_muted");
      if (stored !== null) muted = stored === "1";
    } catch (_e) { /* ignore */ }
  }
  return muted;
}

export function unlockAudio() {
  // Must be called from a user gesture
  getCtx();
}

function tone({ freq = 440, type = "square", duration = 0.12, volume = 0.5, slideTo = null, attack = 0.005, release = 0.05 }) {
  const c = getCtx();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), c.currentTime + duration);
  }
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration + release);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + duration + release + 0.02);
}

function noise({ duration = 0.2, volume = 0.4, lowpass = 1200, highpass = 0 }) {
  const c = getCtx();
  if (!c || muted) return;
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  let node = src;
  if (lowpass) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = lowpass;
    node.connect(lp);
    node = lp;
  }
  if (highpass) {
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highpass;
    node.connect(hp);
    node = hp;
  }
  node.connect(gain);
  gain.connect(masterGain);
  src.start();
  src.stop(c.currentTime + duration + 0.02);
}

// ===== Synthwave music loop =====
let musicNodes = null;
let musicTimer = null;

function makeReverb(c) {
  const conv = c.createConvolver();
  const len = c.sampleRate * 1.2;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  conv.buffer = buf;
  return conv;
}

export function startMusic() {
  const c = getCtx();
  if (!c) return;
  if (musicNodes) return; // already playing

  const out = c.createGain();
  out.gain.value = 0.0;
  out.connect(masterGain);
  // fade in
  out.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.2);

  // reverb send
  const reverb = makeReverb(c);
  const wet = c.createGain();
  wet.gain.value = 0.25;
  reverb.connect(wet);
  wet.connect(out);

  // Am - F - C - G  (synthwave staple, A minor)
  // root frequencies (low octave): A2=110, F2=87.31, C3=130.81, G2=98
  const progression = [
    { root: 110.0,  chord: [220.0, 261.63, 329.63] }, // Am
    { root: 87.31,  chord: [174.61, 220.0,  261.63] }, // F
    { root: 130.81, chord: [196.0,  261.63, 329.63] }, // C
    { root: 98.0,   chord: [196.0,  246.94, 293.66] }, // G
  ];

  // BASS oscillator (continuous, retuned per chord)
  const bass = c.createOscillator();
  const bassFilter = c.createBiquadFilter();
  bassFilter.type = "lowpass";
  bassFilter.frequency.value = 700;
  bassFilter.Q.value = 6;
  const bassGain = c.createGain();
  bassGain.gain.value = 0.32;
  bass.type = "sawtooth";
  bass.frequency.setValueAtTime(progression[0].root, c.currentTime);
  bass.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(out);
  bass.start();

  // PAD (chord oscillators)
  const padOscs = [];
  const padGain = c.createGain();
  padGain.gain.value = 0.07;
  const padFilter = c.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 1800;
  padGain.connect(padFilter);
  padFilter.connect(out);
  padFilter.connect(reverb); // also send to reverb

  for (let i = 0; i < 3; i++) {
    const osc = c.createOscillator();
    osc.type = i === 0 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(progression[0].chord[i], c.currentTime);
    // slight detune for analog feel
    osc.detune.value = (i - 1) * 6;
    osc.connect(padGain);
    osc.start();
    padOscs.push(osc);
  }

  // LEAD arpeggio (driven by setInterval-ish via setValueAtTime scheduling)
  const arpGain = c.createGain();
  arpGain.gain.value = 0.0;
  const arpFilter = c.createBiquadFilter();
  arpFilter.type = "lowpass";
  arpFilter.frequency.value = 2200;
  arpFilter.Q.value = 4;
  arpGain.connect(arpFilter);
  arpFilter.connect(out);
  arpFilter.connect(reverb);

  const arpOsc = c.createOscillator();
  arpOsc.type = "square";
  arpOsc.frequency.value = 440;
  arpOsc.connect(arpGain);
  arpOsc.start();

  // Schedule progression: each chord lasts 3.2s; 16th-note arp = 200ms
  const beatMs = 200;
  const chordMs = 3200;
  let chordIdx = 0;
  let arpStep = 0;

  const tick = () => {
    if (!musicNodes) return;
    const now = c.currentTime;
    const chord = progression[chordIdx];
    // arp note: cycle root, 5th, root+oct, 3rd
    const notes = [chord.chord[0], chord.chord[2], chord.chord[1] * 2, chord.chord[1]];
    const f = notes[arpStep % notes.length];
    arpOsc.frequency.cancelScheduledValues(now);
    arpOsc.frequency.setValueAtTime(f, now);
    arpGain.gain.cancelScheduledValues(now);
    arpGain.gain.setValueAtTime(0.0001, now);
    arpGain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    arpStep++;
    if (arpStep % (chordMs / beatMs) === 0) {
      chordIdx = (chordIdx + 1) % progression.length;
      const next = progression[chordIdx];
      bass.frequency.setTargetAtTime(next.root, c.currentTime, 0.05);
      padOscs.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(next.chord[i], c.currentTime, 0.3);
      });
    }
  };

  // first tick immediately
  tick();
  musicTimer = setInterval(tick, beatMs);

  musicNodes = { bass, padOscs, arpOsc, out, padGain, arpGain, bassGain };
}

export function stopMusic() {
  if (!musicNodes) return;
  const c = getCtx();
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  // fade out then stop oscillators
  if (c) {
    const t = c.currentTime + 0.5;
    musicNodes.out.gain.cancelScheduledValues(c.currentTime);
    musicNodes.out.gain.setValueAtTime(musicNodes.out.gain.value, c.currentTime);
    musicNodes.out.gain.linearRampToValueAtTime(0, t);
  }
  setTimeout(() => {
    try {
      musicNodes.bass.stop();
      musicNodes.arpOsc.stop();
      musicNodes.padOscs.forEach((o) => o.stop());
    } catch (_e) { /* ignore */ }
    musicNodes = null;
  }, 600);
}

// ===== SFX =====
export const sfx = {
  shoot() {
    tone({ freq: 880, slideTo: 220, type: "square", duration: 0.08, volume: 0.18 });
  },
  shootMulti() {
    tone({ freq: 1100, slideTo: 280, type: "square", duration: 0.07, volume: 0.16 });
  },
  hit() {
    tone({ freq: 200, slideTo: 80, type: "square", duration: 0.1, volume: 0.25 });
    noise({ duration: 0.12, volume: 0.18, lowpass: 1800 });
  },
  explode() {
    tone({ freq: 140, slideTo: 40, type: "sawtooth", duration: 0.25, volume: 0.28 });
    noise({ duration: 0.35, volume: 0.35, lowpass: 900 });
  },
  bigExplode() {
    tone({ freq: 90, slideTo: 30, type: "sawtooth", duration: 0.5, volume: 0.4 });
    noise({ duration: 0.55, volume: 0.45, lowpass: 700 });
  },
  powerup() {
    // arpeggio up
    tone({ freq: 523, type: "square", duration: 0.07, volume: 0.22 });
    setTimeout(() => tone({ freq: 659, type: "square", duration: 0.07, volume: 0.22 }), 70);
    setTimeout(() => tone({ freq: 988, type: "square", duration: 0.12, volume: 0.25 }), 140);
  },
  bomb() {
    tone({ freq: 60, slideTo: 25, type: "sawtooth", duration: 0.7, volume: 0.5 });
    noise({ duration: 0.8, volume: 0.55, lowpass: 600 });
  },
  wave() {
    tone({ freq: 392, type: "triangle", duration: 0.1, volume: 0.22 });
    setTimeout(() => tone({ freq: 587, type: "triangle", duration: 0.18, volume: 0.22 }), 100);
  },
  death() {
    // descending death warble
    const c = getCtx();
    if (!c || muted) return;
    [880, 700, 500, 350, 220, 140].forEach((f, i) => {
      setTimeout(() => tone({ freq: f, type: "square", duration: 0.16, volume: 0.28 }), i * 110);
    });
    setTimeout(() => noise({ duration: 0.6, volume: 0.4, lowpass: 800 }), 600);
  },
  click() {
    tone({ freq: 660, type: "square", duration: 0.05, volume: 0.18 });
  },
};
