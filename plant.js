import { db } from './firebase-init.js';
// Utility to resize uploaded images
import { resizeImage } from './resizeImage.js';
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
} from './firestore-web.js';

async function ensureAuth() {
  try {
    const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const auth = getAuth();
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (_) {
    // ignore auth errors
  }
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
const dateEl = document.getElementById('plant-created-date');
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
const viewerDate = document.getElementById('viewer-date');
const closeViewerBtn = document.getElementById('close-viewer');
const prevPhotoBtn = document.getElementById('prev-photo');
const nextPhotoBtn = document.getElementById('next-photo');
const deletePhotoBtn = document.getElementById('delete-photo');

let albumData = [];
let currentAlbumIndex = 0;

function safeRedirect(url) {
  try {
    window.location.href = url;
  } catch (_) {
    // Ignore navigation errors in test environments
  }
}

function mostrarAlbum() {
  if (!albumEl) return;
  albumEl.innerHTML = '';
  albumData.forEach((item, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'album-item';
    const img = document.createElement('img');
    img.src = item.photo;
    img.dataset.index = idx;
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

  try {
    const imgQ = query(
      collection(db, 'images'),
      where('plantId', '==', plantId),
      orderBy('createdAt', 'desc')
    );
    const imgSnap = await getDocs(imgQ);
    albumData = imgSnap.docs.map(d => ({
      id: d.id,
      photo: d.data().base64,
      date: d.data().createdAt.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt)
    }));
    albumData.sort((a, b) => b.date - a.date);
  } catch (err) {
    console.error('Error cargando imágenes', err);
    albumData = [];
  }
  if (!albumData.length && Array.isArray(data.album)) {
    albumData = data.album.map(item => ({
      photo: item.photo,
      date: item.date?.toDate ? item.date.toDate() : new Date(item.date)
    }));
    albumData.sort((a, b) => b.date - a.date);
  }

  const speciesRef = doc(db, 'species', currentSpeciesId);
  const speciesSnap = await getDoc(speciesRef);
  currentSpeciesName = speciesSnap.exists() ? speciesSnap.data().name : 'Especie no encontrada';

  const speciesEl = document.getElementById('species-name');
  speciesEl.textContent = `Especie: ${currentSpeciesName}`;

  nameEl.textContent = data.name;
  photoEl.src = albumData.length ? albumData[0].photo : '';
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
  originalName = data.name;
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
        const resized = await resizeImage(e.target.result, 800);
        const size = atob(resized.split(',')[1]).length;
        if (size > 1024 * 1024) {
          alert('Imagen demasiado grande incluso después de comprimir.');
          return;
        }
        await updateDoc(doc(db, 'plants', plantId), updates);
        await ensureAuth();
        const entry = { photo: resized, date: new Date() };
        const refImg = await addDoc(collection(db, 'images'), {
          plantId,
          base64: resized,
          createdAt: entry.date
        });
        entry.id = refImg && refImg.id;
        nameEl.textContent = newName;
        notesEl.textContent = newNotes;
        photoEl.src = resized;
        albumData.unshift(entry);
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

cargarPlanta();
if (addPhotoBtn && newPhotoInput) {
  addPhotoBtn.addEventListener('click', () => newPhotoInput.click());
  newPhotoInput.addEventListener('change', async () => {
    const file = newPhotoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const resized = await resizeImage(e.target.result, 800);
      const size = atob(resized.split(',')[1]).length;
      if (size > 1024 * 1024) {
        alert('Imagen demasiado grande incluso después de comprimir.');
        return;
      }
      const entry = { photo: resized, date: new Date() };
      await ensureAuth();
      const refImg = await addDoc(collection(db, 'images'), {
        plantId,
        base64: resized,
        createdAt: entry.date
      });
      entry.id = refImg && refImg.id;
      albumData.unshift(entry);
      photoEl.src = resized;
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

function showImage(idx) {
  if (!albumData.length) return;
  currentAlbumIndex = (idx + albumData.length) % albumData.length;
  viewerImg.src = albumData[currentAlbumIndex].photo;
  if (viewerDate) viewerDate.textContent = albumData[currentAlbumIndex].date.toLocaleDateString();
}

async function deleteCurrentPhoto() {
  if (!albumData.length) return;
  const { id } = albumData[currentAlbumIndex];
  if (id) {
    try {
      await deleteDoc(doc(db, 'images', id));
    } catch (err) {
      console.error('Error deleting image', err);
    }
  }
  albumData.splice(currentAlbumIndex, 1);
  mostrarAlbum();
  if (!albumData.length) {
    viewerModal.classList.add('hidden');
    document.removeEventListener('keydown', handleKey);
    photoEl.src = '';
    return;
  }
  if (currentAlbumIndex >= albumData.length) currentAlbumIndex = albumData.length - 1;
  showImage(currentAlbumIndex);
}

function handleKey(e) {
  if (e.key === 'ArrowRight') {
    // Move forward in the album
    showImage(currentAlbumIndex - 1);
  } else if (e.key === 'ArrowLeft') {
    // Move backward in the album
    showImage(currentAlbumIndex + 1);
  }
}

if (albumEl && viewerModal && viewerImg) {
  albumEl.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'IMG') {
      const idx = parseInt(target.dataset.index, 10) || 0;
      showImage(idx);
      viewerModal.classList.remove('hidden');
      document.addEventListener('keydown', handleKey);
    }
  });
}

if (prevPhotoBtn) {
  prevPhotoBtn.addEventListener('click', () => showImage(currentAlbumIndex + 1));
}

if (nextPhotoBtn) {
  nextPhotoBtn.addEventListener('click', () => {
    // Moving right should show the next photo
    showImage(currentAlbumIndex - 1);
  });
}

if (closeViewerBtn && viewerModal) {
  closeViewerBtn.addEventListener('click', () => {
    viewerModal.classList.add('hidden');
    document.removeEventListener('keydown', handleKey);
  });
}
if (deletePhotoBtn) {
  deletePhotoBtn.addEventListener('click', deleteCurrentPhoto);
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

