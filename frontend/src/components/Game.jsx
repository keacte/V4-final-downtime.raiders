import React, { useEffect, useRef, useState, useCallback } from "react";
import { sfx } from "../lib/sounds";

/**
 * Top-down old-school space combat sim.
 * Player at the bottom-ish, enemies warp in from top edges.
 * Power-ups, multiple enemy types, bullets, particles, waves.
 */

const W = 960;
const H = 720;

// ----- Enemy archetypes (EVE flavored) -----
const ENEMY_TYPES = {
  frigate: {
    label: "FRG",
    radius: 12,
    hp: 1,
    speed: 2.4,
    score: 50,
    color: "#f87171",  // red
    fireRate: 0,
  },
  cruiser: {
    label: "CRU",
    radius: 20,
    hp: 3,
    speed: 1.4,
    score: 150,
    color: "#ef4444",  // red
    fireRate: 0.012,
  },
  capital: {
    label: "CAP",
    radius: 34,
    hp: 8,
    speed: 0.7,
    score: 500,
    color: "#b91c1c",  // dark red
    fireRate: 0.022,
  },
};

// ----- 10 distinct named waves + final boss -----
const WAVES = [
  { label: "FIRST CONTACT",        spawns: [["frigate", 6]] },
  { label: "SWARM",                spawns: [["frigate", 10]] },
  { label: "INTRUSION",            spawns: [["frigate", 6], ["cruiser", 2]] },
  { label: "BARRAGE",              spawns: [["frigate", 12]] },
  { label: "PHALANX",              spawns: [["cruiser", 5], ["frigate", 4]] },
  { label: "SKYFALL",              spawns: [["frigate", 6], ["capital", 1]] },
  { label: "WAVE",                 spawns: [["cruiser", 8]] },
  { label: "ARMADA",               spawns: [["cruiser", 6], ["capital", 2]] },
  { label: "ANNIHILATION PROTOCOL",spawns: [["frigate", 8], ["cruiser", 4], ["capital", 1]] },
  { label: "LAST STAND",           spawns: [["frigate", 4], ["cruiser", 6], ["capital", 3]] },
];
const FINAL_WAVE = WAVES.length + 1; // 11 -> boss

// ----- Boss (Dreadnought) -----
const BOSS_DEF = {
  label: "DREAD",
  radius: 70,
  hp: 80,
  speed: 0.4,
  score: 5000,
  color: "#dc2626",  // deep red
};

// ----- Power-ups -----
const POWERUP_DEFS = {
  shield:   { color: "#22d3ee", label: "SHIELD",     duration: 0,    icon: "S" }, // instant
  rapid:    { color: "#facc15", label: "RAPID",      duration: 8000, icon: "R" },
  multi:    { color: "#a855f7", label: "MULTI",      duration: 10000, icon: "M" },
  bomb:     { color: "#ffffff", label: "BOMB",       duration: 0,    icon: "B" }, // stockable
  speed:    { color: "#34d399", label: "SPEED",      duration: 8000, icon: "V" },
  life:     { color: "#c084fc", label: "EXTRA LIFE", duration: 0,    icon: "♥" }, // heart (purple)
  // Wave-based powerups (waveDuration = number of waves the buff covers, including pickup wave)
  cloak:    { color: "#a5f3fc", label: "CLOAK",      duration: 0, waveDuration: 1, icon: "C" },
  invuln:   { color: "#fbbf24", label: "INVULN",     duration: 0, waveDuration: 2, icon: "I" },
  star:     { color: "#fde047", label: "STAR",       duration: 0, waveDuration: 1, icon: "★" },
};

// ----- Helpers -----
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export default function Game({ onDeath }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [hud, setHud] = useState({
    score: 0,
    lives: 3,
    wave: 1,
    bombs: 1,
    activePowerups: [],
    wavePowerups: [],
  });
  const [paused, setPaused] = useState(false);

  // Initialize game state once
  const initState = useCallback(() => {
    return {
      keys: {},
      player: {
        x: W / 2,
        y: H * 0.78,
        r: 14,
        vx: 0,
        vy: 0,
        cooldown: 0,
        invuln: 90,
        shieldHp: 0,
      },
      bullets: [],
      enemies: [],
      enemyBullets: [],
      powerups: [],
      particles: [],
      stars: Array.from({ length: 120 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 2 + 0.4,
      })),
      score: 0,
      lives: 3,
      bombs: 1,
      kills: 0,
      wave: 1,
      waveTimer: 0,
      enemiesToSpawn: 0,
      spawnQueue: [], // queue of enemy types to spawn for current wave
      spawnCooldown: 0,
      boss: null,
      bossSpawned: false,
      // active timed powerups: {type, until}
      activePowerups: [],
      // wave-based powerups (cloak, invuln, star): {type, untilWave}
      wavePowerups: [],
      gameOver: false,
      victory: false,
      shake: 0,
      flash: 0,
      paused: false,
      waveLabel: WAVES[0].label,
      waveBanner: 90, // frames to show wave banner
    };
  }, []);

  // ---------- Keyboard ----------
  useEffect(() => {
    const onKey = (e, down) => {
      const k = e.key.toLowerCase();
      const s = stateRef.current;
      if (!s) return;
      s.keys[k] = down;
      if (down) {
        if (k === "p") {
          setPaused((p) => !p);
        }
        if (k === "x") {
          tryBomb();
        }
        if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
          e.preventDefault();
        }
      }
    };
    const dn = (e) => onKey(e, true);
    const up = (e) => onKey(e, false);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Smart bomb ----------
  const tryBomb = () => {
    const s = stateRef.current;
    if (!s || s.gameOver) return;
    if (s.bombs <= 0) return;
    s.bombs -= 1;
    s.flash = 24;
    s.shake = 18;
    sfx.bomb();
    // destroy all enemies and enemy bullets
    s.enemies.forEach((en) => {
      s.score += en.def.score;
      s.kills += 1;
      explode(s, en.x, en.y, en.def.color, 30);
    });
    s.enemies = [];
    s.enemyBullets = [];
    // bomb damages boss for 5 hp
    if (s.boss) {
      s.boss.hp -= 5;
      explode(s, s.boss.x, s.boss.y, s.boss.def.color, 24);
    }
    syncHud(s);
  };

  // ---------- Spawn helpers ----------
  const buildSpawnQueue = (waveIdx) => {
    const def = WAVES[waveIdx];
    if (!def) return [];
    const q = [];
    def.spawns.forEach(([type, count]) => {
      for (let i = 0; i < count; i++) q.push(type);
    });
    // shuffle so it's not all-same-type-then-other
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  };

  const spawnEnemyOfType = (s, type) => {
    const def = ENEMY_TYPES[type];
    const x = rand(40, W - 40);
    const y = -30;
    s.enemies.push({
      x, y,
      vx: rand(-0.6, 0.6),
      vy: def.speed * rand(0.85, 1.15),
      type,
      def,
      hp: def.hp,
      angle: 0,
      wobble: Math.random() * Math.PI * 2,
      // Frigate burst-fire state: 3-shot burst every 5s
      // Stagger initial timer so all frigates don't fire simultaneously
      burstTimer: type === "frigate" ? Math.floor(rand(120, 300)) : 0,
      burstShotsLeft: 0,
      burstShotCooldown: 0,
    });
  };

  const spawnBoss = (s) => {
    s.boss = {
      x: W / 2,
      y: -BOSS_DEF.radius,
      tx: W / 2,           // target x for drift
      vy: 0.6,
      hp: BOSS_DEF.hp,
      maxHp: BOSS_DEF.hp,
      def: BOSS_DEF,
      type: "boss",
      phase: 1,            // 1: spread, 2: aimed burst, 3: aimed + spread
      angle: 0,
      fireT: 0,
      moveT: 0,
      entered: false,
    };
    s.bossSpawned = true;
    s.flash = 28;
    s.shake = 14;
  };

  const spawnPowerup = (s, x, y) => {
    // Weighted pool. Common buffs repeated; rare drops appear infrequently.
    const pool = [
      "shield", "shield", "shield", "shield",
      "rapid", "rapid", "rapid", "rapid",
      "multi", "multi", "multi", "multi",
      "bomb", "bomb", "bomb", "bomb",
      "speed", "speed", "speed", "speed", "speed",
      "life", "life",
      "cloak", "cloak",
      "invuln",
      "star",
    ];
    const type = pool[Math.floor(Math.random() * pool.length)];
    s.powerups.push({ x, y, vy: 1.2, type, def: POWERUP_DEFS[type], life: 600 });
  };

  const explode = (s, x, y, color, count = 18) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(1, 5);
      s.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(20, 50),
        color,
      });
    }
  };

  // ---------- Powerup application ----------
  const applyPowerup = (s, type) => {
    const def = POWERUP_DEFS[type];
    if (type === "shield") {
      s.player.shieldHp = Math.max(s.player.shieldHp, 2);
    } else if (type === "bomb") {
      s.bombs = Math.min(9, s.bombs + 1);
    } else if (type === "life") {
      s.lives = Math.min(9, s.lives + 1);
    } else if (def.waveDuration) {
      // wave-based: cloak, invuln, star
      const untilWave = s.wave + def.waveDuration - 1;
      const existing = s.wavePowerups.find((p) => p.type === type);
      if (existing) {
        existing.untilWave = Math.max(existing.untilWave, untilWave);
      } else {
        s.wavePowerups.push({ type, untilWave });
      }
      if (type === "star") {
        // Star also grants +3 lives immediately (capped at 9 to keep HUD tidy)
        s.lives = Math.min(9, s.lives + 3);
      }
    } else {
      // timed: rapid, multi, speed
      const now = performance.now();
      const existing = s.activePowerups.find((p) => p.type === type);
      if (existing) {
        existing.until = now + def.duration;
      } else {
        s.activePowerups.push({ type, until: now + def.duration });
      }
    }
    syncHud(s);
  };

  const hasPowerup = (s, type) => {
    const now = performance.now();
    return s.activePowerups.some((p) => p.type === type && p.until > now);
  };

  const hasWavePowerup = (s, type) => {
    return s.wavePowerups.some((p) => p.type === type && s.wave <= p.untilWave);
  };

  // Damage immunity: cloak (invisible), invuln (totally immune), star (mario mode)
  const isImmune = (s) =>
    hasWavePowerup(s, "cloak") ||
    hasWavePowerup(s, "invuln") ||
    hasWavePowerup(s, "star");

  // ---------- HUD sync ----------
  const syncHud = (s) => {
    const now = performance.now();
    s.activePowerups = s.activePowerups.filter((p) => p.until > now);
    s.wavePowerups = s.wavePowerups.filter((p) => s.wave <= p.untilWave);
    setHud({
      score: s.score,
      lives: s.lives,
      wave: s.wave,
      waveLabel: s.waveLabel || "",
      bombs: s.bombs,
      bossHp: s.boss ? s.boss.hp : 0,
      bossMaxHp: s.boss ? s.boss.maxHp : 0,
      activePowerups: s.activePowerups.map((p) => ({
        type: p.type,
        remaining: Math.max(0, p.until - now),
        color: POWERUP_DEFS[p.type].color,
        label: POWERUP_DEFS[p.type].label,
      })),
      wavePowerups: s.wavePowerups.map((p) => ({
        type: p.type,
        wavesLeft: Math.max(0, p.untilWave - s.wave + 1),
        color: POWERUP_DEFS[p.type].color,
        label: POWERUP_DEFS[p.type].label,
      })),
    });
  };

  // ---------- Main loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    stateRef.current = initState();
    const s = stateRef.current;
    // Initialize wave 1
    s.wave = 1;
    s.waveLabel = WAVES[0].label;
    s.spawnQueue = buildSpawnQueue(0);
    s.spawnCooldown = 30;
    s.waveBanner = 90;

    let raf;
    let lastSync = 0;

    const startWave = () => {
      s.wave += 1;
      // prune expired wave-based powerups now that we're on a new wave
      s.wavePowerups = s.wavePowerups.filter((p) => s.wave <= p.untilWave);
      if (s.wave <= WAVES.length) {
        const def = WAVES[s.wave - 1];
        s.waveLabel = def.label;
        s.spawnQueue = buildSpawnQueue(s.wave - 1);
        s.spawnCooldown = 60;
        s.flash = 14;
        s.waveBanner = 90;
        sfx.wave();
      } else if (s.wave === FINAL_WAVE && !s.bossSpawned) {
        // BOSS WAVE
        s.waveLabel = "DREADNOUGHT";
        s.spawnQueue = [];
        s.flash = 28;
        s.waveBanner = 120;
        sfx.wave();
        sfx.wave();
        // delay boss spawn for dramatic effect
        setTimeout(() => { if (!s.gameOver) spawnBoss(s); }, 1400);
      }
      syncHud(s);
    };

    const update = () => {
      if (s.gameOver) return;
      if (s.paused) return;

      const p = s.player;

      // input movement
      const hasStar = hasWavePowerup(s, "star");
      const speedMult = (hasPowerup(s, "speed") || hasStar) ? 1.42 : 1;
      const accel = 0.7 * speedMult;
      const friction = 0.88;
      if (s.keys["arrowleft"] || s.keys["a"]) p.vx -= accel;
      if (s.keys["arrowright"] || s.keys["d"]) p.vx += accel;
      if (s.keys["arrowup"] || s.keys["w"]) p.vy -= accel;
      if (s.keys["arrowdown"] || s.keys["s"]) p.vy += accel;
      p.vx *= friction;
      p.vy *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.x = Math.max(p.r, Math.min(W - p.r, p.x));
      p.y = Math.max(p.r, Math.min(H - p.r, p.y));
      if (p.invuln > 0) p.invuln -= 1;

      // firing
      const fireRate = (hasPowerup(s, "rapid") || hasStar) ? 5 : 12;
      if (p.cooldown > 0) p.cooldown -= 1;
      if ((s.keys[" "] || s.keys["space"]) && p.cooldown <= 0) {
        p.cooldown = fireRate;
        const multi = hasPowerup(s, "multi");
        let angles;
        if (hasStar) {
          // 7-bullet wide spread
          angles = [-0.27, -0.18, -0.09, 0, 0.09, 0.18, 0.27];
        } else if (multi) {
          // 5-bullet spread (4 outer + center)
          angles = [-0.18, -0.06, 0, 0.06, 0.18];
        } else {
          angles = [0];
        }
        angles.forEach((a) => {
          s.bullets.push({
            x: p.x + Math.sin(a) * 14,
            y: p.y - 18,
            vx: Math.sin(a) * 12,
            vy: -12,
            life: 90,
            r: 3,
          });
        });
        if (hasStar || multi) sfx.shootMulti(); else sfx.shoot();
      }

      // stars
      s.stars.forEach((st) => {
        st.y += st.z * 1.3;
        if (st.y > H) {
          st.y = -2;
          st.x = Math.random() * W;
        }
      });

      // bullets
      s.bullets.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 1;
      });
      s.bullets = s.bullets.filter((b) => b.life > 0 && b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);

      // enemy spawns from wave queue
      if (s.spawnQueue.length > 0) {
        s.spawnCooldown -= 1;
        if (s.spawnCooldown <= 0) {
          const t = s.spawnQueue.shift();
          spawnEnemyOfType(s, t);
          s.spawnCooldown = rand(28, 70);
        }
      } else if (s.enemies.length === 0 && !s.boss && !s.gameOver) {
        if (s.wave < WAVES.length) {
          startWave();
        } else if (s.wave === WAVES.length) {
          // last regular wave cleared -> trigger boss wave
          startWave();
        }
        // if wave === FINAL_WAVE and boss is null and not yet spawned, startWave handles it
      }

      // ----- Boss update -----
      if (s.boss) {
        const b = s.boss;
        // entry: descend until y reaches ~120
        if (!b.entered) {
          b.y += 1.2;
          if (b.y >= 130) b.entered = true;
        } else {
          // drift left/right on a sine
          b.moveT += 1;
          b.x = W / 2 + Math.sin(b.moveT * 0.012) * (W / 2 - 110);
          // phase based on hp
          const ratio = b.hp / b.maxHp;
          b.phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
          b.fireT += 1;
          const fireEvery = b.phase === 1 ? 80 : b.phase === 2 ? 55 : 40;
          if (b.fireT >= fireEvery) {
            b.fireT = 0;
            const px = p.x, py = p.y;
            // attack patterns
            if (b.phase === 1) {
              // 5-way spread
              for (let i = -2; i <= 2; i++) {
                const a = Math.PI / 2 + i * 0.18;
                s.enemyBullets.push({
                  x: b.x, y: b.y + b.def.radius,
                  vx: Math.cos(a) * 4.5,
                  vy: Math.sin(a) * 4.5,
                  r: 5, life: 220,
                });
              }
            } else if (b.phase === 2) {
              // aimed triple
              const dx = px - b.x, dy = py - b.y;
              const len = Math.hypot(dx, dy) || 1;
              for (let i = -1; i <= 1; i++) {
                const ang = Math.atan2(dy, dx) + i * 0.18;
                s.enemyBullets.push({
                  x: b.x, y: b.y + b.def.radius,
                  vx: Math.cos(ang) * 5,
                  vy: Math.sin(ang) * 5,
                  r: 5, life: 240,
                });
              }
            } else {
              // chaos: 7-way + aimed
              for (let i = -3; i <= 3; i++) {
                const a = Math.PI / 2 + i * 0.16;
                s.enemyBullets.push({
                  x: b.x, y: b.y + b.def.radius,
                  vx: Math.cos(a) * 5.5,
                  vy: Math.sin(a) * 5.5,
                  r: 5, life: 240,
                });
              }
              const dx = px - b.x, dy = py - b.y;
              const len = Math.hypot(dx, dy) || 1;
              s.enemyBullets.push({
                x: b.x, y: b.y + b.def.radius,
                vx: (dx / len) * 7,
                vy: (dy / len) * 7,
                r: 6, life: 260,
              });
            }
          }
        }
      }

      // enemies movement & fire
      s.enemies.forEach((en) => {
        en.wobble += 0.05;
        en.x += en.vx + Math.sin(en.wobble) * 0.5;
        en.y += en.vy;
        if (en.x < en.def.radius || en.x > W - en.def.radius) en.vx *= -1;

        // Frigate 3-shot burst every 5s (only after they're fully on-screen)
        if (en.type === "frigate" && en.y > 30) {
          if (en.burstShotsLeft > 0) {
            en.burstShotCooldown -= 1;
            if (en.burstShotCooldown <= 0) {
              const dx = p.x - en.x;
              const dy = p.y - en.y;
              const len = Math.hypot(dx, dy) || 1;
              const sp = 4.5;
              s.enemyBullets.push({
                x: en.x,
                y: en.y + en.def.radius,
                vx: (dx / len) * sp,
                vy: (dy / len) * sp,
                r: 3.5,
                life: 200,
              });
              en.burstShotsLeft -= 1;
              en.burstShotCooldown = 9; // ~150ms between shots in the burst
            }
          } else {
            en.burstTimer -= 1;
            if (en.burstTimer <= 0) {
              en.burstShotsLeft = 2;
              en.burstShotCooldown = 0; // fire first immediately next frame
              en.burstTimer = 300; // 5 seconds @ 60fps
            }
          }
        }

        // Cruiser/Capital random aimed fire (existing)
        if (en.def.fireRate > 0 && Math.random() < en.def.fireRate) {
          const dx = p.x - en.x;
          const dy = p.y - en.y;
          const len = Math.hypot(dx, dy) || 1;
          const sp = 5;
          s.enemyBullets.push({
            x: en.x,
            y: en.y + en.def.radius,
            vx: (dx / len) * sp,
            vy: (dy / len) * sp,
            r: 4,
            life: 200,
          });
        }
      });
      s.enemies = s.enemies.filter((en) => en.y < H + 60);

      // enemy bullets
      s.enemyBullets.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 1;
      });
      s.enemyBullets = s.enemyBullets.filter((b) => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

      // collisions: bullets -> enemies
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        for (let j = s.enemies.length - 1; j >= 0; j--) {
          const en = s.enemies[j];
          const rr = (en.def.radius + b.r) ** 2;
          if (dist2(b, en) < rr) {
            s.bullets.splice(i, 1);
            en.hp -= 1;
            explode(s, b.x, b.y, en.def.color, 6);
            if (en.hp <= 0) {
              s.score += en.def.score;
              s.kills += 1;
              explode(s, en.x, en.y, en.def.color, 24);
              if (en.type === "capital") sfx.bigExplode(); else sfx.explode();
              // 18% chance to drop a power-up
              if (Math.random() < 0.18) spawnPowerup(s, en.x, en.y);
              s.enemies.splice(j, 1);
              s.shake = Math.max(s.shake, 6);
            } else {
              sfx.hit();
            }
            break;
          }
        }
        // bullet -> boss
        if (s.boss && i < s.bullets.length && s.bullets[i] === b) {
          const rr = (s.boss.def.radius + b.r) ** 2;
          if (dist2(b, s.boss) < rr) {
            s.bullets.splice(i, 1);
            s.boss.hp -= 1;
            s.score += 25;
            explode(s, b.x, b.y, s.boss.def.color, 8);
            sfx.hit();
            if (s.boss.hp <= 0) {
              // BOSS KILLED -> VICTORY
              s.score += s.boss.def.score;
              s.kills += 1;
              explode(s, s.boss.x, s.boss.y, s.boss.def.color, 60);
              sfx.bigExplode();
              sfx.victory();
              s.shake = 32;
              s.flash = 36;
              const bossX = s.boss.x, bossY = s.boss.y;
              // chain explosions
              for (let k = 0; k < 6; k++) {
                setTimeout(() => {
                  explode(s, bossX + rand(-50, 50), bossY + rand(-30, 30), "#ffffff", 30);
                  sfx.explode();
                }, k * 180);
              }
              s.boss = null;
              s.victory = true;
              s.gameOver = true;
              setTimeout(() => {
                onDeath({ score: s.score, wave: FINAL_WAVE, kills: s.kills, victory: true });
              }, 2500);
            }
          }
        }
      }

      // collisions: enemy bullet -> player
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        const b = s.enemyBullets[i];
        if (dist2(b, p) < (p.r + b.r) ** 2) {
          s.enemyBullets.splice(i, 1);
          hitPlayer(s);
        }
      }
      // collisions: enemy -> player
      for (let j = s.enemies.length - 1; j >= 0; j--) {
        const en = s.enemies[j];
        if (dist2(en, p) < (en.def.radius + p.r) ** 2) {
          explode(s, en.x, en.y, en.def.color, 22);
          s.enemies.splice(j, 1);
          hitPlayer(s);
        }
      }
      // boss -> player
      if (s.boss) {
        const rr = (s.boss.def.radius + p.r) ** 2;
        if (dist2(s.boss, p) < rr) {
          explode(s, p.x, p.y, s.boss.def.color, 22);
          hitPlayer(s);
        }
      }

      // power-ups movement + pickup
      s.powerups.forEach((pu) => {
        pu.y += pu.vy;
        pu.life -= 1;
      });
      s.powerups = s.powerups.filter((pu) => pu.life > 0 && pu.y < H + 30);
      for (let i = s.powerups.length - 1; i >= 0; i--) {
        const pu = s.powerups[i];
        if (dist2(pu, p) < (p.r + 14) ** 2) {
          applyPowerup(s, pu.type);
          s.powerups.splice(i, 1);
          explode(s, pu.x, pu.y, pu.def.color, 14);
          sfx.powerup();
        }
      }

      // particles
      s.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.96;
        pt.vy *= 0.96;
        pt.life -= 1;
      });
      s.particles = s.particles.filter((pt) => pt.life > 0);

      if (s.shake > 0) s.shake -= 1;
      if (s.flash > 0) s.flash -= 1;

      // periodic HUD sync
      const now = performance.now();
      if (now - lastSync > 120) {
        syncHud(s);
        lastSync = now;
      }
    };

    const hitPlayer = (s) => {
      const p = s.player;
      if (p.invuln > 0) return;
      // Cloak / Invuln / Star — total damage immunity
      if (isImmune(s)) return;
      if (p.shieldHp > 0) {
        p.shieldHp -= 1;
        p.invuln = 40;
        s.shake = 10;
        explode(s, p.x, p.y, "#22d3ee", 18);
        return;
      }
      s.lives -= 1;
      s.shake = 24;
      s.flash = 18;
      explode(s, p.x, p.y, "#e879f9", 40);
      p.invuln = 90;
      p.x = W / 2;
      p.y = H * 0.78;
      p.vx = 0;
      p.vy = 0;
      if (s.lives <= 0) {
        s.gameOver = true;
        sfx.death();
        // delay so explosion shows
        setTimeout(() => {
          onDeath({ score: s.score, wave: s.wave, kills: s.kills });
        }, 800);
      } else {
        sfx.explode();
        syncHud(s);
      }
    };

    // ---------- Drawing ----------
    const draw = () => {
      // background
      ctx.fillStyle = "#02010a";
      ctx.fillRect(0, 0, W, H);

      // shake transform
      let ox = 0, oy = 0;
      if (s.shake > 0) {
        ox = rand(-s.shake, s.shake) * 0.3;
        oy = rand(-s.shake, s.shake) * 0.3;
      }
      ctx.save();
      ctx.translate(ox, oy);

      // stars
      s.stars.forEach((st) => {
        const alpha = 0.3 + st.z * 0.3;
        ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
        ctx.fillRect(st.x, st.y, st.z, st.z);
      });

      // grid hint at bottom (horizon vibe)
      ctx.strokeStyle = "rgba(124, 58, 237, 0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const y = H - i * 22;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // power-ups
      s.powerups.forEach((pu) => {
        const wobble = Math.sin(performance.now() / 200 + pu.x) * 2;
        ctx.save();
        ctx.translate(pu.x, pu.y + wobble);
        ctx.strokeStyle = pu.def.color;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-12, -12, 24, 24);
        ctx.fill();
        ctx.stroke();

        if (pu.type === "life") {
          // pulsing heart shape for extra-life pickup
          const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;
          ctx.scale(pulse, pulse);
          ctx.fillStyle = pu.def.color;
          ctx.shadowColor = pu.def.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          // heart path centered at (0,0), ~16x14
          ctx.moveTo(0, 5);
          ctx.bezierCurveTo(0, 2, -3, -6, -8, -6);
          ctx.bezierCurveTo(-13, -6, -13, 0, -13, 0);
          ctx.bezierCurveTo(-13, 4, -8, 8, 0, 8);
          ctx.bezierCurveTo(8, 8, 13, 4, 13, 0);
          ctx.bezierCurveTo(13, 0, 13, -6, 8, -6);
          ctx.bezierCurveTo(3, -6, 0, 2, 0, 5);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (pu.type === "star") {
          // pulsing 5-pointed star with rainbow shimmer
          const pulse = 1 + Math.sin(performance.now() / 130) * 0.14;
          ctx.scale(pulse, pulse);
          const hue = (performance.now() / 8) % 360;
          ctx.fillStyle = `hsl(${hue}, 95%, 65%)`;
          ctx.shadowColor = pu.def.color;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          const pts = 5, outerR = 9, innerR = 4;
          for (let i = 0; i < pts * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (Math.PI * i) / pts - Math.PI / 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = pu.def.color;
          ctx.font = "bold 14px Audiowide, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pu.def.icon, 0, 1);
        }
        ctx.restore();
      });

      // enemy bullets
      s.enemyBullets.forEach((b) => {
        ctx.fillStyle = "#fca5a5";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // enemies
      s.enemies.forEach((en) => {
        drawEnemy(ctx, en);
      });

      // boss
      if (s.boss) {
        drawBoss(ctx, s.boss);
      }

      // bullets (player)
      s.bullets.forEach((b) => {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 10;
        ctx.fillRect(b.x - 1.5, b.y - 6, 3, 10);
        ctx.shadowBlur = 0;
      });

      // particles
      s.particles.forEach((pt) => {
        const alpha = Math.max(0, Math.min(1, pt.life / 40));
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
      });
      ctx.globalAlpha = 1;

      // player
      drawPlayer(ctx, s);

      ctx.restore();

      // flash overlay
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(232, 121, 249, ${s.flash / 40})`;
        ctx.fillRect(0, 0, W, H);
      }

      // pause overlay
      if (s.paused) {
        ctx.fillStyle = "rgba(6, 2, 13, 0.78)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 48px Audiowide, monospace";
        ctx.textAlign = "center";
        ctx.fillText("// PAUSED", W / 2, H / 2 - 8);
        ctx.font = "20px 'Share Tech Mono', monospace";
        ctx.fillStyle = "#c084fc";
        ctx.fillText("Press P to resume", W / 2, H / 2 + 28);
      }

      // wave banner
      if (s.waveBanner > 0) {
        s.waveBanner -= 1;
        const alpha = Math.min(1, s.waveBanner / 20) * (s.waveBanner > 70 ? (90 - s.waveBanner) / 20 : 1);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = "center";
        ctx.font = "16px 'Share Tech Mono', monospace";
        ctx.fillStyle = "#c084fc";
        ctx.fillText(
          s.wave === FINAL_WAVE ? "// FINAL WAVE //" : `// WAVE ${s.wave} //`,
          W / 2, H / 2 - 30
        );
        ctx.font = (s.wave === FINAL_WAVE ? "bold 56px" : "bold 44px") + " Audiowide, monospace";
        ctx.fillStyle = s.wave === FINAL_WAVE ? "#e879f9" : "#ffffff";
        ctx.shadowColor = s.wave === FINAL_WAVE ? "#e879f9" : "#a855f7";
        ctx.shadowBlur = 24;
        ctx.fillText(s.waveLabel, W / 2, H / 2 + 14);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // boss HP bar (top of canvas)
      if (s.boss) {
        const bw = W * 0.7;
        const bh = 14;
        const bx = (W - bw) / 2;
        const by = 14;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
        ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
        ctx.fillRect(bx, by, bw, bh);
        const ratio = Math.max(0, s.boss.hp / s.boss.maxHp);
        const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        grad.addColorStop(0, "#e879f9");
        grad.addColorStop(0.5, "#a855f7");
        grad.addColorStop(1, "#c084fc");
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, bw * ratio, bh);
        ctx.strokeStyle = "rgba(232, 121, 249, 0.85)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.font = "bold 12px 'Share Tech Mono', monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(`DREADNOUGHT  ${Math.ceil(s.boss.hp)} / ${s.boss.maxHp}`, W / 2, by + bh + 14);
      }
    };

    const loop = () => {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync paused state to ref
  useEffect(() => {
    if (stateRef.current) stateRef.current.paused = paused;
  }, [paused]);

  return (
    <div className="game-shell" data-testid="game-shell">
      <div className="game-hud" data-testid="game-hud">
        <div className="hud-block">
          <div className="hud-label">Score</div>
          <div className="hud-value" data-testid="hud-score">{hud.score.toLocaleString()}</div>
        </div>
        <div className="hud-block">
          <div className="hud-label">Wave</div>
          <div className="hud-value" data-testid="hud-wave">
            {hud.wave > WAVES.length ? "BOSS" : `${hud.wave}/10`}
            {hud.waveLabel ? <span style={{ fontSize: 11, marginLeft: 6, color: "#c084fc" }}>{hud.waveLabel}</span> : null}
          </div>
        </div>
        <div className="hud-block">
          <div className="hud-label">Lives</div>
          <div className="hud-value" data-testid="hud-lives">{"♦".repeat(Math.max(0, hud.lives))}</div>
        </div>
        <div className="hud-block">
          <div className="hud-label">Bombs [X]</div>
          <div className="hud-value" data-testid="hud-bombs">{hud.bombs}</div>
        </div>
        <div className="hud-block hud-powerups" data-testid="hud-powerups">
          {hud.activePowerups.length === 0 && (!hud.wavePowerups || hud.wavePowerups.length === 0) ? (
            <span style={{ fontFamily: "VT323, monospace", color: "rgba(255,255,255,0.4)", fontSize: 18 }}>—</span>
          ) : (
            <>
              {(hud.wavePowerups || []).map((wp) => (
                <span key={`w-${wp.type}`} className="hud-pup" style={{ color: wp.color }} data-testid={`hud-wave-${wp.type}`}>
                  {wp.label} {wp.wavesLeft}w
                </span>
              ))}
              {hud.activePowerups.map((pp) => (
                <span key={pp.type} className="hud-pup" style={{ color: pp.color }}>
                  {pp.label} {Math.ceil(pp.remaining / 1000)}s
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />
      </div>
    </div>
  );
}

// ---------- Drawing helpers ----------
function drawPlayer(ctx, s) {
  const p = s.player;
  const blink = p.invuln > 0 && Math.floor(p.invuln / 4) % 2 === 0;
  if (blink) return;

  // wave-buff visuals
  const isWaveActive = (type) =>
    s.wavePowerups && s.wavePowerups.some((wp) => wp.type === type && s.wave <= wp.untilWave);
  const hasCloak = isWaveActive("cloak");
  const hasInvuln = isWaveActive("invuln");
  const hasStar = isWaveActive("star");

  ctx.save();
  ctx.translate(p.x, p.y);

  if (hasCloak) {
    // shimmering ghostly outline; ship rendered at low alpha
    ctx.globalAlpha = 0.32 + Math.sin(performance.now() / 90) * 0.08;
  }

  // engine flame
  const flameLen = 8 + Math.random() * 6;
  ctx.fillStyle = "#e879f9";
  ctx.beginPath();
  ctx.moveTo(-5, 10);
  ctx.lineTo(0, 10 + flameLen);
  ctx.lineTo(5, 10);
  ctx.closePath();
  ctx.fill();

  // body (purple ship)
  ctx.fillStyle = "#a855f7";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(12, 10);
  ctx.lineTo(4, 6);
  ctx.lineTo(-4, 6);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // cockpit
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  // restore alpha for buff overlays so they remain bright
  ctx.globalAlpha = 1;

  // shield ring
  if (p.shieldHp > 0) {
    ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22 + Math.sin(performance.now() / 120) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // cloak shimmer ring
  if (hasCloak) {
    ctx.strokeStyle = "rgba(165, 243, 252, 0.5)";
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // invuln gold ring
  if (hasInvuln) {
    ctx.strokeStyle = "rgba(251, 191, 36, 0.95)";
    ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 26 + Math.sin(performance.now() / 80) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // star — rainbow rotating ring + sparkle
  if (hasStar) {
    const t = performance.now();
    const hue = (t / 4) % 360;
    ctx.strokeStyle = `hsl(${hue}, 95%, 65%)`;
    ctx.shadowColor = `hsl(${hue}, 95%, 65%)`;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(t / 60) * 3, 0, Math.PI * 2);
    ctx.stroke();
    // little sparkles around the ring
    for (let i = 0; i < 4; i++) {
      const ang = (t / 250) + (i * Math.PI) / 2;
      const sx = Math.cos(ang) * 30;
      const sy = Math.sin(ang) * 30;
      ctx.fillStyle = `hsl(${(hue + i * 90) % 360}, 95%, 70%)`;
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawEnemy(ctx, en) {
  const { x, y, def, type, hp } = en;
  ctx.save();
  ctx.translate(x, y);

  if (type === "frigate") {
    ctx.fillStyle = def.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, def.radius);
    ctx.lineTo(def.radius, -def.radius);
    ctx.lineTo(0, -def.radius * 0.4);
    ctx.lineTo(-def.radius, -def.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === "cruiser") {
    ctx.fillStyle = def.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-def.radius, -def.radius * 0.6, def.radius * 2, def.radius * 1.2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-6, 0, 2, 0, Math.PI * 2);
    ctx.arc(6, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // capital
    ctx.fillStyle = def.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-def.radius, -def.radius * 0.4);
    ctx.lineTo(-def.radius * 0.6, -def.radius);
    ctx.lineTo(def.radius * 0.6, -def.radius);
    ctx.lineTo(def.radius, -def.radius * 0.4);
    ctx.lineTo(def.radius * 0.7, def.radius * 0.6);
    ctx.lineTo(-def.radius * 0.7, def.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-def.radius * 0.5, -def.radius * 0.2, def.radius, 4);
  }

  // hp bar
  if (hp < def.hp) {
    const w = def.radius * 2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(-w / 2, -def.radius - 10, w, 4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-w / 2, -def.radius - 10, (hp / def.hp) * w, 4);
  }

  // type label
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "10px VT323, monospace";
  ctx.textAlign = "center";
  ctx.fillText(def.label, 0, def.radius + 12);

  ctx.restore();
}


function drawBoss(ctx, b) {
  const r = b.def.radius;
  ctx.save();
  ctx.translate(b.x, b.y);

  const t = performance.now() / 600;
  const pulse = 1 + Math.sin(t * 4) * 0.04;
  ctx.scale(pulse, pulse);

  // outer hull
  ctx.fillStyle = b.def.color;       // red
  ctx.strokeStyle = "#ffffff";       // white outline
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.3);
  ctx.lineTo(-r * 0.7, -r * 0.85);
  ctx.lineTo(-r * 0.25, -r);
  ctx.lineTo(r * 0.25, -r);
  ctx.lineTo(r * 0.7, -r * 0.85);
  ctx.lineTo(r, -r * 0.3);
  ctx.lineTo(r * 0.85, r * 0.5);
  ctx.lineTo(r * 0.55, r * 0.85);
  ctx.lineTo(-r * 0.55, r * 0.85);
  ctx.lineTo(-r * 0.85, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // inner core (animated)
  ctx.save();
  ctx.rotate(t);
  ctx.fillStyle = "#fca5a5";
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * 0.32 : r * 0.18;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // gun barrels
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(-r * 0.7, r * 0.6, r * 0.2, r * 0.4);
  ctx.fillRect(r * 0.5, r * 0.6, r * 0.2, r * 0.4);
  ctx.fillRect(-r * 0.1, r * 0.7, r * 0.2, r * 0.4);

  // wing detail
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, 0);
  ctx.lineTo(r * 0.5, 0);
  ctx.stroke();

  ctx.restore();
}
