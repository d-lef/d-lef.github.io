class FlashcardApp {
    constructor() {
        this.currentDeck = null;
        this.currentStudyCards = [];
        this.currentCardIndex = 0;
        this.isCardFlipped = false;
        this.studySession = null;
        this.editingCard = null;
        this.editingDeck = null;
        this.studyMode = 'flip'; // 'flip', 'type', or 'combined'
        this.currentAnswer = '';
        this.combinedPairs = []; // array of {card, mode, completed} objects
        this.combinedCardStates = new Map(); // tracks completion per card
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadInitialView();
        this.updateStats();
        
        // Initialize translations
        if (window.i18n) {
            window.i18n.updatePageTranslations();
        }
    }

    setupEventListeners() {
        document.getElementById('overview-tab').addEventListener('click', () => this.showView('overview'));
        document.getElementById('decks-tab').addEventListener('click', () => this.showView('decks'));
        document.getElementById('settings-tab').addEventListener('click', () => this.showView('settings'));
        
        // Overview calendar navigation
        document.getElementById('overview-prev-month').addEventListener('click', () => this.navigateOverviewCalendar(-1));
        document.getElementById('overview-next-month').addEventListener('click', () => this.navigateOverviewCalendar(1));
        
        document.getElementById('new-deck-btn').addEventListener('click', () => this.showNewDeckModal());
        document.getElementById('new-card-btn').addEventListener('click', () => this.showNewCardModal());
        document.getElementById('study-all-btn').addEventListener('click', () => this.startStudyAllSession());
        
        document.getElementById('create-deck').addEventListener('click', () => this.createDeck());
        document.getElementById('cancel-deck').addEventListener('click', () => this.hideNewDeckModal());
        document.getElementById('save-card').addEventListener('click', () => this.saveCard());
        document.getElementById('cancel-card').addEventListener('click', () => this.hideNewCardModal());
        
        document.getElementById('flip-card').addEventListener('click', () => this.flipCard());
        
        // Add click handler to the flashcard itself for tapping to flip
        document.getElementById('flashcard').addEventListener('click', (e) => {
            console.log('Flashcard clicked, studyMode:', this.studyMode, 'isCardFlipped:', this.isCardFlipped);
            
            // Only flip if we're in flip mode (or flip phase of combined) and card isn't flipped yet
            // Also prevent flipping when clicking on difficulty buttons
            const isFlipMode = this.studyMode === 'flip' || 
                              (this.studyMode === 'combined' && this.getCurrentCombinedMode() === 'flip');
            
            if (isFlipMode && !this.isCardFlipped && !e.target.closest('.difficulty-buttons')) {
                console.log('Flipping card via tap');
                this.flipCard();
            }
        });
        document.getElementById('again-btn').addEventListener('click', () => this.answerCard('again'));
        document.getElementById('hard-btn').addEventListener('click', () => this.answerCard('hard'));
        document.getElementById('good-btn').addEventListener('click', () => this.answerCard('good'));
        document.getElementById('easy-btn').addEventListener('click', () => this.answerCard('easy'));
        
        // Back to decks button was removed from study view for mobile UX
        document.getElementById('back-to-decks-from-deck').addEventListener('click', () => this.showView('decks'));
        document.getElementById('study-deck-btn').addEventListener('click', () => this.showStudyModeSelection());
        
        // Testing tools
        document.getElementById('add-test-data-btn').addEventListener('click', () => this.addTestData());
        document.getElementById('erase-all-data-btn').addEventListener('click', () => this.eraseAllData());
        
        // Typing mode event listeners - handled dynamically in renderTypingInterface
        document.getElementById('typing-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                console.log('Enter key pressed, button text:', document.getElementById('check-answer')?.textContent);
                // Only check if button still says "Check Answer"
                const checkBtn = document.getElementById('check-answer');
                if (checkBtn && checkBtn.textContent.trim() === 'Check Answer') {
                    console.log('Triggering check answer via Enter');
                    this.checkTypedAnswer();
                } else if (checkBtn && checkBtn.textContent.trim() === 'Continue') {
                    console.log('Triggering continue via Enter');
                    checkBtn.click();
                }
            }
        });
        
        // Typing mode difficulty buttons were removed - now using inline feedback with continue button

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideNewDeckModal();
                this.hideNewCardModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.getCurrentView() === 'study') {
                // Don't trigger shortcuts if user is typing in an input field
                const isTyping = document.activeElement.tagName === 'INPUT' || 
                                document.activeElement.tagName === 'TEXTAREA';
                
                if (e.code === 'Space' && !isTyping) {
                    e.preventDefault();
                    // Only allow spacebar flip in flip mode or flip phase of combined mode
                    if (this.studyMode === 'flip' || 
                        (this.studyMode === 'combined' && this.getCurrentCombinedMode() === 'flip')) {
                        if (!this.isCardFlipped) {
                            this.flipCard();
                        }
                    }
                } else if (this.isCardFlipped && !isTyping) {
                    switch (e.key) {
                        case '1': this.answerCard('again'); break;
                        case '2': this.answerCard('hard'); break;
                        case '3': this.answerCard('good'); break;
                        case '4': this.answerCard('easy'); break;
                    }
                }
            }
        });
    }

    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${viewName}-view`).classList.add('active');
        const tabBtn = document.getElementById(`${viewName}-tab`);
        if (tabBtn) tabBtn.classList.add('active');
        
        switch (viewName) {
            case 'overview':
                this.renderOverview();
                break;
            case 'decks':
                this.renderDecks();
                break;
            case 'settings':
                // Settings view is static, no rendering needed
                break;
            case 'study':
                this.renderStudyCard();
                break;
            case 'deck':
                this.renderDeckView();
                break;
        }
    }

    getCurrentView() {
        return document.querySelector('.view.active').id.replace('-view', '');
    }

    loadInitialView() {
        this.showView('overview');
    }

    async renderOverview() {
        const decks = await storage.loadDecks();
        
        // Calculate insights
        let dueCount = 0;
        let overdueCount = 0;
        let totalCards = 0;
        const today = this.getLocalDateString();
        
        decks.forEach(deck => {
            totalCards += deck.cards.length;
            deck.cards.forEach(card => {
                const cardDueDate = card.dueDate || card.due_date;
                if (cardDueDate) {
                    if (cardDueDate === today) {
                        dueCount++;
                    } else if (cardDueDate < today) {
                        overdueCount++;
                    }
                }
            });
        });
        
        // Get today's review stats
        let reviewedToday = 0;
        try {
            if (window.supabaseService) {
                const stats = await window.supabaseService.getReviewStats(today, today);
                reviewedToday = stats.length > 0 ? stats[0].reviews : 0;
            }
        } catch (error) {
            console.log('Could not fetch review stats:', error);
        }
        
        // Get streak from statistics
        let streak = 0;
        if (window.statistics) {
            try {
                streak = await window.statistics.calculateStreak();
            } catch (error) {
                console.log('Could not calculate streak:', error);
            }
        }
        
        // Update insight cards
        document.getElementById('due-cards-count').textContent = dueCount;
        document.getElementById('reviewed-today-count').textContent = reviewedToday;
        document.getElementById('overdue-cards-count').textContent = overdueCount;
        document.getElementById('overview-streak-count').textContent = streak;
        
        // Render compact study calendar
        if (window.statistics) {
            await this.renderOverviewCalendar();
        }
    }

    async renderOverviewCalendar() {
        // Initialize current calendar date if not set
        if (!this.overviewCalendarDate) {
            this.overviewCalendarDate = new Date();
        }
        
        // Update month title
        const monthElement = document.getElementById('overview-current-month');
        if (monthElement) {
            monthElement.textContent = this.overviewCalendarDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        }
        
        // Render calendar using the same logic as statistics module
        const calendarContainer = document.getElementById('overview-study-calendar');
        
        if (window.statistics && calendarContainer) {
            if (typeof window.statistics.renderCalendarMonth === 'function') {
                await window.statistics.renderCalendarMonth(this.overviewCalendarDate, calendarContainer, true);
            }
        }
    }

    navigateOverviewCalendar(direction) {
        if (!this.overviewCalendarDate) {
            this.overviewCalendarDate = new Date();
        }
        
        this.overviewCalendarDate.setMonth(this.overviewCalendarDate.getMonth() + direction);
        this.renderOverviewCalendar();
    }

    async renderDecks() {
        const decks = await storage.loadDecks();
        const decksList = document.getElementById('decks-list');
        
        if (decks.length === 0) {
            decksList.innerHTML = '<div class="empty-state"><p>No decks yet. Create your first deck!</p></div>';
            return;
        }
        
        decksList.innerHTML = decks.map(deck => {
            return `
                <div class="deck-card" data-deck-id="${deck.id}">
                    <div class="deck-actions">
                        <button class="deck-edit-btn" data-deck-id="${deck.id}" title="Edit deck">✏️</button>
                        <button class="deck-delete-btn" data-deck-id="${deck.id}" title="Delete deck">🗑️</button>
                    </div>
                    <div class="deck-content">
                        <h3>${this.escapeHtml(deck.name)}</h3>
                        <div class="card-count">${deck.cards.length} cards</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handler for opening decks (but not when clicking action buttons)
        document.querySelectorAll('.deck-card .deck-content').forEach(content => {
            content.addEventListener('click', async (e) => {
                const deckId = e.target.closest('.deck-card').dataset.deckId;
                await this.openDeck(deckId);
            });
        });
        
        // Add handlers for deck management buttons
        document.querySelectorAll('.deck-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const deckId = e.target.dataset.deckId;
                this.editDeck(deckId);
            });
        });
        
        document.querySelectorAll('.deck-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const deckId = e.target.dataset.deckId;
                await this.deleteDeck(deckId);
            });
        });
    }

    async openDeck(deckId) {
        const decks = await storage.loadDecks();
        this.currentDeck = decks.find(d => d.id === deckId);
        if (this.currentDeck) {
            this.showView('deck');
        }
    }

    renderDeckView() {
        if (!this.currentDeck) return;
        
        document.getElementById('deck-title').textContent = this.currentDeck.name;
        
        const cardsList = document.getElementById('cards-list');
        if (this.currentDeck.cards.length === 0) {
            cardsList.innerHTML = '<div class="empty-state"><p>No cards in this deck. Add your first card!</p></div>';
            return;
        }
        
        cardsList.innerHTML = this.currentDeck.cards.map(card => `
            <div class="card-item">
                <div class="card-item-content">
                    <div class="card-item-front">${this.escapeHtml(card.front)}</div>
                    <div class="card-item-back">${this.escapeHtml(card.back)}</div>
                </div>
                <div class="card-actions">
                    <button class="card-edit-btn" data-card-id="${card.id}" title="Edit card">✏️</button>
                    <button class="card-delete-btn" data-card-id="${card.id}" title="Delete card">🗑️</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for card management buttons
        document.querySelectorAll('.card-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = e.target.dataset.cardId;
                this.editCard(cardId);
            });
        });
        
        document.querySelectorAll('.card-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const cardId = e.target.dataset.cardId;
                await this.deleteCard(cardId);
            });
        });
    }

    showStudyModeSelection() {
        if (!this.currentDeck) return;
        
        const studyCards = spacedRepetition.getCardsForStudy(this.currentDeck);
        if (studyCards.length === 0) {
            alert('No cards to study right now!');
            return;
        }
        
        // Directly start combined mode instead of showing mode selection
        this.startStudySessionWithMode('combined');
    }
    
    startStudySessionWithMode(mode = 'flip') {
        this.studyMode = mode;
        
        if (this.studySession && this.studySession.isStudyAll) {
            // Study all mode - cards already set
            this.currentCardIndex = 0;
            this.isCardFlipped = false;
        } else {
            // Single deck mode
            if (!this.currentDeck) return;
            
            this.currentStudyCards = spacedRepetition.getCardsForStudy(this.currentDeck);
            
            if (this.currentStudyCards.length === 0) {
                alert('No cards to study right now!');
                return;
            }
            
            this.currentCardIndex = 0;
            this.isCardFlipped = false;
            this.studySession = {
                startTime: new Date(),
                cardsStudied: 0
            };
        }
        
        // Initialize combined mode pairs
        if (mode === 'combined') {
            this.initializeCombinedPairs();
        }
        
        this.showView('study');
    }

    renderStudyCard() {
        if (this.studyMode === 'combined') {
            this.renderCombinedPairInterface();
            return;
        }
        
        if (!this.currentStudyCards.length) return;
        
        const card = this.currentStudyCards[this.currentCardIndex];
        const progress = ((this.currentCardIndex + 1) / this.currentStudyCards.length) * 100;
        
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Show appropriate interface based on study mode
        if (this.studyMode === 'type') {
            this.renderTypingInterface(card);
        } else {
            this.renderFlipInterface(card);
        }
    }
    
    getCurrentCombinedMode() {
        if (this.studyMode !== 'combined' || this.currentCardIndex >= this.combinedPairs.length) {
            return null;
        }
        return this.combinedPairs[this.currentCardIndex].mode;
    }
    
    transitionToInterface(newType, callback) {
        // Get current visible interface
        const flashcard = document.getElementById('flashcard');
        const typingInterface = document.getElementById('typing-interface');
        
        let currentInterface = null;
        if (flashcard.style.display !== 'none') {
            currentInterface = flashcard;
        } else if (typingInterface.style.display !== 'none') {
            currentInterface = typingInterface;
        }
        
        if (currentInterface) {
            // Add exit animation
            currentInterface.classList.add('transitioning-out');
            setTimeout(() => {
                currentInterface.classList.remove('transitioning-out');
                callback();
            }, 300);
        } else {
            // No current interface, just show new one
            callback();
        }
    }
    
    renderFlipInterface(card) {
        // Add transition animation
        this.transitionToInterface('flip', () => {
            document.getElementById('flashcard').style.display = 'block';
            document.getElementById('typing-interface').style.display = 'none';
            document.querySelector('.study-actions').style.display = 'none'; // Hide flip button area
            
            // Always hide combined progress (we removed the step-by-step progress)
            document.getElementById('combined-progress').style.display = 'none';
            
            document.getElementById('card-front').textContent = card.front;
            document.getElementById('card-back').textContent = card.back;
            
            document.getElementById('flashcard').classList.remove('flipped');
            document.getElementById('flip-card').style.display = 'none'; // Hide flip button
            document.querySelector('.difficulty-buttons').style.display = 'none';
            
            this.isCardFlipped = false;
            
            // Apply entrance animation
            const flashcard = document.getElementById('flashcard');
            flashcard.classList.add('transitioning-in');
            setTimeout(() => flashcard.classList.remove('transitioning-in'), 300);
        });
    }
    
    renderTypingInterface(card) {
        // Add transition animation  
        this.transitionToInterface('typing', () => {
            document.getElementById('flashcard').style.display = 'none';
            document.getElementById('typing-interface').style.display = 'block';
            document.querySelector('.study-actions').style.display = 'none';
            
            // Always hide combined progress (we removed the step-by-step progress)
            document.getElementById('combined-progress').style.display = 'none';
            
            document.getElementById('typing-front').textContent = card.front;
            document.getElementById('typing-input').value = '';
            document.getElementById('inline-result').style.display = 'none';
            document.getElementById('typing-input').focus();
            
            // Reset check answer button
            const checkBtn = document.getElementById('check-answer');
            checkBtn.textContent = 'Check Answer';
            // Clear all event handlers
            checkBtn.onclick = null;
            checkBtn.onmousedown = null;
            checkBtn.ontouchstart = null;
            // Remove all event listeners by cloning
            const newBtn = checkBtn.cloneNode(true);
            checkBtn.parentNode.replaceChild(newBtn, checkBtn);
            // Add single clean event listener
            document.getElementById('check-answer').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Check answer button clicked');
                this.checkTypedAnswer();
            });
            
            this.currentAnswer = card.back;
            
            // Apply entrance animation
            const typingInterface = document.getElementById('typing-interface');
            typingInterface.classList.add('transitioning-in');
            setTimeout(() => typingInterface.classList.remove('transitioning-in'), 300);
        });
    }
    
    initializeCombinedPairs() {
        this.combinedPairs = [];
        this.combinedCardStates = new Map();
        
        // Create ONE pair per card with random mode selection
        this.currentStudyCards.forEach(card => {
            // Randomly choose either 'type' or 'flip' for this card this session
            const randomMode = Math.random() < 0.5 ? 'type' : 'flip';
            this.combinedPairs.push({ 
                card: card, 
                mode: randomMode, 
                completed: false,
                needsReshuffle: false
            });
            
            // Track completion state for each card
            this.combinedCardStates.set(card.id, {
                currentMode: randomMode,
                completed: false,
                failed: false
            });
        });
        
        // Shuffle the pairs
        this.shuffleArray(this.combinedPairs);
        
        console.log('Combined pairs created:', this.combinedPairs.length, 'cards with random modes');
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    renderCombinedPairInterface() {
        if (this.currentCardIndex >= this.combinedPairs.length) {
            this.finishStudySession();
            return;
        }
        
        const currentPair = this.combinedPairs[this.currentCardIndex];
        const card = currentPair.card;
        const mode = currentPair.mode;
        
        // Hide combined progress indicator (no longer needed)
        document.getElementById('combined-progress').style.display = 'none';
        
        // Update progress bar
        const completedPairs = this.combinedPairs.filter(p => p.completed).length;
        const totalPairs = this.combinedPairs.length;
        const progress = totalPairs > 0 ? (completedPairs / totalPairs) * 100 : 0;
        
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        if (mode === 'type') {
            this.renderTypingInterface(card);
        } else {
            this.renderFlipInterface(card);
        }
    }

    flipCard() {
        document.getElementById('flashcard').classList.add('flipped');
        document.getElementById('flip-card').style.display = 'none';
        document.querySelector('.difficulty-buttons').style.display = 'grid';
        this.isCardFlipped = true;
    }

    async answerCard(difficulty) {
        if (!this.isCardFlipped && this.studyMode !== 'type' && this.getCurrentCombinedMode() !== 'type') return;
        
        if (this.studyMode === 'combined') {
            await this.handleCombinedAnswer(difficulty);
        } else {
            await this.handleRegularAnswer(difficulty);
        }
    }
    
    async handleCombinedAnswer(difficulty) {
        const currentPair = this.combinedPairs[this.currentCardIndex];
        const card = currentPair.card;
        const mode = currentPair.mode;
        const cardState = this.combinedCardStates.get(card.id);
        
        // Check if this is a failure (Again or typing failure)
        const isFailed = difficulty === 'again' || 
                        (mode === 'type' && (difficulty === 'hard' || difficulty === 'again'));
        
        if (isFailed) {
            // Mark as failed and reshuffle back into the deck
            cardState.failed = true;
            currentPair.needsReshuffle = true;
            
            // Create a new pair for this card and add it back to the deck
            const newRandomMode = Math.random() < 0.5 ? 'type' : 'flip';
            const newPair = {
                card: card,
                mode: newRandomMode,
                completed: false,
                needsReshuffle: false
            };
            
            // Insert the new pair at a random position in the remaining cards
            const remainingCards = this.combinedPairs.length - this.currentCardIndex - 1;
            const insertPosition = this.currentCardIndex + 1 + Math.floor(Math.random() * Math.max(1, remainingCards));
            this.combinedPairs.splice(insertPosition, 0, newPair);
            
            // Update card state for the new attempt
            cardState.currentMode = newRandomMode;
            cardState.failed = false;
            
            console.log(`Card "${card.front}" failed, reshuffled as ${newRandomMode} mode at position ${insertPosition}`);
        } else {
            // Success - mark as completed and update with spaced repetition
            currentPair.completed = true;
            cardState.completed = true;
            
            const updatedCard = spacedRepetition.updateCardAfterReview(card, difficulty);
            await this.updateCardInStorage(updatedCard);
            
            // Track review stats
            await this.trackReviewStat(difficulty);
            
            this.studySession.cardsStudied++;
            
            console.log(`Card "${card.front}" completed successfully in ${mode} mode`);
        }
        
        this.moveToNextPair();
    }
    
    async handleRegularAnswer(difficulty) {
        const card = this.currentStudyCards[this.currentCardIndex];
        const updatedCard = spacedRepetition.updateCardAfterReview(card, difficulty);
        await this.updateCardInStorage(updatedCard);
        
        // Track review stats
        await this.trackReviewStat(difficulty);
        
        this.studySession.cardsStudied++;
        this.currentCardIndex++;
        
        if (this.currentCardIndex >= this.currentStudyCards.length) {
            this.finishStudySession();
        } else {
            // Reset interfaces for next card
            if (this.studyMode === 'type') {
                document.querySelector('.typing-input-area').style.display = 'flex';
                document.getElementById('inline-result').style.display = 'none';
            }
            this.renderStudyCard();
        }
    }
    
    // Helper function to get local date string (YYYY-MM-DD)
    getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async trackReviewStat(difficulty) {
        try {
            const today = this.getLocalDateString(); // YYYY-MM-DD format
            const isCorrect = difficulty === 'good' || difficulty === 'easy';
            
            if (window.supabaseService) {
                await window.supabaseService.updateReviewStats(today, isCorrect);
            }
            
            // Also store locally as fallback for calendar display
            this.storeLocalReviewStat(today, isCorrect);
        } catch (error) {
            console.error('Failed to track review stat:', error);
            // Still store locally for calendar display
            const today = this.getLocalDateString();
            const isCorrect = difficulty === 'good' || difficulty === 'easy';
            this.storeLocalReviewStat(today, isCorrect);
        }
    }

    storeLocalReviewStat(date, isCorrect) {
        try {
            const key = 'flashcard_app_review_stats';
            let stats = JSON.parse(localStorage.getItem(key)) || {};
            
            if (!stats[date]) {
                stats[date] = { reviews: 0, correct: 0, lapses: 0 };
            }
            
            stats[date].reviews++;
            if (isCorrect) {
                stats[date].correct++;
            } else {
                stats[date].lapses++;
            }
            
            localStorage.setItem(key, JSON.stringify(stats));
        } catch (error) {
            console.error('Failed to store local review stat:', error);
        }
    }

    async updateCardInStorage(updatedCard) {
        if (this.studySession.isStudyAll) {
            // Find the deck that contains this card and update it
            const decks = await storage.loadDecks();
            const targetDeck = decks.find(deck => 
                deck.cards.some(c => c.id === updatedCard.id)
            );
            if (targetDeck) {
                const cardIndex = targetDeck.cards.findIndex(c => c.id === updatedCard.id);
                if (cardIndex >= 0) {
                    targetDeck.cards[cardIndex] = updatedCard;
                    await storage.saveDeck(targetDeck);
                }
            }
        } else {
            // Single deck study
            const deckIndex = this.currentDeck.cards.findIndex(c => c.id === updatedCard.id);
            if (deckIndex >= 0) {
                this.currentDeck.cards[deckIndex] = updatedCard;
                await storage.saveDeck(this.currentDeck);
            }
        }
    }
    
    moveToNextPair() {
        this.currentCardIndex++;
        
        if (this.currentCardIndex >= this.combinedPairs.length) {
            this.finishStudySession();
        } else {
            // Reset typing interface
            document.querySelector('.typing-input-area').style.display = 'flex';
            document.getElementById('inline-result').style.display = 'none';
            this.renderStudyCard();
        }
    }

    
    checkTypedAnswer() {
        console.log('checkTypedAnswer called');
        const userAnswer = document.getElementById('typing-input').value.trim();
        const correctAnswer = this.currentAnswer;
        
        console.log('User answer:', userAnswer, 'Correct answer:', correctAnswer);
        
        if (!userAnswer) {
            alert('Please type an answer first!');
            return;
        }
        
        const result = this.compareAnswers(userAnswer, correctAnswer);
        console.log('Comparison result:', result);
        
        // Automatically assign difficulty based on typing accuracy
        let difficulty;
        if (result === 'correct') {
            difficulty = 'good';
        } else if (result === 'partial') {
            difficulty = 'hard';
        } else {
            difficulty = 'again';
        }
        
        console.log('Assigned difficulty:', difficulty);
        
        // Show brief feedback before automatically proceeding
        this.showTypingFeedback(result, userAnswer, correctAnswer, difficulty);
    }
    
    compareAnswers(userAnswer, correctAnswer) {
        const user = userAnswer.toLowerCase().trim();
        const correct = correctAnswer.toLowerCase().trim();
        
        // Exact match
        if (user === correct) {
            return 'correct';
        }
        
        // Calculate character-level similarity using Levenshtein distance
        const similarity = this.calculateCharacterSimilarity(user, correct);
        
        // 90%+ similarity = correct (good)
        if (similarity >= 0.9) {
            return 'correct';
        } 
        // 70%+ similarity = partial (hard) - allowing for minor typos/missing letters
        else if (similarity >= 0.7) {
            return 'partial';
        } 
        // Below 70% = incorrect (again)
        else {
            return 'incorrect';
        }
    }
    
    calculateCharacterSimilarity(str1, str2) {
        // Calculate similarity using Levenshtein distance
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        
        if (maxLength === 0) return 1; // Both empty strings
        
        return 1 - (distance / maxLength);
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        // Create matrix
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        // Fill matrix
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    showTypingFeedback(result, userAnswer, correctAnswer, difficulty) {
        console.log('showTypingFeedback called with:', { result, userAnswer, correctAnswer, difficulty });
        
        // Hide the typing input area
        document.querySelector('.typing-input-area').style.display = 'none';
        
        // Show inline feedback in the typing interface
        const inlineResult = document.getElementById('inline-result');
        const inlineStatus = document.getElementById('inline-status');
        const inlineCorrectAnswer = document.getElementById('inline-correct-answer');
        const inlineUserAnswer = document.getElementById('inline-user-answer');
        const continueContainer = document.getElementById('continue-button-container');
        const checkBtn = document.getElementById('check-answer');
        
        console.log('Elements found:', { 
            inlineResult: !!inlineResult, 
            inlineStatus: !!inlineStatus, 
            inlineCorrectAnswer: !!inlineCorrectAnswer, 
            checkBtn: !!checkBtn 
        });
        
        if (!inlineResult || !inlineStatus || !inlineCorrectAnswer || !inlineUserAnswer || !continueContainer) {
            console.error('Missing required elements for inline feedback');
            return;
        }
        
        // Always show the user's answer
        inlineUserAnswer.textContent = userAnswer || '(no answer)';
        inlineUserAnswer.style.display = 'block';
        
        // Set feedback text and color
        if (result === 'correct') {
            inlineStatus.textContent = '✅ Correct!';
            inlineStatus.style.color = '#2ed573';
            inlineCorrectAnswer.style.display = 'none';
        } else {
            if (result === 'partial') {
                inlineStatus.textContent = '⚠️ Close! (Minor mistakes)';
                inlineStatus.style.color = '#ffa502';
            } else {
                inlineStatus.textContent = '❌ Incorrect';
                inlineStatus.style.color = '#ff3838';
            }
            // Show correct answer inline
            inlineCorrectAnswer.textContent = correctAnswer;
            inlineCorrectAnswer.style.display = 'block';
        }
        
        // Show the inline result and continue button
        inlineResult.style.display = 'block';
        continueContainer.style.display = 'block';
        console.log('Inline result should now be visible');
        
        // Add continue button click handler
        const continueBtn = document.getElementById('continue-typing');
        // Remove any existing listeners
        const newContinueBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
        
        document.getElementById('continue-typing').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Continue button clicked by user');
            
            // Hide inline result and show typing input again for next card
            inlineResult.style.display = 'none';
            continueContainer.style.display = 'none';
            inlineUserAnswer.style.display = 'none';
            document.querySelector('.typing-input-area').style.display = 'flex';
            
            // Automatically answer with calculated difficulty
            if (this.studyMode === 'combined') {
                this.handleCombinedAnswer(difficulty);
            } else {
                this.answerCard(difficulty);
            }
        });
        
        console.log('showTypingFeedback completed successfully');
    }
    
    
    
    finishStudySession() {
        const stats = storage.loadStats();
        const today = new Date().toDateString();
        const lastStudyDate = stats.lastStudyDate ? new Date(stats.lastStudyDate).toDateString() : null;
        
        let newStreak = stats.streak;
        if (lastStudyDate === today) {
            // Already studied today, don't change streak
        } else if (lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
            // Studied yesterday, increment streak
            newStreak++;
        } else if (lastStudyDate === null || lastStudyDate !== today) {
            // First time or broke streak, start new streak
            newStreak = 1;
        }
        
        storage.updateStats({
            streak: newStreak,
            cardsStudiedToday: (lastStudyDate === today ? stats.cardsStudiedToday : 0) + this.studySession.cardsStudied,
            lastStudyDate: new Date().toISOString()
        });
        
        alert(`Study session complete!\n\nCards studied: ${this.studySession.cardsStudied}\nCurrent streak: ${newStreak} days`);
        
        this.showView('decks');
    }

    showNewDeckModal() {
        document.getElementById('new-deck-modal').classList.add('active');
        document.getElementById('deck-name-input').focus();
    }

    hideNewDeckModal() {
        document.getElementById('new-deck-modal').classList.remove('active');
        document.getElementById('deck-name-input').value = '';
        this.editingDeck = null;
        
        // Reset modal labels to default
        document.querySelector('#new-deck-modal h3').textContent = 'Create New Deck';
        document.getElementById('create-deck').textContent = 'Create';
    }

    async createDeck() {
        const name = document.getElementById('deck-name-input').value.trim();
        if (!name) {
            alert('Please enter a deck name');
            return;
        }
        
        if (this.editingDeck) {
            // Edit existing deck
            this.editingDeck.name = name;
            this.editingDeck.updatedAt = new Date().toISOString();
            
            if (await storage.saveDeck(this.editingDeck)) {
                this.hideNewDeckModal();
                this.renderDecks();
            } else {
                alert('Failed to update deck');
            }
        } else {
            // Create new deck
            const newDeck = {
                id: storage.generateUUID(),
                name,
                cards: [],
                createdAt: new Date().toISOString()
            };
            
            if (await storage.saveDeck(newDeck)) {
                this.hideNewDeckModal();
                this.renderDecks();
            } else {
                alert('Failed to create deck');
            }
        }
    }

    showNewCardModal() {
        if (!this.currentDeck) return;
        this.editingCard = null;
        document.getElementById('card-modal-title').textContent = 'Create New Card';
        document.getElementById('save-card').textContent = 'Create';
        document.getElementById('card-front-input').value = '';
        document.getElementById('card-back-input').value = '';
        document.getElementById('new-card-modal').classList.add('active');
        document.getElementById('card-front-input').focus();
    }

    hideNewCardModal() {
        document.getElementById('new-card-modal').classList.remove('active');
        document.getElementById('card-front-input').value = '';
        document.getElementById('card-back-input').value = '';
        this.editingCard = null;
    }

    editCard(cardId) {
        const card = this.currentDeck.cards.find(c => c.id === cardId);
        if (!card) return;
        
        this.editingCard = card;
        document.getElementById('card-modal-title').textContent = 'Edit Card';
        document.getElementById('save-card').textContent = 'Save';
        document.getElementById('card-front-input').value = card.front;
        document.getElementById('card-back-input').value = card.back;
        document.getElementById('new-card-modal').classList.add('active');
        document.getElementById('card-front-input').focus();
    }

    async saveCard() {
        const front = document.getElementById('card-front-input').value.trim();
        const back = document.getElementById('card-back-input').value.trim();
        const saveButton = document.getElementById('save-card');
        
        if (!front || !back) {
            alert('Please fill in both sides of the card');
            return;
        }
        
        // Prevent double-clicking
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        try {
            if (this.editingCard) {
                // Edit existing card
                this.editingCard.front = front;
                this.editingCard.back = back;
                this.editingCard.updatedAt = new Date().toISOString();
                this.editingCard.isModified = true;
            } else {
                // Create new card
                const newCard = {
                    id: storage.generateUUID(),
                    front,
                    back,
                    createdAt: new Date().toISOString(),
                    // SM-2 defaults
                    ease: 2.5,
                    interval: 1,
                    reps: 0,
                    lapses: 0,
                    due_date: this.getLocalDateString(),
                    reviewCount: 0,
                    isNew: true
                };
                this.currentDeck.cards.push(newCard);
            }
            
            if (await storage.saveDeck(this.currentDeck)) {
                this.hideNewCardModal();
                this.renderDeckView();
            } else {
                alert('Failed to save card');
            }
        } catch (error) {
            console.error('Error saving card:', error);
            alert('Failed to save card');
        } finally {
            // Re-enable the save button
            saveButton.disabled = false;
            saveButton.textContent = this.editingCard ? 'Update' : 'Create';
        }
    }

    async startStudyAllSession() {
        const decks = await storage.loadDecks();
        const allCards = [];
        
        // Collect all cards from all decks
        decks.forEach(deck => {
            deck.cards.forEach(card => {
                allCards.push({...card, deckName: deck.name});
            });
        });
        
        if (allCards.length === 0) {
            alert('No cards available to study!');
            return;
        }
        
        // Use spaced repetition to get cards to study
        const tempDeck = {cards: allCards};
        this.currentStudyCards = spacedRepetition.getCardsForStudy(tempDeck, 50);
        
        if (this.currentStudyCards.length === 0) {
            alert('No cards to study right now!');
            return;
        }
        
        // For study all, directly start combined mode
        this.currentDeck = null; // Mark as study all mode
        this.studySession = {
            startTime: new Date(),
            cardsStudied: 0,
            isStudyAll: true
        };
        
        this.startStudySessionWithMode('combined');
    }

    async updateStats() {
        if (window.statistics) {
            await window.statistics.refresh();
        }
    }

    async editDeck(deckId) {
        const decks = await storage.loadDecks();
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return;
        
        this.editingDeck = deck;
        document.getElementById('deck-name-input').value = deck.name;
        document.getElementById('new-deck-modal').classList.add('active');
        document.getElementById('deck-name-input').focus();
        
        // Update modal for editing
        document.querySelector('#new-deck-modal h3').textContent = 'Edit Deck';
        document.getElementById('create-deck').textContent = 'Save';
    }

    async deleteDeck(deckId) {
        const decks = await storage.loadDecks();
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return;

        const cardCount = deck.cards.length;
        const message = cardCount > 0 
            ? `Are you sure you want to delete "${deck.name}"?\n\nThis will permanently delete the deck and all ${cardCount} cards inside it. This action cannot be undone.`
            : `Are you sure you want to delete "${deck.name}"?\n\nThis action cannot be undone.`;

        if (confirm(message)) {
            try {
                await storage.deleteDeck(deckId);
                this.renderDecks();
                // If we're currently viewing this deck, go back to overview
                if (this.getCurrentView() === 'deck' && this.currentDeck?.id === deckId) {
                    this.showView('overview');
                }
            } catch (error) {
                alert('Failed to delete deck. Please try again.');
                console.error('Delete deck error:', error);
            }
        }
    }

    async deleteCard(cardId) {
        const card = this.currentDeck.cards.find(c => c.id === cardId);
        if (!card) return;

        if (confirm(`Are you sure you want to delete this card?\n\nFront: "${card.front}"\nBack: "${card.back}"\n\nThis action cannot be undone.`)) {
            try {
                // Delete card from Supabase first
                if (window.supabaseService) {
                    await window.supabaseService.deleteCard(cardId);
                }
                
                // Then remove card from current deck locally
                this.currentDeck.cards = this.currentDeck.cards.filter(c => c.id !== cardId);
                
                this.renderDeckView();
            } catch (error) {
                alert('Failed to delete card. Please try again.');
                console.error('Delete card error:', error);
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async eraseAllData() {
        if (!confirm('Are you sure you want to erase ALL data?\n\nThis will delete all decks and cards permanently. This action cannot be undone.')) {
            return;
        }
        
        try {
            // Clear Supabase data
            if (window.supabaseService) {
                await window.supabaseService.clearAllData();
            }
            
            // Clear local storage
            localStorage.clear();
            
            // Clear in-memory storage cache
            if (window.storage) {
                window.storage.decks = [];
                window.storage.isInitialized = false;
            }
            
            // Reset current app state
            this.currentDeck = null;
            this.currentStudyCards = [];
            this.currentCardIndex = 0;
            this.studySession = null;
            
            alert('All data has been erased successfully!');
            
            // Refresh the current view
            await this.renderOverview();
            this.renderDecks();
        } catch (error) {
            console.error('Failed to erase data:', error);
            alert('Failed to erase data. Please try again.');
        }
    }

    async addTestData() {
        if (!confirm('Add test data?\n\nThis will create 2 decks with 10 cards each for testing purposes.')) {
            return;
        }
        
        try {
            // Create test deck 1: Basic Spanish
            const spanishDeck = {
                id: storage.generateUUID(),
                name: 'Basic Spanish',
                cards: [
                    { id: storage.generateUUID(), front: 'Hello', back: 'Hola', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Goodbye', back: 'Adiós', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Please', back: 'Por favor', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Thank you', back: 'Gracias', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Yes', back: 'Sí', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'No', back: 'No', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Water', back: 'Agua', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Food', back: 'Comida', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'House', back: 'Casa', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'Cat', back: 'Gato', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true }
                ],
                createdAt: new Date().toISOString()
            };

            // Create test deck 2: Programming Terms
            const programmingDeck = {
                id: storage.generateUUID(),
                name: 'Programming Terms',
                cards: [
                    { id: storage.generateUUID(), front: 'What is a variable?', back: 'A container for storing data values', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is a function?', back: 'A reusable block of code that performs a specific task', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is an array?', back: 'An ordered list of elements', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is a loop?', back: 'A control structure that repeats a block of code', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is debugging?', back: 'The process of finding and fixing errors in code', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is an API?', back: 'Application Programming Interface - a set of protocols for building software', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is Git?', back: 'A version control system for tracking changes in files', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is HTML?', back: 'HyperText Markup Language - the structure of web pages', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is CSS?', back: 'Cascading Style Sheets - used for styling web pages', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true },
                    { id: storage.generateUUID(), front: 'What is JavaScript?', back: 'A programming language for web development', createdAt: new Date().toISOString(), ease: 2.5, interval: 1, reps: 0, lapses: 0, due_date: new Date().toISOString().split('T')[0], reviewCount: 0, isNew: true }
                ],
                createdAt: new Date().toISOString()
            };

            // Save both decks
            await storage.saveDeck(spanishDeck);
            await storage.saveDeck(programmingDeck);

            alert('Test data added successfully!\n\n2 decks created:\n- Basic Spanish (10 cards)\n- Programming Terms (10 cards)');
            
            // Refresh the decks view
            this.renderDecks();
            this.renderOverview();
        } catch (error) {
            console.error('Failed to add test data:', error);
            alert('Failed to add test data. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    window.app = new FlashcardApp();
    
    // Initialize statistics after a short delay to ensure everything is loaded
    setTimeout(async () => {
        if (window.statistics) {
            await window.statistics.initialize();
        }
    }, 1000);
});