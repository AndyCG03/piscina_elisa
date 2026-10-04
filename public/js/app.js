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

// ===== Precios dinámicos (desde /api/prices) =====
function fmt(n) {
  return Math.round(n).toLocaleString("en-US").replace(/,/g, " ");
}

async function loadPrices() {
  let prices = null;
  try {
    const res = await fetch("/api/prices");
    prices = await res.json();
  } catch {
    // Si la API falla se mantienen los valores por defecto del HTML.
  }
  if (!prices) return;

  const amount = document.getElementById("priceAmount");
  if (amount) amount.innerHTML = `${fmt(prices.basePrice)} <small>${prices.currency}</small>`;

  const cap = document.getElementById("priceCap");
  if (cap) cap.textContent = `Hasta ${prices.includedPeople} personas`;

  const extra = document.getElementById("priceExtra");
  if (extra) {
    extra.innerHTML = `Se suma <strong>${fmt(prices.extraPerPerson)}</strong> por cada persona adicional, hasta ${prices.maxPeople} personas.`;
  }

  const deposit = document.getElementById("depositVal");
  if (deposit) deposit.textContent = `anticipo de ${fmt(prices.deposit)}`;

  document.querySelectorAll("[data-addon]").forEach((node) => {
    const a = prices.addons && prices.addons[node.dataset.addon];
    if (a) node.textContent = fmt(a.price);
  });
}

// ===== Selector de número de WhatsApp =====
const WA_DEFAULT_MSG = "Hola, estoy interesado en alquilar la Piscina La Elisa 🏊";
const reserveSheet = document.getElementById("reserveSheet");
const waSheet = document.getElementById("waSheet");
let reserveMsg = WA_DEFAULT_MSG;

function closeSheet() { reserveSheet.hidden = true; }
function closeWaSheet() { waSheet.hidden = true; }

// Abre el modal con ambos números; cada opción lleva el mensaje indicado
function openWaSheet(msg, subtitle) {
  waSheet.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = `https://wa.me/${a.dataset.wa}?text=${encodeURIComponent(msg)}`;
  });
  document.getElementById("waSubtitle").textContent =
    subtitle || "Escríbenos por WhatsApp o llámanos al fijo.";
  waSheet.hidden = false;
}

document.addEventListener("click", (e) => {
  if (e.target === reserveSheet) closeSheet();
  if (e.target === waSheet) closeWaSheet();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeWaSheet();
  closeSheet();
});

// Botones "Reservar" y botón flotante: abren el selector de número
document.querySelectorAll("[data-wa-open]").forEach((btn) =>
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openWaSheet(WA_DEFAULT_MSG, "Escríbenos por WhatsApp o llámanos al fijo para reservar.");
  })
);
document.getElementById("waClose").addEventListener("click", closeWaSheet);
// al elegir un número se abre WhatsApp y se cierra el modal
waSheet.querySelectorAll("[data-wa], [data-call]").forEach((a) => a.addEventListener("click", closeWaSheet));

document.getElementById("rsReserve").addEventListener("click", () => {
  closeSheet();
  openWaSheet(reserveMsg, "Elige a qué número de WhatsApp enviar tu reserva.");
});

// ===== Calendario público de disponibilidad =====
function initPublicCalendar() {
  const container = document.getElementById("publicCalendar");
  if (!container || container.closest("[hidden]")) return; // calendario oculto

  const cal = window.PoolCalendar.create(container, {
    defaultMonth: window.PoolCalendar.todayKey(),
    minMonth: window.PoolCalendar.todayKey(),
    async onMonth(month) {
      try {
        const res = await fetch(`/api/availability?month=${month}`);
        return await res.json();
      } catch {
        return { statuses: {} };
      }
    },
    onDayClick(date, status) {
      if (status !== "available") return; // solo se reservan días disponibles
      const label = window.PoolCalendar.formatLabel(date);
      document.getElementById("rsTitle").textContent =
        label.charAt(0).toUpperCase() + label.slice(1);
      document.getElementById("rsSubtitle").textContent = "El día está disponible. Confirma y reserva.";
      const msg =
        `Hola! Quiero reservar la Piscina La Elisa 🏊 para el día ${label}. ¿Está disponible?`;
      reserveMsg = msg;
      reserveSheet.hidden = false;
    },
  });

  cal.init();
}

document.getElementById("rsClose").addEventListener("click", closeSheet);

loadPrices();
initPublicCalendar();
