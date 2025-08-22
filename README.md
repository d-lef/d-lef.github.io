# Flashcard App with Spaced Repetition

A progressive web application (PWA) for studying flashcards using the scientifically-proven spaced repetition algorithm (SM-2). Features modern UI with dark/light themes, multilingual support (English/Russian), and cloud synchronization with offline capabilities.

## Features

### 📚 Core Functionality
- **Spaced Repetition Learning**: Implements the SM-2 algorithm for optimal review scheduling
- **Multiple Study Modes**:
  - **Flip Mode**: Traditional flashcard study with front/back card flipping
  - **Type Mode**: Active recall by typing answers
  - **Combined Mode**: Requires both typing and reviewing for maximum retention
- **Smart Scheduling**: Cards appear based on difficulty and previous performance
- **Progress Tracking**: Visual progress bars and study session statistics

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with smooth animations
- **Dark/Light Themes**: Toggle between themes with CSS custom properties
- **Multilingual Support**: Full English and Russian localization
- **Mobile-Optimized**: PWA with offline capabilities and mobile-friendly interface
- **Study Calendar**: Visual calendar showing daily study activity and intensity

### 📊 Analytics & Statistics
- **Study Streak Tracking**: Monitor consecutive days of studying
- **Daily Statistics**: Cards reviewed, accuracy rates, and study time
- **Performance Insights**: Visual feedback on learning progress
- **Calendar Heatmap**: GitHub-style activity visualization

### ☁️ Data Management
- **Cloud Synchronization**: Real-time sync with Supabase backend
- **Offline Support**: Full functionality without internet connection
- **Local Storage Backup**: Automatic localStorage fallback
- **Data Import/Export**: Testing tools for sample data generation

## Technical Architecture

### Frontend Stack
- **HTML5 + CSS3**: Modern web standards with CSS custom properties
- **Vanilla JavaScript**: No framework dependencies, ES6+ features
- **PWA Technologies**: Service worker for caching and offline support
- **Responsive Design**: Mobile-first approach with flexible layouts

### Backend & Storage
- **Supabase**: PostgreSQL database with real-time capabilities
- **Local Storage**: Client-side persistence and offline backup
- **IndexedDB**: Future-ready for large dataset storage

### Core Modules

#### `app.js` - Main Application Controller
- **FlashcardApp Class**: Central application state management
- **View Management**: Handles navigation between different app sections
- **Study Session Logic**: Manages card progression and difficulty tracking
- **Event Handling**: User interactions and keyboard shortcuts

#### `spaced-repetition.js` - Learning Algorithm
- **SM-2 Implementation**: Scientific spaced repetition algorithm
- **Card Scheduling**: Calculates next review dates based on performance
- **Difficulty Mapping**: Converts user ratings to algorithm parameters
- **Study Queue Management**: Prioritizes cards for optimal learning

#### `storage.js` - Data Persistence Layer
- **Dual Storage Strategy**: Supabase primary, localStorage backup
- **Sync Management**: Handles online/offline synchronization
- **Data Validation**: Ensures data integrity across storage systems
- **UUID Generation**: Unique identifier management

#### `statistics.js` - Analytics Engine
- **Performance Metrics**: Calculates streaks, accuracy, and progress
- **Calendar Rendering**: Visual activity tracking
- **Data Aggregation**: Weekly and monthly statistics
- **Chart Generation**: Visual representation of study patterns

#### `i18n.js` - Internationalization
- **Translation Management**: English and Russian language support
- **Dynamic Content**: Real-time language switching
- **Localized Formatting**: Date, number, and text formatting
- **Accessibility**: Screen reader compatible translations

#### `settings.js` - Configuration Management
- **Theme Control**: Light/dark mode switching
- **Preference Persistence**: Saves user preferences locally
- **UI State Management**: Maintains settings across sessions

#### `supabase-client.js` - Cloud Integration
- **Database Operations**: CRUD operations for decks and cards
- **Real-time Sync**: Automatic cloud synchronization
- **Offline Queue**: Stores operations when offline for later sync
- **Error Handling**: Graceful degradation when cloud services unavailable

## Project Structure

```
flashcard_app_for_dasha/
├── index.html                 # Main application entry point
├── manifest.json             # PWA configuration
├── sw.js                     # Service worker for offline support
├── css/
│   └── styles.css           # Unified stylesheet with CSS custom properties
└── js/
    ├── app.js               # Main application controller
    ├── spaced-repetition.js # SM-2 algorithm implementation
    ├── storage.js           # Data persistence layer
    ├── statistics.js        # Analytics and statistics
    ├── i18n.js             # Internationalization
    ├── settings.js         # User preferences management
    └── supabase-client.js  # Cloud database integration
```

## Spaced Repetition Algorithm (SM-2)

The app implements the SuperMemo SM-2 algorithm for optimal learning:

- **Adaptive Intervals**: Review intervals increase exponentially (1 day → 6 days → weeks → months)
- **Performance-Based Adjustments**: Difficult cards appear more frequently
- **Four Difficulty Grades**:
  - **Again**: Reset learning progress (1 day interval)
  - **Hard**: Reduce ease factor, shorter interval
  - **Good**: Normal progression
  - **Easy**: Increase ease factor, longer interval
- **Long-term Retention**: Reviews scheduled just before forgetting occurs

## Data Models

### Deck Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Deck name
  cards: Card[],           // Array of cards
  createdAt: string        // ISO timestamp
}
```

### Card Structure
```javascript
{
  id: string,              // Unique identifier
  front: string,           // Question/prompt
  back: string,            // Answer/explanation
  ease: number,            // SM-2 ease factor (default 2.5)
  interval: number,        // Days until next review
  reps: number,            // Number of successful reviews
  lapses: number,          // Number of failed reviews
  dueDate: string,         // Next review date (YYYY-MM-DD)
  lastReviewed: string,    // Last review date
  createdAt: string        // Creation timestamp
}
```

## Getting Started

1. **Open the Application**: Navigate to `index.html` in a web browser
2. **Create Your First Deck**: Click "New Deck" and add a name
3. **Add Cards**: Click "New Card" to add front/back content
4. **Start Studying**: Use "Study All Cards" or study individual decks
5. **Track Progress**: Monitor your streak and statistics in the overview

## Development

### Local Development
- Serve files through a local web server (required for PWA features)
- No build process required - vanilla JavaScript implementation
- Modify CSS custom properties in `:root` for theme changes

### Database Setup
- Configure Supabase project with `decks`, `cards`, and `review_stats` tables
- Update credentials in `supabase-client.js`
- Tables auto-created through application usage

### Testing
- Use "Add Test Data" button in settings for sample content
- "Erase All Data" for clean testing environment
- Monitor browser console for debugging information

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **PWA Features**: Service worker support required for offline functionality
- **Mobile Support**: iOS Safari, Chrome Mobile, Samsung Internet

## Performance

- **Lightweight**: ~50KB total bundle size
- **Fast Loading**: Critical CSS inline, progressive enhancement
- **Offline-First**: Full functionality without network connection
- **Memory Efficient**: Garbage collection optimized, no memory leaks

## Contributing

The codebase follows modern JavaScript practices:
- ES6+ features with graceful degradation
- Modular architecture with clear separation of concerns
- Comprehensive error handling and fallbacks
- Extensive inline documentation

## License

This project is a personal learning application for flashcard-based study with spaced repetition.
