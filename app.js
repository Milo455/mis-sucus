// app.js

import { db } from './firebase-init.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const plantsMap = new Map();
// — ÚNICO document.addEventListener('DOMContentLoaded') que va a envolver TODO —
document.addEventListener('DOMContentLoaded', () => {
  // — Referencias del DOM (YA dentro de DOMContentLoaded) —
  const btnAddSpecies    = document.getElementById('btnAddSpecies');
  const btnCalendar      = document.getElementById('open-calendar');
  const btnScanQR        = document.getElementById('scan-qr');
  const speciesList      = document.getElementById('species-list');

  const modalSpecies     = document.getElementById('species-modal');
  const btnCloseSpecies  = document.getElementById('close-species-modal');
  const btnSaveSpecies   = document.getElementById('save-species');

  const modalCalendar    = document.getElementById('calendar-modal');
  const btnCloseCalendar = document.getElementById('close-calendar');
  const calendarContainer= document.getElementById('calendar-container');
  const eventsList       = document.getElementById('events-list');

  const eventDateInput   = document.getElementById('event-date');
  const eventTypeSelect  = document.getElementById('event-type');
  const eventPlantSelect = document.getElementById('event-plant');
  const saveEventBtn     = document.getElementById('save-event');

  // Comprueba que todo exista
   if (!btnAddSpecies || !btnCalendar || !btnScanQR ||
      !speciesList || !modalSpecies || !btnCloseSpecies ||
      !btnSaveSpecies || !modalCalendar || !btnCloseCalendar ||
      !calendarContainer || !eventsList || !eventDateInput ||
      !eventTypeSelect || !eventPlantSelect || !saveEventBtn) {
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
  plantsMap.clear(); // Limpia el mapa antes de recargar
  const q = query(collection(db, 'species'), orderBy('name', 'asc'));
  try {
    const snap = await getDocs(q);
    if (snap.empty) {
      speciesList.innerHTML = '<li>No hay especies registradas.</li>';
      return;
    }
    snap.forEach(doc => {
      const data = doc.data();
      plantsMap.set(doc.id, data); // Guardamos en el mapa
      const li = document.createElement('li');
      li.textContent = data.name;
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
  let eventsData = [];

btnCalendar.addEventListener('click', async () => {
  if (plantsMap.size === 0) {
    await cargarEspecies();
  }

  modalCalendar.classList.remove('hidden');

  try {
    const snapEv = await getDocs(collection(db, 'events'));
    eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCalendar();

    const plantSelect = document.getElementById('event-plant');
    plantSelect.innerHTML = '';
    plantsMap.forEach((data, id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = data.name;
      plantSelect.appendChild(option);
    });

  } catch (err) {
    console.error('Error cargando eventos:', err);
    calendarContainer.innerHTML = '<p>Error al cargar el calendario.</p>';
  }
});

// Abrir modal de agregar evento
document.getElementById('open-event-modal').addEventListener('click', () => {
  document.getElementById('add-event-modal').classList.remove('hidden');
});

// Cerrar modal de agregar evento
document.getElementById('close-add-event').addEventListener('click', () => {
  document.getElementById('add-event-modal').classList.add('hidden');
});

// Cerrar modal Calendario
btnCloseCalendar.addEventListener('click', () => {
  modalCalendar.classList.add('hidden');
  calendarContainer.innerHTML = '';
  eventsList.innerHTML = '';
});

// Guardar evento (solo una vez, corregido y con soporte para varias plantas)
saveEventBtn.addEventListener('click', async () => {
  const date = eventDateInput.value;
  const type = eventTypeSelect.value;
  const selectedPlantIds = Array.from(eventPlantSelect.selectedOptions).map(opt => opt.value);

  if (!date || !type || selectedPlantIds.length === 0) {
    alert('Completa todos los campos.');
    return;
  }

  try {
    for (const plantId of selectedPlantIds) {
      await addDoc(collection(db, 'events'), {
        date,
        type,
        plantId,
        createdAt: new Date()
      });
    }

    const snapEv = await getDocs(collection(db, 'events'));
    eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCalendar();
    renderEventList();

    eventDateInput.value = '';
    eventTypeSelect.value = 'Riego';
    eventPlantSelect.selectedIndex = -1;

    document.getElementById('add-event-modal').classList.add('hidden');

    alert('Evento(s) guardado(s) correctamente.');
  } catch (err) {
    console.error('Error al guardar el evento:', err);
    alert('Error al guardar el evento.');
  }
});
