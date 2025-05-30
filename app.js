import { db } from './firebase-init.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  const btnAddSpecies      = document.getElementById('btnAddSpecies');
  const modalSpecies       = document.getElementById('species-modal');
  const btnCloseSpecies    = document.getElementById('close-species-modal');
  const btnSaveSpecies     = document.getElementById('save-species');
  const speciesList        = document.getElementById('species-list');

  const btnCalendar        = document.getElementById('open-calendar');
  const btnScanQR          = document.getElementById('scan-qr');

  // Validar que existan
  if (!btnAddSpecies || !modalSpecies || !btnCloseSpecies || !btnSaveSpecies || !speciesList) {
    console.error('Faltan elementos DOM para modal o lista de especies');
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
      alert('Completa todos los campos y selecciona una foto.');
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
        // Reset campos
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

  // Función para cargar lista de especies
  async function loadSpecies() {
    speciesList.innerHTML = '';
    try {
      const q = query(collection(db, 'species'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        speciesList.innerHTML = '<li>No hay especies registradas.</li>';
        return;
      }
      snapshot.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = doc.data().name;
        speciesList.appendChild(li);
      });
    } catch (err) {
      console.error('Error cargando especies:', err);
      speciesList.innerHTML = '<li>Error al cargar especies.</li>';
    }
  }

  // Botones Calendario y Escanear QR (solo logging por ahora)
  btnCalendar.addEventListener('click', () => {
    console.log('Clic en Calendario');
  });
  btnScanQR.addEventListener('click', () => {
    console.log('Clic en Escanear QR');
  });

  // Carga inicial
  loadSpecies();
});
