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
                'overview.study_calendar': 'Study Calendar',
                
                // Settings
                'settings.title': 'Settings',
                'settings.appearance': 'Appearance',
                'settings.theme': 'Theme',
                'settings.light': 'Light',
                'settings.dark': 'Dark',
                'settings.language': 'Language',
                'settings.spaced_repetition': 'How Spaced Repetition Works',
                'settings.sm2_adaptive': '🧠 Adaptive Learning',
                'settings.sm2_adaptive_desc': 'Cards you find difficult appear more frequently, while easy cards appear less often.',
                'settings.sm2_intervals': '⏰ Smart Intervals',
                'settings.sm2_intervals_desc': 'Review intervals increase exponentially: 1 day → 6 days → weeks → months.',
                'settings.sm2_grades': '⭐ Four Grades',
                'settings.sm2_grades_desc': '<strong>Again</strong> (restart), <strong>Hard</strong> (shorter interval), <strong>Good</strong> (normal), <strong>Easy</strong> (longer interval).',
                'settings.sm2_retention': '💡 Long-term Memory',
                'settings.sm2_retention_desc': 'Reviews happen just before you\'re likely to forget, maximizing retention with minimal effort.',
                
                // Actions
                'actions.study_all': 'Study All Cards',
                'actions.new_deck': 'New Deck',
                'actions.new_card': 'New Card',
                'actions.back': 'Back',
                'actions.study': 'Study',
                'actions.cancel': 'Cancel',
                'actions.create': 'Create',
                'actions.select': 'Select',
                'actions.save': 'Save',
                'actions.delete': 'Delete',
                
                // Card Types
                'card_type.select_type': 'Select Card Type',
                'card_type.flip': 'Flip Cards',
                'card_type.flip_description': 'Traditional flashcard study with front/back card flipping',
                'card_type.flip_type': 'Flip + Type',
                'card_type.flip_type_description': 'Active recall by typing answers plus card review',
                'card_type.irregular_verbs': 'Irregular Verbs',
                'card_type.irregular_verbs_description': 'Specialized templates for verb conjugation practice',
                'card_type.coming_soon': 'Coming Soon',
                'card_type.card_behavior': 'Card Behavior',
                'card_type.flip_only': 'Flip Only',
                'card_type.flip_and_type': 'Flip + Type',
                
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
                'study.dont_remember': 'I don\'t remember',
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
                'modal.edit_card': 'Edit Card',
                'modal.front': 'Front:',
                'modal.back': 'Back:',
                'modal.front_placeholder': 'Enter front side text',
                'modal.back_placeholder': 'Enter back side text',
                
                // Irregular Verbs
                'irregular_verbs.preview': 'Verb Preview',
                'irregular_verbs.infinitive': 'Infinitive',
                'irregular_verbs.past_simple': 'Past Simple',
                'irregular_verbs.past_participle': 'Past Participle',
                'irregular_verbs.translation': 'Translation',
                'irregular_verbs.create_cards': 'Create 3 Cards',
                'irregular_verbs.search_placeholder': 'Type infinitive (e.g., \'go\', \'take\')...',
                
                // Card Statistics Modal
                'card_stats.title': 'Card Statistics',
                'card_stats.successful_reviews': 'Successful Reviews So Far',
                'card_stats.failed_reviews': 'Failed Reviews So Far',
                'card_stats.next_due_date': 'Next Due Date',
                'card_stats.not_scheduled': 'Not scheduled',
                'card_stats.close': 'Close'
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
                'overview.study_calendar': 'Календарь изучения',
                
                // Settings
                'settings.title': 'Настройки',
                'settings.appearance': 'Внешний вид',
                'settings.theme': 'Тема',
                'settings.light': 'Светлая',
                'settings.dark': 'Тёмная',
                'settings.language': 'Язык',
                'settings.spaced_repetition': 'Как работает интервальное повторение',
                'settings.sm2_adaptive': '🧠 Адаптивное обучение',
                'settings.sm2_adaptive_desc': 'Сложные карточки появляются чаще, а лёгкие — реже.',
                'settings.sm2_intervals': '⏰ Умные интервалы',
                'settings.sm2_intervals_desc': 'Интервалы повторения растут экспоненциально: 1 день → 6 дней → недели → месяцы.',
                'settings.sm2_grades': '⭐ Четыре оценки',
                'settings.sm2_grades_desc': '<strong>Снова</strong> (сначала), <strong>Сложно</strong> (короче интервал), <strong>Хорошо</strong> (обычно), <strong>Легко</strong> (длиннее интервал).',
                'settings.sm2_retention': '💡 Долговременная память',
                'settings.sm2_retention_desc': 'Повторения происходят как раз перед тем, как вы забудете, максимизируя запоминание при минимальных усилиях.',
                
                // Actions
                'actions.study_all': 'Изучить все карточки',
                'actions.new_deck': 'Новая колода',
                'actions.new_card': 'Новая карточка',
                'actions.back': 'Назад',
                'actions.study': 'Изучать',
                'actions.cancel': 'Отмена',
                'actions.create': 'Создать',
                'actions.select': 'Выбрать',
                'actions.save': 'Сохранить',
                'actions.delete': 'Удалить',
                
                // Card Types
                'card_type.select_type': 'Выберите тип карточки',
                'card_type.flip': 'Карточки с переворотом',
                'card_type.flip_description': 'Традиционное изучение карточек с переворотом лицевой и обратной стороны',
                'card_type.flip_type': 'Переворот + Печать',
                'card_type.flip_type_description': 'Активное воспроизведение через набор ответов плюс просмотр карточки',
                'card_type.irregular_verbs': 'Неправильные глаголы',
                'card_type.irregular_verbs_description': 'Специальные шаблоны для изучения спряжения глаголов',
                'card_type.coming_soon': 'Скоро',
                'card_type.card_behavior': 'Поведение карточки',
                'card_type.flip_only': 'Только переворот',
                'card_type.flip_and_type': 'Переворот + Печать',
                
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
                'study.dont_remember': 'Не помню',
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
                'modal.edit_card': 'Редактировать карточку',
                'modal.front': 'Лицевая сторона:',
                'modal.back': 'Обратная сторона:',
                'modal.front_placeholder': 'Введите текст лицевой стороны',
                'modal.back_placeholder': 'Введите текст обратной стороны',
                
                // Irregular Verbs
                'irregular_verbs.preview': 'Предварительный просмотр глагола',
                'irregular_verbs.infinitive': 'Инфинитив',
                'irregular_verbs.past_simple': 'Прошедшее время',
                'irregular_verbs.past_participle': 'Причастие прошедшего времени',
                'irregular_verbs.translation': 'Перевод',
                'irregular_verbs.create_cards': 'Создать 3 карточки',
                'irregular_verbs.search_placeholder': 'Введите инфинитив (например, \'go\', \'take\')...',
                
                // Card Statistics Modal
                'card_stats.title': 'Статистика карточки',
                'card_stats.successful_reviews': 'Успешных повторений',
                'card_stats.failed_reviews': 'Неудачных повторений',
                'card_stats.next_due_date': 'Следующий срок повторения',
                'card_stats.not_scheduled': 'Не запланировано',
                'card_stats.close': 'Закрыть'
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
            
            // Check if translation contains HTML (has < and > characters)
            if (translation.includes('<') && translation.includes('>')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
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