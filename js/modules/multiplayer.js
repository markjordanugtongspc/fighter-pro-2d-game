// Match Persistence System (Match Wins + Lifetime Totals)
const MULTI_STORAGE_KEY = 'fighterPro_pvp_stats';
let mData = JSON.parse(localStorage.getItem(MULTI_STORAGE_KEY)) || { p1Total: 0, p2Total: 0, p1Match: 0, p2Match: 0 };

window.p1Lifetime = mData.p1Total;
window.p2Lifetime = mData.p2Total;
window.p1Wins = mData.p1Match;    // Match Wins (The Dots)
window.p2Wins = mData.p2Match;    // Match Wins (The Dots)

const MATCH_WINS_TARGET = 3;

function saveMultiData() {
    localStorage.setItem(MULTI_STORAGE_KEY, JSON.stringify({
        p1Total: window.p1Lifetime,
        p2Total: window.p2Lifetime,
        p1Match: window.p1Wins,
        p2Match: window.p2Wins
    }));
}

/**
 * Handles Input for Player 2 in Multiplayer Mode
 */
window.getMultiplayerInput = function (codesFunc) {
    const p2Input = {
        left: keys['ArrowLeft'],
        right: keys['ArrowRight'],
        run: keys['ShiftRight'],
        jump: codesFunc(['ArrowUp']),
        attack: codesFunc(['Enter']),
        attackHold: keys['Enter'],
        slide: codesFunc(['l', 'L'])
    };
    if (p2Input.attack) console.log("[P2] Attack Input Detected");
    return p2Input;
};

/**
 * Tracks wins and checks for Match Winner (First to 3)
 */
window.trackMultiplayerWin = function (winnerNum) {
    if (winnerNum === 1) {
        window.p1Wins++;
        window.p1Lifetime++;
    } else if (winnerNum === 2) {
        window.p2Wins++;
        window.p2Lifetime++;
    }

    saveMultiData();
    console.log(`PVP Match - P1 Dots: ${window.p1Wins} | P2 Dots: ${window.p2Wins}`);

    if (window.p1Wins >= MATCH_WINS_TARGET || window.p2Wins >= MATCH_WINS_TARGET) {
        const winnerName = (window.p1Wins >= MATCH_WINS_TARGET) ? "PLAYER 1" : "PLAYER 2";
        showMatchWinner(winnerName);
        return true;
    }
    return false;
};

window.resetMultiplayerMatch = function () {
    // Reset match progress for a fresh contest
    window.p1Wins = 0;
    window.p2Wins = 0;
    saveMultiData();
};

/**
 * Returns the standard baseline stats for competitive play
 * Ensures shop upgrades do not apply in Multiplayer
 */
window.getCompetitiveStats = function () {
    return {
        maxHp: 25,
        baseDmg: 2,
        speedMult: 1.0,
        critChance: 0,
        lifesteal: 0
    };
};

function showMatchWinner(winner) {
    if (window.stopAllSounds) window.stopAllSounds();
    if (window.playDefeatSFX) window.playDefeatSFX();

    Swal.fire({
        title: `<span style="font-family: Orbitron; color: #ffcc00; letter-spacing: 2px;">${winner} IS THE CHAMPION!</span>`,
        html: `<div style="font-family: Rajdhani; color: #eee; font-size: 1.2rem;">Final Match Score<br><b style="color:#39ff14">P1: ${window.p1Wins}</b> vs <b style="color:#ff2a2a">P2: ${window.p2Wins}</b><br><br><small style="color:#888">Total Career Wins - P1: ${window.p1Lifetime} | P2: ${window.p2Lifetime}</small></div>`,
        background: 'rgba(10, 10, 15, 0.98)',
        showCancelButton: true,
        confirmButtonText: 'REMATCH',
        cancelButtonText: 'MAIN MENU',
        confirmButtonColor: '#ff2a2a',
        cancelButtonColor: '#444',
        allowOutsideClick: false,
        backdrop: 'rgba(0,0,0,0.8)'
    }).then((result) => {
        window.resetMultiplayerMatch();
        if (result.isConfirmed) {
            if (window.restartGame) window.restartGame();
        } else {
            if (window.mainMenu) window.mainMenu();
        }
    });
}
