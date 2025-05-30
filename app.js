// app.js
import { db } from './firebase-init.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // — Referencias del DOM —
  const btnAddSpecies    = document.getElementById('btnAddSpecies');
  const btnCalendar      = document.getElementById('open-calendar');
  const btnScanQR        = document.getElementById('scan-qr');
  const speciesList      = document.getElementById('species-list');

  const modalSpecies     = document.getElementById('species-modal');
  const btnCloseSpecies  = document.getElementById('close-species-modal');
  const btnSaveSpecies   = document.getElementById('save-species');

  const modalCalendar    = document.getElementById('calendar-modal');
  const btnCloseCalendar = document.getElementById('close-calendar-modal');
  const calendarContainer= document.getElementById('calendar-container');
  const eventsList       = document.getElementById('events-list');

  // Comprueba que todo exista
  if (!btnAddSpecies || !btnCalendar || !btnScanQR ||
      !speciesList || !modalSpecies || !btnCloseSpecies ||
      !btnSaveSpecies || !modalCalendar || !btnCloseCalendar ||
      !calendarContainer || !eventsList) {
    console.error('Faltan elementos en el DOM. Verifica tus IDs.');
    return;
  }

  // — Modal Agregar Especie —
  btnAddSpecies.addEventListener('click', () => {
    modalSpecies.classList.remove('hidden');
  });
  btnCloseSpecies.addEventListener('click', () => {
    modalSpecies.classList.add('hidden');
  });
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
        document.getElementById('species-name').value = '';
        document.getElementById('species-info').value = '';
        photoInput.value = '';
        cargarEspecies();
      } catch (err) {
        console.error('Error guardando especie:', err);
        alert('Error al guardar la especie.');
      }
    };
    reader.readAsDataURL(photoInput.files[0]);
  });

  // — Carga lista de Especies —
  async function cargarEspecies() {
    speciesList.innerHTML = '';
    const q = query(collection(db, 'species'), orderBy('name', 'asc'));
    try {
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
      console.error('Error cargando especies:', err);
      speciesList.innerHTML = '<li>Error al cargar especies.</li>';
    }
  }

  // — Mock botones Calendario y QR (se llenará luego) —
  btnCalendar.addEventListener('click', () => {
    console.log('Clic en Calendario');
    // Aquí llamaremos a abrir calendario
  });
  btnScanQR.addEventListener('click', () => {
    console.log('Clic en Escanear QR');
    // Aquí llamaremos a escanear QR
  });

  // — Modal Calendario —
  btnCalendar.addEventListener('click', () => {
    modalCalendar.classList.remove('hidden');
    // renderCalendar();   // lo implementamos en el siguiente paso
  });
  btnCloseCalendar.addEventListener('click', () => {
    modalCalendar.classList.add('hidden');
    calendarContainer.innerHTML = '';
    eventsList.innerHTML = '';
  });

  // carga inicial
  cargarEspecies();
});
