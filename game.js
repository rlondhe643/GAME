// --- Game Elements ---
const camel = document.getElementById('camel');
const desert = document.getElementById('desert');
const sky = document.getElementById('sky');
const scoreDisplay = document.getElementById('score');
const gameContainer = document.getElementById('game'); // Renamed from 'game' to avoid conflict
const muteButton = document.getElementById('muteButton');

// --- Audio Elements ---
const jumpSound = document.getElementById('jumpSound');
const hitSound = document.getElementById('hitSound');
const backgroundMusic = document.getElementById('backgroundMusic');

// --- Game State Variables ---
let score = 0;
let highScore = 0;
let level = 1;
let gameSpeed = 5; // Pixels cacti move per frame (initial speed)
let cactusSpawnInterval = 2000; // Milliseconds between cactus spawns
let cacti = [];
let gameLoopId; // To store the requestAnimationFrame ID for the main game loop
let cactusSpawnTimer; // To store the setInterval ID for spawning cacti
let cloudSpawnTimer; // To store the setInterval ID for spawning clouds

// --- Camel Physics Variables ---
const groundLevel = 0; // Camel's bottom position (adjust based on your CSS)
let camelY = groundLevel; // Current vertical position of the camel
let velocityY = 0; // Vertical speed of the camel
const gravity = 0.9; // How quickly the camel falls (experiment with this)
const jumpForce = 22; // Initial upward velocity when jumping (experiment with this)
let isJumping = false;
let isGameOver = false;

// --- Music State ---
let musicPlaying = false;

// --- Audio Functions ---
function startMusic() {
    if (!musicPlaying) {
        backgroundMusic.play()
            .then(() => {
                musicPlaying = true;
                muteButton.textContent = "🔊 Mute";
            })
            .catch(err => {
                console.warn('Autoplay blocked. User interaction needed to start music.', err);
            });
    }
}

function toggleMute() {
    backgroundMusic.muted = !backgroundMusic.muted;
    jumpSound.muted = !jumpSound.muted;
    hitSound.muted = !hitSound.muted;
    muteButton.textContent = backgroundMusic.muted ? "🔇 Unmute" : "🔊 Mute";
}

// --- Camel Movement ---
function jump() {
    if (!isJumping && !isGameOver) {
        velocityY = jumpForce; // Set initial upward velocity
        isJumping = true;
        jumpSound.play();
    }
}

function updateCamelPosition() {
    // Apply gravity to vertical velocity
    velocityY -= gravity;
    // Update vertical position based on velocity
    camelY += velocityY;

    // Ensure camel doesn't go below ground level
    if (camelY <= groundLevel) {
        camelY = groundLevel;
        velocityY = 0; // Stop vertical movement
        isJumping = false; // Reset jump state
    }

    // Update camel's CSS position
    camel.style.bottom = `${camelY}px`;
}

// --- Cactus Management ---
function spawnCactus() {
    if (isGameOver) return; // Don't spawn if game is over

    const cactus = document.createElement('div');
    cactus.className = 'cactus';
    cactus.style.left = '100vw';
    // Position cacti just above the ground level
    cactus.style.bottom = `${groundLevel + 5}px`; // Adjust '5' based on your cactus image's base
    desert.appendChild(cactus);
    cacti.push(cactus);
}

function moveCacti() {
    cacti.forEach((cactus, index) => {
        let currentLeft = cactus.offsetLeft;
        cactus.style.left = `${currentLeft - gameSpeed}px`; // Move left by gameSpeed pixels

        // Remove cactus if it's off-screen
        if (currentLeft < -60) { // -60px ensures it's fully off-screen
            cactus.remove();
            cacti.splice(index, 1);
            updateScore();
        }

        // --- Collision Detection ---
        // Only check for collision if not game over and cactus is near camel
        if (!isGameOver && currentLeft > 50 && currentLeft < 150) { // Optimization: check only when close
            const camelRect = camel.getBoundingClientRect();
            const cactusRect = cactus.getBoundingClientRect();

            if (
                camelRect.right > cactusRect.left &&
                camelRect.left < cactusRect.right &&
                camelRect.bottom > cactusRect.top &&
                camelRect.top < cactusRect.bottom
            ) {
                gameOver();
            }
        }
    });
}

// --- Cloud Management ---
function spawnCloud() {
    if (isGameOver) return; // Don't spawn if game is over

    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.top = `${Math.random() * 80}px`; // Random vertical position
    cloud.style.left = '100vw'; // Start off-screen
    sky.appendChild(cloud);

    // Animate cloud movement (optional, you could use a setInterval for all clouds)
    let cloudLeft = 100;
    const cloudMoveInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(cloudMoveInterval);
            cloud.remove(); // Clean up if game over
            return;
        }
        cloudLeft -= 0.5; // Slower speed for clouds
        cloud.style.left = `${cloudLeft}vw`;
        if (cloudLeft < -10) { // When off-screen
            clearInterval(cloudMoveInterval);
            cloud.remove();
        }
    }, 50); // Adjust interval for cloud speed
}

// --- Game Logic ---
function updateScore() {
    score++;
    if (score > highScore) {
        highScore = score;
    }

    // Increase difficulty every 100 points
    if (score % 100 === 0 && level < 10) { // Cap level at 10 for now
        level++;
        gameSpeed += 0.5; // Increase cactus speed
        cactusSpawnInterval = Math.max(cactusSpawnInterval - 100, 1000); // Reduce spawn interval (min 1 sec)

        // Clear and restart cactus spawning with new interval
        clearInterval(cactusSpawnTimer);
        cactusSpawnTimer = setInterval(spawnCactus, cactusSpawnInterval);
    }

    scoreDisplay.textContent = `Score: ${score} | Level: ${level} (High: ${highScore})`;
}

function gameOver() {
    isGameOver = true;
    hitSound.play();
    cancelAnimationFrame(gameLoopId); // Stop the main game loop
    clearInterval(cactusSpawnTimer); // Stop spawning cacti
    clearInterval(cloudSpawnTimer); // Stop spawning clouds

    alert(`💥 Game Over!\nFinal Score: ${score}\nHigh Score: ${highScore}`);
    updateLeaderboard();
    // Optional: Add a "Restart" button or message here
}

function resetGame() {
    isGameOver = false;
    score = 0;
    level = 1;
    gameSpeed = 5;
    cactusSpawnInterval = 2000;

    scoreDisplay.textContent = `Score: 0 | Level: 1 (High: ${highScore})`;

    // Clear all existing cacti and clouds
    cacti.forEach(c => c.remove());
    cacti = [];
    document.querySelectorAll('.cloud').forEach(c => c.remove());

    // Reset camel position
    camelY = groundLevel;
    camel.style.bottom = `${camelY}px`;
    isJumping = false;
    velocityY = 0;

    // Restart game loops
    startGame();
} 

function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('leaderboard')) || [];
    scores.push(score);
    scores.sort((a, b) => b - a); // Sort descending
    localStorage.setItem('leaderboard', JSON.stringify(scores.slice(0, 5))); // Keep top 5
}

function toggleTheme(type) {
    gameContainer.className = ''; // Clear existing themes
    if (type === 'night') {
        gameContainer.classList.add('night');
    } else if (type === 'sandstorm') {
        gameContainer.classList.add('sandstorm');
    }
}

// --- Main Game Loop (using requestAnimationFrame for smoothness) ---
function gameLoop() {
    if (isGameOver) return; // Stop if game is over

    updateCamelPosition();
    moveCacti();

    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function startGame() {
    // Start main game loop
    gameLoopId = requestAnimationFrame(gameLoop);
    // Start spawning cacti
    cactusSpawnTimer = setInterval(spawnCactus, cactusSpawnInterval);
    // Start spawning clouds
    cloudSpawnTimer = setInterval(spawnCloud, 4000); // Clouds spawn every 4 seconds
}

// --- Event Listeners ---
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    }
    // Start music on first interaction (any key press)
    startMusic();
    // Restart game if game over and space is pressed (simple restart)
    if (isGameOver && e.code === 'Space') {
        resetGame();
    }
});

document.addEventListener('touchstart', () => {
    jump();
    startMusic();
    // Restart game if game over and screen is touched (simple restart)
    if (isGameOver) {
        resetGame();
    }
});

muteButton.addEventListener('click', toggleMute);

// Start the game when the page loads
window.onload = () => {
    // Optionally load high score from local storage on load
    highScore = JSON.parse(localStorage.getItem('leaderboard'))?.[0] || 0;
    scoreDisplay.textContent = `Score: 0 | Level: 1 (High: ${highScore})`;
    startGame();
};
// Create cactus obstacles
function createCactus() {
    const cactus = document.createElement('div');
    cactus.classList.add('cactus');
    desert.appendChild(cactus);

    let cactusPosition = desert.offsetWidth;

}