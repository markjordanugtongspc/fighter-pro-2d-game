// script.js – FIXED: No Console Errors, Auto-Increment Working

const assets = {
  idle: { path: 'img/idle/', prefix: 'fighter_Idle_', start: 1, end: 8, speed: 3 },      // 20 FPS
  walk: { path: 'img/walk/', prefix: 'fighter_walk_', start: 9, end: 16, speed: 2.8 },    // ~21.4 FPS
  run: { path: 'img/run/', prefix: 'fighter_run_', start: 17, end: 24, speed: 2.5 },      // 24 FPS
  jump: { path: 'img/jump/', prefix: 'fighter_jump_', start: 43, end: 47, speed: 2.8 },    // ~21.4 FPS
  attack1: { path: 'img/combo/', prefix: 'fighter_combo_', start: 64, end: 68, speed: 4.0 },
  attack2: { path: 'img/combo/', prefix: 'fighter_combo_', start: 69, end: 75, speed: 4.0 },
  attack3: { path: 'img/combo/', prefix: 'fighter_combo_', start: 76, end: 78, speed: 4.0 },
  hurt: { path: 'img/damage/', prefix: 'fighter_hit_', start: 48, end: 51, speed: 3 },      // 20 FPS
  death: { path: 'img/die/', prefix: 'fighter_death_', start: 52, end: 61, speed: 3 },     // 20 FPS
  hitEffect: { path: 'img/hit-effect/', prefix: 'hit_effect_', start: 1, end: 4, speed: 2.5 }, // 24 FPS
  slide: { path: 'img/slide/', prefix: 'fighter_slide_', start: 25, end: 32, speed: 2.5 }   // 24 FPS
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let spriteSheets = {};
let gameRunning = false;
let isPaused = true;
let isMultiplayer = false;

// Game State
let roundScore = 0;
let shake = 0;
let shakeX = 0;
let shakeY = 0;

let particles = [];
let cloudSprites = [];
let clouds = [
  { x: 120, y: 70, size: 90, imgIdx: 0, speed: 0.3 }, { x: 380, y: 110, size: 120, imgIdx: 1, speed: 0.5 },
  { x: 680, y: 50, size: 80, imgIdx: 2, speed: 0.2 }, { x: 920, y: 95, size: 110, imgIdx: 3, speed: 0.4 }
];

let hitFx = { active: false, frame: 0, timer: 0, x: 0, y: 0 };

let keys = {};
let triggers = {};

const locked = ['attack1', 'attack2', 'attack3', 'hurt', 'slide'];

// Helper
function safeText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

class Fighter {
  constructor(x, facingRight, num) {
    this.x = x;
    this.y = 250;
    this.vx = 0;
    this.vy = 0;
    this.num = num;

    // --- STATS & AUTO INCREMENT LOGIC ---
    // We access window.saveData directly now to ensure sync
    const stats = window.saveData || { hp: 0, dmg: 0, speed: 0, crit: 0, lifesteal: 0, gameLevel: 0 };

    if (isMultiplayer) {
      // Best-of-3 Competitive Mode: Use baseline stats from API
      const comp = (window.PlayerAPI) ? window.PlayerAPI.getCompetitiveStats() : { maxHp: 25, baseDmg: 2, speedMult: 1.0, critChance: 0, lifesteal: 0 };
      this.maxHp = comp.maxHp;
      this.baseDmg = comp.baseDmg;
      this.speedMult = comp.speedMult;
      this.critChance = comp.critChance;
      this.lifesteal = comp.lifesteal;
    } else if (this.num === 1) {
      // Campaign Mode (Player 1): Use Synced API Stats
      const synced = (window.PlayerAPI) ? window.PlayerAPI.getSyncedStats() : { maxHp: 25, baseDmg: 2, speedMult: 1.0, critChance: 0, lifesteal: 0 };
      this.maxHp = synced.maxHp;
      this.baseDmg = synced.baseDmg;
      this.speedMult = synced.speedMult;
      this.critChance = synced.critChance;
      this.lifesteal = synced.lifesteal;
    } else {
      // Campaign Mode (Enemy AI): Use Scaling API
      const ai = (window.PlayerAPI) ? window.PlayerAPI.getAiScaling(stats.gameLevel) : { maxHp: 25, baseDmg: 2, speedMult: 1.0, critChance: 0, lifesteal: 0 };
      this.maxHp = ai.maxHp;
      this.baseDmg = ai.baseDmg;
      this.speedMult = ai.speedMult;
      this.critChance = ai.critChance;
      this.lifesteal = ai.lifesteal;
    }

    this.hp = this.maxHp;
    this.displayedHp = this.maxHp; // For the yellow lag effect
    this.comboCount = 0;

    this.state = 'idle';
    this.frame = assets.idle.start;
    this.timer = 0;
    this.facing = facingRight;
    this.dead = false;
    this.isDying = false;
    this.diedThisRound = false;
    this.slideCD = 0;
    this.hasHit = false;
    this.attackQueue = false;
    this.spamMultiplier = 1.0; // Dynamic ramp-up
    this.slowTimer = 0; // Hit-slow duration

    this.aiKeys = { left: false, right: false, up: false, attack: false, slide: false, run: false };
  }

  getInput() {
    if (this.num === 1) {
      let input = {
        left: keys['a'] || keys['A'],
        right: keys['d'] || keys['D'],
        run: keys['ShiftLeft'] || keys['ShiftRight'],
        jump: this.consumeTrigger([' ']),
        attack: this.consumeTrigger(['f', 'F']),
        attackHold: window.isFarming ? false : (keys['f'] || keys['F']),
        slide: this.consumeTrigger(['s', 'S'])
      };
      return input;
    }
    if (isMultiplayer) {
      if (window.getMultiplayerInput) return window.getMultiplayerInput(this.consumeTrigger.bind(this));
    }
    return this.aiKeys;
  }

  consumeTrigger(codes) {
    for (let c of codes) {
      if (triggers[c]) {
        triggers[c] = false;
        return true;
      }
    }
    return false;
  }

  update() {
    // --- HP LAG EFFECT ---
    if (this.displayedHp > this.hp) {
      this.displayedHp -= (this.displayedHp - this.hp) * 0.08;
      if (this.displayedHp - this.hp < 0.1) this.displayedHp = this.hp;
    } else if (this.displayedHp < this.hp) {
      this.displayedHp = this.hp; // Immediate update for healing/shop
    }

    if (this.dead) return;

    this.slideCD = Math.max(0, this.slideCD - 1);
    this.vy += 0.75;
    this.y += this.vy;
    if (this.y >= 250) { this.y = 250; this.vy = 0; }

    const inp = this.getInput();
    const ground = this.y >= 250 && this.vy >= 0;

    // Buffer attack if already attacking (TAP or HOLD for spamming)
    if (this.state.startsWith('attack') && (inp.attack || inp.attackHold)) {
      if (!this.attackQueue) console.log(`[P${this.num}] Combo Buffered (Hold: ${inp.attackHold})`);
      this.attackQueue = true;
    }

    if (this.state === 'death') {
      this.vx *= 0.9;
    } else if (this.state === 'hurt') {
      this.vx *= 0.88;
    } else if (this.state === 'slide') {
      this.vx = (this.facing ? 14 : -14) * this.speedMult;
    } else {
      // Allow movement during attacks and all other states
      let dir = 0;
      if (inp.left) dir -= 1;
      if (inp.right) dir += 1;
      if (dir !== 0) this.facing = dir > 0;

      let spd = inp.run ? 9 : 4.5;
      spd *= this.speedMult;

      // Temporary slow effect during hit recovery
      if (this.slowTimer > 0) {
        this.slowTimer--;
        spd *= 0.4;
      }

      let target = dir * spd;

      if (dir === 0) {
        this.vx *= 0.6;
        if (Math.abs(this.vx) < 0.5) this.vx = 0;
      } else {
        this.vx += (target - this.vx) * 0.32;
      }
    }

    this.x += this.vx;
    // Expanded bounds to keep sprite fully on screen
    if (this.x < -60) this.x = -60;
    if (this.x > 900) this.x = 900;

    // --- SPATIAL DISTANCING (Prevent Overlapping, Allow Passing) ---
    const other = (this.num === 1) ? p2 : p1;
    if (other && !other.dead && !this.dead) {
      const dx = (this.x + 125) - (other.x + 125); // Use Center Points (125 offset)
      const minDist = 60; // Reduced from 80 to allow easier passing
      if (Math.abs(dx) < minDist) {
        const push = (minDist - Math.abs(dx)) / 2;
        // Only push if characters are very close (not just crossing)
        if (Math.abs(dx) < 40) {
          if (dx > 0) {
            this.x += push;
            other.x -= push;
          } else {
            this.x -= push;
            other.x += push;
          }
        }
      }
    }


    let next = this.state;
    if (this.state === 'death') next = 'death';
    else if (locked.includes(this.state)) next = this.state;
    else {
      if (this.y < 250 || this.vy > 0) next = 'jump';
      else if (Math.abs(this.vx) > (6 * this.speedMult)) next = 'run';
      else if (Math.abs(this.vx) > 1) next = 'walk';
      else next = 'idle';
    }

    if (next !== this.state) {
      this.state = next;
      this.frame = assets[next].start;
      this.timer = 0;
    }

    if (ground && !locked.includes(this.state) && this.state !== 'death') {
      if (inp.jump) {
        this.vy = -14.5 * (1 + (this.speedMult - 1) * 0.2); // Nerfed from 16
      }
      else if (inp.attack) {
        console.log(`[P${this.num}] Manual Attack Triggered`);
        this.state = 'attack1';
        this.frame = assets.attack1.start;
        this.timer = 0;
        this.hasHit = false;
        this.attackQueue = false;
        this.spamMultiplier = 1.0; // Reset on new sequence starter
        if (window.playHitSFX) window.playHitSFX();
      }
      else if (inp.slide && this.slideCD === 0) {
        this.state = 'slide';
        this.frame = assets.slide.start;
        this.timer = 0;
        this.slideCD = 160;
        this.vx = (this.facing ? 16 : -16) * this.speedMult;
      }
    }

    this.timer += 1;
    const a = assets[this.state];
    if (!a) return;

    let animSpeed = a.speed / this.speedMult;

    // RAMP-UP LOGIC: Only in Multiplayer (Campaign uses shop stats)
    if (isMultiplayer && this.state.startsWith('attack')) {
      if (inp.attackHold) {
        // Decrease multiplier (smaller = faster) gradually
        this.spamMultiplier = Math.max(0.4, this.spamMultiplier - 0.005);
      } else {
        // Slowly reset if not holding
        this.spamMultiplier = Math.min(1.0, this.spamMultiplier + 0.002);
      }
      animSpeed *= this.spamMultiplier;
    } else if (this.state === 'idle') {
      this.spamMultiplier = 1.0;
    }

    // Aggressive Clamp: prevents skipping but allows blur-fast motion
    animSpeed = Math.max(1.2, animSpeed);

    if (this.timer >= animSpeed) {
      this.frame++;
      this.timer -= animSpeed; // Use subtraction to handle fractional speeds (alternating frames)

      if (this.state === 'death') {
        if (this.frame > a.end) { this.frame = a.end; this.dead = true; }
      } else if (locked.includes(this.state)) {
        if (this.frame > a.end) {
          // Stage Transition Logic
          if (this.state === 'attack1' && this.attackQueue) {
            this.state = 'attack2';
            this.frame = assets.attack2.start;
            this.timer = 0;
            this.hasHit = false;
            this.attackQueue = false;
            if (window.playHitSFX) window.playHitSFX();
          } else if (this.state === 'attack2' && this.attackQueue) {
            this.state = 'attack3';
            this.frame = assets.attack3.start;
            this.timer = 0;
            this.hasHit = false;
            this.attackQueue = false;
            if (window.playHitSFX) window.playHitSFX();
          } else if (this.state === 'attack3' && this.attackQueue) {
            // Cycle back to Stage 1 for infinite spamming
            this.state = 'attack1';
            this.frame = assets.attack1.start;
            this.timer = 0;
            this.hasHit = false;
            this.attackQueue = false;
            if (window.playHitSFX) window.playHitSFX();
          } else {
            if (this.state.startsWith('attack')) console.log(`[P${this.num}] ${this.state} finished - returning to idle`);
            this.state = 'idle';
            this.frame = assets.idle.start;
            this.attackQueue = false;
          }
        }
      } else if (this.state === 'jump') {
        if (this.frame > a.end) this.frame = a.end;
      } else {
        if (this.frame > a.end) this.frame = a.start;
      }
    }

    if (this.dead && !this.diedThisRound) {
      this.diedThisRound = true;
      if (this.num === 1) {
        if (window.addProgress) window.addProgress(roundScore, false); // Defeat: No Level Up
        if (window.stopAllSounds) window.stopAllSounds();
        gameOver('Defeat');
      } else {
        if (window.addProgress && !isMultiplayer) window.addProgress(roundScore, true); // Victory: Level Up!
        gameOver('Victory');
      }
    }
  }

  hit(damage, fromX) {
    if (this.isDying || this.state === 'death') return;
    if (this.state === 'hurt') return;

    this.comboCount = 0;
    this.hp -= damage;

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'death';
      this.isDying = true;
      this.frame = assets.death.start;
      this.timer = 0;
      shake = 15;

      // Play dramatic death vocal for player
      if (this.num === 1 && window.playPlayerDeathSFX) window.playPlayerDeathSFX();
    } else {
      this.state = 'hurt';
      this.frame = assets.hurt.start;
      this.timer = 0;

      // Play vocal reaction for player taking damage
      if (this.num === 1 && window.playPlayerHurtSFX) window.playPlayerHurtSFX();

      // KNOCKBACK LEGEND: [+] Increase = higher value | [-] Decrease = lower value
      let dir = this.x > fromX ? 35 : -35;
      this.x += dir;
      this.vx += dir * 0.4;
      shake = 8;
    }
  }

  render() {
    const sheet = spriteSheets[this.state];
    if (!sheet) return;
    const idx = this.frame - assets[this.state].start;
    if (idx < 0 || idx >= sheet.length) return;

    ctx.save();
    ctx.translate(this.x + 125, this.y + 125);
    if (!this.facing) ctx.scale(-1, 1);

    if (this.num === 1) ctx.filter = 'hue-rotate(350deg) saturate(1.4)';
    else if (isMultiplayer) ctx.filter = 'hue-rotate(210deg) saturate(1.35)';
    else ctx.filter = 'hue-rotate(160deg) brightness(0.9)';

    ctx.drawImage(sheet[idx], -125, -125, 250, 250);
    ctx.filter = 'none';
    ctx.restore();
  }
}

let p1, p2;

function pad(n) { return n.toString().padStart(4, '0'); }

// --- EFFECTS ---
function particlesHit(x, y) {
  for (let i = 0; i < 20; i++) { // Increased density
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 18, // More explosive
      vy: (Math.random() - 0.5) * 18 - 5,
      size: Math.random() * 6 + 1,
      color: Math.random() < 0.7 ? '#ff0000' : '#880000', // Bloody Red
      life: 50, max: 50
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.35; // Slightly heavier gravity
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  ctx.save();
  particles.forEach(p => {
    ctx.globalAlpha = p.life / p.max;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    // Subtle glow for blood
    ctx.shadowBlur = 5;
    ctx.shadowColor = p.color;
  });
  ctx.restore();
}

function updateHitFx() {
  if (!hitFx.active) return;
  const a = assets.hitEffect;
  hitFx.timer += 1;

  if (hitFx.timer >= a.speed) {
    hitFx.frame++;
    hitFx.timer -= a.speed;
    if (hitFx.frame > a.end) hitFx.active = false;
  }
}

function drawHitFx() {
  if (!hitFx.active) return;
  const sheet = spriteSheets.hitEffect;
  if (!sheet) return;
  const idx = hitFx.frame - assets.hitEffect.start;
  if (idx < 0 || idx >= sheet.length) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  // Red tint the hit effect
  ctx.filter = 'hue-rotate(-50deg) saturate(3)';
  ctx.drawImage(sheet[idx], hitFx.x - 100, hitFx.y - 100, 200, 200); // Larger effect
  ctx.restore();
}

function updateClouds() {
  clouds.forEach(c => {
    c.x -= c.speed; // Use individual speeds for parallax
    if (c.x < -200) {
      c.x = 1100 + Math.random() * 200;
      c.y = 20 + Math.random() * 100;
      c.size = 80 + Math.random() * 60;
      c.speed = 0.2 + Math.random() * 0.4;
      c.imgIdx = Math.floor(Math.random() * 4);
    }
  });
}

function drawClouds() {
  ctx.save();
  ctx.globalAlpha = 0.6;
  clouds.forEach(c => {
    const sprite = cloudSprites[c.imgIdx];
    if (sprite) {
      // Slightly more natural aspect ratio (1.6 instead of 1.8)
      ctx.drawImage(sprite, c.x - c.size / 2, c.y - c.size / 2, c.size * 1.6, c.size);
    }
  });
  ctx.restore();
}

function drawIndicators() {
  const bounce = Math.sin(performance.now() * 0.008) * 8;

  function drawArrow(p, color) {
    if (p.dead || p.isDying) return;
    const x = p.x + 125;
    const y = p.y + bounce + 10;

    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 12, y - 25);
    ctx.lineTo(x + 12, y - 25);
    ctx.lineTo(x, y - 5);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
  }

  drawArrow(p1, '#39ff14');
  drawArrow(p2, '#ff0000');
}


function drawUI() {
  ctx.shadowBlur = 0;

  // Health Bar Settings
  const barW = 300;
  const barH = 25;
  const p1X = 50;
  const p2X = 1000 - 50 - barW;
  const topY = 30;

  // --- COLORS ---
  const healthColor = '#39ff14'; // Radiant Green
  const lagColor = '#ffff00';    // Alert Yellow
  const damageColor = '#ff2a2a'; // Deep Red

  // --- P1 HUD ---
  // Layer 1: Background Red
  ctx.fillStyle = damageColor;
  ctx.fillRect(p1X, topY, barW, barH);

  // Layer 2: Yellow Lag
  const p1LagRatio = p1.displayedHp / p1.maxHp;
  ctx.fillStyle = lagColor;
  ctx.fillRect(p1X, topY, barW * p1LagRatio, barH);

  // Layer 3: Main Green
  const p1Ratio = p1.hp / p1.maxHp;
  ctx.fillStyle = healthColor;
  ctx.fillRect(p1X, topY, barW * p1Ratio, barH);

  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(p1X, topY, barW, barH);

  // Labels
  ctx.font = 'bold 16px Orbitron';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText('PLAYER 1', p1X, topY - 10);
  ctx.textAlign = 'right';
  const p1CapPercent = Math.round((p1.hp / 25) * 100);
  ctx.fillText(`${p1CapPercent}%`, p1X + barW, topY + barH + 18);


  // --- P2 HUD ---
  // Layer 1: Background Red
  ctx.fillStyle = damageColor;
  ctx.fillRect(p2X, topY, barW, barH);

  // Layer 2: Yellow Lag (fills from right for P2? No, standard left-to-right fill is cleaner)
  const p2LagRatio = p2.displayedHp / p2.maxHp;
  ctx.fillStyle = lagColor;
  ctx.fillRect(p2X, topY, barW * p2LagRatio, barH);

  // Layer 3: Main Green
  const p2Ratio = p2.hp / p2.maxHp;
  ctx.fillStyle = healthColor;
  ctx.fillRect(p2X, topY, barW * p2Ratio, barH);

  ctx.strokeStyle = 'white';
  ctx.strokeRect(p2X, topY, barW, barH);

  // Labels (Red for Enemy)
  ctx.font = 'bold 16px Orbitron';
  ctx.fillStyle = damageColor; // Red for Enemy name
  ctx.textAlign = 'right';
  ctx.fillText(isMultiplayer ? 'PLAYER 2' : 'ENEMY', p2X + barW, topY - 10);

  if (isMultiplayer) {
    // Round Win Icons (Current Streak Dots)
    const dotSize = 8;
    const dotGap = 6;
    const dotY = topY + barH + 12;
    for (let i = 1; i <= 3; i++) {
      // P1 Win Indicators (Radiant Green Glow)
      ctx.beginPath();
      ctx.arc(p1X + (i - 1) * (dotSize * 2 + dotGap) + dotSize, dotY, dotSize, 0, Math.PI * 2);
      if (window.p1Wins >= i) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#39ff14';
        ctx.fillStyle = '#39ff14';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#222';
      }
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.stroke();

      // P2 Win Indicators (Vibrant Red Glow)
      ctx.beginPath();
      ctx.arc(p2X + barW - (i - 1) * (dotSize * 2 + dotGap) - dotSize, dotY, dotSize, 0, Math.PI * 2);
      if (window.p2Wins >= i) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff2a2a';
        ctx.fillStyle = '#ff2a2a';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#222';
      }
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // Reset for rest of UI
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = 'white'; // Keep percentage white for readability
  const p2CapPercent = Math.round((p2.hp / 25) * 100);
  ctx.fillText(`${p2CapPercent}%`, p2X, topY + barH + 18);

  // ENEMY LEVEL (Only for Campaign)
  if (!isMultiplayer) {
    const levelVal = (window.saveData && window.saveData.gameLevel !== undefined) ? window.saveData.gameLevel + 1 : 1;
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'right';
    ctx.fillText(`LVL: ${levelVal}`, p2X + barW, topY + barH + 34);
  }

  // SCORE / ROUND (Top Center)
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Orbitron';
  ctx.fillStyle = '#888';

  if (isMultiplayer) {
    ctx.fillText('ROUND', 500, topY);
    const currentRound = (window.p1Wins || 0) + (window.p2Wins || 0) + 1;
    ctx.font = 'bold 28px Orbitron';
    ctx.fillStyle = '#ffcc00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffcc00';
    ctx.fillText(currentRound, 500, topY + 30);
  } else {
    ctx.fillText('SCORE', 500, topY);
    ctx.font = 'bold 28px Orbitron';
    ctx.fillStyle = '#ffcc00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffcc00';
    ctx.fillText(roundScore, 500, topY + 30);
  }
  ctx.shadowBlur = 0;

  if (p1.comboCount > 1) {
    ctx.fillStyle = '#ffff33';
    ctx.font = 'bold 36px Orbitron';
    ctx.fillText(`${p1.comboCount}× COMBO!`, 200, 150);
  }

  if (p2.comboCount > 1) {
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 36px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(`${p2.comboCount}× COMBO!`, 1000 - 200, 150);
  }
}

async function preload() {
  spriteSheets = {};
  for (const key in assets) {
    const anim = assets[key];
    spriteSheets[key] = [];
    for (let i = anim.start; i <= anim.end; i++) {
      const img = new Image();
      img.src = `${anim.path}${anim.prefix}${pad(i)}.png`;
      spriteSheets[key].push(img);
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = () => { console.warn(`Missing: ${img.src}`); resolve(); };
      });
    }
  }

  // Preload Cloud Sprites
  cloudSprites = [];
  for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `img/clouds/cloud${i}.png`;
    cloudSprites.push(img);
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = () => { console.warn(`Missing Cloud Image: ${img.src}`); resolve(); };
    });
  }
}

function checkAttacks() {
  // P1 Hit P2
  const p1Hit = (
    (p1.state === 'attack1' && p1.frame >= 66 && p1.frame <= 68) ||
    (p1.state === 'attack2' && p1.frame >= 71 && p1.frame <= 75) ||
    (p1.state === 'attack3' && p1.frame >= 79 && p1.frame <= 82)
  );

  if (p1Hit && !p1.hasHit) {
    console.log(`[COMBAT] P1 Strike Landed - Frame: ${p1.frame}`);

    /* 
       =========================================
       HITBOX LEGEND & CALIBRATION GUIDE
       =========================================
       dx: Horizontal Range (How far the punch reaches).
       dy: Vertical Tolerance (How close your heights must match).

       - To INCREASE Range: Make 'dx' larger (e.g., 150, 200).
       - To DECREASE Range: Make 'dx' smaller (e.g., 90, 100).
       - To REQUIRE better Height Sync: Make 'dy' smaller (e.g., 60, 80).
       - To BE FORGIVING with jump hits: Make 'dy' larger (e.g., 150).
       =========================================
    */
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    // Hitbox tuned down for more precision (dx: 115, dy: 95)
    if (dx < 115 && dy < 95 && !p2.isDying) {
      p1.hasHit = true;

      let multiplier = 1 + (p1.comboCount * 0.5);
      let totalDmg = p1.baseDmg * multiplier;
      let isCrit = false;
      const level = (window.saveData && window.saveData.gameLevel) ? window.saveData.gameLevel : 0;

      if (Math.random() < p1.critChance) {
        totalDmg *= (3 + Math.random());
        isCrit = true;
        shake = 10;
      }

      p2.hit(totalDmg, p1.x);

      if (p1.lifesteal > 0 && p1.hp < p1.maxHp) {
        p1.hp = Math.min(p1.maxHp, p1.hp + p1.lifesteal);
      }

      p1.comboCount++;
      if (window.playHitSFX) window.playHitSFX();

      hitFx = { active: true, frame: assets.hitEffect.start, timer: 0, x: (p1.x + p2.x) / 2 + 70, y: p1.y + 100 };

      // Dynamic Score Scaling (Campaign Only)
      if (!isMultiplayer) {
        let depreciation = 1.0;
        if (level > 20) {
          depreciation = Math.max(0.1, 1.0 - ((level - 20) * 0.05));
        }
        const baseScore = 50 + (p1.comboCount * 25);
        roundScore += Math.floor(Math.max(50, Math.min(250, baseScore * depreciation)));
      }

      shake = isCrit ? 10 : 7 + p1.comboCount;
      particlesHit((p1.x + p2.x) / 2 + 70, p1.y + 100);
    }
  }

  // P2 Hit P1
  const p2Hit = (
    (p2.state === 'attack1' && p2.frame >= 66 && p2.frame <= 68) ||
    (p2.state === 'attack2' && p2.frame >= 71 && p2.frame <= 75) ||
    (p2.state === 'attack3' && p2.frame >= 79 && p2.frame <= 82)
  );

  if (p2Hit && !p2.hasHit) {
    console.log(`[COMBAT] P2 Strike Landed - Frame: ${p2.frame}`);
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);

    // Symmetrical Hitbox check for Player 2 / Enemy
    if (dx < 115 && dy < 95 && !p1.isDying) {
      p2.hasHit = true;

      let multiplier = 1 + (p2.comboCount * 0.5);
      let totalDmg = p2.baseDmg * multiplier;

      p1.hit(totalDmg, p2.x);
      p2.comboCount++;
      if (window.playHitSFX) window.playHitSFX();

      hitFx = { active: true, frame: assets.hitEffect.start, timer: 0, x: p1.x + 70, y: p1.y + 100 };
      shake = 7 + p2.comboCount;
      particlesHit(p1.x + 70, p1.y + 100);
    }
  }
}

function loop() {
  if (!gameRunning) return;

  if (shake > 0.2) {
    shakeX = (Math.random() - 0.5) * shake * 2.2;
    shakeY = (Math.random() - 0.5) * shake * 2.2;
    shake *= 0.89;
  } else {
    shake = shakeX = shakeY = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createLinearGradient(0, 0, 0, 500);
  bg.addColorStop(0, '#150505');
  bg.addColorStop(0.55, '#401010');
  bg.addColorStop(0.55, '#222');
  bg.addColorStop(1, '#111');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 500);

  const fog = ctx.createLinearGradient(0, 290, 0, 500);
  fog.addColorStop(0, 'rgba(50,10,10,0.5)');
  fog.addColorStop(1, 'rgba(20,0,0,0.95)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 290, 1000, 210);

  if (!isPaused) {
    if (!isMultiplayer && window.updateEnemyAI) window.updateEnemyAI();

    p1.update();
    p2.update();
    checkAttacks();
    updateParticles();
    updateClouds();
    updateHitFx();
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawClouds();
  drawParticles();
  p1.render();
  p2.render();
  drawHitFx();

  drawIndicators();

  ctx.restore();
  drawUI();

  requestAnimationFrame(loop);
}

async function startGame(isPvP = false, isAutoplay = false) {
  stopMenuMusic();
  isMultiplayer = isPvP;
  gameRunning = true;
  isPaused = true; // Wait for Countdown

  // Only reset match score if NOT a round transition (autoplay)
  if (isMultiplayer && !isAutoplay && window.resetMultiplayerMatch) {
    window.resetMultiplayerMatch();
  }

  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('settingsMenu').classList.add('hidden');
  document.getElementById('shopScreen').classList.add('hidden');

  if (Object.keys(spriteSheets).length === 0) await preload();

  resetGame();
  clearInputs();

  // Trigger Cinematic Countdown
  startCountdown();
}

function startCountdown() {
  let timerInterval;
  Swal.fire({
    position: 'center',
    title: '<span style="font-family: Orbitron; color: #ff0000; font-size: 6rem; text-shadow: 0 0 35px #ff0000; font-weight: 900;">3</span>',
    background: 'rgba(0,0,0,0)',
    timer: 3000,
    showConfirmButton: false,
    allowOutsideClick: false,
    backdrop: false,
    customClass: {
      popup: 'transparent-popup',
      container: 'no-bg-container'
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) container.style.background = 'none';

      const popup = Swal.getPopup();
      if (popup) {
        popup.style.background = 'none';
        popup.style.boxShadow = 'none';
        popup.style.border = 'none';
      }

      let count = 3;
      const title = Swal.getTitle();
      timerInterval = setInterval(() => {
        count--;
        if (count > 0) {
          title.innerHTML = `<span style="font-family: Orbitron; color: #ff0000; font-size: 6rem; text-shadow: 0 0 35px #ff0000; font-weight: 900;">${count}</span>`;
          if (window.playSFX) window.playSFX('tick');
        } else {
          title.innerHTML = `<span style="font-family: Orbitron; color: #ff0000; font-size: 6rem; font-weight: 950; text-shadow: 0 0 50px #ff0000; letter-spacing: 5px; white-space: nowrap;">FIGHT!</span>`;
          if (window.playSFX) window.playSFX('fight');
        }
      }, 800);
    },
    willClose: () => {
      clearInterval(timerInterval);
      isPaused = false;
      if (window.startGameMusic) window.startGameMusic();
      showDifficultyToast();
      loop();
    }
  });
}

function resetGame() {
  roundScore = 0; // Fresh start for session
  particles = [];
  hitFx.active = false;
  p1 = new Fighter(100, true, 1);
  p2 = new Fighter(700, false, 2);
}

function clearInputs() {
  keys = {};
  triggers = {};
}

function showDifficultyToast() {
  if (isMultiplayer) return; // No AI difficulty in PvP
  const level = (window.saveData && window.saveData.gameLevel) ? window.saveData.gameLevel + 1 : 1;
  let msg = "Level " + level + ": Prepare yourself!";
  if (level > 10) msg = "Level " + level + ": The enemy is getting faster!";
  if (level > 25) msg = "Level " + level + ": Enemy reaction time is peaking!";
  if (level >= 50) msg = "Level " + level + ": WARNING! ENEMY ENRAGED (+DAM)";

  const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'rgba(10, 10, 15, 0.95)',
    color: '#eee'
  });

  Toast.fire({
    icon: 'warning',
    title: msg
  });
}

function nextRound() {
  // Preserve mode, reload page, but skip the 3s countdown for "Next Level"
  sessionStorage.setItem('fighterPro_autoplay', 'true');
  sessionStorage.setItem('fighterPro_skipCountdown', 'true');
  sessionStorage.setItem('fighterPro_mode', isMultiplayer ? 'pvp' : 'campaign');
  window.location.reload();
}

function restartGame() {
  // Preserve mode, reload page, and automatically skip the 3s countdown
  sessionStorage.setItem('fighterPro_autoplay', 'true');
  sessionStorage.setItem('fighterPro_skipCountdown', 'true');
  sessionStorage.setItem('fighterPro_mode', isMultiplayer ? 'pvp' : 'campaign');
  window.location.reload();
}

function gameOver(message) {
  if (window.stopAllSounds) window.stopAllSounds();
  isPaused = true;

  if (isMultiplayer) {
    const winnerNum = (message === 'Victory') ? 1 : 2;
    if (window.trackMultiplayerWin && window.trackMultiplayerWin(winnerNum)) {
      return; // Final match result handled by multiplayer.js
    }

    // If P2 Lost (P1 Victory) -> WE ALSO WANT A MODAL for "PLAYER 2 DEFEATED"
    if (message === 'Victory') {
      if (window.playDefeatSFX) window.playDefeatSFX();
      const p2Msgs = [
        "Your fists couldn’t break through their guard...",
        "You fought with courage, but not enough...",
        "The ground welcomed you faster than victory...",
        "Your punches faded before the clash...",
        "Defeat claimed your strength today..."
      ];
      Swal.fire({
        title: `<span style="font-family: Orbitron; color: #ff2a2a; letter-spacing: 2px;">PLAYER 2 DEFEATED</span>`,
        html: `<span style="color: #ccc;">${p2Msgs[Math.floor(Math.random() * p2Msgs.length)]}</span>`,
        icon: 'error',
        background: 'rgba(10, 10, 15, 0.98)',
        showCancelButton: true,
        confirmButtonText: 'NEXT ROUND',
        cancelButtonText: 'MAIN MENU',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#444',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.isConfirmed) restartGame();
        else mainMenu();
      });
      return;
    }
  }

  if (message === 'Defeat') {
    if (window.playDefeatSFX) window.playDefeatSFX();
    const p1Msgs = [
      "Your fists had no power... only air.",
      "You swung hard, but fell harder...",
      "Strength abandoned you in the fight...",
      "Your punches landed softer than whispers...",
      "Defeat knocked you out cold..."
    ];
    let finalTitle = isMultiplayer ? "PLAYER 1 DEFEATED" : "DEFEATED";
    let finalHtml = `<span style="color: #ccc;">${p1Msgs[Math.floor(Math.random() * p1Msgs.length)]}</span>`;
    if (!isMultiplayer) finalHtml = '<span style="color: #ccc;">The enemy was too strong...</span>'; // Keep classic for campaign

    Swal.fire({
      title: `<span style="font-family: Orbitron; color: #ff2a2a; letter-spacing: 2px;">${finalTitle}</span>`,
      html: finalHtml,
      icon: 'error',
      background: 'rgba(10, 10, 15, 0.98)',
      showCancelButton: true,
      confirmButtonText: isMultiplayer ? 'NEXT ROUND' : 'RESTART LEVEL',
      cancelButtonText: 'MAIN MENU',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#444',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        restartGame(); // Instant reload logic
      } else {
        mainMenu();
      }
    });
    return; // Stop here, don't show the old overlay
  }

  safeText('gameOverTitle', message);
  safeText('winnerText', message);

  const restartBtn = document.getElementById('restartBtn');
  const nextBtn = document.getElementById('nextRoundBtn');
  const gainDiv = document.getElementById('roundScoreGain');

  if (message === 'Victory') {
    if (window.playWinSFX) window.playWinSFX();

    let finalTitle = isMultiplayer ? "ROUND WON" : "LEVEL CLEARED";
    let finalHtml = isMultiplayer
      ? `<div style="font-family: Rajdhani; color: #eee; font-size: 1.2rem;">Match Score: <b style="color:#39ff14">P1: ${window.p1Wins}</b> vs <b style="color:#ff2a2a">P2: ${window.p2Wins}</b></div>`
      : `<div style="font-family: Rajdhani; color: #eee; font-size: 1.2rem;">The enemy was defeated! Your skill grows.<br><br><b style="color:#39ff14">Score Gained: ${roundScore}</b></div>`;

    Swal.fire({
      title: `<span style="font-family: Orbitron; color: #39ff14; letter-spacing: 2px;">${finalTitle}</span>`,
      html: finalHtml,
      icon: 'success',
      background: 'rgba(10, 10, 15, 0.98)',
      showCancelButton: true,
      confirmButtonText: isMultiplayer ? 'NEXT ROUND' : 'NEXT LEVEL',
      cancelButtonText: 'MAIN MENU',
      confirmButtonColor: '#39ff14',
      cancelButtonColor: '#444',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        if (isMultiplayer) restartGame();
        else nextRound();
      } else {
        mainMenu();
      }
    });
    return;
  }

  safeText('gameOverTitle', message);
  safeText('winnerText', message);
}

function resumeGame() {
  document.getElementById('pauseMenu').classList.add('hidden');
  isPaused = false;
}

function mainMenu() {
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('shopScreen').classList.add('hidden');
  document.getElementById('settingsMenu').classList.add('hidden'); // Hide settings
  document.getElementById('mainMenu').classList.remove('hidden');

  gameRunning = false;
  isPaused = true;
  playMenuMusic();
  if (window.updateShopUI) window.updateShopUI();
}

function toggleFullscreen() {
  const container = document.getElementById('gameContainer');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(() => { });
  } else {
    document.exitFullscreen();
  }
}



window.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') e.preventDefault();

  keys[e.key] = true;
  keys[e.key.toLowerCase()] = true;
  keys[e.code] = true;

  triggers[e.key] = true;
  triggers[e.key.toLowerCase()] = true;
  triggers[e.code] = true;

  if (e.code === 'Escape' || e.key.toLowerCase() === 'p') {
    if (gameRunning && !isPaused) {
      isPaused = true;
      document.getElementById('pauseMenu').classList.remove('hidden');
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
  keys[e.key.toLowerCase()] = false;
  keys[e.code] = false;

  triggers[e.key] = false;
  triggers[e.key.toLowerCase()] = false;
  triggers[e.code] = false;
});

// --- AUTOPLAY / AUTO-START LOGIC ---
window.addEventListener('DOMContentLoaded', () => {
  if (window.isFarming) return; // Don't auto-start in farm mode
  // Try to start music on first click anywhere (Browser requirement)
  document.body.addEventListener('click', () => {
    if (!gameRunning) playMenuMusic();
  }, { once: true });
  const isAutoplay = sessionStorage.getItem('fighterPro_autoplay') === 'true';
  const skipCountdown = sessionStorage.getItem('fighterPro_skipCountdown') === 'true';

  if (isAutoplay) {
    sessionStorage.removeItem('fighterPro_autoplay'); // Consumed
    sessionStorage.removeItem('fighterPro_skipCountdown');

    const mode = sessionStorage.getItem('fighterPro_mode');
    const isPvP = (mode === 'pvp');

    if (skipCountdown) {
      // Just start immediately (Next Level case)
      startGame(isPvP, true);
    } else {
      // Show Countdown (Try Again case)
      let timerInterval;
      Swal.fire({
        title: '<span style="font-family: Orbitron; color: #ffcc00; letter-spacing: 2px;">RESTARTING...</span>',
        html: '<div style="font-family: Rajdhani; color: #eee; font-size: 1.2rem;">Get ready! Round starting in <b></b> seconds.</div>',
        timer: 3000,
        timerProgressBar: true,
        background: 'rgba(10, 10, 15, 0.98)',
        didOpen: () => {
          Swal.showLoading();
          const b = Swal.getHtmlContainer().querySelector('b');
          timerInterval = setInterval(() => {
            b.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then(() => {
        startGame(isPvP, true);
      });
    }
  }
});