class Statistics {
    constructor() {
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.monthNames = {
            en: ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'],
            ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        };
        this.dayNames = {
            en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
        };
    }

    async loadStats() {
        try {
            // Get current month's data
            const startDate = new Date(this.currentYear, this.currentMonth, 1).toISOString().split('T')[0];
            const endDate = new Date(this.currentYear, this.currentMonth + 1, 0).toISOString().split('T')[0];
            
            const reviewStats = await window.supabaseService.getReviewStats(startDate, endDate);
            
            // Get today's stats
            const today = new Date().toISOString().split('T')[0];
            const todayStats = reviewStats.find(stat => stat.day === today) || 
                             { reviews: 0, correct: 0, lapses: 0 };
            
            // Calculate weekly stats
            const weekStats = this.calculateWeekStats(reviewStats);
            
            // Calculate streak
            const streak = await this.calculateStreak();
            
            // Get total cards from storage
            const decks = await storage.loadDecks();
            const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
            
            return {
                today: todayStats,
                week: weekStats,
                month: reviewStats,
                streak: streak,
                totalCards: totalCards
            };
        } catch (error) {
            console.error('Failed to load statistics:', error);
            return {
                today: { reviews: 0, correct: 0, lapses: 0 },
                week: { reviews: 0, accuracy: 0, days: 0 },
                month: [],
                streak: 0,
                totalCards: 0
            };
        }
    }

    calculateWeekStats(reviewStats) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        let totalReviews = 0;
        let totalCorrect = 0;
        let studyDays = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayStat = reviewStats.find(stat => stat.day === dateStr);
            if (dayStat && dayStat.reviews > 0) {
                totalReviews += dayStat.reviews;
                totalCorrect += dayStat.correct;
                studyDays++;
            }
        }
        
        const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
        
        return {
            reviews: totalReviews,
            accuracy: accuracy,
            days: studyDays
        };
    }

    async calculateStreak() {
        try {
            // Get last 365 days of stats
            const today = new Date();
            const yearAgo = new Date(today);
            yearAgo.setDate(today.getDate() - 365);
            
            const startDate = yearAgo.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];
            
            const reviewStats = await window.supabaseService.getReviewStats(startDate, endDate);
            
            // Create a set of study days
            const studyDays = new Set(
                reviewStats
                    .filter(stat => stat.reviews > 0)
                    .map(stat => stat.day)
            );
            
            // Calculate streak
            let streak = 0;
            const currentDate = new Date(today);
            
            while (currentDate >= yearAgo) {
                const dateStr = currentDate.toISOString().split('T')[0];
                if (studyDays.has(dateStr)) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
            
            return streak;
        } catch (error) {
            console.error('Failed to calculate streak:', error);
            return 0;
        }
    }

    updateDisplay(stats) {
        // Update quick stats - check if elements exist first
        const streakElement = document.getElementById('overview-streak-count');
        if (streakElement) {
            streakElement.textContent = stats.streak;
        }
        
        const reviewsTodayElement = document.getElementById('reviews-today');
        if (reviewsTodayElement) {
            reviewsTodayElement.textContent = stats.today.reviews;
        }
        
        const totalCardsElement = document.getElementById('total-cards');
        if (totalCardsElement) {
            totalCardsElement.textContent = stats.totalCards;
        }
        
        // Update today's accuracy
        const accuracyElement = document.getElementById('accuracy-today');
        if (accuracyElement) {
            if (stats.today.reviews > 0) {
                const accuracy = Math.round((stats.today.correct / stats.today.reviews) * 100);
                accuracyElement.textContent = accuracy;
            } else {
                accuracyElement.textContent = '--';
            }
        }
        
        // Update weekly stats
        const weekReviewsElement = document.getElementById('week-reviews');
        if (weekReviewsElement) {
            weekReviewsElement.textContent = stats.week.reviews;
        }
        
        const weekDaysElement = document.getElementById('week-days');
        if (weekDaysElement) {
            weekDaysElement.textContent = stats.week.days;
        }
        
        const weekAccuracyElement = document.getElementById('week-accuracy');
        if (weekAccuracyElement) {
            if (stats.week.reviews > 0) {
                weekAccuracyElement.textContent = stats.week.accuracy + '%';
            } else {
                weekAccuracyElement.textContent = '--';
            }
        }
        
        // Update calendar
        this.renderCalendar(stats.month);
    }

    renderCalendar(monthStats) {
        const calendar = document.getElementById('study-calendar');
        const monthTitle = document.getElementById('current-month');
        
        // Update month title
        const lang = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
        const monthName = this.monthNames[lang][this.currentMonth];
        monthTitle.textContent = `${monthName} ${this.currentYear}`;
        
        // Clear calendar
        calendar.innerHTML = '';
        
        // Add day headers
        const dayNames = this.dayNames[lang];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendar.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check if it's today
            const today = new Date();
            if (this.currentYear === today.getFullYear() && 
                this.currentMonth === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Get stats for this day
            const dateStr = new Date(this.currentYear, this.currentMonth, day).toISOString().split('T')[0];
            const dayStat = monthStats.find(stat => stat.day === dateStr);
            
            // Apply study intensity class
            if (dayStat && dayStat.reviews > 0) {
                if (dayStat.reviews >= 50) {
                    dayElement.classList.add('high-study');
                } else if (dayStat.reviews >= 20) {
                    dayElement.classList.add('medium-study');
                } else {
                    dayElement.classList.add('low-study');
                }
                
                // Add tooltip with stats
                dayElement.title = `${dayStat.reviews} reviews, ${Math.round((dayStat.correct / dayStat.reviews) * 100)}% accuracy`;
            } else {
                dayElement.classList.add('no-study');
            }
            
            calendar.appendChild(dayElement);
        }
    }

    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.refresh();
        });
        
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.refresh();
        });
    }

    async refresh() {
        const stats = await this.loadStats();
        this.updateDisplay(stats);
    }

    async initialize() {
        this.setupEventListeners();
        await this.refresh();
    }
}

// Initialize statistics
window.statistics = new Statistics();