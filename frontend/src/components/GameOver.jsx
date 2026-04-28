import React, { useState, useMemo } from "react";

const DEATH_LINES = [
  "YOU GOT PIPEBOMBED!",
  "OH NO YOU DIED!",
  "YOU CLUMSY PILOT!",
  "F IN CHAT!",
  "GF'S IN LOCAL! O7",
];

const VICTORY_LINES = [
  "DREADNOUGHT DOWN! GF!",
  "NEW EDEN IS YOURS! O7",
  "PIPEBOMB-PROOF PILOT!",
];

export default function GameOver({ stats, onSubmit, onRestart, onHome, submitting }) {
  const [pilot, setPilot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isVictory = !!stats.victory;
  const headline = useMemo(() => {
    const pool = isVictory ? VICTORY_LINES : DEATH_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVictory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = pilot.trim();
    if (!name) return;
    await onSubmit(name);
    setSubmitted(true);
  };

  return (
    <section className="over-wrap" data-testid="game-over-screen">
      <h2 className={`over-title ${isVictory ? "over-title--victory" : ""}`} data-testid="death-line">{headline}</h2>
      <p className="over-sub">
        {isVictory ? "You survived downtime. CCP is back online. o7" : "Better luck next time, capsuleer."}
      </p>

      <div className="over-stats" data-testid="game-over-stats">
        <div className="over-stat">
          <div className="over-stat-label">Score</div>
          <div className="over-stat-value" data-testid="final-score">{stats.score.toLocaleString()}</div>
        </div>
        <div className="over-stat">
          <div className="over-stat-label">Wave</div>
          <div className="over-stat-value" data-testid="final-wave">{stats.wave}</div>
        </div>
        <div className="over-stat">
          <div className="over-stat-label">Kills</div>
          <div className="over-stat-value" data-testid="final-kills">{stats.kills}</div>
        </div>
      </div>

      {!submitted && (
        <form className="over-form" onSubmit={handleSubmit} data-testid="submit-score-form">
          <input
            type="text"
            className="over-input"
            placeholder="PILOT NAME"
            value={pilot}
            onChange={(e) => setPilot(e.target.value.toUpperCase().slice(0, 16))}
            maxLength={16}
            data-testid="pilot-name-input"
            disabled={submitting}
          />
          <button
            type="submit"
            className="eve-btn"
            disabled={submitting || !pilot.trim()}
            data-testid="submit-score-btn"
          >
            {submitting ? "..." : "SAVE"}
          </button>
        </form>
      )}

      <div className="over-actions">
        <button type="button" className="eve-btn" onClick={onRestart} data-testid="restart-btn">
          RE-UNDOCK
        </button>
        <button type="button" className="eve-btn eve-btn-pink" onClick={onHome} data-testid="home-btn">
          STATION
        </button>
      </div>
    </section>
  );
}
