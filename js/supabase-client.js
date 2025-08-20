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
            console.log('Syncing decks from Supabase...');
            
            // First, test basic connection
            const { data: testData, error: testError } = await this.client
                .from('decks')
                .select('count', { count: 'exact', head: true });
            
            if (testError) {
                console.error('Supabase connection test failed:', testError);
                throw testError;
            }
            
            console.log('Supabase connection successful, deck count:', testData);
            
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
            
            if (error) {
                console.error('Supabase select error:', error);
                throw error;
            }
            
            console.log('Raw Supabase data:', data);
            const transformedDecks = this.transformDecksFromSupabase(data);
            console.log('Transformed decks:', transformedDecks);
            
            return transformedDecks;
        } catch (error) {
            console.error('Failed to sync decks from Supabase:', error.message, error);
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
        console.log('Executing save deck:', { deck, isNew });
        
        const deckData = {
            id: deck.id,
            name: deck.name,
            created_at: deck.createdAt || new Date().toISOString()
        };

        if (isNew) {
            console.log('Inserting new deck:', deckData);
            const { data, error: deckError } = await this.client
                .from('decks')
                .insert([deckData])
                .select();
            
            if (deckError) {
                console.error('Deck insert error:', deckError);
                throw deckError;
            }
            console.log('Deck inserted successfully:', data);
        } else {
            console.log('Updating existing deck:', deckData.id);
            const { data, error: deckError } = await this.client
                .from('decks')
                .update({
                    name: deckData.name
                })
                .eq('id', deckData.id)
                .select();
            
            if (deckError) {
                console.error('Deck update error:', deckError);
                throw deckError;
            }
            console.log('Deck updated successfully:', data);
        }

        // Handle cards - only save new or modified cards
        if (deck.cards && deck.cards.length > 0) {
            const cardsToSave = deck.cards.filter(card => 
                card.isNew === true || card.isModified === true
            );
            
            if (cardsToSave.length > 0) {
                console.log('Processing', cardsToSave.length, 'new/modified cards out of', deck.cards.length, 'total cards');
                
                for (const card of cardsToSave) {
                    try {
                        // Check if card is truly new - only if it explicitly has isNew=true AND no database timestamps
                        const isNew = card.isNew === true && !card.created_at && !card.updated_at;
                        const result = await this.saveCard(card, deck.id, isNew);
                        
                        // If save was successful, mark card as no longer new/modified
                        if (result) {
                            if (card.isNew) {
                                card.isNew = false;
                                // Also add timestamp to prevent future confusion
                                if (!card.created_at) {
                                    card.created_at = new Date().toISOString();
                                }
                            }
                            card.isModified = false;
                            card.updated_at = new Date().toISOString();
                        }
                    } catch (error) {
                        console.error('Failed to save card:', card.id, error);
                        // Continue with other cards
                    }
                }
            } else {
                console.log('No new or modified cards to save');
            }
        }

        return true;
    }

    async saveCard(card, deckId, isNew = false) {
        console.log('Saving card:', { cardId: card.id, deckId, isNew });
        
        const cardData = {
            id: card.id,
            deck_id: deckId,
            front: card.front,
            back: card.back,
            ease: parseFloat(card.ease || card.easeFactor || 2.5),
            interval: parseInt(card.interval || 1),
            reps: parseInt(card.reps || card.repetitions || 0),
            lapses: parseInt(card.lapses || 0),
            grade: card.grade ? parseInt(card.grade) : null,
            due_date: card.dueDate || card.due_date || (card.nextReview ? new Date(card.nextReview).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            last_reviewed: card.lastReviewed || card.last_reviewed || null,
            created_at: card.createdAt || card.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Card data prepared:', cardData);

        if (isNew) {
            // Double-check: verify card doesn't exist before inserting
            const { data: existing } = await this.client
                .from('cards')
                .select('id')
                .eq('id', cardData.id)
                .maybeSingle();
            
            if (existing) {
                console.log('Card already exists, updating instead of inserting:', cardData.id);
                const { data, error } = await this.client
                    .from('cards')
                    .update(cardData)
                    .eq('id', cardData.id)
                    .select();
                
                if (error) {
                    console.error('Card update error:', error);
                    throw error;
                }
                console.log('Card updated successfully:', data);
            } else {
                const { data, error } = await this.client
                    .from('cards')
                    .insert([cardData])
                    .select();
                
                if (error) {
                    console.error('Card insert error:', error);
                    throw error;
                }
                console.log('Card inserted successfully:', data);
            }
        } else {
            const { data, error } = await this.client
                .from('cards')
                .update(cardData)
                .eq('id', cardData.id)
                .select();
            
            if (error) {
                console.error('Card update error:', error);
                throw error;
            }
            console.log('Card updated successfully:', data);
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
                    case 'updateReviewStats':
                        await this.executeUpdateReviewStats(operation.data.date, operation.data.isCorrect);
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

    async updateReviewStats(date, isCorrect) {
        const operation = {
            type: 'updateReviewStats',
            data: { date, isCorrect },
            timestamp: Date.now()
        };

        if (!this.isOnline) {
            this.addToSyncQueue(operation);
            return true;
        }

        try {
            return await this.executeUpdateReviewStats(date, isCorrect);
        } catch (error) {
            console.error('Failed to update review stats:', error);
            this.addToSyncQueue(operation);
            return true;
        }
    }

    async executeUpdateReviewStats(date, isCorrect) {
        console.log('Updating review stats for:', { date, isCorrect });
        
        // Upsert review stats for the day
        const { data, error } = await this.client
            .from('review_stats')
            .upsert({
                day: date,
                reviews: 1,
                correct: isCorrect ? 1 : 0,
                lapses: isCorrect ? 0 : 1
            }, {
                onConflict: 'day',
                ignoreDuplicates: false
            });

        if (error) {
            // If upsert failed, try to increment existing record
            console.log('Upsert failed, trying increment approach:', error);
            
            // First get current stats
            const { data: current, error: selectError } = await this.client
                .from('review_stats')
                .select('reviews, correct, lapses')
                .eq('day', date)
                .single();

            if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Failed to get current stats:', selectError);
                throw selectError;
            }

            // Update with incremented values
            const newStats = {
                day: date,
                reviews: (current?.reviews || 0) + 1,
                correct: (current?.correct || 0) + (isCorrect ? 1 : 0),
                lapses: (current?.lapses || 0) + (isCorrect ? 0 : 1)
            };

            const { error: updateError } = await this.client
                .from('review_stats')
                .upsert(newStats);

            if (updateError) {
                console.error('Failed to update review stats:', updateError);
                throw updateError;
            }
        }

        console.log('Review stats updated successfully');
        return true;
    }

    async getReviewStats(startDate, endDate) {
        try {
            let query = this.client
                .from('review_stats')
                .select('day, reviews, correct, lapses')
                .order('day', { ascending: false });

            if (startDate) {
                query = query.gte('day', startDate);
            }
            if (endDate) {
                query = query.lte('day', endDate);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to get review stats:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch review stats:', error);
            return [];
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