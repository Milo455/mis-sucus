// Importamos Firestore y Storage desde el window (cargados en index)
const db = window.db;
const storage = window.storage;

console.log("App.js cargado");

// Variables simulando plantas (localStorage por ahora)
let plantas = JSON.parse(localStorage.getItem('plantas') || '{}');

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

async function subirFotoPlanta() {
  const nombresPlantas = Object.keys(plantas);
  if (nombresPlantas.length === 0) {
    alert("No tienes plantas para subir fotos.");
    return;
  }

  let seleccion = prompt("Elige una planta para subir la foto:\n" + nombresPlantas.map((p, i) => `${i+1}. ${p}`).join('\n'));
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

    // Aquí debería subir la foto a Firebase Storage (por ahora solo guardamos URL local)
    if (!plantas[plantaSeleccionada].fotos) plantas[plantaSeleccionada].fotos = [];
    plantas[plantaSeleccionada].fotos.push(URL.createObjectURL(file));

    localStorage.setItem('plantas', JSON.stringify(plantas));
    alert("Foto guardada localmente (no subida).");

    mostrarListaPlantas();
  };
  inputFile.click();
}

// Eventos botones

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

// Mostrar la lista al cargar la app
mostrarListaPlantas();
