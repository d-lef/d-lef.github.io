class FlashcardApp {
    constructor() {
        this.currentDeck = null;
        this.currentStudyCards = [];
        this.currentCardIndex = 0;
        this.isCardFlipped = false;
        this.studySession = null;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadInitialView();
        this.updateStats();
    }

    setupEventListeners() {
        document.getElementById('decks-tab').addEventListener('click', () => this.showView('decks'));
        document.getElementById('stats-tab').addEventListener('click', () => this.showView('stats'));
        
        document.getElementById('new-deck-btn').addEventListener('click', () => this.showNewDeckModal());
        document.getElementById('new-card-btn').addEventListener('click', () => this.showNewCardModal());
        
        document.getElementById('create-deck').addEventListener('click', () => this.createDeck());
        document.getElementById('cancel-deck').addEventListener('click', () => this.hideNewDeckModal());
        document.getElementById('create-card').addEventListener('click', () => this.createCard());
        document.getElementById('cancel-card').addEventListener('click', () => this.hideNewCardModal());
        
        document.getElementById('flip-card').addEventListener('click', () => this.flipCard());
        document.getElementById('again-btn').addEventListener('click', () => this.answerCard('again'));
        document.getElementById('hard-btn').addEventListener('click', () => this.answerCard('hard'));
        document.getElementById('good-btn').addEventListener('click', () => this.answerCard('good'));
        document.getElementById('easy-btn').addEventListener('click', () => this.answerCard('easy'));
        
        document.getElementById('back-to-decks').addEventListener('click', () => this.showView('decks'));
        document.getElementById('back-to-decks-from-deck').addEventListener('click', () => this.showView('decks'));
        document.getElementById('study-deck-btn').addEventListener('click', () => this.startStudySession());

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideNewDeckModal();
                this.hideNewCardModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.getCurrentView() === 'study') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (!this.isCardFlipped) {
                        this.flipCard();
                    }
                } else if (this.isCardFlipped) {
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

    renderDecks() {
        const decks = storage.loadDecks();
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
            card.addEventListener('click', (e) => {
                const deckId = e.currentTarget.dataset.deckId;
                this.openDeck(deckId);
            });
        });
    }

    openDeck(deckId) {
        const decks = storage.loadDecks();
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
                <div class="card-item-front">${this.escapeHtml(card.front)}</div>
                <div class="card-item-back">${this.escapeHtml(card.back)}</div>
            </div>
        `).join('');
    }

    startStudySession() {
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
        
        this.showView('study');
    }

    renderStudyCard() {
        if (!this.currentStudyCards.length) return;
        
        const card = this.currentStudyCards[this.currentCardIndex];
        const progress = ((this.currentCardIndex + 1) / this.currentStudyCards.length) * 100;
        
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('card-counter').textContent = 
            `${this.currentCardIndex + 1}/${this.currentStudyCards.length}`;
        
        document.getElementById('card-front').textContent = card.front;
        document.getElementById('card-back').textContent = card.back;
        
        document.getElementById('flashcard').classList.remove('flipped');
        document.getElementById('flip-card').style.display = 'block';
        document.querySelector('.difficulty-buttons').style.display = 'none';
        
        this.isCardFlipped = false;
    }

    flipCard() {
        document.getElementById('flashcard').classList.add('flipped');
        document.getElementById('flip-card').style.display = 'none';
        document.querySelector('.difficulty-buttons').style.display = 'grid';
        this.isCardFlipped = true;
    }

    answerCard(difficulty) {
        if (!this.isCardFlipped) return;
        
        const card = this.currentStudyCards[this.currentCardIndex];
        const updatedCard = spacedRepetition.updateCardAfterReview(card, difficulty);
        
        const deckIndex = this.currentDeck.cards.findIndex(c => c.id === card.id);
        if (deckIndex >= 0) {
            this.currentDeck.cards[deckIndex] = updatedCard;
            storage.saveDeck(this.currentDeck);
        }
        
        this.studySession.cardsStudied++;
        
        this.currentCardIndex++;
        
        if (this.currentCardIndex >= this.currentStudyCards.length) {
            this.finishStudySession();
        } else {
            this.renderStudyCard();
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

    createDeck() {
        const name = document.getElementById('deck-name-input').value.trim();
        if (!name) {
            alert('Please enter a deck name');
            return;
        }
        
        const newDeck = {
            id: storage.generateId(),
            name,
            cards: [],
            createdAt: new Date().toISOString()
        };
        
        if (storage.saveDeck(newDeck)) {
            this.hideNewDeckModal();
            this.renderDecks();
        } else {
            alert('Failed to create deck');
        }
    }

    showNewCardModal() {
        if (!this.currentDeck) return;
        document.getElementById('new-card-modal').classList.add('active');
        document.getElementById('card-front-input').focus();
    }

    hideNewCardModal() {
        document.getElementById('new-card-modal').classList.remove('active');
        document.getElementById('card-front-input').value = '';
        document.getElementById('card-back-input').value = '';
    }

    createCard() {
        const front = document.getElementById('card-front-input').value.trim();
        const back = document.getElementById('card-back-input').value.trim();
        
        if (!front || !back) {
            alert('Please fill in both sides of the card');
            return;
        }
        
        const newCard = {
            id: storage.generateId(),
            front,
            back,
            createdAt: new Date().toISOString(),
            reviewCount: 0
        };
        
        this.currentDeck.cards.push(newCard);
        
        if (storage.saveDeck(this.currentDeck)) {
            this.hideNewCardModal();
            this.renderDeckView();
        } else {
            alert('Failed to create card');
        }
    }

    updateStats() {
        const stats = storage.loadStats();
        const decks = storage.loadDecks();
        const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
        
        document.getElementById('streak-count').textContent = stats.streak;
        document.getElementById('cards-today').textContent = stats.cardsStudiedToday;
        document.getElementById('total-cards').textContent = totalCards;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FlashcardApp();
});