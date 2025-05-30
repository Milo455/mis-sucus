/*** Firebase desde window ***/
const db = window.db;
const storage = window.storage;

/*** Estado ***/
let data = [];
let events = [];
let currentView = 'day';

/*** Utilidades ***/
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/*** Firestore ***/
async function loadData() {
  const snap = await db.collection('species').get();
  data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveEvent(ev) {
  await db.collection('events').doc(ev.id).set(ev);
}
async function deleteEvent(id) {
  await db.collection('events').doc(id).delete();
}

/*** Renderizado ***/
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
  const spec = data.find(s => s.id === specId);
  const ul = document.getElementById(`plants-${specId}`);
  ul.innerHTML = '';
  spec.plants.forEach(pl => {
    const li = document.createElement('li');
    li.className = 'plant-item';
    li.innerHTML = `
      <img src="${pl.photo || 'https://via.placeholder.com/40?text=🌵'}" onclick="openDetail('${specId}','${pl.id}')">
      <input value="${pl.name}" onchange="renamePlant('${specId}','${pl.id}',this.value)">
      <button onclick="openAddEvent('${specId}','${pl.id}')">🗓️</button>
      <button onclick="downloadQR('${pl.id}','${pl.name}')">📎</button>
      <button onclick="removePlant('${specId}','${pl.id}')">❌</button>
    `;
    ul.appendChild(li);
  });
}

/*** Funciones no mostradas: openDetail, openAddPlant, openAddEvent, savePlant, saveEvent, renamePlant, removeSpecies, removePlant, downloadQR, setView ***/

/*** Modales ***/
function showModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
document.querySelectorAll('.close').forEach(btn => {
  btn.onclick = () => closeModal(btn.dataset.close);
});

/*** Botones ***/
document.getElementById('btnAddSpecies').onclick = () => {
  document.getElementById('inputSpeciesName').value = '';
  document.getElementById('inputSpeciesCare').value = '';
  showModal('modalSpecies');
};
document.getElementById('saveSpecies').onclick = async () => {
  const name = document.getElementById('inputSpeciesName').value.trim();
  const care = document.getElementById('inputSpeciesCare').value.trim();
  if (!name) return alert('Nombre requerido');
  const id = generateId();
  const spec = { id, name, care, plants: [], thumbnail: '' };
  data.push(spec);
  await saveSpecies(spec);
  renderSpecies();
  closeModal('modalSpecies');
};

/*** Inicialización ***/
(async () => {
  await loadData();
  await loadEvents();
  renderSpecies();
})();
