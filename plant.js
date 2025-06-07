import { db } from './firebase-init.js';
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Obtener ID desde la URL
const params = new URLSearchParams(window.location.search);
const plantId = params.get('id');

const photoEl = document.getElementById('plant-photo');
const nameEl = document.getElementById('plant-name');
const dateEl = document.getElementById('plant-date');
const btnEdit = document.getElementById('edit-plant');
const btnDeleteInside = document.getElementById('delete-plant-inside');
const btnCancelEdit = document.getElementById('cancel-edit-plant');
const modalEdit = document.getElementById('edit-plant-modal');
const formEdit = document.getElementById('edit-plant-form');
const inputName = document.getElementById('edit-plant-name');
const inputPhoto = document.getElementById('edit-plant-photo');

let currentSpeciesId; // speciesId for redirects
let originalName = '';
let originalPhoto = '';

// Cargar planta
async function cargarPlanta() {
  if (!plantId) {
    alert('ID de planta no proporcionado');
    return;
  }

  const ref = doc(db, 'plants', plantId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert('Planta no encontrada');
    return;
  }

  const data = snap.data();
  currentSpeciesId = data.speciesId;

  const speciesRef = doc(db, 'species', currentSpeciesId);
  const speciesSnap = await getDoc(speciesRef);
  const speciesName = speciesSnap.exists() ? speciesSnap.data().name : 'Especie no encontrada';

  const speciesEl = document.getElementById('species-name');
  speciesEl.textContent = `Especie: ${speciesName}`;

  nameEl.textContent = data.name;
  dateEl.textContent = `Creada: ${new Date(data.createdAt.toDate()).toLocaleDateString()}`;
  photoEl.src = data.photo;

  inputName.value = data.name;
  originalName = data.name;
  originalPhoto = data.photo;
}

btnEdit.addEventListener('click', () => {
  modalEdit.classList.remove('hidden');
  btnDeleteInside.classList.remove('hidden');
});

formEdit.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = inputName.value.trim();
  const newPhotoFile = inputPhoto.files[0];

  if (!newName) {
    alert('El nombre no puede estar vacío');
    return;
  }

  const updates = { name: newName };

  if (newPhotoFile) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      updates.photo = e.target.result;
      await updateDoc(doc(db, 'plants', plantId), updates);
      nameEl.textContent = newName;
      photoEl.src = e.target.result;
      inputPhoto.value = '';
      modalEdit.classList.add('hidden');
    };
    reader.readAsDataURL(newPhotoFile);
  } else {
    await updateDoc(doc(db, 'plants', plantId), updates);
    nameEl.textContent = newName;
    inputPhoto.value = '';
    modalEdit.classList.add('hidden');
  }
});

cargarPlanta();
btnCancelEdit.addEventListener('click', () => {
  inputName.value = originalName;
  inputPhoto.value = '';
  modalEdit.classList.add('hidden');
});

btnDeleteInside.addEventListener('click', async () => {
  if (confirm('¿Eliminar esta planta?')) {
    await deleteDoc(doc(db, 'plants', plantId));
    window.location.href = `species.html?id=${currentSpeciesId}`;
  }
});

document.getElementById('back-to-species').addEventListener('click', () => {
  if (currentSpeciesId) {
    window.location.href = `species.html?id=${currentSpeciesId}`;
  } else {
    window.location.href = 'index.html';
  }
});
