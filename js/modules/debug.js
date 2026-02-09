// debug.js - Developer Tools & Cheats (Authenticated version)
// USAGE: Open Console (F12) and type: Cheats.login()

window.Cheats = {
    authorized: false,
    godModeActive: false,
    _accessCode: 'admin123', // Hardcoded for demo, normally hashed

    // --- AUTHENTICATION ---
    login: async function () {
        if (typeof Swal === 'undefined') {
            const pwd = prompt("DEVELOPER ACCESS REQUIRED. Enter Password:");
            this._handleLogin(pwd);
            return;
        }

        const { value: password } = await Swal.fire({
            title: '<span style="font-family: Orbitron; color: #ff00ff;">SECURITY CLEARANCE</span>',
            input: 'password',
            inputPlaceholder: 'Enter Access Code',
            background: 'rgba(10, 10, 15, 0.98)',
            color: '#00ffff',
            confirmButtonColor: '#ff00ff',
            inputAttributes: {
                style: 'background: #222; border: 1px solid #ff00ff; color: #fff;'
            }
        });

        this._handleLogin(password);
    },

    _handleLogin: function (pwd) {
        if (pwd === this._accessCode) {
            this.authorized = true;
            console.log("%c 🔓 ACCESS GRANTED. Welcome, Developer.", "color: #00ff00; font-weight: bold; font-size: 14px;");
            this.help();
        } else {
            console.error("❌ ACCESS DENIED. Incorrect credentials.");
        }
    },

    _check: function () {
        if (!this.authorized) {
            console.warn("%c 🔒 ACCESS DENIED. Run 'Cheats.login()' to authenticate.", "color: #ff3333; font-style: italic;");
            return false;
        }
        return true;
    },

    // --- GOD MODE ---
    toggleGodMode: function () {
        if (!this._check()) return;
        this.godModeActive = !this.godModeActive;
        if (this.godModeActive && window.p1) {
            this._originalHit = window.p1.hit;
            window.p1.hit = function () { console.log("🛡️ GOD MODE BLOCKED DAMAGE"); };
            console.log("✅ God Mode ENABLED");
        } else if (window.p1 && this._originalHit) {
            window.p1.hit = this._originalHit;
            console.log("❌ God Mode DISABLED");
        }
    },

    // --- ECONOMY HACKS ---
    addScore: function (amount = 100000) {
        if (!this._check()) return;
        if (window.saveData) {
            window.saveData.score += amount;
            if (window.saveGame) window.saveGame();
            if (window.updateShopUI) window.updateShopUI();
            console.log(`💰 Added ${amount.toLocaleString()} Score!`);
        }
    },

    setLevel: function (lvl) {
        if (!this._check()) return;
        if (window.saveData) {
            window.saveData.gameLevel = lvl;
            if (window.saveGame) window.saveGame();
            console.log(`🆙 Set Level to ${lvl}`);
        }
    },

    // --- STAT MANIPULATION ---
    maxStats: function () {
        if (!this._check()) return;
        if (window.saveData) {
            window.saveData.hp = 500;
            window.saveData.dmg = 100;
            window.saveData.speed = 0.6;
            window.saveData.crit = 50;
            window.saveData.lifesteal = 50;
            if (window.saveGame) window.saveGame();
            if (window.updateShopUI) window.updateShopUI();
            console.log("💪 All Stats MAXED OUT!");
        }
    },

    // --- GAMEPLAY TWEAKS ---
    killAllMobs: function () {
        if (!this._check()) return;
        if (window.farmMobs) {
            window.farmMobs.forEach(mob => mob.hp = 0);
            console.log("💀 All Farm Mobs eliminated.");
        } else if (window.p2) {
            window.p2.hp = 0;
            console.log("💀 Enemy eliminated.");
        }
    },

    help: function () {
        if (!this.authorized) {
            console.log("%c 🔒 COMMANDS HIDDEN. PLEASE LOGIN FIRST. type 'Cheats.login()' ", "background: #330000; color: #ff0000; padding: 5px;");
            return;
        }
        console.group("🛠️ Fighter Pro Developer Cheats");
        console.log("Cheats.toggleGodMode()  - Invincibility");
        console.log("Cheats.addScore(n)      - Add 'n' Score");
        console.log("Cheats.setLevel(n)      - Jump to Level 'n'");
        console.log("Cheats.maxStats()       - Max out all upgrades");
        console.log("Cheats.killAllMobs()    - Instantly kill enemies");
        console.log("Cheats.logout()         - Revoke access");
        console.groupEnd();
    },

    logout: function () {
        this.authorized = false;
        this.godModeActive = false;
        if (window.p1 && this._originalHit) window.p1.hit = this._originalHit;
        console.log("🔒 Access Revoked.");
    }
};

// Auto-Hook God Mode persistence
setInterval(() => {
    if (window.Cheats.authorized && window.Cheats.godModeActive && window.p1 && window.p1.hit !== window.p1._originalHit && !window.p1.hit.toString().includes("GOD MODE")) {
        window.Cheats._originalHit = window.p1.hit;
        window.p1.hit = function () { console.log("🛡️ GOD MODE BLOCKED DAMAGE"); };
    }
}, 1000);

console.log("%c 🛠️ DEBUG MODULE DETECTED. Type Cheats.login() to begin.", "background: #000; color: #00ffff; font-size: 12px; padding: 4px; border-left: 3px solid #ff00ff;");
