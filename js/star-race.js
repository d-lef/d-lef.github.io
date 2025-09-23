/**
 * Star Race Game Module
 * Space-themed mini-game for flashcard study sessions
 */

class StarRaceGame {
    constructor() {
        this.isActive = false;
        this.gameState = {
            currentCard: null,
            correctAnswers: 0,
            gameSpeed: 2,
            spaceship: {
                x: 80,
                y: 0,
                trackIndex: 2,
                width: 40,
                height: 20
            },
            stars: [],
            answers: [],
            missiles: [],
            starsEarned: 0,
            gameComplete: false,
            lastAnswerSpawnTime: 0
        };

        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.trackCount = 5;
        this.trackHeight = 0;

        // DOM elements
        this.overlay = null;
        this.questionText = null;
        this.starsCounter = null;
        this.resultModal = null;
        this.resultTitle = null;
        this.resultMessage = null;

        // Callbacks
        this.onGameComplete = null;
        this.onGameExit = null;

        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.overlay = document.getElementById('star-race-overlay');
        this.canvas = document.getElementById('star-race-canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.questionText = document.getElementById('star-race-question-text');
        this.starsCounter = document.getElementById('stars-earned');
        this.resultModal = document.getElementById('star-race-result-modal');
        this.resultTitle = document.getElementById('star-race-result-title');
        this.resultMessage = document.getElementById('star-race-result-message');
    }

    setupEventListeners() {
        // Game controls
        document.getElementById('star-race-up')?.addEventListener('click', () => {
            if (this.isActive) this.moveSpaceship(-1);
        });

        document.getElementById('star-race-down')?.addEventListener('click', () => {
            if (this.isActive) this.moveSpaceship(1);
        });

        document.getElementById('star-race-attack')?.addEventListener('click', () => {
            if (this.isActive) this.fireAttack();
        });

        // Exit button
        document.getElementById('star-race-exit')?.addEventListener('click', () => {
            this.exitGame();
        });

        // Continue button in result modal
        document.getElementById('star-race-continue')?.addEventListener('click', () => {
            this.hideResultModal();
            this.endGame();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.isActive) this.resizeCanvas();
        });
    }

    startGame(card, onComplete, onExit, getDistractors = null) {
        if (this.isActive) return false;

        this.gameState.currentCard = card;
        this.onGameComplete = onComplete;
        this.onGameExit = onExit;
        this.getDistractors = getDistractors;

        // Reset game state
        this.resetGameState();

        // Show overlay with animation
        this.overlay.classList.add('active');
        setTimeout(() => {
            this.overlay.classList.add('wipe-in');
        }, 50);

        // Wait for animation to complete before starting game
        setTimeout(() => {
            this.initializeGame();
        }, 800);

        return true;
    }

    resetGameState() {
        this.gameState = {
            ...this.gameState,
            correctAnswers: 0,
            gameSpeed: 2,
            spaceship: {
                x: 80,
                y: 0,
                trackIndex: 2,
                width: 40,
                height: 20
            },
            stars: [],
            answers: [],
            missiles: [],
            starsEarned: 0,
            gameComplete: false,
            lastAnswerSpawnTime: 0
        };
    }

    initializeGame() {
        this.isActive = true;

        // Set question text
        if (this.questionText) {
            this.questionText.textContent = this.gameState.currentCard.front;
        }

        // Update stars counter
        this.updateStarsCounter();

        // Initialize canvas
        this.resizeCanvas();
        this.createStars();
        this.spawnAnswers();

        // Ensure controls are visible
        const controlsElement = document.getElementById('star-race-controls');
        if (controlsElement) {
            controlsElement.style.display = 'flex';
            console.log('🌟 Star Race controls made visible');
        } else {
            console.error('🌟 Star Race controls element not found!');
        }

        // Start game loop
        this.gameLoop();
    }

    resizeCanvas() {
        if (!this.canvas) return;

        // Get the actual canvas element's computed size
        const canvasRect = this.canvas.getBoundingClientRect();

        // Use the canvas element's actual dimensions
        this.canvas.width = canvasRect.width;
        this.canvas.height = canvasRect.height;

        this.trackHeight = this.canvas.height / this.trackCount;

        // Update spaceship position
        this.gameState.spaceship.y = this.getTrackCenterY(this.gameState.spaceship.trackIndex);
    }

    createStars() {
        this.gameState.stars = [];
        const starCount = Math.floor(this.canvas.width * this.canvas.height / 5000);

        for (let i = 0; i < starCount; i++) {
            this.gameState.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 1 + 0.5
            });
        }
    }

    spawnAnswers() {
        const now = Date.now();
        if (now - this.gameState.lastAnswerSpawnTime < 2000) return; // Spawn every 2 seconds (faster)

        this.gameState.lastAnswerSpawnTime = now;

        // Don't clear existing answers - add to them for more density
        // Only clear if we have too many (to prevent memory issues)
        if (this.gameState.answers.length > 15) {
            this.gameState.answers = this.gameState.answers.filter(answer => answer.x > -300);
        }

        const card = this.gameState.currentCard;
        const correctAnswer = card.back;

        // Generate distractors from other card fronts
        let distractors = ['Wrong Answer 1', 'Wrong Answer 2']; // fallback
        if (this.getDistractors && typeof this.getDistractors === 'function') {
            try {
                const realDistractors = this.getDistractors(card.front);
                if (realDistractors && realDistractors.length >= 2) {
                    distractors = realDistractors.slice(0, 2); // Use first 2 distractors
                }
            } catch (error) {
                console.error('Error getting Star Race distractors:', error);
            }
        }

        // Create more answers per spawn (4-6 instead of 3)
        const allOptions = [correctAnswer, ...distractors, ...distractors.slice(0, 2)].sort(() => 0.5 - Math.random());
        const availableTracks = Array.from(Array(this.trackCount).keys()).sort(() => 0.5 - Math.random());

        allOptions.forEach((text, index) => {
            this.gameState.answers.push({
                text,
                x: this.canvas.width + index * (this.canvas.width / 3), // Closer spacing
                trackIndex: availableTracks[index % availableTracks.length],
                isCorrect: text === correctAnswer,
                width: 0 // Will be calculated during render
            });
        });
    }

    moveSpaceship(direction) {
        const newTrack = this.gameState.spaceship.trackIndex + direction;
        if (newTrack >= 0 && newTrack < this.trackCount) {
            this.gameState.spaceship.trackIndex = newTrack;
            this.gameState.spaceship.y = this.getTrackCenterY(newTrack);
        }
    }

    fireAttack() {
        const spaceship = this.gameState.spaceship;
        this.gameState.missiles.push({
            x: spaceship.x + spaceship.width,
            y: spaceship.y,
            trackIndex: spaceship.trackIndex,
            speed: 8
        });
    }

    getTrackCenterY(trackIndex) {
        return (trackIndex * this.trackHeight) + (this.trackHeight / 2);
    }

    gameLoop() {
        if (!this.isActive) return;

        this.update();
        this.render();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Move stars
        this.gameState.stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        });

        // Move answers
        for (let i = this.gameState.answers.length - 1; i >= 0; i--) {
            const answer = this.gameState.answers[i];
            answer.x -= this.gameState.gameSpeed;

            // Check collision with spaceship
            const spaceship = this.gameState.spaceship;
            if (this.checkCollision(spaceship, answer)) {
                this.handleAnswerCollision(answer);
                return;
            }

            // Remove answers that are off screen
            if (answer.x < -300) {
                this.gameState.answers.splice(i, 1);
            }
        }

        // Move missiles
        for (let i = this.gameState.missiles.length - 1; i >= 0; i--) {
            const missile = this.gameState.missiles[i];
            missile.x += missile.speed;

            // Check missile collision with answers
            for (let j = this.gameState.answers.length - 1; j >= 0; j--) {
                const answer = this.gameState.answers[j];
                if (missile.trackIndex === answer.trackIndex &&
                    missile.x >= answer.x && missile.x <= answer.x + answer.width) {

                    this.handleMissileHit(answer);
                    this.gameState.missiles.splice(i, 1);
                    this.gameState.answers.splice(j, 1);
                    return;
                }
            }

            // Remove missiles that are off screen
            if (missile.x > this.canvas.width) {
                this.gameState.missiles.splice(i, 1);
            }
        }

        // Spawn new answers more frequently for better gameplay
        this.spawnAnswers();
    }

    checkCollision(spaceship, answer) {
        return spaceship.trackIndex === answer.trackIndex &&
               spaceship.x < answer.x + answer.width &&
               spaceship.x + spaceship.width > answer.x;
    }

    handleAnswerCollision(answer) {
        if (answer.isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    handleMissileHit(answer) {
        if (answer.isCorrect) {
            // Correct answer destroyed = Hard difficulty
            this.showResult('💥 Target Destroyed!', 'You destroyed the correct answer. Marking as Hard difficulty.', () => {
                this.completeGame('Hard');
            });
        } else {
            // Wrong answer destroyed = continues game
            console.log('🚀 Wrong answer destroyed - game continues');
        }
    }

    handleCorrectAnswer() {
        this.gameState.starsEarned++;
        this.gameState.correctAnswers++;
        this.gameState.gameSpeed += 0.3; // Increase speed
        this.updateStarsCounter();


        if (this.gameState.starsEarned >= 5) {
            this.showResult('🌟 Victory!', `You collected ${this.gameState.starsEarned} stars! Excellent work!`, () => {
                this.completeGame('Good');
            });
        } else {
            // Continue game with increased difficulty
            this.spawnAnswers();
        }
    }

    handleIncorrectAnswer() {
        this.showResult('❌ Wrong Answer', `The correct answer was: "${this.gameState.currentCard.back}"`, () => {
            this.completeGame('Hard');
        });
    }

    updateStarsCounter() {
        if (this.starsCounter) {
            this.starsCounter.textContent = this.gameState.starsEarned;
        }
    }

    showResult(title, message, onContinue) {
        this.isActive = false;

        if (this.resultTitle) this.resultTitle.textContent = title;
        if (this.resultMessage) this.resultMessage.textContent = message;

        this.resultModal.style.display = 'flex';

        // Store continue callback
        this.continueCallback = onContinue;
    }

    hideResultModal() {
        this.resultModal.style.display = 'none';
        if (this.continueCallback) {
            this.continueCallback();
            this.continueCallback = null;
        }
    }

    completeGame(difficulty) {
        this.endGame();
        if (this.onGameComplete) {
            this.onGameComplete(this.gameState.currentCard, difficulty, this.gameState.starsEarned);
        }
    }

    exitGame() {
        this.endGame();
        if (this.onGameExit) {
            this.onGameExit();
        }
    }

    endGame() {
        this.isActive = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Hide overlay with animation
        this.overlay.classList.remove('wipe-in');

        setTimeout(() => {
            this.overlay.classList.remove('active');
        }, 800);
    }

    render() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.ctx.fillStyle = '#fff';
        this.gameState.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // Draw spaceship
        this.drawSpaceship();

        // Draw answers
        this.drawAnswers();

        // Draw missiles
        this.drawMissiles();
    }

    drawSpaceship() {
        const ship = this.gameState.spaceship;
        const x = ship.x;
        const y = ship.y;
        const w = ship.width;
        const h = ship.height;

        // Ship body (silver)
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w, y); // Nose point
        this.ctx.lineTo(x + w * 0.7, y - h / 2); // Top wing
        this.ctx.lineTo(x, y - h * 0.3); // Top back
        this.ctx.lineTo(x + w * 0.2, y); // Center back
        this.ctx.lineTo(x, y + h * 0.3); // Bottom back
        this.ctx.lineTo(x + w * 0.7, y + h / 2); // Bottom wing
        this.ctx.closePath();
        this.ctx.fill();

        // Cockpit (cyan)
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(x + w * 0.75, y, h * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Engine flames (animated)
        if (Math.random() > 0.3) {
            this.ctx.fillStyle = '#ff4500';
            this.ctx.beginPath();
            this.ctx.moveTo(x + w * 0.1, y - h * 0.2);
            this.ctx.lineTo(x - w * 0.3, y);
            this.ctx.lineTo(x + w * 0.1, y + h * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawAnswers() {
        this.ctx.font = 'bold 18px Menlo, Monaco, Consolas, monospace';
        this.ctx.textBaseline = 'middle';

        this.gameState.answers.forEach(answer => {
            const y = this.getTrackCenterY(answer.trackIndex);

            // Measure text width for collision detection
            answer.width = this.ctx.measureText(answer.text).width;

            // Draw text - all answers are white so user can't tell which is correct
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(answer.text, answer.x, y);
        });
    }

    drawMissiles() {
        this.ctx.fillStyle = '#ffff00';
        this.gameState.missiles.forEach(missile => {
            const y = this.getTrackCenterY(missile.trackIndex);
            this.ctx.beginPath();
            this.ctx.arc(missile.x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // Static method to check if game should trigger
    static shouldTrigger(cardsRemaining, lastGameCardsAgo, hasPlayedGameBefore = false) {
        // Game can only start if there are at least 10 cards left to study
        if (cardsRemaining < 10) {
            return false;
        }

        // Cooldown logic:
        // - If no game has been played before: can start any time
        // - If a game has been played: must wait 8 cards after last game
        if (hasPlayedGameBefore && lastGameCardsAgo < 8) {
            return false;
        }

        // 15% chance to trigger
        return Math.random() < 0.15;
    }
}

// Initialize global game instance
window.starRaceGame = new StarRaceGame();