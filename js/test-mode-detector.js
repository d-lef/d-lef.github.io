// Fail-safe test mode detection that works before settings initialization
// This ensures test mode protection is active from the moment scripts load

class TestModeDetector {
    constructor() {
        try {
            this._isTestingMode = null; // Cache the result
            this._listeners = []; // Cross-tab listeners

            // Cross-tab event loop prevention
            this._lastBroadcastTime = 0;
            this._broadcastDebounce = 1000; // 1 second debounce
            this._lastProcessedBroadcast = null;
            this._processingCrossTabEvent = false;

            this.setupCrossTabSync();
        } catch (error) {
            console.error('🚨 CRITICAL: TestModeDetector constructor failed:', error);
            console.error('🚨 Falling back to safe defaults to prevent app crash');

            // Set safe defaults if constructor fails
            this._isTestingMode = false; // Always default to false for safety
            this._listeners = [];
            this._lastBroadcastTime = 0;
            this._broadcastDebounce = 1000;
            this._lastProcessedBroadcast = null;
            this._processingCrossTabEvent = false;

            // Create dummy implementations to prevent method call errors
            this._constructorFailed = true;
        }
    }

    // CRITICAL: This must work even before window.settings is available
    isTestingMode() {
        // Use cached result if available
        if (this._isTestingMode !== null) {
            return this._isTestingMode;
        }

        // Check multiple sources in order of reliability
        let testingMode = false;

        try {
            // 1. Check if settings object is available (after DOMContentLoaded)
            if (window.settings && typeof window.settings.isTestingMode === 'function') {
                testingMode = window.settings.isTestingMode();
            }
            // 2. Fallback: Read directly from localStorage (works before settings init)
            else {
                const settingsData = localStorage.getItem('flashcard_settings');
                if (settingsData) {
                    const settings = JSON.parse(settingsData);
                    testingMode = settings.testingMode === true;
                }
            }
        } catch (error) {
            console.error('Test mode detection error (defaulting to false):', error);
            testingMode = false;
        }

        // Cache the result
        this._isTestingMode = testingMode;

        if (testingMode) {
            console.log('🧪 TEST MODE ACTIVE - All database operations will be blocked');
        }

        return testingMode;
    }

    // Update cached value when test mode changes
    setTestingMode(enabled) {
        this._isTestingMode = enabled;

        // Notify all listeners
        this._listeners.forEach(listener => {
            try {
                listener(enabled);
            } catch (error) {
                console.error('Test mode listener error:', error);
            }
        });

        // Broadcast to other tabs
        this.broadcastTestModeChange(enabled);

        console.log(enabled ? '🧪 TEST MODE ENABLED' : '🧪 TEST MODE DISABLED');
    }

    // Add listener for test mode changes
    addListener(callback) {
        this._listeners.push(callback);
    }

    // Remove listener
    removeListener(callback) {
        const index = this._listeners.indexOf(callback);
        if (index > -1) {
            this._listeners.splice(index, 1);
        }
    }

    // Cross-tab synchronization
    setupCrossTabSync() {
        try {
            window.addEventListener('storage', (e) => {
                try {
                    if (e.key === 'flashcard_settings' || e.key === 'test_mode_broadcast') {
                        // LOOP PREVENTION: Check if already processing a cross-tab event
                        if (this._processingCrossTabEvent) {
                            console.log('🧪 Cross-tab: Ignoring event - already processing another cross-tab change');
                            return;
                        }

                        // LOOP PREVENTION: Check for duplicate broadcast processing
                        if (e.key === 'test_mode_broadcast' && e.newValue) {
                            try {
                                const broadcastData = JSON.parse(e.newValue);
                                if (this._lastProcessedBroadcast &&
                                    this._lastProcessedBroadcast.timestamp === broadcastData.timestamp) {
                                    console.log('🧪 Cross-tab: Ignoring duplicate broadcast');
                                    return;
                                }
                                this._lastProcessedBroadcast = broadcastData;
                            } catch (parseError) {
                                console.error('Cross-tab broadcast parse error:', parseError);
                                return;
                            }
                        }

                        this._processingCrossTabEvent = true;

                        try {
                            // Another tab changed settings, invalidate cache
                            const oldMode = this._isTestingMode;
                            this._isTestingMode = null;
                            const newMode = this.isTestingMode();

                            // Only notify if mode actually changed
                            if (oldMode !== newMode) {
                                console.log(`🧪 Cross-tab test mode change detected: ${oldMode} → ${newMode}`);

                                // If sync queue exists, manage it based on new mode
                                if (window.supabaseService) {
                                    if (newMode) {
                                        console.log('🧪 Test mode enabled in another tab - blocking sync operations');
                                    } else {
                                        console.log('🧪 Test mode disabled in another tab - checking sync queue');
                                        setTimeout(() => {
                                            if (window.supabaseService && !this.isTestingMode()) {
                                                window.supabaseService.processSyncQueue();
                                            }
                                        }, 1000);
                                    }
                                }

                                // Notify listeners about the change (but don't let them trigger broadcasts)
                                this._listeners.forEach(listener => {
                                    try {
                                        listener(newMode);
                                    } catch (error) {
                                        console.error('Cross-tab test mode listener error:', error);
                                    }
                                });
                            }
                        } finally {
                            // Always release the lock after a small delay
                            this._crossTabProcessingTimeout = setTimeout(() => {
                                this._processingCrossTabEvent = false;
                                this._crossTabProcessingTimeout = null;
                            }, 100);
                        }
                    }
                } catch (error) {
                    console.error('Cross-tab storage event handler error:', error);
                    this._processingCrossTabEvent = false;
                }
            });
        } catch (error) {
            console.error('🚨 CRITICAL: Failed to setup cross-tab sync:', error);
            console.error('🚨 Cross-tab synchronization disabled to prevent app crash');
        }
    }

    // Broadcast test mode change to other tabs
    broadcastTestModeChange(enabled) {
        try {
            const now = Date.now();

            // LOOP PREVENTION: Debounce broadcasts to prevent rapid-fire cross-tab events
            if (now - this._lastBroadcastTime < this._broadcastDebounce) {
                console.log('🧪 Cross-tab: Broadcast ignored - too soon after previous broadcast');
                return;
            }

            this._lastBroadcastTime = now;

            // This will trigger storage event in other tabs
            const broadcastData = {
                testingMode: enabled,
                timestamp: now
            };

            localStorage.setItem('test_mode_broadcast', JSON.stringify(broadcastData));
            console.log('🧪 Cross-tab: Broadcast sent to other tabs');

        } catch (error) {
            console.error('🚨 CRITICAL: Failed to broadcast test mode change:', error);
            console.error('🚨 Cross-tab synchronization may not work properly');
        }
    }

    // Force refresh of test mode status (for edge cases)
    refresh() {
        this._isTestingMode = null;
        return this.isTestingMode();
    }

    // SAFETY: Block all database operations when test mode is active
    ensureSafeOperation(operationName) {
        if (this.isTestingMode()) {
            console.log(`🧪 BLOCKED: ${operationName} - Operation blocked in test mode`);
            return false; // Block the operation
        }
        return true; // Allow the operation
    }

    // MEMORY LEAK PREVENTION: Cleanup method to remove all listeners and clear timeouts
    cleanup() {
        try {
            console.log('🧪 Cleaning up TestModeDetector...');

            // Clear all timeouts if they exist
            if (this._crossTabProcessingTimeout) {
                clearTimeout(this._crossTabProcessingTimeout);
                this._crossTabProcessingTimeout = null;
            }

            // Clear listeners
            this._listeners = [];

            // Remove storage event listener (we can't remove specific listeners, but this helps with cleanup)
            // Note: We can't easily remove the specific storage event listener without storing a reference,
            // but clearing the internal state helps prevent processing

            // Reset state
            this._isTestingMode = null;
            this._lastBroadcastTime = 0;
            this._lastProcessedBroadcast = null;
            this._processingCrossTabEvent = false;

            console.log('🧪 TestModeDetector cleanup completed');
        } catch (error) {
            console.error('🚨 CRITICAL: TestModeDetector cleanup failed:', error);
        }
    }
}

// Create global instance immediately when script loads with fail-safe protection
try {
    window.testModeDetector = new TestModeDetector();
} catch (error) {
    console.error('🚨 CATASTROPHIC: Failed to create TestModeDetector instance:', error);
    console.error('🚨 Creating emergency fallback to prevent complete app failure');

    // Emergency fallback object that provides the same interface but always returns safe values
    window.testModeDetector = {
        isTestingMode: () => false, // Always return false for safety
        setTestingMode: (enabled) => {
            console.error('🚨 EMERGENCY MODE: Test mode changes disabled due to initialization failure');
        },
        addListener: (callback) => {
            console.error('🚨 EMERGENCY MODE: Test mode listeners disabled due to initialization failure');
        },
        removeListener: (callback) => {
            console.error('🚨 EMERGENCY MODE: Test mode listeners disabled due to initialization failure');
        },
        refresh: () => false,
        ensureSafeOperation: (operationName) => {
            console.error('🚨 EMERGENCY MODE: Cannot determine test mode status - allowing operation for app functionality');
            return true; // If we can't detect test mode, assume normal mode to prevent app breakage
        },
        broadcastTestModeChange: (enabled) => {
            console.error('🚨 EMERGENCY MODE: Cross-tab sync disabled due to initialization failure');
        },
        _isTestingMode: false,
        _listeners: [],
        _constructorFailed: true,
        _emergencyFallback: true
    };
}

// Convenience function for backward compatibility with additional safety check
window.isTestingModeSafe = () => {
    try {
        return window.testModeDetector ? window.testModeDetector.isTestingMode() : false;
    } catch (error) {
        console.error('🚨 EMERGENCY: Even fallback test mode detection failed:', error);
        return false; // Ultra-safe fallback
    }
};

// MEMORY LEAK PREVENTION: Global cleanup function
window.cleanupFlashcardApp = () => {
    try {
        console.log('🧹 Starting global flashcard app cleanup...');

        // Cleanup test mode detector
        if (window.testModeDetector && typeof window.testModeDetector.cleanup === 'function') {
            window.testModeDetector.cleanup();
        }

        // Cleanup settings
        if (window.settings && typeof window.settings.cleanup === 'function') {
            window.settings.cleanup();
        }

        console.log('🧹 Global flashcard app cleanup completed');
    } catch (error) {
        console.error('🚨 CRITICAL: Global cleanup failed:', error);
    }
};

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
    window.cleanupFlashcardApp();
});