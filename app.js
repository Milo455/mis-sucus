let data = JSON.parse(localStorage.getItem('misSucus')) || {};
const especiesList = document.getElementById('especiesList');
const eventosCalendario = document.getElementById('eventosCalendario');
const selectEspecie = document.getElementById('selectEspecie');
const calendarioVista = document.getElementById('calendarioVista');
const eventosPorVista = document.getElementById('eventosPorVista');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  renderEspecies();
  renderSelectorEspecie();
  renderEventos();
});

// Agregar especie
function agregarEspecie() {
  const especie = prompt('Nombre de la especie');
  if (especie && !data[especie]) {
    data[especie] = {
      cuidados: { luz: '', riego: '', humedad: '' },
      plantas: []
    };
    guardar();
    renderEspecies();
    renderSelectorEspecie();
  }
}

// Agregar planta
function agregarPlanta(especie) {
  const nombre = prompt('Nombre de la planta');
  const foto = prompt('URL de imagen miniatura');
  if (nombre) {
    const nueva = {
      nombre,
      foto,
      eventos: [],
      id: Date.now()
    };
    data[especie].plantas.push(nueva);
    guardar();
    renderEspecies();
    renderSelectorEspecie();
  }
}

// Eliminar especie o planta
function eliminarEspecie(especie) {
  if (confirm('¿Eliminar esta especie?')) {
    delete data[especie];
    guardar();
    renderEspecies();
    renderSelectorEspecie();
  }
}

function eliminarPlanta(especie, id) {
  data[especie].plantas = data[especie].plantas.filter(p => p.id !== id);
  guardar();
  renderEspecies();
  renderSelectorEspecie();
}

// Editar cuidados
function editarCuidados(especie) {
  const luz = prompt('Luz requerida', data[especie].cuidados.luz);
  const riego = prompt('Frecuencia de riego', data[especie].cuidados.riego);
  const humedad = prompt('Humedad ideal', data[especie].cuidados.humedad);
  data[especie].cuidados = { luz, riego, humedad };
  guardar();
  renderEspecies();
}

// Agregar evento
function agregarEvento() {
  const especie = selectEspecie.value;
  if (!especie) return alert('Selecciona una especie');
  const plantas = data[especie].plantas;
  const planta = prompt(`¿A cuál planta quieres agregarle el evento?\n${plantas.map(p => p.nombre).join(', ')}`);
  const tipo = prompt('Tipo de evento (riego, limpieza, transplante, reproducción...)');
  const fecha = prompt('Fecha del evento (YYYY-MM-DD)', new Date().toISOString().slice(0, 10));
  const detalle = prompt('Detalles del evento');

  const p = plantas.find(p => p.nombre === planta);
  if (p) {
    p.eventos.push({ tipo, fecha, detalle, id: Date.now() });
    guardar();
    renderEventos();
  }
}

// Editar evento
function editarEvento(especie, plantaId, eventoId) {
  const planta = data[especie].plantas.find(p => p.id === plantaId);
  const evento = planta.eventos.find(e => e.id === eventoId);
  const tipo = prompt('Editar tipo', evento.tipo);
  const fecha = prompt('Editar fecha', evento.fecha);
  const detalle = prompt('Editar detalle', evento.detalle);
  evento.tipo = tipo;
  evento.fecha = fecha;
  evento.detalle = detalle;
  guardar();
  renderEventos();
}

// Descargar QR
function descargarQR(nombre, especie) {
  const url = `${location.href}?especie=${encodeURIComponent(especie)}&planta=${encodeURIComponent(nombre)}`;
  const canvas = document.createElement('canvas');
  new QRCode(canvas, url);
  setTimeout(() => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = `${nombre}.png`;
    link.click();
  }, 1000);
}

// Guardar en localStorage
function guardar() {
  localStorage.setItem('misSucus', JSON.stringify(data));
}

// Render especie y plantas
function renderEspecies() {
  especiesList.innerHTML = '';
  Object.keys(data).forEach(especie => {
    const div = document.createElement('div');
    div.className = 'especie';
    div.innerHTML = `
      <h3>${especie}
        <button onclick="editarCuidados('${especie}')">📝</button>
        <button onclick="agregarPlanta('${especie}')">➕</button>
        <button onclick="eliminarEspecie('${especie}')">🗑️</button>
      </h3>
      <details><summary>Ver cuidados</summary>
        ☀️ Luz: ${data[especie].cuidados.luz || 'N/A'}<br>
        💧 Riego: ${data[especie].cuidados.riego || 'N/A'}<br>
        🌫️ Humedad: ${data[especie].cuidados.humedad || 'N/A'}
      </details>
    `;
    data[especie].plantas.forEach(p => {
      const item = document.createElement('div');
      item.className = 'planta';
      item.innerHTML = `
        ${p.foto ? `<img src="${p.foto}" width="40">` : ''}
        <b>${p.nombre}</b>
        <button onclick="eliminarPlanta('${especie}', ${p.id})">❌</button>
        <button onclick="descargarQR('${p.nombre}', '${especie}')">📎</button>
      `;
      div.appendChild(item);
    });
    especiesList.appendChild(div);
  });
}

// Render selector
function renderSelectorEspecie() {
  selectEspecie.innerHTML = `<option value="">--</option>`;
  Object.keys(data).forEach(e => {
    const option = document.createElement('option');
    option.value = e;
    option.textContent = e;
    selectEspecie.appendChild(option);
  });
}

// Render eventos
function renderEventos() {
  eventosPorVista.innerHTML = '';
  const vista = calendarioVista.value;
  const hoy = new Date().toISOString().slice(0, 10);
  Object.keys(data).forEach(especie => {
    data[especie].plantas.forEach(p => {
      p.eventos.forEach(e => {
        const mostrar =
          (vista === 'dia' && e.fecha === hoy) ||
          (vista === 'semana') || // Lógica de semana opcional
          (vista === 'mes') || vista === 'todo';

        if (mostrar) {
          const li = document.createElement('li');
          li.innerHTML = `
            <b>${p.nombre}</b> (${especie}): ${e.tipo} - ${e.fecha}
            <button onclick="editarEvento('${especie}', ${p.id}, ${e.id})">✏️</button>
          `;
          eventosPorVista.appendChild(li);
        }
      });
    });
  });
}
