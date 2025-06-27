# Mis Sucus

This project is a simple PWA to manage succulent plants. It relies on Firebase for data storage and uses Jest for testing.

## Requirements

- **Node.js** v18 or later is required to run the tests and manage dependencies.
- A Firebase project. Firebase credentials are now loaded from environment variables.

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

## QR Scanning

The built-in QR scanner requires the device's rear-facing camera to start scanning. If a rear camera is not available, the app will display an error instead of using another camera.

## Firebase Setup

Create a `.env` file in the project root with the credentials for your Firebase project. Ensure Firestore is enabled in the Firebase console. If you open the app directly in the browser, also copy `env.template.js` to `env.js`, fill in your credentials and include it before `firebase-init.js` in your HTML.

Required variables:

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```


Anonymous sign-in must be enabled from the Firebase console (Authentication → Sign-in method). `ensureAuth()` will automatically handle signing in when the app loads.

### Required Indexes

Create the following composite indexes in Firestore:

- **images** collection: `plantId` (ascending) + `createdAt` (descending)
- **events** collection: `plantId` (ascending) + `type` (ascending) + `date` (descending)

You can define them from the Firebase console or via CLI:

```bash
firebase firestore:indexes > firestore.indexes.json
# edit the generated file to include the indexes above
firebase deploy --only firestore:indexes
```

Anonymous authentication must also be enabled in Firebase Auth so users can upload images.


