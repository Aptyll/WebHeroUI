const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');
const xpBar = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');

// Create level display container and display
const levelContainer = document.createElement('div');
levelContainer.style.position = 'absolute';
levelContainer.style.pointerEvents = 'none';
const levelDisplay = document.createElement('div');
levelDisplay.className = 'level-display';
levelDisplay.textContent = '1';
levelContainer.appendChild(levelDisplay);
gameContainer.appendChild(levelContainer);

// XP System
const xpSystem = {
    currentXP: 0,
    level: 1,
    xpToNextLevel: 100,
    lastXPGain: 0,

    gainXP(amount) {
        this.currentXP += amount;
        this.lastXPGain = Date.now();
        
        // Check for level up
        if (this.currentXP >= this.xpToNextLevel) {
            this.levelUp();
        }
        
        // Update XP bar and text
        this.updateXPDisplay();
    },

    levelUp() {
        // Store current position
        const currentX = playerState.x;
        const currentY = playerState.y;
        
        this.level++;
        this.currentXP = 0;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        playerState.speed += 0.5; // Increase speed slightly with each level
        
        // Update level display
        levelDisplay.textContent = this.level;
        
        // Pass stored position to effects
        this.createLevelUpEffects(currentX, currentY);
    },

    createLevelUpEffects(posX, posY) {
        // Add level up class for flash animation
        player.classList.add('level-up');
        setTimeout(() => player.classList.remove('level-up'), 1000);

        // Create level up text using stored position
        const text = document.createElement('div');
        text.className = 'level-up-text';
        text.textContent = 'Level Up!';
        text.style.left = `${posX + 15}px`;
        text.style.top = `${posY - 30}px`;
        gameContainer.appendChild(text);
        setTimeout(() => text.remove(), 1500);

        // Create particles using stored position
        for (let i = 0; i < 20; i++) {
            this.createParticle(
                posX + 15,
                posY + 15
            );
        }
    },

    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random angle and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;
        
        // Calculate final position
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        // Set initial position
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Set transform variables
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        gameContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    },

    updateXPDisplay() {
        const xpPercentage = (this.currentXP / this.xpToNextLevel) * 100;
        xpBar.style.width = `${xpPercentage}%`;
        xpText.textContent = `Level ${this.level} - ${this.currentXP}/${this.xpToNextLevel} XP`;
    }
};

// Player state
const playerState = {
    x: 0,  // Start at top-left corner
    y: 0,  // Start at top-left corner
    speed: 2,
    velocityX: 0,
    velocityY: 0,
    moving: false
};

// Key state tracking
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Event listeners for smooth movement
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        playerState.moving = true;
        player.classList.add('moving');
        e.preventDefault(); // Prevent scrolling with arrow keys
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
        // Check if any movement keys are still pressed
        if (!Object.values(keys).some(value => value)) {
            playerState.moving = false;
            player.classList.remove('moving');
        }
    }
});

// Game loop
function updateGame() {
    // Calculate velocity based on pressed keys
    playerState.velocityX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    playerState.velocityY = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    // Normalize diagonal movement
    if (playerState.velocityX !== 0 && playerState.velocityY !== 0) {
        playerState.velocityX *= 0.707;
        playerState.velocityY *= 0.707;
    }

    // Update position
    playerState.x += playerState.velocityX * playerState.speed;
    playerState.y += playerState.velocityY * playerState.speed;

    // Get container dimensions
    const containerRect = gameContainer.getBoundingClientRect();
    const playerSize = 40;

    // Contain player within game bounds
    playerState.x = Math.max(0, Math.min(playerState.x, containerRect.width - playerSize));
    playerState.y = Math.max(0, Math.min(playerState.y, containerRect.height - playerSize));

    // Apply position with pixel values
    player.style.transform = `translate(${playerState.x}px, ${playerState.y}px)`;
    
    // Update level display position (centered and higher above player)
    const playerCenter = playerState.x + 20; // player is 40px wide, so center is +20
    levelContainer.style.transform = `translate(${playerCenter - 13}px, ${playerState.y - 40}px)`; // adjusted for new sizes

    // Grant XP for movement
    if (playerState.moving && Date.now() - xpSystem.lastXPGain >= 1000) {
        xpSystem.gainXP(50);
    }

    // Continue the game loop
    requestAnimationFrame(updateGame);
}

// Start the game loop
updateGame();

// Dev Tools
document.getElementById('dev-level-up').addEventListener('click', () => {
    // Set XP to trigger level up
    xpSystem.currentXP = xpSystem.xpToNextLevel;
    xpSystem.gainXP(0); // This will trigger the level up
});