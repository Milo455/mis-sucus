import { db, storage } from './firebase-init.js';
// Utility to resize uploaded images
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

function safeRedirect(url) {
  try {
    window.location.href = url;
  } catch {
    // Ignore navigation errors in test environments
  }
}

function dataURLToBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

// Obtener ID desde la URL
const params = new URLSearchParams(window.location.search);
const plantId = params.get('id');

const photoEl = document.getElementById('plant-photo');
const nameEl = document.getElementById('plant-name');
const lastWateringEl = document.getElementById('last-watering-count');
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
const btnAddEvent = document.getElementById('add-event-btn');
const modalAddEvent = document.getElementById('add-event-modal');
const eventDateInput = document.getElementById('plant-event-date');
const eventTypeSelect = document.getElementById('plant-event-type');
const saveEventBtn = document.getElementById('save-plant-event');
const cancelAddEventBtn = document.getElementById('cancel-add-event');
const openAlbumBtn = document.getElementById('open-album');
const albumModal = document.getElementById('album-modal');
const closeAlbumBtn = document.getElementById('close-album');
const viewerModal = document.getElementById('viewer-modal');
const viewerImg = document.getElementById('viewer-img');
const closeViewerBtn = document.getElementById('close-viewer');

const requiredEls = [
  photoEl,
  nameEl,
  lastWateringEl,
  btnEdit,
  btnDeleteInside,
  btnPrintQR,
  btnCancelEdit,
  modalEdit,
  formEdit,
  inputName,
  inputNotes,
  inputPhoto,
  notesEl,
  addPhotoBtn,
  newPhotoInput,
  albumEl,
  openAlbumBtn,
  albumModal,
  closeAlbumBtn,
  viewerModal,
  viewerImg,
  closeViewerBtn
];

const PLACEHOLDER_IMG = 'icons/icon-192.png';
let albumData = [];


function mostrarAlbum() {
  if (!albumEl) return;
  albumEl.innerHTML = '';
  if (albumData.length === 0) {
    albumEl.textContent = 'No hay imágenes';
    return;
  }
  albumData.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.className = 'album-item';
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = 'Foto tomada el ' + item.date.toLocaleDateString();
    const span = document.createElement('span');
    span.className = 'album-date';
    span.textContent = item.date.toLocaleDateString();
    wrapper.appendChild(img);
    wrapper.appendChild(span);
    albumEl.appendChild(wrapper);
  });
}

let currentSpeciesId; // speciesId for redirects
let currentSpeciesName = '';
let originalName = '';
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

  const albumMissing = data.album === undefined;
  albumData = (data.album || []).map(a => ({
    url: a.url,
    date: a.date && a.date.toDate ? a.date.toDate() : a.date
  }));
  if (albumData.length === 0 && data.photo) {
    albumData.push({ url: data.photo, date: data.createdAt.toDate() });
    if (albumMissing) {
      await updateDoc(doc(db, 'plants', plantId), { album: albumData });
    }
  }

  albumData.sort((a, b) => b.date - a.date);

  const speciesRef = doc(db, 'species', currentSpeciesId);
  const speciesSnap = await getDoc(speciesRef);
  currentSpeciesName = speciesSnap.exists() ? speciesSnap.data().name : 'Especie no encontrada';

  const speciesEl = document.getElementById('species-name');
  speciesEl.textContent = `Especie: ${currentSpeciesName}`;

  nameEl.textContent = data.name;
  if (albumData.length === 0) {
    photoEl.src = PLACEHOLDER_IMG;
  } else {
    photoEl.src = albumData[0].url;
  }
  notesEl.textContent = data.notes || '';

  mostrarAlbum();

  // Obtener último riego
  try {
    const q = query(
      collection(db, 'events'),
      where('plantId', '==', plantId),
      where('type', '==', 'Riego'),
      orderBy('date', 'desc'),
      limit(1)
    );
    const snapEv = await getDocs(q);
    if (snapEv.empty) {
      lastWateringEl.textContent = 'Sin riegos registrados';
    } else {
      const lastDateStr = snapEv.docs[0].data().date;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDate = new Date(`${lastDateStr}T00:00:00`);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      lastWateringEl.textContent = `Último riego: hace ${diffDays} días`;
    }
  } catch (err) {
    console.error('Error obteniendo último riego:', err);
  }

  inputName.value = data.name;
  inputNotes.value = data.notes || '';
  originalName = data.name;  originalNotes = data.notes || '';
}

function initialize() {
  cargarPlanta();
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
          const dataUrl = e.target.result;
          const blob = dataURLToBlob(dataUrl);
          const storageRef = ref(storage, `plants/${plantId}/album/${Date.now()}.jpg`);
          await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(storageRef);
          updates.photo = url;
          albumData.unshift({ url, date: new Date() });
          await updateDoc(doc(db, 'plants', plantId), {
            photo: url,
            album: albumData,

          });
          nameEl.textContent = newName;
          notesEl.textContent = newNotes;
          photoEl.src = url;
          mostrarAlbum();
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

  if (addPhotoBtn && newPhotoInput) {
    addPhotoBtn.addEventListener('click', () => newPhotoInput.click());
    newPhotoInput.addEventListener('change', async () => {
      const file = newPhotoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const resized = e.target.result;
        const blob = dataURLToBlob(resized);
        const storageRef = ref(storage, `plants/${plantId}/album/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        const entry = { url, date: new Date() };
        albumData.unshift(entry);
        await updateDoc(doc(db, 'plants', plantId), {
          photo: url,
          album: albumData
        });
        photoEl.src = url;
        mostrarAlbum();
        newPhotoInput.value = '';
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnAddEvent && modalAddEvent && eventDateInput && eventTypeSelect && saveEventBtn && cancelAddEventBtn) {
    eventDateInput.value = new Date().toISOString().split('T')[0];
    btnAddEvent.addEventListener('click', () => {
      modalAddEvent.classList.remove('hidden');
    });
    cancelAddEventBtn.addEventListener('click', () => {
      modalAddEvent.classList.add('hidden');
    });
    saveEventBtn.addEventListener('click', async () => {
      const date = eventDateInput.value;
      const type = eventTypeSelect.value;
      try {
        await addDoc(collection(db, 'events'), { date, type, plantId, createdAt: new Date() });
        modalAddEvent.classList.add('hidden');
        if (type === 'Riego') lastWateringEl.textContent = 'Último riego: hace 0 días';
        alert('Evento guardado');
      } catch (err) {
        console.error('Error al guardar el evento:', err);
        alert('Error al guardar el evento');
      }
    });
  }

  if (openAlbumBtn && albumModal) {
    openAlbumBtn.addEventListener('click', () => {
      albumModal.classList.remove('hidden');
    });
  }

  if (closeAlbumBtn && albumModal) {
    closeAlbumBtn.addEventListener('click', () => {
      albumModal.classList.add('hidden');
    });
  }

  if (albumEl && viewerModal && viewerImg) {
    albumEl.addEventListener('click', (e) => {
      const target = e.target;
      if (target.tagName === 'IMG') {
        viewerImg.src = target.src;
        viewerModal.classList.remove('hidden');
      }
    });
  }

  if (closeViewerBtn && viewerModal) {
    closeViewerBtn.addEventListener('click', () => {
      viewerModal.classList.add('hidden');
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
      try {
        await deleteDoc(doc(db, 'plants', plantId));
        if (currentSpeciesId) {
          safeRedirect(`species.html?id=${currentSpeciesId}`);
        } else {
          safeRedirect('index.html');
        }
      } catch (err) {
        console.error('Error al eliminar la planta:', err);
        alert('Error al eliminar la planta');
      }
    }
  });

  btnPrintQR.addEventListener('click', () => {
    if (!qrCodeData) {
      alert('QR no disponible');
      return;
    }
    const canvas = document.createElement('canvas');
    const qrSize = 200;
    const textHeight = 60;
    canvas.width = qrSize;
    canvas.height = qrSize + textHeight;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentSpeciesName, qrSize / 2, 20);
      ctx.drawImage(img, 0, 30, qrSize, qrSize);
      ctx.fillText(nameEl.textContent, qrSize / 2, qrSize + 50);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${nameEl.textContent}-qr.png`;
      link.click();
    };
    img.src = qrCodeData;
  });
}

if (!requiredEls.some(el => el === null)) {
  initialize();
} else {
  console.error('Missing required DOM elements in plant.js');
}

