// shop.js - Persistence, Level Saving, and Stats

const defaultData = {
    score: 0,
    gameLevel: 0,
    hp: 0,
    speed: 0,
    dmg: 0,
    crit: 0,
    lifesteal: 0
};

// FIX: Attached to window so script.js can see it!
window.saveData = JSON.parse(localStorage.getItem('fighterProSave')) || { ...defaultData };

function saveGame() {
    localStorage.setItem('fighterProSave', JSON.stringify(window.saveData));
    updateShopUI();
}

function resetProgress() {
    if (confirm("Are you sure? This will wipe all stats and level progress.")) {
        localStorage.removeItem('fighterProSave');
        location.reload();
    }
}

function addProgress(scoreAmount, levelUp) {
    // Prevent progression in Multiplayer Mode
    if (window.isMultiplayer) return;

    window.saveData.score += scoreAmount;
    if (levelUp) {
        window.saveData.gameLevel++;
        console.log("Level Up! New Level:", window.saveData.gameLevel);
    }
    saveGame();
}

function openShop() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('shopScreen').classList.remove('hidden');
    updateShopUI();
}

function closeShop() {
    document.getElementById('shopScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}


function getCostMult() {
    const level = window.saveData.gameLevel || 0;

    // --- EXPONENTIAL SCALING FOR HIGH LEVELS ---
    // Forces players to farm more at higher levels
    if (level > 200) {
        // Level 200+: 10x base cost + additional scaling
        return 10 + Math.floor((level - 200) / 5);
    } else if (level > 125) {
        // Level 125-200: Exponential ramp from 4x to 10x
        const progress = (level - 125) / 75; // 0 to 1
        return 4 + Math.floor(progress * 6);
    } else if (level > 75) {
        // Level 75-125: Moderate scaling 2x to 4x
        return 2 + Math.floor((level - 75) / 25);
    } else {
        // Level 0-75: Linear scaling (every 10 levels)
        return 1 + Math.floor(level / 10);
    }
}

function buyItem(type) {
    let baseCost = 0;
    let data = window.saveData;
    const mult = getCostMult();

    if (type === 'hp') baseCost = 2500;
    else if (type === 'speed') baseCost = 2000;
    else if (type === 'dmg') baseCost = 4000;
    else if (type === 'crit') baseCost = 5000;
    else if (type === 'lifesteal') baseCost = 8000;

    let finalCost = baseCost * mult;

    if (type === 'hp' && data.score >= finalCost) {
        data.score -= finalCost;
        data.hp += 5;
    } else if (type === 'speed' && data.score >= finalCost && data.speed < 0.6) {
        data.score -= finalCost;
        data.speed += 0.05; // Nerfed from 0.1
    } else if (type === 'dmg' && data.score >= finalCost) {
        data.score -= finalCost;
        data.dmg += 1;
    } else if (type === 'crit' && data.score >= finalCost && data.crit < 50) {
        data.score -= finalCost;
        data.crit += 5;
    } else if (type === 'lifesteal' && data.score >= finalCost) {
        data.score -= finalCost;
        data.lifesteal += 1;
    }

    saveGame();
}

function updateShopUI() {
    function txt(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    const data = window.saveData;
    const mult = getCostMult();

    txt('menuScore', data.score);
    txt('menuLevel', data.gameLevel + 1);
    txt('shopScore', data.score);

    // HP Visualization: Shows total capacity percentage (Base 25 = 100%)
    const vitality = (window.PlayerAPI) ? window.PlayerAPI.getVitalityCapacity() : "100%";
    txt('bonusHpDisplay', vitality);

    // Speed Cap Visualization
    const speedBtn = document.querySelector(`[onclick="buyItem('speed')"]`);
    if (data.speed >= 0.6) {
        txt('bonusSpdDisplay', "MAX");
        txt('cost-speed', "---");
        if (speedBtn) {
            speedBtn.classList.add('disabled-item');
            speedBtn.onclick = null;
            speedBtn.innerHTML = `<div class="item-name">Agility (MAXED)</div><div class="item-cost">---</div><div class="item-desc">Speed Cap Reached</div>`;
        }
    } else {
        txt('bonusSpdDisplay', data.speed.toFixed(1));
        txt('cost-speed', (2000 * mult).toLocaleString() + ' Pts');
    }
    txt('bonusDmgDisplay', data.dmg);
    txt('bonusCritDisplay', data.crit);
    txt('bonusLifeDisplay', data.lifesteal);

    // Update dynamic cost labels
    txt('cost-hp', (2500 * mult).toLocaleString() + ' Pts');
    txt('cost-dmg', (4000 * mult).toLocaleString() + ' Pts');
    if (data.speed < 0.6) txt('cost-speed', (2000 * mult).toLocaleString() + ' Pts');
    txt('cost-crit', (5000 * mult).toLocaleString() + ' Pts');
    txt('cost-lifesteal', (8000 * mult).toLocaleString() + ' Pts');
}

// Initialize
updateShopUI();