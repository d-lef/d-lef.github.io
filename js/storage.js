class Storage {
    constructor() {
        this.prefix = 'flashcard_app_';
    }

    save(key, data) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    load(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    saveDecks(decks) {
        return this.save('decks', decks);
    }

    loadDecks() {
        return this.load('decks') || [];
    }

    saveDeck(deck) {
        const decks = this.loadDecks();
        const existingIndex = decks.findIndex(d => d.id === deck.id);
        
        if (existingIndex >= 0) {
            decks[existingIndex] = deck;
        } else {
            decks.push(deck);
        }
        
        return this.saveDecks(decks);
    }

    deleteDeck(deckId) {
        const decks = this.loadDecks();
        const filteredDecks = decks.filter(d => d.id !== deckId);
        return this.saveDecks(filteredDecks);
    }

    saveStats(stats) {
        return this.save('stats', stats);
    }

    loadStats() {
        const defaultStats = {
            streak: 0,
            cardsStudiedToday: 0,
            totalCards: 0,
            lastStudyDate: null
        };
        return this.load('stats') || defaultStats;
    }

    updateStats(updates) {
        const stats = this.loadStats();
        const updatedStats = { ...stats, ...updates };
        return this.saveStats(updatedStats);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}

window.storage = new Storage();