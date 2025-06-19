#!/usr/bin/env node
// Optional notification script using node-notifier
// Install: npm install node-notifier

const notifier = require('node-notifier');
const path = require('path');

// Get command line arguments
const [,, title, message] = process.argv;

if (!title || !message) {
    console.error('Usage: node notify.js "Title" "Message"');
    process.exit(1);
}

// Send notification
notifier.notify({
    title: title,
    message: message,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'), // Optional icon
    sound: true, // Only works on macOS
    wait: false,
    timeout: 10
}, (err, response) => {
    if (err) {
        console.error('Notification error:', err);
    }
});

// Also log to console
console.log(`[NOTIFICATION] ${title}: ${message}`);