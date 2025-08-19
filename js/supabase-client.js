class SupabaseService {
    constructor() {
        this.supabaseUrl = 'https://ysflavogvcdftoguzutz.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZmxhdm9ndmNkZnRvZ3V6dXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzE0MzYsImV4cCI6MjA3MTIwNzQzNn0.U8k5SproF3mdBhbzc3KE9D2VIpBL3m6vx9i7BuFJ3QM';
        
        this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async syncDecks() {
        try {
            const { data, error } = await this.client
                .from('decks')
                .select(`
                    id,
                    name,
                    created_at,
                    cards (
                        id,
                        front,
                        back,
                        ease,
                        interval,
                        reps,
                        lapses,
                        grade,
                        due_date,
                        last_reviewed,
                        created_at,
                        updated_at
                    )
                `);
            
            if (error) throw error;
            
            return this.transformDecksFromSupabase(data);
        } catch (error) {
            console.error('Failed to sync decks from Supabase:', error);
            return null;
        }
    }

    transformDecksFromSupabase(supabaseDecks) {
        return supabaseDecks.map(deck => ({
            id: deck.id,
            name: deck.name,
            createdAt: deck.created_at,
            cards: deck.cards.map(card => ({
                id: card.id,
                front: card.front,
                back: card.back,
                ease: card.ease,
                interval: card.interval,
                reps: card.reps,
                lapses: card.lapses,
                grade: card.grade,
                dueDate: card.due_date,
                lastReviewed: card.last_reviewed,
                createdAt: card.created_at,
                updatedAt: card.updated_at,
                // Legacy fields for compatibility
                easeFactor: card.ease,
                repetitions: card.reps,
                nextReview: card.due_date ? new Date(card.due_date).toISOString() : null,
                reviewCount: card.reps || 0
            }))
        }));
    }

    async saveDeck(deck, isNew = false) {
        const operation = {
            type: 'saveDeck',
            data: { deck, isNew },
            timestamp: Date.now()
        };

        if (!this.isOnline) {
            this.addToSyncQueue(operation);
            return true;
        }

        try {
            return await this.executeSaveDeck(deck, isNew);
        } catch (error) {
            console.error('Failed to save deck to Supabase:', error);
            this.addToSyncQueue(operation);
            return true; // Return true for UX, will sync later
        }
    }

    async executeSaveDeck(deck, isNew) {
        const deckData = {
            id: deck.id,
            name: deck.name,
            created_at: deck.createdAt || new Date().toISOString()
        };

        if (isNew) {
            const { error: deckError } = await this.client
                .from('decks')
                .insert([deckData]);
            
            if (deckError) throw deckError;
        } else {
            const { error: deckError } = await this.client
                .from('decks')
                .update({
                    name: deckData.name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', deckData.id);
            
            if (deckError) throw deckError;
        }

        // Handle cards
        if (deck.cards && deck.cards.length > 0) {
            for (const card of deck.cards) {
                await this.saveCard(card, deck.id, card.isNew);
            }
        }

        return true;
    }

    async saveCard(card, deckId, isNew = false) {
        const cardData = {
            id: card.id,
            deck_id: deckId,
            front: card.front,
            back: card.back,
            ease: card.ease || card.easeFactor || 2.5,
            interval: card.interval || 1,
            reps: card.reps || card.repetitions || 0,
            lapses: card.lapses || 0,
            grade: card.grade || null,
            due_date: card.dueDate || card.nextReview ? new Date(card.dueDate || card.nextReview).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            last_reviewed: card.lastReviewed ? new Date(card.lastReviewed).toISOString().split('T')[0] : null,
            created_at: card.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (isNew) {
            const { error } = await this.client
                .from('cards')
                .insert([cardData]);
            
            if (error) throw error;
        } else {
            const { error } = await this.client
                .from('cards')
                .update(cardData)
                .eq('id', cardData.id);
            
            if (error) throw error;
        }

        return true;
    }

    async deleteDeck(deckId) {
        const operation = {
            type: 'deleteDeck',
            data: { deckId },
            timestamp: Date.now()
        };

        if (!this.isOnline) {
            this.addToSyncQueue(operation);
            return true;
        }

        try {
            const { error } = await this.client
                .from('decks')
                .delete()
                .eq('id', deckId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Failed to delete deck from Supabase:', error);
            this.addToSyncQueue(operation);
            return true;
        }
    }

    async deleteCard(cardId) {
        const operation = {
            type: 'deleteCard',
            data: { cardId },
            timestamp: Date.now()
        };

        if (!this.isOnline) {
            this.addToSyncQueue(operation);
            return true;
        }

        try {
            const { error } = await this.client
                .from('cards')
                .delete()
                .eq('id', cardId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Failed to delete card from Supabase:', error);
            this.addToSyncQueue(operation);
            return true;
        }
    }

    addToSyncQueue(operation) {
        this.syncQueue.push(operation);
        // Persist queue to localStorage
        localStorage.setItem('supabase_sync_queue', JSON.stringify(this.syncQueue));
    }

    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) return;

        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const operation of queue) {
            try {
                switch (operation.type) {
                    case 'saveDeck':
                        await this.executeSaveDeck(operation.data.deck, operation.data.isNew);
                        break;
                    case 'deleteDeck':
                        await this.deleteDeck(operation.data.deckId);
                        break;
                    case 'deleteCard':
                        await this.deleteCard(operation.data.cardId);
                        break;
                }
            } catch (error) {
                console.error('Failed to process sync operation:', error);
                this.addToSyncQueue(operation); // Re-queue on failure
            }
        }

        // Clear processed items from localStorage
        localStorage.setItem('supabase_sync_queue', JSON.stringify(this.syncQueue));
    }

    loadSyncQueue() {
        try {
            const queue = localStorage.getItem('supabase_sync_queue');
            if (queue) {
                this.syncQueue = JSON.parse(queue);
            }
        } catch (error) {
            console.error('Failed to load sync queue:', error);
            this.syncQueue = [];
        }
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

// Initialize Supabase service
window.supabaseService = new SupabaseService();
window.supabaseService.loadSyncQueue();