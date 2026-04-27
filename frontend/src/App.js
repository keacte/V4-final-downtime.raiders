import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import Game from "./components/Game";
import StartScreen from "./components/StartScreen";
import GameOver from "./components/GameOver";
import Leaderboard from "./components/Leaderboard";
import { Toaster } from "sonner";
import { Volume2, VolumeX } from "lucide-react";
import { sfx, setMuted, isMuted, unlockAudio, startMusic, stopMusic } from "./lib/sounds";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FRIEND_LOGO = "https://customer-assets.emergentagent.com/job_767f29fe-abe6-4b75-8be0-f45420e11c5a/artifacts/nrmdvdis_friend.png";
const NPSI_LOGO = "https://customer-assets.emergentagent.com/job_767f29fe-abe6-4b75-8be0-f45420e11c5a/artifacts/xpqzlet1_NPSI.ROCKS%20OXANIUM.png";

function App() {
  const [screen, setScreen] = useState("start");
  const [finalStats, setFinalStats] = useState({ score: 0, wave: 1, kills: 0 });
  const [scores, setScores] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

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

  // start/stop music when entering/leaving playing
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

  const appClass = [
    "App",
    screen === "playing" ? "app--playing" : "",
    screen === "start" ? "app--start" : "",
    screen === "dead" ? "app--dead" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={appClass} data-testid="app-root">
      <Toaster position="top-center" theme="dark" />

      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-grid-top" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />
      <div className="bg-haze" aria-hidden="true" />
      <div className="sw-sun" aria-hidden="true" />

      {/* Warp streaks (hyperspace falling lines) */}
      <div className="warp-streaks" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => {
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
        })}
      </div>

      <div className="scan-bar" aria-hidden="true" />
      <div className="crt-flicker" aria-hidden="true" />

      <header className="dr-header" data-testid="dr-header">
        <div className="dr-header-left">
          <a
            href="https://npsi.rocks/"
            target="_blank"
            rel="noopener noreferrer"
            className="dr-logo-link"
            data-testid="dr-logo-link"
          >
            <img src={FRIEND_LOGO} alt="friend" className="dr-friend-logo dr-logo-anim dr-logo-anim--a" data-testid="friend-logo" />
            <img src={NPSI_LOGO} alt="npsi.rocks" className="dr-npsi-header-logo dr-logo-anim dr-logo-anim--b" data-testid="npsi-header-logo" />
          </a>
        </div>
        <div className="dr-header-right">
          <button
            type="button"
            className="dr-mute-btn"
            onClick={toggleMute}
            data-testid="mute-btn"
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="dr-status">
            <span className="dr-status-dot" /> NODE STABLE
          </span>
        </div>
      </header>

      <main className="dr-main">
        {screen === "start" && (
          <StartScreen onStart={handleStart} scores={scores} />
        )}
        {screen === "playing" && (
          <Game onDeath={handleDeath} />
        )}
        {screen === "dead" && (
          <GameOver
            stats={finalStats}
            onSubmit={handleSubmit}
            onRestart={handleRestart}
            onHome={handleHome}
            submitting={submitting}
          />
        )}

        {screen !== "playing" && (
          <section className="dr-leaderboard-section" data-testid="leaderboard-section">
            <Leaderboard scores={scores} onRefresh={fetchScores} />
          </section>
        )}
      </main>

      {screen !== "playing" && (
        <footer className="dr-footer" data-testid="dr-footer">
          <div className="dr-footer-left">
            <span className="dr-footer-label">A FAN PROJECT BY</span>
            <img src={NPSI_LOGO} alt="NPSI.ROCKS" className="dr-npsi-logo" data-testid="npsi-logo" />
          </div>
          <div className="dr-footer-right">
            <span className="dr-footer-tag">FLY IT LIKE YOU STOLE IT &middot; o7</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
