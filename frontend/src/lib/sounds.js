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
