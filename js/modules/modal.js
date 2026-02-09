/**
 * modal.js - Handles popups using SweetAlert2
 */

// Global state for paging
let currentInstrPage = 1;

window.toggleInstructions = function () {
    currentInstrPage = 1; // Always start at 1
    showInstructionPage(1);
};

function showInstructionPage(page) {
    Swal.fire({
        title: '<span style="font-family: Orbitron; color: #00ffff; letter-spacing: 2px;">HOW TO PLAY</span>',
        html: `
            <div id="swal-instructions-content" style="font-family: Rajdhani; color: #eee; text-align: left; font-size: 1.1rem; min-height: 220px;">
                ${getInstrContent(page)}
            </div>
        `,
        background: 'rgba(10, 10, 15, 0.98)',
        color: '#eee',
        showConfirmButton: true,
        confirmButtonText: 'CLOSE',
        confirmButtonColor: '#444',
        width: '550px',
        backdrop: 'rgba(0,0,0,0.85) blur(10px)',
        footer: `
            <div style="display: flex; align-items: center; gap: 25px; font-family: Orbitron;">
                <button class="swal-nav-arrow" onclick="navInstr(-1)" style="${page === 1 ? 'opacity:0.3; pointer-events:none;' : ''}">&larr;</button>
                <div style="font-size: 0.8rem; color: #666; letter-spacing: 3px;">PAGE ${page} / 3</div>
                <button class="swal-nav-arrow" onclick="navInstr(1)" style="${page === 3 ? 'opacity:0.3; pointer-events:none;' : ''}">&rarr;</button>
            </div>
        `,
        customClass: {
            popup: 'swal-custom-glass'
        }
    });
}

window.navInstr = function (dir) {
    currentInstrPage += dir;
    if (currentInstrPage < 1) currentInstrPage = 1;
    if (currentInstrPage > 3) currentInstrPage = 3;
    showInstructionPage(currentInstrPage);
};

function getInstrContent(page) {
    if (page === 1) {
        return `
            <div id="swal-page-1">
                <h3 style="color: #ff8800; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 15px;">CAMPAIGN CONTROLS</h3>
                <p><b>A / D</b> &mdash; Move</p>
                <p><b>SHIFT</b> &mdash; Run</p>
                <p><b>SPACE</b> &mdash; Jump</p>
                <p><b>F</b> &mdash; Attack</p>
                <p><b>S</b> &mdash; Slide</p>
                <p style="margin-top: 20px; color: #666; font-size: 0.9rem; border-top: 1px dashed #333; padding-top: 10px;">
                  Stats: <span style="color:#39ff14">Base HP 25</span> | <span style="color:#ff2a2a">Hit Dmg ~2</span>
                </p>
            </div>
        `;
    } else if (page === 2) {
        return `
            <div id="swal-page-2">
                <h3 style="color: #00ffff; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 15px;">1 VS 1 MODE</h3>
                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 48%; border-right: 1px solid #333; padding-right: 15px;">
                        <h4 style="color: #ff2a2a; margin-bottom: 10px;">PLAYER 1</h4>
                        <p>A/D &nbsp; Move</p>
                        <p>SHIFT Running</p>
                        <p>F &nbsp; Attack</p>
                        <p>S &nbsp; Slide</p>
                    </div>
                    <div style="width: 48%; padding-left: 15px;">
                        <h4 style="color: #00ffff; margin-bottom: 10px;">PLAYER 2</h4>
                        <p>←/→ &nbsp; Move</p>
                        <p>SHIFT Running</p>
                        <p>ENTER Attack</p>
                        <p>L &nbsp; Slide</p>
                    </div>
                </div>
            </div>
        `;
    } else if (page === 3) {
        return `
            <div id="swal-page-3">
                <h3 style="color: #39ff14; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 15px;">PRO TIPS</h3>
                <p style="margin-bottom: 8px;"><b style="color: #ff8800;">Combo Scaling:</b> Dmg spikes <span style="color:#fff">+50%</span> per hit! Combos are lethal.</p>
                <p style="margin-bottom: 8px;"><b style="color: #ff2a2a;">Combo Breaker:</b> Getting hit resets your counter. Keep the pressure!</p>
                <p style="margin-bottom: 8px;"><b style="color: #00ffff;">Precision:</b> Heights must match for hits to register. Air battles count.</p>
                <p><b style="color: #fff;">Shop Strategy:</b> High <span style="color:#0ff">Agility</span> counters the enemy escape slide logic!</p>
            </div>
        `;
    }
    return '';
}

// Developer Info Toast
window.toggleDevInfo = function () {
    const devBtn = document.getElementById('devInfoBtn');
    const rect = devBtn.getBoundingClientRect(); // get icon position

    // Indicators: adjust these offsets to move toast
    const offsetX = 8;   // ➡ horizontal offset (right of icon)
    const offsetY = -52; // ⬆ vertical offset (above icon)

    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-start', // base, overridden by fixed positioning
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: 'rgba(10, 10, 15, 0.95)',
        color: '#eee',
        padding: '0.20rem 0.4rem',
        didOpen: (toast) => {
            // Anchor toast relative to icon
            toast.style.position = 'fixed';
            toast.style.left = `${rect.right + offsetX}px`; // ➡ move right
            toast.style.top = `${rect.top + offsetY}px`;     // ⬆ move above

            // Tooltip-like styling
            toast.style.width = '150px';
            toast.style.fontSize = '0.55rem';
            toast.style.border = '1px solid #333';
            toast.style.borderRadius = '50px';
            toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
            toast.style.textAlign = 'left';

            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        title: '<span style="font-family: Orbitron; font-size: 0.5rem; color: #888; letter-spacing: 1px;">DEVELOPER</span>',
        html: `
            <div style="font-family: Rajdhani; margin-top: -4px;">
                <b style="color: #00ffff; font-size: 0.7rem;">@WizKhalifaX_</b>
                <div style="font-size: 0.5rem; color: #444; margin-top: 1px;">v1.5.0 Performance</div>
            </div>
        `
    });
};

/* Additional styles for arrows (should be in style.css but added inline helper here) */
const style = document.createElement('style');
style.innerHTML = `
    .swal-nav-arrow {
        background: transparent;
        border: 1px solid #444;
        color: #0ff;
        font-size: 1.5rem;
        padding: 5px 20px;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 4px;
    }
    .swal-nav-arrow:hover {
        background: rgba(0, 255, 255, 0.1);
        border-color: #0ff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    }
`;
document.head.appendChild(style);

