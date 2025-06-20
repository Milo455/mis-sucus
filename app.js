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
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


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
  const qrModal          = document.getElementById('qr-modal');
  const closeQrModal     = document.getElementById('close-qr-modal');
  let qrScanner;

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
    !qrModal || !closeQrModal ||
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

  // — Carga lista de Especies —
 async function cargarEspecies() {
  speciesList.innerHTML = '';
  speciesMap.clear();
  const q = query(collection(db, 'species'), orderBy('name', 'asc'));
  try {
    const snap = await getDocs(q);
    if (snap.empty) {
      speciesList.innerHTML = '<li>No hay especies registradas.</li>';
      return;
    }
  snap.forEach(doc => {
  const data = doc.data();
  speciesMap.set(doc.id, data.name);

  const card = document.createElement('div');
  card.className = 'species-card';
  card.innerHTML = `
    <img src="${data.photo}" alt="${data.name}">
    <div class="species-card-name">${data.name}</div>
  `;
  card.addEventListener('click', () => {
    window.location.href = `species.html?id=${doc.id}`;
  });

  speciesList.appendChild(card);
});

    document.querySelectorAll('.delete-species-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-id');
    if (confirm('¿Seguro que quieres eliminar esta especie?')) {
      try {
        await deleteDoc(doc(db, 'species', id));
        cargarEspecies(); // Recarga la lista de especies después de eliminar
      } catch (err) {
        console.error('Error al eliminar especie:', err);
        alert('No se pudo eliminar la especie.');
      }
    }
  });
});

  } catch (err) {
    console.error('Error cargando especies:', err);
  speciesList.innerHTML = '<li>Error al cargar especies.</li>';
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
  btnScanQR.addEventListener('click', async () => {
    qrModal.classList.remove('hidden');
    if (!qrScanner) {
      qrScanner = new Html5Qrcode('qr-reader');
    }
    try {
      let cameraParam = { facingMode: 'environment' };
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const back = cameras.find(cam =>
          /back|rear|environment/i.test(cam.label)
        );
        cameraParam = back ? back.id : cameras[0].id;
      }
      await qrScanner.start(
        cameraParam,
        {
          fps: 30,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.7778,
          rememberLastUsedCamera: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            advanced: [{ focusMode: 'continuous' }]
          }
        },
        async (text) => {
          try {
            const ref = doc(db, 'plants', text);
            const snap = await getDoc(ref);
            await qrScanner.stop();
            qrModal.classList.add('hidden');
            if (snap.exists()) {
              window.location.href = `plant.html?id=${text}`;
            } else {
              alert('La planta no existe');
            }
          } catch (err) {
            console.error('Error verificando planta', err);
            alert('Error al verificar la planta');
          }
        },
          () => {}
      );
    } catch (err) {
      console.error('Error iniciando scanner', err);
    }
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


    // Poblar selector de plantas en el formulario de eventos
const checkboxContainer = document.getElementById('plant-checkboxes');
checkboxContainer.innerHTML = ''; // Limpiar antes

  const grouped = {};
  plantsMap.forEach((data, id) => {
    if (!grouped[data.speciesId]) grouped[data.speciesId] = [];
    grouped[data.speciesId].push({ id, name: data.name });
  });

  Object.keys(grouped).forEach(specId => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'species-group';
    const title = document.createElement('div');
    title.className = 'species-group-title';
    title.textContent = speciesMap.get(specId) || 'Especie';
    groupDiv.appendChild(title);
    grouped[specId].forEach(p => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = p.id;
      checkbox.name = 'plant-checkbox';
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + p.name));
      groupDiv.appendChild(label);
    });
    checkboxContainer.appendChild(groupDiv);
  });


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


  // Resetear formulario con la fecha local actual
  const nowForm = new Date();
  eventDateInput.value = new Date(nowForm.getTime() - nowForm.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
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



