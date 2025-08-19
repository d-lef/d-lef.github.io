class SpacedRepetition {
    constructor() {
        this.defaultInterval = 1;
        this.easyBonus = 1.3;
        this.intervalModifier = 1.0;
        this.maxInterval = 36500;
    }

    calculateNextReview(card, difficulty) {
        const now = new Date();
        let interval = card.interval || this.defaultInterval;
        let easeFactor = card.easeFactor || 2.5;
        let repetitions = card.repetitions || 0;

        switch (difficulty) {
            case 'again':
                repetitions = 0;
                interval = 1;
                easeFactor = Math.max(1.3, easeFactor - 0.2);
                break;
                
            case 'hard':
                repetitions += 1;
                interval = Math.max(1, Math.round(interval * 1.2));
                easeFactor = Math.max(1.3, easeFactor - 0.15);
                break;
                
            case 'good':
                repetitions += 1;
                if (repetitions === 1) {
                    interval = 6;
                } else if (repetitions === 2) {
                    interval = Math.round(interval * easeFactor);
                } else {
                    interval = Math.round(interval * easeFactor * this.intervalModifier);
                }
                break;
                
            case 'easy':
                repetitions += 1;
                if (repetitions === 1) {
                    interval = 4;
                } else if (repetitions === 2) {
                    interval = Math.round(interval * easeFactor * this.easyBonus);
                } else {
                    interval = Math.round(interval * easeFactor * this.intervalModifier * this.easyBonus);
                }
                easeFactor = Math.min(5.0, easeFactor + 0.15);
                break;
        }

        interval = Math.min(interval, this.maxInterval);
        
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + interval);

        return {
            interval,
            easeFactor,
            repetitions,
            nextReview: nextReview.toISOString(),
            lastReviewed: now.toISOString()
        };
    }

    getCardsForStudy(deck, limit = 20) {
        const now = new Date();
        const studyCards = [];

        for (const card of deck.cards) {
            if (!card.nextReview) {
                studyCards.push({...card, isNew: true});
            } else {
                const nextReviewDate = new Date(card.nextReview);
                if (nextReviewDate <= now) {
                    studyCards.push({...card, isDue: true});
                }
            }
        }

        studyCards.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            if (a.isDue && !b.isDue) return -1;
            if (!a.isDue && b.isDue) return 1;
            
            if (a.nextReview && b.nextReview) {
                return new Date(a.nextReview) - new Date(b.nextReview);
            }
            return 0;
        });

        return studyCards.slice(0, limit);
    }

    getDueCount(deck) {
        const now = new Date();
        let dueCount = 0;

        for (const card of deck.cards) {
            if (!card.nextReview) {
                dueCount++;
            } else {
                const nextReviewDate = new Date(card.nextReview);
                if (nextReviewDate <= now) {
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
            reviewCount: (card.reviewCount || 0) + 1
        };
    }
}

window.spacedRepetition = new SpacedRepetition();