// =========================
// PREVIEW (VISTA PREVIA DE IMÁGENES)
// =========================
function previewFiles() {
  const preview = document.querySelector("#preview");
  const files = document.getElementById("imageFile").files;

  // Limpiar contenido anterior
  preview.innerHTML = "";
  document.getElementById("image_select").innerHTML = "";
  document.getElementById("prev_span").innerText = "Choose an image";

  // Mostrar imágenes si hay archivos
  if (files.length > 0) {
    [].forEach.call(files, readAndPreview);
  }
}

// Lee cada archivo y lo muestra en pantalla
function readAndPreview(file, index) {
  const preview = document.querySelector("#preview");

  const div_image = document.createElement("div");
  div_image.className = "preview_card";

  const reader = new FileReader();

  reader.addEventListener("load", function () {
    const image = new Image();
    image.src = this.result;
    image.className = "preview_img";
    image.dataset.index = index;
    image.title = file.name;

    // La primera imagen queda seleccionada por defecto
    if (index === 0) {
      image.classList.add("active");
    }

    // Permite seleccionar imagen al hacer click
    image.addEventListener("click", () => {
      document
        .querySelectorAll(".preview_img")
        .forEach((img) => img.classList.remove("active"));

      image.classList.add("active");
    });

    div_image.appendChild(image);
    preview.appendChild(div_image);
  });

  reader.readAsDataURL(file);
}

// =========================
// REDIMENSIONAR IMAGEN SELECCIONADA (SOLO PREVIEW)
// =========================
function resizeImage(max_width, max_height) {
  const prev_span = document.getElementById("prev_span");
  const image_select = document.getElementById("image_select");

  const selected = document.querySelector(".preview_img.active");

  if (!selected) {
    prev_span.innerText = "Selecciona una imagen";
    return;
  }

  prev_span.innerText = `Imagen seleccionada ${max_width} x ${max_height}`;

  const image = new Image();

  image.onload = function () {
    image.width = max_width;
    image.height = max_height;
  };

  image.src = selected.src;

  image_select.innerHTML = "";
  image_select.appendChild(image);
}

// =========================
// PROCESAR Y DESCARGAR ZIP
// =========================
async function download_main() {
  const button = document.querySelector(".success");
  const files = document.getElementById("imageFile").files;

  // Validación
  if (!files.length) {
    alert("Sube al menos una imagen");
    return;
  }

  button.disabled = true;
  button.innerText = "Procesando...";

  const zip = new JSZip();
  const sizes = [30, 65, 96, 300, 515];

  const progressBar = document.getElementById("progress_bar");
  const progressText = document.getElementById("progress_text");

  // Calcular tareas totales (para progreso)
  let totalTasks = 0;
  for (let file of files) {
    let name = file.name.replace(/\.[^.$]+$/, "");
    //cambio para que detecte los valores con -1200
    const is1200 = /-1200_\d+/.test(name);
    totalTasks += is1200 ? sizes.length + 1 : 1;
  }

  let completed = 0;

  progressBar.style.width = "0%";
  progressText.innerText = "Procesando imágenes...";

  const loader = document.getElementById("loader");
  if (loader) loader.classList.remove("hidden");

  try {
    // =========================
    // PROCESAR CADA ARCHIVO
    // =========================
    for (let file of files) {
      let name = file.name.replace(/\.[^.$]+$/, "");

      // Detecta si es imagen que se debe redimensionar
      const is1200 = /-1200_\d+/.test(name);

      // Leer archivo como base64
      const dataUrlOriginal = await readFile(file);

      let baseCodeRaw = name.split("-")[0];

      // 🔥 quitar ceros solo para comparar
      let clean = baseCodeRaw.replace(/^0+/, "");

      // 🔥 buscar si existe una versión larga en los archivos
      let baseCode = baseCodeRaw;

      for (let f of files) {
        let n = f.name.replace(/\.[^.$]+$/, "");
        let possible = n.split("-")[0];

        if (possible.startsWith("00000")) {
          let short = possible.replace(/^0+/, "");

          if (short === clean) {
            baseCode = possible; // usa el código largo
            break;
          }
        }
      }

      // Crear carpeta por producto
      let folder = zip.folder("imagenes/" + baseCode);

      // 🔹 Si es imagen 1200 → generar tamaños
      if (is1200) {
        // ✅ GUARDAR ORIGINAL (esto faltaba)
        folder.file(name + ".webp", dataUrlOriginal.split(",")[1], {
          base64: true,
        });

        completed++;
        for (let size of sizes) {
          let dataUrl = await resizeFromDataURL(dataUrlOriginal, size);

          let newName = name.replace(/-1200_/, "-" + size + "_") + ".webp";

          folder.file(newName, dataUrl.split(",")[1], {
            base64: true,
          });

          completed++;
        }
      }
      // 🔹 Si NO es 1200 → guardar tal cual (etiquetas)
      else {
        folder.file(name + ".webp", dataUrlOriginal.split(",")[1], {
          base64: true,
        });
        completed++;
      }

      // Actualizar progreso
      let percent = Math.round((completed / totalTasks) * 100);
      progressBar.style.width = percent + "%";
      progressText.innerText = percent + "% procesado";
    }

    progressText.innerText = "Comprimiendo...";

    // Generar ZIP
    const content = await zip.generateAsync({ type: "blob" });

    // Descargar
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");

    link.href = url;
    link.download = "imagenes.zip";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    progressText.innerText = "✅ Descarga completa";
  } catch (error) {
    console.error(error);
    progressText.innerText = "❌ Error al procesar imágenes";
  } finally {
    button.disabled = false;
    button.innerText = "Download Images";
    if (loader) loader.classList.add("hidden");
  }
}

// =========================
// HELPERS
// =========================

// Leer archivo como base64
function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// Redimensionar imagen usando canvas
function resizeFromDataURL(dataUrl, size) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      let width = image.width;
      let height = image.height;

      // Mantener proporción
      if (width > height) {
        if (width > size) {
          height *= size / width;
          width = size;
        }
      } else {
        if (height > size) {
          width *= size / height;
          height = size;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);

      resolve(canvas.toDataURL("image/webp", 0.95));
    };

    image.src = dataUrl;
  });
}

// =========================
// DRAG & DROP
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop_zone");
  const inputFile = document.getElementById("imageFile");

  if (!dropZone || !inputFile) return;

  // Cuando arrastras encima
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("active");
  });

  // Cuando sales del área
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
  });

  // Cuando sueltas archivos
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();

    const files = e.dataTransfer.files;

    if (files.length) {
      const dt = new DataTransfer();

      // Pasar archivos al input (hack necesario)
      for (let file of files) {
        dt.items.add(file);
      }

      inputFile.files = dt.files;
      previewFiles();
    }

    dropZone.classList.remove("active");
  });

  // Input normal
  inputFile.addEventListener("change", previewFiles);

  // Click en zona abre selector
  dropZone.addEventListener("click", () => {
    inputFile.click();
  });
});
