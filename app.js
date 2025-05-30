// Inicializar Firebase
const db = firebase.firestore();
const storage = firebase.storage();

const listaPlantas = document.getElementById('lista-plantas');
const listaEventos = document.getElementById('lista-eventos');

const btnAgregarPlanta = document.getElementById('btn-agregar-planta');
const btnAgregarEvento = document.getElementById('btn-agregar-evento');
const btnSubirFoto = document.getElementById('btn-subir-foto');
const inputFoto = document.getElementById('input-foto');

const modalDetalle = document.getElementById('modal-detalle');
const cerrarModal = document.getElementById('cerrar-modal');
const modalNombrePlanta = document.getElementById('modal-nombre-planta');
const modalCuidados = document.getElementById('modal-cuidados');
const modalFoto = document.getElementById('modal-foto');
const modalListaEventos = document.getElementById('modal-lista-eventos');

let plantas = [];
let eventos = [];
let plantaSeleccionadaParaFoto = null;
let plantaSeleccionadaDetalle = null;

// Función para mostrar lista de plantas
function mostrarPlantas() {
  listaPlantas.innerHTML = '';
  plantas.forEach(planta => {
    const li = document.createElement('li');
    li.setAttribute('data-id', planta.id);

    // Miniatura
    const img = document.createElement('img');
    img.src = planta.fotoURL || 'https://via.placeholder.com/40?text=🌵';
    img.alt = planta.nombre;
    img.title = "Ver detalles";
    img.onclick = () => abrirModalDetalle(planta.id);

    // Nombre editable
    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.value = planta.nombre;
    inputNombre.style.flexGrow = '1';
    inputNombre.onchange = (e) => {
      actualizarNombrePlanta(planta.id, e.target.value);
    };

    // Botón eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => eliminarPlanta(planta.id);

    li.appendChild(img);
    li.appendChild(inputNombre);
    li.appendChild(btnEliminar);

    listaPlantas.appendChild(li);
  });
}

// Función para mostrar eventos
function mostrarEventos() {
  listaEventos.innerHTML = '';
  eventos.forEach(evento => {
    const li = document.createElement('li');
    li.textContent = `${evento.tipo} - ${new Date(evento.fecha).toLocaleDateString()} (Planta: ${evento.plantaNombre})`;

    // Botón editar evento (opcional, puedes extenderlo)
    // Botón eliminar evento (opcional)

    listaEventos.appendChild(li);
  });
}

// Cargar plantas y eventos desde Firestore
function cargarDatos() {
  db.collection('plantas').onSnapshot(snapshot => {
    plantas = [];
    snapshot.forEach(doc => {
      plantas.push({ id: doc.id, ...doc.data() });
    });
    mostrarPlantas();
  });

  db.collection('eventos').onSnapshot(snapshot => {
    eventos = [];
    snapshot.forEach(doc => {
      eventos.push({ id: doc.id, ...doc.data() });
    });
    mostrarEventos();
  });
}

// Actualizar nombre planta
function actualizarNombrePlanta(id, nuevoNombre) {
  db.collection('plantas').doc(id).update({ nombre: nuevoNombre });
}

// Eliminar planta y sus eventos asociados
async function eliminarPlanta(id) {
  if (!confirm('¿Seguro que quieres eliminar esta planta
