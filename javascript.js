// =========================
// PREVIEW
// =========================
function previewFiles() {
  const preview = document.querySelector("#preview");
  const files = document.querySelector("input[type=file]").files;

  preview.innerHTML = "";
  document.getElementById("image_select").innerHTML = "";
  document.getElementById("prev_span").innerText = "Choose an image";
  if (files) {
    [].forEach.call(files, readAndPreview);
  }
}

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

    if (index === 0) {
      image.classList.add("active");
    }

    // 🔥 CLICK PARA SELECCIONAR
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
// RESIZE PREVIEW
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
// DOWNLOAD ZIP + PROGRESS
// =========================
async function download_main() {
  const button = document.querySelector(".success");
  const files = document.querySelector("input[type=file]").files;

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

  let totalTasks = files.length * sizes.length;
  let completed = 0;

  progressBar.style.width = "0%";
  progressText.innerText = "Procesando imágenes...";
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");
  try {
    // 🔥 TODO EL PROCESO VA AQUÍ
    for (let file of files) {
      let name = file.name.replace(/\.[^.$]+$/, "");
      let family = name.split("-")[0];
      let folder = zip.folder(family);

      const dataUrlOriginal = await readFile(file);

      for (let size of sizes) {
        let dataUrl = await resizeFromDataURL(dataUrlOriginal, size);

        let newName;
        if (/-\d+_/.test(name)) {
          newName = name.replace(/-\d+_/, "-" + size + "_") + ".webp";
        } else {
          newName = name + "_" + size + ".webp";
        }

        folder.file(newName, dataUrl.split(",")[1], { base64: true });

        completed++;
        let percent = Math.round((completed / totalTasks) * 100);

        progressBar.style.width = percent + "%";
        progressText.innerText = percent + "% procesado";
      }
    }

    progressText.innerText = "Comprimiendo...";

    const content = await zip.generateAsync({ type: "blob" });

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
    // 🔥 SIEMPRE SE EJECUTA
    button.disabled = false;
    button.innerText = "Download Images";
  }

  loader.classList.add("hidden");
}

// =========================
// HELPERS
// =========================
function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function resizeFromDataURL(dataUrl, size) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      let width = image.width;
      let height = image.height;

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
// DRAG & DROP (SEGURO)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop_zone");
  const inputFile = document.getElementById("imageFile");

  if (!dropZone || !inputFile) return;

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("active");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();

    inputFile.files = e.dataTransfer.files;
    previewFiles();
    e.dataTransfer.clearData();
    dropZone.classList.remove("active");
  });

  inputFile.addEventListener("change", previewFiles);
  dropZone.addEventListener("click", () => {
    inputFile.click();
  });
});
