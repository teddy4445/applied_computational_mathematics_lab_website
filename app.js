
/* Orphan Socks landing page + calculator
   - Scroll reveal
   - Lightbox zoom for images
   - Interactive "drawer" calculator using feature-based mismatch:
       η = (# differing features)/3 ; ξ = 1 − η
   - Policies (interpretable):
       Purist: choose η=0 pairs only (if exists)
       Greedy: max ξ
       ThresholdMix: if any ξ >= τξ choose max ξ among those; else max ξ overall
       OrphanRescue: pick sock with minimal degree under ξ>=τξ, then pair with best ξ
       Exposure-Aware Greedy: max (ξ − ρ·χ·g(η))   (uses expected exposure ρ)
*/

(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (x, d=2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

  // ---------------------------
  // Reveal-on-scroll
  // ---------------------------
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) e.target.classList.add('on');
  }, {threshold: 0.12});
  revealEls.forEach(el => io.observe(el));

  // ---------------------------
  // Lightbox for images
  // ---------------------------
  const lightbox = $('lightbox');
  const lightboxImg = $('lightboxImg');
  const closeBtn = $('lightboxClose');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest('img.clickable');
    if (img) openLightbox(img.src, img.alt);
  });
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  // ---------------------------
  // Gallery builder (deck slides)
  // ---------------------------
  const gallery = $('snapGallery');
  const caps = [
    "1) The missing sock problem as a data story",
    "2) Scale: market + volume",
    "3) Paired garment vulnerability",
    "4) Social cost + Red Sneakers Effect",
    "5) Model variables (ρ, χ, θ, d)",
    "6) Human heterogeneity",
    "7) Four strategies",
    "8) Strict matching illusion",
    "9) Stranded capacity",
    "10) Threshold‑Mix sweet spot",
    "11) Durable socks + strict matching = waste",
    "12) Retail interventions",
    "13) Intentional mismatch framing",
    "14) Morning heuristic",
    "15) Closing: circular fashion starts at home",
  ];

  if (gallery) {
    for (let i = 1; i <= 15; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'snapItem';
      const img = document.createElement('img');
      img.src = `assets/deck_${String(i).padStart(2,'0')}.png`;
      img.alt = `Deck slide ${i}`;
      img.className = 'clickable';
      const cap = document.createElement('div');
      cap.className = 'snapCap';
      cap.textContent = caps[i-1] || `Slide ${i}`;
      wrap.appendChild(img);
      wrap.appendChild(cap);
      gallery.appendChild(wrap);
    }
  }

  // ---------------------------
  // Calculator
  // ---------------------------
  const FEATURES = {
    color: [
      "Black", "White", "Gray", "Navy", "Blue", "Green", "Red", "Orange",
      "Yellow", "Pink", "Purple", "Brown", "Teal", "Beige"
    ],
    pattern: [
      "Solid", "Stripes", "Dots", "Argyle", "Checkered", "Abstract", "Novelty"
    ],
    length: [
      "Ankle", "Crew", "Knee‑high"
    ]
  };

  const drawer = []; // {id, color, pattern, length}

  function seedSelect(id, options) {
    const sel = $(id);
    if (!sel) return;
    sel.innerHTML = "";
    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      sel.appendChild(o);
    }
  }

  seedSelect('color', FEATURES.color);
  seedSelect('pattern', FEATURES.pattern);
  seedSelect('length', FEATURES.length);

  const policyEl = $('policy');
  const tauXiEl = $('tauXi');
  const tauXiVal = $('tauXiVal');
  const rhoEl = $('rho');
  const rhoVal = $('rhoVal');
  const chiEl = $('chi');
  const chiVal = $('chiVal');
  const gshapeEl = $('gshape');
  const tauGWrap = $('tauGWrap');
  const tauGEl = $('tauG');
  const tauGVal = $('tauGVal');

  const drawerList = $('drawerList');
  const addSockBtn = $('addSock');
  const randomDrawerBtn = $('randomDrawer');
  const resetDrawerBtn = $('resetDrawer');

  const resultTitle = $('resultTitle');
  const resultBody = $('resultBody');

  const pairTable = $('pairTable');
  const pairTBody = pairTable?.querySelector('tbody');

  function clamp01(x){ return Math.max(0, Math.min(1, x)); }

  function g(eta) {
    const shape = gshapeEl.value;
    eta = clamp01(eta);
    if (shape === 'linear') return eta;
    if (shape === 'quad') return eta * eta;
    // threshold
    const tau = parseFloat(tauGEl.value);
    return eta >= tau ? 1 : 0;
  }

  function mismatch(a, b) {
    // normalized Hamming over 3 features
    let diff = 0;
    if (a.color !== b.color) diff++;
    if (a.pattern !== b.pattern) diff++;
    if (a.length !== b.length) diff++;
    return diff / 3;
  }

  function compat(a, b) {
    return 1 - mismatch(a, b);
  }

  function scoreExposureAware(a, b) {
    const rho = parseFloat(rhoEl.value);
    const chi = parseFloat(chiEl.value);
    const eta = mismatch(a, b);
    const xi = 1 - eta;
    return xi - (rho * chi * g(eta));
  }

  function renderDrawer() {
    if (!drawerList) return;
    drawerList.innerHTML = "";

    if (drawer.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'mini';
      empty.textContent = "No socks yet. Add a sock, or click “Random drawer”.";
      drawerList.appendChild(empty);
      return;
    }

    for (const s of drawer) {
      const row = document.createElement('div');
      row.className = 'sockRow';

      const badge = document.createElement('div');
      badge.className = 'sockBadge';
      badge.innerHTML = `<span class="sockSwatch" aria-hidden="true"></span><span><b>Sock ${s.id}</b></span>`;

      const c = document.createElement('div'); c.textContent = s.color;
      const p = document.createElement('div'); p.textContent = s.pattern;
      const l = document.createElement('div'); l.textContent = s.length;

      const del = document.createElement('button');
      del.className = 'btn small ghost';
      del.type = 'button';
      del.textContent = 'Remove';
      del.addEventListener('click', () => {
        const idx = drawer.findIndex(x => x.id === s.id);
        if (idx >= 0) drawer.splice(idx, 1);
        recompute();
      });

      row.appendChild(badge);
      row.appendChild(c);
      row.appendChild(p);
      row.appendChild(l);
      row.appendChild(del);

      drawerList.appendChild(row);
    }
  }

  function allPairs() {
    const pairs = [];
    for (let i = 0; i < drawer.length; i++) {
      for (let j = i+1; j < drawer.length; j++) {
        const a = drawer[i], b = drawer[j];
        const eta = mismatch(a,b);
        const xi = 1 - eta;
        pairs.push({a, b, eta, xi, scoreEA: scoreExposureAware(a,b)});
      }
    }
    return pairs;
  }

  function choosePair(policy) {
    const pairs = allPairs();
    if (pairs.length === 0) return {best:null, pairs:[]};

    const tauXi = parseFloat(tauXiEl.value);

    if (policy === 'purist') {
      const ok = pairs.filter(p => p.eta === 0);
      if (ok.length === 0) return {best:null, pairs};
      ok.sort((x,y) => y.xi - x.xi);
      return {best: ok[0], pairs};
    }

    if (policy === 'greedy') {
      pairs.sort((x,y) => y.xi - x.xi);
      return {best: pairs[0], pairs};
    }

    if (policy === 'thresholdmix') {
      const good = pairs.filter(p => p.xi >= tauXi);
      if (good.length > 0) {
        good.sort((x,y) => y.xi - x.xi);
        return {best: good[0], pairs};
      }
      pairs.sort((x,y) => y.xi - x.xi);
      return {best: pairs[0], pairs};
    }

    if (policy === 'orphanrescue') {
      // degree under threshold: how many partners each sock has with xi >= tauXi
      const deg = new Map(drawer.map(s => [s.id, 0]));
      for (const p of pairs) {
        if (p.xi >= tauXi) {
          deg.set(p.a.id, deg.get(p.a.id)+1);
          deg.set(p.b.id, deg.get(p.b.id)+1);
        }
      }
      // choose sock with minimal degree; tie-break by minimal total degree then by id
      let target = drawer[0];
      for (const s of drawer) {
        if (deg.get(s.id) < deg.get(target.id)) target = s;
      }
      // pair it with partner maximizing xi
      const candidates = pairs.filter(p => p.a.id === target.id || p.b.id === target.id);
      candidates.sort((x,y) => y.xi - x.xi);
      return {best: candidates[0], pairs};
    }

    if (policy === 'exposuregreedy') {
      pairs.sort((x,y) => y.scoreEA - x.scoreEA);
      return {best: pairs[0], pairs};
    }

    // fallback
    pairs.sort((x,y) => y.xi - x.xi);
    return {best: pairs[0], pairs};
  }

  function renderPairTable(pairs, best) {
    if (!pairTBody) return;
    pairTBody.innerHTML = "";
    const policy = policyEl.value;

    // sort display based on selected policy
    const sorted = [...pairs];
    if (policy === 'exposuregreedy') sorted.sort((x,y) => y.scoreEA - x.scoreEA);
    else sorted.sort((x,y) => y.xi - x.xi);

    for (const p of sorted.slice(0, 8)) {
      const tr = document.createElement('tr');
      if (best && p.a.id === best.a.id && p.b.id === best.b.id) tr.classList.add('highlight');

      const score = (policy === 'exposuregreedy')
        ? p.scoreEA
        : (policy === 'thresholdmix' || policy === 'greedy' || policy === 'purist' || policy === 'orphanrescue')
          ? p.xi
          : p.xi;

      tr.innerHTML = `
        <td>S${p.a.id} + S${p.b.id}</td>
        <td>${fmt(p.eta, 2)}</td>
        <td>${fmt(p.xi, 2)}</td>
        <td>${fmt(score, 3)}</td>
      `;
      pairTBody.appendChild(tr);
    }
  }

  function recompute() {
    // sync labels
    tauXiVal.textContent = fmt(parseFloat(tauXiEl.value), 2);
    rhoVal.textContent = fmt(parseFloat(rhoEl.value), 2);
    chiVal.textContent = fmt(parseFloat(chiEl.value), 2);
    tauGVal.textContent = fmt(parseFloat(tauGEl.value), 2);

    // show/hide tauG
    tauGWrap.style.display = (gshapeEl.value === 'thresh') ? 'block' : 'none';

    renderDrawer();

    const {best, pairs} = choosePair(policyEl.value);
    renderPairTable(pairs, best);

    if (drawer.length < 2) {
      resultTitle.textContent = "Recommendation: —";
      resultBody.textContent = "Add at least two socks to get a recommendation.";
      return;
    }

    if (!best) {
      resultTitle.textContent = "Recommendation: No valid pair 😅";
      if (policyEl.value === 'purist') {
        resultBody.textContent = "Under Purist (strict identical matching), you currently have no identical pairs. Try Threshold‑Mix or add more similar socks.";
      } else {
        resultBody.textContent = "No valid pair under the chosen policy. Try lowering τξ or switching policy.";
      }
      return;
    }

    const eta = best.eta;
    const xi = best.xi;
    const policy = policyEl.value;

    let explain = "";
    if (policy === 'thresholdmix') {
      const tauXi = parseFloat(tauXiEl.value);
      explain = (xi >= tauXi)
        ? `Meets the “good enough” threshold (ξ ≥ τξ).`
        : `No pair meets τξ, so the policy picks the best available pair anyway.`;
    } else if (policy === 'exposuregreedy') {
      const sc = best.scoreEA;
      explain = `Maximizes ξ − ρ·χ·g(η). Score = ${fmt(sc, 3)}.`;
    } else if (policy === 'greedy') {
      explain = `Maximizes compatibility ξ (best-looking pair today).`;
    } else if (policy === 'orphanrescue') {
      explain = `Rescues an “at-risk” sock (few acceptable partners) to reduce stranding.`;
    } else {
      explain = `Strict identical matching only (η = 0).`;
    }

    resultTitle.textContent = `Recommendation: wear Sock ${best.a.id} + Sock ${best.b.id}`;
    resultBody.textContent = `Mismatch η=${fmt(eta,2)}, compatibility ξ=${fmt(xi,2)}. ${explain}`;
  }

  function addSock(color, pattern, length) {
    const nextId = (drawer.reduce((m,s) => Math.max(m, s.id), 0) + 1);
    drawer.push({id: nextId, color, pattern, length});
  }

  function resetDrawer() {
    drawer.splice(0, drawer.length);
    // A mostly-matchable starting set + a couple “fun” socks
    addSock("Navy", "Solid", "Crew");
    addSock("Navy", "Solid", "Crew");
    addSock("Gray", "Stripes", "Crew");
    addSock("Gray", "Stripes", "Crew");
    addSock("Black", "Solid", "Ankle");
    addSock("Black", "Solid", "Ankle");
    addSock("Red", "Novelty", "Crew");
    addSock("Green", "Novelty", "Crew");
  }

  function randomDrawer() {
    drawer.splice(0, drawer.length);
    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const n = 8 + Math.floor(Math.random()*5); // 8-12 socks
    for (let i=0;i<n;i++){
      addSock(pick(FEATURES.color), pick(FEATURES.pattern), pick(FEATURES.length));
    }
  }

  // events
  addSockBtn?.addEventListener('click', () => {
    addSock($('color').value, $('pattern').value, $('length').value);
    recompute();
  });

  randomDrawerBtn?.addEventListener('click', () => { randomDrawer(); recompute(); });
  resetDrawerBtn?.addEventListener('click', () => { resetDrawer(); recompute(); });

  [policyEl, tauXiEl, rhoEl, chiEl, gshapeEl, tauGEl].forEach(el => el?.addEventListener('input', recompute));
  gshapeEl?.addEventListener('change', recompute);

  // init
  resetDrawer();
  recompute();
})();
