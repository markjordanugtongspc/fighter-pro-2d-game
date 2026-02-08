// farm.js - Farming Mode with Mob AI and Reward System

// This module integrates with script.js to use the Fighter class and assets
// It relies on globals: p1, assets, spriteSheets, keys, triggers, preload, stopAllSounds, playHitSFX

const farmCanvas = document.getElementById('gameCanvas');
const farmCtx = farmCanvas.getContext('2d');

farmCanvas.width = 1000;
farmCanvas.height = 500;

// Override globals for script.js compatibility
window.gameRunning = true;
window.isPaused = false;
window.isMultiplayer = false;

// ===== FARM STATE =====
let farmMobs = [];
let farmParticles = [];
let farmScoreTotal = 0;
let farmKillCount = 0;
let farmRewardRate = 25;
let farmRewardTimer = 10800; // 3 minutes in frames (60fps)

// Mob Data
const mobStats = {
    hp: 3,
    dmg: { min: 1, max: 13 },
    speed: 2.2,
    jumpChance: 0.05 // Increased for more activity
};

const mobAnims = {
    idle: { path: 'img/farm/mobs/idle_r/', prefix: 'idle_down_right (', start: 1, end: 4, speed: 4 },
    jump: { path: 'img/farm/mobs/jump_r/', prefix: 'jump_down_right (', start: 1, end: 8, speed: 2.5 },
    jumpFX: { path: 'img/farm/mobs/jump_FX/', prefix: 'jumpFX (', start: 1, end: 8, speed: 2 },
    deathFX: { path: 'img/farm/mobs/death_FX/', prefix: 'deathFX (', start: 1, end: 7, speed: 2.5 }
};

let mobSprites = {};

// ===== MOB CLASS =====
class FarmMob {
    constructor(side) {
        this.x = side === 'left' ? -50 : 1050;
        this.y = 250;
        this.vx = 0;
        this.vy = 0;
        this.hp = mobStats.hp;
        this.maxHp = mobStats.hp;
        this.state = 'idle';
        this.frame = 1;
        this.timer = 0;
        this.facing = side === 'left'; // Looking right if from left
        this.jumpCD = 60;
        this.atkCD = 0;
        this.dead = false;
    }

    update() {
        if (this.dead) return;

        // Physics
        this.vy += 0.75;
        this.y += this.vy;
        if (this.y >= 250) {
            this.y = 250;
            this.vy = 0;
        }

        // AI: Move to player
        if (typeof p1 === 'undefined' || !p1) return;
        const dist = p1.x - this.x;
        const absDist = Math.abs(dist);
        this.facing = dist > 0;

        if (absDist > 70) {
            this.vx = (dist > 0 ? 1 : -1) * mobStats.speed;
        } else {
            this.vx = 0;
            // Attack player
            if (this.atkCD <= 0) {
                const dmg = Math.floor(Math.random() * (mobStats.dmg.max - mobStats.dmg.min + 1)) + mobStats.dmg.min;

                // Trigger Engine Hit (State change + Knockback)
                p1.hit(dmg, this.x);
                p1.slowTimer = 150; // 2.5s hit-slow effect

                // Trigger Visual FX
                if (typeof hitFx !== 'undefined') {
                    window.hitFx = { active: true, frame: 1, timer: 0, x: p1.x + 100, y: p1.y + 100 };
                }

                this.atkCD = 100; // Slower attack rate for mobs
                createDamageText(p1.x + 125, p1.y + 80, `-${dmg} HP`, '#ff3333');

                if (p1.hp <= 0) {
                    handlePlayerDeath();
                }
            }
        }

        this.x += this.vx;

        // Random Jump (Higher frequency)
        if (this.jumpCD <= 0 && this.y >= 250 && Math.random() < mobStats.jumpChance) {
            this.vy = -12;
            this.jumpCD = 40; // Reduced CD for frequent jumping
            spawnEffect(this.x, this.y, 'jumpFX');
        }

        if (this.jumpCD > 0) this.jumpCD--;
        if (this.atkCD > 0) this.atkCD--;

        // Anim
        this.timer++;
        const anim = mobAnims[this.y < 250 ? 'jump' : 'idle'];
        if (this.timer >= anim.speed) {
            this.timer = 0;
            this.frame++;
            if (this.frame > anim.end) this.frame = anim.start;
        }
    }

    render() {
        if (this.dead) return;
        const anim = mobAnims[this.y < 250 ? 'jump' : 'idle'];
        const sheet = mobSprites[this.y < 250 ? 'jump' : 'idle'];
        if (!sheet) return;
        const img = sheet[this.frame - anim.start];

        if (img && img.complete && img.naturalWidth > 0) {
            farmCtx.save();
            // Aligned with script.js translation logic (Centering sprites)
            farmCtx.translate(this.x + 125, this.y + 125);
            if (!this.facing) farmCtx.scale(-1, 1);

            // Draw at 250x250 to match player engine scale for NPC alignment
            farmCtx.drawImage(img, -125, -125, 250, 250);
            farmCtx.restore();

            // HP Bar (Above the 250px sprite block)
            const barW = 60;
            farmCtx.fillStyle = 'rgba(0,0,0,0.6)';
            farmCtx.fillRect(this.x + 95, this.y + 50, barW, 6);
            farmCtx.fillStyle = '#ff2a2a';
            farmCtx.shadowBlur = 5;
            farmCtx.shadowColor = '#ff2a2a';
            farmCtx.fillRect(this.x + 95, this.y + 50, (this.hp / this.maxHp) * barW, 6);
            farmCtx.shadowBlur = 0;
        }
    }

    takeHit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
        farmKillCount++;
        farmScoreTotal += farmRewardRate;

        // Push stats to global shop
        if (window.saveData) {
            window.saveData.score += farmRewardRate;
            localStorage.setItem('fighterProSave', JSON.stringify(window.saveData));
        }

        spawnEffect(this.x, this.y, 'deathFX');
        if (window.playMobPopSFX) window.playMobPopSFX();
        // SUBTITLE: Reward Earned (Smaller, central)
        createDamageText(this.x + 125, this.y + 50, `+${farmRewardRate}`, '#00ff00', 14);
        updateHUD();

        // Slower respawn
        setTimeout(() => {
            farmMobs = farmMobs.filter(m => m !== this);
            if (farmMobs.length < 3) spawnMob();
        }, 100);
    }
}

// ===== EFFECTS & PARTICLES =====
class FarmEffect {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.frame = mobAnims[type].start;
        this.timer = 0;
        this.dead = false;
    }
    update() {
        const anim = mobAnims[this.type];
        this.timer++;
        if (this.timer >= anim.speed) {
            this.timer = 0;
            this.frame++;
            if (this.frame > anim.end) this.dead = true;
        }
    }
    render() {
        const sheet = mobSprites[this.type];
        if (!sheet) return;
        const img = sheet[this.frame - mobAnims[this.type].start];
        if (img && img.complete && img.naturalWidth > 0) {
            farmCtx.drawImage(img, this.x, this.y, 100, 100);
        }
    }
}

function spawnEffect(x, y, type) {
    farmParticles.push(new FarmEffect(x, y, type));
}

function createDamageText(x, y, text, color, fontSize = 22) {
    farmParticles.push({
        x: x, y: y, text: text, color: color, life: 60, vy: -1.5, fontSize: fontSize,
        update() { this.y += this.vy; this.life--; this.dead = this.life <= 0; },
        render() {
            farmCtx.save();
            farmCtx.font = `900 ${this.fontSize}px Orbitron`;
            farmCtx.fillStyle = this.color;
            farmCtx.shadowBlur = 10;
            farmCtx.shadowColor = this.color;
            farmCtx.fillText(this.text, this.x, this.y);
            farmCtx.restore();
        }
    });
}

// ===== CORE LOGIC =====
function spawnMob() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    farmMobs.push(new FarmMob(side));
}

function updateHUD() {
    document.getElementById('farmScore').textContent = farmScoreTotal.toLocaleString();
    document.getElementById('mobsKilled').textContent = farmKillCount;
    document.getElementById('currentReward').textContent = farmRewardRate;

    // Shop Stats
    if (window.PlayerAPI) {
        const synced = window.PlayerAPI.getSyncedStats();
        document.getElementById('farmDmg').textContent = synced.baseDmg;
        document.getElementById('farmLevel').textContent = (synced.gameLevel || 1);
    }

    // HP Update
    if (typeof p1 !== 'undefined' && p1) {
        const percent = (p1.hp / p1.maxHp) * 100;
        document.getElementById('playerHpBar').style.width = percent + '%';

        // Use Vitality Capacity Percentage (Base 25 = 100%) for consistency with Shop/Campaign
        const vitPercent = Math.round((p1.hp / 25) * 100);
        document.getElementById('playerHpText').textContent = vitPercent + '%';

        // Revert BIO-SCAN label to standard
        const scanLabel = document.querySelector('.flex.flex-col.gap-1 span');
        if (scanLabel) {
            scanLabel.textContent = `BIO-SCAN`;
        }
    }
}

function handlePlayerDeath() {
    window.gameRunning = false;
    if (window.stopAllSounds) window.stopAllSounds();
    if (window.playDefeatSFX) window.playDefeatSFX();

    Swal.fire({
        title: '<span style="font-family: Orbitron; color: #ff2a2a; letter-spacing: 2px; font-size: 1.2rem;">VITALITY ZERO</span>',
        html: `<div style="font-family: Rajdhani; color: #eee; font-size: 1rem;">The farm was too dangerous for you...<br><br><b style="color:#ffcc00">Total Gathered: ${farmScoreTotal}</b><br><b style="color:#ff2a2a">Mobilizers Neutralized: ${farmKillCount}</b></div>`,
        icon: 'error',
        iconColor: '#ff2a2a',
        background: 'rgba(10, 10, 15, 0.98)',
        confirmButtonText: 'REDEPLOY',
        cancelButtonText: 'EVACUATE',
        showCancelButton: true,
        confirmButtonColor: '#ff2a2a',
        cancelButtonColor: '#444',
        allowOutsideClick: false,
        customClass: {
            popup: 'swal2-popup-standard'
        }
    }).then((result) => {
        if (result.isConfirmed) location.reload();
        else window.location.href = 'index.html';
    });
}

function checkFarmAttacks() {
    if (typeof p1 === 'undefined' || !p1) return;

    // Check if player is in attack state and hasn't hit this frame sequence
    if (p1.state.startsWith('attack') && !p1.hasHit) {
        // PROFESSIONAL HITBOX SYNC (Matches script.js calibration)
        // Check frame-perfect windows for strikes
        const isStrikeFrame = (
            (p1.state === 'attack1' && p1.frame >= 66 && p1.frame <= 68) ||
            (p1.state === 'attack2' && p1.frame >= 71 && p1.frame <= 75) ||
            (p1.state === 'attack3' && p1.frame >= 79 && p1.frame <= 82)
        );

        if (isStrikeFrame) {
            farmMobs.forEach(mob => {
                if (mob.dead) return;

                const dx = Math.abs(p1.x - mob.x);
                const dy = Math.abs(p1.y - mob.y);

                // DIRECTIONAL HIT DETECTION: Prevent AFK hit-all
                const isLookingAtMob = p1.facing ? (mob.x > p1.x - 20) : (mob.x < p1.x + 20);

                // Using standard engine reach: 115 H, 95 V
                if (dx < 115 && dy < 95 && isLookingAtMob) {
                    p1.hasHit = true;
                    mob.takeHit(p1.baseDmg);

                    // Visual/Audio Feedback
                    if (window.playHitSFX) window.playHitSFX();
                    if (typeof hitFx !== 'undefined') {
                        // Trigger the global hit effect from script.js
                        window.hitFx = {
                            active: true,
                            frame: 1,
                            timer: 0,
                            x: (p1.x + mob.x) / 2 + 100,
                            y: p1.y + 100
                        };
                    }

                    // Shake the container (Global shake from script.js)
                    if (typeof shake !== 'undefined') window.shake = 8;

                    const dmgText = (window.PlayerAPI) ? window.PlayerAPI.getSyncedStats().baseDmg : p1.baseDmg;
                    // HEADER: Damage (Bold, Right-aligned from center)
                    createDamageText(mob.x + 185, mob.y + 80, `-${dmgText} HP`, '#ff0000', 24);
                }
            });
        }
    }
}

function updateRewardLogic() {
    farmRewardTimer--;
    if (farmRewardTimer <= 0) {
        farmRewardTimer = 10800; // Reset 3m
        if (farmRewardRate < 1500) farmRewardRate++;
        else farmRewardRate = 25;
        updateHUD();
    }

    // Display Timer
    const mins = Math.floor(farmRewardTimer / 3600);
    const secs = Math.floor((farmRewardTimer % 3600) / 60);
    document.getElementById('rewardTimerDisp').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== RENDER LOOP =====
let bgWind = 0;

function drawModernBackground() {
    bgWind += 0.02;

    // Sky (Deep Indigo RPG Sky)
    const sky = farmCtx.createLinearGradient(0, 0, 0, 250);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(1, '#1e1b4b');
    farmCtx.fillStyle = sky;
    farmCtx.fillRect(0, 0, 1000, 250);

    // Distant RPG Mountains
    farmCtx.fillStyle = '#1e293b';
    farmCtx.beginPath();
    farmCtx.moveTo(0, 250);
    farmCtx.lineTo(100, 180);
    farmCtx.lineTo(250, 250);
    farmCtx.lineTo(400, 150);
    farmCtx.lineTo(600, 250);
    farmCtx.lineTo(800, 170);
    farmCtx.lineTo(1000, 250);
    farmCtx.fill();

    // Ground (Emerald RPG Field)
    const ground = farmCtx.createLinearGradient(0, 250, 0, 500);
    ground.addColorStop(0, '#064e3b');
    ground.addColorStop(0.3, '#065f46');
    ground.addColorStop(1, '#022c22');
    farmCtx.fillStyle = ground;
    farmCtx.fillRect(0, 250, 1000, 250);

    // RPG Atmospheric Mist
    const mist = farmCtx.createLinearGradient(0, 200, 0, 300);
    mist.addColorStop(0, 'transparent');
    mist.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
    mist.addColorStop(1, 'transparent');
    farmCtx.fillStyle = mist;
    farmCtx.fillRect(0, 200, 1000, 100);

    // Decorative Field Elements (Bushes/Small Trees)
    farmCtx.fillStyle = '#064e3b';
    const drawBush = (x, y, scale) => {
        const sway = Math.sin(bgWind + x) * 2;
        farmCtx.beginPath();
        farmCtx.arc(x + sway, y, 20 * scale, 0, Math.PI * 2);
        farmCtx.arc(x - 15 + sway, y + 10, 15 * scale, 0, Math.PI * 2);
        farmCtx.arc(x + 15 + sway, y + 10, 15 * scale, 0, Math.PI * 2);
        farmCtx.fill();
    };

    drawBush(150, 240, 1.2);
    drawBush(450, 245, 0.8);
    drawBush(750, 235, 1.5);
    drawBush(900, 250, 1.0);

    // Subtle Grid Overlay
    farmCtx.strokeStyle = 'rgba(16, 185, 129, 0.03)';
    farmCtx.lineWidth = 1;
    for (let i = 0; i < 1000; i += 100) {
        farmCtx.beginPath(); farmCtx.moveTo(i, 250); farmCtx.lineTo(i, 500); farmCtx.stroke();
    }
}

function farmLoop() {
    if (!window.gameRunning) return;

    // Clear and draw RPG BG
    drawModernBackground();

    // Updates
    if (typeof p1 !== 'undefined' && p1) p1.update();
    farmMobs.forEach(m => m.update());
    farmParticles.forEach(p => p.update());
    farmParticles = farmParticles.filter(p => !p.dead);

    checkFarmAttacks();
    updateRewardLogic();
    updateHUD();

    // Renders
    if (typeof p1 !== 'undefined' && p1) p1.render();
    farmMobs.forEach(m => m.render());
    farmParticles.forEach(p => p.render());

    requestAnimationFrame(farmLoop);
}

// ===== INITIALIZE =====
async function initFarm() {
    // 1. Preload Player Assets
    if (window.preload) await window.preload();

    // 2. Load Mob Sprites
    for (const key in mobAnims) {
        const anim = mobAnims[key];
        mobSprites[key] = [];
        for (let i = anim.start; i <= anim.end; i++) {
            const img = new Image();
            img.src = `${anim.path}${anim.prefix}${i}).png`;
            mobSprites[key].push(img);
            await new Promise(r => img.onload = r);
        }
    }

    // 3. Setup Global p1 (Fighter)
    p1 = new Fighter(450, true, 1);

    // 4. Initial Spawns
    for (let i = 0; i < 3; i++) spawnMob();

    // 5. Start
    farmLoop();
    if (window.startGameMusic) window.startGameMusic();
}

initFarm();
