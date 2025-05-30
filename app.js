// app.js
import { db } from './firebase-init.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  const btnAddSpecies      = document.getElementById('btnAddSpecies');
  const btnCalendar        = document.getElementById('open-calendar');
  const btnScanQR          = document.getElementById('scan-qr');
  const speciesList        = document.getElementById('species-list');

  const modalSpecies       = document.getElementById('species-modal');
  const btnCloseSpecies    = document.getElementById('close-species-modal');
  const btnSaveSpecies     = document.getElementById('save-species');

  // Verificar que existan los elementos
  if (!btnAddSpecies || !btnCalendar || !btnScanQR ||
      !speciesList || !modalSpecies || !btnCloseSpecies || !btnSaveSpecies) {
    console.error('Faltan elementos en el DOM');
    return;
  }

  // Abrir modal Agregar Especie
  btnAddSpecies.addEventListener('click', () => {
    modalSpecies.classList.remove('hidden');
  });

  // Cerrar modal
  btnCloseSpecies.addEventListener('click', () => {
    modalSpecies.classList.add('hidden');
  });

  // Guardar especie en Firestore y recargar lista
  btnSaveSpecies.addEventListener('click', async () => {
    const name = document.getElementById('species-name').value.trim();
    const info = document.getElementById('species-info').value.trim();
    const photoInput = document.getElementById('species-photo');

    if (!name || !info || photoInput.files.length === 0) {
      alert('Completa todos los campos y selecciona una foto.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        await addDoc(collection(db, 'species'), {
          name,
          info,
          photo: e.target.result,
          createdAt: new Date()
        });
        modalSpecies.classList.add('hidden');
        // reset fields
        document.getElementById('species-name').value = '';
        document.getElementById('species-info').value = '';
        photoInput.value = '';
        loadSpecies();
      } catch (err) {
        console.error('Error guardando especie:', err);
        alert('Error al guardar la especie.');
      }
    };
    reader.readAsDataURL(photoInput.files[0]);
  });

  // Función para cargar y mostrar lista de especies
  async function loadSpecies() {
    speciesList.innerHTML = '';
    try {
      const q = query(collection(db, 'species'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      if (snap.empty) {
        speciesList.innerHTML = '<li>No hay especies registradas.</li>';
        return;
      }
      snap.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = doc.data().name;
        speciesList.appendChild(li);
      });
    } catch (err) {
      console.error('Error al cargar especies:', err);
      speciesList.innerHTML = '<li>Error al cargar especies.</li>';
    }
  }

  // Botones Calendario y Escanear QR (solo log por ahora)
  btnCalendar.addEventListener('click', () => console.log('Calendario clic'));
  btnScanQR.addEventListener('click', () => console.log('Escanear QR clic'));

  // Carga inicial
  loadSpecies();
});
