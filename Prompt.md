# TYPE//BATTLE — Frontend UI Development Prompt

## Project Context

Build the frontend UI for **TYPE//BATTLE**, a retro-futuristic 1v1 typing arcade game for an IT/CS department booth.

The game concept is simple:

> Two players receive the exact same typing challenge and compete to type it faster while maintaining accuracy and building combos.

The application should feel like a **real arcade game**, not like a normal typing-test website.

The visual direction is:

**Retro Arcade × Cyber/Futuristic × Modern Game UI**

Use a dark interface with neon arcade elements, glowing borders, pixel-inspired typography, CRT/scanline effects, arcade panels, animated progress bars, and game-like transitions.

---

# 1. Technology Stack

Use the following stack:

### Core

* React
* Vite
* JavaScript or TypeScript
* Tailwind CSS

### Animation

* GSAP
* GSAP Timeline
* GSAP ScrollTrigger only where appropriate

GSAP should be the primary animation library.

Do not unnecessarily introduce multiple animation libraries.

### State Management

Use Zustand for global game state.

The state should eventually support:

* Current player
* Opponent
* Match ID
* Match code
* Match status
* Typing text
* Progress
* WPM
* Accuracy
* Combo
* Max combo
* Winner
* Countdown

For now, use mock/local state.

### Icons

Use Lucide React for temporary interface icons.

### Backend Preparation

Prepare the architecture for:

* Supabase
* Supabase Realtime
* PostgreSQL

Do not implement the full backend yet.

The frontend should be structured so Supabase Realtime can be connected later without rebuilding the UI.

### Audio Preparation

Prepare a simple audio service abstraction for future arcade sounds.

Use Howler.js later if needed.

For now, create placeholder functions such as:

```js
playSound("countdown");
playSound("combo");
playSound("error");
playSound("victory");
```

They can be disabled or mocked during the UI phase.

---

# 2. Important Asset Rule

At this stage, **actual image assets are not available yet**.

DO NOT block development because of missing assets.

Use placeholders instead.

Examples:

* CSS gradients
* CSS shapes
* Tailwind borders
* temporary SVG placeholders
* Lucide icons
* simple generated shapes
* placeholder avatar circles
* placeholder arcade panels

Create the UI in a way that assets can easily be replaced later.

For example:

```text
/assets
  /images
  /icons
  /sounds
  /backgrounds
```

Leave appropriate placeholder references.

Do not permanently embed random external images.

---

# 3. Design System

## Background

Use a very dark arcade environment.

Suggested base:

```text
#05050A
```

or similar dark colors.

The background should have:

* subtle radial gradients
* neon glow
* subtle grid
* optional CRT scanlines
* subtle noise
* floating particles

Do not make the background too bright.

The UI must remain readable.

---

# 4. Neon Color System

Use a limited arcade palette.

Primary:

```text
Neon Cyan
```

Secondary:

```text
Neon Purple
```

Accent:

```text
Neon Pink
```

Success:

```text
Neon Green
```

Warning:

```text
Neon Yellow
```

Danger:

```text
Neon Red
```

Do not use every color everywhere.

Each color should have a purpose.

For example:

```text
Cyan   = Player 1 / primary UI
Pink   = Player 2
Green  = correct / success
Red    = error / combo break
Yellow = achievements / high score
Purple = special arcade effects
```

---

# 5. Typography

The typography should feel like a modern arcade game.

Use a pixel/arcade-inspired font if available through a package or Google Fonts.

Recommended style:

* large bold display text
* uppercase labels
* wide letter spacing
* compact stat labels
* monospaced typing text

Typing text should use a monospace font.

Do not make every piece of text pixelated.

Use arcade typography primarily for:

* titles
* buttons
* scores
* game status
* combo messages

---

# 6. Application Structure

Create the following UI structure:

```text
App
│
├── MainMenu
│
├── CreateMatch
│
├── JoinMatch
│
├── MatchLobby
│
├── Countdown
│
├── TypingBattle
│   ├── BattleHeader
│   ├── PlayerPanel
│   ├── OpponentPanel
│   ├── ProgressBar
│   ├── TypingText
│   ├── PlayerInput
│   ├── StatsPanel
│   ├── ComboDisplay
│   ├── VirtualKeyboard
│   └── OpponentActivity
│
├── MatchResult
│
└── Leaderboard
```

Keep each component modular.

Do not create one giant React component.

---

# 7. Main Menu

Create an arcade-style landing screen.

Center:

```text
TYPE//BATTLE
```

Subtitle:

```text
1V1 TYPING ARENA
```

Description:

```text
TYPE FAST.
STAY ACCURATE.
BUILD YOUR COMBO.
```

Buttons:

```text
CREATE MATCH
JOIN MATCH
LEADERBOARD
```

Optional:

```text
HOW TO PLAY
```

The title should have a subtle neon glow.

Buttons should feel like physical arcade buttons.

---

# 8. Main Menu Animation

On page load:

1. Background fades in.
2. Logo slides/fades in.
3. Subtitle appears.
4. Buttons animate in sequentially.

Use GSAP.

Example timing:

```text
Logo        0.0s
Subtitle    0.2s
Button 1    0.4s
Button 2    0.5s
Button 3    0.6s
```

Add subtle idle animations.

Do not over-animate the interface.

---

# 9. Create Match UI

Screen title:

```text
CREATE MATCH
```

Display:

```text
MATCH CODE

8F2K91
```

Use a large arcade-style code display.

Below:

```text
[ QR PLACEHOLDER ]
```

Then:

```text
WAITING FOR PLAYER...
```

Use an animated indicator.

Example:

```text
● ● ●
```

Animate the dots with GSAP.

---

# 10. Join Match UI

Display:

```text
JOIN MATCH
```

Input:

```text
ENTER MATCH CODE
```

Example:

```text
[ 8 F 2 K 9 1 ]
```

Button:

```text
JOIN MATCH
```

The input should feel like an arcade terminal.

---

# 11. Match Lobby

Display both players.

Example:

```text
PLAYER 1

[ AVATAR ]

HANZ

READY
```

VS

```text
PLAYER 2

[ AVATAR ]

RIVAL

READY
```

Use a large animated:

```text
VS
```

between them.

When both players are ready, transition into the countdown.

---

# 12. Countdown Screen

Display a large:

```text
3
```

Then:

```text
2
```

Then:

```text
1
```

Then:

```text
TYPE!
```

Use GSAP scale + opacity animations.

Each number should:

* scale up
* briefly glow
* disappear

The `TYPE!` animation should be stronger.

Use a placeholder sound hook.

---

# 13. Main Typing Battle UI

This is the most important screen.

Use a **landscape desktop-first layout**.

Structure:

```text
┌─────────────────────────────────────────────┐
│ TYPE//BATTLE                 MATCH #8F2K91   │
├─────────────────────────────────────────────┤
│                                             │
│ PLAYER 1                    PLAYER 2        │
│ HANZ                         RIVAL           │
│                                             │
│ █████████████░░░             █████████░░░   │
│ 72%                          51%             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ TYPE THE FOLLOWING                          │
│                                             │
│ The quick brown fox jumps over the lazy...  │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ The quick brown fox...                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│ WPM    ACCURACY    CHARACTERS    COMBO      │
│ 78     98.4%       142/200       ×27        │
├─────────────────────────────────────────────┤
│                                             │
│           VIRTUAL KEYBOARD                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 14. Typing Text Component

The challenge text should be rendered character-by-character.

Each character should have states:

```text
pending
correct
incorrect
current
```

Example:

```text
The quick brown fox
^^^
```

Correct characters:

* muted neon green

Current character:

* glowing highlight
* subtle pulse

Incorrect character:

* red
* slight shake

Pending characters:

* muted gray

Do not use a normal `<input>` as the visible typing area.

Use a hidden input or keyboard event handler while rendering the text separately.

---

# 15. Player Progress

Create a large arcade progress bar.

Example:

```text
PLAYER 1

████████████████░░░░
             78%
```

Use GSAP for smooth progress animation.

Do not instantly jump between values.

Animate the progress smoothly.

---

# 16. Opponent Progress

Show the opponent's progress separately.

Example:

```text
RIVAL

████████████░░░░░░░░
61%
```

Opponent progress will initially use mock data.

Later it will be connected to Supabase Realtime.

---

# 17. Stats Panel

Display:

```text
WPM
78
```

```text
ACCURACY
98.4%
```

```text
CHARACTERS
142 / 200
```

```text
COMBO
×27
```

Stats should update smoothly.

Use small number animations where appropriate.

---

# 18. Combo System UI

The combo is an important part of the visual identity.

Display:

```text
COMBO

×27
```

When combo increases:

```text
×27
↓
×28
```

Use a quick GSAP scale animation.

At milestones:

```text
×10
NICE COMBO!
```

```text
×20
GOOD!
```

```text
×30
GREAT COMBO!
```

```text
×50
UNSTOPPABLE!
```

```text
×75
LEGENDARY!
```

```text
×100
100 HIT COMBO!
```

Use different levels of animation intensity.

---

# 19. Combo Break Animation

When the user makes an incorrect character:

Display:

```text
COMBO BREAK!
```

Then reset:

```text
×0
```

Animation:

1. Screen shakes slightly.
2. Combo counter flashes red.
3. Combo text scales down.
4. `COMBO BREAK!` appears.
5. Counter returns to normal.

Keep the animation short.

Approximately:

```text
400–700ms
```

---

# 20. Virtual Keyboard

Create a visual keyboard.

Example:

```text
Q W E R T Y U I O P
 A S D F G H J K L
  Z X C V B N M
       SPACE
```

Each key should be a reusable component.

States:

```text
normal
pressed
correct
incorrect
```

When a physical key is pressed, animate the corresponding virtual key.

Use GSAP for:

* scale
* glow
* press effect

Do not make the keyboard too large.

The typing challenge must remain the main focus.

---

# 21. Opponent Activity Panel

Create a small arcade panel:

```text
OPPONENT ACTIVITY

● TYPING...

PROGRESS
61%

WPM
72

COMBO
×18
```

The values are mock data for now.

Later these will come from Supabase Realtime.

---

# 22. Victory Screen

When the match ends:

Dim the entire screen.

Then show:

```text
VICTORY!

PLAYER 1 WINS
```

Display:

```text
94 WPM
98.7% ACCURACY
MAX COMBO ×42
```

Add placeholder particle/confetti effects.

Use GSAP.

Animation sequence:

1. Screen darkens.
2. Victory title scales in.
3. Winner stats appear.
4. Confetti/particles appear.
5. Buttons appear.

Buttons:

```text
PLAY AGAIN
NEW MATCH
LEADERBOARD
```

---

# 23. Defeat Screen

Display:

```text
MATCH COMPLETE

DEFEATED
```

Then:

```text
88 WPM
96.4% ACCURACY
MAX COMBO ×31
```

Message:

```text
KEEP TRAINING!
```

Do not make the defeat screen feel negative or embarrassing.

Keep the arcade style playful.

---

# 24. Leaderboard UI

Create an arcade leaderboard.

```text
🏆 TOP PLAYERS

#1   CYBERFOX       112 WPM
#2   H4NZ           108 WPM
#3   CODEWIZ        104 WPM
#4   PIXEL           98 WPM
#5   NEO             95 WPM
```

Use animated rank entries.

Top 3 should have visually distinct treatment.

The leaderboard should eventually be connected to Supabase.

For now, use mock data.

---

# 25. Placeholder Assets

Until actual assets are provided, create placeholders for:

```text
Logo
Arcade background
Player avatar
Opponent avatar
QR code
Victory particles
Combo effects
Badges
Arcade icons
Leaderboard decorations
```

Use CSS/SVG placeholders.

Create reusable components such as:

```text
<PlaceholderAvatar />
<PlaceholderQRCode />
<PlaceholderBadge />
<PlaceholderBackground />
```

These should be easy to replace later.

---

# 26. Responsive Behavior

Primary target:

**Desktop / Booth Monitor**

The main game should be optimized for:

```text
16:9
1920 × 1080
```

Also support:

```text
1366 × 768
```

Do not prioritize mobile initially.

However, avoid hardcoding pixel positions everywhere.

Use:

* CSS Grid
* Flexbox
* Tailwind responsive utilities
* max-width containers

---

# 27. Animation Rules

GSAP should be used for meaningful animations.

Use animation for:

* Page transitions
* Menu entrance
* Button hover
* Countdown
* Progress bars
* Combo changes
* Combo break
* Keyboard presses
* Victory
* Defeat
* Leaderboard entrance
* Modal entrance

Avoid animating everything.

The interface should remain fast and readable.

---

# 28. Component Architecture

Use reusable components.

Example:

```text
src/
├── components/
│   ├── arcade/
│   │   ├── ArcadeButton.jsx
│   │   ├── ArcadePanel.jsx
│   │   ├── ArcadeText.jsx
│   │   └── NeonBorder.jsx
│   │
│   ├── battle/
│   │   ├── BattleHeader.jsx
│   │   ├── PlayerPanel.jsx
│   │   ├── OpponentPanel.jsx
│   │   ├── TypingText.jsx
│   │   ├── TypingInput.jsx
│   │   ├── StatsPanel.jsx
│   │   ├── ComboDisplay.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── VirtualKeyboard.jsx
│   │   └── OpponentActivity.jsx
│   │
│   ├── lobby/
│   │   ├── CreateMatch.jsx
│   │   ├── JoinMatch.jsx
│   │   └── MatchLobby.jsx
│   │
│   └── effects/
│       ├── Countdown.jsx
│       ├── ComboEffect.jsx
│       ├── VictoryEffect.jsx
│       └── Confetti.jsx
│
├── pages/
│   ├── MainMenu.jsx
│   ├── CreateMatchPage.jsx
│   ├── JoinMatchPage.jsx
│   ├── BattlePage.jsx
│   └── LeaderboardPage.jsx
│
├── store/
│   └── gameStore.js
│
├── hooks/
│   ├── useTypingGame.js
│   ├── useCombo.js
│   └── useKeyboard.js
│
├── services/
│   ├── realtime.js
│   ├── audio.js
│   └── mockMatch.js
│
└── assets/
    ├── images/
    ├── icons/
    ├── sounds/
    └── backgrounds/
```

---

# 29. Game Logic Separation

Do not put all game logic inside UI components.

Create hooks/services for:

### Typing

```text
useTypingGame()
```

Responsible for:

* current character
* typed characters
* progress
* accuracy
* completion

### Combo

```text
useCombo()
```

Responsible for:

* current combo
* max combo
* combo milestones
* combo break

### Keyboard

```text
useKeyboard()
```

Responsible for:

* keyboard events
* pressed keys
* virtual keyboard state

---

# 30. Mock Multiplayer

Before connecting Supabase, create a mock opponent.

Example:

```text
Player:
progress: actual
wpm: actual
accuracy: actual
combo: actual

Opponent:
progress: simulated
wpm: simulated
accuracy: simulated
combo: simulated
```

The opponent should appear to type in real time.

This allows the entire UI to be completed before backend integration.

---

# 31. Supabase Preparation

Create a service abstraction such as:

```text
realtime.js
```

The UI should eventually call something conceptually similar to:

```js
subscribeToMatch(matchId)
```

and:

```js
updatePlayerProgress(matchId, playerState)
```

Do not tightly couple the components directly to Supabase.

The architecture should allow:

```text
Mock Realtime
      ↓
Supabase Realtime
```

without changing the battle UI.

---

# 32. Performance Requirements

The typing experience must feel instant.

Important:

* Local typing should never wait for Supabase.
* Local combo updates should be immediate.
* Local WPM updates should be immediate.
* Local progress should be immediate.
* Realtime synchronization should happen separately.
* Avoid unnecessary React re-renders.
* Throttle realtime updates.
* Keep GSAP animations lightweight.

The player's typing input must always have priority over visual effects.

---

# 33. Development Order

Implement the project in this order:

### Phase 1 — Design System

1. Global background
2. Typography
3. Colors
4. Arcade panels
5. Arcade buttons
6. Neon effects

### Phase 2 — Main Screens

1. Main menu
2. Create match
3. Join match
4. Lobby
5. Countdown

### Phase 3 — Battle

1. Typing text
2. Keyboard input
3. Progress
4. WPM
5. Accuracy
6. Characters
7. Combo
8. Virtual keyboard
9. Opponent panel

### Phase 4 — Animation

1. Page transitions
2. Countdown
3. Keyboard animation
4. Combo animation
5. Combo break
6. Progress animation
7. Victory
8. Defeat

### Phase 5 — Mock Multiplayer

Simulate an opponent.

### Phase 6 — Supabase

Replace mock realtime with Supabase Realtime.

### Phase 7 — Leaderboard

Connect scores to PostgreSQL.

---

# 34. Important UI Principle

Do not make this look like a dashboard.

It should look like a **game**.

Avoid:

* generic SaaS cards
* excessive white backgrounds
* boring tables
* standard Bootstrap buttons
* overly clean corporate UI
* excessive rounded cards

Instead use:

* arcade panels
* neon borders
* strong typography
* dark space
* glowing elements
* game-like feedback
* animated scores
* dramatic transitions

The player should feel like they just walked up to an arcade machine.

---

# 35. Final Design Goal

The final UI should communicate this immediately:

```text
TYPE//BATTLE

1V1 TYPING ARENA

TYPE FAST.
STAY ACCURATE.
BUILD YOUR COMBO.

        VS

    YOUR RIVAL
```

The most important screen is the **Typing Battle screen**.

The user's attention should naturally follow:

```text
OPPONENT
    ↓
PROGRESS
    ↓
TYPING TEXT
    ↓
KEYBOARD
    ↓
WPM / ACCURACY / COMBO
```

The final experience should feel:

**Fast. Competitive. Arcade-like. Responsive.**

Build the UI first using mock data and placeholder assets. Keep the code modular so Supabase Realtime and the final visual assets can be integrated later without rewriting the application architecture.
