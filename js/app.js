const API_BASE = window.API_BASE || "http://127.0.0.1:8000";

function normalizePhone(p){
  return (p || "").replace(/[^\d+]/g, "").trim();
}

function setMsg(el, text, ok=false){
  if(!el) return;
  el.textContent = text;
  el.style.color = ok ? "rgba(53,208,127,.95)" : "rgba(255,180,32,.95)";
}

document.querySelectorAll("[data-burger]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const menu = document.querySelector(".menu");
    if(menu) menu.classList.toggle("open");
  });
});

document.querySelectorAll("#leadForm").forEach(form=>{
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const msg = document.getElementById("formMsg");

    const fd = new FormData(form);
    const payload = {
      full_name: (fd.get("full_name") || "").toString().trim(),
      phone: normalizePhone(fd.get("phone")),
      note: (fd.get("note") || "").toString().trim(),
      business_type: (fd.get("business_type") || "").toString().trim(),
      source_page: location.pathname
    };

    if(payload.full_name.length < 3) return setMsg(msg, "Ism familiya kamida 3 ta belgi bo‘lsin.");
    if(payload.phone.length < 7) return setMsg(msg, "Telefon raqamni to‘g‘ri kiriting.");

    setMsg(msg, "Yuborilmoqda...");

    try{
      const r = await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });

      if(!r.ok){
        const t = await r.text();
        throw new Error(t || "Server xatosi");
      }

      form.reset();
      setMsg(msg, "So‘rovingiz qabul qilindi. Tez orada xodimimiz bog‘lanadi ✅", true);
    }catch(err){
      setMsg(msg, "Yuborib bo‘lmadi. Iltimos, birozdan so‘ng urinib ko‘ring yoki admin bilan bog‘laning.");
      console.error(err);
    }
  });
});
// ===== Dashboard preview KPI animation =====
(function initDashboardPreviewKpis(){
  const nodes = Array.from(document.querySelectorAll("[data-kpi]"));
  if (!nodes.length) return;

  const fmtMoney = (n) => {
    // 1234567 -> 1 234 567 so'm
    const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return s + " so'm";
  };

  const fmtInt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  function formatValue(node, val){
    const format = node.dataset.format || "int";
    if (format === "money") return fmtMoney(val);
    return fmtInt(val);
  }

  function animateTo(node, target, duration=900){
    const from = Number(node.dataset.value || "0");
    const start = performance.now();
    node.dataset.value = String(target);

    const tick = (t)=>{
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (target - from) * eased;
      node.textContent = formatValue(node, cur);

      if (p < 1) requestAnimationFrame(tick);
      else {
        node.classList.remove("up");
        // reflow for animation re-trigger
        void node.offsetWidth;
        node.classList.add("up");
      }
    };
    requestAnimationFrame(tick);
  }

  // Realistik diapazonlar (xohlasangiz o'zgartiramiz)
  const ranges = {
    sales:  [ 1200000,  9800000],   // so'm
    profit: [  180000,  1900000],   // so'm
    stock:  [      65,      980],   // dona
  };

  function nextTarget(key, prev){
    const [min, max] = ranges[key] || [0, 100];
    // biroz tebranish bo'lsin: oldingi qiymatga yaqinroq
    const wiggle = (max - min) * 0.12;
    const base = (prev && !Number.isNaN(prev)) ? prev : (min + (max-min)*0.4);
    const raw = base + (Math.random()*2 - 1) * wiggle;
    return Math.max(min, Math.min(max, raw));
  }

  // initial values
  nodes.forEach(n=>{
    const key = n.dataset.kpi;
    const initial = nextTarget(key, null);
    animateTo(n, initial, 850);
  });

  // periodic updates
  const intervalMs = 2600; // har 2.6s o'zgaradi
  setInterval(()=>{
    nodes.forEach(n=>{
      const key = n.dataset.kpi;
      const prev = Number(n.dataset.value || "0");
      const target = nextTarget(key, prev);
      animateTo(n, target, 900);
    });
  }, intervalMs);
})();
// ===== Dashboard preview products table (universal names) =====
(function initPreviewProducts(){
  const table = document.getElementById("previewTable");
  if (!table) return;

  const rows = Array.from(table.querySelectorAll(".row[data-row]"));
  if (!rows.length) return;

  const catalog = [
    "Non", "Sut 1L", "Tuxum 10 dona", "Shakar 1kg", "Guruch 1kg",
    "Un 1kg", "Choy 100g", "Qahva 100g", "Yog‘ 1L", "Makaron 500g",
    "Tuz 1kg", "Suv 1.5L", "Sharbat 1L", "Gazli ichimlik 1.5L",
    "Shampun", "Sovun", "Kir yuvish kukuni", "Tish pastasi",
    "Pechenye", "Shokolad", "Konserva", "Ketchup", "Mayonez"
  ];

  const fmtInt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  function pickUnique(n){
    const pool = catalog.slice();
    const out = [];
    while (out.length < n && pool.length){
      const i = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(i,1)[0]);
    }
    return out;
  }

  function updateTable(){
    const names = pickUnique(rows.length);

    rows.forEach((row, idx)=>{
      const nameEl  = row.querySelector('[data-col="name"]');
      const stockEl = row.querySelector('[data-col="stock"]');
      const soldEl  = row.querySelector('[data-col="sold"]');

      const stock = Math.floor(20 + Math.random()*980);   // qoldiq
      const sold  = Math.floor(1 + Math.random()*120);    // sotildi

      if (nameEl)  nameEl.textContent  = names[idx] || "Mahsulot";
      if (stockEl) stockEl.textContent = fmtInt(stock);
      if (soldEl)  soldEl.textContent  = fmtInt(sold);

      // kichik highlight animatsiya (ixtiyoriy)
      row.style.transition = "background .25s ease";
      row.style.background = "rgba(53,208,127,.06)";
      setTimeout(()=>{ row.style.background = ""; }, 250);
    });
  }

  updateTable();              // birinchi marta to'ldirish
  setInterval(updateTable, 3200); // har 3.2s o'zgaradi
})();
