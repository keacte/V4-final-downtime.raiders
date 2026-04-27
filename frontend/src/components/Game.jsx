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
    color: "#c084fc",
    fireRate: 0,
  },
  cruiser: {
    label: "CRU",
    radius: 20,
    hp: 3,
    speed: 1.4,
    score: 150,
    color: "#a855f7",
    fireRate: 0.012,
  },
  capital: {
    label: "CAP",
    radius: 34,
    hp: 8,
    speed: 0.7,
    score: 500,
    color: "#7c3aed",
    fireRate: 0.022,
  },
};

// ----- Power-ups -----
const POWERUP_DEFS = {
  shield:   { color: "#22d3ee", label: "SHIELD",     duration: 0,    icon: "S" }, // instant
  rapid:    { color: "#facc15", label: "RAPID",      duration: 8000, icon: "R" },
  multi:    { color: "#a855f7", label: "MULTI",      duration: 10000, icon: "M" },
  bomb:     { color: "#ffffff", label: "BOMB",       duration: 0,    icon: "B" }, // stockable
  speed:    { color: "#34d399", label: "SPEED",      duration: 8000, icon: "V" },
};

const POWERUP_KEYS = Object.keys(POWERUP_DEFS);

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
      spawnCooldown: 0,
      // active timed powerups: {type, until}
      activePowerups: [],
      gameOver: false,
      shake: 0,
      flash: 0,
      paused: false,
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
    syncHud(s);
  };

  // ---------- Spawn helpers ----------
  const spawnEnemy = (s) => {
    const wave = s.wave;
    // Composition by wave
    const roll = Math.random();
    let type;
    if (wave < 2) {
      type = "frigate";
    } else if (wave < 4) {
      type = roll < 0.7 ? "frigate" : "cruiser";
    } else if (wave < 6) {
      type = roll < 0.55 ? "frigate" : roll < 0.9 ? "cruiser" : "capital";
    } else {
      type = roll < 0.45 ? "frigate" : roll < 0.8 ? "cruiser" : "capital";
    }
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
    });
  };

  const spawnPowerup = (s, x, y) => {
    const type = POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
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

  // ---------- HUD sync ----------
  const syncHud = (s) => {
    const now = performance.now();
    s.activePowerups = s.activePowerups.filter((p) => p.until > now);
    setHud({
      score: s.score,
      lives: s.lives,
      wave: s.wave,
      bombs: s.bombs,
      activePowerups: s.activePowerups.map((p) => ({
        type: p.type,
        remaining: Math.max(0, p.until - now),
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
    s.enemiesToSpawn = 6;
    let raf;
    let lastSync = 0;

    const startWave = () => {
      s.wave += 1;
      s.enemiesToSpawn = 5 + s.wave * 2;
      s.spawnCooldown = 60;
      s.flash = 14;
      sfx.wave();
    };

    const update = () => {
      if (s.gameOver) return;
      if (s.paused) return;

      const p = s.player;

      // input movement
      const speedMult = hasPowerup(s, "speed") ? 1.6 : 1;
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
      const fireRate = hasPowerup(s, "rapid") ? 5 : 12;
      if (p.cooldown > 0) p.cooldown -= 1;
      if ((s.keys[" "] || s.keys["space"]) && p.cooldown <= 0) {
        p.cooldown = fireRate;
        const multi = hasPowerup(s, "multi");
        const angles = multi ? [-0.18, -0.06, 0.06, 0.18] : [0];
        if (multi) angles.push(0); // center too
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
        if (multi) sfx.shootMulti(); else sfx.shoot();
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

      // enemy spawns
      if (s.enemiesToSpawn > 0) {
        s.spawnCooldown -= 1;
        if (s.spawnCooldown <= 0) {
          spawnEnemy(s);
          s.enemiesToSpawn -= 1;
          s.spawnCooldown = rand(30, 80);
        }
      } else if (s.enemies.length === 0) {
        startWave();
      }

      // enemies movement & fire
      s.enemies.forEach((en) => {
        en.wobble += 0.05;
        en.x += en.vx + Math.sin(en.wobble) * 0.5;
        en.y += en.vy;
        if (en.x < en.def.radius || en.x > W - en.def.radius) en.vx *= -1;
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
        ctx.fillStyle = pu.def.color;
        ctx.font = "bold 14px Oxanium, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.def.icon, 0, 1);
        ctx.restore();
      });

      // enemy bullets
      s.enemyBullets.forEach((b) => {
        ctx.fillStyle = "#e879f9";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // enemies
      s.enemies.forEach((en) => {
        drawEnemy(ctx, en);
      });

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
        ctx.font = "bold 48px Oxanium, monospace";
        ctx.textAlign = "center";
        ctx.fillText("// PAUSED", W / 2, H / 2 - 8);
        ctx.font = "20px VT323, monospace";
        ctx.fillStyle = "#c084fc";
        ctx.fillText("Press P to resume", W / 2, H / 2 + 28);
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
          <div className="hud-value" data-testid="hud-wave">{hud.wave}</div>
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
          {hud.activePowerups.length === 0 ? (
            <span style={{ fontFamily: "VT323, monospace", color: "rgba(255,255,255,0.4)", fontSize: 18 }}>—</span>
          ) : hud.activePowerups.map((pp) => (
            <span key={pp.type} className="hud-pup" style={{ color: pp.color }}>
              {pp.label} {Math.ceil(pp.remaining / 1000)}s
            </span>
          ))}
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

  ctx.save();
  ctx.translate(p.x, p.y);

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

  // shield ring
  if (p.shieldHp > 0) {
    ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22 + Math.sin(performance.now() / 120) * 2, 0, Math.PI * 2);
    ctx.stroke();
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
    ctx.strokeStyle = "#c084fc";
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
    ctx.fillStyle = "#c084fc";
    ctx.fillRect(-w / 2, -def.radius - 10, (hp / def.hp) * w, 4);
  }

  // type label
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "10px VT323, monospace";
  ctx.textAlign = "center";
  ctx.fillText(def.label, 0, def.radius + 12);

  ctx.restore();
}
