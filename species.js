// species.js

import { db } from './firebase-init.js';
import { resizeImage } from './resizeImage.js';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
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

function safeRedirect(url) {
  try {
    window.location.href = url;
  } catch (_) {
    // Ignore navigation errors in test environments
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const speciesId = params.get('id');
  if (!speciesId) {
    alert('ID de especie no encontrado.');
    safeRedirect('index.html');
    return;
  }

  // Elementos del DOM
  const photoDisplay = document.getElementById('species-photo-display');
  const nameDisplay = document.getElementById('species-name-display');
  const editBtn = document.getElementById('edit-species-btn');
  const editForm = document.getElementById('edit-species-form');
  const inputName = document.getElementById('edit-species-name');
  const inputPhoto = document.getElementById('edit-species-photo');
  const saveBtn = document.getElementById('save-species-edit');
  const deleteBtn = document.getElementById('delete-species');
  const plantList = document.getElementById('plant-list');
  const addPlantBtn = document.getElementById('add-plant-btn');
  const plantModal = document.getElementById('plant-modal');
  const closePlantModal = document.getElementById('close-plant-modal');
  const savePlantBtn = document.getElementById('save-plant');
  const plantNameInput = document.getElementById('plant-name');
  const plantNotesInput = document.getElementById('plant-notes');
  const plantPhotoInput = document.getElementById('plant-photo');
  const infoBtn = document.getElementById('show-species-info-btn');
  const infoModal = document.getElementById('species-info-modal');
  const closeInfoModal = document.getElementById('close-species-info');
  const infoText = document.getElementById('species-info-text');
  const editInfoBtn = document.getElementById('edit-species-info-btn');
  const infoTextarea = document.getElementById('edit-species-info');
  const saveInfoBtn = document.getElementById('save-species-info');

  if (infoBtn && infoModal && closeInfoModal) {
    infoBtn.addEventListener('click', () => {
      infoModal.classList.remove('hidden');
    });
    closeInfoModal.addEventListener('click', () => {
      infoModal.classList.add('hidden');
    });
  }

  if (editInfoBtn && infoTextarea && saveInfoBtn) {
    editInfoBtn.addEventListener('click', () => {
      infoTextarea.classList.toggle('hidden');
      saveInfoBtn.classList.toggle('hidden');
      if (!infoTextarea.classList.contains('hidden')) {
        infoTextarea.value = speciesData ? speciesData.info || '' : '';
      }
    });

    saveInfoBtn.addEventListener('click', async () => {
      const newInfo = infoTextarea.value.trim();
      await updateDoc(doc(db, 'species', speciesId), { info: newInfo });
      if (infoText) {
        infoText.textContent = newInfo;
      }
      infoTextarea.classList.add('hidden');
      saveInfoBtn.classList.add('hidden');
    });
  }

  const plantNamesSet = new Set();

  let speciesData = null;

  // Cargar datos
  async function cargarEspecie() {
    const ref = doc(db, 'species', speciesId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert('Especie no encontrada.');
      return;
    }
    speciesData = snap.data();
    photoDisplay.src = speciesData.photo;
    nameDisplay.textContent = speciesData.name;
    inputName.value = speciesData.name;
    if (infoText) {
      infoText.textContent = speciesData.info || '';
    }
    if (infoTextarea) {
      infoTextarea.value = speciesData.info || '';
    }
  }

  // Mostrar formulario de edición
  let modoEdicion = false;
  editBtn.addEventListener('click', () => {
  editForm.classList.toggle('hidden');
  modoEdicion = !modoEdicion;
  mostrarOcultarBotonesEliminar();
});


  // Guardar edición
  saveBtn.addEventListener('click', async () => {
    const nuevoNombre = inputName.value.trim();
    let nuevaFoto = speciesData.photo;

    if (inputPhoto.files.length > 0) {
      const reader = new FileReader();
      reader.onload = async e => {
        nuevaFoto = await resizeImage(e.target.result, 800);
        await guardarCambios(nuevoNombre, nuevaFoto);
      };
      reader.readAsDataURL(inputPhoto.files[0]);
    } else {
      await guardarCambios(nuevoNombre, nuevaFoto);
    }
  });

  async function guardarCambios(nombre, foto) {
    await updateDoc(doc(db, 'species', speciesId), {
      name: nombre,
      photo: foto
    });
    alert('Cambios guardados');
    window.location.reload();
  }

  // Eliminar especie
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('¿Estás seguro de eliminar esta especie y todas sus plantas?')) return;

    // Eliminar todas las plantas asociadas
    const q = query(collection(db, 'plants'), where('speciesId', '==', speciesId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'plants', d.id));
    }

    await deleteDoc(doc(db, 'species', speciesId));
    alert('Especie eliminada');
    safeRedirect('index.html');
  });

  const CACHE_TIMEOUT = 3600000; // 1 hora

  function renderPlantItem({ id, name, img }) {
    const li = document.createElement('li');
    li.className = 'plant-item';

    const image = document.createElement('img');
    image.src = img || '';
    image.alt = name;

    const imgLink = document.createElement('a');
    imgLink.href = `plant.html?id=${id}`;
    imgLink.appendChild(image);

    const link = document.createElement('a');
    link.href = `plant.html?id=${id}`;
    link.className = 'plant-name';
    link.textContent = name;

    const delBtn = document.createElement('button');
    delBtn.dataset.id = id;
    delBtn.className = 'delete-plant-btn small-button';
    delBtn.style.display = 'none';
    delBtn.style.marginLeft = '8px';
    delBtn.textContent = '❌';

    li.append(imgLink, link, delBtn);
    plantList.appendChild(li);
  }

  function attachDeleteHandlers() {
    document.querySelectorAll('.delete-plant-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Eliminar esta planta?')) {
          await deleteDoc(doc(db, 'plants', id));
          await cargarPlantas();
        }
      });
    });
  }

  // Cargar plantas con caché sencillo
  async function cargarPlantas() {
    plantList.innerHTML = '';
    plantNamesSet.clear();
    const cacheKey = `plants_${speciesId}`;
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch (_) {
      cached = null;
    }
    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      cached.data.forEach(p => {
        plantNamesSet.add((p.name || '').trim().toLowerCase());
        renderPlantItem(p);
      });
      attachDeleteHandlers();
      mostrarOcultarBotonesEliminar();
    }

    const q = query(collection(db, 'plants'), where('speciesId', '==', speciesId));
    const snap = await getDocs(q);
    if (snap.empty) {
      plantList.innerHTML = '<li>No hay plantas registradas.</li>';
      localStorage.removeItem(cacheKey);
      return;
    }

    const fresh = [];
    plantList.innerHTML = '';
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      plantNamesSet.add((data.name || '').trim().toLowerCase());

      let imgSrc = '';
      try {
        const imgQ = query(
          collection(db, 'images'),
          where('plantId', '==', docSnap.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const imgSnap = await getDocs(imgQ);
        if (!imgSnap.empty) {
          imgSrc = imgSnap.docs[0].data().base64;
        }
      } catch (_) {
        imgSrc = '';
      }

      const entry = { id: docSnap.id, name: data.name, img: imgSrc };
      fresh.push(entry);
      renderPlantItem(entry);
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: fresh }));
    } catch (err) {
      if (err instanceof DOMException) {
        console.warn('Failed to cache plants', err);
      } else {
        throw err;
      }
    }

    attachDeleteHandlers();
    mostrarOcultarBotonesEliminar();
  }

  // Agregar planta
  addPlantBtn.addEventListener('click', () => {
    plantModal.classList.remove('hidden');
  });

  closePlantModal.addEventListener('click', () => {
    plantModal.classList.add('hidden');
  });

  savePlantBtn.addEventListener('click', async () => {
    const nombre = plantNameInput.value.trim();
    const notas = plantNotesInput.value.trim();

    if (!nombre || plantPhotoInput.files.length === 0) {
      alert('Ingresa nombre y selecciona una foto.');
      return;
    }
    if (plantNamesSet.has(nombre.toLowerCase())) {
      alert('Ya existe una planta con ese nombre.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async e => {
      const resizedPhoto = await resizeImage(e.target.result, 800);
      const size = atob(resizedPhoto.split(',')[1]).length;
      if (size > 1024 * 1024) {
        alert('Imagen demasiado grande incluso después de comprimir.');
        return;
      }

      const createdAt = new Date();
      const docRef = await addDoc(collection(db, 'plants'), {
        name: nombre,
        notes: notas,
        speciesId,
        createdAt
      });
      plantNamesSet.add(nombre.toLowerCase());
      await ensureAuth();
      await addDoc(collection(db, 'images'), {
        plantId: docRef.id,
        base64: resizedPhoto,
        createdAt
      });
      if (typeof QRious !== 'undefined') {
        const qr = new QRious({ value: docRef.id, size: 200 });
        await updateDoc(doc(db, 'plants', docRef.id), { qrCode: qr.toDataURL() });
      } else {
        console.warn('QRious no disponible, se omite el código QR');
      }
      plantModal.classList.add('hidden');
      plantNameInput.value = '';
      plantNotesInput.value = '';
      plantPhotoInput.value = '';
      await cargarPlantas();
      mostrarOcultarBotonesEliminar();
    };
    reader.readAsDataURL(plantPhotoInput.files[0]);
  });
  function mostrarOcultarBotonesEliminar() {
  document.querySelectorAll('.delete-plant-btn').forEach(btn => {
    btn.style.display = modoEdicion ? 'inline' : 'none';
  });
}

  await cargarEspecie();
  await cargarPlantas();
  mostrarOcultarBotonesEliminar();
});
