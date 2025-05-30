import { db } from './firebase-init.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === CONTROL DEL MODAL AGREGAR ESPECIE ===
document.addEventListener('DOMContentLoaded', () => {
  const btnAddSpecies   = document.getElementById('btnAddSpecies');
  const modalSpecies    = document.getElementById('species-modal');
  const btnCloseSpecies = document.getElementById('close-species-modal');
  const btnSaveSpecies  = document.getElementById('save-species');
  const speciesList     = document.getElementById('species-list');

  if (!btnAddSpecies || !modalSpecies || !btnCloseSpecies || !btnSaveSpecies || !speciesList) {
    console.error('Faltan elementos del DOM para el modal de Especie');
    return;
  }

  // Abrir modal
  btnAddSpecies.addEventListener('click', () => {
    modalSpecies.classList.remove('hidden');
  });

  // Cerrar modal
  btnCloseSpecies.addEventListener('click', () => {
    modalSpecies.classList.add('hidden');
  });

  // Guardar especie
  btnSaveSpecies.addEventListener('click', async () => {
    const nameInput = document.getElementById('species-name').value.trim();
    const infoInput = document.getElementById('species-info').value.trim();
    const photoInput = document.getElementById('species-photo');

    if (!nameInput || !infoInput || photoInput.files.length === 0) {
      alert('Completa todos los campos y selecciona una imagen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await addDoc(collection(db, 'species'), {
          name: nameInput,
          info: infoInput,
          photo: e.target.result,
          createdAt: new Date()
        });
        modalSpecies.classList.add('hidden');
        document.getElementById('species-name').value = '';
        document.getElementById('species-info').value = '';
        photoInput.value = '';
        cargarEspecies();  // recarga la lista
      } catch (err) {
        console.error('Error guardando especie:', err);
        alert('Error guardando especie');
      }
    };
    reader.readAsDataURL(photoInput.files[0]);
  });

  // Función para cargar la lista
  async function cargarEspecies() {
    speciesList.innerHTML = '';
    const q = query(collection(db, 'species'), orderBy('name'));
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.data().name;
      speciesList.appendChild(li);
    });
  }

  // Carga inicial
  cargarEspecies();
});
