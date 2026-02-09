// enemy.js – Input-based AI with Level Scaling Reaction

let aiDecisionTimer = 0;
let jitterCounter = 0;
let lastPlayerFacing = null;
let jitterTimer = 0;

// --- PREDICTIVE AI SYSTEM ---
let playerActionHistory = [];
let playerPositionHistory = [];
let predictionConfidence = 0;

function recordPlayerAction(action) {
    playerActionHistory.push({ action, time: Date.now() });
    if (playerActionHistory.length > 15) playerActionHistory.shift();
}

function recordPlayerPosition(x, y) {
    playerPositionHistory.push({ x, y, time: Date.now() });
    if (playerPositionHistory.length > 10) playerPositionHistory.shift();
}

function predictPlayerMovement() {
    if (playerPositionHistory.length < 3) return null;

    const recent = playerPositionHistory.slice(-3);
    const dx = recent[2].x - recent[0].x;
    const dy = recent[2].y - recent[0].y;

    // Predict next position based on velocity
    return {
        predictedX: recent[2].x + dx,
        predictedY: recent[2].y + dy,
        confidence: Math.min(0.35, playerPositionHistory.length / 30) // Max 35% confidence
    };
}

function detectPlayerPattern() {
    if (playerActionHistory.length < 5) return null;

    const recentActions = playerActionHistory.slice(-5);
    const attackCount = recentActions.filter(a => a.action === 'attack').length;
    const jumpCount = recentActions.filter(a => a.action === 'jump').length;

    if (attackCount >= 3) return 'aggressive';
    if (jumpCount >= 2) return 'evasive';
    return 'neutral';
}

window.updateEnemyAI = function () {
    if (isMultiplayer || !p2 || p2.dead || p1.dead) {
        if (p2 && p2.aiKeys) {
            p2.aiKeys.left = false;
            p2.aiKeys.right = false;
            p2.aiKeys.attack = false;
            p2.aiKeys.up = false;
            p2.aiKeys.slide = false;
            p2.aiKeys.run = false;
        }
        return;
    }

    // --- RECORD PLAYER BEHAVIOR ---
    recordPlayerPosition(p1.x, p1.y);
    if (p1.state.startsWith('attack')) recordPlayerAction('attack');
    if (p1.state === 'jump') recordPlayerAction('jump');
    if (p1.state === 'slide') recordPlayerAction('slide');

    // --- JITTER & EXPLOIT DETECTION ---
    jitterTimer++;
    if (p1.facing !== lastPlayerFacing) {
        jitterCounter++;
        lastPlayerFacing = p1.facing;
    }

    // Reset jitter tracking every 1.5 seconds (wider window for detection)
    if (jitterTimer > 90) {
        jitterCounter = 0;
        jitterTimer = 0;
    }

    const isJittering = jitterCounter > 3; // Hyper-sensitive detection for A+D spam
    p2.aiKeys.attack = false;

    aiDecisionTimer++;

    // --- HYPER-REACTION SPEED ---
    // If player exploit is detected, AI reacts 2x faster
    const threshold = isJittering ? 1.0 : 2.5;

    if (aiDecisionTimer < threshold) return;
    aiDecisionTimer -= threshold;

    p2.aiKeys.left = false;
    p2.aiKeys.right = false;
    p2.aiKeys.run = false;

    const dist = p1.x - p2.x;
    const absDist = Math.abs(dist);
    const dy = Math.abs(p1.y - p2.y);

    // --- PREDICTIVE AI BEHAVIOR ---
    const prediction = predictPlayerMovement();
    const pattern = detectPlayerPattern();

    if (prediction && Math.random() < prediction.confidence) {
        // Use predicted position instead of actual position
        const predictedDist = prediction.predictedX - p2.x;

        if (pattern === 'aggressive' && Math.random() < 0.4) {
            // Preemptive dodge if player is attacking frequently
            if (p2.y >= 250 && absDist < 150) {
                p2.aiKeys.up = true;
                setTimeout(() => { if (p2) p2.aiKeys.up = false; }, 150);
            }
        }
    }

    // --- ANTI-EXPLOIT COUNTER-MEASURES ---
    if (isJittering && absDist < 300) {
        p2.aiKeys.run = true;
        // High-priority Backstab: Slide behind the spammer
        if (p2.slideCD === 0) {
            console.log("[AI] Anti-Exploit: Backstab Protocol Engaging");
            p2.aiKeys.left = (dist < 0);
            p2.aiKeys.right = (dist > 0);
            p2.aiKeys.slide = true;
            // Immediate follow-up attack after sliding behind
            setTimeout(() => {
                if (p2) {
                    p2.aiKeys.slide = false;
                    p2.aiKeys.attack = true;
                    // Buffered double attack to punish harder
                    setTimeout(() => { if (p2) p2.aiKeys.attack = true; }, 150);
                }
            }, 100);
            return;
        } else if (p2.y >= 250) {
            // Tactical retreat to bait the spam or jump over
            if (absDist < 120) {
                p2.aiKeys.up = true;
                p2.aiKeys.left = (dist < 0);
                p2.aiKeys.right = (dist > 0);
                setTimeout(() => { if (p2) p2.aiKeys.up = false; }, 150);
            } else {
                p2.aiKeys.left = (dist > 0);
                p2.aiKeys.right = (dist < 0);
            }
        }
    }

    // --- RIGHT CORNER ESCAPE LOGIC ---
    if (p2.x > 850) {
        p2.aiKeys.left = true;
        p2.aiKeys.run = true;
        if (absDist < 115 && dy < 95) p2.aiKeys.attack = true;
        if (p2.y >= 250 && Math.random() < 0.15) {
            p2.aiKeys.up = true;
            setTimeout(() => { if (p2) p2.aiKeys.up = false; }, 150);
        }
    }

    // --- ADVANCED COMBO REACTION SYSTEM ---
    const playerCombo = p1.comboCount || 0;

    if (playerCombo >= 8) {
        p2.aiKeys.left = (dist < 0);
        p2.aiKeys.right = (dist > 0);
        p2.aiKeys.run = true;
        const attackChance = 0.5 + (playerCombo * 0.05);
        if (absDist < 115 && dy < 95 && Math.random() < attackChance) {
            p2.aiKeys.attack = true;
        }
        if (p2.slideCD === 0 && Math.random() < 0.25) {
            p2.aiKeys.slide = true;
            setTimeout(() => { if (p2) p2.aiKeys.slide = false; }, 120);
        }
        aiDecisionTimer = threshold;
    }
    else if (playerCombo === 7) {
        // STAGE 2: ADAPTIVE COUNTER (Combo == 7)
        // Brief evasion then AGGRESSIVE dash-in (FIX: Always run to prevent walk-back exploit)
        if (p2.fleeTimer === undefined) p2.fleeTimer = 0;
        p2.fleeTimer++;

        const retreatFrames = 35; // Reduced retreat time (0.58s)

        if (p2.fleeTimer < retreatFrames) {
            // Tactical retreat + jumping (ALWAYS RUN)
            p2.aiKeys.left = (dist > 0);
            p2.aiKeys.right = (dist < 0);
            p2.aiKeys.run = true; // CRITICAL FIX: Run during retreat
            if (p2.y >= 250 && Math.random() < 0.3) p2.aiKeys.up = true;
        } else {
            // Aggressive pursuit to break the combo (ALWAYS RUN)
            p2.aiKeys.left = (dist < 0);
            p2.aiKeys.right = (dist > 0);
            p2.aiKeys.run = true; // CRITICAL FIX: Run during return

            // More aggressive attack during return
            if (absDist < 140 && dy < 95) {
                p2.aiKeys.attack = true;
            }

            // Slide aggressively if available
            if (p2.slideCD === 0 && absDist > 100 && Math.random() < 0.4) {
                p2.aiKeys.slide = true;
                setTimeout(() => { if (p2) p2.aiKeys.slide = false; }, 120);
            }

            // If combo persists, reset retreat timer occasionally to keep movement dynamic
            if (p2.fleeTimer > 120) p2.fleeTimer = 0;
        }
        aiDecisionTimer = threshold;
    }
    else if (playerCombo === 6) {
        if (p2.fleeTimer === undefined) p2.fleeTimer = 0;
        p2.fleeTimer++;
        if (p2.fleeTimer < 90) {
            p2.aiKeys.left = (dist > 0);
            p2.aiKeys.right = (dist < 0);
            p2.aiKeys.run = true; // CRITICAL FIX: Run during retreat
        } else {
            p2.aiKeys.left = (dist < 0);
            p2.aiKeys.right = (dist > 0);
            p2.aiKeys.run = true; // CRITICAL FIX: Run during return
            if (absDist < 130) p2.aiKeys.attack = true;
        }
        aiDecisionTimer = threshold;
    }
    else {
        p2.fleeTimer = 0;
        if (p2.x <= 880) {
            if (absDist > 85) {
                if (dist > 0) p2.aiKeys.right = true;
                else p2.aiKeys.left = true;
                if (absDist > 300) p2.aiKeys.run = true;
            }
            else if (absDist < 65) {
                if (dist > 0) p2.aiKeys.left = true;
                else p2.aiKeys.right = true;
            }
        }
    }

    // Default Attack Trigger (with prediction)
    if (playerCombo < 6 && absDist < 110 && dy < 95) {
        let attackChance = isJittering ? 0.9 : 0.6;

        // Increase attack chance if pattern is aggressive
        if (pattern === 'aggressive') attackChance += 0.15;

        if (Math.random() < attackChance) p2.aiKeys.attack = true;

        if (!isJittering) {
            p2.aiKeys.left = false;
            p2.aiKeys.right = false;
        } else {
            // Aggressive movement during jitter
            p2.aiKeys.left = (dist < 0);
            p2.aiKeys.right = (dist > 0);
            p2.aiKeys.run = true;
        }
    }

    // Random Actions (reduced when pattern is detected)
    if (playerCombo < 6 && !isJittering) {
        const randomness = pattern === 'neutral' ? 0.02 : 0.01;

        if (p2.y >= 250 && Math.random() < randomness) {
            p2.aiKeys.up = true;
            setTimeout(() => { if (p2) p2.aiKeys.up = false; }, 100);
        }
        if (absDist > 150 && p2.slideCD === 0 && Math.random() < (randomness * 1.5)) {
            p2.aiKeys.slide = true;
            setTimeout(() => { if (p2) p2.aiKeys.slide = false; }, 100);
        }
    }
};
