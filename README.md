# 🥋 Fighter Pro 2D: Enhanced Edition

![Version](https://img.shields.io/badge/Version-v1.2.5_Enhanced-cyan)
![Developer](https://img.shields.io/badge/Developer-@WizKhalifaX__-00ffff)

## 📖 Game Description
**Fighter Pro 2D** is a high-octane side-scrolling combat experience. Featuring a unique blend of arcade-style action and modern RPG progression, you must master precision movement and rapid-fire combos to survive. Powered by a centralized **Player Statistics API**, your progress follows you across every mode, from the grueling Farm Arena to the tactical Campaign battles.

---

## ⚙️ Core Mechanics
- **Dynamic Combo System**: String together attacks to reach different "Rage" stages.
- **Player Statistics API**: A single source of truth for HP, Damage, Speed, and Crit.
- **Advanced AI Logic**: Enemies detect and punish "Jitter Exploits" and adapt to your combo count.
- **Directional Combat**: Attacks only land if you are physically facing your target.
- **Hit Feedback**: Features screen shake, hit-stop, and directional knockback.

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

---

## 🌾 Farm Arena: Score Points & Upgrades
- **Active Farming**: You cannot AFK farm! You must manually tap `F` to clear mobs.
- **Priority Targets**: Mobs now jump and dodge. Focus on one at a time to keep your reward rate high.
- **Indicator Guide**:
    - **RED Numbers**: Damage dealt/taken (`-HP`).
    - **GREEN Numbers**: Score points earned (`+Score`).
- **Survival**: If you get hit, you will be **Slowed by 60%** for 2.5 seconds. Dodge to stay fast!

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

---

## 🛠️ Settings
Access the **Settings Menu** to toggle:
- **Audio Control**: Adjust SFX and BGM.
- **UI Elements**: Toggle HUD visibility for a cinematic experience.
- **Data Initialization**: Reset your save data if you want a fresh start.

---

## 👤 Developer & Version
- **Developer**: @WizKhalifaX_
- **Current Version**: `v1.2.5 Enhanced` (Mod Version)

---

## 📝 Change Logs
### **v1.2.5 Enhanced (Latest)**
- **NEW**: Anti-AFK Farm. Disabled "Hold to Attack" in Farm Mode.
- **NEW**: Hit-Feedback System. Added knockback and 2.5s hit-slow debuff.
- **SFX**: Added sequential Player Hurt vocals (1-5) with 1.2s cooldown.
- **SFX**: Added alternating "Mob Pop" death sounds.
- **UI**: Redesigned Farm Indicators (Red Damage Headers / Green Reward Subtitles).

### **v1.2.4 Mod**
- **AI**: Implemented Hyper-Sensitive Anti-Exploit Jitter Detection.
- **AI**: Fixed "Coward Bug" where AI would run to corners at 7x combo.
- **SFX**: Added Global UI Hover and Select sounds with 0.8s click-mute window.

### **v1.2.3 Enhanced**
- **CORE**: Centralized all stats into `PlayerAPI`.
- **UI**: Standardized Vitality Capacity (HP %) across all modes.
- **FEAT**: Integrated directional hit detection to prevent back-attacks.
