// firebase-init.js
import firebase from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyBFpO3mzD94Wa_oCywdzHUaWJONtHugTuE",
  authDomain: "mis-sucus.firebaseapp.com",
  projectId: "mis-sucus",
  storageBucket: "mis-sucus.appspot.com",
  messagingSenderId: "535386004336",
  appId: "1:535386004336:web:4701b88dc0ed7f75164db5"
};

firebase.initializeApp(firebaseConfig);
const app = firebase.app();
export const db = getFirestore(app);
export const storage = getStorage(app);
export { firebase };
