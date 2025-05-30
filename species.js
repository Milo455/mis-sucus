// species.js

import { db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const speciesId = urlParams.get("id");

  if (!speciesId) {
    alert("No se encontró el ID de la especie.");
    window.location.href = "index.html";
    return;
  }

  const speciesRef = doc(db, "species", speciesId);
  const speciesSnap = await getDoc(speciesRef);

  if (!speciesSnap.exists()) {
    alert("Especie no encontrada.");
    window.location.href = "index.html";
    return;
  }

  const species = speciesSnap.data();
  document.getElementById("speciesTitle").textContent = species.name;
  document.getElementById("speciesImage").src = species.image;
  document.getElementById("speciesCare").textContent = species.care;

  const countElement = document.getElementById("plantCount");
  const plantList = document.getElementById("plantList");
  const q = query(collection(db, "plants"), where("speciesId", "==", speciesId), orderBy("name"));

  onSnapshot(q, (snapshot) => {
    plantList.innerHTML = "";
    const plants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    countElement.textContent = plants.length;
    plants.forEach((plant) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `plant.html?id=${plant.id}`;
      link.textContent = plant.name;
      item.appendChild(link);
      plantList.appendChild(item);
    });
  });

  document.getElementById("editSpeciesBtn").addEventListener("click", () => {
    const newName = prompt("Nuevo nombre de la especie:", species.name);
    const newCare = prompt("Nueva información de cuidados:", species.care);
    if (newName && newCare) {
      updateDoc(speciesRef, {
        name: newName,
        care: newCare
      });
    }
  });

  document.getElementById("deleteSpeciesBtn").addEventListener("click", async () => {
    if (confirm("¿Seguro que deseas eliminar esta especie y todas sus plantas?")) {
      const q = query(collection(db, "plants"), where("speciesId", "==", speciesId));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, "plants", docSnap.id));
      }
      await deleteDoc(speciesRef);
      window.location.href = "index.html";
    }
  });

  document.getElementById("addPlantBtn").addEventListener("click", async () => {
    const plantName = prompt("Nombre personalizado de la planta:");
    if (!plantName) return;

    const newPlant = {
      name: plantName,
      speciesId,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "plants"), newPlant);
    window.location.href = `plant.html?id=${docRef.id}`;
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});

