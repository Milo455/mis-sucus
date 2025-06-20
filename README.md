# Mis Sucus

This project is a simple PWA to manage succulent plants. It relies on Firebase for data storage and uses Jest for testing.

## Requirements

- **Node.js** v18 or later is required to run the tests and manage dependencies.
- A Firebase project (update `firebase-init.js` with your own configuration).

## Installation

Install dependencies from the project root:

```bash
npm install
```

## Running Tests

Execute the test suite with:

```bash
npm test
```

## Launching the App

Since the app is entirely client side, you can serve the files using any static server. One simple option is [`http-server`](https://www.npmjs.com/package/http-server):

```bash
npx http-server -c-1
```

Then open `http://localhost:8080/index.html` in your browser. Alternatively, you can open `index.html` directly, but using a local server is recommended for module loading.

## Firebase Setup

Replace the placeholder values in `firebase-init.js` with the keys for your Firebase project. Ensure Firestore is enabled in the Firebase console.

Anonymous sign-in must be enabled from the Firebase console (Authentication → Sign-in method). `ensureAuth()` will automatically handle signing in when the app loads.

