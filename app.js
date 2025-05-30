/*** Variables globales ***/
const db = window.db;
const storage = window.storage;
let speciesData = [];
let eventsData = [];

// IDs actuales
let currentSpeciesId = null;
let currentPlantId = null;

/*** Helpers ***/
function genId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
}

// Abre/cierra modales y vistas
function show(el) { el.style.display = 'flex'; }
function hide(el) { el.style.display = 'none'; }
function showView(id) {
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  document.getElementById(id).style.display = 'block';
  document.getElementById('main-view').style.display = id==='main-view'?'block':'none';
}

/*** Carga inicial de datos ***/
async function loadAll() {
  // Especies
  const snapS = await db.collection('species').get();
  speciesData = snapS.docs.map(d=>({id:d.id, ...d.data()}));
  // Eventos
  const snapE = await db.collection('events').get();
  eventsData = snapE.docs.map(d=>({id:d.id, ...d.data()}));
  renderSpeciesList();
}
loadAll();

/*** Renderiza lista alfabética de especies ***/
function renderSpeciesList(){
  const ul = document.getElementById('speciesList');
  ul.innerHTML = '';
  speciesData.sort((a,b)=>a.name.localeCompare(b.name))
    .forEach(spec=>{
      const li = document.createElement('li');
      li.textContent = spec.name;
      li.onclick = ()=>openSpeciesDetail(spec.id);
      ul.appendChild(li);
    });
}

/*** Abrir detalle especie ***/
async function openSpeciesDetail(id){
  currentSpeciesId = id;
  const spec = speciesData.find(s=>s.id===id);
  document.getElementById('speciesDetailName').textContent = spec.name;
  document.getElementById('speciesDetailCare').textContent = spec.care;
  document.getElementById('speciesPlantCount').textContent = (spec.plants||[]).length;
  if(spec.thumbnail) document.getElementById('speciesDetailThumb').src = spec.thumbnail;
  // lista de plantas
  const ul = document.getElementById('plantList');
  ul.innerHTML = '';
  (spec.plants||[]).forEach(p=>{
    const li = document.createElement('li');
    li.textContent = p.name;
    li.onclick = ()=>openPlantDetail(id,p.id);
    ul.appendChild(li);
  });
  showView('viewSpeciesDetail');
}

/*** Guardar especie ***/
document.getElementById('btnAddSpecies').onclick = ()=>{
  show(document.getElementById('modalSpecies'));
};
document.getElementById('saveSpecies').onclick = async ()=>{
  const name = document.getElementById('inputSpeciesName').value.trim();
  const care = document.getElementById('inputSpeciesCare').value.trim();
  const file = document.getElementById('inputSpeciesThumb').files[0];
  if(!name) return alert('Nombre es requerido');
  const id = genId();
  let thumbUrl = '';
  if(file){
    const ref = storage.ref(`thumbnails/${id}`);
    await ref.put(file);
    thumbUrl = await ref.getDownloadURL();
  }
  const spec = { id, name, care, thumbnail: thumbUrl, plants: [] };
  speciesData.push(spec);
  await db.collection('species').doc(id).set(spec);
  renderSpeciesList();
  hide(document.getElementById('modalSpecies'));
};

/*** Calendario general ***/
document.getElementById('btnCalendar').onclick = ()=>{
  show(document.getElementById('modalCalendar'));
  renderCalendar();
};
function renderCalendar(){
  const container = document.getElementById('calendarContainer');
  // Implementación con librería o tabla manual
  container.innerHTML = '<p>(Aquí iría el calendario mensual con días marcados)</p>';
}

/*** Escanear QR ***/
document.getElementById('btnScanQR').onclick = ()=>{
  show(document.getElementById('modalScanQR'));
  const html5Qrcode = new Html5Qrcode("qr-reader");
  html5Qrcode.start(
    { facingMode: "environment" },
    { fps: 10 },
    qrCodeMessage=>{
      html5Qrcode.stop();
      hide(document.getElementById('modalScanQR'));
      openPlantDetailByQr(qrCodeMessage);
    }
  );
};
function openPlantDetailByQr(qr){
  for(const spec of speciesData){
    const p = (spec.plants||[]).find(x=>x.id===qr);
    if(p) return openPlantDetail(spec.id,qr);
  }
  alert('Planta no encontrada');
}

/*** Agregar planta ***/
document.getElementById('btnAddPlant').onclick = ()=>{
  show(document.getElementById('modalPlant'));
};
document.getElementById('savePlant').onclick = async()=>{
  const name = document.getElementById('inputPlantName').value.trim();
  if(!name) return alert('Nombre planta requerido');
  const pid = genId();
  // agrego a datos
  const spec = speciesData.find(s=>s.id===currentSpeciesId);
  spec.plants.push({ id: pid, name, photos: [], events: [] });
  await db.collection('species').doc(currentSpeciesId).set(spec);
  openSpeciesDetail(currentSpeciesId);
  hide(document.getElementById('modalPlant'));
};

/*** Detalle planta ***/
async function openPlantDetail(specId, plantId){
  currentPlantId = plantId;
  const spec = speciesData.find(s=>s.id===specId);
  const plant = spec.plants.find(p=>p.id===plantId);
  document.getElementById('plantDetailName').textContent = plant.name;
  const lastPhoto = plant.photos.slice(-1)[0];
  if(lastPhoto) document.getElementById('plantDetailLastPhoto').src = lastPhoto.url;
  const lastWater = [...plant.events].reverse()
    .find(e=>e.type==='Riego');
  document.getElementById('plantDetailLastWater')
    .textContent = lastWater? lastWater.date:'Nunca';
  showView('viewPlantDetail');
}

/*** Botones detalle planta ***/
document.getElementById('btnAddEvent').onclick = ()=> show(document.getElementById('modalEvent'));
document.getElementById('saveEvent').onclick = async()=>{
  const type = document.getElementById('inputEventType').value;
  const date = document.getElementById('inputEventDate').value;
  const note = document.getElementById('inputEventNote').value;
  const spec = speciesData.find(s=>s.id===currentSpeciesId);
  const plant = spec.plants.find(p=>p.id===currentPlantId);
  const ev = { id: genId(), type, date, note };
  plant.events.push(ev);
  await db.collection('species').doc(currentSpeciesId).set(spec);
  hide(document.getElementById('modalEvent'));
  openPlantDetail(currentSpeciesId, currentPlantId);
};
document.getElementById('btnHistory').onclick = ()=>{
  const spec = speciesData.find(s=>s.id===currentSpeciesId);
  const plant = spec.plants.find(p=>p.id===currentPlantId);
  const html = plant.events.map(e=>`<p>${e.date}: ${e.type}</p>`).join('');
  document.getElementById('plantContent').innerHTML = `<h3>Historia</h3>${html}`;
};
document.getElementById('btnAlbum').onclick = ()=>{
  const spec = speciesData.find(s=>s.id===currentSpeciesId);
  const plant = spec.plants.find(p=>p.id===currentPlantId);
  const html = plant.photos.map(p=>`<img src="${p.url}" class="album-photo"/><p>${p.comment||''}</p>`).join('');
  document.getElementById('plantContent').innerHTML = `<h3>Álbum</h3>${html}`;
};

/*** Tomar foto ***/
document.getElementById('btnPhoto').onclick = ()=>{
  show(document.getElementById('modalPhoto'));
  navigator.mediaDevices.getUserMedia({ video:true })
    .then(stream=>{
      document.getElementById('videoPhoto').srcObject = stream;
    });
};
document.getElementById('takePhoto').onclick = ()=>{
  const video = document.getElementById('videoPhoto');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0);
  canvas.toBlob(async blob=>{
    const url = URL.createObjectURL(blob);
    const comment = prompt('Comentario (opcional):','');
    const spec = speciesData.find(s=>s.id===currentSpeciesId);
    const plant = spec.plants.find(p=>p.id===currentPlantId);
    plant.photos.push({ url, comment });
    await db.collection('species').doc(currentSpeciesId).set(spec);
    hide(document.getElementById('modalPhoto'));
    openPlantDetail(currentSpeciesId, currentPlantId);
  });
};

/*** Imprimir QR ***/
document.getElementById('btnPrintQR').onclick = ()=>{
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentPlantId}`;
  const w = window.open('');
  w.document.write(`<img src="${qrUrl}"><p>${document.getElementById('plantDetailName').textContent}</p>`);
};

/*** Eliminar ***/
document.getElementById('btnDeletePlant').onclick = async()=>{
  if(!confirm('Eliminar esta planta?')) return;
  const spec = speciesData.find(s=>s.id===currentSpeciesId);
  spec.plants = spec.plants.filter(p=>p.id!==currentPlantId);
  await db.collection('species').doc(currentSpeciesId).set(spec);
  openSpeciesDetail(currentSpeciesId);
};
document.getElementById('btnDeleteSpecies').onclick = async()=>{
  if(!confirm('Eliminar especie y todas sus plantas?')) return;
  await db.collection('species').doc(currentSpeciesId).delete();
  speciesData = speciesData.filter(s=>s.id!==currentSpeciesId);
  showView('main-view');
  renderSpeciesList();
};

/*** Navegación atrás ***/
document.getElementById('backToList').onclick = ()=> showView('main-view');
document.getElementById('backToSpecies').onclick = ()=> openSpeciesDetail(currentSpeciesId);
