class FlashcardApp {
    constructor() {
        this.currentDeck = null;
        this.currentStudyCards = [];
        this.currentCardIndex = 0;
        this.isCardFlipped = false;
        this.studySession = null;
        this.editingCard = null;
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
        document.getElementById('decks-tab').addEventListener('click', () => this.showView('decks'));
        document.getElementById('stats-tab').addEventListener('click', () => this.showView('stats'));
        
        document.getElementById('new-deck-btn').addEventListener('click', () => this.showNewDeckModal());
        document.getElementById('new-card-btn').addEventListener('click', () => this.showNewCardModal());
        document.getElementById('study-all-btn').addEventListener('click', () => this.startStudyAllSession());
        
        document.getElementById('create-deck').addEventListener('click', () => this.createDeck());
        document.getElementById('cancel-deck').addEventListener('click', () => this.hideNewDeckModal());
        document.getElementById('save-card').addEventListener('click', () => this.saveCard());
        document.getElementById('cancel-card').addEventListener('click', () => this.hideNewCardModal());
        
        document.getElementById('flip-card').addEventListener('click', () => this.flipCard());
        document.getElementById('again-btn').addEventListener('click', () => this.answerCard('again'));
        document.getElementById('hard-btn').addEventListener('click', () => this.answerCard('hard'));
        document.getElementById('good-btn').addEventListener('click', () => this.answerCard('good'));
        document.getElementById('easy-btn').addEventListener('click', () => this.answerCard('easy'));
        
        document.getElementById('back-to-decks').addEventListener('click', () => this.showView('decks'));
        document.getElementById('back-to-decks-from-deck').addEventListener('click', () => this.showView('decks'));
        document.getElementById('back-to-decks-from-mode').addEventListener('click', () => this.showView('decks'));
        document.getElementById('study-deck-btn').addEventListener('click', () => this.showStudyModeSelection());
        
        // Study mode selection - use event delegation since buttons are added dynamically
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-select-btn')) {
                const mode = e.target.dataset.mode;
                this.startStudySessionWithMode(mode);
            }
        });
        
        // Typing mode event listeners
        document.getElementById('check-answer').addEventListener('click', () => this.checkTypedAnswer());
        document.getElementById('typing-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkTypedAnswer();
            }
        });
        
        // Typing mode difficulty buttons
        document.getElementById('again-btn-typing').addEventListener('click', () => this.answerCard('again'));
        document.getElementById('hard-btn-typing').addEventListener('click', () => this.answerCard('hard'));
        document.getElementById('good-btn-typing').addEventListener('click', () => this.answerCard('good'));
        document.getElementById('easy-btn-typing').addEventListener('click', () => this.answerCard('easy'));

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
            case 'decks':
                this.renderDecks();
                break;
            case 'stats':
                this.updateStats();
                break;
            case 'study':
                this.renderStudyCard();
                break;
            case 'study-mode':
                this.renderStudyModeView();
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
        this.showView('decks');
    }

    async renderDecks() {
        const decks = await storage.loadDecks();
        const decksList = document.getElementById('decks-list');
        
        if (decks.length === 0) {
            decksList.innerHTML = '<div class="empty-state"><p>No decks yet. Create your first deck!</p></div>';
            return;
        }
        
        decksList.innerHTML = decks.map(deck => {
            const dueCount = spacedRepetition.getDueCount(deck);
            return `
                <div class="deck-card" data-deck-id="${deck.id}">
                    <h3>${this.escapeHtml(deck.name)}</h3>
                    <div class="card-count">${deck.cards.length} cards</div>
                    ${dueCount > 0 ? `<div class="due-count">${dueCount}</div>` : ''}
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.deck-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                const deckId = e.currentTarget.dataset.deckId;
                await this.openDeck(deckId);
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
                <button class="card-edit-btn" data-card-id="${card.id}">✏️ Edit</button>
            </div>
        `).join('');
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.card-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = e.target.dataset.cardId;
                this.editCard(cardId);
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
        
        this.showView('study-mode');
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
        document.getElementById('card-counter').textContent = 
            `${this.currentCardIndex + 1}/${this.currentStudyCards.length}`;
        
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
    
    renderFlipInterface(card) {
        document.getElementById('flashcard').style.display = 'block';
        document.getElementById('typing-interface').style.display = 'none';
        document.querySelector('.study-actions').style.display = 'block';
        
        // Always hide combined progress (we removed the step-by-step progress)
        document.getElementById('combined-progress').style.display = 'none';
        
        document.getElementById('card-front').textContent = card.front;
        document.getElementById('card-back').textContent = card.back;
        
        document.getElementById('flashcard').classList.remove('flipped');
        document.getElementById('flip-card').style.display = 'block';
        document.querySelector('.difficulty-buttons').style.display = 'none';
        
        this.isCardFlipped = false;
    }
    
    renderTypingInterface(card) {
        document.getElementById('flashcard').style.display = 'none';
        document.getElementById('typing-interface').style.display = 'block';
        document.querySelector('.study-actions').style.display = 'none';
        
        // Always hide combined progress (we removed the step-by-step progress)
        document.getElementById('combined-progress').style.display = 'none';
        
        document.getElementById('typing-front').textContent = card.front;
        document.getElementById('typing-input').value = '';
        document.getElementById('answer-result').style.display = 'none';
        document.getElementById('typing-input').focus();
        
        this.currentAnswer = card.back;
    }
    
    initializeCombinedPairs() {
        this.combinedPairs = [];
        this.combinedCardStates = new Map();
        
        // Create pairs for each card: (card, "type") and (card, "flip")
        this.currentStudyCards.forEach(card => {
            this.combinedPairs.push({ card: card, mode: 'type', completed: false });
            this.combinedPairs.push({ card: card, mode: 'flip', completed: false });
            
            // Track completion state for each card
            this.combinedCardStates.set(card.id, {
                typeCompleted: false,
                flipCompleted: false,
                bothCompleted: false
            });
        });
        
        // Shuffle the pairs
        this.shuffleArray(this.combinedPairs);
        
        console.log('Combined pairs created:', this.combinedPairs.length);
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
        
        // Update progress counter to show current pair
        const remainingPairs = this.combinedPairs.filter(p => !p.completed).length;
        document.getElementById('card-counter').textContent = 
            `${this.combinedPairs.length - remainingPairs + 1}/${this.combinedPairs.length} (${mode})`;
        
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

    answerCard(difficulty) {
        if (!this.isCardFlipped && this.studyMode !== 'type' && this.getCurrentCombinedMode() !== 'type') return;
        
        if (this.studyMode === 'combined') {
            this.handleCombinedAnswer(difficulty);
        } else {
            this.handleRegularAnswer(difficulty);
        }
    }
    
    handleCombinedAnswer(difficulty) {
        const currentPair = this.combinedPairs[this.currentCardIndex];
        const card = currentPair.card;
        const mode = currentPair.mode;
        
        // Mark this pair as completed
        currentPair.completed = true;
        
        // Update card state tracking
        const cardState = this.combinedCardStates.get(card.id);
        if (mode === 'type') {
            cardState.typeCompleted = true;
        } else {
            cardState.flipCompleted = true;
        }
        
        // Check if both modes are completed for this card
        if (cardState.typeCompleted && cardState.flipCompleted && !cardState.bothCompleted) {
            cardState.bothCompleted = true;
            // Only now update the card with spaced repetition
            const updatedCard = spacedRepetition.updateCardAfterReview(card, difficulty);
            await this.updateCardInStorage(updatedCard);
            
            // Track review stats
            await this.trackReviewStat(difficulty);
            
            this.studySession.cardsStudied++;
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
                document.getElementById('answer-result').style.display = 'none';
            }
            this.renderStudyCard();
        }
    }
    
    async trackReviewStat(difficulty) {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const isCorrect = difficulty === 'good' || difficulty === 'easy';
            
            if (window.supabaseService) {
                await window.supabaseService.updateReviewStats(today, isCorrect);
            }
        } catch (error) {
            console.error('Failed to track review stat:', error);
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
            document.getElementById('answer-result').style.display = 'none';
            this.renderStudyCard();
        }
    }

    renderStudyModeView() {
        // This is handled by HTML, but we can add dynamic content here if needed
    }
    
    checkTypedAnswer() {
        const userAnswer = document.getElementById('typing-input').value.trim();
        const correctAnswer = this.currentAnswer;
        
        if (!userAnswer) {
            alert('Please type an answer first!');
            return;
        }
        
        const result = this.compareAnswers(userAnswer, correctAnswer);
        this.showAnswerResult(result, userAnswer, correctAnswer);
    }
    
    compareAnswers(userAnswer, correctAnswer) {
        const user = userAnswer.toLowerCase().trim();
        const correct = correctAnswer.toLowerCase().trim();
        
        // Exact match
        if (user === correct) {
            return 'correct';
        }
        
        // Check if user answer is contained in correct answer or vice versa
        const similarity = this.calculateSimilarity(user, correct);
        
        if (similarity > 0.8) {
            return 'correct';
        } else if (similarity > 0.5) {
            return 'partial';
        } else {
            return 'incorrect';
        }
    }
    
    calculateSimilarity(str1, str2) {
        // Simple similarity calculation based on common words
        const words1 = str1.split(/\s+/).filter(w => w.length > 2);
        const words2 = str2.split(/\s+/).filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) {
            return 0;
        }
        
        let matches = 0;
        words1.forEach(word1 => {
            if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
                matches++;
            }
        });
        
        return matches / Math.max(words1.length, words2.length);
    }
    
    showAnswerResult(result, userAnswer, correctAnswer) {
        const resultElement = document.getElementById('result-status');
        const yourAnswerElement = document.getElementById('your-answer-text');
        const correctAnswerElement = document.getElementById('correct-answer-text');
        
        resultElement.className = `result-status ${result}`;
        
        switch (result) {
            case 'correct':
                resultElement.textContent = '✅ Correct!';
                break;
            case 'partial':
                resultElement.textContent = '🟡 Partially Correct';
                break;
            case 'incorrect':
                resultElement.textContent = '❌ Incorrect';
                break;
        }
        
        yourAnswerElement.textContent = userAnswer;
        correctAnswerElement.textContent = correctAnswer;
        
        document.getElementById('answer-result').style.display = 'block';
        
        // Hide input area
        document.querySelector('.typing-input-area').style.display = 'none';
        
        // In combined mode, we handle completion differently
        if (this.studyMode === 'combined') {
            // Show difficulty buttons immediately for typing in combined mode
            document.querySelector('.difficulty-buttons').style.display = 'grid';
        }
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
    }

    async createDeck() {
        const name = document.getElementById('deck-name-input').value.trim();
        if (!name) {
            alert('Please enter a deck name');
            return;
        }
        
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
        
        if (!front || !back) {
            alert('Please fill in both sides of the card');
            return;
        }
        
        if (this.editingCard) {
            // Edit existing card
            this.editingCard.front = front;
            this.editingCard.back = back;
            this.editingCard.updatedAt = new Date().toISOString();
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
                due_date: new Date().toISOString().split('T')[0],
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
        
        // For study all, show mode selection
        this.currentDeck = null; // Mark as study all mode
        this.studySession = {
            startTime: new Date(),
            cardsStudied: 0,
            isStudyAll: true
        };
        
        this.showView('study-mode');
    }

    async updateStats() {
        if (window.statistics) {
            await window.statistics.refresh();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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