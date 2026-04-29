import React from "react";
import { ArrowLeft, Heart, Star } from "lucide-react";

const POWERUPS = [
  {
    type: "shield",
    icon: "S",
    color: "#22d3ee",
    name: "Shield",
    duration: "Instant",
    effect: "Absorbs the next 2 hits before damaging your hull.",
    flavor: "// Capacitor over-charge // logi on standby",
  },
  {
    type: "rapid",
    icon: "R",
    color: "#ef4444",
    name: "Rapid Fire",
    duration: "15s",
    effect: "Cycles your guns ~2.4× faster — DPS ramps hard.",
    flavor: "// Webbed and primary'd",
  },
  {
    type: "multi",
    icon: "M",
    color: "#a855f7",
    name: "Multi-shot",
    duration: "15s",
    effect: "Fires a 5-bullet spread instead of a single shot.",
    flavor: "// Drone bay deployed",
  },
  {
    type: "bomb",
    icon: "B",
    color: "#ffffff",
    name: "Smart Bomb",
    duration: "Stockable (max 9)",
    effect: "Press X to vaporise every enemy + bullet on screen and damage the boss.",
    flavor: "// Pipebomb — but for them",
  },
  {
    type: "speed",
    icon: "V",
    color: "#34d399",
    name: "Speed Boost",
    duration: "15s",
    effect: "Increases ship acceleration by ~42%. Easier dodging, faster repositions.",
    flavor: "// MWD cycle engaged",
  },
  {
    type: "life",
    icon: "♥",
    color: "#c084fc",
    name: "Extra Life",
    duration: "Instant",
    effect: "Adds +1 life. Rare drop (~7%).",
    flavor: "// Jump clone activated",
    isHeart: true,
  },
  {
    type: "cloak",
    icon: "C",
    color: "#a5f3fc",
    name: "Cloak",
    duration: "1 wave",
    effect: "Total invisibility — enemies can't hit you for the rest of this wave. Disabled on the boss wave.",
    flavor: "// Covert ops engaged",
  },
  {
    type: "invuln",
    icon: "I",
    color: "#f97316",
    name: "Invulnerability",
    duration: "2 waves",
    effect: "Zero damage taken from anything for the next 2 waves. Unstoppable.",
    flavor: "// Ship hardened — Concord on standby",
  },
  {
    type: "star",
    icon: "★",
    color: "#fde047",
    name: "Star",
    duration: "3 waves",
    effect: "ULTIMATE: invulnerability + speed + rapid-fire + 7-bullet spread + immediate +3 lives. Lasts 3 waves.",
    flavor: "// Officer-fit Rifter // pure dakka",
    isStar: true,
  },
];

export default function Glossary({ onBack }) {
  return (
    <section className="menu-shell warp-in glossary-shell" data-testid="glossary-screen">
      <div className="menu-center glossary-center">
        <h1 className="glossary-title" data-testid="glossary-title">
          power<span className="dot">.</span>ups
        </h1>
        <p className="glossary-sub">
          Loot drops from cleared waves. Pick them up to gain an edge against the swarm.
        </p>

        <ul className="glossary-grid" data-testid="glossary-grid">
          {POWERUPS.map((p) => (
            <li
              key={p.type}
              className="glossary-card"
              data-testid={`glossary-card-${p.type}`}
            >
              <div
                className="glossary-icon"
                style={{
                  borderColor: p.color,
                  color: p.color,
                  boxShadow: `0 0 14px ${p.color}55, inset 0 0 12px ${p.color}22`,
                }}
                aria-hidden="true"
              >
                {p.isHeart ? (
                  <Heart size={22} strokeWidth={2.4} fill={p.color} />
                ) : p.isStar ? (
                  <Star size={22} strokeWidth={2.4} fill={p.color} />
                ) : (
                  <span className="glossary-icon-letter">{p.icon}</span>
                )}
              </div>
              <div className="glossary-body">
                <div className="glossary-row-top">
                  <span
                    className="glossary-name"
                    style={{ color: p.color, textShadow: `0 0 8px ${p.color}88` }}
                  >
                    {p.name}
                  </span>
                  <span className="glossary-duration">{p.duration}</span>
                </div>
                <p className="glossary-effect">{p.effect}</p>
                <p className="glossary-flavor">{p.flavor}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="menu-actions">
          <button
            type="button"
            className="eve-btn"
            onClick={onBack}
            data-testid="glossary-back-btn"
          >
            <ArrowLeft size={16} /> BACK TO STATION
          </button>
        </div>
      </div>
    </section>
  );
}
