import { db } from './firebase-init.js';
// Utility to resize uploaded images
import { resizeImage } from './resizeImage.js';
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc
} from './firestore-web.js';

// Obtener ID desde la URL
const params = new URLSearchParams(window.location.search);
const plantId = params.get('id');

const photoEl = document.getElementById('plant-photo');
const nameEl = document.getElementById('plant-name');
const dateEl = document.getElementById('plant-date');
const btnEdit = document.getElementById('edit-plant');
const btnDeleteInside = document.getElementById('delete-plant-inside');
const btnPrintQR = document.getElementById('print-qr');
const btnCancelEdit = document.getElementById('cancel-edit-plant');
const modalEdit = document.getElementById('edit-plant-modal');
const formEdit = document.getElementById('edit-plant-form');
const inputName = document.getElementById('edit-plant-name');
const inputNotes = document.getElementById('edit-plant-notes');
const inputPhoto = document.getElementById('edit-plant-photo');
const notesEl = document.getElementById('plant-notes');
const addPhotoBtn = document.getElementById('add-photo-record');
const newPhotoInput = document.getElementById('new-photo-input');
const albumEl = document.getElementById('photo-album');

let albumData = [];

function mostrarAlbum() {
  if (!albumEl) return;
  albumEl.innerHTML = '';
  albumData.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.className = 'album-item';
    const img = document.createElement('img');
    img.src = item.photo;
    const span = document.createElement('span');
    span.className = 'album-date';
    span.textContent = item.date.toLocaleDateString();
    wrapper.appendChild(img);
    wrapper.appendChild(span);
    albumEl.appendChild(wrapper);
  });
}

let currentSpeciesId; // speciesId for redirects
let originalName = '';
let originalPhoto = '';
let originalNotes = '';
let qrCodeData = '';

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
  qrCodeData = data.qrCode || '';

  albumData = (data.album || []).map(a => ({
    photo: a.photo,
    date: a.date && a.date.toDate ? a.date.toDate() : a.date
  }));
  if (albumData.length === 0 && data.photo) {
    albumData.push({ photo: data.photo, date: data.createdAt.toDate() });
  }

  albumData.sort((a, b) => b.date - a.date);

  const speciesRef = doc(db, 'species', currentSpeciesId);
  const speciesSnap = await getDoc(speciesRef);
  const speciesName = speciesSnap.exists() ? speciesSnap.data().name : 'Especie no encontrada';

  const speciesEl = document.getElementById('species-name');
  speciesEl.textContent = `Especie: ${speciesName}`;

  nameEl.textContent = data.name;
  dateEl.textContent = `Creada: ${new Date(data.createdAt.toDate()).toLocaleDateString()}`;
  photoEl.src = albumData[0].photo;
  notesEl.textContent = data.notes || '';

  mostrarAlbum();

  inputName.value = data.name;
  inputNotes.value = data.notes || '';
  originalName = data.name;
  originalPhoto = data.photo;
  originalNotes = data.notes || '';
}

btnEdit.addEventListener('click', () => {
  modalEdit.classList.remove('hidden');
  btnDeleteInside.classList.remove('hidden');
});

formEdit.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = inputName.value.trim();
  const newNotes = inputNotes.value.trim();
  const newPhotoFile = inputPhoto.files[0];

  if (!newName) {
    alert('El nombre no puede estar vacío');
    return;
  }

  const updates = { name: newName, notes: newNotes };

  if (newPhotoFile) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        updates.photo = await resizeImage(e.target.result, 800);
        await updateDoc(doc(db, 'plants', plantId), updates);
        nameEl.textContent = newName;
        notesEl.textContent = newNotes;
        photoEl.src = updates.photo;
        inputPhoto.value = '';
        modalEdit.classList.add('hidden');
        alert('Planta actualizada con éxito');
      } catch (error) {
        console.error('Error al guardar la planta:', error);
        alert('Error al guardar la planta. Inténtalo de nuevo.');
      }
    };
    reader.readAsDataURL(newPhotoFile);
  } else {
    try {
      await updateDoc(doc(db, 'plants', plantId), updates);
      nameEl.textContent = newName;
      notesEl.textContent = newNotes;

      inputPhoto.value = '';
      modalEdit.classList.add('hidden');
      alert('Planta actualizada con éxito');
    } catch (error) {
      console.error('Error al guardar la planta:', error);
      alert('Error al guardar la planta. Inténtalo de nuevo.');
    }
  }
});

cargarPlanta();
if (addPhotoBtn && newPhotoInput) {
  addPhotoBtn.addEventListener('click', () => newPhotoInput.click());
  newPhotoInput.addEventListener('change', async () => {
    const file = newPhotoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const resized = await resizeImage(e.target.result, 800);
      const entry = { photo: resized, date: new Date() };
      albumData.unshift(entry);
      await updateDoc(doc(db, 'plants', plantId), {
        photo: resized,
        album: albumData
      });
      photoEl.src = resized;
      mostrarAlbum();
      newPhotoInput.value = '';
    };
    reader.readAsDataURL(file);
  });
}
btnCancelEdit.addEventListener('click', () => {
  inputName.value = originalName;
  inputNotes.value = originalNotes;
  inputPhoto.value = '';
  modalEdit.classList.add('hidden');
});

btnDeleteInside.addEventListener('click', async () => {
  if (confirm('¿Eliminar esta planta?')) {
    await deleteDoc(doc(db, 'plants', plantId));
    window.location.href = `species.html?id=${currentSpeciesId}`;
  }
});

btnPrintQR.addEventListener('click', () => {
  if (!qrCodeData) {
    alert('QR no disponible');
    return;
  }
  const w = window.open('');
  w.document.write(`<img src="${qrCodeData}" style="width:200px;height:200px" onload="window.print()">`);
  w.document.close();
});

document.getElementById('back-to-species').addEventListener('click', () => {
  if (currentSpeciesId) {
    window.location.href = `species.html?id=${currentSpeciesId}`;
  } else {
    window.location.href = 'index.html';
  }
});
