// Test data for demonstration mode
// This data exists only in memory and never touches localStorage or database

class TestDataManager {
    constructor() {
        // Test data lives in memory only - never persisted
        this.testDecks = [
            {
                id: 'test-deck-german-001',
                name: 'German Basics 🇩🇪',
                createdAt: '2024-01-15T10:30:00.000Z',
                cards: [
                    {
                        id: 'test-card-ger-001',
                        front: 'Hello',
                        back: 'Hallo',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-002',
                        front: 'Thank you',
                        back: 'Danke',
                        ease: 2.6,
                        interval: 3,
                        reps: 2,
                        lapses: 0,
                        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Due yesterday
                        isNew: false
                    },
                    {
                        id: 'test-card-ger-003',
                        front: 'Please',
                        back: 'Bitte',
                        ease: 2.8,
                        interval: 7,
                        reps: 3,
                        lapses: 0,
                        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
                        isNew: false
                    },
                    {
                        id: 'test-card-ger-004',
                        front: 'House',
                        back: 'Haus',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-005',
                        front: 'Book',
                        back: 'Buch',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-006',
                        front: 'Water',
                        back: 'Wasser',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-007',
                        front: 'Cat',
                        back: 'Katze',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-008',
                        front: 'Dog',
                        back: 'Hund',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-009',
                        front: 'Apple',
                        back: 'Apfel',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-ger-010',
                        front: 'Tree',
                        back: 'Baum',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                ]
            },
            {
                id: 'test-deck-russian-001',
                name: 'Russian Essentials 🇷🇺',
                createdAt: '2024-01-20T14:15:00.000Z',
                cards: [
                    {
                        id: 'test-card-rus-001',
                        front: 'Hello',
                        back: 'Привет',
                        ease: 2.7,
                        interval: 4,
                        reps: 2,
                        lapses: 0,
                        due_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Due 2 hours ago
                        isNew: false
                    },
                    {
                        id: 'test-card-rus-002',
                        front: 'Thank you',
                        back: 'Спасибо',
                        ease: 2.9,
                        interval: 14,
                        reps: 4,
                        lapses: 0,
                        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Due in 5 days
                        isNew: false
                    },
                    {
                        id: 'test-card-rus-003',
                        front: 'Please',
                        back: 'Пожалуйста',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-rus-004',
                        front: 'Good morning',
                        back: 'Доброе утро',
                        ease: 2.4,
                        interval: 2,
                        reps: 1,
                        lapses: 0,
                        due_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Due in 30 minutes
                        isNew: false
                    },
                    {
                        id: 'test-card-rus-005',
                        front: 'Goodbye',
                        back: 'До свидания',
                        ease: 2.2,
                        interval: 1,
                        reps: 2,
                        lapses: 2,
                        due_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Due 30 minutes ago
                        isNew: false
                    },
                    {
                        id: 'test-card-rus-006',
                        front: 'Bread',
                        back: 'Хлеб',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-rus-007',
                        front: 'Milk',
                        back: 'Молоко',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-rus-008',
                        front: 'Fish',
                        back: 'Рыба',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-rus-009',
                        front: 'Moon',
                        back: 'Луна',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    },
                    {
                        id: 'test-card-rus-010',
                        front: 'Bird',
                        back: 'Птица',
                        ease: 2.5,
                        interval: 1,
                        reps: 0,
                        lapses: 0,
                        due_date: null,
                        isNew: true
                    }
                ]
            }
        ];

        this.testStats = {
            streak: 5,
            cardsStudiedToday: 8,
            totalCards: 10,
            lastStudyDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        };

        this.testReviewStats = [
            {
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
                cardsReviewed: 12,
                correctAnswers: 9,
                averageResponseTime: 3.2,
                streak: 4,
                allDueCompleted: true
            },
            {
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
                cardsReviewed: 15,
                correctAnswers: 13,
                averageResponseTime: 2.8,
                streak: 3,
                allDueCompleted: true
            }
        ];
    }

    // Get deep copy to prevent external modifications
    getDecks() {
        return JSON.parse(JSON.stringify(this.testDecks));
    }

    getStats() {
        return JSON.parse(JSON.stringify(this.testStats));
    }

    getReviewStats() {
        return JSON.parse(JSON.stringify(this.testReviewStats));
    }

    updateReviewStats(reviewStats) {
        this.testReviewStats = JSON.parse(JSON.stringify(reviewStats));
    }

    // Update test data in memory (for testing CRUD operations)
    updateDecks(decks) {
        this.testDecks = JSON.parse(JSON.stringify(decks));
    }

    updateStats(stats) {
        this.testStats = JSON.parse(JSON.stringify(stats));
    }

    generateTestUUID() {
        return 'test-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
    }
}

// Initialize test data manager
if (typeof window !== 'undefined') {
    window.testDataManager = new TestDataManager();
}