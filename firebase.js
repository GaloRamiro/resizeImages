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
      //orderBy("fecha", "asc"), // 👈 importante para gráfica
    );

    let querySnapshot;

    try {
      querySnapshot = await getDocs(q);
    } catch (error) {
      console.log("⏳ Esperando índice de Firebase...");
      return;
    }

    const timeline = document.getElementById("timeline");

    if (timeline) {
      timeline.innerHTML = "";
    }

    if (querySnapshot.empty) {
      timeline.innerHTML = "<p>No hay actividad todavía</p>";
      return;
    }

    let labels = [];
    let data = [];

    querySnapshot.forEach((doc) => {
      const d = doc.data();

      const fecha = d.fecha?.toDate ? d.fecha.toDate() : new Date(d.fecha);

      const fechaTexto = fecha.toLocaleString();

      // 🔹 TIMELINE
      const item = document.createElement("div");
      item.className = "timeline_item";

      item.innerHTML = `
        <div class="dot"></div>
        <div class="content">
          <p><strong>${d.cantidad} imágenes</strong></p>
          <span>${fechaTexto}</span>
        </div>
      `;

      if (timeline) {
        timeline.appendChild(item);
      }

      // 🔹 DATOS PARA GRÁFICA
      labels.push(fecha.toLocaleDateString());
      data.push(d.cantidad);
    });

    // 🔥 CREAR GRÁFICA
    const ctx = document.getElementById("graficoUso").getContext("2d");

    // destruir si ya existe
    if (window.miGrafico) {
      window.miGrafico.destroy();
    }
    let total = data.reduce((acc, val) => acc + val, 0);
    window.miGrafico = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `Total: ${total} imágenes`,
            data: data,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error cargando historial:", error);
  }
};
