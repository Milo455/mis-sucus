// Inicializar Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBFpO3mzD94Wa_oCywdzHUaWJONtHugTuE",
  authDomain: "mis-sucus.firebaseapp.com",
  projectId: "mis-sucus",
  storageBucket: "mis-sucus.firebasestorage.app",
  messagingSenderId: "535386004336",
  appId: "1:535386004336:web:4701b88dc0ed7f75164db5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Variables globales para UI
let plantas = [];
let eventos = [];

// Cargar plantas al iniciar la app
window.onload = () => {
  cargarPlantas().then(() => {
    mostrarPlantas();
    cargarEventos().then(() => {
      mostrarEventos();
    });
  });
};

// Funciones Firestore

async function guardarPlanta(planta) {
  try {
    await db.collection('plantas').doc(planta.id).set(planta);
    console.log('Planta guardada:', planta.id);
  } catch (error) {
    console.error('Error guardando planta:', error);
  }
}

async function cargarPlantas() {
  plantas = [];
  try {
    const snapshot = await db.collection('plantas').get();
    snapshot.forEach(doc => plantas.push(doc.data()));
  } catch (error) {
    console.error('Error cargando plantas:', error);
  }
}

async function guardarEvento(evento) {
  try {
    await db.collection('eventos').doc(evento.id).set(evento);
    console.log('Evento guardado:', evento.id);
  } catch (error) {
    console.error('Error guardando evento:', error);
  }
}

async function cargarEventos() {
  eventos = [];
  try {
    const snapshot = await db.collection('eventos').get();
    snapshot.forEach(doc => eventos.push(doc.data()));
  } catch (error) {
    console.error('Error cargando eventos:', error);
  }
}

async function subirFoto(file, plantaId) {
  try {
    const storageRef = storage.ref();
    const fotoRef = storageRef.child(`plantas/${plantaId}/${file.name}`);
    await fotoRef.put(file);
    const url = await fotoRef.getDownloadURL();
    console.log('Foto subida:', url);
    return url;
  } catch (error) {
    console.error('Error subiendo foto:', error);
  }
}

async function agregarFotoAPlanta(plantaId, urlFoto) {
  try {
    await db.collection('plantas').doc(plantaId).update({
      fotoURL: urlFoto
    });
    console.log('Foto URL agregada a planta:', plantaId);
  } catch (error) {
    console.error('Error agregando foto a planta:', error);
  }
}

// --- Funciones UI ---

function mostrarPlantas() {
  const lista = document.getElementById('lista-plantas');
  lista.innerHTML = '';
  plantas.forEach(planta => {
    const li = document.createElement('li');
    li.textContent = planta.nombrePersonal || planta.id;
    if (planta.fotoURL) {
      const img = document.createElement('img');
      img.src = planta.fotoURL;
      img.alt = planta.nombrePersonal || 'Foto planta';
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.marginRight = '8px';
      li.prepend(img);
    }
    lista.appendChild(li);
  });
}

function mostrarEventos() {
  const lista = document.getElementById('lista-eventos');
  lista.innerHTML = '';
  eventos.forEach(evento => {
    const li = document.createElement('li');
    li.textContent = `${evento.tipo} - ${evento.fecha} - ${evento.plantaId}`;
    lista.appendChild(li);
  });
}

// Agregar nueva planta (ejemplo simple, deberías conectar con tu UI real)
async function agregarNuevaPlanta() {
  const id = prompt('ID única para la planta:');
  if (!id) return alert('ID inválido');

  const nombrePersonal = prompt('Nombre personalizado de la planta:');
  const especie = prompt('Especie:');
  const planta = {
    id,
    nombrePersonal,
    especie,
    fotoURL: '',
    cuidados: {},
  };

  await guardarPlanta(planta);
  plantas.push(planta);
  mostrarPlantas();
}

// Subir foto y asociar a planta (ejemplo para input file)
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return alert('No seleccionaste un archivo');

  const plantaId = prompt('ID de la planta para asociar la foto:');
  if (!plantaId) return alert('ID inválido');

  const urlFoto = await subirFoto(file, plantaId);
  if (urlFoto) {
    await agregarFotoAPlanta(plantaId, urlFoto);
    // Actualizar UI
    await cargarPlantas();
    mostrarPlantas();
  }
}

// Ejemplo para conectar botones UI
document.getElementById('btn-agregar-planta').addEventListener('click', agregarNuevaPlanta);
document.getElementById('input-foto').addEventListener('change', handleFileUpload);

// Aquí añadir más funciones para manejar eventos, editar plantas, etc., con Firestore

