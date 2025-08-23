class Storage {
    constructor() {
        this.prefix = 'flashcard_app_';
        this.isInitialized = false;
        this.decks = [];
        this.lastSyncTime = null;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing storage and syncing with Supabase...');
            
            // Try to load from Supabase first
            const supabaseDecks = await window.supabaseService.syncDecks();
            
            if (supabaseDecks) {
                this.decks = supabaseDecks;
                // Also save to localStorage as backup
                localStorage.setItem(this.prefix + 'decks', JSON.stringify(this.decks));
                console.log('Loaded', this.decks.length, 'decks from Supabase');
            } else {
                // Fallback to localStorage
                this.decks = this.loadFromLocalStorage('decks') || [];
                console.log('Loaded', this.decks.length, 'decks from localStorage');
            }
            
            this.lastSyncTime = Date.now();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            // Fallback to localStorage
            this.decks = this.loadFromLocalStorage('decks') || [];
            this.isInitialized = true;
        }
    }

    // Local storage methods (backup/cache)
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Local storage save error:', error);
            return false;
        }
    }

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Local storage load error:', error);
            return null;
        }
    }

    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Local storage remove error:', error);
            return false;
        }
    }

    // Main storage methods
    async saveDecks(decks) {
        this.decks = decks;
        this.saveToLocalStorage('decks', decks);
        // Note: Individual deck saves handle Supabase sync
        return true;
    }

    async loadDecks() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return [...this.decks]; // Return copy
    }

    async saveDeck(deck) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const existingIndex = this.decks.findIndex(d => d.id === deck.id);
            const isNew = existingIndex < 0;
            
            // Ensure new cards have IDs and proper schema
            if (deck.cards) {
                deck.cards = deck.cards.map(card => ({
                    ...card,
                    id: card.id || this.generateUUID(),
                    // Ensure all SM-2 fields are present
                    ease: card.ease || card.easeFactor || 2.5,
                    interval: card.interval || 1,
                    reps: card.reps || card.repetitions || 0,
                    lapses: card.lapses || 0,
                    due_date: card.dueDate || card.due_date || new Date().toISOString().split('T')[0],
                    // Preserve the existing isNew flag - don't recalculate it
                    isNew: card.isNew || false
                }));
            }

            if (isNew) {
                deck.id = deck.id || this.generateUUID();
                deck.createdAt = deck.createdAt || new Date().toISOString();
                this.decks.push(deck);
            } else {
                this.decks[existingIndex] = deck;
            }
            
            // Save to localStorage immediately
            this.saveToLocalStorage('decks', this.decks);
            
            // Sync to Supabase
            await window.supabaseService.saveDeck(deck, isNew);
            
            console.log(`Deck ${isNew ? 'created' : 'updated'}:`, deck.name);
            return true;
        } catch (error) {
            console.error('Failed to save deck:', error);
            return false;
        }
    }

    async deleteDeck(deckId) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            this.decks = this.decks.filter(d => d.id !== deckId);
            this.saveToLocalStorage('decks', this.decks);
            
            // Delete from Supabase
            await window.supabaseService.deleteDeck(deckId);
            
            console.log('Deck deleted:', deckId);
            return true;
        } catch (error) {
            console.error('Failed to delete deck:', error);
            return false;
        }
    }

    // Stats methods (keep local for now)
    saveStats(stats) {
        return this.saveToLocalStorage('stats', stats);
    }

    loadStats() {
        const defaultStats = {
            streak: 0,
            cardsStudiedToday: 0,
            totalCards: 0,
            lastStudyDate: null
        };
        return this.loadFromLocalStorage('stats') || defaultStats;
    }

    updateStats(updates) {
        const stats = this.loadStats();
        const updatedStats = { ...stats, ...updates };
        return this.saveStats(updatedStats);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    generateUUID() {
        return window.supabaseService.generateUUID();
    }

    // Force sync with Supabase
    async forcSync() {
        try {
            const supabaseDecks = await window.supabaseService.syncDecks();
            if (supabaseDecks) {
                this.decks = supabaseDecks;
                this.saveToLocalStorage('decks', this.decks);
                this.lastSyncTime = Date.now();
                console.log('Force sync completed');
                return true;
            }
        } catch (error) {
            console.error('Force sync failed:', error);
        }
        return false;
    }

    // Irregular verbs methods
    async populateIrregularVerbs() {
        return await window.supabaseService.populateIrregularVerbs();
    }

    async searchIrregularVerbs(query) {
        return await window.supabaseService.searchIrregularVerbs(query);
    }

    async getIrregularVerb(id) {
        return await window.supabaseService.getIrregularVerb(id);
    }
}

// Initialize storage
window.storage = new Storage();