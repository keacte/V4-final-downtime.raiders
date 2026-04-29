import React from "react";
import { Rocket, Info, ScrollText } from "lucide-react";

export default function StartScreen({ onStart, onShowGlossary, onShowAcknowledgements }) {
  return (
    <section className="menu-shell warp-in" data-testid="start-screen">
      <div className="menu-center">
        <a
          href="https://npsi.rocks/"
          target="_blank"
          rel="noopener noreferrer"
          className="brand-link"
          data-testid="brand-link"
        >
          <img
            src="https://customer-assets.emergentagent.com/job_767f29fe-abe6-4b75-8be0-f45420e11c5a/artifacts/nrmdvdis_friend.png"
            alt="downtime.raiders"
            className="brand-logo logo-glow"
            data-testid="brand-friend-logo"
          />
          <img
            src="https://customer-assets.emergentagent.com/job_767f29fe-abe6-4b75-8be0-f45420e11c5a/artifacts/xpqzlet1_NPSI.ROCKS%20OXANIUM.png"
            alt="npsi.rocks"
            className="brand-npsi logo-glow"
            data-testid="brand-npsi-logo"
          />
        </a>

        <h1 className="title-eve" data-testid="game-title">
          downtime<span className="dot">.</span>raiders
        </h1>

        <div className="uplink-row">
          <span className="uplink-stable">UPLINK STABLE</span>
        </div>

        <p className="briefing" data-testid="briefing">
          The server&apos;s down for daily maintenance. While CCP reboots, raid New
          Eden in your <span className="hl-pink">Wifter</span> across{' '}
          <span className="hl-cyan">10 distinct waves</span> of frigates,
          cruisers and capitals &mdash; ending in a{' '}
          <span className="hl-magenta">Dreadnought boss fight</span>. Loot{' '}
          <span className="hl-cyan">9 power-ups</span> including{' '}
          <span className="hl-magenta">Extra Life</span>, <span className="hl-pink">Cloak</span>,
          {' '}<span className="hl-magenta">Invulnerability</span> and the rare{' '}
          <span className="hl-cyan">Star</span> drop. Don&apos;t get pipebombed. o7
        </p>

        <div className="menu-actions">
          <button
            type="button"
            className="eve-btn"
            onClick={onStart}
            data-testid="start-btn"
          >
            <Rocket size={16} /> UNDOCK &amp; ENGAGE
          </button>
          <button
            type="button"
            className="eve-btn eve-btn-cyan"
            onClick={onShowGlossary}
            data-testid="glossary-btn"
          >
            <Info size={16} /> POWER-UP INFO
          </button>
          <button
            type="button"
            className="eve-btn eve-btn-pink"
            onClick={onShowAcknowledgements}
            data-testid="acknowledgements-btn"
          >
            <ScrollText size={16} /> ACKNOWLEDGEMENTS
          </button>
        </div>

        <div className="menu-controls" data-testid="menu-controls">
          <span className="kbd">W</span>
          <span className="kbd">A</span>
          <span className="kbd">S</span>
          <span className="kbd">D</span>
          &nbsp; THRUST &nbsp;&middot;&nbsp;
          <span className="kbd">SPACE</span>
          &nbsp; FIRE &nbsp;&middot;&nbsp;
          <span className="kbd">X</span>
          &nbsp; SMART BOMB &nbsp;&middot;&nbsp;
          <span className="kbd">P</span>
          &nbsp; PAUSE
        </div>
      </div>
    </section>
  );
}
