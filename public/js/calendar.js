// ===== Calendario mensual reutilizable (público y admin) =====
// Uso:
//   const cal = createPoolCalendar(containerEl, {
//     defaultMonth: "2026-08",          // opcional, por defecto mes actual
//     minMonth: "2026-08",              // no se puede navegar antes de este mes
//     onMonth(monthKey) {}              // async, devuelve { statuses } para ese mes
//     onDayClick(date, status, evt) {}  // al tocar un día
//   });
//   cal.init();
//
// Estados devueltos por el servidor: "past" | "available" | "reserved" | "blocked"

window.PoolCalendar = (function () {
  const MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const STATUS_CLASS = {
    past: "is-past",
    available: "is-available",
    reserved: "is-reserved",
    blocked: "is-blocked",
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }
  // mes como "YYYY-MM" (1-based en el string)
  function monthKey(year, monthIndex) {
    return `${year}-${pad(monthIndex + 1)}`;
  }
  function todayMonthKey() {
    const d = new Date();
    return monthKey(d.getFullYear(), d.getMonth());
  }
  function parseMonthKey(k) {
    const [y, m] = k.split("-").map(Number);
    return { y, monthIndex: m - 1 };
  }
  // fecha "YYYY-MM-DD"
  function dateKey(year, monthIndex, day) {
    return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
  }

  function create(root, opts) {
    opts = opts || {};
    let start = opts.defaultMonth
      ? parseMonthKey(opts.defaultMonth)
      : (() => {
          const d = new Date();
          return { y: d.getFullYear(), monthIndex: d.getMonth() };
        })();
    let year = start.y;
    let monthIndex = start.monthIndex;
    let statuses = {};

    async function fetchMonth() {
      if (opts.onMonth) {
        const data = (await opts.onMonth(monthKey(year, monthIndex))) || {};
        statuses = data.statuses || {};
      }
    }

    function isMinMonth() {
      return opts.minMonth && monthKey(year, monthIndex) <= opts.minMonth;
    }

    function draw() {
      const prevDisabled = isMinMonth();
      const first = new Date(year, monthIndex, 1);
      const lead = (first.getDay() + 6) % 7; // lunes = 0
      const total = new Date(year, monthIndex + 1, 0).getDate();

      const doNav = async (dir) => {
        const newIndex = monthIndex + dir;
        year = year + Math.floor(newIndex / 12);
        monthIndex = ((newIndex % 12) + 12) % 12;
        await load();
      };

      root.innerHTML = `
        <div class="cal__head">
          <button type="button" class="cal__nav" data-dir="-1" aria-label="Mes anterior" ${prevDisabled ? "disabled" : ""}>&#10094;</button>
          <div class="cal__title">${MONTHS[monthIndex]} <strong>${year}</strong></div>
          <button type="button" class="cal__nav" data-dir="1" aria-label="Mes siguiente">&#10095;</button>
        </div>
        <div class="cal__week">
          ${WEEKDAYS.map((d) => `<span class="cal__wd">${d}</span>`).join("")}
        </div>
        <div class="cal__grid" role="grid">
          ${Array.from({ length: lead }).map(() => `<span class="cal__cell is-blank" aria-hidden="true"></span>`).join("")}
          ${Array.from({ length: total })
            .map((_, i) => {
              const day = i + 1;
              const key = dateKey(year, monthIndex, day);
              const st = statuses[key] || "available";
              const cls = STATUS_CLASS[st] || "is-available";
              const isSelected = opts.selectedDate === key ? " is-selected" : "";
              return `<button type="button" class="cal__cell ${cls}${isSelected}" data-date="${key}" data-status="${st}" aria-label="${key}">${day}</button>`;
            })
            .join("")}
        </div>`;

      root.querySelectorAll(".cal__nav").forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener("click", () => doNav(Number(btn.dataset.dir)));
      });

      root.querySelectorAll(".cal__cell[data-date]").forEach((cell) => {
        cell.addEventListener("click", () => {
          if (opts.onDayClick) opts.onDayClick(cell.dataset.date, cell.dataset.status, cell);
        });
      });
    }

    async function load() {
      await fetchMonth();
      draw();
    }

    return {
      async init() {
        await load();
      },
      getMonthKey() {
        return monthKey(year, monthIndex);
      },
      getMonth() {
        return { y: year, m: monthIndex + 1 };
      },
      async refresh() {
        await load();
      },
      select(dateStr) {
        opts.selectedDate = dateStr || null;
        draw();
      },
    };
  }

  return {
    create,
    todayKey: todayMonthKey,
    formatLabel: (k) => {
      const [y, m, d] = k.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    },
  };
})();