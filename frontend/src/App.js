import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import Game from "./components/Game";
import StartScreen from "./components/StartScreen";
import GameOver from "./components/GameOver";
import Leaderboard from "./components/Leaderboard";
import { Toaster } from "sonner";
import { Volume2, VolumeX, X } from "lucide-react";
import { sfx, setMuted, isMuted, unlockAudio, startMusic, stopMusic } from "./lib/sounds";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [screen, setScreen] = useState("start");
  const [finalStats, setFinalStats] = useState({ score: 0, wave: 1, kills: 0 });
  const [scores, setScores] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [showKillboard, setShowKillboard] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/scores?limit=10`);
      setScores(res.data || []);
    } catch (e) {
      console.error("scores fetch failed", e);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  useEffect(() => {
    if (screen === "playing") startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [screen]);

  const toggleMute = () => {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.click();
  };

  const handleStart = () => {
    unlockAudio();
    sfx.click();
    setShowKillboard(false);
    setScreen("playing");
  };

  const handleDeath = (stats) => {
    setFinalStats(stats);
    setScreen("dead");
  };

  const handleSubmit = async (pilot) => {
    if (!pilot || submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/scores`, {
        pilot,
        score: finalStats.score,
        wave: finalStats.wave,
        kills: finalStats.kills,
      });
      await fetchScores();
    } catch (e) {
      console.error("score submit failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    sfx.click();
    setScreen("playing");
  };

  const handleHome = () => {
    sfx.click();
    setScreen("start");
    fetchScores();
  };

  const handleShowKillboard = () => {
    sfx.click();
    fetchScores();
    setShowKillboard(true);
  };

  const handleHideKillboard = () => {
    sfx.click();
    setShowKillboard(false);
  };

  // Warp streaks generated once
  const warpStreaks = Array.from({ length: 22 }).map((_, i) => {
    const left = (i * 5.1) % 100;
    const heights = [80, 140, 200, 260];
    const durations = [4, 5, 6, 7, 8];
    const h = heights[i % heights.length];
    const d = durations[i % durations.length];
    const delay = ((i * 0.41) % 5).toFixed(2);
    return (
      <span
        key={i}
        className="warp-streak"
        style={{
          left: `${left}%`,
          height: `${h}px`,
          animationDuration: `${d}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  const appClass = [
    "App",
    screen === "playing" ? "app--playing" : "",
    screen === "start" ? "app--start" : "",
    screen === "dead" ? "app--dead" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={appClass} data-testid="app-root">
      <Toaster position="top-center" theme="dark" />

      {/* Background layers */}
      <div className="starfield" aria-hidden="true" />
      <div className="warp-streaks" aria-hidden="true">{warpStreaks}</div>
      <div className="sw-grid-floor" aria-hidden="true" />
      <div className="scan-bar" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      <div className="crt-flicker" aria-hidden="true" />

      {/* Floating mute button (top-right) */}
      {screen !== "playing" && (
        <div className="floating-mute">
          <button
            type="button"
            className="eve-btn eve-btn-icon"
            onClick={toggleMute}
            data-testid="mute-btn"
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      )}

      {/* Screens */}
      {screen === "start" && (
        <StartScreen onStart={handleStart} onShowKillboard={handleShowKillboard} />
      )}
      {screen === "playing" && (
        <main className="play-main" data-testid="play-main">
          <Game onDeath={handleDeath} />
        </main>
      )}
      {screen === "dead" && (
        <main className="dead-main" data-testid="dead-main">
          <GameOver
            stats={finalStats}
            onSubmit={handleSubmit}
            onRestart={handleRestart}
            onHome={handleHome}
            submitting={submitting}
          />
        </main>
      )}

      {/* Killboard modal */}
      {showKillboard && (
        <div className="kb-modal" data-testid="kb-modal" onClick={handleHideKillboard}>
          <div className="kb-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="kb-close"
              onClick={handleHideKillboard}
              data-testid="kb-close-btn"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <Leaderboard scores={scores} onRefresh={fetchScores} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
