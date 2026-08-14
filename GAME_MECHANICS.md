# 🎮 TYPE//BATTLE — COMPLETE GAME MECHANICS & MANUAL

Welcome to **TYPE//BATTLE**, an ultra-fast arcade typing battle game built with React, Vite, Supabase Realtime, and Tailwind CSS. This document outlines every game mode, power-up, combat debuff, trap, and system architecture mechanic.

---

## 🕹️ 1. Game Modes

### 🏁 Classic 1v1 Race
- **Objective**: Type the designated challenge text as fast and accurately as possible.
- **Win Condition**: The first player to reach 100% progress wins immediately. If the timer expires (default 120s), the player with higher progress/WPM wins.

### ⚔️ 1v1 Deathmatch Arena
- **Objective**: Combat typing! Both players start with **1000 HP**.
- **Mechanic**: Each correct keystroke and word completion deals damage to your opponent.
- **Win Condition**: Deplete your opponent's HP from 1000 to 0 HP. If time expires (default 300s), the player with higher remaining HP wins.

### 🎪 Booth Championship Mode
- **Objective**: Best-of-3 arcade tournament mode designed for physical booth competitions.
- **Win Condition**: Win individual rounds to earn points. The first player to reach **3 Points** wins the championship and unlocks the scannable **VIP Pass Ticket**.

### 🧘 Solo Practice Hazard Mode
- **Objective**: Offline practice featuring environmental hazards and traps.
- **Cursed Word Traps**: ~22% of words spawn as **Cursed Words** (pulsating purple glow).
- **Detonation Hazard**: Reaching a Cursed Word triggers a **4.0s Countdown Banner**. Typing cleanly within 4.0s cleanses the curse; failing detonates a random 3.0s debuff!

---

## ⚡ 2. Combo System & Visual Trails

- **Streak Counter**: Consecutive correct keystrokes build your active Combo count. Any typing error immediately resets your Combo to 0.
- **Visual Fire Trails**:
  - `10+ Combo`: Green Neon Glow 🔥
  - `20+ Combo`: Yellow Energy Trail 🔥🔥
  - `30+ Combo`: Amber Flame Aura 🔥🔥🔥
  - `50+ Combo`: Multi-layer Fiery Banner + Pulsing Aura 🔥🔥🔥🔥
- **2x Combo Multiplier**: Typing **Critical Words** (glowing amber text) activates a **5-second 2x Combo Boost**!

---

## 🛡️ 3. Power-Ups & Defense

### 🛡️ Shield Power-Up
- **Unlock**: Automatically granted upon reaching a **30-Combo streak**.
- **Activation**: Press `[ ENTER ]` on your keyboard (plays `shield.mp3` audio voice queue).
- **Effect**: Deploys an energy barrier that blocks and nullifies the next incoming debuff attack sent by your opponent.

---

## 💣 4. Attack Debuffs

Players can trigger debuffs against opponents via power-ups or cursed word traps:

| Debuff | Icon | Visual Effect | Duration | Description |
| :--- | :---: | :--- | :---: | :--- |
| **FREEZE** | ❄ | Sub-Zero Ice Overlay | 2.5s | Freezes opponent's virtual keyboard and blocks keypresses. |
| **GLITCH** | ⚠ | Neon Cyber Scanlines | 3.0s | Scrambles key label mappings on opponent's virtual keyboard. |
| **STEAL** | ⚡ | Cyber-Siphon Laser | Instant | Steals 15 characters of progress/HP from opponent and adds to yours. |
| **BLIND** | 👁 | Full Screen Whiteout | 3.0s | Blinds opponent's screen with full whiteout overlay and eye icon. |

---

## 🎟️ 5. VIP Pass & QR Code Ticket System

- **Championship Rewards**: Winning a Booth Competition match generates a scannable **VIP Pass Ticket Card**.
- **Scannable QR Code**: High-contrast 500x500 PNG with ISO 18004 4-module quiet zone margin and Level M error correction for instant smartphone camera scanning.
- **Public Mobile Route (`/ticket`)**: Mobile-friendly ticket viewer with single-click PNG image export (`downloadTicket.png`).
- **Booth Network Config**: Built-in LAN IP configurator (`⚙ BOOTH NETWORK QR CONFIG`) allowing booth operators to bind their local WiFi IP (e.g. `192.168.1.15:5173`).

---

## 👁️ 6. Spectator Mode (`/spectate/:code`)

- **Real-Time Stream**: Spectators can join any live match by navigating to `/spectate/:code`.
- **Dual Player Panels**: Displays live WPM, Accuracy, Progress, and HP bars for both players.
- **Victory Announcement**: Real-time broadcast listener highlights the winning player with a gold `👑 WINNER` badge and displays final WPM and Accuracy metrics.

---

## ⚙️ 7. Keyboard & Audio Controls

- **CapsLock Protection**: Pauses typing and displays an arcade warning overlay if CapsLock is engaged.
- **Audio Soundboard**: Dynamic sound effects for keypress clicks (`click.mp3`), combo streaks (`combo.mp3`), power-ups (`powerup.mp3`), debuffs (`debuff.mp3`), victory voice (`win.mp3`), and shield deployment (`shield.mp3`).
