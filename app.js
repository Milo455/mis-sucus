// app.js

import { db } from './firebase-init.js';
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === CONTROL DEL MODAL AGREGAR ESPECIE ===
document.addEventListener('DOMContentLoaded', () => {
  const btnAddSpecies   = document.getElementById('btnAddSpecies');
  const modalSpecies    = document.getElementById('species-modal');
  const btnCloseSpecies = document.getElementById('close-species-modal');

  if (!btnAddSpecies || !modalSpecies || !btnCloseSpecies) {
    console.error('No se encontraron uno o varios elementos del modal Agregar Especie');
    return;
  }

  btnAddSpecies.addEventListener('click', () => {
    console.log('Clic en Agregar Especie');
    modalSpecies.classList.remove('hidden');
  });

  btnCloseSpecies.addEventListener('click', () => {
    console.log('Clic en cerrar modal');
    modalSpecies.classList.add('hidden');
  });
});

// Elementos del DOM
const addSpeciesBtn = document.getElementById("add-species-btn");
const calendarBtn = document.getElementById("calendar-btn");
const scanQRBtn = document.getElementById("scan-qr-btn");
const speciesList = document.getElementById("species-list");
const modal = document.getElementById("species-modal");
const closeModalBtn = document.getElementById("close-modal");
const saveSpeciesBtn = document.getElementById("save-species");

// Abrir modal
addSpeciesBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Cerrar modal
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Guardar especie
saveSpeciesBtn.addEventListener("click", async () => {
  const nameInput = document.getElementById("species-name").value.trim();
  const careInput = document.getElementById("species-care").value.trim();
  const fileInput = document.getElementById("species-photo");

  if (!nameInput || !careInput || fileInput.files.length === 0) {
    alert("Completa todos los campos y selecciona una imagen.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const imageBase64 = event.target.result;

    await addDoc(collection(db, "species"), {
      name: nameInput,
      care: careInput,
      photo: imageBase64,
      timestamp: new Date()
    });

    modal.style.display = "none";
    document.getElementById("species-name").value = "";
    document.getElementById("species-care").value = "";
    fileInput.value = null;
  };

  reader.readAsDataURL(fileInput.files[0]);
});

// Mostrar especies
async function loadSpecies() {
  speciesList.innerHTML = "";
  const q = query(collection(db, "species"), orderBy("name"));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = data.name;
    li.addEventListener("click", () => showSpeciesDetails(doc.id));
    speciesList.appendChild(li);
  });
}

// Mostrar detalles de especie (simplificado)
function showSpeciesDetails(id) {
  window.location.href = `species.html?id=${id}`;
}

// Inicializar
window.addEventListener("DOMContentLoaded", loadSpecies);
