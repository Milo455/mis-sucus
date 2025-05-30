// firebase-init.js

// Importa las funciones necesarias de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Configuración de tu aplicación Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBFpO3mzD94Wa_oCywdzHUaWJONtHugTuE",
  authDomain: "mis-sucus.firebaseapp.com",
  projectId: "mis-sucus",
  storageBucket: "mis-sucus.firebasestorage.app",
  messagingSenderId: "535386004336",
  appId: "1:535386004336:web:4701b88dc0ed7f75164db5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Autenticación anónima para asegurar acceso
signInAnonymously(auth)
  .then(() => {
    console.log("Autenticación anónima exitosa");
  })
  .catch((error) => {
    console.error("Error en autenticación anónima:", error);
  });

export { db };
