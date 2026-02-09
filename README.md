# 🥋 Fighter Pro 2D: Enhanced Edition

![Version](https://img.shields.io/badge/Version-v1.5.0_Performance-green)
![Developer](https://img.shields.io/badge/Developer-@WizKhalifaX__-00ffff)

## 📖 Game Description
**Fighter Pro 2D** is a high-octane side-scrolling combat experience. Featuring a unique blend of arcade-style action and modern RPG progression, you must master precision movement and rapid-fire combos to survive. Powered by a centralized **Player Statistics API**, your progress follows you across every mode, from the grueling Farm Arena to the tactical Campaign battles.

**NEW in v1.5.0**: Parallel Asset Loading System - Load times reduced by 70-80% (from ~10s to ~2s).

## 🛡️ Security Architecture (Analysis)
**Fighter Pro 2D** is a client-side JavaScript application. As such, it operates under a "High Trust" model with the user's browser. Game state, save data, and logic are all exposed to the client. This architecture allows for:
1.  **Zero-Latency Gameplay**: No server round-trips for hit detection.
2.  **Offline Capability**: Can be played without an internet connection.
3.  **Vulnerability**: State variables (HP, Score) can be manipulated via the browser console (demonstrated by `js/modules/debug.js`).

*Note: For a production MMO, logic would need to move to a server-authoritative model (Node.js/Socket.io).*

---

## ⚙️ Core Mechanics
- **Dynamic Combo System**: String together attacks to reach different "Rage" stages.
- **Player Statistics API**: A single source of truth for HP, Damage, Speed, and Crit.
- **Advanced AI Logic**: Enemies detect and punish "Jitter Exploits" and adapt to your combo count.
- **Predictive AI**: AI tracks your keystroke patterns and predicts your next move with 35% accuracy.
- **Audio Control**: Persistent Master Volume settings via a reactive Cyberpunk-themed range slider.
- **Unified Pause System**: Press `P` anytime in Campaign, PvP, or Farm Mode to pause.
- **Directional Combat**: Attacks only land if you are physically facing your target.
- **Hit Feedback**: Features screen shake, hit-stop, and directional knockback.
- **Separated Mode Scaling**: Damage and HP scaling differ between Campaign and Farm modes for optimal balance.
- **Diminishing Returns (NEW)**: Combo multipliers and crit effectiveness reduce at levels 75+, capping severely at 125+.

---

## 🕹️ How to Play
- **Move**: `A` (Left) | `D` (Right)
- **Jump**: `Space`
- **Dash/Slide**: `S` (During ground movement)
- **Run**: `Shift` (Hold while moving)
- **Attack**: `F` (Tap for combos)
- **Farming Mode**: Manual tapping is REQUIRED (Hold-to-attack is disabled for balance).

---

## 🏆 Campaign Mode: Tips & Tricks
- **Stage Reactivity**: The AI changes behavior based on your combo. At **6-7 hits**, they will retreat tactically. At **8+ hits**, they enter a "Rage" state and attack relentlessly.
- **Avoid Jittering**: Don't spam `A+D+F` rapidly. The AI's **Anti-Exploit Protocol** detects this and will slide behind you for a guaranteed punish.
- **Spatial Timing**: Use the `Slide` to pass through enemies when cornered.
- **Endgame Challenge (NEW)**: At level 125+, your combo multipliers are severely reduced (0.5x → 0.15x). You MUST invest in shop upgrades to progress.
- **Predictive AI (NEW)**: The AI learns your patterns. Vary your attack timing and movement to avoid being predicted.

---

## 🌾 Farm Arena: Score Points & Upgrades
- **Active Farming**: You cannot AFK farm! You must manually tap `F` to clear mobs.
- **Balanced Damage**: Mobs in Farm Mode now use a **0.25x scaling factor**, ensuring that a "-5 HP" indicator translates directly to a 5% health loss on your HUD, correcting previous "spike damage" bugs.
- **Priority Targets**: Mobs now jump and dodge. Focus on one at a time to keep your reward rate high.
- **Indicator Guide**:
    - **RED Numbers (Header)**: Damage dealt/taken (`-HP`).
    - **GREEN Numbers (Subtitle)**: Score points earned (`+Score`).
- **Survival**: If you get hit, you will be **Slowed by 60%** for 2.5 seconds. Dodge to stay fast!
- **Endgame Farming (NEW)**: At level 125+, you'll need to farm significantly more to afford shop upgrades due to exponential cost scaling.

---

## 💰 Black Market (The Shop)
### How to Purchase
1. Earn Score points in **Farm Mode** or **Campaign**.
2. Visit the **Black Market** from the main menu.
3. Click on any stat (Vitality, Attack, Speed) to upgrade instantly using your score.

### Strategy & "Hacks"
- **Vitality First**: Your HP is displayed as **Vitality Capacity**. Upgrade this early to survive the scaling AI in later Campaign levels.
- **The "Lifesteal" Meta**: Investing in Lifesteal allows you to recover HP mid-fight, which is critical for long Farm sessions.
- **Speed Cap**: Don't ignore Speed! Moving faster makes the AI's "Backstab" protocol harder for them to land.
- **Endgame Investment (NEW)**: At level 125+, upgrade costs increase exponentially (4x-10x). Prioritize damage and HP upgrades as crit effectiveness is reduced.

### Cost Scaling (NEW)
- **Level 0-75**: Linear scaling (1x per 10 levels)
- **Level 75-125**: Moderate scaling (2x-4x)
- **Level 125-200**: Exponential scaling (4x-10x)
- **Level 200+**: Extreme scaling (10x+ with additional increments)

---

## 🛠️ Settings
Access the **Settings Menu** to toggle:
- **Audio Control**: Adjust SFX and BGM.
- **UI Elements**: Toggle HUD visibility for a cinematic experience.
- **Data Initialization**: Reset your save data if you want a fresh start.

---

## 👤 Developer & Version
- **Developer**: @WizKhalifaX_
- **Current Version**: `v1.2.7 Enhanced` (Mod Version)

---

## 📝 Change Logs
### **v1.5.0 Performance (Latest Update - "Parallel Asset Loading")**
- **MAJOR**: Refactored `preload()` to use `Promise.all()` for parallel image loading.
- **PERF**: Reduced initial load time by 70-80% (from ~10-15s to ~2-3s on average connections).
- **CACHE**: Implemented global `imageCache` to prevent re-downloading assets on round transitions.
- **UX**: Added real-time loading progress modal with percentage and asset count feedback.
- **FARM**: Optimized Farm Mode mob sprite loading to leverage parallel system and cache.

### **v1.4.1 Enhanced ("Access Control")**
- **SECURITY**: `debug.js` now requires an Access Code (`admin123`) to unlock cheats.
- **UI**: Integrated `SweetAlert2` password prompt for the Developer Login flow.
- **LOGIC**: Restricted all `Cheats` methods with an internal authorization check.

### **v1.4.0 DevTools ("Security Analysis")**
- **FIX**: Fixed `resumeGame` reference error in Farm Mode by including `settings.js`.
- **UI**: Corrected Settings Menu scaling by restoring the `settings-panel` wrapper (Width: 340px).
- **BALANCE**: Verified Shop Price tier logic; costs correctly scale to 12,500+ at Level 135+ as intended.
- **LOGIC**: Centralized all core game state flags on the `window` object for cross-module stability.

### **v1.3.0 Enhanced ("Universal Stasis")**

### **v1.2.9 Enhanced ("Logistical UI")**
- **MAJOR**: Refactored Settings Menu with pagination (General / Audio tabs).
- **UI**: Added "Audio Manager" sub-header and reorganized control hierarchy.
- **LOGIC**: Consolidated Pause/Resume/Fullscreen logic into `settings.js`.

### **v1.2.8 Enhanced ("Audio Overhaul")**
- **NEW**: Global Master Volume control with persistent settings.
- **UI**: Added reactive Cyberpunk-themed range slider with dynamic SVG icons.
- **LOGIC**: Implemented Master Volume multiplier in `sound.js`.

### **v1.2.7 Enhanced ("Endgame Rebalance")**
- **MAJOR**: Implemented diminishing returns on combo multipliers at high levels (75+, 125+).
- **MAJOR**: Added predictive AI system that tracks player keystroke patterns (35% prediction accuracy).
- **MAJOR**: Exponential shop cost scaling at levels 125+ to force Farm Mode engagement.
- **FIXED**: "Walk-back exploit" where AI could be easily combo'd during retreat phases.
- **AI**: Enemy now runs aggressively during all retreat/return phases instead of walking.
- **AI**: Added preemptive dodging when aggressive player patterns are detected.
- **BALANCE**: Critical hit effectiveness reduced at high levels (3-4x → 1.8-2.2x at 125+).
- **BALANCE**: Combo multiplier reduced from 0.5x to 0.15x at level 125+.

### **v1.2.6 Enhanced ("Balance Patch")**
- **FIXED**: "Spike Damage" bug in Farm Mode. Separated damage logic from Campaign Mode.
- **FEAT**: Unified Farm HUD Scale. Damage text now matches the visual HP% reduction exactly (1 damage unit = 1% HUD loss).
- **DOCS**: Added comprehensive `README.md` and `DESCRIPTION.md`.

### **v1.2.5 Enhanced**
- **NEW**: Anti-AFK Farm. Disabled "Hold to Attack" in Farm Mode.
- **NEW**: Hit-Feedback System. Added knockback and 2.5s hit-slow debuff.
- **SFX**: Added sequential Player Hurt vocals (1-5) with 1.2s cooldown.
- **SFX**: Added alternating "Mob Pop" death sounds.
- **UI**: Redesigned Farm Indicators (Red Damage Headers / Green Reward Subtitles).

### **v1.2.4 Mod**
- **AI**: Implemented Hyper-Sensitive Anti-Exploit Jitter Detection.
- **AI**: Fixed "Coward Bug" where AI would run to corners at 7x combo.
- **SFX**: Added Global UI Hover and Select sounds with 0.8s click-mute window.
