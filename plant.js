// plant.js

import { db } from './firebase-init.js';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Espera que el DOM esté listo
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const plantId = urlParams.get('id');

  if (!plantId) {
    alert('No se encontró el ID de la planta');
    window.location.href = 'index.html';
    return;
  }

  const photoEl = document.getElementById('plant-photo');
  const nameInput = document.getElementById('edit-plant-name');
  const dateInput = document.getElementById('edit-plant-date');
  const saveBtn = document.getElementById('save-plant-edit');
  const deleteBtn = document.getElementById('delete-plant');
  const eventsContainer = document.getElementById('plant-events');
  const editPhotoInput = document.getElementById('edit-plant-photo');

  try {
    const plantRef = doc(db, 'plants', plantId);
    const plantSnap = await getDoc(plantRef);

    if (!plantSnap.exists()) {
      alert('Planta no encontrada');
      window.location.href = 'index.html';
      return;
    }

    const plantData = plantSnap.data();
    photoEl.src = plantData.photo;
    nameInput.value = plantData.name;
    dateInput.value = plantData.date || '';

    // Eventos de esta planta
    const q = query(collection(db, 'events'), where('plantId', '==', plantId));
    const snap = await getDocs(q);
    eventsContainer.innerHTML = '';
    snap.forEach(doc => {
      const e = doc.data();
      const div = document.createElement('div');
      div.textContent = `${e.date} - ${e.type}`;
      eventsContainer.appendChild(div);
    });

    // Guardar cambios
    saveBtn.addEventListener('click', async () => {
      const newName = nameInput.value.trim();
      const newDate = dateInput.value.trim();

      const updateData = {
        name: newName,
        date: newDate
      };

      if (editPhotoInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          updateData.photo = e.target.result;
          await updateDoc(plantRef, updateData);
          alert('Cambios guardados');
        };
        reader.readAsDataURL(editPhotoInput.files[0]);
      } else {
        await updateDoc(plantRef, updateData);
        alert('Cambios guardados');
      }
    });

    // Eliminar planta
    deleteBtn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta planta?')) {
        await deleteDoc(plantRef);
        alert('Planta eliminada');
        window.history.back();
      }
    });

  } catch (err) {
    console.error('Error cargando planta:', err);
    alert('Error al cargar la planta');
  }
});
