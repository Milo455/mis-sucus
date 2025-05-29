// Clave storage
const STORAGE_KEY = "misSucusData";

// Referencias DOM
const speciesList = document.getElementById("speciesList");
const addSpeciesBtn = document.getElementById("addSpecies");
const photoInput = document.getElementById("photoInput");
const calendarBtn = document.getElementById("openCalendar");
const calendarModal = document.getElementById("calendarModal");
const calendarContent = document.getElementById("calendarContent");
const closeCalendarBtn = document.getElementById("closeCalendar");
const qrScannerBtn = document.getElementById("openQRScanner");
const qrModal = document.getElementById("qrModal");
const closeQRBtn = document.getElementById("closeQR");
const qrVideo = document.getElementById("qrVideo");
const qrResult = document.getElementById("qrResult");
const qrCloseBtn = document.getElementById("qrCloseBtn");

// Librería QR js (usar cdn o instalar)
// Para este ejemplo usaremos jsQR https://github.com/cozmo/jsQR
// Agregar en index.html: <script src="https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js"></script>

// Datos y estado
let data = [];
let currentSpeciesIndex = null;
let currentPlantIndex = null;
let qrStream = null;

// Helpers

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Cargar y guardar datos

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  data = saved ? JSON.parse(saved) : [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Render especies y plantas

function createEventElement(event, speciesIdx, plantIdx, eventIdx) {
  const div = document.createElement("div");
  div.className = "event-item";

  const tipoSpan = document.createElement("span");
  tipoSpan.textContent = `[${event.tipo}] `;
  tipoSpan.style.fontWeight = "bold";
  div.appendChild(tipoSpan);

  const fechaSpan = document.createElement("span");
  fechaSpan.textContent = new Date(event.fecha).toLocaleDateString();
  div.appendChild(fechaSpan);

  if (event.nota) {
    const notaP = document.createElement("p");
    notaP.textContent = event.nota;
    div.appendChild(notaP);
  }

  if (event.foto) {
    const img = document.createElement("img");
    img.src = event.foto;
    img.alt = "Foto evento";
    img.className = "event-photo";
    div.appendChild(img);
  }

  // Botón borrar evento
  const delBtn = document.createElement("button");
  delBtn.textContent = "Eliminar";
  delBtn.onclick = () => {
    if (confirm("Eliminar este evento?")) {
      data[speciesIdx].plants[plantIdx].events.splice(eventIdx, 1);
      saveData();
      render();
    }
  };
  div.appendChild(delBtn);

  return div;
}

function createPlantElement(plant, speciesIndex, plantIndex) {
  const div = document.createElement("div");
  div.className = "plant-item";

  // Nombre editable
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = plant.name;
  nameInput.placeholder = "Nombre de la planta";
  nameInput.onchange = () => {
    data[speciesIndex].plants[plantIndex].name = nameInput.value;
    saveData();
  };
  div.appendChild(nameInput);

  // Foto
  const img = document.createElement("img");
  img.src = plant.photo || "https://via.placeholder.com/100?text=🌵";
  img.alt = plant.name;
  img.className = "plant-photo";
  div.appendChild(img);

  // Botón para cambiar foto
  const changePhotoBtn = document.createElement("button");
  changePhotoBtn.textContent = "Cambiar foto";
  changePhotoBtn.onclick = () => {
    photoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        data[speciesIndex].plants[plantIndex].photo = reader.result;
        saveData();
        render();
      };
      reader.readAsDataURL(file);
    };
    photoInput.click();
  };
  div.appendChild(changePhotoBtn);

  // Botón historial / eventos
  const eventsBtn = document.createElement("button");
  eventsBtn.textContent = "Ver / Añadir Eventos";
  eventsBtn.onclick = () => {
    currentSpeciesIndex = speciesIndex;
    currentPlantIndex = plantIndex;
    openEventsModal();
  };
  div.appendChild(eventsBtn);

  // Botón para mostrar QR
  const qrBtn = document.createElement("button");
  qrBtn.textContent = "Mostrar QR";
  qrBtn.onclick = () => {
    showQR(plant.id);
  };
  div.appendChild(qrBtn);

  // Botón eliminar planta
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Eliminar planta";
  deleteBtn.onclick = () => {
    if (confirm("¿Eliminar esta planta?")) {
      data[speciesIndex].plants.splice(plantIndex, 1);
      saveData();
      render();
    }
  };
  div.appendChild(deleteBtn);

  return div;
}

function createSpeciesElement(speciesObj, speciesIndex) {
  const container = document.createElement("div");
  container.className = "species-container";

  // Título con nombre editable
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = speciesObj.species;
  titleInput.className = "species-name";
  titleInput.onchange = () => {
    data[speciesIndex].species = titleInput.value;
    saveData();
    render();
  };
  container.appendChild(titleInput);

  // Cuidados editables
  const careDiv = document.createElement("div");
  careDiv.className = "care-info";

  const lightInput = document.createElement("input");
  lightInput.type = "text";
  lightInput.placeholder = "Luz";
  lightInput.value = speciesObj.care.light || "";
  lightInput.onchange = () => {
    data[speciesIndex].care.light = lightInput.value;
    saveData();
  };
  careDiv.appendChild(document.createTextNode("☀️ Luz: "));
  careDiv.appendChild(lightInput);

  const waterInput = document.createElement("input");
  waterInput.type = "text";
  waterInput.placeholder = "Riego";
  waterInput.value = speciesObj.care.water || "";
  waterInput.onchange = () => {
    data[speciesIndex].care.water = waterInput.value;
    saveData();
  };
  careDiv.appendChild(document.createTextNode(" 💧 Riego: "));
  careDiv.appendChild(waterInput);

  const humidityInput = document.createElement("input");
  humidityInput.type = "text";
  humidityInput.placeholder = "Humedad";
  humidityInput.value = speciesObj.care.humidity || "";
  humidityInput.onchange = () => {
    data[speciesIndex].care.humidity = humidityInput.value;
    saveData();
  };
  careDiv.appendChild(document.createTextNode(" 🌫️ Humedad: "));
  careDiv.appendChild(humidityInput);

  container.appendChild(careDiv);

  // Lista de plantas (subplantas)
  const plantsContainer = document.createElement("div");
  plantsContainer.className = "plants-container";

  speciesObj.plants.forEach((plant, plantIndex) => {
    const plantEl = createPlantElement(plant, speciesIndex, plantIndex);
    plantsContainer.appendChild(plantEl);
  });

  container.appendChild(plantsContainer);

  // Botón añadir planta
  const addPlantBtn = document.createElement("button");
  addPlantBtn.textContent = "➕ Añadir planta";
  addPlantBtn.onclick = () => {
    const newPlant = {
      id: generateId(),
      name: "Nueva planta",
      photo: null,
      createdAt: new Date().toISOString().split("T")[0],
      events: [],
    };
    data[speciesIndex].plants.push(newPlant);
    saveData();
    render();
  };
  container.appendChild(addPlantBtn);

  return container;
}

// Render principal
function render() {
  speciesList.innerHTML = "";
  if (data.length === 0) {
    speciesList.textContent = "No tienes especies agregadas. Usa el botón arriba para añadir.";
    return;
  }
  data.forEach((speciesObj, index) => {
    const speciesEl = createSpeciesElement(speciesObj, index);
    speciesList.appendChild(speciesEl);
  });
}

// Modal de eventos

function openEventsModal() {
  const modal = document.getElementById("eventsModal");
  const eventsList = document.getElementById("eventsList");
  const addEventForm = document.getElementById("addEventForm");
  const eventType = document.getElementById("eventType");
  const eventDate = document.getElementById("eventDate");
  const eventNote = document.getElementById("eventNote");
  const eventPhotoInput = document.getElementById("eventPhotoInput");
  const closeEventsBtn = document.getElementById("closeEvents");

  // Mostrar modal
  modal.style.display = "block";

  // Limpiar eventos actuales
  eventsList.innerHTML = "";

  // Mostrar eventos existentes
  const events = data[currentSpeciesIndex].plants[currentPlantIndex].events || [];
  events.forEach((ev, idx) => {
    const evEl = createEventElement(ev, currentSpeciesIndex, currentPlantIndex, idx);
    eventsList.appendChild(evEl);
  });

  // Manejar envío nuevo evento
  addEventForm.onsubmit = (e) => {
    e.preventDefault();

    const newEvent = {
      tipo: eventType.value,
      fecha: eventDate.value || new Date().toISOString().split("T")[0],
      nota: eventNote.value,
      foto: null,
    };

    if (eventPhotoInput.files.length > 0) {
      const file = eventPhotoInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        newEvent.foto = reader.result;
        data[currentSpeciesIndex].plants[currentPlantIndex].events.push(newEvent);
        saveData();
        openEventsModal(); // recarga modal
      };
      reader.readAsDataURL(file);
    } else {
      data[currentSpeciesIndex].plants[currentPlantIndex].events.push(newEvent);
      saveData();
      openEventsModal(); // recarga modal
    }

    // Limpiar formulario
    eventType.value = "";
    eventDate.value = "";
    eventNote.value = "";
    eventPhotoInput.value = "";
  };

  // Cerrar modal
  closeEventsBtn.onclick = () => {
    modal.style.display = "none";
    render();
  };
}

// Calendario simple

function openCalendar() {
  calendarModal.style.display = "block";
  calendarContent.innerHTML = "";

  // Recolectar eventos por fecha
  let eventsByDate = {};

  data.forEach((species) => {
    species.plants.forEach((plant) => {
      plant.events.forEach((event) => {
        const date = event.fecha;
        if (!eventsByDate[date]) eventsByDate[date] = [];
        eventsByDate[date].push({
          species: species.species,
          plantName: plant.name,
          event,
        });
      });
    });
  });

  // Mostrar fechas ordenadas
  const dates = Object.keys(eventsByDate).sort();

  if (dates.length === 0) {
    calendarContent.textContent = "No hay eventos registrados.";
    return;
  }

  dates.forEach((date) => {
    const dateDiv = document.createElement("div");
    dateDiv.className = "calendar-date";

    const dateTitle = document.createElement("h3");
    dateTitle.textContent = new Date(date).toLocaleDateString();
    dateDiv.appendChild(dateTitle);

    eventsByDate[date].forEach(({ species, plantName, event }) => {
      const evDiv = document.createElement("div");
      evDiv.textContent = `${species} - ${plantName}: [${event.tipo}] ${event.nota || ""}`;
      dateDiv.appendChild(evDiv);
    });

    calendarContent.appendChild(dateDiv);
  });
}

closeCalendarBtn.onclick = () => {
  calendarModal.style.display = "none";
};

// QR Mostrar QR para planta (usa una librería externa QRCode.js)

function showQR(plantId) {
  const qrModalShow = document.getElementById("showQRModal");
  const qrCodeContainer = document.getElementById("qrCodeContainer");
  qrCodeContainer.innerHTML = "";
  qrModalShow.style.display = "block";

  // Usar QRCode.js (agregar cdn en index.html)
  // <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  QRCode.toCanvas(plantId, { width: 200 }, (error, canvas) => {
    if (error) {
      console.error(error);
      return;
    }
    qrCodeContainer.appendChild(canvas);
  });

  // Botón cerrar modal qr
  document.getElementById("closeShowQR").onclick = () => {
    qrModalShow.style.display = "none";
  };
}

// Escaneo QR (usando jsQR)

qrScannerBtn.onclick = () => {
  qrModal.style.display = "block";
  startQRScanner();
};

closeQRBtn.onclick = () => {
  qrModal.style.display = "none";
  stopQRScanner();
};

qrCloseBtn.onclick = () => {
  qrModal.style.display = "none";
  stopQRScanner();
};

function startQRScanner() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("La cámara no está disponible en este dispositivo.");
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      qrStream = stream;
      qrVideo.srcObject = stream;
      qrVideo.setAttribute("playsinline", true);
      qrVideo.play();
      requestAnimationFrame(tick);
    })
    .catch(() => alert("No se pudo acceder a la cámara."));
}

function stopQRScanner() {
  if (qrStream) {
    qrStream.getTracks().forEach(track => track.stop());
    qrStream = null;
  }
}

function tick() {
  if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
    const canvasElement = document.createElement("canvas");
    const canvas = canvasElement.getContext("2d");

    canvasElement.height = qrVideo.videoHeight;
    canvasElement.width = qrVideo.videoWidth;
    canvas.drawImage(qrVideo, 0, 0, canvasElement.width, canvasElement.height);

    const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const code = jsQR(imageData.data, canvasElement.width, canvasElement.height);

    if (code) {
      qrResult.textContent = "QR detectado: " + code.data;
      stopQRScanner();
      qrModal.style.display = "none";

      // Buscar planta por id
      const plantId = code.data;
      let found = false;
      data.forEach((species, i) => {
        species.plants.forEach((plant, j) => {
          if (plant.id === plantId) {
            found = true;
            currentSpeciesIndex = i;
            currentPlantIndex = j;
            openEventsModal();
          }
        });
      });
      if (!found) alert("Planta no encontrada para este QR.");
      return;
    } else {
      qrResult.textContent = "Buscando QR...";
    }
  }
  if (qrStream) requestAnimationFrame(tick);
}

// Inicialización

function addSpecies() {
  const newSpecies = {
    species: "Nueva especie",
    care: { light: "", water: "", humidity: "" },
    plants: [],
  };
  data.push(newSpecies);
  saveData();
  render();
}

addSpeciesBtn.onclick = addSpecies;
calendarBtn.onclick = openCalendar;

loadData();
render();
