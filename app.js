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
  const saveEventBtn     = document.getElementById('save-event');
  // Asignar fecha actual al campo de evento
const hoy = new Date().toISOString().split('T')[0];
eventDateInput.value = hoy;

  // Comprueba que todo exista
if (!btnAddSpecies || !btnCalendar || !btnScanQR ||
    !speciesList || !modalSpecies || !btnCloseSpecies ||
    !btnSaveSpecies || !modalCalendar || !btnCloseCalendar ||
    !calendarContainer || !eventsList || !eventDateInput ||
    !eventTypeSelect || !saveEventBtn ||
    !document.getElementById('plant-checkboxes')) {
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
  // Verificar si plantsMap está vacío
  if (plantsMap.size === 0) {
    await cargarEspecies(); // Carga las especies y llena plantsMap
  }

  modalCalendar.classList.remove('hidden');

  try {
    const snapEv = await getDocs(collection(db, 'events'));
    eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCalendar();

    // Poblar selector de plantas en el formulario de eventos
const checkboxContainer = document.getElementById('plant-checkboxes');
checkboxContainer.innerHTML = ''; // Limpiar antes

plantsMap.forEach((data, id) => {
  const label = document.createElement('label');
  label.style.display = 'block';
  label.style.marginBottom = '4px';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = id;
  checkbox.name = 'plant-checkbox';

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(' ' + data.name));

  checkboxContainer.appendChild(label);
});


  } catch (err) {
    console.error('Error al guardar el evento:', err);
    alert('Error al guardar el evento.');
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
// Guardar evento (solo una vez)
saveEventBtn.addEventListener('click', async () => {
  const date = eventDateInput.value;
const type = eventTypeSelect.value;
const selectedCheckboxes = [...document.querySelectorAll('input[name="plant-checkbox"]:checked')];

if (!date || !type || selectedCheckboxes.length === 0) {
  alert('Completa todos los campos y selecciona al menos una planta.');
  return;
}

try {
  for (const chk of selectedCheckboxes) {
  await addDoc(collection(db, 'events'), {
    date,
    type,
    plantId: chk.value,
    createdAt: new Date()
  });
}


  // Recargar eventos y calendario
  const snapEv = await getDocs(collection(db, 'events'));
  eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCalendar();
  renderEventList();

  // Resetear formulario
  eventDateInput.value = new Date().toISOString().split('T')[0];
  eventTypeSelect.value = 'Riego';
  

  // Cerrar modal
document.getElementById('add-event-modal').classList.add('hidden');

// Limpiar los checkboxes seleccionados
selectedCheckboxes.forEach(cb => cb.checked = false);

} catch (err) {
  console.error('Error al guardar los eventos:', err);
  alert('Error al guardar los eventos.');
}

});

  // 🔽 Aquí empieza la función fuera del addEventListener
  function renderCalendar() {
  calendarContainer.innerHTML = '';
  eventsList.innerHTML = '';

  let currentDate = new Date();
  if (renderCalendar.current) currentDate = renderCalendar.current;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Encabezado con nombre del mes
  const mesNombre = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);
  const tituloMes = document.createElement('h2');
  tituloMes.textContent = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
  tituloMes.style.textAlign = 'center';
  calendarContainer.appendChild(tituloMes);

  // Botones anterior y siguiente
  const nav = document.createElement('div');
  nav.style.display = 'flex';
  nav.style.justifyContent = 'space-between';
  nav.style.margin = '0.5rem 0';

  const btnPrev = document.createElement('button');
  btnPrev.textContent = '← Mes anterior';
  btnPrev.onclick = () => {
    renderCalendar.current = new Date(year, month - 1, 1);
    renderCalendar();
  };

  const btnNext = document.createElement('button');
  btnNext.textContent = 'Mes siguiente →';
  btnNext.onclick = () => {
    renderCalendar.current = new Date(year, month + 1, 1);
    renderCalendar();
  };

  nav.appendChild(btnPrev);
  nav.appendChild(btnNext);
  calendarContainer.appendChild(nav);

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
function renderEventList() {
  eventsList.innerHTML = '<h3>Eventos</h3>';
  const list = document.createElement('ul');

  eventsData.forEach(e => {
    const li = document.createElement('li');
    const planta = plantsMap.get(e.plantId);
    const nombre = planta ? planta.name : `(ID: ${e.plantId})`;

    li.innerHTML = `
      <strong><a href="#" class="plant-link" data-id="${e.plantId}">${nombre}</a></strong>
      - ${e.type} - ${e.date}
      <button class="delete-event" data-id="${e.id}">❌</button>
    `;
    list.appendChild(li);
  });

  eventsList.appendChild(list);

  document.querySelectorAll('.delete-event').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await deleteDoc(doc(db, 'events', id));
      const snapEv = await getDocs(collection(db, 'events'));
      eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
      renderCalendar();
      renderEventList();
    });
  });
}


 function mostrarEventosPorDia(dateStr) {
  const contenedor = document.getElementById('eventos-dia');
if (!contenedor) {
  console.error('No se encontró el contenedor #eventos-dia en el DOM.');
  return;
}

  contenedor.innerHTML = ''; // limpia contenido anterior

  const eventosFiltrados = eventsData.filter(ev => ev.date === dateStr);

  if (eventosFiltrados.length === 0) {
    contenedor.innerHTML = '<p>No hay eventos para este día.</p>';
    return;
  }

  eventosFiltrados.forEach(ev => {
    const div = document.createElement('div');
    div.className = 'evento-dia';

    // Obtener nombre de la planta desde plantsMap usando plantId
    const planta = plantsMap.get(ev.plantId);
    const nombrePlanta = planta ? planta.name : '(Planta no encontrada)';

    const enlace = document.createElement('a');
    enlace.href = '#';
    enlace.textContent = nombrePlanta;
    enlace.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarCartaPlanta(ev.plantId); // Aquí pasamos el ID para mostrar info
    });

    const spanTipo = document.createElement('span');
    spanTipo.textContent = ` - ${ev.type}`;

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de eliminar este evento?')) {
        await eliminarEvento(ev.id);
        // Recarga datos después de eliminar
        const snapEv = await getDocs(collection(db, 'events'));
        eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
        renderCalendar();
        mostrarEventosPorDia(dateStr); // actualizar vista del día
      }
    });

    div.appendChild(enlace);
    div.appendChild(spanTipo);
    div.appendChild(btnEliminar);
    contenedor.appendChild(div);
  });
}

async function eliminarEvento(id) {
  await deleteDoc(doc(db, 'events', id));
}



  // carga inicial
  cargarEspecies();
});



