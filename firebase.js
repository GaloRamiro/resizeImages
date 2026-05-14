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
  if (timeline) {
    timeline.innerHTML = "<p>No hay actividad todavía</p>";
  }
  return;
}

    let registros = [];

    querySnapshot.forEach((doc) => {
      const d = doc.data();

      const fecha = d.fecha?.toDate ? d.fecha.toDate() : new Date(d.fecha);

      const fechaTexto = fecha.toLocaleString();

      // timeline (opcional)
      if (timeline) {
        const item = document.createElement("div");
        item.className = "timeline_item";

        item.innerHTML = `
      <div class="dot"></div>
      <div class="content">
        <p><strong>${d.cantidad} imágenes</strong></p>
        <span>${fechaTexto}</span>
      </div>
    `;

        timeline.appendChild(item);
      }

      // 👉 SOLO GUARDAR
      registros.push({
        fecha: fecha,
        cantidad: d.cantidad,
      });
    });
    // ordenar por fecha
    registros.sort((a, b) => a.fecha - b.fecha);



// convertir a arrays
// 🔥 AGRUPAR POR DÍA
let agrupado = {};

registros.forEach((r) => {
 let dia = r.fecha.toISOString().split("T")[0]; // yyyy-mm-dd

  if (!agrupado[dia]) {
    agrupado[dia] = 0;
  }

  agrupado[dia] += r.cantidad;
});

// convertir a arrays
// 🔥 convertir a array ordenado por fecha
let ordenado = Object.keys(agrupado)
.map((fecha) => {
  const [year, month, day] = fecha.split("-");

  return {
    fecha: new Date(year, month - 1, day), // 👈 LOCAL (no UTC)
    valor: agrupado[fecha],
  };
})
  .sort((a, b) => a.fecha - b.fecha);

// labels y valores ordenados
let labels = ordenado.map((e) => {
  const f = new Date(e.fecha);
  return f.toLocaleDateString("es-EC");
});

let valores = ordenado.map((e) => e.valor);

// ✅ TOTAL REAL
let total = valores.reduce((acc, val) => acc + val, 0);
if (totalGlobal) {
  totalGlobal.innerText = `📦 Total histórico: ${total} imágenes`;
}
// 🔥 ACUMULADO PARA GRÁFICA
let data = valores;


// 🔥 CREAR GRÁFICA
const ctx = document.getElementById("graficoUso").getContext("2d");

// destruir si ya existe
if (window.miGrafico) {
  window.miGrafico.destroy();
}

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