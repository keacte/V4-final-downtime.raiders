import React from "react";
import { ArrowLeft, ScrollText } from "lucide-react";

export default function Acknowledgements({ onBack }) {
  return (
    <section
      className="menu-shell warp-in glossary-shell"
      data-testid="acknowledgements-screen"
    >
      <div className="menu-center glossary-center">
        <h1 className="glossary-title" data-testid="acknowledgements-title">
          acknowledgements
        </h1>
        <p className="glossary-sub">
          <ScrollText size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
          A note of thanks to the universe that made this possible.
        </p>

        <article className="ack-body" data-testid="ack-body">
          <p>
            This is a fan-made mini-game inspired by the universe of{" "}
            <span className="hl-cyan">EVE Online</span>. It was created for
            fun, and to celebrate the unique player-driven sandbox that makes
            New Eden so compelling — while also helping to fill the void of
            those all-too-familiar server downtime blues.
          </p>
          <p>
            Special thanks to <span className="hl-pink">CCP Games</span> for
            developing and maintaining EVE Online, and for building a universe
            rich enough to inspire countless stories, battles, and side
            projects like this one.
          </p>
          <p>
            Gratitude to the <span className="hl-magenta">EVE community</span>{" "}
            — fleet commanders, industrialists, explorers, and line members
            alike — whose in-game antics, memes, and shared experiences helped
            shape the tone and humour of this mini-game.
          </p>
          <p>
            Any similarities to actual players, corporations, alliances, or
            in-game events are purely coincidental or used in a light-hearted,
            parody context.
          </p>
          <p className="ack-disclaimer">
            This project is not affiliated with or endorsed by CCP Games.
          </p>
          <p className="ack-signoff">Fly safe, and stay awesome! o7</p>
        </article>

        <div className="menu-actions">
          <button
            type="button"
            className="eve-btn"
            onClick={onBack}
            data-testid="ack-back-btn"
          >
            <ArrowLeft size={16} /> BACK TO STATION
          </button>
        </div>
      </div>
    </section>
  );
}
