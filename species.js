// species.js
import { db } from './firebase-init.js';
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Obtener ID de especie desde la URL
const urlParams = new URLSearchParams(window.location.search);
const speciesId = urlParams.get('id');
if (!speciesId) {
  alert('Especie no encontrada');
  window.location.href = 'index.html';
}

// Referencias del DOM
const speciesPhotoEl = document.getElementById('species-photo');
const photoInput = document.getElementById('edit-species-photo');
const nameInput = document.getElementById('edit-species-name');
const saveBtn = document.getElementById('save-species-edit');
const deleteBtn = document.getElementById('delete-species');
const plantListEl = document.getElementById('plant-list');
const addPlantBtn = document.getElementById('add-plant-btn');

let speciesData = null;

// Cargar datos de la especie
async function cargarEspecie() {
  const ref = doc(db, 'species', speciesId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    alert('Especie no encontrada');
    window.location.href = 'index.html';
  }
  speciesData = snap.data();
  speciesPhotoEl.src = speciesData.photo;
  nameInput.value = speciesData.name;
}
await cargarEspecie();
await cargarPlantas();

// Guardar cambios
saveBtn.addEventListener('click', async () => {
  const nuevoNombre = nameInput.value.trim();
  if (!nuevoNombre) return alert('El nombre no puede estar vacío.');

  let nuevaFoto = speciesData.photo;

  if (photoInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = async e => {
      nuevaFoto = e.target.result;
      await updateDoc(doc(db, 'species', speciesId), {
        name: nuevoNombre,
        photo: nuevaFoto
      });
      alert('Especie actualizada');
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    await updateDoc(doc(db, 'species', speciesId), {
      name: nuevoNombre,
      photo: nuevaFoto
    });
    alert('Especie actualizada');
  }
});

// Eliminar especie
deleteBtn.addEventListener('click', async () => {
  if (!confirm('¿Estás seguro de eliminar esta especie? Esta acción no se puede deshacer.')) return;
  await deleteDoc(doc(db, 'species', speciesId));
  window.location.href = 'index.html';
});

// Cargar plantas asociadas
async function cargarPlantas() {
  plantListEl.innerHTML = '';
  const q = query(collection(db, 'plants'), where('speciesId', '==', speciesId));
  const snap = await getDocs(q);
  const docs = snap.docs.sort((a, b) => a.data().name.localeCompare(b.data().name));
  docs.forEach(doc => {
    const planta = doc.data();
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${planta.name}</span>
      <button data-id="${doc.id}" class="ver-planta">🔍</button>
      <button data-id="${doc.id}" class="eliminar-planta" style="color:red;">❌</button>
    `;
    plantListEl.appendChild(li);
  });

  // Ir a planta individual
  document.querySelectorAll('.ver-planta').forEach(btn => {
    btn.addEventListener('click', () => {
      const plantId = btn.dataset.id;
      window.location.href = `plant.html?id=${plantId}`;
    });
  });

  // Eliminar planta
  document.querySelectorAll('.eliminar-planta').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta planta?')) {
        await deleteDoc(doc(db, 'plants', btn.dataset.id));
        await cargarPlantas();
      }
    });
  });
}

// Agregar planta
addPlantBtn.addEventListener('click', async () => {
  const nombre = prompt('Nombre de la nueva planta:');
  if (!nombre) return;

  await addDoc(collection(db, 'plants'), {
    name: nombre.trim(),
    speciesId: speciesId,
    createdAt: new Date()
  });
  await cargarPlantas();
});
