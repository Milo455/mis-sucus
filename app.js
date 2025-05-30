/*** Inicialización Firebase ***/
const db = window.db;
const storage = window.storage;

/*** Variables de estado ***/
let data = [];         // lista de especies con sus plantas
let events = [];       // lista global de eventos
let currentView = 'day'; // calendario: day, week, month
let scanStream;

/*** Utilidades ***/
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
}

/*** Cargar/Guardar ***/
async function loadData() {
  // Lee Firestore: colección 'species'
  const snap = await db.collection('species').get();
  data = snap.docs.map(d=> ({ id:d.id, ...d.data() }) );
  renderSpecies();
}
async function saveSpecies(spec) {
  await db.collection('species').doc(spec.id).set(spec);
}
async function deleteSpecies(id) {
  await db.collection('species').doc(id).delete();
}
async function loadEvents() {
  const snap = await db.collection('events').get();
  events = snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
async function saveEvent(ev) {
  await db.collection('events').doc(ev.id).set(ev);
}
async function deleteEvent(id) {
  await db.collection('events').doc(id).delete();
}

/*** Renderizado principal ***/
function renderSpecies() {
  const container = document.getElementById('speciesContainer');
  container.innerHTML = '';
  data.forEach(spec => {
    const card = document.createElement('div');
    card.className = 'species-card';
    card.innerHTML = `
      <div class="species-header">
        <h2>${spec.thumbnail ? `<img src="${spec.thumbnail}">` : ''}${spec.name}</h2>
        <div>
          <button onclick="openDetail('${spec.id}')">ℹ️</button>
          <button onclick="openAddPlant('${spec.id}')">➕ Planta</button>
          <button onclick="removeSpecies('${spec.id}')">🗑️</button>
        </div>
      </div>
      <ul class="plant-list" id="plants-${spec.id}"></ul>
    `;
    container.appendChild(card);
    renderPlants(spec.id);
  });
}
function renderPlants(specId) {
  const spec = data.find(s=>s.id===specId);
  const ul = document.getElementById(`plants-${specId}`);
  ul.innerHTML = '';
  spec.plants.forEach(pl => {
    const li = document.createElement('li');
    li.className='plant-item';
    li.innerHTML = `
      <img src="${pl.photo||'https://via.placeholder.com/40?text=🌵'}" onclick="openDetail('${specId}','${pl.id}')">
      <input value="${pl.name}" onchange="renamePlant('${specId}','${pl.id}',this.value)">
      <button onclick="openAddEvent('${specId}','${pl.id}')">🗓️</button>
      <button onclick="downloadQR('${pl.id}','${pl.name}')">📎</button>
      <button onclick="removePlant('${specId}','${pl.id}')">❌</button>
    `;
    ul.appendChild(li);
  });
}

/*** Modales ***/
function showModal(id) { document.getElementById(id).style.display='flex'; }
function closeModal(id) { document.getElementById(id).style.display='none'; }
document.querySelectorAll('.close').forEach(btn=>{
  btn.onclick=()=> closeModal(btn.dataset.close);
});

/*** Botones principales ***/
document.getElementById('btnAddSpecies').onclick = () => {
  document.getElementById('inputSpeciesName').value='';
  document.getElementById('inputSpeciesCare').value='';
  showModal('modalSpecies');
};
document.getElementById('saveSpecies').onclick = async () => {
  const name = document.getElementById('inputSpeciesName').value.trim();
  const care = document.getElementById('inputSpeciesCare').value.trim();
  if (!name) return alert('Nombre requerido');
  const id = generateId();
  const spec = { id, name, care, plants: [], thumbnail:'' };
  data.push(spec);
  await saveSpecies(spec);
  renderSpecies();
  closeModal('modalSpecies');
};

/*** Abrir modal añadir planta ***/
function openAddPlant(specId) {
  const modal = document.getElementById('modalPlant');
  modal.dataset.specId = specId;
  document.getElementById('inputPlantName').value = '';
  document.getElementById('inputPlantPhoto').value = '';
  showModal('modalPlant');
}
document.getElementById('savePlant').onclick = async () => {
  const specId = document.getElementById('modalPlant').dataset.specId;
  const name = document.getElementById('inputPlantName').value.trim();
  const fileInput = document.getElementById('inputPlantPhoto');
  if (!name) return alert('Nombre planta requerido');
  const spec = data.find(s=>s.id===specId);
  if (!spec.plants) spec.plants = [];
  const id = generateId();

  let photoUrl = '';
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const ref = storage.ref().child(`plants/${id}`);
    await ref.put(file);
    photoUrl = await ref.getDownloadURL();
  }

  const plant = { id, name, photo: photoUrl };
  spec.plants.push(plant);
  await saveSpecies(spec);
  renderSpecies();
  closeModal('modalPlant');
};

/*** Renombrar planta ***/
function renamePlant(specId, plantId, newName) {
  const spec = data.find(s=>s.id===specId);
  if (!spec) return;
  const plant = spec.plants.find(p=>p.id===plantId);
  if (!plant) return;
  plant.name = newName;
  saveSpecies(spec);
}

/*** Eliminar especie ***/
async function removeSpecies(specId) {
  if (!confirm('¿Eliminar esta especie y todas sus plantas?')) return;
  data = data.filter(s=>s.id !== specId);
  await deleteSpecies(specId);
  renderSpecies();
}

/*** Eliminar planta ***/
async function removePlant(specId, plantId) {
  if (!confirm('¿Eliminar esta planta?')) return;
  const spec = data.find(s=>s.id===specId);
  spec.plants = spec.plants.filter(p=>p.id!==plantId);
  await saveSpecies(spec);
  renderSpecies();
}

/*** Abrir detalle ***/
async function openDetail(specId, plantId = null) {
  const modal = document.getElementById('modalDetail');
  const spec = data.find(s=>s.id === specId);
  if (!spec) return alert('Especie no encontrada');

  let title = spec.name;
  let care = spec.care;
  let photo = '';
  let relatedEvents = [];

  if (plantId) {
    const plant = spec.plants.find(p=>p.id === plantId);
    if (!plant) return alert('Planta no encontrada');
    title = plant.name;
    photo = plant.photo || '';
    // Filtrar eventos relacionados a esta planta
    relatedEvents = events.filter(e => e.specId === specId && e.plantId === plantId);
  } else {
    // Eventos relacionados a la especie
    relatedEvents = events.filter(e => e.specId === specId && !e.plantId);
  }

  document.getElementById('detailTitle').textContent = title;
  document.getElementById('detailCare').textContent = care;
  const detailPhoto = document.getElementById('detailPhoto');
  if(photo) {
    detailPhoto.src = photo;
    detailPhoto.style.display = 'block';
  } else {
    detailPhoto.style.display = 'none';
  }

  const detailEvents = document.getElementById('detailEvents');
  detailEvents.innerHTML = '<h4>Eventos:</h4>';
  if(relatedEvents.length === 0){
    detailEvents.innerHTML += '<p>No hay eventos registrados.</p>';
  } else {
    const ul = document.createElement('ul');
    relatedEvents.forEach(ev=>{
      const li = document.createElement('li');
      li.textContent = `${ev.date} - ${ev.description}`;
      ul.appendChild(li);
    });
    detailEvents.appendChild(ul);
  }

  showModal('modalDetail');
}

/*** Abrir modal añadir evento ***/
function openAddEvent(specId, plantId=null) {
  const modal = document.getElementById('modalEvent');
  modal.dataset.specId = specId;
  modal.dataset.plantId = plantId || '';
  document.getElementById('inputEventDate').value = '';
  document.getElementById('inputEventDescription').value = '';
  showModal('modalEvent');
}
document.getElementById('saveEvent').onclick = async () => {
  const modal = document.getElementById('modalEvent');
  const specId = modal.dataset.specId;
  const plantId = modal.dataset.plantId || null;
  const date = document.getElementById('inputEventDate').value;
  const description = document.getElementById('inputEventDescription').value.trim();
  if(!date || !description) return alert('Fecha y descripción son obligatorias');

  const id = generateId();
  const ev = { id, specId, plantId, date, description };
  events.push(ev);
  await saveEvent(ev);
  closeModal('modalEvent');
};

/*** Calendario ***/
document.getElementById('btnCalendar').onclick = () => {
  showModal('modalCalendar');
  renderCalendar(currentView);
};

document.getElementById('viewDay').onclick = () => {
  currentView = 'day';
  renderCalendar(currentView);
};
document.getElementById('viewWeek').onclick = () => {
  currentView = 'week';
  renderCalendar(currentView);
};
document.getElementById('viewMonth').onclick = () => {
  currentView = 'month';
  renderCalendar(currentView);
};

function renderCalendar(view) {
  const container = document.getElementById('calendarContent');
  container.innerHTML = '';
  let filteredEvents = [...events];
  // Filtrar eventos según vista
  const today = new Date();
  if(view === 'day'){
    filteredEvents = filteredEvents.filter(ev=>ev.date === today.toISOString().slice(0,10));
  } else if(view === 'week'){
    // Evento dentro de esta semana
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate()+6);
    filteredEvents = filteredEvents.filter(ev=>{
      const evDate = new Date(ev.date);
      return evDate >= startOfWeek && evDate <= endOfWeek;
    });
  } else if(view === 'month'){
    filteredEvents = filteredEvents.filter(ev=>{
      const evDate = new Date(ev.date);
      return evDate.getMonth() === today.getMonth() && evDate.getFullYear() === today.getFullYear();
    });
  }
  if(filteredEvents.length === 0){
    container.innerHTML = '<p>No hay eventos para esta vista.</p>';
    return;
  }
  const ul = document.createElement('ul');
  filteredEvents.forEach(ev=>{
    const li = document.createElement('li');
    li.textContent = `${ev.date} - ${ev.description}`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

/*** QR Code ***/
document.getElementById('btnScanQR').onclick = () => {
  showModal('modalScanQR');
  startQRScan();
};

function startQRScan() {
  const video = document.getElementById('video');
  const scanResult = document.getElementById('scanResult');

  if (scanStream) {
    scanStream.getTracks().forEach(track => track.stop());
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      scanStream = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      requestAnimationFrame(tick);
    }).catch(err => {
      scanResult.textContent = "Error al acceder a la cámara: " + err.message;
    });

  function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
      if (code) {
        scanResult.textContent = `Código leído: ${code.data}`;
        stopQRScan();
        openPlantByQRCode(code.data);
        return;
      } else {
        scanResult.textContent = "Escaneando...";
      }
    }
    requestAnimationFrame(tick);
  }
}

function stopQRScan() {
  if (scanStream) {
    scanStream.getTracks().forEach(track => track.stop());
    scanStream = null;
  }
  closeModal('modalScanQR');
}

async function openPlantByQRCode(qrData) {
  // Asumiendo que qrData tiene id de planta
  for(const spec of data){
    if(!spec.plants) continue;
    const plant = spec.plants.find(p=>p.id === qrData);
    if(plant){
      openDetail(spec.id, plant.id);
      return;
    }
  }
  alert('Planta no encontrada para el código QR escaneado.');
}

/*** Inicialización ***/
async function init() {
  await loadData();
  await loadEvents();
}

init();
