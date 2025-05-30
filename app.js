// Acceso a Firestore y Storage desde Firebase
const db = window.db;
const storage = window.storage;

console.log("App.js cargado");

// Recuperar las plantas desde localStorage o inicializar un objeto vacío
let plantas = JSON.parse(localStorage.getItem('plantas') || '{}');

// Función para mostrar la lista de plantas en el DOM
function mostrarListaPlantas() {
  const cont = document.getElementById('listaPlantas');
  cont.innerHTML = '';

  if (Object.keys(plantas).length === 0) {
    cont.textContent = 'No tienes plantas registradas.';
    return;
  }

  for (const especie in plantas) {
    const div = document.createElement('div');
    div.textContent = `${especie} (${plantas[especie].length || 0} plantas)`;
    cont.appendChild(div);
  }
}

// Función para subir una foto asociada a una planta
async function subirFotoPlanta() {
  const nombresPlantas = Object.keys(plantas);
  if (nombresPlantas.length === 0) {
    alert("No tienes plantas para subir fotos.");
    return;
  }

  let seleccion = prompt("Elige una planta para subir la foto:\n" + nombresPlantas.map((p, i) => `${i + 1}. ${p}`).join('\n'));
  if (!seleccion) return;

  let index = parseInt(seleccion) - 1;
  if (index < 0 || index >= nombresPlantas.length) {
    alert("Selección inválida");
    return;
  }
  let plantaSeleccionada = nombresPlantas[index];

  const inputFile = document.createElement('input');
  inputFile.type = 'file';
  inputFile.accept = 'image/*';
  inputFile.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    alert(`Foto seleccionada para la planta: ${plantaSeleccionada}`);

    // Guardar la foto en localStorage (simulación)
    if (!plantas[plantaSeleccionada].fotos) plantas[plantaSeleccionada].fotos = [];
    plantas[plantaSeleccionada].fotos.push(URL.createObjectURL(file));

    localStorage.setItem('plantas', JSON.stringify(plantas));
    alert("Foto guardada localmente (no subida).");

    mostrarListaPlantas();
  };
  inputFile.click();
}

// Asociar eventos a los botones
document.getElementById('btnSubirFoto').addEventListener('click', subirFotoPlanta);

document.getElementById('btnAgregarEspecie').addEventListener('click', () => {
  let nombre = prompt("Nombre de la nueva especie:");
  if (!nombre) return alert("Nombre inválido");
  if (!plantas[nombre]) plantas[nombre] = [];
  else return alert("La especie ya existe");
  localStorage.setItem('plantas', JSON.stringify(plantas));
  mostrarListaPlantas();
});

document.getElementById('btnMostrarCalendario').addEventListener('click', () => {
  alert("Aquí debería ir la vista del calendario");
});

// Mostrar la lista de plantas al cargar la aplicación
mostrarListaPlantas();
