import React, { useMemo, useState, useEffect } from "react";
import { sfx } from "../lib/sounds";

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

const PRE_COUNTDOWN_MS = 1800; // message shows alone before countdown starts
const STATION_HOLD_MS = 2600;  // station message duration (no countdown)

export default function GameOver({ stats, onRestart, onHome }) {
  const [transition, setTransition] = useState(null); // { msg, next, countdown }
  const [countdown, setCountdown] = useState(null);   // 3 | 2 | 1 | null

  const isVictory = !!stats.victory;
  const headline = useMemo(() => {
    const pool = isVictory ? VICTORY_LINES : DEATH_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVictory]);

  // Start the timer once a transition is set
  useEffect(() => {
    if (!transition) return undefined;
    if (transition.countdown) {
      const t = setTimeout(() => setCountdown(3), PRE_COUNTDOWN_MS);
      return () => clearTimeout(t);
    }
    // No countdown — just hold the message and transition
    const t = setTimeout(() => onHome(), STATION_HOLD_MS);
    return () => clearTimeout(t);
  }, [transition, onHome]);

  // Drive countdown ticks
  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown <= 0) {
      sfx.countdownGo();
      if (transition?.next === "restart") onRestart();
      else if (transition?.next === "home") onHome();
      return undefined;
    }
    sfx.countdownTick(countdown);
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, transition, onRestart, onHome]);

  const handleUndock = () => {
    if (transition) return;
    setTransition({
      msg: "Jump clone activated — undocking now!",
      next: "restart",
      countdown: true,
    });
  };

  const handleStation = () => {
    if (transition) return;
    setTransition({
      msg: "Docking request accepted! Thanks for playing! o7",
      next: "home",
      countdown: false,
    });
  };

  if (transition) {
    return (
      <section className="transition-screen" data-testid="transition-screen">
        <p className="transition-msg" data-testid="transition-msg">{transition.msg}</p>
        {transition.countdown && countdown !== null && countdown > 0 && (
          <p className="transition-count" key={countdown} data-testid="transition-count">
            {countdown}
          </p>
        )}
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
