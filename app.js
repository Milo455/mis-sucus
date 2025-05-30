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
  let eventsData = [];

  btnCalendar.addEventListener('click', async () => {
    modalCalendar.classList.remove('hidden');
    try {
      const snapEv = await getDocs(collection(db, 'events'));
      eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
      renderCalendar();
    } catch (err) {
      console.error('Error cargando eventos:', err);
      calendarContainer.innerHTML = '<p>Error al cargar el calendario.</p>';
    }
  });

  // Cerrar modal Calendario
  btnCloseCalendar.addEventListener('click', () => {
    modalCalendar.classList.add('hidden');
    calendarContainer.innerHTML = '';
    eventsList.innerHTML = '';
  });

  // 🔽 Aquí empieza la función fuera del addEventListener
  function renderCalendar() {
    calendarContainer.innerHTML = '';
    eventsList.innerHTML = '';
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const mesNombre = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(today);
const tituloMes = document.createElement('h2');
tituloMes.textContent = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
calendarContainer.appendChild(tituloMes);


    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    daysNames.forEach(d => {
      const th = document.createElement('th');
      th.textContent = d;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let tr = document.createElement('tr');
    for (let i = 0; i < firstDay; i++) {
      tr.appendChild(document.createElement('td'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      if (tr.children.length === 7) {
        tbody.appendChild(tr);
        tr = document.createElement('tr');
      }
      const td = document.createElement('td');
      td.textContent = day;
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const hasEvents = eventsData.some(e => e.date === dayStr);
      if (hasEvents) {
        td.classList.add('has-event');
        td.addEventListener('click', () => mostrarEventosPorDia(dayStr));
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
    table.appendChild(tbody);
    calendarContainer.appendChild(table);
  }

  function mostrarEventosPorDia(dateStr) {
  eventsList.innerHTML = `<h3>Eventos para ${dateStr}</h3>`;
  const list = document.createElement('ul');
  eventsData
    .filter(e => e.date === dateStr)
    .forEach(e => {
      const li = document.createElement('li');
      const tipo = e.type || 'Evento';
      const planta = e.plantId || 'sin ID';
      li.textContent = `${tipo} de Planta ${planta}`;
      list.appendChild(li);
    });
  eventsList.appendChild(list);
}

  // carga inicial
  cargarEspecies();
});
