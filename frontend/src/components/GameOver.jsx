import React, { useMemo, useRef, useState } from "react";
import TransitionScreen from "./TransitionScreen";
import KillReport from "./KillReport";
import FleetReport from "./FleetReport";
import { KILL_REPORTS } from "../lib/killReports";
import { FLEET_REPORTS } from "../lib/fleetReports";
import { shareKillCard } from "../lib/shareCard";

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
  const [shareState, setShareState] = useState("idle"); // idle | working | shared | downloaded | error
  const cardRef = useRef(null);

  const isVictory = !!stats.victory;
  const headline = useMemo(() => {
    const pool = isVictory ? VICTORY_LINES : DEATH_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVictory]);
  const report = useMemo(() => {
    if (isVictory) return null;
    return KILL_REPORTS[Math.floor(Math.random() * KILL_REPORTS.length)];
  }, [isVictory]);
  const fleetReport = useMemo(() => {
    if (!isVictory) return null;
    return FLEET_REPORTS[Math.floor(Math.random() * FLEET_REPORTS.length)];
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

  const handleShare = async () => {
    if (shareState === "working" || !cardRef.current) return;
    setShareState("working");
    try {
      const result = await shareKillCard(cardRef.current, {
        filename: `downtime-raiders-${isVictory ? "victory" : "kill"}-${stats.score}.png`,
        title: isVictory ? "downtime.raiders — victory!" : "downtime.raiders — got pipebombed!",
        text: isVictory
          ? `I took down the Dreadnought in downtime.raiders! Score: ${stats.score} o7 #npsi`
          : `I got pipebombed in downtime.raiders! Score: ${stats.score} — better luck next time! o7 #npsi`,
      });
      if (!result.ok) {
        setShareState("error");
      } else {
        setShareState(result.method === "share" ? "shared" : "downloaded");
      }
    } catch (e) {
      setShareState("error");
    } finally {
      setTimeout(() => setShareState("idle"), 2600);
    }
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

  const shareLabel = {
    idle: isVictory ? "SHARE FLEET REPORT" : "SHARE KILL",
    working: "CAPTURING…",
    shared: "SHARED! O7",
    downloaded: "SAVED! O7",
    error: "RETRY",
  }[shareState];

  return (
    <section className="over-wrap over-wrap--wide" data-testid="game-over-screen">
      <div ref={cardRef} className="share-card" data-testid="share-card">
        <h2 className={`over-title ${isVictory ? "over-title--victory" : ""}`} data-testid="death-line">{headline}</h2>
        <p className="over-sub">
          {isVictory ? "You survived downtime. CCP is back online. o7" : "Better luck next time, capsuleer."}
        </p>

        {report && <KillReport report={report} />}
        {fleetReport && <FleetReport report={fleetReport} />}

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

        {/* Branding shown only during PNG capture */}
        <div className="share-brand" aria-hidden="true">
          <span className="share-brand-title">downtime.raiders</span>
          <span className="share-brand-sep">//</span>
          <span className="share-brand-url">NPSI.ROCKS</span>
        </div>
      </div>

      <p className="over-prompt" data-testid="over-prompt">
        Have you got time for another round?
      </p>

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
          className="eve-btn eve-btn-cyan"
          onClick={handleShare}
          disabled={shareState === "working"}
          data-testid="share-btn"
        >
          {shareLabel}
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
