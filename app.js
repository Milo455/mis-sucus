// Datos de ejemplo para empezar (se puede cargar desde localStorage)
let especies = JSON.parse(localStorage.getItem('especies')) || [
  {
    id: 'especie1',
    nombre: 'Echeveria',
    cuidados: 'Luz media, riego cada 7 días, humedad baja',
    miniatura: '', // URL o base64 de la imagen
    plantas: [
      { id: 'planta1', nombre: 'Mi Echeveria 1' },
      { id: 'planta2', nombre: 'Echeveria sucu' },
    ]
  },
  {
    id: 'especie2',
    nombre: 'Sedum',
    cuidados: 'Luz alta, riego cada 5 días, humedad media',
    miniatura: '',
    plantas: [
      { id: 'planta3', nombre: 'Sedum rosa' }
    ]
  }
];

let eventos = JSON.parse(localStorage.getItem('eventos')) || [];

// Referencias a elementos DOM
const listaEspecies = document.getElementById('listaEspecies');
const ventanaEspecie = document.getElementById('ventanaEspecie');
const tituloEspecie = document.getElementById('tituloEspecie');
const detallesEspecie = document.getElementById('detallesEspecie');
const cerrarVentanaEspecie = document.getElementById('cerrarVentanaEspecie');

const btnAgregarEvento = document.getElementById('btnAgregarEvento');
const formAgregarEvento = document.getElementById('formAgregarEvento');
const selectPlanta = document.getElementById('selectPlanta');
const formEvento = document.getElementById('formEvento');
const tipoEventoInput = document.getElementById('tipoEvento');
const fechaEventoInput = document.getElementById('fechaEvento');

function guardarDatos() {
  localStorage.setItem('especies', JSON.stringify(especies));
  localStorage.setItem('eventos', JSON.stringify(eventos));
}

function renderLista() {
  listaEspecies.innerHTML = '';

  especies.forEach(especie => {
    const liEspecie = document.createElement('li');

    // Header especie con miniatura, nombre y botón eliminar
    const header = document.createElement('div');
    header.className = 'especie-header';

    const nombreEspecie = document.createElement('div');
    nombreEspecie.className = 'nombre-especie';

    if (especie.miniatura) {
      const imgMini = document.createElement('img');
      imgMini.src = especie.miniatura;
      imgMini.className = 'miniatura';
      nombreEspecie.appendChild(imgMini);
    }

    const spanNombre = document.createElement('span');
    spanNombre.textContent = especie.nombre;
    spanNombre.style.cursor = 'pointer';
    spanNombre.onclick = () => {
      mostrarDetallesEspecie(especie);
    };
    nombreEspecie.appendChild(spanNombre);

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar especie';
    btnEliminar.className = 'btnEliminarEspecie';
    btnEliminar.onclick = () => {
      if (confirm(`Eliminar toda la especie "${especie.nombre}"? Esta acción no se puede deshacer.`)) {
        especies = especies.filter(e => e.id !== especie.id);
        guardarDatos();
        renderLista();
        actualizarSelectPlantas();
      }
    };

    header.appendChild(nombreEspecie);
    header.appendChild(btnEliminar);
    liEspecie.appendChild(header);

    // Lista plantas (inicialmente oculta)
    const ulPlantas = document.createElement('ul');
    ulPlantas.className = 'listaPlantas';
    ulPlantas.style.display = 'none';

    especie.plantas.forEach(planta => {
      const liPlanta = document.createElement('li');

      // Nombre editable de planta
      const inputNombre = document.createElement('input');
      inputNombre.type = 'text';
      inputNombre.value = planta.nombre;
      inputNombre.className = 'inputNombrePlanta';
      inputNombre.onchange = () => {
        planta.nombre = inputNombre.value.trim() || planta.nombre;
        guardarDatos();
        actualizarSelectPlantas();
      };

      liPlanta.appendChild(inputNombre);

      // Botón para eliminar planta individual
      const btnEliminarPlanta = document.createElement('button');
      btnEliminarPlanta.textContent = 'Eliminar';
      btnEliminarPlanta.onclick = () => {
        if (confirm(`Eliminar planta "${planta.nombre}"?`)) {
          especie.plantas = especie.plantas.filter(p => p.id !== planta.id);
          guardarDatos();
          renderLista();
          actualizarSelectPlantas();
        }
      };
      liPlanta.appendChild(btnEliminarPlanta);

      ulPlantas.appendChild(liPlanta);
    });

    liEspecie.appendChild(ulPlantas);

    // Click en header para mostrar/ocultar plantas
    header.onclick = (e) => {
      // Evitar que el click en el botón eliminar afecte el toggle
      if(e.target.tagName.toLowerCase() === 'button') return;

      if (ulPlantas.style.display === 'none') {
        ulPlantas.style.display = 'block';
      } else {
        ulPlantas.style.display = 'none';
      }
    };

    listaEspecies.appendChild(liEspecie);
  });
}

// Mostrar ventana emergente con detalles de cuidados
function mostrarDetallesEspecie(especie) {
  tituloEspecie.textContent = especie.nombre;
  detallesEspecie.textContent = especie.cuidados;
  ventanaEspecie.style.display = 'block';
}

// Cerrar ventana emergente
cerrarVentanaEspecie.onclick = () => {
  ventanaEspecie.style.display = 'none';
};

// Actualizar el select con plantas disponibles para agregar evento
function actualizarSelectPlantas() {
  selectPlanta.innerHTML = '';
  especies.forEach(especie => {
    especie.plantas.forEach(planta => {
      const option = document.createElement('option');
      option.value = planta.id;
      option.textContent = `${especie.nombre} - ${planta.nombre}`;
      selectPlanta.appendChild(option);
    });
  });
}

// Mostrar / ocultar formulario agregar evento
btnAgregarEvento.onclick = () => {
  if (formAgregarEvento.style.display === 'none') {
    actualizarSelectPlantas();
    formAgregarEvento.style.display = 'block';
  } else {
    formAgregarEvento.style.display = 'none';
  }
};

// Guardar evento desde el formulario
formEvento.onsubmit = (e) => {
  e.preventDefault();
  const plantaId = selectPlanta.value;
  const tipoEvento = tipoEventoInput.value.trim();
  const fechaEvento = fechaEventoInput.value;

  if (!plantaId || !tipoEvento || !fechaEvento) {
    alert('Por favor completa todos los campos');
    return;
  }

  eventos.push({
    id: Date.now().toString(),
    plantaId,
    tipoEvento,
    fechaEvento
  });

  guardarDatos();

  alert('Evento guardado');
  formEvento.reset();
  formAgregarEvento.style.display = 'none';
};

// Inicializar app
renderLista();
actualizarSelectPlantas();

