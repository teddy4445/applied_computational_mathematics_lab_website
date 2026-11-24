/* Interactive labs of the Epidemic Modeling course (epidemic-modeling/module-NN/, made by tools/build_epi_course.py).
   One file; each lab starts only when its root element ([data-epx="..."]) is on the page.
   Markup: tools/templates/epi-lab-*.html. Styles: css/exploration-lab.css + css/rl-labs.css + css/epi-course.css.
   Everything runs in the browser; numbers shown come from the visitor's own runs. */
(function () {
  'use strict';

  var C = { blue: '#2563eb', navy: '#1e3a8a', orange: '#d55e00', green: '#009e73', grey: '#94a3b8', amber: '#d97706', ink: '#111827', muted: '#64748b', purple: '#7c3aed', teal: '#0f766e' };
  var FONT = 'Inter, system-ui, sans-serif';

  // ------------------------------------------------------------------ helpers
  function q(root, k) { return root.querySelector('[data-k="' + k + '"]'); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(el, text) { if (el) el.textContent = text; }
  function html(el, s) { if (el) el.innerHTML = s; }
  function pct(x, d) { if (!isFinite(x)) return '–'; var v = x * 100; d = d === undefined ? (v < 10 ? 1 : 0) : d; return v.toFixed(d) + '%'; }

  // ------------------------------------------------------------------ SVG line chart, re-drawn at the element's real size
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) { es.forEach(function (e) { paint(e.target); }); }) : null;
  var painted = [];
  if (!ro) window.addEventListener('resize', function () { painted.forEach(paint); });
  function render(svg, fn) {
    if (!svg) return;
    svg._draw = fn;
    if (!svg._seen) { svg._seen = true; if (ro) ro.observe(svg); else painted.push(svg); }
    paint(svg);
  }
  function paint(svg) {
    if (!svg._draw) return;
    var W = Math.max(220, svg.clientWidth || 560), H = Math.max(140, svg.clientHeight || 230);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = svg._draw(W, H);
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (o.anchor || 'middle') + '" fill="' + (o.fill || C.muted) + '" font-size="' + (o.size || 11) +
      '" font-family="' + FONT + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.halo ? ' stroke="#ffffff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' : '') + (o.rotate ? ' transform="rotate(-90 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"' : '') + '>' + esc(s) + '</text>';
  }
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) hi = lo + 1;
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, t = [];
    for (var v = a; v <= b + step * 1e-6; v += step) t.push(+v.toFixed(10));
    return { lo: a, hi: b, ticks: t };
  }
  /* o: {series:[{y, color, width?, dash?, start?}], yMax?, length?, yFormat?, xLabel?, yLabel?, marks?:[{x, label}]} ; x is the index (day), shifted by start; length fixes the x range */
  function lineChart(o, W, H) {
    var pl = o.yLabel ? 60 : 48, pr = 14, pt = 14, pb = o.xLabel ? 40 : 26, iw = W - pl - pr, ih = H - pt - pb, out = [];
    var S = (o.series || []).filter(function (s) { return s.y && s.y.length; });
    if (!S.length) return txt(W / 2, H / 2, 'Nothing to show yet', { size: 13 });
    var n = 0, ymax = 0;
    S.forEach(function (s) { n = Math.max(n, s.y.length + (s.start || 0)); s.y.forEach(function (v) { if (v > ymax) ymax = v; }); });
    if (o.length) n = Math.max(n, o.length);
    if (o.yMax !== undefined) ymax = o.yMax;
    var nt = niceTicks(0, ymax > 0 ? ymax : 1, 4);
    var Y = function (v) { return pt + ih * (1 - v / nt.hi); }, X = function (x) { return pl + iw * x / Math.max(1, n - 1); };
    nt.ticks.forEach(function (v) {
      var y = Y(v);
      out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>');
      out.push(txt(pl - 8, y + 4, o.yFormat ? o.yFormat(v) : String(v), { anchor: 'end' }));
    });
    var xt = niceTicks(0, n - 1, Math.max(2, Math.min(6, Math.floor(iw / 80))));
    xt.ticks.forEach(function (v) { if (v <= n - 1) out.push(txt(X(v), H - pb + 16, String(v))); });
    out.push('<line x1="' + pl + '" x2="' + pl + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/>');
    out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/>');
    if (o.xLabel) out.push(txt(pl + iw / 2, H - 4, o.xLabel, { fill: '#475569' }));
    if (o.yLabel) out.push(txt(13, pt + ih / 2, o.yLabel, { fill: '#475569', rotate: true }));
    (o.marks || []).forEach(function (m) {
      var x = X(m.x).toFixed(1);
      out.push('<line x1="' + x + '" x2="' + x + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + (m.color || C.amber) + '" stroke-width="1.2" stroke-dasharray="3 3"/>');
      if (m.label) out.push(txt(+x + 4, pt + 11, m.label, { anchor: 'start', fill: m.color || C.amber, size: 11, weight: 700 }));
    });
    S.forEach(function (s) {
      var stride = Math.max(1, Math.floor(s.y.length / (iw * 1.5))), d = '';
      for (var i = 0; i < s.y.length; i++) {
        if (stride > 1 && i % stride && i !== s.y.length - 1) continue;
        d += (d ? 'L' : 'M') + X(i + (s.start || 0)).toFixed(1) + ' ' + Y(Math.min(s.y[i], nt.hi)).toFixed(1) + ' ';
      }
      out.push('<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + '/>');
    });
    return out.join('');
  }
  function chart(svg, o) { render(svg, function (W, H) { return lineChart(o, W, H); }); }

  // peaks at least `gap` days apart and higher than `minH` (the same rule as the course's Python runs)
  function peaks(xs, gap, minH) {
    var keep = [];
    for (var i = 1; i < xs.length - 1; i++) {
      if (!(xs[i] >= xs[i - 1] && xs[i] > xs[i + 1] && xs[i] > minH)) continue;
      if (keep.length && i - keep[keep.length - 1] < gap) { if (xs[i] > xs[keep[keep.length - 1]]) keep[keep.length - 1] = i; }
      else keep.push(i);
    }
    return keep;
  }

  // ================================================================== Module 2 · behaviour feedback
  /* SIR with protection p: transmission beta0 (1 - eff p). Fear: perceived risk P follows prevalence reported `lag` days late, with memory `mem` days;
     p = P / (P + half) (1 - F). Fatigue: dF/dt = phi p (1 - F) - rho F. Euler steps of dt = 0.05 day, the same scheme as production/explains/sims/epi_m02_sims.py. */
  var COURSE = { beta0: 0.3, gamma: 0.1, eff: 0.9, half: 0.0005, lag: 7, mem: 35, phi: 0.005, rho: 0.005, days: 540, I0: 1e-4, fear: true, fatigue: true };
  function behave(o) {
    var dt = 0.05, nStep = Math.round(1 / dt), S = 1 - o.I0, I = o.I0, P = 0, F = 0;
    var L = Math.round(o.lag / dt) + 1, hist = new Float64Array(L), h0 = 0, k;
    for (k = 0; k < L; k++) hist[k] = o.I0;
    var outI = [], outP = [], outF = [];
    function prot() { return o.fear ? P / (P + o.half) * (o.fatigue ? (1 - F) : 1) : 0; }
    for (var d = 0; d <= o.days; d++) {
      outI.push(I); outP.push(prot()); outF.push(F);
      for (k = 0; k < nStep; k++) {
        P += (hist[h0] - P) / o.mem * dt;
        var p = prot(), a = o.beta0 * (1 - o.eff * p) * S * I;
        S -= a * dt; I += (a - o.gamma * I) * dt;
        if (o.fear && o.fatigue) F += (o.phi * p * (1 - F) - o.rho * F) * dt;
        hist[h0] = I; h0 = (h0 + 1) % L;   // ring buffer: the oldest value is the one seen `lag` days late
      }
    }
    var pk = peaks(outI, 30, o.fear ? 3e-4 : 1e-3), imax = 0;
    for (k = 1; k < outI.length; k++) if (outI[k] > outI[imax]) imax = k;
    return { I: outI, p: outP, F: outF, final: 1 - S, peak: outI[imax], peakDay: imax, waves: pk, wavePeaks: pk.map(function (i) { return outI[i]; }) };
  }

  var MARK_OFF = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var MARK_ON = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function behaveLab(root) {
    var el = {}, ids = ['half', 'lag', 'mem', 'eff', 'phi', 'rho', 'fear', 'fatigue', 'ref'];
    ids.forEach(function (k) { el[k] = q(root, k); });
    var show = {
      half: function (v) { return (v * 100).toFixed(2) + '%'; }, lag: function (v) { return v + ' days'; }, mem: function (v) { return v + ' days'; },
      eff: function (v) { return Math.round(v * 100) + '%'; }, phi: function (v) { return v.toFixed(3); }, rho: function (v) { return v.toFixed(3); }
    };
    var noReact = null, last = null;
    function params() {
      return { beta0: COURSE.beta0, gamma: COURSE.gamma, I0: COURSE.I0, days: COURSE.days, half: +el.half.value, lag: +el.lag.value, mem: +el.mem.value, eff: +el.eff.value,
               phi: +el.phi.value, rho: +el.rho.value, fear: el.fear.checked, fatigue: el.fatigue.checked };
    }
    function load(p) {
      ['half', 'lag', 'mem', 'eff', 'phi', 'rho'].forEach(function (k) { el[k].value = p[k]; });
      el.fear.checked = p.fear; el.fatigue.checked = p.fatigue; run();
    }
    function run() {
      ['half', 'lag', 'mem', 'eff', 'phi', 'rho'].forEach(function (k) { set(q(root, k + '-out'), show[k](+el[k].value)); });
      el.fatigue.disabled = !el.fear.checked;
      var p = params(), r = behave(p); last = r;
      if (!noReact) noReact = behave(Object.assign({}, COURSE, { fear: false, fatigue: false }));
      set(q(root, 'peak'), pct(r.peak)); set(q(root, 'peakday'), 'day ' + r.peakDay); set(q(root, 'waves'), String(r.waves.length)); set(q(root, 'final'), pct(r.final));
      var w = r.waves.map(function (d, i) { return 'day ' + d + ' (' + pct(r.wavePeaks[i]) + ')'; });
      set(q(root, 'status'), (r.waves.length === 1 ? 'One wave, peaking on ' : r.waves.length + ' waves: ') + (r.waves.length === 1 ? w[0] : w.join(', ')) + '. ' +
          pct(r.final) + ' of the town infected by day ' + p.days + (p.fear ? '' : ' (nobody reacts)') + '.');
      var series = [{ y: r.I, color: p.fear && p.fatigue ? C.orange : p.fear ? C.blue : C.grey, width: 2.6 }];
      if (el.ref.checked) series.unshift({ y: noReact.I, color: C.grey, dash: '5 4', width: 1.8 });
      chart(q(root, 'chart'), { series: series, yFormat: function (v) { return +(v * 100).toFixed(2) + '%'; }, xLabel: 'day', yLabel: 'infected now',
                                 marks: r.waves.map(function (d, i) { return { x: d, label: 'wave ' + (i + 1), color: C.amber }; }) });
      chart(q(root, 'pchart'), { series: [{ y: r.p, color: C.green, width: 2.4 }, { y: r.F, color: C.navy, dash: '6 4', width: 2 }], yMax: 1,
                                  yFormat: function (v) { return Math.round(v * 100) + '%'; }, xLabel: 'day' });
      // challenges, checked on the current run
      var ch = [
        p.fear && r.peak < 0.01,
        p.fear && p.fatigue && r.waves.length >= 3,
        p.fear && p.fatigue && r.final < 0.25
      ];
      root.querySelectorAll('[data-ch]').forEach(function (li) {
        var ok = ch[+li.getAttribute('data-ch')]; li.classList.toggle('is-done', !!ok);
        var mark = li.querySelector('.epx-mark'); if (mark) mark.innerHTML = ok ? MARK_ON : MARK_OFF;
        li.setAttribute('aria-label', (ok ? 'Done: ' : 'Not yet: ') + li.textContent.trim());
      });
      root.setAttribute('data-ready', '1');
    }
    ['half', 'lag', 'mem', 'eff', 'phi', 'rho'].forEach(function (k) { on(el[k], 'input', run); });
    ['fear', 'fatigue', 'ref'].forEach(function (k) { on(el[k], 'change', run); });
    on(q(root, 'p-none'), 'click', function () { load(Object.assign({}, COURSE, { fear: false, fatigue: false })); });
    on(q(root, 'p-fear'), 'click', function () { load(Object.assign({}, COURSE, { fatigue: false })); });
    on(q(root, 'p-fat'), 'click', function () { load(COURSE); });
    load(COURSE);
    root._last = function () { return last; };
  }

  // ================================================================== Module 3 · SIR-family builder + chance
  /* Builder: S(E)I R with optional latency, waning immunity, births/deaths (life 50 years) and seasonal forcing beta0 (1 + a cos(2 pi t / 365)).
     Fractions; RK4 with dt = 0.02 day, sampled daily (the scheme of production/explains/sims/epi_m03_sims.py). */
  function family(o) {
    var g = 1 / o.D, sg = 1 / o.L, w = o.wane ? 1 / o.Imm : 0, mu = o.demo ? 1 / (50 * 365) : 0;
    var b0 = o.R0 * (g + mu) * (o.latent ? (sg + mu) / sg : 1);   // so that R0 means what the slider says, with or without deaths and latency
    function f(t, y) {
      var S = y[0], E = y[1], I = y[2], R = y[3], beta = b0 * (1 + (o.season ? o.a : 0) * Math.cos(2 * Math.PI * t / 365)), inf = beta * S * I;
      if (o.latent) return [mu - inf - mu * S + w * R, inf - (sg + mu) * E, sg * E - (g + mu) * I, g * I - (w + mu) * R];
      return [mu - inf - mu * S + w * R, 0, inf - (g + mu) * I, g * I - (w + mu) * R];
    }
    var y = [1 - o.I0, 0, o.I0, 0], dt = 0.02, n = 50, t = 0, out = { S: [y[0]], E: [0], I: [y[2]], R: [0] };
    for (var d = 0; d < o.days; d++) {
      for (var k = 0; k < n; k++) {
        var k1 = f(t, y), y2 = y.map(function (v, i) { return v + dt / 2 * k1[i]; }), k2 = f(t + dt / 2, y2), y3 = y.map(function (v, i) { return v + dt / 2 * k2[i]; }),
            k3 = f(t + dt / 2, y3), y4 = y.map(function (v, i) { return v + dt * k3[i]; }), k4 = f(t + dt, y4);
        y = y.map(function (v, i) { return v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); }); t += dt;
      }
      out.S.push(y[0]); out.E.push(y[1]); out.I.push(y[2]); out.R.push(y[3]);
    }
    var imax = 0; for (var i = 1; i < out.I.length; i++) if (out.I[i] > out.I[imax]) imax = i;
    out.peak = out.I[imax]; out.peakDay = imax; out.everInf = 1 - out.S[out.S.length - 1]; out.endI = out.I[out.I.length - 1];
    out.waves = peaks(out.I, 60, 1e-3); out.beta0 = b0;
    return out;
  }
  // final size of the plain SIR (s0 close to 1)
  function finalSize(R0) { if (R0 <= 1) return 0; var s = 0.5; for (var k = 0; k < 500; k++) s = Math.exp(-R0 * (1 - s)); return 1 - s; }
  // seeded generator (mulberry32) so a run can be repeated
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Gillespie SIR: returns the final share infected for each run
  function gillespie(N, R0, i0, runs, seed) {
    var r = rng(seed), gamma = 0.1, beta = R0 * gamma, out = [];
    for (var k = 0; k < runs; k++) {
      var S = N - i0, I = i0;
      while (I > 0) { var ri = beta * S * I / N, rr = gamma * I; if (r() * (ri + rr) < ri) { S--; I++; } else I--; }   // waiting times do not change the final size, so they are skipped
      out.push((N - S) / N);
    }
    return out;
  }

  function familyLab(root) {
    var ids = ['R0', 'D', 'L', 'Imm', 'a', 'days', 'latent', 'wane', 'demo', 'season'], el = {};
    ids.forEach(function (k) { el[k] = q(root, k); });
    var show = { R0: function (v) { return v.toFixed(1); }, D: function (v) { return v + ' days'; }, L: function (v) { return v + ' days'; }, Imm: function (v) { return Math.round(v / 30.4) + ' months'; },
                 a: function (v) { return '±' + Math.round(v * 100) + '%'; }, days: function (v) { return v >= 730 ? (v / 365).toFixed(0) + ' years' : v + ' days'; } };
    var last = null;
    function run() {
      ['R0', 'D', 'L', 'Imm', 'a', 'days'].forEach(function (k) { set(q(root, k + '-out'), show[k](+el[k].value)); });
      el.L.disabled = !el.latent.checked; el.Imm.disabled = !el.wane.checked; el.a.disabled = !el.season.checked;
      var o = { R0: +el.R0.value, D: +el.D.value, L: +el.L.value, Imm: +el.Imm.value, a: +el.a.value, days: +el.days.value, latent: el.latent.checked, wane: el.wane.checked,
                demo: el.demo.checked, season: el.season.checked, I0: 1e-3 };
      var r = family(o); last = { o: o, r: r };
      var endemic = o.wane || o.demo;
      set(q(root, 'peak'), pct(r.peak)); set(q(root, 'peakday'), 'day ' + r.peakDay);
      set(q(root, 'final-label'), endemic ? 'Infected at the end' : 'Ever infected');
      set(q(root, 'final'), endemic ? pct(r.endI) : pct(r.everInf));
      set(q(root, 'herd'), o.R0 > 1 ? pct(1 - 1 / o.R0) : '–');
      var name = 'S' + (o.latent ? 'E' : '') + 'IR' + (o.wane ? 'S' : '') + (o.demo ? ' with births and deaths' : '') + (o.season ? ', seasonal' : '');
      set(q(root, 'status'), name + ': β₀ = ' + r.beta0.toFixed(3) + ' per day. ' + (r.waves.length > 1 ? r.waves.length + ' waves above 0.1%.' : 'One wave.') +
          (!endemic && o.R0 > 1 ? ' Plain SIR final size for this R₀: ' + pct(finalSize(o.R0)) + '.' : ''));
      var ser = [{ y: r.S, color: '#0072b2', width: 2 }, { y: r.I, color: C.orange, width: 2.8 }, { y: r.R, color: C.green, width: 2 }];
      if (o.latent) ser.splice(1, 0, { y: r.E, color: C.amber, width: 2, dash: '5 4' });
      chart(q(root, 'chart'), { series: ser, yMax: 1, yFormat: function (v) { return Math.round(v * 100) + '%'; }, xLabel: 'day' });
      chart(q(root, 'ichart'), { series: [{ y: r.I, color: C.orange, width: 2.6 }], yFormat: function (v) { return +(v * 100).toFixed(2) + '%'; }, xLabel: 'day', yLabel: 'infected now',
                                  marks: r.waves.slice(0, 8).map(function (d) { return { x: d, color: C.amber }; }) });
      var ch = [o.latent && Math.abs(o.R0 - 3) < 0.05 && r.peakDay > 100, o.wane && o.season && r.waves.length >= 3 && r.waves.slice(1).every(function (d) { return r.I[d] > 0.15; })];
      root.querySelectorAll('[data-ch]').forEach(function (li) {
        var i = +li.getAttribute('data-ch'); if (i > 1) return;
        var ok = ch[i]; li.classList.toggle('is-done', !!ok); var mark = li.querySelector('.epx-mark'); if (mark) mark.innerHTML = ok ? MARK_ON : MARK_OFF;
      });
      root.setAttribute('data-ready', '1');
    }
    ['R0', 'D', 'L', 'Imm', 'a', 'days'].forEach(function (k) { on(el[k], 'input', run); });
    ['latent', 'wane', 'demo', 'season'].forEach(function (k) { on(el[k], 'change', run); });
    function preset(p) { Object.keys(p).forEach(function (k) { if (el[k].type === 'checkbox') el[k].checked = p[k]; else el[k].value = p[k]; }); run(); }
    var BASE = { R0: 3, D: 10, L: 5, Imm: 365, a: 0.2, days: 160, latent: false, wane: false, demo: false, season: false };
    on(q(root, 'p-sir'), 'click', function () { preset(BASE); });
    on(q(root, 'p-seir'), 'click', function () { preset(Object.assign({}, BASE, { latent: true, days: 220 })); });
    on(q(root, 'p-sirs'), 'click', function () { preset(Object.assign({}, BASE, { wane: true, days: 1825 })); });
    on(q(root, 'p-season'), 'click', function () { preset(Object.assign({}, BASE, { R0: 2.5, wane: true, season: true, days: 2190 })); });
    preset(BASE);

    // ---- chance panel
    var c = {}; ['N', 'cR0', 'i0', 'runs'].forEach(function (k) { c[k] = q(root, k); });
    var seed = 1;
    function chance() {
      set(q(root, 'N-out'), (+c.N.value).toLocaleString('en-US')); set(q(root, 'cR0-out'), (+c.cR0.value).toFixed(1)); set(q(root, 'i0-out'), c.i0.value); set(q(root, 'runs-out'), c.runs.value);
      var N = +c.N.value, R0 = +c.cR0.value, i0 = +c.i0.value, runs = +c.runs.value, fs = gillespie(N, R0, i0, runs, seed);
      var fizz = fs.filter(function (x) { return x < 0.05; }).length / runs, big = fs.filter(function (x) { return x >= 0.05; });
      var theory = R0 > 1 ? Math.pow(1 / R0, i0) : 1, ode = finalSize(R0), bigMean = big.length ? big.reduce(function (s, x) { return s + x; }, 0) / big.length : NaN;
      set(q(root, 'fizz'), pct(fizz)); set(q(root, 'theory'), pct(theory)); set(q(root, 'bigmean'), big.length ? pct(bigMean) : '–'); set(q(root, 'ode'), pct(ode));
      var bins = new Array(20).fill(0); fs.forEach(function (x) { bins[Math.min(19, Math.floor(x * 20))]++; });
      render(q(root, 'hist'), function (W, H) {
        var pl = 46, pr = 12, pt = 14, pb = 40, iw = W - pl - pr, ih = H - pt - pb, mx = Math.max.apply(null, bins.slice(1).concat([1])), bw = iw / 20, out = [];
        bins.forEach(function (v, i) {
          var h = i === 0 ? ih : Math.min(ih, ih * v / mx * 0.92);
          out.push('<rect x="' + (pl + i * bw + 1).toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + (i === 0 ? C.green : C.orange) + '"/>');
        });
        out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (pt + ih) + '" y2="' + (pt + ih) + '" stroke="rgba(100,116,139,.7)"/>');
        [0, 25, 50, 75, 100].forEach(function (p) { out.push(txt(pl + iw * p / 100, H - pb + 16, p + '%')); });
        out.push(txt(pl + iw / 2, H - 4, 'share of the town infected, per run', { fill: '#475569' }));
        if (ode > 0) { var x = pl + iw * ode, right = ode < 0.6; out.push('<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + pt + '" y2="' + (pt + ih) + '" stroke="' + C.ink + '" stroke-dasharray="4 4"/>'); out.push(txt(right ? x + 5 : x - 5, pt + 34, 'equations: ' + pct(ode), { anchor: right ? 'start' : 'end', fill: C.ink, weight: 700, halo: true })); }
        out.push(txt(pl + bw + 4, pt + 12, bins[0] + ' fizzled (bar cut)', { anchor: 'start', fill: C.green, weight: 700, halo: true }));
        return out.join('');
      });
      set(q(root, 'cstatus'), runs + ' runs in a town of ' + N.toLocaleString('en-US') + ': ' + pct(fizz) + ' fizzled, infecting under 5% (theory ' + pct(theory) + ').');
      var ok = R0 > 1 && fizz > 0.6, li = root.querySelector('[data-ch="2"]');
      if (li) { li.classList.toggle('is-done', ok); var mark = li.querySelector('.epx-mark'); if (mark) mark.innerHTML = ok ? MARK_ON : MARK_OFF; }
      root.setAttribute('data-chance', String(fizz));
    }
    var fmt = { N: function (v) { return (+v).toLocaleString('en-US'); }, cR0: function (v) { return (+v).toFixed(1); }, i0: String, runs: String };
    ['N', 'cR0', 'i0', 'runs'].forEach(function (k) { on(c[k], 'input', function () { set(q(root, k + '-out'), fmt[k](c[k].value)); }); on(c[k], 'change', chance); });
    on(q(root, 'crun'), 'click', function () { seed = (seed * 48271 + 11) % 2147483647; chance(); });
    chance();
  }

  // ================================================================== Module 4 · space: cities linked by travel, and contact networks
  /* Cities: flux metapopulation SIR on a chain of five cities (shares of each city's start size), neighbours exchange people at rate m per day;
     from day `close` on, travel is cut to 1/20. RK4 with dt = 0.05 day, the same scheme as production/explains/sims/epi_m04_sims.py. */
  function cities(o) {
    var P = 5, dt = 0.05, nStep = 20, b = o.R0 * o.gamma, g = o.gamma, y = new Float64Array(3 * P), p, d, k;
    for (p = 0; p < P; p++) y[p] = 1;
    y[0] -= 1e-4; y[P] = 1e-4;
    function f(t, y) {
      var m = o.m * (o.close !== null && t >= o.close ? 0.05 : 1), out = new Float64Array(3 * P);
      for (var p = 0; p < P; p++) {
        var S = y[p], I = y[P + p], R = y[2 * P + p], N = Math.max(S + I + R, 1e-12), inf = b * S * I / N, deg = (p > 0) + (p < P - 1);
        out[p] = -inf; out[P + p] = inf - g * I; out[2 * P + p] = g * I;
        for (var c = 0; c < 3; c++) {
          var j = c * P + p, nb = (p > 0 ? y[j - 1] : 0) + (p < P - 1 ? y[j + 1] : 0);
          out[j] += m * nb - m * deg * y[j];
        }
      }
      return out;
    }
    function add(a, k, h) { var r = new Float64Array(a.length); for (var i = 0; i < a.length; i++) r[i] = a[i] + h * k[i]; return r; }
    var I = [], t = 0;
    for (p = 0; p < P; p++) I.push([]);
    for (d = 0; d <= o.days; d++) {
      for (p = 0; p < P; p++) I[p].push(y[P + p]);
      if (d === o.days) break;
      for (k = 0; k < nStep; k++) {
        var k1 = f(t, y), k2 = f(t + dt / 2, add(y, k1, dt / 2)), k3 = f(t + dt / 2, add(y, k2, dt / 2)), k4 = f(t + dt, add(y, k3, dt));
        for (var i = 0; i < y.length; i++) y[i] += dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
        t += dt;
      }
    }
    var arrival = [], peakDay = [], final = [];
    for (p = 0; p < P; p++) {
      var a = -1, im = 0;
      for (d = 0; d < I[p].length; d++) { if (a < 0 && I[p][d] >= 1e-4) a = d; if (I[p][d] > I[p][im]) im = d; }
      arrival.push(a); peakDay.push(im);
      var N = y[p] + y[P + p] + y[2 * P + p]; final.push(y[2 * P + p] / N);
    }
    return { I: I, arrival: arrival, peakDay: peakDay, final: final };
  }

  /* Networks of n people: random (n·2 edges, mean 4), clustered (ring where everyone knows 2 neighbours on each side, 5% of edges rewired), hubs (preferential attachment, 2 links per newcomer). */
  function network(kind, n, seed) {
    var r = rng(seed), adj = [], i, j, k, has = {};
    for (i = 0; i < n; i++) adj.push([]);
    function key(a, b) { return a < b ? a + ',' + b : b + ',' + a; }
    function link(a, b) { if (a === b || has[key(a, b)]) return false; has[key(a, b)] = 1; adj[a].push(b); adj[b].push(a); return true; }
    if (kind === 'random') { var e = 0; while (e < 2 * n) { if (link(Math.floor(r() * n), Math.floor(r() * n))) e++; } }
    else if (kind === 'clustered') {
      var edges = [];
      for (i = 0; i < n; i++) for (k = 1; k <= 2; k++) edges.push([i, (i + k) % n]);
      edges.forEach(function (ed) { if (r() < 0.05) { var t = 0; do { j = Math.floor(r() * n); t++; } while ((j === ed[0] || has[key(ed[0], j)]) && t < 50); link(ed[0], j); } else link(ed[0], ed[1]); });
    } else {
      var pool = []; link(0, 1); link(1, 2); link(0, 2); pool.push(0, 1, 1, 2, 0, 2);
      for (i = 3; i < n; i++) { var got = 0, tries = 0; while (got < 2 && tries < 100) { tries++; if (link(i, pool[Math.floor(r() * pool.length)])) got++; } adj[i].forEach(function (v) { pool.push(i, v); }); }
    }
    var s1 = 0, s2 = 0, tri = 0, trip = 0;
    for (i = 0; i < n; i++) {
      var d = adj[i].length; s1 += d; s2 += d * d; trip += d * (d - 1) / 2;
      for (j = 0; j < d; j++) for (k = j + 1; k < d; k++) if (has[key(adj[i][j], adj[i][k])]) tri++;
    }
    var mk = s1 / n, kappa = (s2 / n - mk) / mk;
    return { adj: adj, n: n, meanK: mk, kappa: kappa, Tc: 1 / kappa, clustering: trip ? tri / trip : 0 };
  }

  /* exact event-driven SIR on a network: exponential transmission along each S-I edge (rate tau) and recovery (rate gamma); returns the share ever infected */
  function netSIR(G, tau, gamma, r) {
    var n = G.n, infT = new Float64Array(n).fill(Infinity), done = new Uint8Array(n), heap = [], count = 0;
    function push(t, v) { heap.push([t, v]); var i = heap.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; var x = heap[p]; heap[p] = heap[i]; heap[i] = x; i = p; } }
    function pop() { var top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, rr = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === i) break; var x = heap[m]; heap[m] = heap[i]; heap[i] = x; i = m; } } return top; }
    var s0 = Math.floor(r() * n); infT[s0] = 0; push(0, s0);
    while (heap.length) {
      var e = pop(), t = e[0], u = e[1];
      if (done[u] || infT[u] < t) continue;
      done[u] = 1; count++;
      var rec = t - Math.log(1 - r()) / gamma;
      G.adj[u].forEach(function (v) { if (done[v]) return; var tt = t - Math.log(1 - r()) / tau; if (tt < rec && tt < infT[v]) { infT[v] = tt; push(tt, v); } });
    }
    return count / n;
  }
  function netRuns(G, T, runs, seed) {
    var gamma = 0.1, tau = gamma * T / (1 - T), r = rng(seed), out = [];
    for (var k = 0; k < runs; k++) out.push(netSIR(G, tau, gamma, r));
    return out;
  }

  function spaceLab(root) {
    // ---- cities
    var el = {}; ['m', 'R0', 'closeOn', 'close'].forEach(function (k) { el[k] = q(root, k); });
    var base = null;
    function cityRun() {
      var m = Math.pow(10, +el.m.value), R0 = +el.R0.value, close = el.closeOn.checked ? +el.close.value : null;
      set(q(root, 'm-out'), m >= 0.01 ? '1 in ' + Math.round(1 / m) : (m * 10000).toFixed(m < 0.001 ? 1 : 0) + ' in 10,000');
      set(q(root, 'R0-out'), R0.toFixed(1)); set(q(root, 'close-out'), 'day ' + el.close.value); el.close.disabled = !el.closeOn.checked;
      var o = { m: m, R0: R0, gamma: 0.1, days: 300, close: close }, r = cities(o);
      base = close === null ? r : cities({ m: m, R0: R0, gamma: 0.1, days: 300, close: null });
      var delay = r.peakDay[4] - r.peakDay[0], shift = r.peakDay[4] - base.peakDay[4];
      set(q(root, 'arrive'), r.arrival[4] < 0 ? 'not in 300 days' : 'day ' + r.arrival[4]);
      set(q(root, 'delay'), delay + ' days'); set(q(root, 'final'), pct(r.final[4])); set(q(root, 'shift'), close === null ? '–' : '+' + shift + ' days');
      set(q(root, 'cstatus'), 'R₀ = ' + R0.toFixed(1) + ' in every city; city 1 starts with 1 in 10,000 infected. ' + (close === null ? 'No closure.' : 'Travel cut to 1/20 from day ' + close + ': city 5 peaks ' + shift + ' days later than without it.'));
      var cols = [C.orange, C.amber, C.green, '#0072b2', '#64748b'];
      chart(q(root, 'cchart'), { series: r.I.map(function (ys, i) { return { y: ys.slice(0, 251), color: cols[i], width: 2.4 }; }), yFormat: function (v) { return Math.round(v * 100) + '%'; }, xLabel: 'day', yLabel: 'infected now',
                                marks: close === null ? [] : [{ x: close, color: C.ink, label: 'closure' }] });
      var ch = [delay >= 80, el.closeOn.checked && Math.abs(+el.m.value + 2) < 0.051 && shift >= 15];
      root.querySelectorAll('[data-ch]').forEach(function (li) { var i = +li.getAttribute('data-ch'); if (i > 1) return; li.classList.toggle('is-done', !!ch[i]); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ch[i] ? MARK_ON : MARK_OFF; });
      root.setAttribute('data-ready', '1');
    }
    ['m', 'R0', 'close'].forEach(function (k) { on(el[k], 'input', cityRun); });
    on(el.closeOn, 'change', cityRun);
    function cp(o) { el.m.value = o.m; el.R0.value = o.R0; el.closeOn.checked = o.closeOn; el.close.value = o.close; cityRun(); }
    on(q(root, 'p-weak'), 'click', function () { cp({ m: -3.5, R0: 3, closeOn: false, close: 7 }); });
    on(q(root, 'p-mid'), 'click', function () { cp({ m: -2.5, R0: 3, closeOn: false, close: 7 }); });
    on(q(root, 'p-strong'), 'click', function () { cp({ m: -1, R0: 3, closeOn: false, close: 7 }); });
    cp({ m: -2.5, R0: 3, closeOn: false, close: 7 });

    // ---- networks
    var kind = 'random', seed = 1, G = network(kind, 400, seed), nr = {}; ['T', 'runs'].forEach(function (k) { nr[k] = q(root, k); });
    function netRun() {
      var T = +nr.T.value, runs = +nr.runs.value;
      set(q(root, 'T-out'), T.toFixed(2)); set(q(root, 'runs-out'), String(runs));
      var fs = netRuns(G, T, runs, seed * 7 + 3), big = fs.filter(function (x) { return x >= 0.05; }), take = big.length / runs;
      set(q(root, 'take'), pct(take)); set(q(root, 'size'), big.length ? pct(big.reduce(function (a, b) { return a + b; }, 0) / big.length) : '–');
      set(q(root, 'Tc'), G.Tc.toFixed(2)); set(q(root, 'clust'), G.clustering.toFixed(2));
      set(q(root, 'nstatus'), { random: 'Wired at random', clustered: 'Clustered ring', hubs: 'Hub-heavy' }[kind] + ': 400 people, ' + G.meanK.toFixed(1) + ' contacts on average, mean excess degree ' + G.kappa.toFixed(1) + '. T × excess degree = ' + (T * G.kappa).toFixed(2) + (T * G.kappa > 1 ? ' (above 1).' : ' (below 1).'));
      var bins = new Array(20).fill(0); fs.forEach(function (x) { bins[Math.min(19, Math.floor(x * 20))]++; });
      render(q(root, 'nhist'), function (W, H) {
        var pl = 46, pr = 12, pt = 14, pb = 40, iw = W - pl - pr, ih = H - pt - pb, mx = Math.max.apply(null, bins.slice(1).concat([1])), bw = iw / 20, out = [];
        bins.forEach(function (v, i) { var h = i === 0 ? (v ? ih : 0) : Math.min(ih, ih * v / mx * 0.92); out.push('<rect x="' + (pl + i * bw + 1).toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + (i === 0 ? C.green : C.orange) + '"/>'); });
        out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (pt + ih) + '" y2="' + (pt + ih) + '" stroke="rgba(100,116,139,.7)"/>');
        [0, 25, 50, 75, 100].forEach(function (p) { out.push(txt(pl + iw * p / 100, H - pb + 16, p + '%')); });
        out.push(txt(pl + iw / 2, H - 4, 'share of the 400 people infected, per run', { fill: '#475569' }));
        if (bins[0]) out.push(txt(pl + bw + 4, pt + 12, bins[0] + ' fizzled (bar cut)', { anchor: 'start', fill: C.green, weight: 700, halo: true }));
        return out.join('');
      });
      root.querySelectorAll('[data-k^="net-"]').forEach(function (b) { var on_ = b.getAttribute('data-k') === 'net-' + kind; b.classList.toggle('control-button-primary', on_); b.classList.toggle('control-button-secondary', !on_); });
      var ok = Math.abs(T - 0.3) < 0.011 && take < 0.1, li = root.querySelector('[data-ch="2"]');
      if (li) { li.classList.toggle('is-done', ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
      root.setAttribute('data-net', kind + ':' + take);
    }
    ['random', 'clustered', 'hubs'].forEach(function (k) { on(q(root, 'net-' + k), 'click', function () { kind = k; G = network(kind, 400, seed); netRun(); }); });
    on(nr.T, 'input', function () { set(q(root, 'T-out'), (+nr.T.value).toFixed(2)); });
    on(nr.T, 'change', netRun); on(nr.runs, 'input', function () { set(q(root, 'runs-out'), nr.runs.value); }); on(nr.runs, 'change', netRun);
    on(q(root, 'nseed'), 'click', function () { seed = (seed * 48271 + 11) % 2147483647; G = network(kind, 400, seed); netRun(); });
    netRun();
  }

  // ================================================================== Module 5 · strains, immune history and mutation
  /* m strains; immune histories J = the set of strains a person has had (a bitmask). Immunity to the same strain is perfect; any earlier infection lowers
     susceptibility to the other strains by the factor (1 - sigma). Q[i][j]: chance that a transmission by strain i founds strain j (mutation).
     intro: [{k, day, share}] adds share infected with strain k on that day, taken from the never-infected. RK4 steps of dt = 0.05 day, the same model and
     scheme as production/explains/sims/epi_m05_sims.py. Returns daily prevalence per strain, cumulative infections per strain, the never-infected share,
     and for each introduction the effective susceptible share it met (the bracket in Re = R0 x [never infected + (1 - sigma) x had another strain]). */
  function strains(o) {
    var m = o.betas.length, H = 1 << m, b = o.betas, g = o.gamma || 0.1, sg = o.sigma, dt = o.dt || 0.05, days = o.days, i, j, J;
    var Q = o.Q; if (!Q) { Q = []; for (i = 0; i < m; i++) { Q.push([]); for (j = 0; j < m; j++) Q[i].push(i === j ? 1 : 0); } }
    var susc = new Float64Array(m * H);
    for (j = 0; j < m; j++) for (J = 0; J < H; J++) susc[j * H + J] = (J >> j) & 1 ? 0 : (J === 0 ? 1 : 1 - sg);
    var L = H + m * H + m, y = new Float64Array(L);     // [R_J (H) | I_{j,J} (m H) | cumulative infections per strain (m)]
    y[0] = 1;
    (o.seeds || []).forEach(function (s, k) { if (s > 0) { y[H + k * H] += s; y[0] -= s; } });
    var lam = new Float64Array(m), It = new Float64Array(m);
    function f(y, d) {
      for (i = 0; i < L; i++) d[i] = 0;
      for (i = 0; i < m; i++) { var s = 0; for (J = 0; J < H; J++) s += y[H + i * H + J]; It[i] = s; }
      for (j = 0; j < m; j++) { var l = 0; for (i = 0; i < m; i++) l += b[i] * It[i] * Q[i][j]; lam[j] = l; }
      for (j = 0; j < m; j++) for (J = 0; J < H; J++) {
        var nw = lam[j] * susc[j * H + J] * y[J], ij = H + j * H + J, rec = g * y[ij];
        d[J] -= nw; d[ij] += nw - rec; d[H + m * H + j] += nw; d[J | (1 << j)] += rec;
      }
    }
    var k1 = new Float64Array(L), k2 = new Float64Array(L), k3 = new Float64Array(L), k4 = new Float64Array(L), tmp = new Float64Array(L), n = Math.round(1 / dt);
    var I = [], S = [], seff = {}; for (j = 0; j < m; j++) I.push(new Array(days + 1));
    for (var day = 0; day <= days; day++) {
      (o.intro || []).forEach(function (e) {
        if (e.day !== day) return;
        var se = 0; for (var K = 0; K < H; K++) se += susc[e.k * H + K] * y[K];
        seff[e.k] = se; y[H + e.k * H] += e.share; y[0] -= e.share;
      });
      for (j = 0; j < m; j++) { var s = 0; for (J = 0; J < H; J++) s += y[H + j * H + J]; I[j][day] = s; }
      S.push(y[0]);
      if (day === days) break;
      for (var st = 0; st < n; st++) {
        f(y, k1); for (i = 0; i < L; i++) tmp[i] = y[i] + dt / 2 * k1[i];
        f(tmp, k2); for (i = 0; i < L; i++) tmp[i] = y[i] + dt / 2 * k2[i];
        f(tmp, k3); for (i = 0; i < L; i++) tmp[i] = y[i] + dt * k3[i];
        f(tmp, k4); for (i = 0; i < L; i++) y[i] += dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      }
    }
    var cum = []; for (j = 0; j < m; j++) cum.push(y[H + m * H + j]);
    return { I: I, S: S, cum: cum, seff: seff, hist: Array.prototype.slice.call(y, 0, H) };
  }
  // a ladder: strain i founds strain i + 1 with chance mu; the last strain only copies itself
  function ladder(mu, m) { var Q = []; for (var i = 0; i < m; i++) { Q.push([]); for (var j = 0; j < m; j++) Q[i].push(i < m - 1 ? (j === i ? 1 - mu : j === i + 1 ? mu : 0) : (j === i ? 1 : 0)); } return Q; }
  // effective number of strains exp(Shannon diversity) of the strain mix, day by day
  function neff(I) {
    var out = [], m = I.length;
    for (var d = 0; d < I[0].length; d++) {
      var tot = 0, h = 0, k; for (k = 0; k < m; k++) tot += Math.max(I[k][d], 0);
      if (tot > 0) for (k = 0; k < m; k++) { var p = Math.max(I[k][d], 0) / tot; if (p > 0) h -= p * Math.log(p); }
      out.push(Math.exp(h));
    }
    return out;
  }
  function oneIn(x) { var v = 1 / x, e = Math.pow(10, Math.floor(Math.log10(v)) - 1); v = Math.round(v / e) * e; return '1 in ' + Math.round(v).toLocaleString('en-US'); }

  function strainsLab(root) {
    var SC = [C.orange, C.purple, C.amber, C.teal];
    function hl(keys, on_) { keys.forEach(function (k) { var b = q(root, k); if (!b) return; b.classList.toggle('control-button-primary', k === on_); b.classList.toggle('control-button-secondary', k !== on_); }); }
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    // ---- two strains
    var el = {}; ['RA', 'RB', 'tB', 'sg'].forEach(function (k) { el[k] = q(root, k); });
    function twoRun() {
      var RA = +el.RA.value, RB = +el.RB.value, tB = +el.tB.value, sg = +el.sg.value;
      set(q(root, 'RA-out'), RA.toFixed(1)); set(q(root, 'RB-out'), RB.toFixed(1)); set(q(root, 'tB-out'), 'day ' + tB); set(q(root, 'sg-out'), sg.toFixed(2));
      var r = strains({ betas: [RA * 0.1, RB * 0.1], sigma: sg, seeds: [1e-3, 0], intro: [{ k: 1, day: tB, share: 1e-4 }], days: 600 });
      var Re = RB * r.seff[1];
      set(q(root, 'attA'), pct(r.cum[0])); set(q(root, 'attB'), pct(r.cum[1])); set(q(root, 'ReB'), Re.toFixed(2)); set(q(root, 'ever'), pct(1 - r.S[600]));
      set(q(root, 'tstatus'), 'A starts with 1 in 1,000 infected on day 0; B arrives as 1 in 10,000 on day ' + tB + '. On arrival ' + pct(r.seff[1]) + ' of the town counts as susceptible to B (never infected, plus (1 − σ) × had A), so Rₑ(B) = ' +
        RB.toFixed(1) + ' × ' + r.seff[1].toFixed(2) + ' = ' + Re.toFixed(2) + (Re > 1 ? ': B can grow.' : ': B cannot take off.'));
      chart(q(root, 'tchart'), { series: [{ y: r.I[0], color: SC[0], width: 2.4 }, { y: r.I[1], color: SC[1], width: 2.4 }], yFormat: function (v) { return Math.round(v * 100) + '%'; }, xLabel: 'day', yLabel: 'infected now',
                                 marks: [{ x: tB, color: SC[1], label: 'B arrives' }] });
      hl(['p-full', 'p-half', 'p-none'], RA === 2.5 && RB === 2.5 && tB === 150 ? { 1: 'p-full', 0.5: 'p-half', 0: 'p-none' }[sg] : null);
      mark(0, sg >= 0.995 && tB >= 60 && r.cum[1] > r.cum[0]);
      mark(1, Math.abs(RA - 2.5) < 0.01 && Math.abs(RB - 2.5) < 0.01 && tB === 150 && Re >= 0.95 && Re <= 1.05);
      root.setAttribute('data-two', [r.cum[0].toFixed(4), r.cum[1].toFixed(4), Re.toFixed(3)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    ['RA', 'RB', 'tB', 'sg'].forEach(function (k) { on(el[k], 'input', twoRun); });
    function tp(sg) { el.RA.value = 2.5; el.RB.value = 2.5; el.tB.value = 150; el.sg.value = sg; twoRun(); }
    on(q(root, 'p-full'), 'click', function () { tp(1); }); on(q(root, 'p-half'), 'click', function () { tp(0.5); }); on(q(root, 'p-none'), 'click', function () { tp(0); });
    tp(0.5);

    // ---- mutation ladder
    var ml = {}; ['mu', 'R1', 'step', 'msg'].forEach(function (k) { ml[k] = q(root, k); });
    function mutRun() {
      var lmu = +ml.mu.value, mu = Math.pow(10, lmu), R1 = +ml.R1.value, stp = +ml.step.value, sg = +ml.msg.value, betas = [0, 1, 2, 3].map(function (k) { return 0.1 * (R1 + stp * k); });
      set(q(root, 'mu-out'), oneIn(mu)); set(q(root, 'R1-out'), R1.toFixed(1)); set(q(root, 'step-out'), '+' + stp.toFixed(2)); set(q(root, 'msg-out'), sg.toFixed(2));
      var r = strains({ betas: betas, sigma: sg, Q: ladder(mu, 4), seeds: [1e-4, 0, 0, 0], days: 600 });
      var tot = r.I[0].map(function (_, d) { return r.I[0][d] + r.I[1][d] + r.I[2][d] + r.I[3][d]; }), pk = peaks(tot, 60, 1e-3), ne = neff(r.I);
      var first = -1; for (var d = 0; d < tot.length; d++) if (r.I[1][d] >= 1e-4) { first = d; break; }
      var live = [], a = -1, z = -1, mx = 0; for (d = 0; d < tot.length; d++) if (tot[d] >= 1e-3) { if (a < 0) a = d; z = d; if (ne[d] > mx) mx = ne[d]; }
      set(q(root, 'waves'), String(pk.length)); set(q(root, 'first2'), first < 0 ? 'not in 600 days' : 'day ' + first); set(q(root, 'nmax'), mx.toFixed(1));
      set(q(root, 'perp'), (r.cum[0] + r.cum[1] + r.cum[2] + r.cum[3]).toFixed(1));
      set(q(root, 'mstatus'), 'Strains with R₀ ' + betas.map(function (x) { return (x * 10).toFixed(2).replace(/0$/, ''); }).join(', ') + '; strain 1 starts with 1 in 10,000 infected; ' + oneIn(mu) + ' transmissions founds the next strain' +
        (sg > 0 ? '; an earlier strain protects by ' + Math.round(sg * 100) + '%.' : '; each new strain escapes immunity to the earlier ones.'));
      chart(q(root, 'mchart'), { series: r.I.map(function (ys, k) { return { y: ys, color: SC[k], width: 2.2 }; }).concat([{ y: tot, color: C.ink, width: 1.6, dash: '5 4' }]), yFormat: function (v) { return Math.round(v * 100) + '%'; }, xLabel: 'day', yLabel: 'infected now',
                                 marks: pk.map(function (p) { return { x: p, color: C.muted }; }) });
      if (a >= 0) live = ne.slice(a, z + 1);
      chart(q(root, 'nchart'), { series: [{ y: live, color: C.blue, width: 2.4, start: a }], length: 601, yMax: Math.max(2, Math.ceil(mx)), yFormat: function (v) { return String(v); }, xLabel: 'day', yLabel: 'strains' });
      hl(['p-m6', 'p-m3', 'p-m2'], R1 === 2 && stp === 0.2 && sg === 0 ? { '-6': 'p-m6', '-3': 'p-m3', '-2': 'p-m2' }[String(lmu)] : null);
      mark(2, pk.length >= 4); mark(3, mx > 3);
      root.setAttribute('data-mut', [pk.length, first, mx.toFixed(3)].join(':'));
    }
    ['mu', 'R1', 'step', 'msg'].forEach(function (k) { on(ml[k], 'input', function () { set(q(root, k + '-out'), k === 'mu' ? oneIn(Math.pow(10, +ml.mu.value)) : (k === 'step' ? '+' : '') + (+ml[k].value).toFixed(k === 'R1' ? 1 : 2)); }); on(ml[k], 'change', mutRun); });
    function mp(lmu) { ml.mu.value = lmu; ml.R1.value = 2; ml.step.value = 0.2; ml.msg.value = 0; mutRun(); }
    on(q(root, 'p-m6'), 'click', function () { mp(-6); }); on(q(root, 'p-m3'), 'click', function () { mp(-3); }); on(q(root, 'p-m2'), 'click', function () { mp(-2); });
    mp(-3);
  }

  // ================================================================== Module 6 · households and town agents, stage shapes, common random numbers
  /* A made-up town of households. Every agent is S, E (latent), I (infectious) or R. Each day a susceptible agent is infected with chance
     1 − (1 − pH)^(infectious in its household) × exp(−k pC (1 − cut) × infectious in town / N). Latent and infectious periods (means 2 and 4 days)
     are Erlang with `stages` stages (1 = exponential; 0 = fixed), rounded to whole days, at least 1, as in production/explains/sims/epi_m06_sims.py.
     Every random number is a hash of (seed, day, agent, purpose), so two runs with the same seed share their randomness: common random numbers. */
  function u01(seed, a, b, c) {
    var h = (Math.imul(seed | 0, 0x9E3779B1) ^ Math.imul(a + 1, 0x85EBCA77) ^ Math.imul(b + 7, 0xC2B2AE3D) ^ Math.imul(c + 13, 0x27D4EB2F)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7FEB352D) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x846CA68B) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    return (h + 0.5) / 4294967296;
  }
  function agentTown(nh, seed) {
    var P = [0.28, 0.33, 0.16, 0.14, 0.06, 0.03], hh = [], size = [];
    for (var h = 0; h < nh; h++) {
      var u = u01(seed, 0, h, 99), s = 1, acc = P[0];
      while (u > acc && s < 6) { acc += P[s]; s++; }
      for (var j = 0; j < s; j++) { hh.push(h); size.push(s); }
    }
    return { N: hh.length, nh: nh, hh: Int32Array.from(hh), size: Int8Array.from(size) };
  }
  function dwellDays(seed, agent, purpose, mean, stages) {
    if (stages === 0) return Math.max(1, Math.round(mean));
    var x = 0; for (var i = 0; i < stages; i++) x -= Math.log(u01(seed, 1000 + purpose, agent, i)) * mean / stages;
    return Math.max(1, Math.round(x));
  }
  /* o: {pH, k, pC, cut, stages, days, I0} */
  function agentRun(T, o, seed) {
    var N = T.N, days = o.days || 300, st = new Int8Array(N), t0 = new Int32Array(N), L = new Int32Array(N), D = new Int32Array(N), hI = new Int32Array(T.nh);
    for (var a = 0; a < N; a++) { L[a] = dwellDays(seed, a, 1, 2, o.stages); D[a] = dwellDays(seed, a, 2, 4, o.stages); }
    var picked = 0, tries = 0;
    while (picked < (o.I0 || 5) && tries < 10000) { var c = Math.floor(u01(seed, 2, tries, 5) * N); tries++; if (st[c] === 0) { st[c] = 1; picked++; } }
    var I = [], home = 0, total = 0, lamC = -o.k * o.pC * (1 - (o.cut || 0)) / N, lh = Math.log(1 - o.pH);
    for (var d = 0; d <= days; d++) {
      var nI = 0; hI.fill(0);
      for (a = 0; a < N; a++) {
        if (st[a] === 1 && d - t0[a] >= L[a]) { st[a] = 2; t0[a] = d; }
        else if (st[a] === 2 && d - t0[a] >= D[a]) st[a] = 3;
        if (st[a] === 2) { nI++; hI[T.hh[a]]++; }
      }
      I.push(nI);
      if (d === days) break;
      var hasE = false; for (a = 0; a < N && !hasE; a++) if (st[a] === 1) hasE = true;
      if (!nI && !hasE) { for (var r = d + 1; r <= days; r++) I.push(0); break; }
      var town = lamC * nI;
      for (a = 0; a < N; a++) {
        if (st[a] !== 0) continue;
        var lhome = -lh * hI[T.hh[a]], ltown = -town, tot = lhome + ltown;
        if (tot <= 0) continue;
        if (u01(seed, 3, d, a) < 1 - Math.exp(-tot)) { st[a] = 1; t0[a] = d; total++; if (u01(seed, 4, d, a) < lhome / tot) home++; }
      }
    }
    var peak = 0, pd = 0; I.forEach(function (v, i) { if (v > peak) { peak = v; pd = i; } });
    var ever = 0; for (a = 0; a < N; a++) if (st[a] !== 0) ever++;
    return { I: I.map(function (v) { return v / N; }), attack: ever / N, peak: peak / N, peakDay: pd, homeShare: total ? home / total : 0 };
  }
  /* paired runs: baseline and policy (cut town contacts); crn: the same seed for both, otherwise independent seeds */
  function agentPairs(T, o, cut, n, crn, seed0) {
    var diffs = [];
    for (var i = 0; i < n; i++) {
      var s = seed0 + i, a = agentRun(T, o, s), b = agentRun(T, Object.assign({}, o, { cut: cut }), crn ? s : s + 7919);
      if (a.attack > 0.05 && b.attack > 0.05) diffs.push(a.attack - b.attack);
    }
    var m = diffs.reduce(function (x, y) { return x + y; }, 0) / Math.max(1, diffs.length);
    var sd = Math.sqrt(diffs.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / Math.max(1, diffs.length - 1));
    return { diffs: diffs, mean: m, sd: sd, wrong: diffs.filter(function (v) { return v < 0; }).length, n: diffs.length };
  }

  function agentsLab(root) {
    var T = agentTown(700, 2026), STG = [1, 2, 4, 8, 0], STL = ['1 (exponential)', '2', '4', '8', 'fixed'];
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['pH', 'k', 'pC', 'stg', 'seed'].forEach(function (k) { el[k] = q(root, k); });
    function params() { return { pH: +el.pH.value, k: +el.k.value, pC: +el.pC.value, stages: STG[+el.stg.value], days: 300, I0: 5 }; }
    function labels() {
      set(q(root, 'pH-out'), Math.round(+el.pH.value * 100) + '%'); set(q(root, 'k-out'), el.k.value); set(q(root, 'pC-out'), (+el.pC.value * 100).toFixed(1) + '%');
      set(q(root, 'stg-out'), STL[+el.stg.value]); set(q(root, 'seed-out'), el.seed.value);
    }
    var last = null;
    function oneRun() {
      labels(); var o = params(), r = agentRun(T, o, +el.seed.value); last = r;
      set(q(root, 'att'), pct(r.attack)); set(q(root, 'pk'), r.attack > 0.05 ? 'day ' + r.peakDay : '–'); set(q(root, 'pkv'), pct(r.peak, 1)); set(q(root, 'home'), r.attack > 0.05 ? pct(r.homeShare) : '–');
      set(q(root, 'astatus'), T.N.toLocaleString('en-US') + ' agents in ' + T.nh + ' households; 5 first cases (seed ' + el.seed.value + '). ' + (r.attack <= 0.05 ? 'This run fizzled out: try another seed.' : 'Latent 2 days and infectious 4 days on average, ' + (o.stages === 0 ? 'fixed.' : o.stages === 1 ? 'exponential.' : 'in ' + o.stages + ' stages.')));
      chart(q(root, 'achart'), { series: [{ y: r.I.slice(0, 201), color: C.orange, width: 2.6 }], yFormat: function (v) { return (v * 100).toFixed(v < 0.1 ? 1 : 0) + '%'; }, xLabel: 'day', yLabel: 'infectious now' });
      mark(0, r.attack > 0.05 && r.peakDay > 70 && Math.abs(o.pH - 0.12) < 1e-9 && o.k === 8 && Math.abs(o.pC - 0.03) < 1e-9);
      mark(1, r.attack > 0.05 && r.homeShare > 0.5);
      root.setAttribute('data-one', [r.attack.toFixed(4), r.peakDay, r.homeShare.toFixed(4)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    ['pH', 'k', 'pC', 'stg', 'seed'].forEach(function (k) { on(el[k], 'input', labels); on(el[k], 'change', oneRun); });
    on(q(root, 'nseed'), 'click', function () { el.seed.value = (+el.seed.value % 999) + 1; oneRun(); });
    on(q(root, 'p-reset'), 'click', function () { el.pH.value = 0.12; el.k.value = 8; el.pC.value = 0.03; el.stg.value = 2; el.seed.value = 1; oneRun(); });
    oneRun();

    // ---- comparing two policies
    var cmp = {}; ['cut', 'pairs'].forEach(function (k) { cmp[k] = q(root, k); }); var crn = false, base = 101;
    function cmpLabels() { set(q(root, 'cut-out'), Math.round(+cmp.cut.value * 100) + '%'); set(q(root, 'pairs-out'), cmp.pairs.value); }
    function compare() {
      cmpLabels(); var o = params(), cut = +cmp.cut.value, n = +cmp.pairs.value, R = agentPairs(T, o, cut, n, crn, base);
      set(q(root, 'dmean'), (R.mean * 100).toFixed(1) + ' points'); set(q(root, 'dsd'), (R.sd * 100).toFixed(1) + ' points'); set(q(root, 'wrong'), R.wrong + ' of ' + R.n);
      var need = R.sd > 0 ? Math.ceil(Math.pow(1.96 * R.sd / 0.005, 2)) : 0; set(q(root, 'need'), need.toLocaleString('en-US'));
      set(q(root, 'cstatus'), (crn ? 'Common random numbers: both runs of a pair use the same seed (seeds ' : 'Independent runs: the two runs of a pair use different seeds (seeds ') + base + '–' + (base + n - 1) + '). Pairs where a run fizzled out are left out: ' + (n - R.n) + ' of ' + n + '.');
      render(q(root, 'cchart'), function (W, H) {
        var pl = 46, pr = 12, pt = 14, pb = 40, iw = W - pl - pr, ih = H - pt - pb, lo = -0.08, hi = 0.12, nb = 40, bins = new Array(nb).fill(0), out = [];
        R.diffs.forEach(function (v) { bins[Math.max(0, Math.min(nb - 1, Math.floor((v - lo) / (hi - lo) * nb)))]++; });
        var mx = Math.max.apply(null, bins.concat([1])), bw = iw / nb;
        bins.forEach(function (v, i) { var h = ih * v / mx; var mid = lo + (i + 0.5) * (hi - lo) / nb; out.push('<rect x="' + (pl + i * bw + 1).toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + (mid < 0 ? C.orange : (crn ? C.blue : C.grey)) + '"/>'); });
        var x0 = pl + iw * (0 - lo) / (hi - lo);
        out.push('<line x1="' + x0.toFixed(1) + '" x2="' + x0.toFixed(1) + '" y1="' + pt + '" y2="' + (pt + ih) + '" stroke="' + C.ink + '" stroke-dasharray="4 4"/>');
        out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (pt + ih) + '" y2="' + (pt + ih) + '" stroke="rgba(100,116,139,.7)"/>');
        [-0.08, -0.04, 0, 0.04, 0.08, 0.12].forEach(function (v) { out.push(txt(pl + iw * (v - lo) / (hi - lo), H - pb + 16, (v * 100).toFixed(0))); });
        out.push(txt(pl + iw / 2, H - 4, 'infected without the policy minus with it (percentage points), one bar per 0.5 points', { fill: '#475569' }));
        return out.join('');
      });
      root.querySelectorAll('[data-k="m-ind"],[data-k="m-crn"]').forEach(function (b) { var onb = (b.getAttribute('data-k') === 'm-crn') === crn; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
      mark(2, Math.abs(cut - 0.05) < 1e-9 && R.n >= 20 && R.wrong === 0);
      mark(3, R.n >= 20 && R.sd < 0.02);
      root.setAttribute('data-cmp', [crn ? 1 : 0, R.n, R.mean.toFixed(4), R.sd.toFixed(4), R.wrong].join(':'));
    }
    ['cut', 'pairs'].forEach(function (k) { on(cmp[k], 'input', cmpLabels); on(cmp[k], 'change', compare); });
    on(q(root, 'm-ind'), 'click', function () { crn = false; compare(); }); on(q(root, 'm-crn'), 'click', function () { crn = true; compare(); });
    on(q(root, 'crun'), 'click', function () { base += +cmp.pairs.value; compare(); });
    compare();
  }

  // ================================================================== Module 7 · a simulated surveillance system: nowcasting and backtests
  /* The course's simulated system (production/explains/sims/epi_m07_sims.py), rebuilt in the browser: a two-wave SEIR epidemic in a town of 5 million,
     1 in 4 infections becomes a case about 6 days later (expected counts identical to the Python run), then a fresh random draw: day-to-day extra
     noise (log-normal, like a negative binomial with k = 30), each test date's cases split over reporting delays (Poisson thinning), weekend and holiday
     reporting. Random numbers are hashes of (seed, day, delay, purpose). */
  var NC = { pop: 5e6, days: 400, asc: 0.25, k: 30,
    pts: [[0, 1.4], [55, 1.4], [70, 0.9], [140, 0.9], [160, 1.55], [230, 1.4], [255, 0.85], [400, 0.85]],
    p0: [0.08, 0.24, 0.24, 0.16, 0.10, 0.07, 0.04, 0.03, 0.02, 0.01, 0.005, 0.003, 0.001, 0.001], p1: [0.02, 0.08, 0.14, 0.16, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.02, 0.01, 0.005, 0.005] };
  function ncMu() {
    function rt(t) { var p = NC.pts; for (var i = 0; i < p.length - 1; i++) if (t >= p[i][0] && t <= p[i + 1][0]) return p[i][1] + (p[i + 1][1] - p[i][1]) * (t - p[i][0]) / (p[i + 1][0] - p[i][0]); return p[p.length - 1][1]; }
    var S = NC.pop - 5000, E = 3000, I = 2000, sig = 1 / 3, gam = 1 / 5, inf = [];
    for (var t = 0; t < NC.days; t++) { var nw = rt(t) * gam * S * I / NC.pop; S -= nw; var e2 = E + nw - sig * E, i2 = I + sig * E - gam * I; E = e2; I = i2; inf.push(nw); }
    var g = [], gs = 0; for (var x = 0.5; x < 20.5; x += 1) { var v = Math.pow(x / 1.5, 3) * Math.exp(-x / 1.5) / 1.5 / 6; g.push(v); gs += v; }
    g = g.map(function (v) { return v / gs; });
    var mu = new Array(NC.days).fill(0);
    for (t = 0; t < NC.days; t++) for (var j = 0; j < g.length && t + j < NC.days; j++) mu[t + j] += NC.asc * inf[t] * g[j];
    return { mu: mu, inf: inf };
  }
  function nrm(seed, a, b, c) { var u1 = u01(seed, a, b, c), u2 = u01(seed, a, b, c + 1); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }
  function pois(lam, seed, a, b, c) {
    if (lam <= 0) return 0;
    if (lam > 25) return Math.max(0, Math.round(lam + Math.sqrt(lam) * nrm(seed, a, b, c)));
    var L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= u01(seed, a, b, c + 3 * k); } while (p > L && k < 200); return k - 1;
  }
  /* o: {seed, slow (labs slow down on days 200-239)} -> {mu, tri (by test date x delay), C (final by test date), rep (by report date, after weekends and holidays)} */
  function ncWorld(o) {
    var M = ncMu(), D = NC.p0.length, s2 = Math.log(1 + 1 / NC.k), tri = [], C = [];
    for (var t = 0; t < NC.days; t++) {
      var m = M.mu[t] * Math.exp(Math.sqrt(s2) * nrm(o.seed, 30, t, 0) - s2 / 2), p = o.slow && t >= 200 && t < 240 ? NC.p1 : NC.p0, row = [], c = 0;
      for (var d = 0; d < D; d++) { var n = pois(m * p[d], o.seed, 31, t, 10 * d); row.push(n); c += n; }
      tri.push(row); C.push(c);
    }
    var rep = new Array(NC.days + D).fill(0);
    for (t = 0; t < NC.days; t++) for (d = 0; d < D; d++) rep[t + d] += tri[t][d];
    rep = rep.slice(0, NC.days);
    for (t = 0; t < NC.days; t++) {
      var wd = t % 7, held;
      if (wd === 5) { held = rep[t] * 0.25; rep[t] -= held; rep[Math.min(NC.days - 1, t + 2)] += held; }
      if (wd === 6) { held = rep[t] * 0.45; rep[t] -= held; rep[Math.min(NC.days - 1, t + 1)] += held; }
    }
    [122, 303].forEach(function (h) { var held = rep[h] * 0.7; rep[h] -= held; rep[h + 1] += held; });
    return { mu: M.mu, tri: tri, C: C, rep: rep.map(Math.round) };
  }
  function ncPartial(W, T, t) { var s = 0, n = Math.min(W.tri[t].length, T - t); for (var d = 0; d < n; d++) s += W.tri[t][d]; return s; }
  function ncDelay(W, T, win) {
    var D = W.tri[0].length, s = new Array(D).fill(0), tot = 0;
    for (var t = Math.max(0, T - D - win); t < T - D; t++) for (var d = 0; d < D; d++) { s[d] += W.tri[t][d]; tot += W.tri[t][d]; }
    return s.map(function (v) { return v / Math.max(1, tot); });
  }
  /* nowcast for test dates T-H .. T-1 (reports by the end of day T-1) */
  function ncNowcast(W, T, win, H) {
    H = H || 14; var p = ncDelay(W, T, win), F = [], c = 0; p.forEach(function (v) { c += v; F.push(c); });
    var out = []; for (var t = T - H; t < T; t++) { var n = T - t; out.push(ncPartial(W, T, t) / Math.max(F[Math.min(n, F.length) - 1], 1e-3)); }
    return out;
  }
  /* simple forecasters, from reports up to day T-1, for day T-1+h */
  var FC = {
    last: function (R, T, h) { return R[T - 1]; },
    week: function (R, T, h) { return R[T - 7 + ((h - 1) % 7)]; },
    mean: function (R, T, h) { var s = 0; for (var i = T - 7; i < T; i++) s += R[i]; return s / 7; },
    trend: function (R, T, h) {
      var m1 = 0, m0 = 0, i; for (i = T - 7; i < T; i++) m1 += R[i]; for (i = T - 14; i < T - 7; i++) m0 += R[i];
      var g = Math.log((m1 + 7) / (m0 + 7)) / 7, f = 0, n = 0;
      for (i = T - 28; i < T; i++) if ((i - (T - 1 + h)) % 7 === 0) { var a = 0; for (var j = i - 3; j <= i + 3; j++) a += R[Math.min(T - 1, j)]; f += R[i] / Math.max(1, a / 7); n++; }
      return (m1 / 7) * Math.exp(g * (h + 3)) * (n ? f / n : 1);
    } };
  function ncBacktest(R, h, from, to) {
    var out = {}; Object.keys(FC).forEach(function (k) { var e = 0, n = 0; for (var T = from; T + h - 1 < to; T += 7) { e += Math.abs(FC[k](R, T, h) - R[T - 1 + h]); n++; } out[k] = n ? e / n : NaN; });
    return out;
  }

  function nowcastLab(root) {
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['today', 'win', 'slow', 'truth', 'h'].forEach(function (k) { el[k] = q(root, k); });
    var Wn = ncWorld({ seed: 7, slow: false }), Ws = ncWorld({ seed: 7, slow: true });
    function W() { return el.slow.checked ? Ws : Wn; }
    function nowRun() {
      var T = +el.today.value, win = +el.win.value, w = W(), nc = ncNowcast(w, T, win, 14);
      set(q(root, 'today-out'), 'day ' + T); set(q(root, 'win-out'), win + ' days');
      var arr = [], fin = [], now = []; for (var t = T - 28; t < T; t++) { arr.push(ncPartial(w, T, t)); fin.push(w.C[t]); now.push(t >= T - 14 ? nc[t - (T - 14)] : ncPartial(w, T, t)); }
      var a7 = arr.slice(-7).reduce(function (x, y) { return x + y; }, 0), f7 = fin.slice(-7).reduce(function (x, y) { return x + y; }, 0), n7 = now.slice(-7).reduce(function (x, y) { return x + y; }, 0);
      var en = (n7 - f7) / Math.max(1, f7), ea = (a7 - f7) / Math.max(1, f7);
      set(q(root, 'arr7'), Math.round(a7).toLocaleString('en-US')); set(q(root, 'now7'), Math.round(n7).toLocaleString('en-US'));
      set(q(root, 'fin7'), el.truth.checked ? Math.round(f7).toLocaleString('en-US') : 'hidden'); set(q(root, 'err7'), el.truth.checked ? (en >= 0 ? '+' : '') + Math.round(en * 100) + '%' : 'hidden');
      var p = ncDelay(w, T, win), mean = p.reduce(function (s, v, d) { return s + v * d; }, 0);
      set(q(root, 'nstatus'), 'Reports up to the end of day ' + (T - 1) + '. Delay estimated from test dates ' + Math.max(0, T - 14 - win) + '–' + (T - 15) + ': ' + mean.toFixed(1) + ' days on average' +
        (el.slow.checked && T > 200 && T < 270 ? '. The labs are slow on test dates 200–239 (true average 4.5 days instead of 2.8).' : '.'));
      chart(q(root, 'nchart'), { series: [{ y: arr, color: C.orange, width: 2.6 }, { y: now, color: C.blue, width: 2.6 }].concat(el.truth.checked ? [{ y: fin, color: C.ink, width: 1.8, dash: '5 4' }] : []),
                                 yFormat: function (v) { return Math.round(v).toLocaleString('en-US'); }, xLabel: 'test date (the last 28 days before day ' + T + ')', yLabel: 'cases' });
      mark(0, el.slow.checked && Math.abs(en) > 0.3);
      mark(1, el.slow.checked && T >= 225 && T <= 235 && Math.abs(en) < 0.15);
      root.setAttribute('data-now', [T, win, el.slow.checked ? 1 : 0, ea.toFixed(4), en.toFixed(4)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    ['today', 'win'].forEach(function (k) { on(el[k], 'input', nowRun); });
    on(el.slow, 'change', function () { nowRun(); backRun(); }); on(el.truth, 'change', nowRun);
    // ---- backtest
    var NM = { last: 'repeat the last day', week: 'repeat last week', mean: 'the weekly mean', trend: 'trend × weekday' }, CL = { last: C.grey, week: C.amber, mean: C.green, trend: C.blue };
    function backRun() {
      var h = +el.h.value, R = W().rep, bt = ncBacktest(R, h, 120, 380), keys = Object.keys(FC), best = keys.reduce(function (a, b) { return bt[a] <= bt[b] ? a : b; });
      set(q(root, 'h-out'), h + (h === 1 ? ' day' : ' days'));
      keys.forEach(function (k) { set(q(root, 'm-' + k), Math.round(bt[k]).toLocaleString('en-US')); });
      set(q(root, 'bstatus'), 'Origins every 7 days from day 120; the error is the average miss, in reported cases, ' + h + (h === 1 ? ' day' : ' days') + ' ahead. Best here: ' + NM[best] + '.');
      render(q(root, 'bchart'), function (Wd, Hd) {
        var pl = 150, pr = 70, pt = 10, pb = 30, iw = Wd - pl - pr, mx = Math.max.apply(null, keys.map(function (k) { return bt[k]; })) * 1.05, bh = (Hd - pt - pb) / keys.length, out = [];
        keys.forEach(function (k, i) { var w = iw * bt[k] / mx, y = pt + i * bh + bh * 0.2;
          out.push(txt(pl - 10, y + bh * 0.42, NM[k], { anchor: 'end', fill: '#334155', size: 12, weight: 600 }));
          out.push('<rect x="' + pl + '" y="' + y.toFixed(1) + '" width="' + Math.max(2, w).toFixed(1) + '" height="' + (bh * 0.6).toFixed(1) + '" rx="4" fill="' + CL[k] + '"/>');
          out.push(txt(pl + w + 6, y + bh * 0.42, Math.round(bt[k]).toLocaleString('en-US'), { anchor: 'start', fill: '#334155', size: 12, weight: 700 })); });
        return out.join('');
      });
      mark(2, bt.last < bt.mean);
      mark(3, bt.trend < 100);
      root.setAttribute('data-back', [h, best].concat(keys.map(function (k) { return Math.round(bt[k]); })).join(':'));
    }
    on(el.h, 'input', backRun);
    nowRun(); backRun();
  }

  // ------------------------------------------------------------------ Module 8 lab: fitting one outbreak, four searches, the valley, ABC rejection
  var ABC_GOAL = 1.0;   // challenge 4: a 90% interval for R0 narrower than this, with at least 50 kept draws
  var CAL = { N: 100000, I0: 20, rho: 0.4, k: 50, days: 100, beta: 0.25, gamma: 0.1, b0: 0.05, b1: 0.6, g0: 0.02, g1: 0.3 };
  // expected reported cases per day of the module's SIR (RK4, quarter-day steps)
  function calCases(beta, gamma, days) {
    days = days || CAL.days; var N = CAL.N, S = N - CAL.I0, I = CAL.I0, Cc = 0, out = new Array(days), dt = 0.25;
    for (var d = 0; d < days; d++) {
      var c0 = Cc;
      for (var s = 0; s < 4; s++) {
        var f1 = beta * S * I / N, a1 = -f1, b1 = f1 - gamma * I;
        var S2 = S + dt / 2 * a1, I2 = I + dt / 2 * b1, f2 = beta * S2 * I2 / N, a2 = -f2, b2 = f2 - gamma * I2;
        var S3 = S + dt / 2 * a2, I3 = I + dt / 2 * b2, f3 = beta * S3 * I3 / N, a3 = -f3, b3 = f3 - gamma * I3;
        var S4 = S + dt * a3, I4 = I + dt * b3, f4 = beta * S4 * I4 / N, a4 = -f4, b4 = f4 - gamma * I4;
        S += dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4); I += dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4); Cc += dt / 6 * (f1 + 2 * f2 + 2 * f3 + f4);
      }
      out[d] = CAL.rho * (Cc - c0);
    }
    return out;
  }
  function gaussian(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function gammaDraw(r, k) { // Marsaglia-Tsang, k >= 1
    var d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) { var x = gaussian(r), v = Math.pow(1 + c * x, 3); if (v <= 0) continue; var u = r(); if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v; }
  }
  function poissonDraw(r, lam) {
    if (lam < 30) { var L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
    return Math.max(0, Math.round(lam + Math.sqrt(lam) * gaussian(r)));
  }
  function binomDraw(r, n, p) {
    if (n <= 0 || p <= 0) return 0; if (p >= 1) return n;
    if (n < 40) { var c = 0; for (var i = 0; i < n; i++) if (r() < p) c++; return c; }
    var m = n * p;
    if (m < 15) { var q_ = 1 - p, pr = Math.pow(q_, n), cdf = pr, u = r(), x = 0; while (u > cdf && x < n) { pr *= (n - x) / (x + 1) * p / q_; x++; cdf += pr; } return x; }
    if (n - m < 15) return n - binomDraw(r, n, 1 - p);
    return Math.max(0, Math.min(n, Math.round(m + Math.sqrt(m * (1 - p)) * gaussian(r))));
  }
  // one noisy dataset (negative binomial, k 50) from the true parameters
  function calData(seed) { var r = rng(seed), mu = calCases(CAL.beta, CAL.gamma); return mu.map(function (m) { return poissonDraw(r, gammaDraw(r, CAL.k) * m / CAL.k); }); }
  function calLoss(y, w, beta, gamma) { var m = calCases(beta, gamma, w), s = 0; for (var i = 0; i < w; i++) { var e = y[i] - m[i]; s += e * e / Math.max(m[i], 1); } return s; }
  function inBox(p) { return [Math.min(CAL.b1, Math.max(CAL.b0, p[0])), Math.min(CAL.g1, Math.max(CAL.g0, p[1]))]; }
  function calMap(y, w, n) { // log10 loss on an n x n grid; m[i][j]: beta index i, gamma index j
    n = n || 40; var m = [], best = { v: Infinity };
    for (var i = 0; i < n; i++) { var row = []; for (var j = 0; j < n; j++) { var b = CAL.b0 + (CAL.b1 - CAL.b0) * (i + 0.5) / n, g = CAL.g0 + (CAL.g1 - CAL.g0) * (j + 0.5) / n, v = calLoss(y, w, b, g); row.push(Math.log10(v)); if (v < best.v) best = { v: v, b: b, g: g }; } m.push(row); }
    return { m: m, n: n, best: best };
  }
  // Nelder-Mead on (beta / 0.1, gamma / 0.05); f counts model runs
  function calNM(f, x0, maxEval) {
    maxEval = maxEval || 400; var sc = [0.1, 0.05], path = [], ev = 0;
    function F(z) { ev++; var p = inBox([z[0] * sc[0], z[1] * sc[1]]); return f(p[0], p[1]); }
    var s = [[x0[0] / sc[0], x0[1] / sc[1]], [x0[0] / sc[0] + 0.5, x0[1] / sc[1]], [x0[0] / sc[0], x0[1] / sc[1] + 0.5]].map(function (z) { return { z: z, v: F(z) }; });
    while (ev < maxEval) {
      s.sort(function (a, b) { return a.v - b.v; }); path.push([s[0].z[0] * sc[0], s[0].z[1] * sc[1]]);
      if (Math.abs(s[2].v - s[0].v) < 1e-7 * Math.max(1, Math.abs(s[0].v)) && Math.hypot(s[2].z[0] - s[0].z[0], s[2].z[1] - s[0].z[1]) < 1e-6) break;
      var c = [(s[0].z[0] + s[1].z[0]) / 2, (s[0].z[1] + s[1].z[1]) / 2], W = s[2].z;
      var xr = [c[0] + (c[0] - W[0]), c[1] + (c[1] - W[1])], vr = F(xr);
      if (vr < s[0].v) { var xe = [c[0] + 2 * (c[0] - W[0]), c[1] + 2 * (c[1] - W[1])], ve = F(xe); s[2] = ve < vr ? { z: xe, v: ve } : { z: xr, v: vr }; }
      else if (vr < s[1].v) s[2] = { z: xr, v: vr };
      else { var xc = [c[0] + 0.5 * (W[0] - c[0]), c[1] + 0.5 * (W[1] - c[1])], vc = F(xc);
        if (vc < s[2].v) s[2] = { z: xc, v: vc };
        else { for (var i = 1; i < 3; i++) { s[i].z = [s[0].z[0] + 0.5 * (s[i].z[0] - s[0].z[0]), s[0].z[1] + 0.5 * (s[i].z[1] - s[0].z[1])]; s[i].v = F(s[i].z); } } }
    }
    s.sort(function (a, b) { return a.v - b.v; }); var p = inBox([s[0].z[0] * sc[0], s[0].z[1] * sc[1]]); path.push(p);
    return { p: p, v: s[0].v, evals: ev, path: path };
  }
  // gradient descent: finite-difference gradient, normalised step, halving line search
  function calGD(f, x0, iters) {
    iters = iters || 200; var sc = [0.1, 0.05], z = [x0[0] / sc[0], x0[1] / sc[1]], ev = 0, t = 0.5, path = [x0.slice()], h = 1e-6;
    function F(zz) { ev++; var p = inBox([zz[0] * sc[0], zz[1] * sc[1]]); return f(p[0], p[1]); }
    var v = F(z);
    for (var k = 0; k < iters; k++) {
      var g = [(F([z[0] + h, z[1]]) - v) / h, (F([z[0], z[1] + h]) - v) / h], gn = Math.hypot(g[0], g[1]) || 1e-12, d = [-g[0] / gn, -g[1] / gn]; t = Math.min(2 * t, 0.5);
      var zn, vn;
      for (;;) { zn = [z[0] + t * d[0], z[1] + t * d[1]]; vn = F(zn); if (vn < v || t < 1e-7) break; t /= 2; }
      if (vn >= v) break; z = zn; v = vn; path.push(inBox([z[0] * sc[0], z[1] * sc[1]]));
    }
    return { p: inBox([z[0] * sc[0], z[1] * sc[1]]), v: v, evals: ev, path: path };
  }
  function calPSO(f, seed, n, iters) {
    n = n || 15; iters = iters || 30; var r = rng(seed), X = [], V = [], P = [], PV = [], ev = 0, gi = 0, path = [];
    function F(p) { ev++; return f(p[0], p[1]); }
    for (var i = 0; i < n; i++) { var p = [CAL.b0 + r() * (CAL.b1 - CAL.b0), CAL.g0 + r() * (CAL.g1 - CAL.g0)]; X.push(p); V.push([0, 0]); P.push(p.slice()); PV.push(F(p)); if (PV[i] < PV[gi]) gi = i; }
    path.push(P[gi].slice());
    for (var it = 1; it < iters; it++) {
      for (var j = 0; j < n; j++) {
        for (var a = 0; a < 2; a++) V[j][a] = 0.7 * V[j][a] + 1.5 * r() * (P[j][a] - X[j][a]) + 1.5 * r() * (P[gi][a] - X[j][a]);
        X[j] = inBox([X[j][0] + V[j][0], X[j][1] + V[j][1]]); var vj = F(X[j]); if (vj < PV[j]) { PV[j] = vj; P[j] = X[j].slice(); if (vj < PV[gi]) gi = j; }
      }
      path.push(P[gi].slice());
    }
    return { p: P[gi], v: PV[gi], evals: ev, path: path, cloud: X };
  }
  function calGridSearch(f, n) {
    n = n || 41; var best = { v: Infinity }, ev = 0;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { var b = CAL.b0 + (CAL.b1 - CAL.b0) * i / (n - 1), g = CAL.g0 + (CAL.g1 - CAL.g0) * j / (n - 1), v = f(b, g); ev++; if (v < best.v) best = { v: v, p: [b, g] }; }
    return { p: best.p, v: best.v, evals: ev, path: [best.p] };
  }
  function calBest(f) { // the reference: Nelder-Mead from three starts, tight
    var starts = [[0.3, 0.15], [0.45, 0.22], [0.15, 0.06]], best = null;
    starts.forEach(function (s) { var r = calNM(f, s, 800); if (!best || r.v < best.v) best = r; });
    return best;
  }
  // ABC rejection on a stochastic SIR in a town of 2,000 (5 first cases, daily binomial steps)
  var ABC = { n: 2000, i0: 5, days: 150, beta: 0.3, gamma: 0.1 };
  function abcSim(r, beta, gamma) {
    var S = ABC.n - ABC.i0, I = ABC.i0, tot = 0, pk = 0, pd = 0, pg = 1 - Math.exp(-gamma);
    for (var d = 0; d < ABC.days; d++) {
      var nw = binomDraw(r, S, 1 - Math.exp(-beta * I / ABC.n)), rc = binomDraw(r, I, pg); S -= nw; I += nw - rc; tot += nw;
      if (nw > pk) { pk = nw; pd = d; }
      if (I === 0) break;
    }
    return [tot, pd, pk];
  }
  function abcObserved(seed) { var r = rng(seed), s; do { s = abcSim(r, ABC.beta, ABC.gamma); } while (s[0] < 200); return s; }
  function abcRun(o) { // o: {seed, sims, keep, use:[total, day, height]}
    var r = rng(o.seed), obs = abcObserved(o.obsSeed || 7), sc = [obs[0], 30, obs[2]], rows = [], fiz = 0;
    for (var i = 0; i < o.sims; i++) {
      var b = 0.1 + 0.5 * r(), g = 0.05 + 0.25 * r(), s = abcSim(r, b, g), d2 = 0;
      if (s[0] < 50) fiz++;
      for (var a = 0; a < 3; a++) if (o.use[a]) { var e = (s[a] - obs[a]) / sc[a]; d2 += e * e; }
      rows.push([d2, b, g]);
    }
    rows.sort(function (x, y) { return x[0] - y[0]; });
    var nk = Math.max(1, Math.round(o.sims * o.keep)), kept = rows.slice(0, nk), R = kept.map(function (k) { return k[1] / k[2]; }).sort(function (x, y) { return x - y; });
    var qq = function (p) { return R[Math.min(R.length - 1, Math.floor(p * R.length))]; };
    return { obs: obs, kept: kept, n: nk, lo: qq(0.05), med: qq(0.5), hi: qq(0.95), fizzled: fiz / o.sims };
  }

  function calibLab(root) {
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['win', 'sb', 'sg', 'near', 'sims', 'keep', 'u0', 'u1', 'u2'].forEach(function (k) { el[k] = q(root, k); });
    var seed = 1, method = 'grid', y = calData(seed), cache = {}, KEEP = [0.001, 0.0025, 0.005, 0.01, 0.02, 0.05, 0.1], absSeed = 11;
    function hl() { root.querySelectorAll('[data-k^="m-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'm-' + method; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); }); }
    function ref(w) { var key = seed + ':' + w; if (!cache[key]) { var f = function (b, g) { return calLoss(y, w, b, g); }; cache[key] = { best: calBest(f), map: calMap(y, w, 40) }; } return cache[key]; }
    function fitRun() {
      var w = +el.win.value, x0 = [+el.sb.value, +el.sg.value], R0 = ref(w), f = function (b, g) { return calLoss(y, w, b, g); }, res;
      set(q(root, 'win-out'), w + ' days'); set(q(root, 'sb-out'), x0[0].toFixed(2)); set(q(root, 'sg-out'), x0[1].toFixed(2));
      el.sb.disabled = el.sg.disabled = (method === 'grid' || method === 'pso');
      if (method === 'grid') res = calGridSearch(f, 41); else if (method === 'pso') res = calPSO(f, seed * 7 + 3); else if (method === 'gd') res = calGD(f, x0, 200); else res = calNM(f, x0, 400);
      var ratio = res.v / R0.best.v;
      set(q(root, 'fb'), res.p[0].toFixed(3)); set(q(root, 'fg'), res.p[1].toFixed(3)); set(q(root, 'fr'), (res.p[0] / res.p[1]).toFixed(2)); set(q(root, 'fe'), res.evals.toLocaleString('en-US'));
      set(q(root, 'fx'), ratio <= 1.0005 ? 'best' : '+' + pct(ratio - 1));
      // the region within 5% of the best fit on the map
      var M = R0.map, lim = Math.log10(R0.best.v * 1.05), gmin = Infinity, gmax = -Infinity, rmin = Infinity, rmax = -Infinity;
      for (var i = 0; i < M.n; i++) for (var j = 0; j < M.n; j++) if (M.m[i][j] <= lim) { var b = CAL.b0 + (CAL.b1 - CAL.b0) * (i + 0.5) / M.n, g = CAL.g0 + (CAL.g1 - CAL.g0) * (j + 0.5) / M.n; gmin = Math.min(gmin, g); gmax = Math.max(gmax, g); rmin = Math.min(rmin, b / g); rmax = Math.max(rmax, b / g); }
      var names = { grid: 'Grid search (41 × 41)', nm: 'Nelder–Mead', gd: 'Gradient descent (200 steps at most)', pso: 'Particle swarm (15 × 30)' };
      set(q(root, 'fstatus'), names[method] + ': ' + res.evals.toLocaleString('en-US') + ' model runs; loss ' + Math.round(res.v) + ' (best ' + Math.round(R0.best.v) + '). ' +
        (!isFinite(gmin) ? '' : gmax - gmin < 1e-9 ? 'Within 5% of the best fit: a single cell of the map (gamma ' + gmin.toFixed(2) + ', R0 ' + rmin.toFixed(1) + ').' : 'Within 5% of the best fit: gamma ' + gmin.toFixed(2) + '–' + gmax.toFixed(2) + ', R0 ' + rmin.toFixed(1) + '–' + rmax.toFixed(1) + '.'));
      render(q(root, 'map'), function (W, H) {
        var pl = 46, pr = 10, pt = 10, pb = 34, iw = W - pl - pr, ih = H - pt - pb, n = M.n, cw = iw / n, chh = ih / n, out = [], mn = Infinity;
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) mn = Math.min(mn, M.m[i][j]);
        var X = function (b) { return pl + iw * (b - CAL.b0) / (CAL.b1 - CAL.b0); }, Y = function (g) { return pt + ih * (1 - (g - CAL.g0) / (CAL.g1 - CAL.g0)); };
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
          var u = Math.min(1, (M.m[i][j] - mn) / 2.2), c = [Math.round(30 + 218 * u), Math.round(58 + 192 * u), Math.round(138 + 114 * u)];
          out.push('<rect x="' + (pl + i * cw).toFixed(1) + '" y="' + (pt + ih - (j + 1) * chh).toFixed(1) + '" width="' + (cw + 0.6).toFixed(1) + '" height="' + (chh + 0.6).toFixed(1) + '" fill="rgb(' + c.join(',') + ')"/>');
          if (el.near.checked && M.m[i][j] <= lim) out.push('<rect x="' + (pl + i * cw).toFixed(1) + '" y="' + (pt + ih - (j + 1) * chh).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + chh.toFixed(1) + '" fill="none" stroke="#fde047" stroke-width="1.2"/>');
        }
        [0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function (b) { out.push(txt(X(b), H - pb + 14, String(b))); });
        [0.05, 0.1, 0.15, 0.2, 0.25, 0.3].forEach(function (g) { out.push(txt(pl - 6, Y(g) + 4, String(g), { anchor: 'end' })); });
        out.push(txt(pl + iw / 2, H - 4, 'beta (transmission rate)', { fill: '#475569' })); out.push(txt(12, pt + ih / 2, 'gamma', { fill: '#475569', rotate: true }));
        if (res.cloud) res.cloud.forEach(function (p) { out.push('<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="2.5" fill="#ffffff" opacity=".8"/>'); });
        if (res.path.length > 1) out.push('<path d="' + res.path.map(function (p, k) { return (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ') + '" fill="none" stroke="#f97316" stroke-width="2.4" stroke-linejoin="round"/>');
        out.push('<circle cx="' + X(R0.best.p[0]).toFixed(1) + '" cy="' + Y(R0.best.p[1]).toFixed(1) + '" r="6" fill="#fde047" stroke="#111827" stroke-width="1.5"/>');
        out.push('<circle cx="' + X(res.p[0]).toFixed(1) + '" cy="' + Y(res.p[1]).toFixed(1) + '" r="5" fill="#f97316" stroke="#ffffff" stroke-width="1.5"/>');
        out.push('<circle cx="' + X(CAL.beta).toFixed(1) + '" cy="' + Y(CAL.gamma).toFixed(1) + '" r="7" fill="none" stroke="#ffffff" stroke-width="2"/>');
        return out.join('');
      });
      chart(q(root, 'fchart'), { series: [{ y: y, color: C.grey, width: 1.4 }, { y: calCases(res.p[0], res.p[1], CAL.days), color: C.orange, width: 2.6 }], xLabel: 'day (the fit uses days 0 to ' + (w - 1) + ')', yLabel: 'reported cases',
        yFormat: function (v) { return Math.round(v).toLocaleString('en-US'); }, marks: [{ x: w - 1, label: w < CAL.days ? 'end of data used' : '' }] });
      mark(0, method === 'nm' && w === CAL.days && ratio <= 1.01);
      mark(1, method === 'gd' && ratio <= 1.05);
      mark(2, w <= 30 && gmax - gmin > 0.1);
      root.setAttribute('data-fit', [method, w, res.evals, ratio.toFixed(4), (gmax - gmin).toFixed(3)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    function abcGo() {
      var sims = +el.sims.value, keep = KEEP[+el.keep.value], use = [el.u0.checked, el.u1.checked, el.u2.checked];
      set(q(root, 'sims-out'), sims.toLocaleString('en-US')); set(q(root, 'keep-out'), (keep * 100) + '%');
      if (!use[0] && !use[1] && !use[2]) { set(q(root, 'astatus'), 'Pick at least one summary.'); return; }
      var r = abcRun({ seed: absSeed, sims: sims, keep: keep, use: use });
      set(q(root, 'ak'), r.n.toLocaleString('en-US')); set(q(root, 'am'), r.med.toFixed(2)); set(q(root, 'ai'), r.lo.toFixed(1) + '–' + r.hi.toFixed(1)); set(q(root, 'af'), pct(r.fizzled, 0));
      set(q(root, 'astatus'), 'Observed outbreak: ' + r.obs[0].toLocaleString('en-US') + ' cases, peak of ' + r.obs[2] + ' on day ' + r.obs[1] + '. Kept the ' + r.n + ' closest of ' + sims.toLocaleString('en-US') + ' simulations (truth: R0 3).');
      render(q(root, 'plane'), function (W, H) {
        var pl = 46, pr = 10, pt = 10, pb = 34, iw = W - pl - pr, ih = H - pt - pb, out = [];
        var X = function (b) { return pl + iw * (b - CAL.b0) / (CAL.b1 - CAL.b0); }, Y = function (g) { return pt + ih * (1 - (g - CAL.g0) / (CAL.g1 - CAL.g0)); };
        out.push('<rect x="' + X(0.1).toFixed(1) + '" y="' + Y(0.3).toFixed(1) + '" width="' + (X(0.6) - X(0.1)).toFixed(1) + '" height="' + (Y(0.05) - Y(0.3)).toFixed(1) + '" fill="#eff6ff" stroke="#2563eb" stroke-dasharray="5 4"/>');
        [r.lo, r.hi].forEach(function (R) { var g1 = Math.min(CAL.g1, CAL.b1 / R); out.push('<line x1="' + X(CAL.g0 * R).toFixed(1) + '" y1="' + Y(CAL.g0).toFixed(1) + '" x2="' + X(g1 * R).toFixed(1) + '" y2="' + Y(g1).toFixed(1) + '" stroke="#64748b" stroke-dasharray="6 5"/>'); });
        r.kept.slice(0, 600).forEach(function (k) { out.push('<circle cx="' + X(k[1]).toFixed(1) + '" cy="' + Y(k[2]).toFixed(1) + '" r="2.6" fill="#2563eb" opacity=".7"/>'); });
        out.push('<circle cx="' + X(ABC.beta).toFixed(1) + '" cy="' + Y(ABC.gamma).toFixed(1) + '" r="7" fill="none" stroke="#111827" stroke-width="2"/>');
        [0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function (b) { out.push(txt(X(b), H - pb + 14, String(b))); });
        [0.05, 0.1, 0.15, 0.2, 0.25, 0.3].forEach(function (g) { out.push(txt(pl - 6, Y(g) + 4, String(g), { anchor: 'end' })); });
        out.push(txt(pl + iw / 2, H - 4, 'beta', { fill: '#475569' })); out.push(txt(12, pt + ih / 2, 'gamma', { fill: '#475569', rotate: true }));
        return out.join('');
      });
      mark(3, r.n >= 50 && r.hi - r.lo < ABC_GOAL);
      root.setAttribute('data-abc', [sims, keep, use.map(Number).join(''), r.n, r.lo.toFixed(3), r.med.toFixed(3), r.hi.toFixed(3)].join(':'));
    }
    ['win', 'sb', 'sg'].forEach(function (k) { on(el[k], 'input', fitRun); }); on(el.near, 'change', fitRun);
    root.querySelectorAll('[data-k^="m-"]').forEach(function (b) { on(b, 'click', function () { method = b.getAttribute('data-k').slice(2); hl(); fitRun(); }); });
    on(q(root, 'newdata'), 'click', function () { seed++; y = calData(seed); cache = {}; fitRun(); });
    ['sims', 'keep'].forEach(function (k) { on(el[k], 'input', function () { set(q(root, 'sims-out'), (+el.sims.value).toLocaleString('en-US')); set(q(root, 'keep-out'), (KEEP[+el.keep.value] * 100) + '%'); }); });
    on(q(root, 'arun'), 'click', abcGo);
    hl(); fitRun(); abcGo();
  }

  // ------------------------------------------------------------------ Module 9 lab: what surveillance sees (cases, serosurveys, wastewater)
  var SV = { N: 1000000, days: 200 };
  function svR(t) { var pts = [[0, 1.8], [62, 1.8], [72, 0.8], [110, 0.8], [120, 1.25], [200, 1.25]]; for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if (t >= a[0] && t <= b[0]) return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); } return 1.25; }
  // the module's latent epidemic: SEIR (latent 3 days, infectious 5), 20 first exposed, daily steps as in the course's simulation
  function svInfections() { var N = SV.N, S = N - 20, E = 20, I = 0, out = []; for (var t = 0; t < SV.days; t++) { var nw = svR(t) * 0.2 * S * I / N; S -= nw; var e2 = E + nw - E / 3, i2 = I + E / 3 - 0.2 * I; E = e2; I = i2; out.push(nw); } return out; }
  function gammaPmf(mean, shape, n) { var sc = mean / shape, p = [], s = 0; for (var i = 0; i < n; i++) { var x = i + 0.5, v = Math.pow(x, shape - 1) * Math.exp(-x / sc); p.push(v); s += v; } return p.map(function (v) { return v / s; }); }
  function convolve(x, k) { var out = new Array(x.length).fill(0); for (var t = 0; t < x.length; t++) for (var j = 0; j < k.length && j <= t; j++) out[t] += x[t - j] * k[j]; return out; }
  function svCases(inf, o) { // o: {rho1, rho2, change, delay}
    var rho = inf.map(function (_, t) { return t >= o.change ? o.rho2 : o.rho1; });
    return { rho: rho, mu: convolve(inf.map(function (v, t) { return v * rho[t]; }), gammaPmf(o.delay, 3, 40)) };
  }
  function growth7(x, t) { return Math.log((x[t] + 1) / (x[t - 7] + 1)) / 7; }
  function svSero(inf, day, o) { // o: {n, se, sp}; seropositive 14 days after infection
    var c = 0; for (var t = 0; t <= day - 14 && t < inf.length; t++) c += inf[t];
    var pt = c / SV.N, po = (1 - o.sp) + (o.se + o.sp - 1) * pt, sd = Math.sqrt(po * (1 - po) / o.n), k = o.se + o.sp - 1;
    var cl = function (v) { return Math.max(0, Math.min(1, v)); };
    return { truth: pt, raw: po, lo: cl((po - 1.645 * sd + o.sp - 1) / k), hi: cl((po + 1.645 * sd + o.sp - 1) / k), est: cl((po + o.sp - 1) / k) };
  }
  function svWaste(inf, o) { // o: {noise, rain, norm, perWeek, seed}
    var r = rng(o.seed), shed = gammaPmf(6, 2, 30), load = convolve(inf, shed), samples = [], days = { 1: [2], 2: [0, 3], 3: [0, 2, 4], 7: [0, 1, 2, 3, 4, 5, 6] }[o.perWeek] || [0, 2, 4];
    for (var t = 0; t < inf.length; t++) {
      var flow = 1, rainy = r() < 0.12; if (rainy) flow = 1.5 + r(); if (!o.rain) flow = 1;
      var eps = Math.exp(o.noise * gaussian(r)), marker = (1 / flow) * Math.exp(0.12 * gaussian(r)), conc = load[t] / flow * eps;
      if (days.indexOf(t % 7) >= 0) samples.push({ d: t, v: o.norm ? conc / marker : conc, rain: rainy && o.rain });
    }
    return samples;
  }
  function slopeOf(pts) { var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; }); return (n * sxy - sx * sy) / (n * sxx - sx * sx); }
  function turnDay(series, minPts) { // first day from day 50 on when the 14-day log-linear growth turns negative and stays negative for a week; series: [{d, v}]
    var g = {};
    for (var t = 40; t < SV.days; t++) {
      var pts = series.filter(function (s) { return s.d > t - 14 && s.d <= t && s.v > 0; }).map(function (s) { return [s.d, Math.log(s.v)]; });
      if (pts.length >= (minPts || 4)) g[t] = slopeOf(pts);
    }
    for (var t2 = 50; t2 < SV.days - 7; t2++) { var ok = true; for (var j = 0; j < 7; j++) if (!(g[t2 + j] < 0)) { ok = false; break; } if (ok) return t2; }
    return null;
  }

  function streamsLab(root) {
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['r1', 'r2', 'cd', 'dl', 'sday', 'sn', 'se', 'sp', 'wn', 'wr', 'wz', 'wk'].forEach(function (k) { el[k] = q(root, k); });
    var inf = svInfections(), daily = inf.map(function (v, d) { return { d: d, v: v }; }), tInf = turnDay(daily, 4), seed = 3;
    function casesRun() {
      var o = { rho1: +el.r1.value, rho2: +el.r2.value, change: +el.cd.value, delay: +el.dl.value }, c = svCases(inf, o);
      set(q(root, 'r1-out'), pct(o.rho1, 0)); set(q(root, 'r2-out'), pct(o.rho2, 0)); set(q(root, 'cd-out'), 'day ' + o.change); set(q(root, 'dl-out'), o.delay + ' days');
      var pi = 0, pc = 0; for (var t = 0; t < 120; t++) { if (inf[t] > inf[pi]) pi = t; if (c.mu[t] > c.mu[pc]) pc = t; }
      var wrong = 0; for (var t2 = 30; t2 < SV.days; t2++) if (growth7(c.mu, t2) < 0 && growth7(inf, t2) > 0) wrong++;
      var tot = c.mu.reduce(function (a, b) { return a + b; }, 0), ti = inf.reduce(function (a, b) { return a + b; }, 0);
      set(q(root, 'cpk'), 'day ' + pc); set(q(root, 'ipk'), 'day ' + pi); set(q(root, 'csh'), pct(tot / ti, 0)); set(q(root, 'cwrong'), wrong + (wrong === 1 ? ' day' : ' days'));
      set(q(root, 'cstatus'), 'Infections peak on day ' + pi + ', reported cases on day ' + pc + ' (' + (pc - pi) + ' days later). ' + Math.round(ti).toLocaleString('en-US') + ' infections, ' + Math.round(tot).toLocaleString('en-US') + ' reported cases. ' +
        (wrong ? 'On ' + wrong + ' days, reported cases fell while infections rose.' : 'Cases and infections always moved the same way.'));
      var scale = 1 / o.rho1;
      chart(q(root, 'cchart'), { series: [{ y: inf, color: C.orange, width: 2.6 }, { y: c.mu.map(function (v) { return v * scale; }), color: C.blue, width: 2.4 }], xLabel: 'day', yLabel: 'per day',
        yFormat: function (v) { return Math.round(v).toLocaleString('en-US'); }, marks: o.rho2 !== o.rho1 ? [{ x: o.change, label: 'share changes' }] : [] });
      mark(0, wrong >= 10);
      root.setAttribute('data-cases', [o.rho1, o.rho2, o.change, o.delay, pi, pc, wrong].join(':'));
    }
    function seroRun() {
      var o = { n: +el.sn.value, se: +el.se.value, sp: +el.sp.value }, day = +el.sday.value, s = svSero(inf, day, o);
      set(q(root, 'sday-out'), 'day ' + day); set(q(root, 'sn-out'), o.n.toLocaleString('en-US')); set(q(root, 'se-out'), pct(o.se, 0)); set(q(root, 'sp-out'), pct(o.sp, 1));
      set(q(root, 'st'), pct(s.truth, 2)); set(q(root, 'sr'), pct(s.raw, 2)); set(q(root, 'sc'), pct(s.lo, 1) + '–' + pct(s.hi, 1));
      set(q(root, 'sstatus'), 'On day ' + day + ', ' + pct(s.truth, 2) + ' of people have been infected (14 days earlier). The survey would show ' + pct(s.raw, 2) + ' positive' +
        (s.truth > 0 ? ' (' + (s.raw / s.truth).toFixed(1) + ' times the truth)' : '') + '; corrected, 90% of surveys land between ' + pct(s.lo, 1) + ' and ' + pct(s.hi, 1) + '.');
      var tr = [], rw = []; for (var d = 0; d < SV.days; d++) { var x = svSero(inf, d, o); tr.push(x.truth); rw.push(x.raw); }
      chart(q(root, 'schart'), { series: [{ y: tr, color: C.ink, width: 2.4 }, { y: rw, color: C.orange, width: 2.4 }], xLabel: 'day', yFormat: function (v) { return (v * 100).toFixed(0) + '%'; }, yLabel: 'share positive', marks: [{ x: day, label: 'survey' }] });
      mark(1, s.truth < 0.01 && s.truth > 0 && s.raw > 3 * s.truth);
      mark(2, s.hi - s.lo < 0.01 && s.truth > 0.005);
      root.setAttribute('data-sero', [day, o.n, o.se, o.sp, s.truth.toFixed(5), s.raw.toFixed(5), s.lo.toFixed(5), s.hi.toFixed(5)].join(':'));
    }
    function wasteRun() {
      var o = { noise: +el.wn.value, rain: el.wr.checked, norm: el.wz.checked, perWeek: [1, 2, 3, 7][+el.wk.value - 1] || 3, seed: seed }, smp = svWaste(inf, o);
      var c = svCases(inf, { rho1: +el.r1.value, rho2: +el.r2.value, change: +el.cd.value, delay: +el.dl.value }), tw = turnDay(smp, 4), tc = turnDay(c.mu.map(function (v, d) { return { d: d, v: v }; }), 4);
      set(q(root, 'wn-out'), o.noise.toFixed(2)); set(q(root, 'wk-out'), o.perWeek === 7 ? 'every day' : o.perWeek + (o.perWeek === 1 ? ' sample' : ' samples'));
      set(q(root, 'wti'), 'day ' + tInf); set(q(root, 'wtw'), tw === null ? '–' : 'day ' + tw); set(q(root, 'wtc'), tc === null ? '–' : 'day ' + tc);
      set(q(root, 'wstatus'), 'The first wave turns: infections on day ' + tInf + ', wastewater on ' + (tw === null ? 'no day' : 'day ' + tw) + ', reported cases on ' + (tc === null ? 'no day' : 'day ' + tc) +
        (tw !== null && tc !== null ? (tc > tw ? ' (' + (tc - tw) + (tc - tw === 1 ? ' day' : ' days') + ' of warning).' : tc === tw ? ' (the same day).' : ' (wastewater was ' + (tw - tc) + (tw - tc === 1 ? ' day' : ' days') + ' later than reported cases).') : '.') +
        (tw !== null && tw < tInf ? ' The wastewater turn came before the infections turned: noise faked it.' : ''));
      var mi = Math.max.apply(null, inf), mw = Math.max.apply(null, smp.map(function (s) { return s.v; }));
      render(q(root, 'wchart'), function (W, H) {
        var pl = 44, pr = 12, pt = 12, pb = 30, iw = W - pl - pr, ih = H - pt - pb, X = function (d) { return pl + iw * d / (SV.days - 1); }, Y = function (v) { return pt + ih * (1 - Math.min(1.2, v) / 1.2); }, out = [];
        out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/>');
        [0, 50, 100, 150, 199].forEach(function (d) { out.push(txt(X(d), H - pb + 16, String(d))); });
        out.push('<path d="' + inf.map(function (v, d) { return (d ? 'L' : 'M') + X(d).toFixed(1) + ' ' + Y(v / mi).toFixed(1); }).join(' ') + '" fill="none" stroke="' + C.orange + '" stroke-width="2.4"/>');
        smp.forEach(function (s) { out.push('<circle cx="' + X(s.d).toFixed(1) + '" cy="' + Y(s.v / mw).toFixed(1) + '" r="2.8" fill="' + (s.rain ? '#60a5fa' : C.blue) + '"/>'); });
        [[tInf, C.orange], [tw, C.blue], [tc, C.ink]].forEach(function (m) { if (m[0] !== null) out.push('<line x1="' + X(m[0]).toFixed(1) + '" x2="' + X(m[0]).toFixed(1) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + m[1] + '" stroke-dasharray="3 3"/>'); });
        out.push(txt(pl + 4, pt + 10, 'scaled to each maximum', { anchor: 'start', size: 11 }));
        return out.join('');
      });
      mark(3, o.noise >= 0.5 && tw !== null && tc !== null && tw >= tInf && tc - tw >= 2);
      root.setAttribute('data-waste', [o.noise, o.rain ? 1 : 0, o.norm ? 1 : 0, o.perWeek, tInf, tw, tc].join(':'));
      root.setAttribute('data-ready', '1');
    }
    ['r1', 'r2', 'cd', 'dl'].forEach(function (k) { on(el[k], 'input', function () { casesRun(); wasteRun(); }); });
    ['sday', 'sn', 'se', 'sp'].forEach(function (k) { on(el[k], 'input', seroRun); });
    ['wn', 'wk'].forEach(function (k) { on(el[k], 'input', wasteRun); }); ['wr', 'wz'].forEach(function (k) { on(el[k], 'change', wasteRun); });
    on(q(root, 'wnew'), 'click', function () { seed++; wasteRun(); });
    casesRun(); seroRun(); wasteRun();
  }

  // ------------------------------------------------------------------ Module 10 · lockdowns and vaccine priority (mirrors production/explains/sims/epi_m10_sims.py)
  var PO = { N: 1000000, R0: 2.5, sig: 1 / 3, gam: 1 / 5, hosp: 0.02, stay: 10, admit: 5, cap: 1000, ifr: 0.005, ifrNoBed: 0.4, lockCost: 0.5, behave: 0.5, behaveCost: 0.3 };
  function polSeir(o) { // o: {start, len, level, caution, days}; RK4, dt 0.25; caution: people cut contacts by up to 50% as beds fill
    var N = PO.N, beta0 = PO.R0 * PO.gam, days = o.days || 365, dt = 0.25, steps = 4, behave = o.caution ? PO.behave : 0;
    var u = function (t) { return (t >= o.start && t < o.start + o.len) ? o.level : 0; };
    var y = [N - 10, 0, 10], hist = [], newd = [], bs = [], k, i;
    for (i = 0; i < PO.admit + PO.stay + 2; i++) hist.push(0);
    function f(t, y, b) { var inf = beta0 * (1 - u(t)) * (1 - b) * y[2] / N * y[0]; return { d: [-inf, inf - PO.sig * y[1], PO.sig * y[1] - PO.gam * y[2]], inf: inf }; }
    for (var day = 0; day < days; day++) {
      var H = 0; for (k = PO.admit; k < PO.admit + PO.stay; k++) H += hist[k]; H *= PO.hosp;
      var b = behave ? behave * H / (H + PO.cap) : 0, tot = 0;
      for (k = 0; k < steps; k++) {
        var t = day + k * dt, a1 = f(t, y, b), y2 = y.map(function (v, j) { return v + dt / 2 * a1.d[j]; }), a2 = f(t + dt / 2, y2, b);
        var y3 = y.map(function (v, j) { return v + dt / 2 * a2.d[j]; }), a3 = f(t + dt / 2, y3, b), y4 = y.map(function (v, j) { return v + dt * a3.d[j]; }), a4 = f(t + dt, y4, b);
        y = y.map(function (v, j) { return v + dt / 6 * (a1.d[j] + 2 * a2.d[j] + 2 * a3.d[j] + a4.d[j]); }); tot += dt / 6 * (a1.inf + 2 * a2.inf + 2 * a3.inf + a4.inf);
      }
      newd.push(tot); bs.push(b); hist.unshift(tot); hist.pop();
    }
    var adm = newd.map(function (v, t) { return t >= PO.admit ? PO.hosp * newd[t - PO.admit] : 0; }), occ = [], deaths = 0, over = 0, gdp = 0, s = 0;
    for (var t2 = 0; t2 < days; t2++) {
      var o2 = 0; for (k = Math.max(0, t2 - PO.stay + 1); k <= t2; k++) o2 += adm[k]; occ.push(o2);
      var ov = o2 > PO.cap ? (o2 - PO.cap) / o2 : 0; if (o2 > PO.cap) over++;
      deaths += PO.ifr * newd[t2] + PO.ifrNoBed * adm[t2] * ov; gdp += PO.lockCost * u(t2) + PO.behaveCost * bs[t2]; s += newd[t2];
    }
    return { daily: newd, beds: occ, deaths: deaths, attack: s / N, peakBeds: Math.max.apply(null, occ), daysOver: over, gdp: gdp / 365 * 100 };
  }
  var PA = { share: [0.22, 0.60, 0.18], ifr: [0.0001, 0.002, 0.025] };
  PA.NA = PA.share.map(function (x) { return PO.N * x; });
  function paMat(cc, ca, cs, aa, as_, ss) { var M = [[cc, ca, cs], [0, aa, as_], [0, 0, ss]]; for (var i = 0; i < 3; i++) for (var j = 0; j < i; j++) M[i][j] = M[j][i] * PA.NA[j] / PA.NA[i]; return M; }
  PA.C = (function () {
    var S = [paMat(1.0, 2.0, 0.3, 1.2, 0.3, 0.9), paMat(7.0, 0.6, 0.0, 0.1, 0.0, 0.0), paMat(0.0, 0.2, 0.0, 5.0, 0.1, 0.3), paMat(2.0, 1.5, 0.3, 3.0, 0.6, 1.5)];
    return [0, 1, 2].map(function (i) { return [0, 1, 2].map(function (j) { return S.reduce(function (a, M) { return a + M[i][j]; }, 0); }); });
  })();
  function specRad(M) { var v = [1, 1, 1], lam = 0; for (var it = 0; it < 500; it++) { var w = [0, 1, 2].map(function (i) { return M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]; }), n = Math.max.apply(null, w); lam = n; v = w.map(function (x) { return x / n; }); } return lam; }
  PA.q = PO.R0 * PO.gam / specRad(PA.C);
  var PA_ORDER = { seniors: [2, 1, 0], children: [0, 1, 2], adults: [1, 0, 2], equal: null };
  var PA_VAX = { block: [0.9, 0.0], severe: [0.3, 0.857] };
  function polAge(o) { // o: {order, vaccine, perDay, start, stock, days}; Euler, dt 0.5; doses go to susceptible people in the chosen order
    var NA = PA.NA, dt = 0.5, days = o.days || 400, DOSE = (o.perDay || 0) * PO.N, STOCK = (o.stock || 0) * PO.N, order = PA_ORDER[o.order], ev = PA_VAX[o.vaccine] || PA_VAX.block, ei = ev[0], es = ev[1];
    var S = NA.slice(), E = [0, 0, 0], I = [0, 0, 0], V = [0, 0, 0], EV = [0, 0, 0], IV = [0, 0, 0], used = 0, cu = [0, 0, 0], cv = [0, 0, 0], daily = [], g;
    S[1] -= 10; I[1] = 10;
    for (var day = 0; day < days; day++) {
      var d = [0, 0, 0];
      if (DOSE > 0 && day >= o.start && used < STOCK) {
        var left = Math.min(DOSE, STOCK - used); used += left;
        if (!order) { var ss = S[0] + S[1] + S[2]; for (g = 0; g < 3; g++) d[g] = left * S[g] / ss; }
        else for (var oi = 0; oi < 3; oi++) { g = order[oi]; var take = Math.min(left, S[g] * 0.98); d[g] += take; left -= take; if (left <= 1e-9) break; }
      }
      for (g = 0; g < 3; g++) d[g] = Math.min(d[g], S[g] * 0.999);
      var tot = 0;
      for (var st = 0; st < 2; st++) {
        var x = [0, 1, 2].map(function (j) { return (I[j] + IV[j]) / NA[j]; }), lam = [0, 1, 2].map(function (i) { return PA.q * (PA.C[i][0] * x[0] + PA.C[i][1] * x[1] + PA.C[i][2] * x[2]); });
        for (g = 0; g < 3; g++) {
          var iu = lam[g] * S[g], iv = (1 - ei) * lam[g] * V[g];
          S[g] += dt * (-iu - d[g]); V[g] += dt * (d[g] - iv);
          E[g] += dt * (iu - PO.sig * E[g]); EV[g] += dt * (iv - PO.sig * EV[g]);
          I[g] += dt * (PO.sig * E[g] - PO.gam * I[g]); IV[g] += dt * (PO.sig * EV[g] - PO.gam * IV[g]);
          cu[g] += dt * iu; cv[g] += dt * iv; tot += dt * (iu + iv);
        }
      }
      daily.push(tot);
    }
    var deathsAge = [0, 1, 2].map(function (j) { return (cu[j] + (1 - es) * cv[j]) * PA.ifr[j]; });
    return { daily: daily, infections: cu[0] + cu[1] + cu[2] + cv[0] + cv[1] + cv[2], deaths: deathsAge[0] + deathsAge[1] + deathsAge[2], deathsAge: deathsAge,
             attackAge: [0, 1, 2].map(function (j) { return (cu[j] + cv[j]) / NA[j]; }), used: used };
  }
  function policyLab(root) {
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['ls', 'll', 'lv', 'lc', 'vd', 'vs', 'vk'].forEach(function (k) { el[k] = q(root, k); });
    var none = { off: polSeir({ start: 0, len: 0, level: 0, caution: false }), on: polSeir({ start: 0, len: 0, level: 0, caution: true }) };
    var order = 'seniors', vaccine = 'block', vnone = polAge({ perDay: 0, stock: 0, start: 0 });
    var k0 = function (v) { return Math.round(v).toLocaleString('en-US'); };
    function lockRun() {
      var o = { start: +el.ls.value, len: +el.ll.value, level: +el.lv.value, caution: el.lc.checked }, r = polSeir(o), n0 = o.caution ? none.on : none.off;
      set(q(root, 'ls-out'), 'day ' + o.start); set(q(root, 'll-out'), o.len + ' days'); set(q(root, 'lv-out'), pct(o.level, 0));
      set(q(root, 'lat'), pct(r.attack, 0)); set(q(root, 'lpb'), k0(r.peakBeds)); set(q(root, 'lov'), r.daysOver + (r.daysOver === 1 ? ' day' : ' days')); set(q(root, 'ld'), k0(r.deaths)); set(q(root, 'lg'), r.gdp.toFixed(1) + '%');
      var on_ = o.len > 0 && o.level > 0, dd = r.deaths - n0.deaths;
      set(q(root, 'lstatus'), (on_ ? 'A ' + pct(o.level, 0) + ' cut from day ' + o.start + ' to day ' + (o.start + o.len) + ': ' : 'No lockdown: ') + pct(r.attack, 0) + ' infected, ' + k0(r.deaths) + ' deaths' +
        (on_ ? ' (' + (dd <= 0 ? k0(-dd) + ' fewer' : k0(dd) + ' more') + ' than with no lockdown)' : '') + ', beds over capacity on ' + r.daysOver + ' days, ' + r.gdp.toFixed(1) + '% of a year\'s output lost.');
      var marks = on_ ? [{ x: o.start, label: 'lockdown', color: C.blue }, { x: Math.min(364, o.start + o.len), label: 'ends', color: C.blue }] : [];
      chart(q(root, 'lchart'), { series: [{ y: n0.beds, color: C.grey, width: 2 }, { y: r.beds, color: C.orange, width: 2.6 }, { y: r.beds.map(function () { return PO.cap; }), color: C.ink, width: 1.4, dash: '6 5' }],
        xLabel: 'day', yLabel: 'beds in use', yFormat: function (v) { return k0(v); }, marks: marks });
      mark(0, !o.caution && r.deaths < 5000);
      mark(1, !o.caution && o.level >= 0.5 && o.len >= 30 && on_ && r.deaths >= 0.98 * n0.deaths);
      root.setAttribute('data-lock', [o.start, o.len, o.level, o.caution ? 1 : 0, Math.round(r.deaths), r.attack.toFixed(4), Math.round(r.peakBeds), r.daysOver, r.gdp.toFixed(2)].join(':'));
    }
    function hl() {
      root.querySelectorAll('[data-k^="o-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'o-' + order; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
      root.querySelectorAll('[data-k^="x-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'x-' + vaccine; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
    }
    function vaxRun() {
      var o = { order: order, vaccine: vaccine, perDay: +el.vd.value, start: +el.vs.value, stock: +el.vk.value }, r = polAge(o);
      set(q(root, 'vd-out'), k0(o.perDay * PO.N) + ' a day'); set(q(root, 'vs-out'), 'day ' + o.start); set(q(root, 'vk-out'), k0(o.stock * PO.N));
      set(q(root, 'vi'), k0(r.infections)); set(q(root, 'vdd'), k0(r.deaths)); set(q(root, 'vsd'), k0(r.deathsAge[2]));
      var names = { seniors: 'Seniors first', children: 'Children first', adults: 'Adults first', equal: 'Everyone equally' };
      set(q(root, 'vstatus'), names[order] + ', a vaccine that ' + (vaccine === 'block' ? 'blocks 90% of infections' : 'mainly prevents severe disease') + ': ' + k0(r.infections) + ' infections and ' + k0(r.deaths) + ' deaths (no vaccine: ' +
        k0(vnone.infections) + ' and ' + k0(vnone.deaths) + '). Infected by age: children ' + pct(r.attackAge[0], 0) + ', adults ' + pct(r.attackAge[1], 0) + ', seniors ' + pct(r.attackAge[2], 0) + '.');
      chart(q(root, 'vchart'), { series: [{ y: vnone.daily.slice(0, 250), color: C.grey, width: 2 }, { y: r.daily.slice(0, 250), color: C.blue, width: 2.6 }], xLabel: 'day', yLabel: 'new infections a day',
        yFormat: function (v) { return v >= 1000 ? (v / 1000) + 'k' : String(v); }, marks: [{ x: o.start, label: 'doses start', color: C.green }] });
      mark(2, r.infections < 600000); mark(3, r.deaths < 1000);
      root.setAttribute('data-vax', [order, vaccine, o.perDay, o.start, o.stock, Math.round(r.infections), Math.round(r.deaths), Math.round(r.deathsAge[2])].join(':'));
      root.setAttribute('data-ready', '1');
    }
    ['ls', 'll', 'lv'].forEach(function (k) { on(el[k], 'input', lockRun); }); on(el.lc, 'change', lockRun);
    ['vd', 'vs', 'vk'].forEach(function (k) { on(el[k], 'input', vaxRun); });
    ['seniors', 'children', 'adults', 'equal'].forEach(function (k) { on(q(root, 'o-' + k), 'click', function () { order = k; hl(); vaxRun(); }); });
    ['block', 'severe'].forEach(function (k) { on(q(root, 'x-' + k), 'click', function () { vaccine = k; hl(); vaxRun(); }); });
    hl(); lockRun(); vaxRun();
  }

  // ------------------------------------------------------------------ Module 11 · sensitivity and forecast scores (mirrors production/explains/sims/epi_m11_sims.py)
  var SA = { inputs: [['R0', 1.5, 3.5, 2.5], ['latent period', 2, 5, 3], ['infectious period', 3, 8, 5], ['reporting share', 0.1, 0.5, 0.3], ['first infections', 1, 50, 10], ['cut in contacts', 0, 0.6, 0.3], ['cut start day', 20, 80, 50]],
             short: ['R0', 'latent', 'infectious', 'reporting', 'first cases', 'cut size', 'cut start'], qoi: ['share ever infected', 'peak reported cases a day', 'day of the peak'] };
  function saRun(x) { // x: [R0, latent, infectious, rho, I0, cut, cutStart] -> [attack, peak reported, peak day]; SEIR, N 100,000, 300 days, dt 0.25
    var N = 100000, g = 1 / x[2], sg = 1 / x[1], b = x[0] * g, S = N - x[4], E = 0, I = x[4], cum = 0, peak = 0, pday = 0;
    for (var t = 0; t < 300; t++) {
      var u = (t >= x[6] && t < x[6] + 60) ? x[5] : 0, tot = 0;
      for (var k = 0; k < 4; k++) { var f = b * (1 - u) * S * I / N; S -= 0.25 * f; var e2 = E + 0.25 * (f - sg * E); I += 0.25 * (sg * E - g * I); E = e2; tot += 0.25 * f; }
      var rep = x[3] * tot; if (rep > peak) { peak = rep; pday = t; } cum += tot;
    }
    return [cum / N, peak, pday];
  }
  function saScale(u) { return u.map(function (v, i) { return SA.inputs[i][1] + v * (SA.inputs[i][2] - SA.inputs[i][1]); }); }
  function saLocal(base) {
    var y0 = saRun(base), el = [];
    for (var i = 0; i < 7; i++) { var up = base.slice(), dn = base.slice(); up[i] *= 1.01; dn[i] *= 0.99; var yu = saRun(up), yd = saRun(dn); el.push([0, 1, 2].map(function (j) { return y0[j] ? (yu[j] - yd[j]) / (0.02 * y0[j]) : 0; })); }
    return { y0: y0, el: el, runs: 15 };
  }
  function saMorris(r, seed) {
    var R = rng(seed), p = 8, delta = p / (2 * (p - 1)), EE = [[], [], [], [], [], [], []], runs = 0;
    for (var k = 0; k < r; k++) {
      var x = [], order = [0, 1, 2, 3, 4, 5, 6], i, j;
      for (i = 0; i < 7; i++) { x.push(Math.floor(R() * (p / 2)) / (p - 1)); if (R() < 0.5) x[i] += delta; }
      for (i = 6; i > 0; i--) { j = Math.floor(R() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      var y = saRun(saScale(x)); runs++;
      for (var s = 0; s < 7; s++) { i = order[s]; var x2 = x.slice(); x2[i] = x[i] + delta <= 1 + 1e-9 ? x[i] + delta : x[i] - delta; var y2 = saRun(saScale(x2)); runs++;
        var dx = x2[i] - x[i]; EE[i].push([0, 1, 2].map(function (q) { return (y2[q] - y[q]) / dx; })); x = x2; y = y2; }
    }
    var mu = EE.map(function (e) { return [0, 1, 2].map(function (q) { return e.reduce(function (a, v) { return a + Math.abs(v[q]); }, 0) / e.length; }); });
    var sd = EE.map(function (e) { return [0, 1, 2].map(function (q) { var m = e.reduce(function (a, v) { return a + v[q]; }, 0) / e.length; return Math.sqrt(e.reduce(function (a, v) { return a + (v[q] - m) * (v[q] - m); }, 0) / e.length); }); });
    return { mu: mu, sigma: sd, runs: runs };
  }
  function saSobol(n, seed) { // Saltelli design; Jansen first-order and total-order estimators
    var R = rng(seed), A = [], Bm = [], fA = [], fB = [], fAB = [[], [], [], [], [], [], []], i, j, q;
    for (i = 0; i < n; i++) { var a = [], b2 = []; for (j = 0; j < 7; j++) { a.push(R()); b2.push(R()); } A.push(a); Bm.push(b2); fA.push(saRun(saScale(a))); fB.push(saRun(saScale(b2))); }
    for (j = 0; j < 7; j++) for (i = 0; i < n; i++) { var ab = A[i].slice(); ab[j] = Bm[i][j]; fAB[j].push(saRun(saScale(ab))); }
    var S1 = [], ST = [];
    for (j = 0; j < 7; j++) { S1.push([]); ST.push([]); }
    for (q = 0; q < 3; q++) {
      var all = fA.map(function (v) { return v[q]; }).concat(fB.map(function (v) { return v[q]; })), m = all.reduce(function (s, v) { return s + v; }, 0) / all.length;
      var V = all.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / all.length;
      for (j = 0; j < 7; j++) {
        var s1 = 0, st = 0; for (i = 0; i < n; i++) { var d1 = fB[i][q] - fAB[j][i][q], d2 = fA[i][q] - fAB[j][i][q]; s1 += d1 * d1; st += d2 * d2; }
        S1[j].push(V > 0 ? 1 - 0.5 * s1 / n / V : 0); ST[j].push(V > 0 ? 0.5 * st / n / V : 0);
      }
    }
    return { S1: S1, ST: ST, runs: n * 9 };
  }
  var SC_TRUTH = [0,1,0,1,1,1,3,3,1,1,3,3,3,3,2,4,4,5,1,5,1,14,13,5,9,8,3,7,6,7,7,10,9,14,12,17,14,8,19,14,20,30,28,29,24,30,29,34,32,21,26,34,30,28,29,30,19,30,16,28,29,15,22,28,38,39,22,30,25,17,29,18,19,20,29,28,21,24,21,24,24,12,13,28,12,21,13,20,13,14,24,12,12,15,11,12,11,18,10,14,16,10,15,15,14,26,17,10,19,13,11,16,16,26,13,17,20,17,22,33,26,26,16,19,29,41,24,34,42,25,55,37,47,32,45,39,50,57,46,39,49,39,30,42,58,67,49,37,81,44,75,71,67,88,77,50,62,91,58,84,105,91,94,112,65,58,93,92,100,75,87,83,40,42,70,76,53,83,59,48,66,62,81,29,103,46,55,51,61,72,54,43,43,34,38,41,55,59,38,32,38,26,35,30,36,36,40,36,39,31,29,42,41,34,25,35,19,17,16,23,30,29,22,31,24,36,22,14,25,40,22,27,34,17,17,12,17,31,29,25];
  var SC_QL = [0.025, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.975];
  function normPpf(p) { // Acklam's rational approximation
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00],
        b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01],
        c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00],
        d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00], q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  function nbQuantiles(m, k) { // negative binomial quantiles (mean m, size k) at SC_QL
    m = Math.max(m, 1e-6); var p = k / (k + m), out = [], cdf = 0, pmf = Math.pow(p, k), x = 0, qi = 0;
    while (qi < SC_QL.length && x < 100000) { cdf += pmf; while (qi < SC_QL.length && cdf >= SC_QL[qi] - 1e-12) { out.push(x); qi++; } pmf *= (x + k) / (x + 1) * (1 - p); x++; }
    while (out.length < SC_QL.length) out.push(x);
    return out;
  }
  function scForecast(name, t, h, width) { // quantiles of the forecast for day t + h - 1, made with data before day t
    var y = SC_TRUTH, i;
    if (name === 'last week' || name === 'wide flat') { var m = 0; for (i = t - 7; i < t; i++) m += y[i]; return nbQuantiles(m / 7, name === 'last week' ? 8 : 1.5); }
    var n = 14, sx = 0, sy = 0, sxx = 0, sxy = 0, ly = [];
    for (i = 0; i < n; i++) { var v = Math.log(y[t - n + i] + 1); ly.push(v); sx += i; sy += v; sxx += i * i; sxy += i * v; }
    var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), icpt = (sy - slope * sx) / n, rs = 0;
    for (i = 0; i < n; i++) { var e = ly[i] - (slope * i + icpt); rs += e * e; }
    var se = Math.sqrt(rs / n) * Math.sqrt(1 + Math.pow(13 + h - 6.5, 2) / 227.5), mm = Math.exp(icpt + slope * (13 + h)) - 1, sd = Math.sqrt(se * se + 1 / 12) * (name === 'overconfident trend' ? 0.25 : 1) * (width || 1);
    return SC_QL.map(function (qq) { return Math.exp(Math.log(Math.max(mm, 1)) + normPpf(qq) * sd); });
  }
  function scWis(y, qv) { var tot = 0.5 * Math.abs(y - qv[10]); for (var k = 0; k < 10; k++) { var a = 2 * SC_QL[k], lo = qv[k], hi = qv[20 - k]; tot += a / 2 * ((hi - lo) + 2 / a * Math.max(lo - y, 0) + 2 / a * Math.max(y - hi, 0)); } return tot / 10.5; }
  function scScores(name, h, width) {
    var mae = 0, w = 0, c50 = 0, c90 = 0, n = 0;
    for (var t = 42; t < 218; t += 7) {
      if (t + h - 1 >= SC_TRUTH.length) continue;
      var q = name === 'ensemble' ? (function () { var a = scForecast('last week', t, h), b = scForecast('trend', t, h, width); return a.map(function (v, i) { return (v + b[i]) / 2; }); })() : scForecast(name, t, h, width);
      var y = SC_TRUTH[t + h - 1]; mae += Math.abs(y - q[10]); w += scWis(y, q); if (y >= q[5] && y <= q[15]) c50++; if (y >= q[1] && y <= q[19]) c90++; n++;
    }
    return { mae: mae / n, wis: w / n, cov50: c50 / n, cov90: c90 / n, n: n };
  }
  function groupBars(svg, o) { // o: {labels, series:[{vals, color, label}], yMax, yFormat}
    render(svg, function (W, H) {
      var pl = 46, pr = 10, pt = 22, pb = 34, iw = W - pl - pr, ih = H - pt - pb, n = o.labels.length, ns = o.series.length, out = [], ymax = o.yMax;
      var Y = function (v) { return pt + ih * (1 - Math.max(0, Math.min(v, ymax)) / ymax); };
      niceTicks(0, ymax, 4).ticks.forEach(function (v) { if (v > ymax + 1e-9) return; out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>'); out.push(txt(pl - 6, Y(v) + 4, o.yFormat ? o.yFormat(v) : String(v), { anchor: 'end' })); });
      var gw = iw / n, bw = gw * 0.7 / ns;
      o.labels.forEach(function (lab, i) {
        o.series.forEach(function (s, k) { var v = s.vals[i], x = pl + i * gw + gw * 0.15 + k * bw; out.push('<rect x="' + x.toFixed(1) + '" y="' + Y(v).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + (Y(0) - Y(v)).toFixed(1) + '" rx="3" fill="' + s.color + '"' + (s.pale ? ' opacity="0.45"' : '') + '/>'); });
        out.push(txt(pl + i * gw + gw / 2, H - pb + 16, lab, { size: 11 }));
      });
      out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="rgba(100,116,139,.7)"/>');
      if (o.hline !== undefined) out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(o.hline).toFixed(1) + '" y2="' + Y(o.hline).toFixed(1) + '" stroke="' + C.ink + '" stroke-dasharray="6 5"/>');
      var lx = pl + 4; o.series.forEach(function (s) { if (!s.label) return; out.push('<rect x="' + lx + '" y="4" width="10" height="10" rx="2" fill="' + s.color + '"' + (s.pale ? ' opacity="0.45"' : '') + '/>'); out.push(txt(lx + 14, 13, s.label, { anchor: 'start', size: 11, weight: 700 })); lx += 22 + s.label.length * 6.2; });
      return out.join('');
    });
  }
  function sensLab(root) {
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['br', 'bs', 'mr', 'sn', 'fw'].forEach(function (k) { el[k] = q(root, k); });
    var out = 1, method = 'local', last = null, sob = null, hz = 7, done = [false, false, false, false], SN = [256, 512, 1024, 2048];
    var k0 = function (v) { return Math.round(v).toLocaleString('en-US'); };
    function hl() {
      root.querySelectorAll('[data-k^="q-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'q-' + out; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
      root.querySelectorAll('[data-k^="m-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'm-' + method; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
      root.querySelectorAll('[data-k^="h-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'h-' + hz; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
    }
    function base() { var b = SA.inputs.map(function (r) { return r[3]; }); b[0] = +el.br.value; b[6] = +el.bs.value; return b; }
    function draw() {
      set(q(root, 'br-out'), (+el.br.value).toFixed(1)); set(q(root, 'bs-out'), 'day ' + el.bs.value); set(q(root, 'mr-out'), el.mr.value + ' paths'); set(q(root, 'sn-out'), k0(SN[+el.sn.value - 1]) + ' samples');
      var L = saLocal(base()), vals, series, top, ymax, runs, i;
      if (method === 'local' || !last || last.method !== method) last = method === 'local' ? { method: 'local', res: L } : last;
      if (method === 'local') { vals = L.el.map(function (r) { return Math.abs(r[out]); }); runs = L.runs; series = [{ vals: vals, color: C.blue, label: '|elasticity|: % change per 1%' }]; ymax = Math.max(0.5, Math.max.apply(null, vals) * 1.15); }
      else if (method === 'morris' && last && last.method === 'morris') { var mx = Math.max.apply(null, last.res.mu.map(function (r) { return r[out]; })) || 1; series = [{ vals: last.res.mu.map(function (r) { return r[out] / mx; }), color: C.blue, label: 'mean |effect| (scaled)' }, { vals: last.res.sigma.map(function (r) { return r[out] / mx; }), color: C.orange, label: 'spread (scaled)' }]; vals = series[0].vals; runs = last.res.runs; ymax = 1.6; }
      else if (method === 'sobol' && last && last.method === 'sobol') { series = [{ vals: last.res.S1.map(function (r) { return Math.max(0, r[out]); }), color: C.navy, label: 'first order' }, { vals: last.res.ST.map(function (r) { return r[out]; }), color: C.navy, pale: true, label: 'total' }]; vals = series[1].vals; runs = last.res.runs; ymax = 1.0; }
      else { series = [{ vals: [0, 0, 0, 0, 0, 0, 0], color: C.grey }]; vals = series[0].vals; runs = 0; ymax = 1; }
      top = 0; for (i = 1; i < 7; i++) if (vals[i] > vals[top]) top = i;
      groupBars(q(root, 'schart'), { labels: SA.short, series: series, yMax: ymax, yFormat: function (v) { return (+v.toFixed(2)).toString(); } });
      set(q(root, 'sruns'), runs ? k0(runs) : '–'); set(q(root, 'stop'), runs ? SA.short[top] : '–'); set(q(root, 'sbase'), method === 'local' ? (out === 0 ? (L.y0[0] * 100).toFixed(1) + '%' : out === 1 ? k0(L.y0[1]) : 'day ' + L.y0[2]) : '–');
      var names = { local: 'Local: nudging each input by 1% at the baseline', morris: 'Morris screening', sobol: 'Sobol indices' };
      set(q(root, 'sstatus'), runs ? names[method] + ' for "' + SA.qoi[out] + '": the largest is ' + SA.short[top] + ' (' + k0(runs) + ' model runs).' + (method === 'local' ? ' The cut-start elasticity on the reported peak is ' + L.el[6][1].toFixed(2) + ' here.' : '') : 'Press Run to compute ' + names[method] + '.');
      done[0] = done[0] || Math.abs(L.el[6][1]) < 0.5; mark(0, Math.abs(L.el[6][1]) < 0.5);
      if (sob) { var ok = false; for (i = 0; i < 7; i++) if (sob.ST[i][0] - Math.max(0, sob.S1[i][0]) >= 0.1 && sob.S1[i][0] < 0.05) ok = true; mark(1, ok && sob.n >= 1024); }
      root.setAttribute('data-sens', [method, out, runs, SA.short[top], L.el[6][1].toFixed(3), L.el[0][0].toFixed(3)].join(':'));
    }
    function run() {
      if (method === 'local') { draw(); return; }
      set(q(root, 'sstatus'), 'Running…');
      setTimeout(function () {
        if (method === 'morris') last = { method: 'morris', res: saMorris(+el.mr.value, 11) };
        else { var n = SN[+el.sn.value - 1]; last = { method: 'sobol', res: saSobol(n, 17) }; sob = { S1: last.res.S1, ST: last.res.ST, n: n }; }
        draw();
      }, 20);
    }
    function scoreRun() {
      var w = +el.fw.value, names = ['last week', 'trend', 'overconfident trend', 'wide flat', 'ensemble'], lab = ['last week', 'trend', 'overconfident', 'very wide', 'blend'];
      set(q(root, 'fw-out'), '×' + w.toFixed(2));
      var S = names.map(function (n) { return scScores(n, hz, w); });
      groupBars(q(root, 'fchart'), { labels: lab, series: [{ vals: S.map(function (s) { return s.wis; }), color: C.blue, label: 'weighted interval score (lower is better)' }], yMax: Math.max(12, Math.max.apply(null, S.map(function (s) { return s.wis; })) * 1.1), yFormat: function (v) { return String(v); } });
      groupBars(q(root, 'cchart'), { labels: lab, series: [{ vals: S.map(function (s) { return s.cov90; }), color: C.green, label: 'coverage of 90% intervals' }], yMax: 1, hline: 0.9, yFormat: function (v) { return Math.round(v * 100) + '%'; } });
      var tr = S[1], d0 = scScores('trend', 7, 1), t7 = scScores('trend', 7, w), t14 = scScores('trend', 14, w);
      set(q(root, 'fmae'), tr.mae.toFixed(1)); set(q(root, 'fwis'), tr.wis.toFixed(1)); set(q(root, 'fcov'), pct(tr.cov90, 0)); set(q(root, 'fens'), S[4].wis.toFixed(1));
      set(q(root, 'fstatus'), hz + ' days ahead, ' + tr.n + ' forecast dates. Trend (intervals ×' + w.toFixed(2) + '): error ' + tr.mae.toFixed(1) + ', score ' + tr.wis.toFixed(1) + ', 90% coverage ' + pct(tr.cov90, 0) + '. Blend: score ' + S[4].wis.toFixed(1) + '.');
      mark(2, t14.cov90 >= 0.85 && t14.cov90 <= 0.95);
      mark(3, w <= 0.5 && t7.cov90 < 0.5 && t7.wis > d0.wis);
      root.setAttribute('data-score', [hz, w, tr.mae.toFixed(2), tr.wis.toFixed(2), tr.cov90.toFixed(3), S[4].wis.toFixed(2), t14.cov90.toFixed(3)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    on(el.br, 'input', function () { if (method === 'local') draw(); else { method = 'local'; hl(); draw(); } });
    on(el.bs, 'input', function () { if (method === 'local') draw(); else { method = 'local'; hl(); draw(); } });
    on(el.mr, 'input', function () { set(q(root, 'mr-out'), el.mr.value + ' paths'); });
    on(el.sn, 'input', function () { set(q(root, 'sn-out'), k0(SN[+el.sn.value - 1]) + ' samples'); });
    [0, 1, 2].forEach(function (k) { on(q(root, 'q-' + k), 'click', function () { out = k; hl(); draw(); }); });
    ['local', 'morris', 'sobol'].forEach(function (k) { on(q(root, 'm-' + k), 'click', function () { method = k; hl(); if (k === 'local') draw(); else if (last && last.method === k) draw(); else run(); }); });
    on(q(root, 'srun'), 'click', run);
    [1, 7, 14].forEach(function (k) { on(q(root, 'h-' + k), 'click', function () { hz = k; hl(); scoreRun(); }); });
    on(el.fw, 'input', scoreRun);
    hl(); draw(); scoreRun();
  }

  // ------------------------------------------------------------------ Module 12 lab: step sizes, stability, exact and approximate chance
  var ST_H = [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8], ST_N = [100, 200, 500, 1000, 2000, 5000, 10000, 20000], ST_TAU = [0.1, 0.25, 0.5, 1, 2, 3, 4], ST_DAYS = 280;
  // SIR as shares; Euler or classical Runge-Kutta with a fixed step h (days); S0 = 1 - 1e-4, I0 = 1e-4 as in the episode
  function stSolve(method, h, R0, D, days, i0) {
    var g = 1 / D, b = R0 * g, S = 1 - (i0 || 1e-4), I = i0 || 1e-4, n = Math.round((days || ST_DAYS) / h), t = [0], Ss = [S], Is = [I];
    function f(S, I) { var inf = b * S * I; return [-inf, inf - g * I]; }
    for (var k = 0; k < n; k++) {
      if (method === 'euler') { var d = f(S, I); S += h * d[0]; I += h * d[1]; }
      else { var a1 = f(S, I), a2 = f(S + h / 2 * a1[0], I + h / 2 * a1[1]), a3 = f(S + h / 2 * a2[0], I + h / 2 * a2[1]), a4 = f(S + h * a3[0], I + h * a3[1]);
        S += h / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]); I += h / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]); }
      t.push((k + 1) * h); Ss.push(S); Is.push(I);
    }
    var pk = -Infinity, pd = 0, mn = Infinity, mnS = Infinity;
    for (var i = 0; i < Is.length; i++) { if (Is[i] > pk) { pk = Is[i]; pd = t[i]; } if (Is[i] < mn) mn = Is[i]; if (Ss[i] < mnS) mnS = Ss[i]; }
    return { t: t, S: Ss, I: Is, peak: pk, peakDay: pd, minI: mn, minS: mnS, evals: n * (method === 'euler' ? 1 : 4) };
  }
  var stRefCache = {};
  function stRef(R0, D) { var k = R0.toFixed(2) + ':' + D.toFixed(2); if (!stRefCache[k]) stRefCache[k] = stSolve('rk4', 0.01, R0, D); return stRefCache[k]; }
  // stochastic SIR in a town of N: exact (Gillespie) or tau-leaping with step tau (counts capped at zero, attempts to go below zero counted)
  function stChance(o) {
    var r = rng(o.seed || 12), N = o.N, g = 1 / o.D, b = o.R0 * g, runs = o.runs || 200, fin = [], curves = [], neg = 0, work = 0, days = 200;
    for (var k = 0; k < runs; k++) {
      var S = N - o.i0, I = o.i0, t = 0, nextDay = 1, cv = k < 25 ? [I / N] : null, wentNeg = false;
      if (o.method === 'exact') {
        while (I > 0) {
          var ri = b * S * I / N, rr = g * I, a = ri + rr; t += -Math.log(1 - r()) / a; work++;
          while (cv && t >= nextDay && nextDay <= days) { cv.push(I / N); nextDay++; }
          if (r() * a < ri) { S--; I++; } else I--;
        }
      } else {
        var tau = o.tau, steps = Math.ceil(400 / tau);
        for (var s = 0; s < steps && I > 0; s++) {
          var ni = poissonDraw(r, b * S * I / N * tau), nr = poissonDraw(r, g * I * tau); work++;
          if (ni > S || nr > I) wentNeg = true;
          ni = Math.min(ni, S); nr = Math.min(nr, I); S -= ni; I += ni - nr; t += tau;
          while (cv && t >= nextDay && nextDay <= days) { cv.push(I / N); nextDay++; }
        }
      }
      if (cv) { while (cv.length <= days) cv.push(I / N); curves.push(cv); }
      if (wentNeg) neg++;
      fin.push((N - S) / N);
    }
    var big = fin.filter(function (v) { return v > 0.01; }), mean = big.length ? big.reduce(function (s, v) { return s + v; }, 0) / big.length : 0;
    return { final: fin, fizzled: (runs - big.length) / runs, meanFinal: mean, neg: neg, negShare: neg / runs, work: work / runs, curves: curves, runs: runs };
  }
  function stChart(svg, o) { // o: {series:[{t, y, color, width?, dots?, opacity?}], days, ymin, ymax, yFormat}
    render(svg, function (W, H) {
      var pl = 52, pr = 12, pt = 12, pb = 30, iw = W - pl - pr, ih = H - pt - pb, out = [], lo = o.ymin, hi = o.ymax;
      var X = function (d) { return pl + iw * d / o.days; }, Y = function (v) { return pt + ih * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)); };
      if (lo < 0) out.push('<rect x="' + pl + '" y="' + Y(0).toFixed(1) + '" width="' + iw + '" height="' + (Y(lo) - Y(0)).toFixed(1) + '" fill="rgba(213,94,0,.08)"/>' + txt(W - pr - 4, Y(lo) - 5, 'below zero: impossible', { anchor: 'end', fill: C.orange, size: 11, weight: 700 }));
      niceTicks(Math.max(0, lo), hi, 4).ticks.forEach(function (v) { if (v > hi + 1e-12) return; out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>' + txt(pl - 8, Y(v) + 4, o.yFormat(v), { anchor: 'end' })); });
      niceTicks(0, o.days, 5).ticks.forEach(function (v) { if (v <= o.days) out.push(txt(X(v), H - pb + 16, String(v))); });
      out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(100,116,139,.7)"/>');
      out.push(txt(pl + iw / 2, H - 2, 'day', { fill: '#475569' }));
      o.series.forEach(function (s) {
        var d = '', dots = '';
        for (var i = 0; i < s.t.length; i++) { if (s.t[i] > o.days) break; if (s.stride && i % s.stride) continue; d += (d ? 'L' : 'M') + X(s.t[i]).toFixed(1) + ' ' + Y(s.y[i]).toFixed(1) + ' '; if (s.dots) dots += '<circle cx="' + X(s.t[i]).toFixed(1) + '" cy="' + Y(s.y[i]).toFixed(1) + '" r="3" fill="' + s.color + '"/>'; }
        out.push('<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 2.2) + '" stroke-linejoin="round"' + (s.opacity ? ' opacity="' + s.opacity + '"' : '') + '/>' + dots);
      });
      return out.join('');
    });
  }
  function stabLab(root) {
    function mark(i, ok) { var li = root.querySelector('[data-ch="' + i + '"]'); if (!li) return; li.classList.toggle('is-done', !!ok); var mk = li.querySelector('.epx-mark'); if (mk) mk.innerHTML = ok ? MARK_ON : MARK_OFF; }
    var el = {}; ['sh', 'sr', 'sd', 'cn', 'ci', 'cr', 'ct'].forEach(function (k) { el[k] = q(root, k); });
    var method = 'euler', cm = 'exact', last = null;
    function hl() {
      root.querySelectorAll('[data-k^="m-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'm-' + method; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
      root.querySelectorAll('[data-k^="c-"]').forEach(function (b) { var onb = b.getAttribute('data-k') === 'c-' + cm; b.classList.toggle('control-button-primary', onb); b.classList.toggle('control-button-secondary', !onb); });
    }
    function solve() {
      var h = ST_H[+el.sh.value], R0 = +el.sr.value, D = +el.sd.value;
      set(q(root, 'sh-out'), h + (h === 1 ? ' day' : ' days')); set(q(root, 'sr-out'), R0.toFixed(1)); set(q(root, 'sd-out'), D + ' days');
      var ref = stRef(R0, D), A = stSolve(method, h, R0, D), E = method === 'euler' ? A : stSolve('euler', h, R0, D), K = method === 'rk4' ? A : stSolve('rk4', h, R0, D);
      var err = A.peak / ref.peak - 1, ymax = Math.max(ref.peak, Math.min(A.peak, 1)) * 1.12, ymin = Math.min(0, Math.max(A.minI, -0.5)) * 1.25;
      stChart(q(root, 'schart'), { days: 200, ymin: ymin, ymax: ymax, yFormat: function (v) { return pct(v, 0); },
        series: [{ t: ref.t, y: ref.I, color: C.green, width: 3, stride: 50 }, { t: A.t, y: A.I, color: method === 'euler' ? C.orange : C.blue, width: 2.2, dots: h >= 1 }] });
      set(q(root, 'spk'), pct(A.peak, 1)); set(q(root, 'serr'), (err >= 0 ? '+' : '') + pct(err, Math.abs(err) < 0.01 ? 2 : 1)); set(q(root, 'smin'), A.minI < -1e-12 ? pct(A.minI, 1) : '0'); set(q(root, 'sev'), A.evals.toLocaleString('en-US'));
      set(q(root, 'sstatus'), (method === 'euler' ? 'Euler' : 'Runge–Kutta (RK4)') + ' with ' + h + '-day steps: peak ' + pct(A.peak, 1) + ' on day ' + Math.round(A.peakDay) + ' (tiny steps: ' + pct(ref.peak, 1) + ' on day ' + Math.round(ref.peakDay) + ').' +
        (A.minI < -1e-12 ? ' The number infectious went below zero.' : ''));
      var eE = E.peak / ref.peak - 1, eK = K.peak / ref.peak - 1;
      mark(0, method === 'euler' && A.minI < -1e-9);
      mark(1, h >= 2 && Math.abs(eK) < 0.01 && Math.abs(eE) > 0.1);
      root.setAttribute('data-step', [method, h, R0.toFixed(1), D, A.peak.toFixed(4), err.toFixed(4), A.minI.toFixed(4), eE.toFixed(4), eK.toFixed(4), ref.peak.toFixed(4)].join(':'));
    }
    function chance() {
      var N = ST_N[+el.cn.value], i0 = +el.ci.value, R0 = +el.cr.value, tau = ST_TAU[+el.ct.value];
      set(q(root, 'cn-out'), N.toLocaleString('en-US') + ' people'); set(q(root, 'ci-out'), String(i0)); set(q(root, 'cr-out'), R0.toFixed(1)); set(q(root, 'ct-out'), tau + (tau === 1 ? ' day' : ' days'));
      var res = stChance({ N: N, i0: Math.min(i0, N), R0: R0, D: 5, method: cm, tau: tau, runs: 200, seed: 1212 }); last = res;
      var ode = stSolve('rk4', 0.25, R0, 5, 200, Math.min(i0, N) / N), days = []; for (var d = 0; d <= 200; d++) days.push(d);
      var odeDaily = { t: [], y: [] }; for (var j = 0; j < ode.t.length; j += 4) { odeDaily.t.push(ode.t[j]); odeDaily.y.push(ode.I[j]); }
      var ym = Math.max.apply(null, odeDaily.y.concat(res.curves.map(function (c) { return Math.max.apply(null, c); }))) * 1.1;
      stChart(q(root, 'cchart'), { days: 200, ymin: 0, ymax: ym || 0.1, yFormat: function (v) { return pct(v, 0); },
        series: res.curves.map(function (c) { return { t: days, y: c, color: cm === 'exact' ? C.purple : C.amber, width: 1.2, opacity: 0.45 }; }).concat([{ t: odeDaily.t, y: odeDaily.y, color: C.ink, width: 3 }]) });
      set(q(root, 'cfz'), pct(res.fizzled, 0)); set(q(root, 'cfm'), res.meanFinal ? pct(res.meanFinal, 1) : '–'); set(q(root, 'cng'), cm === 'tau' ? res.neg + ' of ' + res.runs : '–'); set(q(root, 'cwk'), Math.round(res.work).toLocaleString('en-US'));
      set(q(root, 'cstatus'), (cm === 'exact' ? 'Exact (Gillespie)' : 'Tau-leaping, ' + tau + '-day steps') + ', ' + res.runs + ' runs in a town of ' + N.toLocaleString('en-US') + ': ' + pct(res.fizzled, 0) + ' fizzled out; the others infected ' + (res.meanFinal ? pct(res.meanFinal, 1) : '–') + ' on average (the equations: ' + pct(finalSize(R0), 1) + '). ' +
        (cm === 'exact' ? Math.round(res.work).toLocaleString('en-US') + ' events per run.' : res.neg + ' runs tried to remove more people than there were.'));
      mark(2, cm === 'exact' && i0 === 1 && Math.abs(R0 - 2) < 0.01 && N >= 1000 && res.fizzled >= 0.4 && res.fizzled <= 0.6);
      mark(3, cm === 'tau' && tau >= 2 && res.negShare > 0.5);
      root.setAttribute('data-chance', [cm, N, i0, R0.toFixed(1), tau, res.fizzled.toFixed(3), res.meanFinal.toFixed(4), res.neg, Math.round(res.work)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    ['sh', 'sr', 'sd'].forEach(function (k) { on(el[k], 'input', solve); });
    ['cn', 'ci', 'cr', 'ct'].forEach(function (k) { on(el[k], 'input', function () { set(q(root, 'cn-out'), ST_N[+el.cn.value].toLocaleString('en-US') + ' people'); set(q(root, 'ci-out'), el.ci.value); set(q(root, 'cr-out'), (+el.cr.value).toFixed(1)); set(q(root, 'ct-out'), ST_TAU[+el.ct.value] + (ST_TAU[+el.ct.value] === 1 ? ' day' : ' days')); }); on(el[k], 'change', chance); });
    ['euler', 'rk4'].forEach(function (k) { on(q(root, 'm-' + k), 'click', function () { method = k; hl(); solve(); }); });
    ['exact', 'tau'].forEach(function (k) { on(q(root, 'c-' + k), 'click', function () { cm = k; hl(); chance(); }); });
    on(q(root, 'crun'), 'click', chance);
    hl(); solve(); chance();
  }

  // ------------------------------------------------------------------ start the labs on this page
  window.EpiLabs = { behave: behave, COURSE: COURSE, peaks: peaks, family: family, gillespie: gillespie, finalSize: finalSize, cities: cities, network: network, netRuns: netRuns, strains: strains, ladder: ladder, neff: neff, agentTown: agentTown, agentRun: agentRun, agentPairs: agentPairs, ncMu: ncMu, ncWorld: ncWorld, ncPartial: ncPartial, ncNowcast: ncNowcast, ncDelay: ncDelay, ncBacktest: ncBacktest, calCases: calCases, calData: calData, calLoss: calLoss, calMap: calMap, calNM: calNM, calGD: calGD, calPSO: calPSO, calGridSearch: calGridSearch, calBest: calBest, abcRun: abcRun, abcObserved: abcObserved, binomDraw: binomDraw, rng: rng, svInfections: svInfections, svCases: svCases, svSero: svSero, svWaste: svWaste, turnDay: turnDay, growth7: growth7, polSeir: polSeir, polAge: polAge, PA: PA, saRun: saRun, saLocal: saLocal, saMorris: saMorris, saSobol: saSobol, scForecast: scForecast, scScores: scScores, nbQuantiles: nbQuantiles, normPpf: normPpf, SC_TRUTH: SC_TRUTH, stSolve: stSolve, stRef: stRef, stChance: stChance };   // used by the automated lab checks
  var LABS = { behave: behaveLab, family: familyLab, space: spaceLab, strains: strainsLab, agents: agentsLab, nowcast: nowcastLab, calib: calibLab, streams: streamsLab, policy: policyLab, sens: sensLab, stability: stabLab };
  document.querySelectorAll('[data-epx]').forEach(function (root) {
    var f = LABS[root.getAttribute('data-epx')];
    if (!f) return;
    try { f(root); } catch (e) { if (window.console) console.error('epi-labs (' + root.id + '):', e); }
  });
})();
