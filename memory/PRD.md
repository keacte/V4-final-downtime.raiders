# downtime.raiders — Product Requirements

## Original Problem Statement
Build a space combat sim for an EVE Online community website with an old-school arcade vibe.
- Game Over message: "oh no - got pipebombed! Better luck next time!"
- Specific branding: `friend.png`, `NPSI.ROCKS` logos
- Color palette: purples / synthwave
- Title: **downtime.raiders**
- Font color: white
- Power-ups required

## Tech Stack
- **Frontend**: React, HTML5 Canvas, Web Audio API, html2canvas, CSS keyframe animations (CRT, warp streaks, perspective grid)
- **Backend**: FastAPI (minimal — `/api/` health check only)
- **DB**: MongoDB present but unused (Leaderboard removed per user request)

## Architecture
```
/app/
├── backend/server.py            # Health check only
└── frontend/src/
    ├── App.js / App.css          # Layout, CRT/synth styling, share-card styles
    ├── components/
    │   ├── Game.jsx              # Canvas game loop, waves, boss, power-ups
    │   ├── StartScreen.jsx       # Briefing & UNDOCK
    │   ├── GameOver.jsx          # Pipebomb death screen + shareable card
    │   ├── KillReport.jsx        # EVE-style 3-column kill report + skull/target SVG
    │   └── TransitionScreen.jsx  # 3-2-1 countdown
    └── lib/
        ├── sounds.js             # Web Audio API SFX + bass loop
        ├── killReports.js        # 12 joke kill report templates
        └── shareCard.js          # html2canvas capture + Web Share API / download fallback
```

## Implemented (Feb 2026)
- ✅ Top-down 2D space shooter (React Canvas, requestAnimationFrame)
- ✅ Responsive viewport fit, desktop & mobile
- ✅ Synthwave purple palette + CRT scanlines + warp streaks + perspective grid
- ✅ Audiowide (headers, white core + magenta/purple glow) + Share Tech Mono (body)
- ✅ Branding: `friend.png`, `NPSI.ROCKS` logos
- ✅ 10 named enemy waves + Wave 11 Dreadnought boss
- ✅ 6 power-ups (incl. Extra Life heart)
- ✅ Retro Web Audio API SFX + descending bass loop
- ✅ Transition screens with 3-2-1 countdown
- ✅ EVE-style randomized Kill Report (12 templates, 3-column flex)
- ✅ Target + skull SVG icon in top-right of Kill Report
- ✅ "oh no - got pipebombed!" death message
- ✅ **Shareable death card** — SHARE KILL button generates branded PNG (html2canvas), uses Web Share API with file on supported platforms, falls back to download. Branded footer shown only during capture via `.is-capturing` class.

## Removed (intentional, do not re-add)
- ❌ Leaderboard / Killboard UI + backend API + Mongo schema
- ❌ Glitch/VHS slip CSS animations on transition screens

## Backlog / Ideas (none requested)
- Refactor `Game.jsx` (1100+ lines) into entity classes/hooks if extending
- Optional: persistence of high scores (would require Mongo re-integration)

## Critical Style Rules
- Headers: Audiowide, white core, layered magenta/purple text-shadow
- Body: Share Tech Mono
- Background: purple/dark with CRT/warp streaks
- Web Audio context unlocks on user gesture (UNDOCK click)

## Test Credentials
N/A — no auth in this app.

## Status
Stable. All explicit user requests fulfilled including the shareable death card.
