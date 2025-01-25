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
        // Apply XP multiplier
        const multipliedXP = Math.floor(amount * upgradeSystem.upgrades.xpMultiplier.effect);
        this.currentXP += multipliedXP;
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
        
        // Add upgrade points
        upgradeSystem.addPoints(3);
        
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

// Upgrade system
const upgradeSystem = {
    points: 0,
    upgrades: {
        size: { level: 0, maxLevel: 7, effect: 1.0 },
        xpMultiplier: { level: 0, maxLevel: 7, effect: 1.0 },
        spawnRate: { level: 0, maxLevel: 7, effect: 1.0 }
    },
    
    addPoints(amount) {
        this.points += amount;
        this.updateDisplay();
    },
    
    updateDisplay() {
        document.getElementById('points-display').textContent = this.points;
        
        // Update upgrade buttons
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            const button = document.getElementById(`${key}-upgrade`);
            if (button) {
                const levelSpan = button.querySelector('.level');
                levelSpan.textContent = `${upgrade.level}/${upgrade.maxLevel}`;
                button.disabled = this.points === 0 || upgrade.level >= upgrade.maxLevel;
            }
        }
    },
    
    upgrade(type) {
        const upgrade = this.upgrades[type];
        if (this.points > 0 && upgrade.level < upgrade.maxLevel) {
            this.points--;
            upgrade.level++;
            
            // Update effect based on type
            switch(type) {
                case 'size':
                    upgrade.effect = 1 + (upgrade.level * 0.1); // 10% increase per level
                    playerState.updateSize();
                    break;
                case 'xpMultiplier':
                    upgrade.effect = 1 + (upgrade.level * 0.15); // 15% increase per level
                    break;
                case 'spawnRate':
                    upgrade.effect = 1 + (upgrade.level * 0.12); // 12% increase per level
                    break;
            }
            
            this.updateDisplay();
        }
    }
};

// Square system
class Square {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'resource-square';
        this.size = 30;
        
        // Random position within game container
        const containerRect = gameContainer.getBoundingClientRect();
        this.x = Math.random() * (containerRect.width - this.size);
        this.y = Math.random() * (containerRect.height - this.size);
        
        // Apply styles
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        
        gameContainer.appendChild(this.element);
    }

    destroy() {
        // Create destruction particles
        for (let i = 0; i < 8; i++) {
            xpSystem.createParticle(this.x + this.size/2, this.y + this.size/2);
        }
        this.element.remove();
    }
}

// Square management
class SquareManager {
    constructor() {
        this.squares = [];
        this.baseSpawnInterval = 2000; // Base spawn interval in milliseconds
        this.lastSpawnTime = Date.now();
        this.maxSquares = 15;
    }
    
    getSpawnInterval() {
        // Faster spawn rate = smaller interval
        return this.baseSpawnInterval / upgradeSystem.upgrades.spawnRate.effect;
    }
    
    update() {
        // Spawn new squares with upgraded spawn rate
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > this.getSpawnInterval() && this.squares.length < this.maxSquares) {
            this.squares.push(new Square());
            this.lastSpawnTime = currentTime;
        }

        // Check collisions with player
        const playerRect = {
            x: playerState.x,
            y: playerState.y,
            width: playerState.baseSize * upgradeSystem.upgrades.size.effect,
            height: playerState.baseSize * upgradeSystem.upgrades.size.effect
        };

        this.squares = this.squares.filter(square => {
            if (this.checkCollision(playerRect, {
                x: square.x,
                y: square.y,
                width: square.size,
                height: square.size
            })) {
                square.destroy();
                xpSystem.gainXP(25); // Base XP amount, will be multiplied in gainXP
                return false;
            }
            return true;
        });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

const squareSystem = new SquareManager();

// Player state
const playerState = {
    x: 0,
    y: 0,
    speed: 2,
    velocityX: 0,
    velocityY: 0,
    moving: false,
    baseSize: 40,
    
    updateSize() {
        const newSize = this.baseSize * upgradeSystem.upgrades.size.effect;
        player.style.width = `${newSize}px`;
        player.style.height = `${newSize}px`;
    }
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
    
    // Upgrade hotkeys
    if (e.key === '1') upgradeSystem.upgrade('size');
    if (e.key === '2') upgradeSystem.upgrade('xpMultiplier');
    if (e.key === '3') upgradeSystem.upgrade('spawnRate');
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

// Add event listeners for upgrade buttons
document.getElementById('size-upgrade').addEventListener('click', () => upgradeSystem.upgrade('size'));
document.getElementById('xpMultiplier-upgrade').addEventListener('click', () => upgradeSystem.upgrade('xpMultiplier'));
document.getElementById('spawnRate-upgrade').addEventListener('click', () => upgradeSystem.upgrade('spawnRate'));

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

    // Update square system
    squareSystem.update();

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
