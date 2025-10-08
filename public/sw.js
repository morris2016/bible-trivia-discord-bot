// Faith Defenders Service Worker
// Handles navigation preload and caching for better performance

const CACHE_NAME = 'faith-defenders-v4';
const STATIC_CACHE = 'faith-defenders-static-v4';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/style.css',
  '/static/auth.js',
  '/static/admin.js',
  '/static/custom-editor.js',
  '/static/comments.js',
  '/static/dashboard.js',
  '/static/search.js',
  '/static/verification.js',
  '/static/password-reset.js',
  '/static/auth-styles.css',
  '/static/admin.css',
  '/static/custom-editor.css'
];

// Minimal service worker that doesn't interfere with anything
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Don't intercept any fetch requests - let them pass through normally
// This prevents any interference with the website

// Handle navigation preload properly
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/static/favicon.ico',
      badge: '/static/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});