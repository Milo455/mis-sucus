// plant.js
import { db } from "./firebase-init.js";
import { collection, doc, getDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const plantId = params.get("id");

const plantNameEl = document.getElementById("plantName");
const lastPhotoEl = document.getElementById("lastPhoto");
const lastWateringEl = document.getElementById("lastWatering");
const albumEl = document.getElementById("album");

async function loadPlantData() {
  if (!plantId) {
    alert("ID de planta no encontrado.");
    return;
  }

  // Obtener el documento de la planta
  const plantRef = doc(db, "plants", plantId);
  const plantSnap = await getDoc(plantRef);

  if (!plantSnap.exists()) {
    alert("Planta no encontrada.");
    return;
  }

  const plantData = plantSnap.data();
  plantNameEl.textContent = plantData.name || "Sin nombre";

  // Obtener últimas fotos
  const photosQuery = query(
    collection(db, `plants/${plantId}/photos`),
    orderBy("timestamp", "desc")
  );
  const photoSnaps = await getDocs(photosQuery);

  if (!photoSnaps.empty) {
    const firstPhoto = photoSnaps.docs[0].data();
    lastPhotoEl.src = firstPhoto.url;
  }

  // Obtener últimos eventos para saber el último riego
  const eventsQuery = query(
    collection(db, `plants/${plantId}/events`),
    orderBy("timestamp", "desc")
  );
  const eventSnaps = await getDocs(eventsQuery);

  const lastWater = eventSnaps.docs.find(doc => doc.data().type === "Riego");
  if (lastWater) {
    const date = new Date(lastWater.data().timestamp?.toDate?.() || lastWater.data().timestamp);
    lastWateringEl.textContent = `Último riego: ${date.toLocaleDateString()}`;
  } else {
    lastWateringEl.textContent = "Sin registros de riego.";
  }

  // Cargar álbum de fotos
  albumEl.innerHTML = "";
  photoSnaps.forEach(photoDoc => {
    const photo = photoDoc.data();
    const div = document.createElement("div");
    div.className = "photo-card";
    div.innerHTML = `
      <img src="${photo.url}" alt="foto planta" />
      <p>${photo.comment || ""}</p>
    `;
    albumEl.appendChild(div);
  });
}

loadPlantData();

// Volver a inicio
document.getElementById("goBack").addEventListener("click", () => {
  window.location.href = "index.html";
});

