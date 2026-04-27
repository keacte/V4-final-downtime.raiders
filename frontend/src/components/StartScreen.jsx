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
        downtime<span className="dr-dot">.</span>rocks
      </h2>
      <p className="start-blurb">
        Capsuleer, lock your fittings. Frigates, cruisers and capitals are
        warping in hot. Grab power-ups, rack up kills, and don&apos;t get
        pipebombed. Survive long enough to make the killboard.
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
