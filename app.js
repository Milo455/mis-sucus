let especies = JSON.parse(localStorage.getItem("especies")) || [];
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

function guardarDatos() {
  localStorage.setItem("especies", JSON.stringify(especies));
  localStorage.setItem("eventos", JSON.stringify(eventos));
  renderizarLista();
  llenarSelectPlantas();
}

function mostrarFormularioEspecie() {
  document.getElementById("formulario-especie").classList.toggle("oculto");
}

function mostrarFormularioEvento() {
  llenarSelectPlantas();
  document.getElementById("formulario-evento").classList.toggle("oculto");
}

function mostrarCalendario() {
  document.getElementById("calendario").classList.toggle("oculto");
  renderizarCalendario("mes");
}

function agregarEspecie() {
  const nombre = document.getElementById("nombre-especie").value;
  const cuidados = document.getElementById("cuidados-especie").value;
  if (!nombre) return;

  especies.push({ nombre, cuidados, plantas: [] });
  guardarDatos();
  document.getElementById("nombre-especie").value = "";
  document.getElementById("cuidados-especie").value = "";
  mostrarFormularioEspecie();
}

function agregarPlanta(indexEspecie) {
  const nombre = prompt("Nombre personalizado de la planta:");
  if (!nombre) return;

  const nueva = {
    nombre,
    fecha: new Date().toISOString().split("T")[0],
    eventos: [],
    fotos: []
  };

  especies[indexEspecie].plantas.push(nueva);
  guardarDatos();
}

function eliminarPlanta(i, j) {
  if (confirm("¿Eliminar esta planta?")) {
    especies[i].plantas.splice(j, 1);
    guardarDatos();
  }
}

function eliminarEspecie(index) {
  if (confirm("¿Eliminar toda la especie?")) {
    especies.splice(index, 1);
    guardarDatos();
  }
}

function renderizarLista() {
  const contenedor = document.getElementById("lista-suculentas");
  contenedor.innerHTML = "";

  especies.forEach((especie, i) => {
    const div = document.createElement("div");
    div.className = "especie";

    const header = document.createElement("div");
    header.innerHTML = `
      <h3>${especie.nombre}</h3>
      <button onclick="eliminarEspecie(${i})">🗑️</button>
      <button onclick="toggleCuidados(${i})">ℹ️</button>
      <button onclick="agregarPlanta(${i})">➕ Planta</button>
    `;

    const cuidados = document.createElement("div");
    cuidados.className = "cuidados oculto";
    cuidados.innerHTML = `<p>${especie.cuidados}</p>`;

    const ul = document.createElement("ul");
    especie.plantas.forEach((planta, j) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${planta.nombre} - Plantada el ${planta.fecha}
        <button onclick="eliminarPlanta(${i},${j})">❌</button>
        <button onclick="generarQR('${especie.nombre}','${planta.nombre}')">📎 QR</button>
      `;
      ul.appendChild(li);
    });

    div.appendChild(header);
    div.appendChild(cuidados);
    div.appendChild(ul);
    contenedor.appendChild(div);
  });
}

function toggleCuidados(index) {
  const especie = document.querySelectorAll(".cuidados")[index];
  especie.classList.toggle("oculto");
}

function llenarSelectPlantas() {
  const select = document.getElementById("select-planta-evento");
  select.innerHTML = "";

  especies.forEach((especie, i) => {
    especie.plantas.forEach((planta, j) => {
      const option = document.createElement("option");
      option.value = `${i}-${j}`;
      option.textContent = `${especie.nombre} - ${planta.nombre}`;
      select.appendChild(option);
    });
  });
}

function guardarEvento() {
  const valor = document.getElementById("select-planta-evento").value;
  const [i, j] = valor.split("-").map(Number);
  const fecha = document.getElementById("fecha-evento").value;
  const descripcion = document.getElementById("descripcion-evento").value;

  if (!fecha || !descripcion) return;

  especies[i].plantas[j].eventos.push({ fecha, descripcion });
  eventos.push({ especie: especies[i].nombre, planta: especies[i].plantas[j].nombre, fecha, descripcion });

  guardarDatos();
  document.getElementById("formulario-evento").classList.add("oculto");
  document.getElementById("fecha-evento").value = "";
  document.getElementById("descripcion-evento").value = "";
}

function renderizarCalendario(vista = "mes") {
  const contenedor = document.getElementById("vista-calendario");
  contenedor.innerHTML = "";

  const eventosOrdenados = [...eventos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  eventosOrdenados.forEach(ev => {
    const div = document.createElement("div");
    div.className = "evento";
    div.innerHTML = `<strong>${ev.fecha}</strong> - ${ev.planta}: ${ev.descripcion}`;
    contenedor.appendChild(div);
  });
}

function cambiarVistaCalendario(vista) {
  renderizarCalendario(vista);
}

function generarQR(especie, planta) {
  const data = `Especie: ${especie}, Planta: ${planta}`;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `${planta}.png`;
  a.click();
}

// Iniciar
renderizarLista();
