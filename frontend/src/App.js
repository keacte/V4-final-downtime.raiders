import { useState, useEffect } from "react";
import "@/App.css";
import Game from "./components/Game";
import StartScreen from "./components/StartScreen";
import GameOver from "./components/GameOver";
import TransitionScreen from "./components/TransitionScreen";
import { Toaster } from "sonner";
import { Volume2, VolumeX } from "lucide-react";
import { sfx, setMuted, isMuted, unlockAudio, startMusic, stopMusic } from "./lib/sounds";

function App() {
  const [screen, setScreen] = useState("start");
  const [finalStats, setFinalStats] = useState({ score: 0, wave: 1, kills: 0 });
  const [muted, setMutedState] = useState(isMuted());

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
    setScreen("launching");
  };

  const handleLaunchComplete = () => {
    setScreen("playing");
  };

  const handleDeath = (stats) => {
    setFinalStats(stats);
    setScreen(stats.victory ? "victory" : "dead");
  };

  const handleVictoryComplete = () => {
    setScreen("dead");
  };

  const handleRestart = () => {
    sfx.click();
    setScreen("playing");
  };

  const handleHome = () => {
    sfx.click();
    setScreen("start");
  };

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

      <div className="starfield" aria-hidden="true" />
      <div className="warp-streaks" aria-hidden="true">{warpStreaks}</div>
      <div className="sw-grid-floor" aria-hidden="true" />
      <div className="scan-bar" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      <div className="crt-flicker" aria-hidden="true" />

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

      {screen === "start" && (
        <StartScreen onStart={handleStart} />
      )}
      {screen === "launching" && (
        <TransitionScreen
          msg="Fly safe Capsuleer — see you on the other side! o7"
          countdown={true}
          onComplete={handleLaunchComplete}
        />
      )}
      {screen === "victory" && (
        <TransitionScreen
          msg="Congratulations, you beat the boss! Fly safe! o7"
          countdown={false}
          onComplete={handleVictoryComplete}
        />
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
            onRestart={handleRestart}
            onHome={handleHome}
          />
        </main>
      )}
    </div>
  );
}

export default App;
