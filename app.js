// app.js para Mis Sucus versión completa con QR y carga por URL

const baseUrl = "https://milo455.github.io/mis-sucus/";

let sucurs = JSON.parse(localStorage.getItem("misSucus")) || [];

// Utilidad para generar ID única (simplificada)
function generateId() {
  return "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

// Guardar en localStorage
function saveData() {
  localStorage.setItem("misSucus", JSON.stringify(sucurs));
}

// Cargar planta por ID desde URL (?planta=ID)
function getPlantaFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("planta");
}

// Mostrar lista de especies y plantas
function renderList() {
  const container = document.getElementById("lista-suculentas");
  container.innerHTML = "";

  if (sucurs.length === 0) {
    container.innerHTML = "<p>No tienes suculentas agregadas.</p>";
    return;
  }

  sucurs.forEach(especie => {
    const div = document.createElement("div");
    div.className = "especie";

    // Miniatura si existe
    const thumb = especie.thumbnail ? `<img src="${especie.thumbnail}" alt="${especie.nombre}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; margin-right:8px;">` : "";

    const h3 = document.createElement("h3");
    h3.innerHTML = thumb + especie.nombre;

    div.appendChild(h3);

    // Botón eliminar especie
    const btnDelEsp = document.createElement("button");
    btnDelEsp.textContent = "Eliminar especie";
    btnDelEsp.onclick = () => {
      if (confirm(`¿Eliminar toda la especie "${especie.nombre}" y todas sus plantas?`)) {
        sucurs = sucurs.filter(s => s.id !== especie.id);
        saveData();
        renderList();
      }
    };
    div.appendChild(btnDelEsp);

    // Mostrar cuidados en ventana desplegable
    const btnMostrarCuidados = document.createElement("button");
    btnMostrarCuidados.textContent = "Cuidados";
    btnMostrarCuidados.onclick = () => {
      alert(`Cuidados para ${especie.nombre}:\n- Luz: ${especie.cuidados.luz}\n- Riego: ${especie.cuidados.riego}\n- Humedad: ${especie.cuidados.humedad}`);
    };
    div.appendChild(btnMostrarCuidados);

    // Lista de plantas
    const ul = document.createElement("ul");
    especie.plantas.forEach(planta => {
      const li = document.createElement("li");
      li.textContent = planta.nombre;

      // Mostrar miniatura si tiene foto
      if (planta.thumbnail) {
        const img = document.createElement("img");
        img.src = planta.thumbnail;
        img.alt = planta.nombre;
        img.style.width = "30px";
        img.style.height = "30px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "5px";
        img.style.marginLeft = "6px";
        li.prepend(img);
      }

      // Botón para abrir detalles de planta
      const btnDetalle = document.createElement("button");
      btnDetalle.textContent = "Detalles";
      btnDetalle.onclick = () => {
        mostrarDetallesPlanta(especie.id, planta.id);
      };
      li.appendChild(btnDetalle);

      // Botón para descargar QR
      const btnQr = document.createElement("button");
      btnQr.textContent = "Descargar QR";
      btnQr.onclick = () => {
        generarQrDescarga(planta.id, planta.nombre);
      };
      li.appendChild(btnQr);

      ul.appendChild(li);
    });

    div.appendChild(ul);
    container.appendChild(div);
  });
}

// Mostrar detalles y eventos de planta
function mostrarDetallesPlanta(idEspecie, idPlanta) {
  const especie = sucurs.find(s => s.id === idEspecie);
  if (!especie) return alert("Especie no encontrada");
  const planta = especie.plantas.find(p => p.id === idPlanta);
  if (!planta) return alert("Planta no encontrada");

  // Mostrar datos y eventos (puedes hacer un modal o alert simple)
  let info = `Planta: ${planta.nombre}\nFecha plantado: ${planta.fechaPlantado || "N/A"}\nComprada: ${planta.comprada ? "Sí" : "No"}\nEventos:\n`;
  if (planta.eventos && planta.eventos.length > 0) {
    planta.eventos.forEach(ev => {
      info += `- ${ev.tipo} el ${ev.fecha}\n`;
    });
  } else {
    info += "Sin eventos registrados.";
  }
  alert(info);
}

// Generar y descargar QR para planta con URL
function generarQrDescarga(idPlanta, nombre) {
  const qrText = `${baseUrl}?planta=${encodeURIComponent(idPlanta)}`;

  // Usamos QRCode library o simple canvas
  // Para simplificar, generamos QR con API externa o biblioteca si tienes

  // Ejemplo básico con API gratuita QR Code (solo para demo)
  const urlQr = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

  // Crear enlace para descarga
  const a = document.createElement("a");
  a.href = urlQr;
  a.download = `QR_${nombre}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Cargar planta específica si viene en URL
function cargarDesdeUrl() {
  const idPlanta = getPlantaFromUrl();
  if (!idPlanta) return;
  // Buscar planta
  for (const especie of sucurs) {
    const planta = especie.plantas.find(p => p.id === idPlanta);
    if (planta) {
      mostrarDetallesPlanta(especie.id, planta.id);
      break;
    }
  }
}

// Inicializar app
function init() {
  renderList();
  cargarDesdeUrl();
}

init();
