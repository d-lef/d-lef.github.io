class Settings {
    constructor() {
        this.settings = {
            theme: 'light',
            language: 'ru',
            testingMode: false,
            starRaceGame: true
        };

        // Race condition protection
        this._testModeChanging = false;
        this._lastTestModeChange = 0;
        this._testModeDebounceDelay = 500; // 500ms debounce

        // Memory leak prevention
        this._timeouts = new Set(); // Track timeouts for cleanup

        this.loadSettings();
        this.initializeUI();
        this.setupEventListeners();
        this.applySettings();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('flashcard_settings');
            if (saved) {
                try {
                    this.settings = { ...this.settings, ...JSON.parse(saved) };
                } catch (parseError) {
                    console.error('Failed to parse saved settings:', parseError);
                }
            }
        } catch (error) {
            console.error('🚨 CRITICAL: Failed to access localStorage for loading settings:', error);
            console.error('🚨 Using default settings to prevent app crash');
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('flashcard_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('🚨 CRITICAL: Failed to save settings to localStorage:', error);
            console.error('🚨 Settings changes will not persist across sessions');
        }
    }
    
    initializeUI() {
        // Set initial toggle states
        const themeToggle = document.getElementById('theme-toggle');
        const langToggle = document.getElementById('lang-toggle');
        const testingToggle = document.getElementById('testing-toggle');
        const starRaceToggle = document.getElementById('star-race-toggle');

        if (themeToggle) {
            themeToggle.checked = this.settings.theme === 'dark';
        }

        if (langToggle) {
            langToggle.checked = this.settings.language === 'ru';
        }

        if (testingToggle) {
            testingToggle.checked = this.settings.testingMode;
        }

        if (starRaceToggle) {
            starRaceToggle.checked = this.settings.starRaceGame;
        }
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                this.setTheme(e.target.checked ? 'dark' : 'light');
            });
        }
        
        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('change', (e) => {
                this.setLanguage(e.target.checked ? 'ru' : 'en');
            });
        }

        // Testing mode toggle
        const testingToggle = document.getElementById('testing-toggle');
        if (testingToggle) {
            testingToggle.addEventListener('change', (e) => {
                const success = this.setTestingMode(e.target.checked);

                // If test mode change was blocked, revert UI toggle to reflect actual state
                if (!success) {
                    console.log('🧪 UI: Test mode change blocked, reverting toggle state');
                    const timeoutId = setTimeout(() => {
                        if (testingToggle) {
                            testingToggle.checked = this.settings.testingMode;
                        }
                        this._timeouts.delete(timeoutId);
                    }, 50);
                    this._timeouts.add(timeoutId);
                }
            });
        }

        // Star Race toggle
        const starRaceToggle = document.getElementById('star-race-toggle');
        if (starRaceToggle) {
            starRaceToggle.addEventListener('change', (e) => {
                this.setStarRaceGame(e.target.checked);
            });
        }

        // Game rules navigation
        const spaceshipName = document.getElementById('spaceship-name');
        const spaceshipDescription = document.getElementById('spaceship-description');
        const backFromGameRules = document.getElementById('back-from-game-rules');

        if (spaceshipName) {
            spaceshipName.addEventListener('click', () => {
                this.showGameRules();
            });
        }

        if (spaceshipDescription) {
            spaceshipDescription.addEventListener('click', () => {
                this.showGameRules();
            });
        }

        if (backFromGameRules) {
            backFromGameRules.addEventListener('click', () => {
                this.hideGameRules();
            });
        }
    }
    
    setTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applyTheme();
    }
    
    setLanguage(language) {
        this.settings.language = language;
        this.saveSettings();
        this.applyLanguage();
    }

    setStarRaceGame(enabled) {
        this.settings.starRaceGame = enabled;
        this.saveSettings();
        console.log(enabled ? '🌟 Star Race game enabled' : '🌟 Star Race game disabled');
    }

    setTestingMode(enabled) {
        const now = Date.now();

        // RACE CONDITION PROTECTION: Prevent concurrent test mode switches
        if (this._testModeChanging) {
            console.log('🧪 BLOCKED: Test mode change already in progress, ignoring concurrent request');
            return false;
        }

        // DEBOUNCE PROTECTION: Prevent rapid successive test mode switches
        if (now - this._lastTestModeChange < this._testModeDebounceDelay) {
            console.log('🧪 BLOCKED: Test mode change too soon after previous change, ignoring rapid toggle');
            return false;
        }

        // Check if mode is actually changing
        if (this.settings.testingMode === enabled) {
            console.log('🧪 Test mode already ' + (enabled ? 'enabled' : 'disabled') + ', no change needed');
            return true;
        }

        try {
            this._testModeChanging = true;
            this._lastTestModeChange = now;

            console.log(`🧪 Starting test mode transition: ${this.settings.testingMode} → ${enabled}`);

            this.settings.testingMode = enabled;
            this.saveSettings();
            this.applyTestingMode();

            // CRITICAL: Update the fail-safe detector
            if (window.testModeDetector) {
                window.testModeDetector.setTestingMode(enabled);
            }

            // Reset app state when toggling test mode
            if (window.app) {
                window.app.currentDeck = null;
                window.app.currentStudyCards = [];
                window.app.studySession = null;
                window.app.editingCard = null;
                window.app.editingDeck = null;
                window.app.showView('overview');
            }

            // When disabling test mode, process any pending sync queue
            if (!enabled && window.supabaseService) {
                console.log('🧪 Test mode disabled - checking for pending sync operations...');
                const timeoutId = setTimeout(() => {
                    if (window.supabaseService && !this.isTestingMode()) {
                        window.supabaseService.processSyncQueue();
                    }
                    this._timeouts.delete(timeoutId);
                }, 1000); // Small delay to ensure all state is properly updated
                this._timeouts.add(timeoutId);
            }

            console.log(enabled ? '🧪 Test mode enabled' : '🧪 Test mode disabled');
            return true;

        } catch (error) {
            console.error('🚨 CRITICAL: Test mode transition failed:', error);
            return false;
        } finally {
            // Always unlock after transition attempt
            const timeoutId = setTimeout(() => {
                this._testModeChanging = false;
                this._timeouts.delete(timeoutId);
            }, 100); // Small delay to prevent immediate re-triggering
            this._timeouts.add(timeoutId);
        }
    }

    applySettings() {
        this.applyTheme();
        this.applyLanguage();
        this.applyTestingMode();
    }
    
    applyTheme() {
        const body = document.body;
        if (this.settings.theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
        } else {
            body.removeAttribute('data-theme');
        }
    }
    
    applyLanguage() {
        if (window.i18n) {
            window.i18n.setLanguage(this.settings.language);
        }
    }

    applyTestingMode() {
        const body = document.body;
        if (this.settings.testingMode) {
            body.setAttribute('data-testing-mode', 'true');
        } else {
            body.removeAttribute('data-testing-mode');
        }
    }

    isTestingMode() {
        return this.settings.testingMode;
    }

    isStarRaceEnabled() {
        return this.settings.starRaceGame;
    }

    getSetting(key) {
        return this.settings[key];
    }
    
    getAllSettings() {
        return { ...this.settings };
    }

    showGameRules() {
        if (window.app) {
            window.app.showView('game-rules');
        }
    }

    hideGameRules() {
        if (window.app) {
            window.app.showView('settings');
        }
    }

    // MEMORY LEAK PREVENTION: Cleanup method to clear all timeouts
    cleanup() {
        try {
            console.log('🧪 Cleaning up Settings...');

            // Clear all timeouts
            this._timeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this._timeouts.clear();

            console.log('🧪 Settings cleanup completed');
        } catch (error) {
            console.error('🚨 CRITICAL: Settings cleanup failed:', error);
        }
    }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settings = new Settings();
});