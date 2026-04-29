// Fleet reports shown on the victory Game Over screen.
// Same shape as kill reports so styling stays consistent.
export const FLEET_REPORTS = [
  {
    operation: "Surprisingly Competent",
    stats: [
      ["Pride Gained", "Lots"],
      ["Bragging Rights Gained", "Lots"],
    ],
    tactical: [
      ["Useful Decisions Made", "More than expected"],
      ["Good decisions", "Killed more than you lost"],
      ["Bad decisions", "Still present, just less noticeable"],
    ],
    strategic: [
      ["Plan Quality", "Solid enough"],
      ["Execution Quality", "Held together somehow"],
    ],
    losses: ["None"],
  },
  {
    operation: "Mildly Organised Chaos",
    stats: [
      ["Pride Gained", "Noticeable"],
      ["Bragging Rights Gained", "Claimed immediately"],
    ],
    tactical: [
      ["Useful Decisions Made", "Enough to matter"],
      ["Good decisions", "Primary died quickly"],
      ["Bad decisions", "Quietly ignored"],
    ],
    strategic: [
      ["Plan Quality", "Basic but effective"],
      ["Execution Quality", "Surprisingly smooth"],
    ],
    losses: ["Minimal (we're calling it none)"],
  },
  {
    operation: "It Actually Worked",
    stats: [
      ["Pride Gained", "Rapid increase"],
      ["Bragging Rights Gained", "Excessive"],
    ],
    tactical: [
      ["Useful Decisions Made", "Timely"],
      ["Good decisions", "Stayed on target"],
      ["Bad decisions", "Happened, but irrelevant"],
    ],
    strategic: [
      ["Plan Quality", "Simple"],
      ["Execution Quality", "Clean"],
    ],
    losses: ["None worth mentioning"],
  },
  {
    operation: "Press F1 Responsibly",
    stats: [
      ["Pride Gained", "Healthy levels"],
      ["Bragging Rights Gained", "Already posted in local"],
    ],
    tactical: [
      ["Useful Decisions Made", "Broadcasts followed"],
      ["Good decisions", "Guns applied correctly"],
      ["Bad decisions", "Few, but enthusiastic"],
    ],
    strategic: [
      ["Plan Quality", "Standard doctrine"],
      ["Execution Quality", "On script"],
    ],
    losses: ["Negligible"],
  },
  {
    operation: "Unexpected Victory",
    stats: [
      ["Pride Gained", "Confused but high"],
      ["Bragging Rights Gained", "Growing"],
    ],
    tactical: [
      ["Useful Decisions Made", "More than usual"],
      ["Good decisions", "Didn't panic"],
      ["Bad decisions", "Delayed panic"],
    ],
    strategic: [
      ["Plan Quality", "Questionable"],
      ["Execution Quality", "Carried by momentum"],
    ],
    losses: ["Acceptable (rounded down to zero)"],
  },
  {
    operation: "Clean Sweep-ish",
    stats: [
      ["Pride Gained", "Stable"],
      ["Bragging Rights Gained", "Shared widely"],
    ],
    tactical: [
      ["Useful Decisions Made", "Consistent"],
      ["Good decisions", "Focus fire worked"],
      ["Bad decisions", "Still under investigation"],
    ],
    strategic: [
      ["Plan Quality", "Clear"],
      ["Execution Quality", "Effective"],
    ],
    losses: ["Barely noticeable"],
  },
  {
    operation: "Minimal Screaming Required",
    stats: [
      ["Pride Gained", "Respectable"],
      ["Bragging Rights Gained", "Earned"],
    ],
    tactical: [
      ["Useful Decisions Made", "Calmly executed"],
      ["Good decisions", "More than normal"],
      ["Bad decisions", "Kept to a minimum"],
    ],
    strategic: [
      ["Plan Quality", "Sensible"],
      ["Execution Quality", "Controlled"],
    ],
    losses: ["None (this will be disputed)"],
  },
];
