// species.js

import { db } from './firebase-init.js';
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
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const speciesId = params.get('id');
  if (!speciesId) {
    alert('ID de especie no encontrado.');
    window.location.href = 'index.html';
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
        nuevaFoto = e.target.result;
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
    window.location.href = 'index.html';
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
    snap.forEach(doc => {
  const data = doc.data();
  const li = document.createElement('li');
li.innerHTML = `
  <a href="plant.html?id=${doc.id}">${data.name}</a>
  <button data-id="${doc.id}" class="delete-plant-btn" style="display: none; margin-left: 8px;">❌</button>
`;
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
  }

  // Agregar planta
  addPlantBtn.addEventListener('click', async () => {
    const nombre = prompt('Nombre de la nueva planta:');
    if (!nombre) return;
    await addDoc(collection(db, 'plants'), {
      name: nombre,
      speciesId,
      createdAt: new Date()
    });
    cargarPlantas();
  });
  function mostrarOcultarBotonesEliminar() {
  document.querySelectorAll('.delete-plant-btn').forEach(btn => {
    btn.style.display = modoEdicion ? 'inline' : 'none';
  });
}

  await cargarEspecie();
  await cargarPlantas();
});
