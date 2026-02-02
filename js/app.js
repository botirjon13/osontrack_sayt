// ===== Helpers =====
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const $  = (sel, root=document) => root.querySelector(sel);

(function initBurger(){
  const burger = $("[data-burger]");
  const menu = $("[data-menu]");
  if (!burger || !menu) return;

  burger.addEventListener("click", ()=>{
    menu.classList.toggle("open");
  });
})();

// ===== Kinetic title: word-by-word wrapping =====
(function kineticTitle(){
  const el = $("[data-ktitle]");
  if (!el) return;

  // If user prefers reduced motion: don't wrap
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const text = el.textContent.trim().replace(/\s+/g, " ");
  const words = text.split(" ");

  el.textContent = "";
  const frag = document.createDocumentFragment();

  words.forEach((w, i)=>{
    const span = document.createElement("span");
    span.className = "kword";
    span.style.setProperty("--d", `${140 + i * 42}ms`);
    span.textContent = w;
    frag.appendChild(span);
    frag.appendChild(document.createTextNode(" "));
  });

  el.appendChild(frag);
})();

// ===== Scroll reveal =====
(function globalReveal(){
  const nodes = $$(".reveal");
  if (!nodes.length) return;

  // reduced motion -> show all
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    nodes.forEach(n=>n.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  nodes.forEach(n=>io.observe(n));
})();

// ===== Demo form: placeholder submit (replace with API later) =====
(function leadForm(){
  const form = $("#leadForm");
  const msg = $("#formMsg");
  if (!form || !msg) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    msg.textContent = "✅ So‘rov qabul qilindi. Xodimimiz tez orada bog‘lanadi.";
    msg.style.color = "rgba(231,255,244,.95)";
    form.reset();
  });
})();

// ===== KPI animation =====
(function initDashboardPreviewKpis(){
  const nodes = $$("[data-kpi]");
  if (!nodes.length) return;

  const fmtMoney = (n) => {
    const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return s + " so‘m";
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
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const cur = from + (target - from) * eased;
      node.textContent = formatValue(node, cur);

      if (p < 1) requestAnimationFrame(tick);
      else {
        node.classList.remove("up");
        void node.offsetWidth;
        node.classList.add("up");
      }
    };
    requestAnimationFrame(tick);
  }

  const ranges = {
    sales:  [ 1200000,  9800000],
    profit: [  180000,  1900000],
    stock:  [      65,      980],
  };

  function nextTarget(key, prev){
    const [min, max] = ranges[key] || [0, 100];
    const wiggle = (max - min) * 0.12;
    const base = (prev && !Number.isNaN(prev)) ? prev : (min + (max-min)*0.4);
    const raw = base + (Math.random()*2 - 1) * wiggle;
    return Math.max(min, Math.min(max, raw));
  }

  nodes.forEach(n=>{
    const key = n.dataset.kpi;
    const initial = nextTarget(key, null);
    animateTo(n, initial, 850);
  });

  setInterval(()=>{
    nodes.forEach(n=>{
      const key = n.dataset.kpi;
      const prev = Number(n.dataset.value || "0");
      const target = nextTarget(key, prev);
      animateTo(n, target, 900);
    });
  }, 2600);
})();

// ===== Products table (universal names) =====
(function initPreviewProducts(){
  const table = document.getElementById("previewTable");
  if (!table) return;

  const rows = $$(".row[data-row]", table);
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

      const stock = Math.floor(20 + Math.random()*980);
      const sold  = Math.floor(1 + Math.random()*120);

      if (nameEl)  nameEl.textContent  = names[idx] || "Mahsulot";
      if (stockEl) stockEl.textContent = fmtInt(stock);
      if (soldEl)  soldEl.textContent  = fmtInt(sold);

      row.style.transition = "background .25s ease";
      row.style.background = "rgba(53,208,127,.06)";
      setTimeout(()=>{ row.style.background = ""; }, 250);
    });
  }

  updateTable();
  setInterval(updateTable, 3200);
})();
