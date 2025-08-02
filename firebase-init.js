// Importa los módulos necesarios desde el CDN de Firebase (modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Helper to obtain env vars both in Node and browser
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }
  return undefined;
};

// Configuración de Firebase para el proyecto "mis-sucus"
const firebaseConfig = {
  apiKey: "AIzaSyBFpO3mzD94Wa_oCywdzHUaWJONtHugTuE",
  authDomain: "mis-sucus.firebaseapp.com",
  projectId: "mis-sucus",
  storageBucket: "mis-sucus.appspot.com",
  messagingSenderId: "535386004336",
  appId: "1:535386004336:web:4701b88dc0ed7f75164db5"
};

// Lanzar un error descriptivo si faltan variables de entorno
if (Object.values(firebaseConfig).some((v) => !v)) {
  throw new Error(
    'Missing Firebase configuration. Copy env.template.js to env.js and fill in your credentials or set the variables in a .env file.'
  );
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Iniciar sesión anónima automáticamente
signInAnonymously(auth).catch((error) => {
  console.error("Error al iniciar sesión anónima:", error);
});
