import React from "react";

const POWERUPS = [
  { name: "SHIELD", color: "#22d3ee" },
  { name: "RAPID FIRE", color: "#facc15" },
  { name: "MULTI-SHOT", color: "#a855f7" },
  { name: "SMART BOMB", color: "#ffffff" },
  { name: "SPEED", color: "#34d399" },
];

export default function StartScreen({ onStart }) {
  return (
    <section className="start-wrap" data-testid="start-screen">
      <span className="start-tag">// FLEET COMMAND BRIEFING</span>
      <h2 className="start-headline">
        downtime<span className="dr-dot">.</span>raiders
      </h2>
      <p className="start-blurb">
        The server&apos;s down for daily maintenance. While CCP reboots, raid New
        Eden in your <span className="hl-pink">Rifter</span> across{' '}
        <span className="hl-cyan">5 escalating waves</span> of frigates, cruisers
        and capitals &mdash; ending in a{' '}
        <span className="hl-magenta">Dreadnought boss fight</span>. Loot{' '}
        <span className="hl-cyan">5 power-ups</span>: Shield, Rapid Fire,
        Multi-shot, Smart Bomb and Speed. Don&apos;t get pipebombed. Rep the
        killboard. o7
      </p>

      <div className="start-actions">
        <button
          type="button"
          className="btn-arcade"
          onClick={onStart}
          data-testid="start-btn"
        >
          ► UNDOCK
        </button>
        <a
          className="btn-ghost"
          href="#leaderboard-section"
          data-testid="view-leaderboard-btn"
        >
          KILLBOARD
        </a>
      </div>

      <div className="start-controls" data-testid="controls-panel">
        <div className="start-control"><b>WASD / ARROWS</b> THRUST</div>
        <div className="start-control"><b>SPACE</b> FIRE GUNS</div>
        <div className="start-control"><b>X</b> SMART BOMB</div>
        <div className="start-control"><b>P</b> PAUSE</div>
      </div>

      <div className="start-powerups" data-testid="powerups-list">
        {POWERUPS.map((p) => (
          <span key={p.name} className="powerup-chip">
            <span className="swatch" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }} />
            {p.name}
          </span>
        ))}
      </div>
    </section>
  );
}
