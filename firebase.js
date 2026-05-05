// Firebase desde CDN (para HTML normal)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 TU CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDnkUFEuhmuGNsKApT91Zrph8XqbrS6BRI",
  authDomain: "ecommerfotos.firebaseapp.com",
  projectId: "ecommerfotos",
  storageBucket: "ecommerfotos.firebasestorage.app",
  messagingSenderId: "869576271394",
  appId: "1:869576271394:web:e2c1cf7530c04f66abcc7b",
  measurementId: "G-6BLWEZJXTL",
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 FUNCIÓN GLOBAL
window.guardarUso = async function (usuario, cantidad) {
  try {
    await addDoc(collection(db, "usos"), {
      usuario: usuario,
      cantidad: cantidad,
      fecha: new Date(),
    });

    console.log("✅ Guardado en Firebase");
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

import {
  getDocs,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 OBTENER HISTORIAL
window.cargarHistorial = async function (usuario) {
  try {
    const q = query(
      collection(db, "usos"),
      where("usuario", "==", usuario),
      orderBy("fecha", "desc"),
    );

    const querySnapshot = await getDocs(q);

    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const fecha = data.fecha?.toDate
        ? data.fecha.toDate().toLocaleString()
        : new Date(data.fecha).toLocaleString();

      const item = document.createElement("div");
      item.className = "timeline_item";

      item.innerHTML = `
        <div class="dot"></div>
        <div class="content">
          <p><strong>${data.cantidad} imágenes</strong></p>
          <span>${fecha}</span>
        </div>
      `;

      timeline.appendChild(item);
    });
  } catch (error) {
    console.error("Error cargando historial:", error);
  }
};
