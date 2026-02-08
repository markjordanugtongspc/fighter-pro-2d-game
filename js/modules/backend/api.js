// api.js - Centralized Player Stats API for Syncing Modules
// This file acts as the single source of truth for player stats across Campaign and Farm modes.

window.PlayerAPI = {
    /**
     * Retrieves the synchronized stats for the player based on shop upgrades.
     * @returns {Object} An object containing maxHp, baseDmg, speedMult, critChance, and lifesteal.
     */
    getSyncedStats: function () {
        const stats = window.saveData || { hp: 0, dmg: 0, speed: 0, crit: 0, lifesteal: 0, gameLevel: 0 };

        return {
            maxHp: 25 + (stats.hp || 0),
            baseDmg: 2 + (stats.dmg || 0),
            speedMult: 1.0 + (stats.speed || 0),
            critChance: (stats.crit || 0) / 100,
            lifesteal: (stats.lifesteal || 0),
            gameLevel: (stats.gameLevel || 0)
        };
    },

    /**
     * Calculates the HP percentage for HUD visualization.
     * Base HP is 25.
     * @param {number} currentHp The player's current health.
     * @param {number} maxHp The player's maximum health.
     * @returns {string} Formatted percentage string.
     */
    getHpPercent: function (currentHp, maxHp) {
        if (!maxHp) return "0%";
        return Math.round((currentHp / maxHp) * 100) + "%";
    },

    /**
     * Formats the detailed Vitality percentage for the HUD (e.g., 380% capacity).
     * @returns {string}
     */
    getVitalityCapacity: function () {
        const stats = this.getSyncedStats();
        // Base 25 = 100% capacity
        return Math.round((stats.maxHp / 25) * 100) + "%";
    },

    /**
     * Retrieves baseline stats for Competitive/Multiplayer mode.
     */
    getCompetitiveStats: function () {
        return { maxHp: 25, baseDmg: 2, speedMult: 1.0, critChance: 0, lifesteal: 0 };
    },

    /**
     * Calculates Enemy AI scaling based on level.
     */
    getAiScaling: function (level) {
        return {
            maxHp: 25 + (level * 7) + (level >= 1 ? 3 : 0),
            baseDmg: 2 + (level * 0.3),
            speedMult: Math.min(1.55, 1.0 + (level * 0.04)),
            critChance: level > 20 ? Math.min(0.25, (level - 20) * 0.01) : 0,
            lifesteal: level > 20 ? Math.min(5, (level - 20) * 0.2) : 0
        };
    }
};
