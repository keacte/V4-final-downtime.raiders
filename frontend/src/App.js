import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import Game from "./components/Game";
import StartScreen from "./components/StartScreen";
import GameOver from "./components/GameOver";
import Leaderboard from "./components/Leaderboard";
import { Toaster } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FRIEND_LOGO = "https://customer-assets.emergentagent.com/job_767f29fe-abe6-4b75-8be0-f45420e11c5a/artifacts/nrmdvdis_friend.png";
const NPSI_LOGO = "https://customer-assets.emergentagent.com/job_767f29fe-abe6-4b75-8be0-f45420e11c5a/artifacts/xpqzlet1_NPSI.ROCKS%20OXANIUM.png";

// SCREENS: "start" | "playing" | "dead"
function App() {
  const [screen, setScreen] = useState("start");
  const [finalStats, setFinalStats] = useState({ score: 0, wave: 1, kills: 0 });
  const [scores, setScores] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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

  const handleStart = () => {
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
    setScreen("playing");
  };

  const handleHome = () => {
    setScreen("start");
    fetchScores();
  };

  return (
    <div className={`App ${screen === "playing" ? "app--playing" : ""} ${screen === "start" ? "app--start" : ""} ${screen === "dead" ? "app--dead" : ""}`} data-testid="app-root">
      <Toaster position="top-center" theme="dark" />

      {/* Background grain + grid */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />

      <header className="dr-header" data-testid="dr-header">
        <div className="dr-header-left">
          <img src={FRIEND_LOGO} alt="friend" className="dr-friend-logo" data-testid="friend-logo" />
          <div className="dr-title-block">
            <h1 className="dr-title" data-testid="dr-title">downtime<span className="dr-dot">.</span>raiders</h1>
            <p className="dr-subtitle">// NPSI FLEET COMBAT SIM &middot; v1.0</p>
          </div>
        </div>
        <div className="dr-header-right">
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
