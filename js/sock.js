/* Sock page interactions:
   - Navbar mobile menu + scroll background
   - Reveal-on-scroll
   - Slides carousel (15 slides) + lightbox
   - Sock-drawer calculator
*/

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // -----------------------------
  // Navbar: mobile menu + scrolled style
  // -----------------------------
  function initNavbar() {
    const navbar = $('#navbar');
    const menuBtn = $('#menu-btn');
    const mobileMenu = $('#mobile-menu');

    if (menuBtn && mobileMenu) {
      let open = false;
      const setOpen = (v) => {
        open = v;
        if (open) {
          mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
        } else {
          mobileMenu.style.maxHeight = '0px';
        }
      };
      setOpen(false);

      menuBtn.addEventListener('click', () => setOpen(!open));

      // close on click
      $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setOpen(false)));

      // resize safety
      window.addEventListener('resize', () => {
        if (!open) mobileMenu.style.maxHeight = '0px';
        else mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
      });
    }

    const onScroll = () => {
      if (!navbar) return;
      if (window.scrollY > 12) navbar.classList.add('nav-scrolled');
      else navbar.classList.remove('nav-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  }

  // -----------------------------
  // Reveal
  // -----------------------------
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      }, { threshold: 0.12 });

      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => el.classList.add('is-visible'));
    }
  }

  // -----------------------------
  // Slides carousel + lightbox
  // -----------------------------
  function pad2(n){ return String(n).padStart(2,'0'); }

  function initLightbox(state) {
    const lb = $('#lightbox');
    const lbImg = $('#lightboxImg');
    const btnClose = $('#lbClose');
    const btnPrev = $('#lbPrev');
    const btnNext = $('#lbNext');

    if (!lb || !lbImg) return;

    const open = (idx) => {
      state.active = idx;
      const src = state.slides[idx]?.src;
      if (!src) return;
      lbImg.src = src;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      syncNav();
    };

    const close = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    };

    const prev = () => {
      if (state.active <= 0) return;
      open(state.active - 1);
    };

    const next = () => {
      if (state.active >= state.slides.length - 1) return;
      open(state.active + 1);
    };

    const syncNav = () => {
      if (btnPrev) btnPrev.disabled = state.active <= 0;
      if (btnNext) btnNext.disabled = state.active >= state.slides.length - 1;
    };

    btnClose?.addEventListener('click', close);
    btnPrev?.addEventListener('click', prev);
    btnNext?.addEventListener('click', next);

    lb.addEventListener('click', (e) => {
      if (e.target === lb) close();
    });

    window.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    state.openLightbox = open;
  }

  function initCarousel() {
    const track = $('#slidesTrack');
    const dots = $('#slidesDots');
    const btnPrev = $('#slidesPrev');
    const btnNext = $('#slidesNext');

    if (!track || !dots) return;

    const count = parseInt(track.getAttribute('data-count') || '15', 10);
    const template = track.getAttribute('data-src-template') || '/assets/deck_{NN}.png';

    const state = {
      slides: [],
      active: 0,
      openLightbox: null,
    };

    // Build slides
    const frag = document.createDocumentFragment();
    for (let i=1; i<=count; i++) {
      const nn = pad2(i);
      const src = template.replace('{NN}', nn);
      const fig = document.createElement('figure');
      fig.className = 'carousel-slide bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 cursor-zoom-in';
      fig.setAttribute('data-idx', String(i-1));
      fig.innerHTML = `
        <img src="${src}" alt="Slide ${nn}" loading="lazy" class="w-full h-auto" />
      `;

      const img = fig.querySelector('img');
      img.addEventListener('error', () => {
        fig.innerHTML = `
          <div class="p-10 text-center text-gray-500 font-medium">
            Slide image missing: <span class="font-mono">${src}</span>
          </div>
        `;
      });

      fig.addEventListener('click', () => {
        state.openLightbox?.(i-1);
      });

      state.slides.push({src});
      frag.appendChild(fig);
    }
    track.appendChild(frag);

    // Build dots
    dots.innerHTML = '';
    for (let i=0; i<count; i++) {
      const b = document.createElement('button');
      b.className = 'carousel-dot';
      b.type = 'button';
      b.setAttribute('aria-label', `Go to slide ${i+1}`);
      b.setAttribute('aria-current', i===0 ? 'true' : 'false');
      b.addEventListener('click', () => scrollToIndex(i));
      dots.appendChild(b);
    }

    initLightbox(state);

    function slideWidth() {
      // Use first child width + gap
      const first = track.children[0];
      if (!first) return track.clientWidth;
      const rect = first.getBoundingClientRect();
      // gap is 16px in CSS
      return rect.width + 16;
    }

    function scrollToIndex(i) {
      const w = slideWidth();
      track.scrollTo({ left: i * w, behavior: 'smooth' });
    }

    function setActive(i) {
      state.active = i;
      const all = $$('.carousel-dot', dots);
      all.forEach((d, idx) => d.setAttribute('aria-current', idx===i ? 'true' : 'false'));
      btnPrev && (btnPrev.disabled = i <= 0);
      btnNext && (btnNext.disabled = i >= count - 1);
    }

    function calcActiveFromScroll() {
      const w = slideWidth();
      const i = Math.round(track.scrollLeft / w);
      return Math.min(count - 1, Math.max(0, i));
    }

    let raf = null;
    track.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(calcActiveFromScroll()));
    }, {passive:true});

    btnPrev?.addEventListener('click', () => scrollToIndex(Math.max(0, state.active - 1)));
    btnNext?.addEventListener('click', () => scrollToIndex(Math.min(count - 1, state.active + 1)));

    // initial
    setActive(0);
  }

  // -----------------------------
  // Calculator: sock drawer
  // -----------------------------

  const STORAGE_KEY = 'sockDrawer.v1';

  function clamp01(x){ return Math.min(1, Math.max(0, x)); }

  function hexToRgb(hex){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return {r:148,g:163,b:184};
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }

  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    const d=max-min;
    if (d!==0){
      s = d / (1 - Math.abs(2*l - 1));
      switch(max){
        case r: h=((g-b)/d)%6; break;
        case g: h=(b-r)/d + 2; break;
        case b: h=(r-g)/d + 4; break;
      }
      h*=60;
      if (h<0) h+=360;
    }
    return {h,s,l};
  }

  function colorSimilarity(hexA, hexB){
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const ha = rgbToHsl(a.r,a.g,a.b);
    const hb = rgbToHsl(b.r,b.g,b.b);

    const dhRaw = Math.abs(ha.h - hb.h);
    const dh = Math.min(dhRaw, 360 - dhRaw) / 180; // 0..1
    const ds = Math.abs(ha.s - hb.s);
    const dl = Math.abs(ha.l - hb.l);
    const dist = Math.sqrt(dh*dh + ds*ds + dl*dl) / Math.sqrt(3);
    return clamp01(1 - dist);
  }

  function patternSimilarity(a,b){
    if (a===b) return 1;
    const simple = new Set(['solid','striped','dotted']);
    if (simple.has(a) && simple.has(b)) return 0.65;
    if (a==='graphic' || b==='graphic') return 0.4;
    return 0.5;
  }

  function lengthSimilarity(a,b){
    if (a===b) return 1;
    const order = ['ankle','crew','knee'];
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia<0 || ib<0) return 0.6;
    const d = Math.abs(ia-ib);
    if (d===1) return 0.75;
    return 0.35;
  }

  function xiEta(s1,s2){
    const c = colorSimilarity(s1.color, s2.color);
    const p = patternSimilarity(s1.pattern, s2.pattern);
    const l = lengthSimilarity(s1.length, s2.length);

    const xi = clamp01(0.60*c + 0.25*p + 0.15*l);
    const eta = clamp01(1 - xi);
    return {xi, eta, parts:{color:c, pattern:p, length:l}};
  }

  function g(eta, shape, tau){
    eta = clamp01(eta);
    if (shape === 'quad') return eta*eta;
    if (shape === 'thresh') return eta >= tau ? 1 : 0;
    return eta; // linear
  }

  function choosePair(socks, params){
    const n = socks.length;
    if (n < 2) return {ok:false, reason:'Add at least two socks to your drawer.'};

    // list all pairs
    const pairs = [];
    for (let i=0; i<n; i++){
      for (let j=i+1; j<n; j++){
        const m = xiEta(socks[i], socks[j]);
        const penalty = params.rho * params.chi * g(m.eta, params.gShape, params.tau);
        const score = m.xi - penalty;
        pairs.push({i,j, ...m, penalty, score});
      }
    }

    const policy = params.policy;

    if (policy === 'purist'){
      // exact match: same features and exact same color
      const exact = pairs.filter(p => {
        const a=socks[p.i], b=socks[p.j];
        return a.color.toLowerCase()===b.color.toLowerCase() && a.pattern===b.pattern && a.length===b.length;
      });
      if (!exact.length) return {ok:false, reason:'Purist policy found no identical pair today → sockless day.'};
      // if multiple identical pairs, take the first
      exact.sort((x,y) => y.xi - x.xi);
      return {ok:true, pick: exact[0], note:'Purist only allows identical matches.'};
    }

    if (policy === 'greedy'){
      pairs.sort((a,b) => b.xi - a.xi);
      return {ok:true, pick:pairs[0], note:'Greedy maximizes compatibility ξ and ignores exposure/social penalty.'};
    }

    if (policy === 'threshold_mix'){
      const feasible = pairs.filter(p => p.eta <= params.tau);
      if (feasible.length){
        feasible.sort((a,b) => b.xi - a.xi);
        return {ok:true, pick: feasible[0], note:`Threshold‑Mix: choose best ξ among pairs with η ≤ τ (${params.tau}).`};
      }
      pairs.sort((a,b) => a.eta - b.eta || b.xi - a.xi);
      return {ok:true, pick:pairs[0], note:`No pair meets η ≤ τ (${params.tau}); choosing the closest available pair.`};
    }

    if (policy === 'orphan_rescue'){
      // pick the "loneliest" sock (fewest close matches), then pair it with its closest partner.
      const tauR = params.rescueTau;
      const neighborCounts = socks.map((_, idx) => {
        let c=0;
        for (let j=0; j<n; j++){
          if (j===idx) continue;
          const m = idx < j ? pairs.find(p => p.i===idx && p.j===j) : pairs.find(p => p.i===j && p.j===idx);
          if (m && m.eta <= tauR) c++;
        }
        return c;
      });

      const loneliest = neighborCounts
        .map((c,idx)=>({c,idx}))
        .sort((a,b)=>a.c-b.c)[0].idx;

      const candidates = pairs.filter(p => p.i===loneliest || p.j===loneliest);
      candidates.sort((a,b) => a.eta - b.eta || b.xi - a.xi);
      return {ok:true, pick:candidates[0], note:`Orphan‑Rescue: start with the loneliest sock and match it as closely as possible (τᵣ=${tauR}).`};
    }

    // exposure-aware greedy (default)
    pairs.sort((a,b) => b.score - a.score);
    return {ok:true, pick:pairs[0], note:'Exposure‑Aware Greedy: maximize ξ − ρ·χ·g(η).'};
  }

  function initCalculator(){
    const root = $('#calculator');
    if (!root) return;

    // elements
    const sockColor = $('#sockColor');
    const sockPattern = $('#sockPattern');
    const sockLength = $('#sockLength');
    const addSockBtn = $('#addSock');
    const addRandomBtn = $('#addRandom');
    const clearSocksBtn = $('#clearSocks');

    const listEl = $('#sockList');

    const policyEl = $('#policy');
    const policyHint = $('#policyHint');

    const rho = $('#rho');
    const rhoN = $('#rhoN');
    const chi = $('#chi');
    const chiN = $('#chiN');

    const gShape = $('#gShape');
    const tau = $('#tau');
    const tauN = $('#tauN');

    const rescueTau = $('#rescueTau');
    const rescueTauN = $('#rescueTauN');

    const computeBtn = $('#computePair');

    const outTitle = $('#outTitle');
    const outDetails = $('#outDetails');
    const outWhy = $('#outWhy');

    if (!listEl || !policyEl) return;

    let socks = [];

    const policyHints = {
      'threshold_mix': 'Wear “close enough” pairs (η ≤ τ). If nothing fits, pick the closest pair.',
      'exposure_greedy': 'Maximize ξ − ρ·χ·g(η): compatibility minus expected social penalty.',
      'greedy': 'Always pick the most compatible pair, regardless of exposure or sensitivity.',
      'purist': 'Only identical socks count. No identical pair → sockless day.',
      'orphan_rescue': 'Start with the “loneliest” sock and find its closest partner (eco-friendly, can be socially bold).'
    };

    function save(){
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(socks)); }catch{}
    }
    function load(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) socks = JSON.parse(raw) || [];
      }catch{ socks=[]; }
    }

    function render(){
      listEl.innerHTML = '';
      if (!socks.length){
        listEl.innerHTML = `
          <div class="text-gray-600 text-sm">
            Your drawer is empty. Add socks below or generate a random set.
          </div>
        `;
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'flex flex-wrap gap-2';

      socks.forEach((s) => {
        const pill = document.createElement('div');
        pill.className = 'sock-pill';
        pill.innerHTML = `
          <span class="sock-swatch" style="--swatch:${s.color}"></span>
          <span class="text-sm font-semibold text-gray-800">${labelSock(s)}</span>
          <button class="ml-1 text-gray-500 hover:text-red-600" aria-label="Remove sock" title="Remove">
            <i class="ri-close-line"></i>
          </button>
        `;
        pill.querySelector('button').addEventListener('click', () => {
          socks = socks.filter(x => x.id !== s.id);
          save();
          render();
        });
        wrap.appendChild(pill);
      });

      listEl.appendChild(wrap);
    }

    function labelSock(s){
      const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
      return `${cap(s.length)} · ${cap(s.pattern)} · ${s.color.toUpperCase()}`;
    }

    function addSock(sock){
      socks.push(sock);
      save();
      render();
    }

    function randSock(){
      const colors = ['#2563EB','#7C3AED','#10B981','#F97316','#EF4444','#0EA5E9','#111827','#F59E0B','#EC4899'];
      const patterns = ['solid','striped','dotted','argyle','graphic'];
      const lengths = ['ankle','crew','knee'];
      const pick = (a) => a[Math.floor(Math.random()*a.length)];
      return {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
        color: pick(colors),
        pattern: pick(patterns),
        length: pick(lengths)
      };
    }

    function syncRangeNumber(rangeEl, numEl, onChange){
      const fromRange = () => { numEl.value = rangeEl.value; onChange(); };
      const fromNum = () => {
        const min = parseFloat(numEl.min);
        const max = parseFloat(numEl.max);
        let v = parseFloat(numEl.value);
        if (!isFinite(v)) v = min;
        v = Math.min(max, Math.max(min, v));
        numEl.value = v;
        rangeEl.value = String(v);
        onChange();
      };
      rangeEl.addEventListener('input', fromRange);
      numEl.addEventListener('input', fromNum);
    }

    function updatePolicyUI(){
      policyHint.textContent = policyHints[policyEl.value] || '';
      const showTau = policyEl.value === 'threshold_mix' || policyEl.value === 'exposure_greedy';
      const showRescueTau = policyEl.value === 'orphan_rescue';
      $('#tauWrap').style.display = showTau ? 'block' : 'none';
      $('#rescueTauWrap').style.display = showRescueTau ? 'block' : 'none';
      $('#gWrap').style.display = (policyEl.value === 'exposure_greedy') ? 'block' : 'none';
    }

    function compute(){
      const params = {
        policy: policyEl.value,
        rho: parseFloat(rho.value),
        chi: parseFloat(chi.value),
        gShape: gShape.value,
        tau: parseFloat(tau.value),
        rescueTau: parseFloat(rescueTau.value)
      };

      const res = choosePair(socks, params);
      if (!res.ok){
        outTitle.textContent = res.reason;
        outDetails.innerHTML = '';
        outWhy.textContent = '';
        return;
      }

      const p = res.pick;
      const a = socks[p.i];
      const b = socks[p.j];

      const fmt = (x, d=3) => Number(x).toFixed(d);

      outTitle.innerHTML = `Recommended: <span class="font-semibold">${labelSock(a)}</span> + <span class="font-semibold">${labelSock(b)}</span>`;
      outDetails.innerHTML = `
        <div class="grid sm:grid-cols-4 gap-3 mt-3">
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div class="text-xs text-gray-600 font-medium">Compatibility ξ</div>
            <div class="text-xl font-bold">${fmt(p.xi,3)}</div>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div class="text-xs text-gray-600 font-medium">Mismatch η</div>
            <div class="text-xl font-bold">${fmt(p.eta,3)}</div>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div class="text-xs text-gray-600 font-medium">Expected penalty</div>
            <div class="text-xl font-bold">${fmt(p.penalty,3)}</div>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div class="text-xs text-gray-600 font-medium">Score</div>
            <div class="text-xl font-bold">${fmt(p.score,3)}</div>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 font-medium">
          <span class="sock-pill"><span class="sock-mini" style="--swatch:${a.color}"></span> A: ${a.pattern}, ${a.length}</span>
          <span class="sock-pill"><span class="sock-mini" style="--swatch:${b.color}"></span> B: ${b.pattern}, ${b.length}</span>
        </div>
      `;
      outWhy.textContent = res.note;
    }

    // wire events
    load();
    render();

    addSockBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      addSock({
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
        color: sockColor.value || '#2563EB',
        pattern: sockPattern.value,
        length: sockLength.value
      });
    });

    addRandomBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const k = 6;
      for (let i=0;i<k;i++) addSock(randSock());
    });

    clearSocksBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      socks = [];
      save();
      render();
      outTitle.textContent = 'Add socks to your drawer to start.';
      outDetails.innerHTML = '';
      outWhy.textContent = '';
    });

    policyEl.addEventListener('change', () => {
      updatePolicyUI();
      compute();
    });

    syncRangeNumber(rho, rhoN, compute);
    syncRangeNumber(chi, chiN, compute);
    syncRangeNumber(tau, tauN, compute);
    syncRangeNumber(rescueTau, rescueTauN, compute);

    gShape.addEventListener('change', compute);

    computeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      compute();
    });

    updatePolicyUI();

    // auto run once if drawer already contains socks
    if (socks.length >= 2) compute();
    else {
      outTitle.textContent = 'Add socks to your drawer to start.';
    }
  }

  // -----------------------------
  // Boot
  // -----------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initReveal();
    initCarousel();
    initCalculator();
  });
})();
