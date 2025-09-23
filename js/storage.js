class Storage {
    constructor() {
        this.prefix = 'flashcard_app_';
        this.isInitialized = false;
        this.decks = [];
        this.lastSyncTime = null;
    }

    isTestingMode() {
        // Use fail-safe test mode detector
        return window.testModeDetector ? window.testModeDetector.isTestingMode() : false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Initializing storage...');

            // SAFETY: Never sync with database in test mode during initialization
            if (this.isTestingMode()) {
                console.log('🧪 Test mode active - skipping Supabase sync during initialization');
                this.decks = this.loadFromLocalStorage('decks') || [];
                this.isInitialized = true;
                return;
            }

            console.log('Normal mode - syncing with Supabase...');
            // Try to load from Supabase first (only in normal mode)
            const supabaseDecks = await window.supabaseService.syncDecks();
            
            if (supabaseDecks) {
                this.decks = supabaseDecks;
                // Also save to localStorage as backup
                try {
                    localStorage.setItem(this.prefix + 'decks', JSON.stringify(this.decks));
                } catch (storageError) {
                    console.error('🚨 CRITICAL: Failed to backup decks to localStorage:', storageError);
                    console.error('🚨 Offline access may be limited if connection is lost');
                }
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
        // In test mode, return test data from memory only
        if (this.isTestingMode()) {
            if (window.testDataManager) {
                return window.testDataManager.getDecks();
            } else {
                console.error('🚨 CRITICAL: Test mode active but testDataManager not available!');
                console.error('🚨 This could indicate a script loading issue. Falling back to empty data for safety.');
                return [];
            }
        }

        // Normal mode - return user data
        if (!this.isInitialized) {
            await this.initialize();
        }
        return [...this.decks]; // Return copy
    }

    async saveDeck(deck) {
        try {
            // CRITICAL ISOLATION: Test mode operations completely isolated from user data
            if (this.isTestingMode()) {
                return this._saveTestDeck(deck);
            }

            // Normal mode - save to user data
            return this._saveUserDeck(deck);
        } catch (error) {
            console.error('Failed to save deck:', error);
            return false;
        }
    }

    // Isolated test mode deck operations - never touches user data
    _saveTestDeck(deck) {
        if (!window.testDataManager) {
            console.error('🚨 CRITICAL: Test mode active but testDataManager not available!');
            return false;
        }

        const testDecks = window.testDataManager.getDecks();
        const existingIndex = testDecks.findIndex(d => d.id === deck.id);
        const isNew = existingIndex < 0;

        if (isNew) {
            deck.id = deck.id || window.testDataManager.generateTestUUID();
            deck.createdAt = deck.createdAt || new Date().toISOString();
            testDecks.push(deck);
        } else {
            testDecks[existingIndex] = deck;
        }

        window.testDataManager.updateDecks(testDecks);
        console.log(`🧪 Test deck ${isNew ? 'created' : 'updated'}:`, deck.name);
        return true;
    }

    // Normal user deck operations
    async _saveUserDeck(deck) {
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
                due_date: card.dueDate || card.due_date || null,
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
        console.log('About to save deck to Supabase:', {
            deckName: deck.name,
            isNew,
            cardCount: deck.cards?.length || 0,
            newCards: deck.cards?.filter(c => c.isNew).length || 0
        });
        await window.supabaseService.saveDeck(deck, isNew);

        console.log(`Deck ${isNew ? 'created' : 'updated'}:`, deck.name);
        return true;
    }

    async deleteDeck(deckId) {
        try {
            // CRITICAL ISOLATION: Test mode operations completely isolated from user data
            if (this.isTestingMode()) {
                return this._deleteTestDeck(deckId);
            }

            // Normal mode - delete from user data
            return this._deleteUserDeck(deckId);
        } catch (error) {
            console.error('Failed to delete deck:', error);
            return false;
        }
    }

    // Isolated test mode deck deletion - never touches user data
    _deleteTestDeck(deckId) {
        if (!window.testDataManager) {
            console.error('🚨 CRITICAL: Test mode active but testDataManager not available!');
            return false;
        }

        const testDecks = window.testDataManager.getDecks();
        const filteredDecks = testDecks.filter(d => d.id !== deckId);
        window.testDataManager.updateDecks(filteredDecks);
        console.log('🧪 Test deck deleted:', deckId);
        return true;
    }

    // Normal user deck deletion
    async _deleteUserDeck(deckId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.decks = this.decks.filter(d => d.id !== deckId);
        this.saveToLocalStorage('decks', this.decks);

        // Delete from Supabase
        await window.supabaseService.deleteDeck(deckId);

        console.log('Deck deleted:', deckId);
        return true;
    }

    // Stats methods
    saveStats(stats) {
        // In test mode, save to test data manager only
        if (this.isTestingMode()) {
            if (window.testDataManager) {
                window.testDataManager.updateStats(stats);
                console.log('🧪 Test stats updated');
            }
            return true;
        }

        // Normal mode - save to localStorage
        return this.saveToLocalStorage('stats', stats);
    }

    loadStats() {
        const defaultStats = {
            streak: 0,
            cardsStudiedToday: 0,
            totalCards: 0,
            lastStudyDate: null
        };

        // In test mode, return test stats
        if (this.isTestingMode()) {
            if (window.testDataManager) {
                return window.testDataManager.getStats();
            } else {
                console.error('🚨 CRITICAL: Test mode active but testDataManager not available for stats!');
                console.error('🚨 Returning safe default stats to prevent app errors.');
                return defaultStats;
            }
        }

        // Normal mode - load from localStorage
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
        // In test mode, generate test UUID
        if (this.isTestingMode()) {
            return window.testDataManager ? window.testDataManager.generateTestUUID() : this.generateId();
        }

        // Normal mode - use Supabase UUID
        return window.supabaseService.generateUUID();
    }

    // Force sync with Supabase
    async forcSync() {
        // SAFETY: Never sync in test mode to protect user data
        if (this.isTestingMode()) {
            console.log('🧪 Force sync skipped in test mode');
            return false;
        }

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

    // Phrasal verbs methods
    async populatePhrasalVerbs() {
        return await window.supabaseService.populatePhrasalVerbs();
    }

    async searchPhrasalVerbs(query) {
        return await window.supabaseService.searchPhrasalVerbs(query);
    }

    async getPhrasalVerbsCount() {
        return await window.supabaseService.getPhrasalVerbsCount();
    }

    async getPhrasalVerb(id) {
        return await window.supabaseService.getPhrasalVerb(id);
    }
}

// Initialize storage
window.storage = new Storage();