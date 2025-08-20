class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {
            en: {
                // App
                'app.title': 'Flashcards',
                
                // Navigation
                'nav.overview': 'Overview',
                'nav.decks': 'Decks',
                'nav.stats': 'Stats',
                'nav.settings': 'Settings',
                
                // Overview
                'overview.title': 'Study Overview',
                'overview.due_today': 'Due Today',
                'overview.reviewed_today': 'Reviewed Today',
                'overview.overdue': 'Overdue Cards',
                'overview.study_streak': 'Study Streak',
                'overview.recent_activity': 'Recent Activity',
                
                // Settings
                'settings.title': 'Settings',
                'settings.appearance': 'Appearance',
                'settings.theme': 'Theme',
                'settings.light': 'Light',
                'settings.dark': 'Dark',
                'settings.language': 'Language',
                'settings.study': 'Study Settings',
                'settings.study_desc': 'Study configuration options will be available in future updates.',
                'settings.about': 'About',
                'settings.app_version': 'App Version: 2.0',
                'settings.powered_by': 'Powered by Supabase & SM-2 Algorithm',
                
                // Actions
                'actions.study_all': 'Study All Cards',
                'actions.new_deck': 'New Deck',
                'actions.new_card': 'New Card',
                'actions.back': 'Back',
                'actions.study': 'Study',
                'actions.cancel': 'Cancel',
                'actions.create': 'Create',
                
                // Stats
                'stats.title': 'Study Statistics',
                'stats.streak': 'Study Streak',
                'stats.reviews_today': 'Reviews Today',
                'stats.accuracy_today': 'Today\'s Accuracy',
                'stats.total_cards': 'Total Cards',
                'stats.days': 'days',
                'stats.cards': 'cards',
                'stats.reviews': 'reviews',
                'stats.no_study': 'No study',
                'stats.light_study': 'Light study',
                'stats.medium_study': 'Medium study',
                'stats.intensive_study': 'Intensive study',
                'stats.this_week': 'This Week',
                'stats.total_reviews': 'Total Reviews',
                'stats.avg_accuracy': 'Average Accuracy',
                'stats.study_days': 'Study Days',
                
                // Study Mode
                'study_mode.title': 'Choose Study Mode',
                'study_mode.flip_title': 'Flip Cards Only',
                'study_mode.flip_desc': 'Traditional flashcard mode. See the front, flip to reveal answer, rate difficulty.',
                'study_mode.start_flip': 'Start Flip Mode',
                'study_mode.type_title': 'Type Answer Only',
                'study_mode.type_desc': 'Type your answer and check if it\'s correct. More challenging and active recall.',
                'study_mode.start_type': 'Start Type Mode',
                'study_mode.combined_title': 'Combined Mode',
                'study_mode.rigorous': 'Rigorous study:',
                'study_mode.combined_desc': 'Each card requires BOTH typing and flipping to pass. Best for retention!',
                'study_mode.start_combined': 'Start Combined Mode',
                
                // Study
                'study.type_answer': 'Type Answer',
                'study.review_card': 'Review Card',
                'study.flip_card': 'Flip Card',
                'study.check_answer': 'Check Answer',
                'study.your_answer': 'Your answer:',
                'study.correct_answer': 'Correct answer:',
                'study.type_placeholder': 'Type your answer...',
                
                // Difficulty
                'difficulty.again': 'Again',
                'difficulty.hard': 'Hard',
                'difficulty.good': 'Good',
                'difficulty.easy': 'Easy',
                
                // Modals
                'modal.create_deck': 'Create New Deck',
                'modal.deck_name': 'Deck name',
                'modal.create_card': 'Create New Card',
                'modal.front': 'Front:',
                'modal.back': 'Back:',
                'modal.front_placeholder': 'Enter front side text',
                'modal.back_placeholder': 'Enter back side text'
            },
            
            ru: {
                // App
                'app.title': 'Карточки',
                
                // Navigation
                'nav.overview': 'Обзор',
                'nav.decks': 'Колоды',
                'nav.stats': 'Статистика',
                'nav.settings': 'Настройки',
                
                // Overview
                'overview.title': 'Обзор изучения',
                'overview.due_today': 'Сегодня',
                'overview.reviewed_today': 'Повторено сегодня',
                'overview.overdue': 'Просрочено',
                'overview.study_streak': 'Дни подряд',
                'overview.recent_activity': 'Последняя активность',
                
                // Settings
                'settings.title': 'Настройки',
                'settings.appearance': 'Внешний вид',
                'settings.theme': 'Тема',
                'settings.light': 'Светлая',
                'settings.dark': 'Тёмная',
                'settings.language': 'Язык',
                'settings.study': 'Настройки изучения',
                'settings.study_desc': 'Параметры изучения будут доступны в будущих обновлениях.',
                'settings.about': 'О программе',
                'settings.app_version': 'Версия приложения: 2.0',
                'settings.powered_by': 'Работает на Supabase и алгоритме SM-2',
                
                // Actions
                'actions.study_all': 'Изучить все карточки',
                'actions.new_deck': 'Новая колода',
                'actions.new_card': 'Новая карточка',
                'actions.back': 'Назад',
                'actions.study': 'Изучать',
                'actions.cancel': 'Отмена',
                'actions.create': 'Создать',
                
                // Stats
                'stats.title': 'Статистика изучения',
                'stats.streak': 'Дни подряд',
                'stats.reviews_today': 'Повторений сегодня',
                'stats.accuracy_today': 'Точность сегодня',
                'stats.total_cards': 'Всего карточек',
                'stats.days': 'дней',
                'stats.cards': 'карточек',
                'stats.reviews': 'повторений',
                'stats.no_study': 'Не изучали',
                'stats.light_study': 'Лёгкое изучение',
                'stats.medium_study': 'Среднее изучение',
                'stats.intensive_study': 'Интенсивное изучение',
                'stats.this_week': 'На этой неделе',
                'stats.total_reviews': 'Всего повторений',
                'stats.avg_accuracy': 'Средняя точность',
                'stats.study_days': 'Дней изучения',
                
                // Study Mode
                'study_mode.title': 'Выберите режим изучения',
                'study_mode.flip_title': 'Только переворот',
                'study_mode.flip_desc': 'Традиционный режим карточек. Посмотрите на лицевую сторону, переверните для ответа, оцените сложность.',
                'study_mode.start_flip': 'Начать режим переворота',
                'study_mode.type_title': 'Только набор текста',
                'study_mode.type_desc': 'Напечатайте ваш ответ и проверьте, правильно ли это. Более сложный и активный способ запоминания.',
                'study_mode.start_type': 'Начать режим набора',
                'study_mode.combined_title': 'Комбинированный режим',
                'study_mode.rigorous': 'Тщательное изучение:',
                'study_mode.combined_desc': 'Каждая карточка требует И набора текста И переворота для прохождения. Лучше для запоминания!',
                'study_mode.start_combined': 'Начать комбинированный режим',
                
                // Study
                'study.type_answer': 'Набрать ответ',
                'study.review_card': 'Просмотр карточки',
                'study.flip_card': 'Перевернуть карточку',
                'study.check_answer': 'Проверить ответ',
                'study.your_answer': 'Ваш ответ:',
                'study.correct_answer': 'Правильный ответ:',
                'study.type_placeholder': 'Напечатайте ваш ответ...',
                
                // Difficulty
                'difficulty.again': 'Снова',
                'difficulty.hard': 'Сложно',
                'difficulty.good': 'Хорошо',
                'difficulty.easy': 'Легко',
                
                // Modals
                'modal.create_deck': 'Создать новую колоду',
                'modal.deck_name': 'Название колоды',
                'modal.create_card': 'Создать новую карточку',
                'modal.front': 'Лицевая сторона:',
                'modal.back': 'Обратная сторона:',
                'modal.front_placeholder': 'Введите текст лицевой стороны',
                'modal.back_placeholder': 'Введите текст обратной стороны'
            }
        };
        
        this.loadLanguagePreference();
    }
    
    loadLanguagePreference() {
        const saved = localStorage.getItem('flashcard_language');
        if (saved && this.translations[saved]) {
            this.currentLanguage = saved;
        }
    }
    
    saveLanguagePreference() {
        localStorage.setItem('flashcard_language', this.currentLanguage);
    }
    
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.saveLanguagePreference();
            this.updatePageTranslations();
        }
    }
    
    translate(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    updatePageTranslations() {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            element.textContent = translation;
        });
        
        // Update placeholders
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.translate(key);
            element.placeholder = translation;
        });
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Initialize i18n
window.i18n = new I18n();