// species.js

import { db, storage } from './firebase-init.js';
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
  where
} from './firestore-web.js';
import { ref, uploadString, getDownloadURL } from './storage-web.js';

function safeRedirect(url) {
  try {
    window.location.href = url;
  } catch {
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
    photoDisplay.src = speciesData.photo || 'icons/icon-192.png';
    nameDisplay.textContent = speciesData.name;
    inputName.value = speciesData.name;
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

  // Cargar plantas
  async function cargarPlantas() {
    plantList.innerHTML = '';
    const q = query(collection(db, 'plants'), where('speciesId', '==', speciesId));
    const snap = await getDocs(q);
    if (snap.empty) {
      plantList.innerHTML = '<li>No hay plantas registradas.</li>';
      return;
    } 
   
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.className = 'plant-item';

      const img = document.createElement('img');
      img.src = data.photo;
      img.alt = data.name;

      const imgLink = document.createElement('a');
      imgLink.href = `plant.html?id=${docSnap.id}`;
      imgLink.appendChild(img);

      const link = document.createElement('a');
      link.href = `plant.html?id=${docSnap.id}`;
      link.className = 'plant-name';
      link.textContent = data.name;

      const delBtn = document.createElement('button');
      delBtn.dataset.id = docSnap.id;
      delBtn.className = 'delete-plant-btn small-button';
      delBtn.style.display = 'none';
      delBtn.style.marginLeft = '8px';
      delBtn.textContent = '❌';

      li.append(imgLink, link, delBtn);
      plantList.appendChild(li);
    });

    document.querySelectorAll('.delete-plant-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Eliminar esta planta?')) {
          await deleteDoc(doc(db, 'plants', id));
          cargarPlantas();
        }
      });
    });

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
      alert('Completa todos los campos y selecciona una foto.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const resizedPhoto = await resizeImage(e.target.result, 800);
        const createdAt = new Date();
        const docRef = await addDoc(collection(db, 'plants'), {
          name: nombre,
          notes: notas,
          speciesId,
          createdAt
        });
        const photoRef = ref(storage, `plants/${docRef.id}/album/${Date.now()}.jpg`);
        await uploadString(photoRef, resizedPhoto, 'data_url');
        const url = await getDownloadURL(photoRef);
        await updateDoc(doc(db, 'plants', docRef.id), {
          photo: url,
          album: [{ url, date: createdAt }]
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
        cargarPlantas();
      } catch (err) {
        console.error(err);
        alert('Error al guardar la planta. Int\u00e9ntalo de nuevo.');
      }
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
});
