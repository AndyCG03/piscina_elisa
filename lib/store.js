const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function dataFile(name) {
  return path.join(DATA_DIR, name);
}

// Asegura que el directorio data exista.
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Lee un JSON, devolviendo el fallback si no existe o está corrupto.
function load(name, fallback) {
  ensureDir();
  try {
    const raw = fs.readFileSync(dataFile(name), "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Escribe de forma atómica (temp + rename) para no corromper el archivo.
function save(name, data) {
  ensureDir();
  const file = dataFile(name);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

module.exports = {
  getPrices() {
    return load("prices.json", {
      currency: "CUP",
      basePrice: 12000,
      includedPeople: 15,
      extraPerPerson: 1000,
      maxPeople: 20,
      deposit: 2000,
      addons: {
        horno: { name: "Horno con carbón", price: 1000 },
        nevera: { name: "Nevera con hielo", price: 1000 },
        wifi: { name: "Wifi", price: 500 },
      },
    });
  },
  savePrices(data) {
    save("prices.json", data);
  },

  // { reservations: { "YYYY-MM-DD": { type, name, phone, notes, createdAt } } }
  getReservations() {
    return load("reservations.json", { reservations: {} });
  },
  setReservation(date, entry) {
    const store = this.getReservations();
    if (entry === null) {
      delete store.reservations[date];
    } else {
      store.reservations[date] = entry;
    }
    save("reservations.json", store);
    return store;
  },

  // { photos: [{ id, file, order, featured, uploadedAt }] }
  getGallery() {
    return load("gallery.json", { photos: [] });
  },
  saveGallery(store) {
    save("gallery.json", store);
  },
};