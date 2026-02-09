// settings.js - Persistent Game Settings, UI Pagination, and Pause System

/**
 * Global Settings State
 */
window.GameSettings = {
    volume: parseInt(localStorage.getItem('fighterPro_volume')) || 80, // Default 80%
    isFullscreen: false
};

/**
 * Initialize Settings UI and Logic
 */
function initSettings() {
    const slider = document.getElementById('volume-slider');
    const text = document.getElementById('volume-text');
    const iconContainer = document.getElementById('volume-icon-container');

    if (!slider || !text || !iconContainer) {
        return;
    }

    // SVG Templates (Cyberpunk/Minimalist)
    const icons = {
        mute: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 0 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" /></svg>`,
        low: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06Z" /></svg>`,
        high: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" /></svg>`
    };

    /**
     * Update Volume Settings
     * @param {number} value 0-100
     */
    window.setAudioVolume = function (value) {
        window.GameSettings.volume = value;
        localStorage.setItem('fighterPro_volume', value);

        if (slider) slider.value = value;
        if (text) text.textContent = `${value}%`;

        const activeColor = '#00ffff';
        const trackColor = '#222';
        if (slider) {
            slider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${value}%, ${trackColor} ${value}%, ${trackColor} 100%)`;
        }

        if (iconContainer) {
            if (value == 0) {
                iconContainer.innerHTML = icons.mute;
                iconContainer.style.color = "#666";
            } else {
                iconContainer.style.color = "#00ffff";
                if (value < 50) iconContainer.innerHTML = icons.low;
                else iconContainer.innerHTML = icons.high;
            }
        }

        if (window.updateGlobalVolume) {
            window.updateGlobalVolume(value / 100);
        }
    }

    slider.addEventListener('input', (e) => window.setAudioVolume(e.target.value));
    window.setAudioVolume(window.GameSettings.volume);
}

/**
 * Settings Pagination Logic
 */
window.showSettingsPage = function (pageId) {
    // Hide all pages
    document.querySelectorAll('.settings-page').forEach(p => p.classList.remove('active'));
    // Deactivate all tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // Show target page and activate tab
    document.getElementById(`page-${pageId}`).classList.add('active');
    document.getElementById(`tab-${pageId}`).classList.add('active');
};

// Fullscreen Logic
window.toggleFullscreen = function () {
    const container = document.getElementById('gameContainer');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.warn(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
};

window.openSettings = function () {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('settingsMenu').classList.remove('hidden');
    window.showSettingsPage('general'); // Reset to first page
};

window.closeSettings = function () {
    document.getElementById('settingsMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
};

/**
 * PAUSE SYSTEM LOGIC
 */
window.pauseGame = function () {
    if (!window.gameRunning || window.isPaused) return;

    window.isPaused = true;
    document.getElementById('pauseMenu').classList.remove('hidden');
    if (window.stopGameMusic) window.stopGameMusic();
};

window.resumeGame = function () {
    if (!window.isPaused) return;

    window.isPaused = false;
    document.getElementById('pauseMenu').classList.add('hidden');
    if (window.startGameMusic) window.startGameMusic();
    // Re-trigger loop if it was stopped (script.js loop usually handles this if it's still running)
};

// Global Key Listener for Pause
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'p') {
        if (window.isPaused) {
            window.resumeGame();
        } else {
            window.pauseGame();
        }
    }
});

// Start Init
document.addEventListener('DOMContentLoaded', initSettings);
