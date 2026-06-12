// ===== Animaciones de aparición (fade-in al hacer scroll) =====
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

function observe(el) { io.observe(el); }

// Elementos marcados con .reveal en el HTML
document.querySelectorAll(".reveal").forEach(observe);

// Escalona la aparición de las tarjetas de "Detalles"
document.querySelectorAll(".features .feature").forEach((el, i) => {
  el.style.setProperty("--d", `${i * 0.08}s`);
});

// ===== Galería: carga las fotos de /public/images/gallery =====
let images = [];
let currentIndex = 0;

const grid = document.getElementById("galleryGrid");
const empty = document.getElementById("galleryEmpty");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");

async function loadGallery() {
  try {
    const res = await fetch("/api/gallery");
    const data = await res.json();
    images = data.images || [];
  } catch (e) {
    images = [];
  }

  if (images.length === 0) {
    empty.textContent =
      "Aún no hay fotos. Copia tus imágenes en la carpeta public/images/gallery y recarga la página.";
    return;
  }

  empty.remove();
  grid.innerHTML = "";
  images.forEach((src, i) => {
    const item = document.createElement("div");
    item.className = "gallery__item";
    item.style.transitionDelay = `${(i % 4) * 0.07}s`;
    item.innerHTML = `<img src="${src}" alt="Piscina La Elisa - foto ${i + 1}" loading="lazy">`;
    item.addEventListener("click", () => openLightbox(i));
    grid.appendChild(item);
    observe(item); // fade-in al entrar en pantalla
  });
}

function openLightbox(i) {
  currentIndex = i;
  lbImg.src = images[i];
  lightbox.hidden = false;
}
function closeLightbox() {
  lightbox.hidden = true;
}
function step(dir) {
  currentIndex = (currentIndex + dir + images.length) % images.length;
  lbImg.src = images[currentIndex];
}

document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => step(-1));
document.getElementById("lbNext").addEventListener("click", () => step(1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

loadGallery();
