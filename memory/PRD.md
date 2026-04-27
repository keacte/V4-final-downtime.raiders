# downtime.raiders — PRD

## Original Problem Statement
Space combat sim, for an EVE Online website, old-school vibe, when you die it says
"oh no - got pipebombed! Better luck next time!". Add the supplied logos. Change
colour palette to more purples. Call it "downtime.raiders" and keep the font colour
to white. Add some power-ups.

## User Choices (confirmed)
- Top-down arcade shooter (Asteroids/Galaga vibe)
- All 5 power-ups: Shield, Rapid Fire, Multi-shot, Smart Bomb, Speed
- Both leaderboard (MongoDB) + local play
- Multiple enemy types: Frigate / Cruiser / Capital (EVE-flavored)
- friend.png in header, NPSI.ROCKS in footer

## Architecture
- FastAPI backend (`/api/scores` POST + GET) on :8001
- MongoDB `scores` collection (uuid id, pilot, score, wave, kills, timestamp ISO)
- React frontend (CRA) with canvas-based game loop in Game.jsx
- Sonner toaster mounted, Oxanium + VT323 Google Fonts
- Purple/black palette, white text, CRT scanline overlay on canvas

## Implemented (2026-02)
- Start screen: title, briefing, undock CTA, controls, power-up legend
- Canvas game: player ship, 3 enemy types, bullets, enemy bullets, particles,
  CRT scanlines, screen shake, flash, parallax stars, wave system
- Power-ups: shield (2-hit), rapid (8s), multi-shot (10s), bomb (stockable), speed (8s)
- Smart bomb [X] clears screen
- Pause [P]
- Game-over screen with "OH NO — GOT PIPEBOMBED! Better luck next time, capsuleer."
- Pilot-name submit form -> POST /api/scores
- Killboard top-10 with refresh

## Test Status
- iteration_1.json: backend 100%, frontend 100%, only cosmetic footer fix applied

## Backlog (P1 / P2)
- P1: Sound effects (laser zap, explosion, power-up chime) + retro chiptune
- P1: Touch controls / virtual joystick for mobile
- P2: Boss waves every 5th wave (titan-class)
- P2: Player ship cosmetic skins unlocked by score thresholds
- P2: Daily downtime tournament (24h leaderboard reset)
- P2: Share-to-X "I scored X on downtime.raiders o7"
