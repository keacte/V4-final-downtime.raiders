import React, { useEffect, useState } from "react";
import { sfx } from "../lib/sounds";

const PRE_COUNTDOWN_MS = 1800;
const NO_COUNTDOWN_HOLD_MS = 2600;

/**
 * Reusable centered transition screen.
 * Props:
 *   msg        - the cyan message to display
 *   countdown  - boolean; if true, show 3-2-1 countdown after PRE_COUNTDOWN_MS
 *   onComplete - called when the transition finishes
 */
export default function TransitionScreen({ msg, countdown, onComplete }) {
  const [count, setCount] = useState(null);

  // Schedule the countdown start (or the simple hold-then-complete)
  useEffect(() => {
    if (countdown) {
      const t = setTimeout(() => setCount(3), PRE_COUNTDOWN_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => onComplete(), NO_COUNTDOWN_HOLD_MS);
    return () => clearTimeout(t);
  }, [countdown, onComplete]);

  // Drive countdown ticks
  useEffect(() => {
    if (count === null) return undefined;
    if (count <= 0) {
      sfx.countdownGo();
      onComplete();
      return undefined;
    }
    sfx.countdownTick(count);
    const t = setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <section className="transition-screen" data-testid="transition-screen">
      <p className="transition-msg" data-testid="transition-msg">{msg}</p>
      {countdown && count !== null && count > 0 && (
        <p className="transition-count" key={count} data-testid="transition-count">
          {count}
        </p>
      )}
    </section>
  );
}
