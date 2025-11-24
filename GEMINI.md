# Blitzkrieg TCG

## Project Overview
Blitzkrieg TCG is a World War II-themed trading card game (TCG) being refactored from a single-file prototype (`blitzkrieg.js`) into a modern React application using Vite. It features real-time multiplayer combat, strategic deck building, and a player-driven economy.

## Current Status (Refactoring)
- **Migration In Progress:** The codebase is moving from `blitzkrieg.js` to a structured `src/` directory.
- **Components:** `Card`, `CardArt`, and `Modal` have been extracted to `src/components/`.
- **Views:** Game screens (`RenderHome`, `RenderLobby`, `GameView`, etc.) have been extracted to `src/views/`.
- **Data:** Card definitions are now in `src/data/cards.js`.
- **Firebase:** Configuration moved to `src/firebase.js`.
- **Pending:**
    - `src/main.jsx`: Entry point needs to be created.
    - `src/App.jsx`: Main application logic (state, routing, Firebase listeners) needs to be migrated from `blitzkrieg.js`.
    - `blitzkrieg.js`: To be deprecated once migration is complete.

## Core Features
- **Multiplayer Combat:** Real-time matches with turn-based mechanics (Deployment, Combat, Support).
- **Card System:** Diverse units including Infantry, Tanks, Air support, Commanders, and Tactics.
- **Economy:** Marketplace for buying and selling cards using in-game credits.
- **Progression:** User profiles, win/loss tracking, and collection management.
- **Visuals:** AI-generated card art (via Pollinations.ai) and dynamic visual effects.

## Technical Architecture
- **Frontend:** React (Vite).
- **Backend:** Firebase (Authentication, Firestore).
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React.
- **Assets:** Dynamic image generation via Pollinations.ai.

## Setup Requirements
1.  Node.js and npm/yarn.
2.  A Firebase project with Authentication (Anonymous) and Firestore enabled.
3.  `.env` file with `VITE_FIREBASE_CONFIG`.