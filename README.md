# 🎖️ Blitzkrieg TCG
### *World at War - Browser-Based Trading Card Game*

![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Tech](https://img.shields.io/badge/Built%20With-React%20%7C%20Vite%20%7C%20Firebase-blue?style=for-the-badge)
![Style](https://img.shields.io/badge/Style-Tailwind%20CSS-38bdf8?style=for-the-badge)

**Blitzkrieg TCG** is a real-time, multiplayer trading card game set in the chaotic theater of World War II. Players command armies of infantry, tanks, and aircraft, manage supply lines, and outmaneuver opponents in tactical turn-based combat.

Everything from the card art to the battlefield effects is rendered dynamically in the browser, powered by a robust **Firebase** backend for real-time state synchronization.

---

### 🎮 [Play the Live Demo](https://blitzkrieg-tcg.web.app)

---

## ✨ Key Features

### ⚔️ Real-Time Multiplayer Combat
Engage in 1v1 battles with live opponents. The game engine handles turn states, mana (supply) progression, and combat resolution instantly via Firestore real-time listeners.

### 📦 Player-Driven Economy
A fully functional **Global Marketplace** allows commanders to:
*   **Sell** unwanted units from their barracks for credits.
*   **Buy** rare and powerful units listed by other players.
*   **Secure Transactions:** Atomic database operations ensure fair trading.

### 🎨 Dynamic Visuals
*   **AI-Generated Art:** Every card features unique artwork generated on-the-fly via Pollinations.ai based on semantic prompts.
*   **Visual FX Engine:** Experience battle with animated particle effects for attacks, healing, buffs, and explosions.

### 🗃️ Strategic Depth
*   **Deck Building:** Manage your collection in the Barracks.
*   **Unit Classes:** Combine Infantry, Tanks, Air Support, and Tactic cards.
*   **Support Units:** Deploy Bunkers, Medics, and Radar Stations to buff your frontline.

---

## 📖 Field Manual (How to Play)

1.  **Deployment:** You start with 1 Supply (Mana). Supplies increase by 1 every turn (Max 10). Drag units from your hand to the board.
2.  **Combat:**
    *   **Summoning Sickness:** Units cannot attack the turn they are deployed.
    *   **Attacking:** Select a friendly unit, then click an enemy unit to engage.
    *   **HQ Strike:** If no enemy unit is selected, you attack the enemy Commander directly.
3.  **Support:** Support units (Green/Yellow icons) cannot attack. Instead, select them and click a friendly unit to apply their buff (Heal, Fortify, etc.).
4.  **Victory:** Reduce the enemy HQ Health to 0.

---

## 🪖 Unit Classes

| Class | Icon | Role | Strengths | Weaknesses |
| :--- | :---: | :--- | :--- | :--- |
| **Infantry** | ♟️ | Frontline | Low Cost, Versatile | Low Defense |
| **Tank** | 🛡️ | Heavy Armor | High Stats, Durable | High Cost |
| **Air** | ✈️ | Strike Craft | High Attack, Evasion | Fragile |
| **Support** | ⛺ | Utility | Buffs, Healing, Intel | Cannot Attack |
| **Tactic** | ⚡ | Instant Effect | AOE Damage, Control | One-time use |
| **Commander** | 🎖️ | Hero Unit | Game-changing stats | Unique (1 per deck) |

---

## 🛠️ Technical Architecture

This project was refactored from a prototype into a modern React architecture.

*   **Frontend:** React 18 + Vite
*   **State Management:** React Hooks + Firestore Real-time Listeners
*   **Backend:** Firebase (Auth, Firestore, Hosting)
*   **Styling:** Tailwind CSS + Lucide React Icons
*   **Security:** strict `firestore.rules` for data integrity.

### Directory Structure
```
src/
├── components/   # Reusable UI (Card, Modal, etc.)
├── data/         # Static definitions (Card stats, rarities)
├── views/        # Main Game Screens (Lobby, GameBoard, Market)
├── firebase.js   # App Configuration
├── App.jsx       # Main Logic Controller
└── main.jsx      # Entry Point
```

---

## 🚀 Local Development

### Prerequisites
*   Node.js (v16+)
*   A Firebase Project (Free Tier)

### Setup
1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/blitzkrieg-tcg.git
    cd blitzkrieg-tcg
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    Create a `.env` file in the root directory:
    ```env
    VITE_FIREBASE_CONFIG={"apiKey": "...", "authDomain": "...", ...}
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

### Deployment

Deploy to Firebase Hosting with a single command:

```bash
npm run build
firebase deploy
```

---

## 🛡️ License

This project is open-source and available under the **MIT License**.

*Command your forces. Conquer the battlefield.*
