const CACHE_NAME = 'flashcard-app-v26-notifications';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/spaced-repetition.js',
  '/js/supabase-client.js',
  '/js/statistics.js',
  '/js/i18n.js',
  '/js/settings.js',
  '/js/notifications.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('Service worker installing with cache version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker activating with cache version:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification.tag, event.action);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let urlToOpen = '/';

  // Handle different actions
  if (event.action === 'study') {
    // Open app to study/overview page
    urlToOpen = '/?view=overview&from=notification';
  } else if (event.action === 'later') {
    // Just close notification - no action needed
    return;
  } else {
    // Default click - open app to appropriate view based on notification type
    switch (notificationData.type) {
      case 'dailyReminder':
      case 'streakRisk':
      case 'lastChance':
        urlToOpen = '/?view=overview&from=notification';
        break;
      default:
        urlToOpen = '/';
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (let client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            // Navigate to the appropriate page
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action: event.action,
              notificationType: notificationData.type,
              url: urlToOpen
            });
            return;
          }
        }
        
        // No existing window found, open new one
        return clients.openWindow(urlToOpen);
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification.tag);
  
  // Track notification dismissal for analytics if needed
  const notificationData = event.notification.data || {};
  if (notificationData.type) {
    console.log(`User dismissed ${notificationData.type} notification`);
  }
});

// Handle messages from main app
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SHOW_NOTIFICATION':
        // Show notification requested from main app
        const { title, options } = event.data.payload;
        self.registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options
        });
        break;
        
      case 'SKIP_WAITING':
        // Force service worker update
        self.skipWaiting();
        break;
        
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});