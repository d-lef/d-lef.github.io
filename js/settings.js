class Settings {
    constructor() {
        this.settings = {
            theme: 'light',
            language: 'ru'
        };
        
        this.loadSettings();
        this.initializeUI();
        this.setupEventListeners();
        this.applySettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('flashcard_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('flashcard_settings', JSON.stringify(this.settings));
    }
    
    initializeUI() {
        // Set initial toggle states
        const themeToggle = document.getElementById('theme-toggle');
        const langToggle = document.getElementById('lang-toggle');
        
        if (themeToggle) {
            themeToggle.checked = this.settings.theme === 'dark';
        }
        
        if (langToggle) {
            langToggle.checked = this.settings.language === 'ru';
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
    
    applySettings() {
        this.applyTheme();
        this.applyLanguage();
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
    
    getSetting(key) {
        return this.settings[key];
    }
    
    getAllSettings() {
        return { ...this.settings };
    }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settings = new Settings();
});