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
const btnDelete = document.getElementById('delete-plant');
const btnEdit = document.getElementById('edit-plant');
const modalEdit = document.getElementById('edit-plant-modal');
const formEdit = document.getElementById('edit-plant-form');
const inputName = document.getElementById('edit-plant-name');
const inputPhoto = document.getElementById('edit-plant-photo');

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
  const speciesId = data.speciesId;
  nameEl.textContent = data.name;
  dateEl.textContent = `Creada: ${new Date(data.createdAt.toDate()).toLocaleDateString()}`;
  photoEl.src = data.photo;

  inputName.value = data.name;
}

btnDelete.addEventListener('click', async () => {
  if (confirm('¿Eliminar esta planta?')) {
    await deleteDoc(doc(db, 'plants', plantId));
    window.location.href = 'index.html';
  }
});

btnEdit.addEventListener('click', () => {
  modalEdit.classList.remove('hidden');
  btnDelete.classList.remove('hidden');
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
      modalEdit.classList.add('hidden');
      btnDelete.classList.add('hidden');
      cargarPlanta();
    };
    reader.readAsDataURL(newPhotoFile);
  } else {
    await updateDoc(doc(db, 'plants', plantId), updates);
    modalEdit.classList.add('hidden');
    btnDelete.classList.add('hidden');
    cargarPlanta();
  }
});

cargarPlanta();
document.getElementById('back-to-species').addEventListener('click', async () => {
  const ref = doc(db, 'plants', plantId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const speciesId = data.speciesId;
    window.location.href = `species.html?id=${speciesId}`;
  } else {
    window.location.href = 'index.html';
  }
});
