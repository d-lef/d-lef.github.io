class SpacedRepetition {
    constructor() {
        this.maxInterval = 36500; // ~100 years max
    }

    // Proper SM-2 Algorithm implementation
    calculateNextReview(card, difficulty) {
        const now = new Date();
        let interval = card.interval || 1;
        let ease = card.ease || card.easeFactor || 2.5;
        let reps = card.reps || card.repetitions || 0;
        let lapses = card.lapses || 0;
        let grade;

        // Map difficulty to SM-2 grades (0-5)
        switch (difficulty) {
            case 'again':
                grade = 0;
                break;
            case 'hard':
                grade = 2;
                break;
            case 'good':
                grade = 3;
                break;
            case 'easy':
                grade = 5;
                break;
            default:
                grade = 3;
        }

        // SM-2 Algorithm
        if (grade < 3) {
            // Failed review - reset repetitions and increase lapses
            reps = 0;
            lapses += 1;
            interval = 1;
        } else {
            // Successful review
            reps += 1;
            
            if (reps === 1) {
                interval = 1;
            } else if (reps === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * ease);
            }
        }

        // Update ease factor based on grade
        ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        ease = Math.max(1.3, Math.min(5.0, ease));

        // Cap maximum interval
        interval = Math.min(interval, this.maxInterval);

        // Calculate next review date
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + interval);

        return {
            interval,
            ease,
            reps,
            lapses,
            grade,
            dueDate: nextReview.toISOString().split('T')[0], // Date only
            lastReviewed: now.toISOString().split('T')[0], // Date only
            nextReview: nextReview.toISOString(),
            // Legacy compatibility
            easeFactor: ease,
            repetitions: reps
        };
    }

    getCardsForStudy(deck, limit = 20) {
        const today = new Date().toISOString().split('T')[0];
        const studyCards = [];

        for (const card of deck.cards) {
            const dueDate = card.dueDate || card.due_date || card.nextReview;
            
            if (!dueDate || (card.reps || card.repetitions || 0) === 0) {
                // New card
                studyCards.push({...card, isNew: true});
            } else {
                const cardDueDate = dueDate.split('T')[0]; // Handle both date and datetime
                if (cardDueDate <= today) {
                    studyCards.push({...card, isDue: true});
                }
            }
        }

        studyCards.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            if (a.isDue && !b.isDue) return -1;
            if (!a.isDue && b.isDue) return 1;
            
            const aDue = a.dueDate || a.due_date || a.nextReview;
            const bDue = b.dueDate || b.due_date || b.nextReview;
            
            if (aDue && bDue) {
                return new Date(aDue) - new Date(bDue);
            }
            return 0;
        });

        return studyCards.slice(0, limit);
    }

    getCardsDueToday(deck) {
        const today = new Date().toISOString().split('T')[0];
        const dueCards = [];

        for (const card of deck.cards) {
            const dueDate = card.dueDate || card.due_date || card.nextReview;
            
            if (dueDate && (card.reps || card.repetitions || 0) > 0) {
                const cardDueDate = dueDate.split('T')[0];
                if (cardDueDate === today) {
                    dueCards.push({...card, isDue: true});
                }
            }
        }

        return dueCards;
    }

    getOverdueCards(deck) {
        const today = new Date().toISOString().split('T')[0];
        const overdueCards = [];

        for (const card of deck.cards) {
            const dueDate = card.dueDate || card.due_date || card.nextReview;
            
            if (dueDate && (card.reps || card.repetitions || 0) > 0) {
                const cardDueDate = dueDate.split('T')[0];
                if (cardDueDate < today) {
                    overdueCards.push({...card, isOverdue: true});
                }
            }
        }

        return overdueCards;
    }

    getNewCards(deck) {
        const newCards = [];

        for (const card of deck.cards) {
            const dueDate = card.dueDate || card.due_date || card.nextReview;
            
            if (!dueDate || (card.reps || card.repetitions || 0) === 0) {
                newCards.push({...card, isNew: true});
            }
        }

        return newCards;
    }

    getDueCount(deck) {
        const today = new Date().toISOString().split('T')[0];
        let dueCount = 0;

        for (const card of deck.cards) {
            const dueDate = card.dueDate || card.due_date || card.nextReview;
            
            if (!dueDate || (card.reps || card.repetitions || 0) === 0) {
                // New card
                dueCount++;
            } else {
                const cardDueDate = dueDate.split('T')[0]; // Handle both date and datetime
                if (cardDueDate <= today) {
                    dueCount++;
                }
            }
        }

        return dueCount;
    }

    updateCardAfterReview(card, difficulty) {
        const reviewData = this.calculateNextReview(card, difficulty);
        
        return {
            ...card,
            ...reviewData,
            reviewCount: (card.reviewCount || 0) + 1,
            isModified: true
        };
    }
}

window.spacedRepetition = new SpacedRepetition();