// sound.js - Centralized Audio Management System

let SFX_VOL = 1.0;
let BGM_VOL = 0.3;
let MASTER_VOL = (parseInt(localStorage.getItem('fighterPro_volume')) || 80) / 100;

// Update Master Volume
window.updateGlobalVolume = function (multiplier) {
    MASTER_VOL = multiplier;

    // Update active BGM
    audio.bgm_menu.volume = BGM_VOL * MASTER_VOL;
    audio.bgm_game.volume = BGM_VOL * MASTER_VOL;

    // Update major UI SFX
    audio.hover.volume = 0.5 * MASTER_VOL;
    audio.select.volume = 0.8 * MASTER_VOL;
    audio.defeat.volume = SFX_VOL * MASTER_VOL;
    audio.bgm_win.volume = 0.6 * MASTER_VOL;

    // Mass update arrays
    audio.hits.forEach(s => s.volume = SFX_VOL * MASTER_VOL);
    audio.playerHurt.forEach(s => s.volume = 0.8 * MASTER_VOL);
    audio.mobPop.forEach(s => s.volume = 0.7 * MASTER_VOL);
};

// Audio Assets
const audio = {
    bgm_menu: new Audio('music/bgm/menu/main_menu.mp3'),
    // Pre-load hit sequence 1-10
    hits: [],
    defeat: new Audio('music/bgm/defeat/defeated.mp3'),
    bgm_game: new Audio(window.isFarming ? 'music/bgm/in_game-farm.mp3' : 'music/bgm/in-game.mp3'),
    bgm_win: new Audio('music/bgm/win/level-up.mp3'),
    // UI Sounds
    hover: new Audio('music/bgm/menu/selection/hover.m4a'),
    select: new Audio('music/bgm/menu/selection/select.m4a'),
    // Player Hurt Vocals
    playerHurt: [],
    // Mob Death Sounds
    mobPop: [
        new Audio('music/bgm/hurt/mob/pop-1.m4a'),
        new Audio('music/bgm/hurt/mob/pop-2.m4a')
    ]
};

// Initialize SFX
audio.hover.volume = 0.5 * MASTER_VOL;
audio.select.volume = 0.8 * MASTER_VOL;

for (let i = 1; i <= 5; i++) {
    const sfx = new Audio(`music/bgm/hurt/player-hurt-${i}.m4a`);
    sfx.volume = 0.8 * MASTER_VOL;
    audio.playerHurt.push(sfx);
}
audio.defeat.volume = SFX_VOL * MASTER_VOL;
audio.bgm_win.volume = 0.6 * MASTER_VOL;
// ... rest of init
for (let i = 1; i <= 10; i++) {
    const sfx = new Audio(`music/bgm/hit/hit-${i}.m4a`);
    sfx.volume = SFX_VOL * MASTER_VOL;
    audio.hits.push(sfx);
}

// Hover state tracking
let isHoverMuted = false;
let hoverMuteTimer = null;

/**
 * Play UI Hover SFX
 */
window.playHoverSFX = function () {
    if (isHoverMuted) return; // Guard against hover sound spam during/after click
    audio.hover.currentTime = 0;
    audio.hover.play().catch(e => { });
};

/**
 * Play UI Select/Click SFX
 */
window.playSelectSFX = function () {
    audio.select.currentTime = 0;
    audio.select.play().catch(e => { });

    // Mute hover sound momentarily to avoid overlapping artifacts (0.8s silence)
    isHoverMuted = true;
    clearTimeout(hoverMuteTimer);
    hoverMuteTimer = setTimeout(() => {
        isHoverMuted = false;
    }, 800);
};

// State for Hurt sequence
let hurtIndex = 0;
let lastHurtTime = 0;

/**
 * Play Sequential Player Hurt SFX
 * Cycles 1-5 with a 1.2s cooldown to avoid spam
 */
window.playPlayerHurtSFX = function () {
    const now = Date.now();
    if (now - lastHurtTime < 1200) return; // 1.2s silence gap

    const sfx = audio.playerHurt[hurtIndex];
    sfx.currentTime = 0;
    sfx.play().catch(e => { });

    hurtIndex = (hurtIndex + 1) % 5;
    lastHurtTime = now;
};

/**
 * Play Final Death Vocal (Dramatic Hurt-5)
 */
window.playPlayerDeathSFX = function () {
    const sfx = audio.playerHurt[4]; // Use hurt-5 for death
    sfx.currentTime = 0;
    sfx.volume = 1.0; // Max volume for dramatic effect
    sfx.play().catch(e => { });
};

// State for Mob Pop
let mobPopIndex = 0;

/**
 * Play Alternating Mob Death Pop SFX
 */
window.playMobPopSFX = function () {
    const sfx = audio.mobPop[mobPopIndex];
    sfx.currentTime = 0;
    sfx.volume = 0.7;
    sfx.play().catch(e => { });
    mobPopIndex = (mobPopIndex + 1) % 2;
};

// State
let currentHitIndex = 0;

// Initialization
audio.bgm_menu.loop = true;
audio.bgm_menu.volume = BGM_VOL * MASTER_VOL;

audio.bgm_game.loop = true;
audio.bgm_game.volume = BGM_VOL * MASTER_VOL;

/**
 * Play Menu Music
 */
window.playMenuMusic = function () {
    if (window.stopGameMusic) window.stopGameMusic();
    audio.bgm_menu.play().catch(e => {
        console.log("Audio Error: Browser requires user interaction before playing sound.");
    });
};

/**
 * Stop Menu Music
 */
window.stopMenuMusic = function () {
    audio.bgm_menu.pause();
    audio.bgm_menu.currentTime = 0;
};

/**
 * Play Sequential Hit Sound
 * Cycles 1-9 for normal hits, 10 for "combo/finisher" moments or simply as the 10th hit in sequence.
 */
window.playHitSFX = function () {
    // Get current sound
    const sfx = audio.hits[currentHitIndex];

    // Reset and Play (Allows rapid fire)
    sfx.currentTime = 0;
    sfx.play().catch(e => { });

    // Increment and Loop back to 0 (hit-1)
    currentHitIndex = (currentHitIndex + 1) % 10;
};

/**
 * Play Defeat SFX
 */
window.playDefeatSFX = function () {
    audio.defeat.currentTime = 0;
    audio.defeat.play().catch(e => { });
};

/**
 * Play Win/Level-Up SFX
 */
window.playWinSFX = function () {
    audio.bgm_win.currentTime = 0;
    audio.bgm_win.play().catch(e => { });
};

/**
 * Play Game Background Music
 */
window.startGameMusic = function () {
    // Ensure menu music is stopped
    window.stopMenuMusic();
    audio.bgm_game.play().catch(e => {
        console.log("Audio Error: Game BGM failed to play.");
    });
};

/**
 * Stop Game Background Music
 */
window.stopGameMusic = function () {
    audio.bgm_game.pause();
    audio.bgm_game.currentTime = 0;
};

/**
 * Stop all sound (Utility)
 */
window.stopAllSounds = function () {
    audio.bgm_menu.pause();
    audio.bgm_game.pause();
    audio.defeat.pause();
    audio.bgm_win.pause();
    audio.hover.pause();
    audio.select.pause();
    audio.hits.forEach(s => {
        s.pause();
        s.currentTime = 0;
    });
};

/**
 * Global UI Event Listeners for Buttons
 * Automatically attaches sound to ALL buttons, including modals.
 */
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button') || e.target.closest('[onclick]')) {
        // Prevent double playing if hovering inner elements
        if (e.target.dataset.hovered === 'true') return;
        window.playHoverSFX();
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('[onclick]')) {
        window.playSelectSFX();
    }
});
