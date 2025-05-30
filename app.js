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
    // --- CALENDARIO ---
  // Referencias para calendario
  const btnOpenCalendar       = document.getElementById('open-calendar');
  const modalCalendar         = document.getElementById('calendar-modal');
  const btnCloseCalendar      = document.getElementById('close-calendar-modal');
  const calendarContainer     = document.getElementById('calendar-container');
  const eventsListContainer   = document.getElementById('events-list');
  let eventsData = [];  // guardará todos los eventos

  // Abrir modal Calendario
  btnOpenCalendar.addEventListener('click', async () => {
    // Carga eventos
    const snapEv = await getDocs(collection(db, 'events'));
    eventsData = snapEv.docs.map(d => ({ id:d.id, ...d.data() }));
    renderCalendar();
    modalCalendar.classList.remove('hidden');
  });

  // Cerrar modal Calendario
  btnCloseCalendar.addEventListener('click', () => {
    modalCalendar.classList.add('hidden');
    calendarContainer.innerHTML = '';
    eventsListContainer.innerHTML = '';
  });

  // Genera el calendario del mes actual
  function renderCalendar() {
    calendarContainer.innerHTML = '';
    eventsListContainer.innerHTML = '';
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Primer día y número de días
    const firstDay = new Date(year, month, 1).getDay(); // 0=domingo
    const daysInMonth = new Date(year, month+1, 0).getDate();

    // Cabecera con días de la semana
    const daysNames = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
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

    // Cuerpo del calendario
    const tbody = document.createElement('tbody');
    let tr = document.createElement('tr');
    // Celdas vacías antes del primer día
    for(let i=0;i<firstDay;i++){
      tr.appendChild(document.createElement('td'));
    }
    // Celdas con días
    for(let day=1; day<=daysInMonth; day++){
      if(tr.children.length===7){
        tbody.appendChild(tr);
        tr = document.createElement('tr');
      }
      const td = document.createElement('td');
      td.textContent = day;
      // Fecha en formato YYYY-MM-DD
      const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

      // Si hay eventos en esa fecha, resaltar
      const hasEvents = eventsData.some(e=> e.date===dayStr);
      if(hasEvents){
        td.classList.add('has-event');
        td.addEventListener('click', () => showEventsForDay(dayStr));
      }
      tr.appendChild(td);
    }
    // Última fila
    tbody.appendChild(tr);
    table.appendChild(tbody);
    calendarContainer.appendChild(table);
  }

  // Muestra la lista de eventos de un día seleccionado
  function showEventsForDay(dateStr) {
    eventsListContainer.innerHTML = `<h3>Eventos ${dateStr}</h3>`;
    const list = document.createElement('ul');
    eventsData.filter(e=>e.date===dateStr).forEach(e=>{
      const li = document.createElement('li');
      // Enlace a la planta
      const a = document.createElement('a');
      a.textContent = `${e.type} de Planta ${e.plantId}`;
      a.href = `plant.html?id=${e.plantId}`;
      li.appendChild(a);
      list.appendChild(li);
    });
    eventsListContainer.appendChild(list);
  }


  // Carga inicial
  loadSpecies();
});
