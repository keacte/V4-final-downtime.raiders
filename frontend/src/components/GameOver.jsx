import React, { useMemo, useState } from "react";

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

const TRANSITION_MS = 1600;

export default function GameOver({ stats, onRestart, onHome }) {
  const [transitionMsg, setTransitionMsg] = useState(null);
  const isVictory = !!stats.victory;
  const headline = useMemo(() => {
    const pool = isVictory ? VICTORY_LINES : DEATH_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVictory]);

  const handleUndock = () => {
    if (transitionMsg) return;
    setTransitionMsg("Jump clone activated — undocking now!");
    setTimeout(() => onRestart(), TRANSITION_MS);
  };

  const handleStation = () => {
    if (transitionMsg) return;
    setTransitionMsg("Docking request accepted! Thanks for playing! o7");
    setTimeout(() => onHome(), TRANSITION_MS);
  };

  if (transitionMsg) {
    return (
      <section className="transition-screen" data-testid="transition-screen">
        <p className="transition-msg" data-testid="transition-msg">{transitionMsg}</p>
      </section>
    );
  }

  return (
    <section className="over-wrap" data-testid="game-over-screen">
      <h2 className={`over-title ${isVictory ? "over-title--victory" : ""}`} data-testid="death-line">{headline}</h2>
      <p className="over-sub">
        {isVictory ? "You survived downtime. CCP is back online. o7" : "Better luck next time, capsuleer."}
      </p>
      <p className="over-prompt" data-testid="over-prompt">
        Have you got time for another round?
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

      <div className="over-actions">
        <button
          type="button"
          className="eve-btn"
          onClick={handleUndock}
          data-testid="restart-btn"
        >
          UNDOCK
        </button>
        <button
          type="button"
          className="eve-btn eve-btn-pink"
          onClick={handleStation}
          data-testid="home-btn"
        >
          STATION
        </button>
      </div>
    </section>
  );
}
