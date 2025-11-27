# Blitzkrieg TCG

## Project Overview
Blitzkrieg TCG is a World War II-themed trading card game (TCG) developed as a modern React application using Vite. It features real-time multiplayer combat, strategic deck building, and a player-driven economy.

## Project Status: Complete
The project has been successfully refactored from a single-file prototype (`blitzkrieg.js`) into a fully structured React application.

**Live Deployment:** [https://blitzkrieg-tcg.web.app](https://blitzkrieg-tcg.web.app)

### Architecture
- **Source Code:** All application logic resides in `src/`.
    - **Entry:** `src/main.jsx` & `src/App.jsx`.
    - **Components:** Reusable UI elements in `src/components/`.
    - **Views:** Game screens (`GameView`, `RenderLobby`, etc.) in `src/views/`.
    - **Data:** Card definitions in `src/data/cards.js`.
    - **Config:** Firebase setup in `src/firebase.js`.
- **Legacy:** `blitzkrieg.js` is deprecated and preserved only for reference.

### Key Features Implemented
- **Multiplayer Logic:** Robust matchmaking with atomic join operations and lazy hand generation.
- **AI Opponent:** Integrated Gemini AI for solo play, featuring context-aware decision making (buffs, hand count, unit descriptions).
- **Refactored Core Logic:** Unified game logic handlers (`handleAttack`, `handlePlayCard`, etc.) used by both Human and AI players to ensure consistent rule enforcement.
- **Economy:** Fully functional Marketplace allowing users to list and buy cards with secure transactions.
- **Visuals:** Dynamic visual effects engine for attacks, buffs, and card splashes.
- **Security:** Comprehensive `firestore.rules` preventing unauthorized data access and logic exploitation.

## Core Features
- **Multiplayer Combat:** Real-time matches with turn-based mechanics (Deployment, Combat, Support).
- **Solo vs AI:** Challenge a generative AI opponent that adapts to the board state.
- **Card System:** Diverse units including Infantry, Tanks, Air support, Commanders, and Tactics.
- **Economy:** Marketplace for buying and selling cards using in-game credits.
- **Progression:** User profiles, win/loss tracking, and collection management.
- **Visuals:** AI-generated card art (via Pollinations.ai) and dynamic visual effects.

## Technical Architecture
- **Frontend:** React (Vite).
- **Backend:** Firebase (Authentication, Firestore, Hosting).
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React.
- **Assets:** Dynamic image generation via Pollinations.ai.

## Setup Requirements
To run this project locally:
1.  Node.js and npm/yarn.
2.  A Firebase project with Authentication (Anonymous) and Firestore enabled.
3.  `.env` file with `VITE_FIREBASE_CONFIG`.
4.  Run `npm install` and `npm run dev`.

## Deployment
This project is configured for Firebase Hosting.

1.  **Install Firebase Tools:**
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login to Firebase:**
    ```bash
    firebase login
    ```
3.  **Build the Project:**
    ```bash
    npm run build
    ```
4.  **Deploy:**
    ```bash
    firebase deploy
    ```

**Note:** If you only need to update the database security rules without redeploying the site, you can run:
```bash
firebase deploy --only firestore:rules
```

## Development Workflow
- **Commit Policy:** Only commit changes when requested by user.
- **Deployment:** Always build and deploy when done making code changes.
- **Verification:** Use Playwright to verify impact of changes.