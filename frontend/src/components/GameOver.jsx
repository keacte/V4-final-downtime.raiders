import React, { useState } from "react";

export default function GameOver({ stats, onSubmit, onRestart, onHome, submitting }) {
  const [pilot, setPilot] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = pilot.trim();
    if (!name) return;
    await onSubmit(name);
    setSubmitted(true);
  };

  return (
    <section className="over-wrap" data-testid="game-over-screen">
      <h2 className="over-title">OH NO &mdash; GOT PIPEBOMBED!</h2>
      <p className="over-sub">Better luck next time, capsuleer.</p>

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
