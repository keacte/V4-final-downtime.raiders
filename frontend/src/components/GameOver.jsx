import React, { useMemo, useState } from "react";
import TransitionScreen from "./TransitionScreen";
import KillReport from "./KillReport";
import { KILL_REPORTS } from "../lib/killReports";

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

export default function GameOver({ stats, onRestart, onHome }) {
  const [transition, setTransition] = useState(null);

  const isVictory = !!stats.victory;
  const headline = useMemo(() => {
    const pool = isVictory ? VICTORY_LINES : DEATH_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVictory]);
  const report = useMemo(() => {
    if (isVictory) return null;
    return KILL_REPORTS[Math.floor(Math.random() * KILL_REPORTS.length)];
  }, [isVictory]);

  const handleUndock = () => {
    if (transition) return;
    setTransition({
      msg: "Jump clone activated — undocking now!",
      countdown: true,
      onComplete: onRestart,
    });
  };

  const handleStation = () => {
    if (transition) return;
    setTransition({
      msg: "Docking request accepted! Thanks for playing! o7",
      countdown: false,
      onComplete: onHome,
    });
  };

  if (transition) {
    return (
      <TransitionScreen
        msg={transition.msg}
        countdown={transition.countdown}
        onComplete={transition.onComplete}
      />
    );
  }

  return (
    <section className="over-wrap over-wrap--wide" data-testid="game-over-screen">
      <h2 className={`over-title ${isVictory ? "over-title--victory" : ""}`} data-testid="death-line">{headline}</h2>
      <p className="over-sub">
        {isVictory ? "You survived downtime. CCP is back online. o7" : "Better luck next time, capsuleer."}
      </p>

      {report && <KillReport report={report} />}

      <p className="over-prompt" data-testid="over-prompt">
        Have you got time for another round?
      </p>

      <div className="over-stats over-stats--inline" data-testid="game-over-stats">
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
