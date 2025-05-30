import { db } from './firebase-init.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  const btnAgregarEspecie      = document.getElementById('btnAgregarEspecie');
  const modalAgregarEspecie    = document.getElementById('modalAgregarEspecie');
  const btnCerrarModalEspecie  = document.getElementById('btnCerrarModalEspecie');
  const btnGuardarEspecie      = document.getElementById('btnGuardarEspecie');
  const listaEspecies          = document.getElementById('listaEspecies');

  const btnCalendario          = document.getElementById('btnCalendario');
  const btnEscanearQR          = document.getElementById('btnEscanearQR');

  // Abre el modal de Agregar Especie
  btnAgregarEspecie.addEventListener('click', () => {
    modalAgregarEspecie.classList.remove('hidden');
  });

  // Cierra el modal de Agregar Especie
  btnCerrarModalEspecie.addEventListener('click', () => {
    modalAgregarEspecie.classList.add('hidden');
    limpiarModalEspecie();
  });

  // Guarda una nueva especie
  btnGuardarEspecie.addEventListener('click', async () => {
    const nombre = document.getElementById('inputNombreEspecie').value.trim();
    const info   = document.getElementById('inputInfoEspecie').value.trim();
    const fotoEl = document.getElementById('inputFotoEspecie');
    if (!nombre || !info || fotoEl.files.length === 0) {
      alert('Por favor completa todos los campos y selecciona una foto.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await addDoc(collection(db, 'species'), {
          name: nombre,
          info,
          photo: e.target.result,
          createdAt: new Date()
        });
        modalAgregarEspecie.classList.add('hidden');
        limpiarModalEspecie();
        cargarEspecies();
      } catch (err) {
        console.error('Error guardando especie:', err);
        alert('Error al guardar la especie.');
      }
    };
    reader.readAsDataURL(fotoEl.files[0]);
  });

  // Función para limpiar el modal
  function limpiarModalEspecie() {
    document.getElementById('inputNombreEspecie').value = '';
    document.getElementById('inputInfoEspecie').value = '';
    document.getElementById('inputFotoEspecie').value = '';
  }

  // Carga y muestra la lista de especies
  async function cargarEspecies() {
    listaEspecies.innerHTML = '';
    try {
      const q = query(collection(db, 'species'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        listaEspecies.innerHTML = '<li>No hay especies registradas.</li>';
        return;
      }
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        li.textContent = data.name;
        // aquí podrías añadir li.onclick = () => abrirDetalleEspecie(doc.id);
        listaEspecies.appendChild(li);
      });
    } catch (err) {
      console.error('Error cargando especies:', err);
      listaEspecies.innerHTML = '<li>Error al cargar especies.</li>';
    }
  }

  // Pruebas de los otros botones
  btnCalendario.addEventListener('click', () => {
    console.log('Clic en Calendario');
    // abrirCalendario();
  });
  btnEscanearQR.addEventListener('click', () => {
    console.log('Clic en Escanear QR');
    // iniciarEscaneoQR();
  });

  // Carga inicial de la lista
  cargarEspecies();
});
