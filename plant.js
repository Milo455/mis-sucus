import { db } from './firebase-init.js';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { generateQRCode } from './qr-generator.js'; // Asumiendo que tienes un módulo para generar QR

const params = new URLSearchParams(window.location.search);
const plantId = params.get('id');

const plantNameElem = document.getElementById('plant-name');
const lastPhotoElem = document.getElementById('last-photo');
const addEventBtn = document.getElementById('add-event-btn');
const addPhotoBtn = document.getElementById('add-photo-btn');
const showHistoryBtn = document.getElementById('show-history-btn');
const showAlbumBtn = document.getElementById('show-album-btn');
const deletePlantBtn = document.getElementById('delete-plant-btn');
const printQRBtn = document.getElementById('print-qr-btn');
const backBtn = document.getElementById('back-btn');

let plantData = null;
let eventsUnsub = null;
let photosUnsub = null;

async function loadPlant() {
  if (!plantId) {
    alert('ID de planta no encontrado');
    window.location.href = 'index.html';
    return;
  }
  
  const plantRef = doc(db, 'plants', plantId);
  const docSnap = await getDoc(plantRef);
  
  if (!docSnap.exists()) {
    alert('Planta no encontrada');
    window.location.href = 'index.html';
    return;
  }
  
  plantData = docSnap.data();
  plantNameElem.textContent = plantData.customName || plantData.speciesName || 'Planta sin nombre';
  
  // Mostrar última foto si existe
  const photosRef = collection(plantRef, 'photos');
  const q = query(photosRef, orderBy('timestamp', 'desc'), );
  const photosSnap = await getDocs(q);
  
  if (!photosSnap.empty) {
    const lastPhoto = photosSnap.docs[0].data();
    lastPhotoElem.src = lastPhoto.url;
    lastPhotoElem.alt = `Última foto de ${plantNameElem.textContent}`;
  } else {
    lastPhotoElem.alt = 'No hay fotos registradas';
  }

  // Escuchar eventos en tiempo real
  const eventsRef = collection(plantRef, 'events');
  const eventsQuery = query(eventsRef, orderBy('timestamp', 'desc'));
  eventsUnsub = onSnapshot(eventsQuery, (snapshot) => {
    // Aquí puedes actualizar la vista con eventos o lista si haces una
    console.log('Eventos actualizados:', snapshot.docs.map(d => d.data()));
  });

  // Escuchar fotos en tiempo real
  photosUnsub = onSnapshot(q, (snapshot) => {
    // Actualizar vista de álbum si lo implementas
    console.log('Fotos actualizadas:', snapshot.docs.map(d => d.data()));
  });
}

addEventBtn.addEventListener('click', () => {
  // Abrir modal para agregar evento (debes implementar modal)
  alert('Funcionalidad para agregar evento no implementada aún');
});

addPhotoBtn.addEventListener('click', () => {
  // Abrir cámara o selector para agregar foto (debes implementar)
  alert('Funcionalidad para agregar foto no implementada aún');
});

showHistoryBtn.addEventListener('click', () => {
  // Mostrar lista de eventos (puedes implementar modal o sección)
  alert('Funcionalidad para mostrar historial no implementada aún');
});

showAlbumBtn.addEventListener('click', () => {
  // Mostrar álbum de fotos
  alert('Funcionalidad para mostrar álbum no implementada aún');
});

deletePlantBtn.addEventListener('click', async () => {
  if (confirm(`¿Seguro que quieres eliminar la planta "${plantNameElem.textContent}"? Esta acción no se puede deshacer.`)) {
    await deleteDoc(doc(db, 'plants', plantId));
    alert('Planta eliminada');
    window.location.href = 'index.html';
  }
});

printQRBtn.addEventListener('click', () => {
  // Generar QR y mostrar para impresión
  generateQRCode(plantId, plantNameElem.textContent);
});

backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Carga inicial
loadPlant();
