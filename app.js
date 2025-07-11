// app.js

import { db } from './firebase-init.js';
import { resizeImage } from './resizeImage.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc
} from './firestore-web.js';


const plantsMap = new Map();
const speciesMap = new Map();
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
  const eventDateInput   = document.getElementById('event-date');
  const eventTypeSelect  = document.getElementById('event-type');
  const saveEventBtn     = document.getElementById('save-event');
  const scanEventBtn     = document.getElementById('scan-event-qr');
  const selectedPlantsEl = document.getElementById('selected-plants');
  const qrModal          = document.getElementById('qr-modal');
  const closeQrModal     = document.getElementById('close-qr-modal');
  let qrScanner;
  const selectedPlants = [];

  async function startScan(onDetect) {
    qrModal.classList.remove('hidden');

    if (!qrScanner) {
      qrScanner = new Html5Qrcode('qr-reader');
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        alert('No se encontraron cámaras.');
        return;
      }

      const backCam = devices.find(d => /back|rear|environment|traser/i.test(d.label));
      if (!backCam) {
        alert('No se encontró cámara trasera.');
        return;
      }

      await qrScanner.start(
        { deviceId: { exact: backCam.id } },
        {
          fps: 25,
          qrbox: { width: 300, height: 300 },
          rememberLastUsedCamera: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        },
        async (text) => {
          try {
            await qrScanner.stop();
          } catch (err) {
            console.warn('Failed to stop scanner', err);
          }
          qrModal.classList.add('hidden');
          onDetect(text);
        },
        () => {}
      );

      const supportsContinuous = (() => {
        if (qrScanner.getRunningTrackCapabilities) {
          try {
            const caps = qrScanner.getRunningTrackCapabilities();
            const modes = caps.focusMode;
            if (modes) {
              return Array.isArray(modes)
                ? modes.includes('continuous')
                : modes === 'continuous';
            }
          } catch (err) {
            console.warn('No se pudieron obtener capacidades de la cámara', err);
          }
        }
        return true; // Asumir soporte si no se puede determinar
      })();

      if (supportsContinuous && qrScanner.applyVideoConstraints) {
        qrScanner
          .applyVideoConstraints({ advanced: [{ focusMode: 'continuous' }] })
          .catch(err => console.warn('Autofocus no soportado', err));
      }
    } catch (err) {
      console.error('Error iniciando scanner', err);
      alert('Error accediendo a la cámara. Intenta recargar la página.');
    }
  }

  // Asignar fecha local actual al campo de evento
  const now = new Date();
  const hoy = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
  eventDateInput.value = hoy;

let selectedDate = hoy;
let selectedDayCell = null;

  // Comprueba que todo exista
if (!btnAddSpecies || !btnCalendar || !btnScanQR ||
    !speciesList || !modalSpecies || !btnCloseSpecies ||
    !btnSaveSpecies || !modalCalendar || !btnCloseCalendar ||
    !calendarContainer || !eventDateInput ||
    !eventTypeSelect || !saveEventBtn ||
    !scanEventBtn || !selectedPlantsEl ||
    !qrModal || !closeQrModal) {
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
    if (!name || photoInput.files.length === 0) {
      alert('Ingresa nombre y selecciona una foto.');
      return;
    }
    for (const existing of speciesMap.values()) {
      if (existing.trim().toLowerCase() === name.toLowerCase()) {
        alert('Ya existe una especie con ese nombre.');
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        await addDoc(collection(db, 'species'), {
          name,
          info,
photo: await resizeImage(e.target.result, 800), // 800px de ancho máximo
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

  // — Carga lista de Especies con caché sencillo —
  const CACHE_TIMEOUT = 3600000; // 1 hora

  function renderSpeciesCard({ id, name, photo }) {
    const card = document.createElement('div');
    card.className = 'species-card';
    card.innerHTML = `
      <img src="${photo}" alt="${name}">
      <div class="species-card-name">${name}</div>
    `;
    card.addEventListener('click', () => {
      window.location.href = `species.html?id=${id}`;
    });
    speciesList.appendChild(card);
  }

  async function cargarEspecies() {
    speciesList.innerHTML = '';
    speciesMap.clear();
    const cacheKey = 'species_list';
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch (_) {
      cached = null;

    }

    if (cached) {
      cached.data.forEach(sp => {
        speciesMap.set(sp.id, sp.name);
        renderSpeciesCard(sp);
      });
    }

    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      return; // datos recientes
    }

    const q = query(collection(db, 'species'), orderBy('name', 'asc'));
    try {
      const snap = await getDocs(q);
      if (snap.empty) {
        speciesList.innerHTML = '<li>No hay especies registradas.</li>';
        localStorage.removeItem(cacheKey);
        return;
      }
      const fresh = [];
      speciesList.innerHTML = '';
      snap.forEach(doc => {
        const data = doc.data();
        const entry = { id: doc.id, name: data.name, photo: data.photo };
        speciesMap.set(entry.id, entry.name);
        fresh.push(entry);
        renderSpeciesCard(entry);
      });
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: fresh }));
    } catch (err) {
      console.error('Error cargando especies:', err);
      if (!cached) {
        speciesList.innerHTML = '<li>Error al cargar especies.</li>';
      }
    }

  }

// Cargar todas las plantas y mapear por especie
async function cargarPlantas() {
  plantsMap.clear();
  if (speciesMap.size === 0) {
    await cargarEspecies();
  }
  const q = query(collection(db, 'plants'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  snap.forEach(docu => {
    const data = docu.data();
    plantsMap.set(docu.id, { name: data.name, speciesId: data.speciesId });
  });
}

  // Botones para abrir el calendario y escanear QR
btnScanQR.addEventListener('click', () => {
  startScan(async (text) => {
    try {
      const ref = doc(db, 'plants', text);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        window.location.href = `plant.html?id=${text}`;
      } else {
        alert('La planta no existe');
      }
    } catch (err) {
      console.error('Error verificando planta', err);
      alert('Error al verificar la planta');
    }
  });
});

scanEventBtn.addEventListener('click', () => {
  startScan(async (id) => {
    try {
      const ref = doc(db, 'plants', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        if (!selectedPlants.includes(id)) {
          selectedPlants.push(id);
          const div = document.createElement('div');
          div.className = 'selected-plant';
          div.dataset.id = id;
          div.textContent = snap.data().name;
          const removeBtn = document.createElement('button');
          removeBtn.textContent = '✖';
          removeBtn.className = 'remove-plant-btn';
          removeBtn.addEventListener('click', () => {
            const idx = selectedPlants.indexOf(id);
            if (idx !== -1) selectedPlants.splice(idx, 1);
            div.remove();
          });
          div.appendChild(removeBtn);
          selectedPlantsEl.appendChild(div);
        }
      } else {
        alert('La planta no existe');
      }
    } catch (err) {
      console.error('Error verificando planta', err);
      alert('Error al verificar la planta');
    }
  });
});

closeQrModal.addEventListener('click', () => {
  if (qrScanner) {
    qrScanner.stop().catch(err => console.error('Error al detener scanner', err));
  }
  qrModal.classList.add('hidden');
});


  // — Modal Calendario —
  let eventsData = [];

btnCalendar.addEventListener('click', async () => {
  // Verificar si plantsMap está vacío
  if (plantsMap.size === 0) {
    await cargarPlantas();
  }

  const nowOpen = new Date();
  selectedDate = new Date(nowOpen.getTime() - nowOpen.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
  selectedDayCell = null;
  eventDateInput.value = selectedDate;
  modalCalendar.classList.remove('hidden');

  try {
    const snapEv = await getDocs(collection(db, 'events'));
    eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCalendar();
    mostrarEventosPorDia(selectedDate);


    // Resetear lista de plantas seleccionadas
    selectedPlants.length = 0;
    selectedPlantsEl.innerHTML = '';
  

  } catch (err) {
    console.error('Error al guardar el evento:', err);
    alert('Error al guardar el evento.');
  }
});


// Abrir modal de agregar evento
document.getElementById('open-event-modal').addEventListener('click', () => {
  eventDateInput.value = selectedDate;
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
    document.getElementById('eventos-dia').innerHTML = '';
  });
// Guardar evento (solo una vez)

saveEventBtn.addEventListener('click', async () => {
  const date = eventDateInput.value;
  const type = eventTypeSelect.value;

  if (!date || !type || selectedPlants.length === 0) {
    alert('Completa todos los campos y agrega al menos una planta.');
    return;
  }

  try {
    for (const id of selectedPlants) {
      await addDoc(collection(db, 'events'), {
        date,
        type,
        plantId: id,
        createdAt: new Date()
      });
    }


    // Recargar eventos y calendario
    const snapEv = await getDocs(collection(db, 'events'));
    eventsData = snapEv.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCalendar();

    // Resetear formulario con la fecha local actual
    const nowForm = new Date();
    eventDateInput.value = new Date(nowForm.getTime() - nowForm.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
    eventTypeSelect.value = 'Riego';

    // Cerrar modal
    document.getElementById('add-event-modal').classList.add('hidden');

    // Limpiar plantas seleccionadas
    selectedPlants.length = 0;
    selectedPlantsEl.innerHTML = '';
  
} catch (err) {
  console.error('Error al guardar los eventos:', err);
  alert('Error al guardar los eventos.');
}

});

  // 🔽 Aquí empieza la función fuera del addEventListener
  function renderCalendar() {
  calendarContainer.innerHTML = '';
  document.getElementById('eventos-dia').innerHTML = '';

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
    }
    if (dayStr === selectedDate) {
      td.classList.add('selected-day');
      selectedDayCell = td;
    }
    td.addEventListener('click', () => {
      if (selectedDayCell) selectedDayCell.classList.remove('selected-day');
      td.classList.add('selected-day');
      selectedDayCell = td;
      selectedDate = dayStr;
      eventDateInput.value = dayStr;
      mostrarEventosPorDia(dayStr);
    });

    tr.appendChild(td);
  }

  tbody.appendChild(tr);
  table.appendChild(tbody);
  calendarContainer.appendChild(table);
  mostrarEventosPorDia(selectedDate);
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

    // Obtener nombre de la planta y especie usando plantId
    const planta = plantsMap.get(ev.plantId);
    const nombrePlanta = planta ? planta.name : '(Planta no encontrada)';
    const nombreEspecie = planta
      ? speciesMap.get(planta.speciesId) || '(Especie no encontrada)'
      : '(Especie no encontrada)';

    const enlace = document.createElement('a');
    enlace.href = '#';
    enlace.textContent = `${nombreEspecie} - ${nombrePlanta}`;
    enlace.dataset.id = ev.plantId;
    enlace.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarCartaPlanta(enlace.dataset.id); // Aquí pasamos el ID para mostrar info
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

function mostrarCartaPlanta(id) {
  window.location.href = `plant.html?id=${id}`;
}



  // carga inicial
  cargarEspecies();
});



