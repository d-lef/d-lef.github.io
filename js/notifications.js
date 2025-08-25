/**
 * Notification Manager for Flashcard PWA
 * Handles local notifications for study reminders
 */
class NotificationManager {
    constructor(i18n) {
        this.i18n = i18n;
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        this.reminderTimeouts = new Map();
    }

    /**
     * Check if notifications are supported and get current permission status
     */
    getPermissionStatus() {
        if (!this.isSupported) return 'unsupported';
        return Notification.permission;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.log('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Get notification messages in current language
     */
    getMessages() {
        const lang = this.i18n.currentLanguage;
        
        return {
            'en': {
                dailyReminder: {
                    title: '📚 Time to study!',
                    body: 'Keep your streak alive - review today\'s flashcards'
                },
                streakRisk: {
                    title: '🔥 Your {streak}-day streak is at risk!',
                    body: 'Don\'t break your amazing progress - study now!'
                },
                lastChance: {
                    title: '⚡ Last chance to save your streak!',
                    body: 'Only a few hours left - complete today\'s cards now'
                },
                actions: {
                    study: 'Study Now',
                    later: 'Later'
                }
            },
            'ru': {
                dailyReminder: {
                    title: '📚 Время заниматься!',
                    body: 'Сохрани свою серию — повтори карточки за сегодня'
                },
                streakRisk: {
                    title: '🔥 Твоя серия в {streak} дней под угрозой!',
                    body: 'Не теряй достигнутое — занимайся прямо сейчас!'
                },
                lastChance: {
                    title: '⚡ Последний шанс спасти серию!',
                    body: 'Остались считанные часы — изучи карточки за сегодня'
                },
                actions: {
                    study: 'Заниматься',
                    later: 'Позже'
                }
            }
        }[lang] || this.getMessages()['en'];
    }

    /**
     * Show a notification immediately
     */
    async showNotification(type, data = {}) {
        if (Notification.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const messages = this.getMessages();
            
            let notification;
            switch (type) {
                case 'dailyReminder':
                    notification = messages.dailyReminder;
                    break;
                case 'streakRisk':
                    notification = {
                        title: messages.streakRisk.title.replace('{streak}', data.streak || '0'),
                        body: messages.streakRisk.body
                    };
                    break;
                case 'lastChance':
                    notification = messages.lastChance;
                    break;
                default:
                    console.error('Unknown notification type:', type);
                    return;
            }

            await registration.showNotification(notification.title, {
                body: notification.body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: `flashcard-${type}`,
                requireInteraction: true,
                actions: [
                    {
                        action: 'study',
                        title: messages.actions.study,
                        icon: '/icon-192.png'
                    },
                    {
                        action: 'later',
                        title: messages.actions.later
                    }
                ],
                data: {
                    type: type,
                    url: '/?notification=' + type
                }
            });

            console.log(`Notification sent: ${type}`);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Schedule daily study reminder
     */
    async scheduleDailyReminder(timeString = '18:00') {
        if (Notification.permission !== 'granted') {
            console.log('Cannot schedule notification: permission not granted');
            return;
        }

        // Clear any existing timeout
        this.clearDailyReminder();

        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        
        scheduledTime.setHours(hours, minutes, 0, 0);

        // If time already passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timeUntilNotification = scheduledTime.getTime() - now.getTime();
        
        console.log(`Scheduling daily reminder for ${scheduledTime.toLocaleString()}`);

        const timeoutId = setTimeout(async () => {
            // Check if user has already studied today
            const hasStudiedToday = await this.checkStudiedToday();
            
            if (!hasStudiedToday) {
                await this.showNotification('dailyReminder');
            }

            // Schedule for next day
            this.scheduleDailyReminder(timeString);
        }, timeUntilNotification);

        this.reminderTimeouts.set('daily', timeoutId);
    }

    /**
     * Schedule streak risk notification (2 hours before reminder)
     */
    async scheduleStreakRiskReminder(dailyReminderTime = '18:00') {
        if (Notification.permission !== 'granted') return;

        const [hours, minutes] = dailyReminderTime.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours - 2, minutes, 0, 0); // 2 hours before daily reminder

        const now = new Date();
        if (reminderDate <= now) {
            reminderDate.setDate(reminderDate.getDate() + 1);
        }

        const timeUntilNotification = reminderDate.getTime() - now.getTime();

        const timeoutId = setTimeout(async () => {
            // Check current streak and if user studied today
            const streak = await this.getCurrentStreak();
            const hasStudiedToday = await this.checkStudiedToday();
            
            if (streak > 0 && !hasStudiedToday) {
                await this.showNotification('streakRisk', { streak });
            }

            // Schedule for next day
            this.scheduleStreakRiskReminder(dailyReminderTime);
        }, timeUntilNotification);

        this.reminderTimeouts.set('streakRisk', timeoutId);
    }

    /**
     * Schedule last chance notification (10 PM)
     */
    async scheduleLastChanceReminder() {
        if (Notification.permission !== 'granted') return;

        const lastChanceTime = new Date();
        lastChanceTime.setHours(22, 0, 0, 0); // 10 PM

        const now = new Date();
        if (lastChanceTime <= now) {
            lastChanceTime.setDate(lastChanceTime.getDate() + 1);
        }

        const timeUntilNotification = lastChanceTime.getTime() - now.getTime();

        const timeoutId = setTimeout(async () => {
            // Check current streak and if user studied today
            const streak = await this.getCurrentStreak();
            const hasStudiedToday = await this.checkStudiedToday();
            
            if (streak > 0 && !hasStudiedToday) {
                await this.showNotification('lastChance');
            }

            // Schedule for next day
            this.scheduleLastChanceReminder();
        }, timeUntilNotification);

        this.reminderTimeouts.set('lastChance', timeoutId);
    }

    /**
     * Clear all scheduled reminders
     */
    clearAllReminders() {
        this.reminderTimeouts.forEach((timeoutId, key) => {
            clearTimeout(timeoutId);
            console.log(`Cleared ${key} reminder`);
        });
        this.reminderTimeouts.clear();
    }

    /**
     * Clear daily reminder specifically
     */
    clearDailyReminder() {
        if (this.reminderTimeouts.has('daily')) {
            clearTimeout(this.reminderTimeouts.get('daily'));
            this.reminderTimeouts.delete('daily');
            console.log('Cleared daily reminder');
        }
    }

    /**
     * Check if user has studied today
     */
    async checkStudiedToday() {
        try {
            const today = this.getLocalDateString();
            if (window.supabaseService) {
                const stats = await window.supabaseService.getReviewStats(today, today);
                return stats.length > 0 && stats[0].reviews > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking if studied today:', error);
            return false;
        }
    }

    /**
     * Get current streak
     */
    async getCurrentStreak() {
        try {
            if (window.statistics) {
                return await window.statistics.calculateStreak();
            }
            return 0;
        } catch (error) {
            console.error('Error getting current streak:', error);
            return 0;
        }
    }

    /**
     * Get local date string in YYYY-MM-DD format
     */
    getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Initialize notification system with user settings
     */
    async initialize(settings = {}) {
        const {
            enabled = false,
            dailyReminderTime = '18:00',
            streakReminders = true
        } = settings;

        if (!enabled) {
            this.clearAllReminders();
            return;
        }

        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
            console.log('Notification permission denied, cannot initialize');
            return;
        }

        // Schedule daily reminder
        await this.scheduleDailyReminder(dailyReminderTime);

        // Schedule streak-based reminders if enabled
        if (streakReminders) {
            await this.scheduleStreakRiskReminder(dailyReminderTime);
            await this.scheduleLastChanceReminder();
        }

        console.log('Notification system initialized');
    }

    /**
     * Update reminder time
     */
    async updateReminderTime(newTime) {
        const settings = this.loadSettings();
        if (settings.enabled) {
            await this.scheduleDailyReminder(newTime);
            if (settings.streakReminders) {
                await this.scheduleStreakRiskReminder(newTime);
            }
        }
    }

    /**
     * Save notification settings
     */
    saveSettings(settings) {
        localStorage.setItem('flashcard_notification_settings', JSON.stringify(settings));
    }

    /**
     * Load notification settings
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('flashcard_notification_settings');
            return settings ? JSON.parse(settings) : {
                enabled: false,
                dailyReminderTime: '18:00',
                streakReminders: true
            };
        } catch (error) {
            console.error('Error loading notification settings:', error);
            return {
                enabled: false,
                dailyReminderTime: '18:00',
                streakReminders: true
            };
        }
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}