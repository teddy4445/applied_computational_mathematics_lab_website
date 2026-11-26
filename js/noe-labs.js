/* Interactive labs of the Computational Approaches to the Non-Observed Economy course (non-observed-economy/module-NN/, made by tools/build_noe_course.py).
   One file; each lab starts only when its root element ([data-noex="..."]) is on the page.
   Markup: tools/templates/noe-lab-*.html. Styles: css/exploration-lab.css + css/rl-labs.css + css/epi-course.css + css/noe-course.css.
   Everything runs in the browser. The towns and countries are invented; numbers are simulated here (Lab 1 uses the same
   invented town as the videos; Labs 7 and 8 run small versions of the videos' Saltmarsh and Mainland policy models). */
(function () {
  'use strict';

  var C = { blue: '#2563eb', navy: '#1e3a8a', orange: '#d55e00', green: '#009e73', grey: '#94a3b8', amber: '#d97706', ink: '#111827', muted: '#64748b', purple: '#7c3aed', teal: '#0f766e', cyan: '#0891b2' };
  var FONT = 'Inter, system-ui, sans-serif';

  // ------------------------------------------------------------------ helpers
  function q(root, k) { return root.querySelector('[data-k="' + k + '"]'); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(el, text) { if (el) el.textContent = text; }
  function fx(x, d) { return isFinite(x) ? x.toFixed(d) : '–'; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { var u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) { es.forEach(function (e) { paint(e.target); }); }) : null;
  var painted = [];
  if (!ro) window.addEventListener('resize', function () { painted.forEach(paint); });
  function render(svg, fn) { if (!svg) return; svg._draw = fn; if (!svg._seen) { svg._seen = true; if (ro) ro.observe(svg); else painted.push(svg); } paint(svg); }
  function paint(svg) { if (!svg._draw) return; var W = Math.max(240, svg.clientWidth || 560), H = Math.max(160, svg.clientHeight || 260); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = svg._draw(W, H); }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (o.anchor || 'middle') + '" fill="' + (o.fill || C.muted) + '" font-size="' + (o.size || 11) + '" font-family="' + FONT + '"' +
      (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.rotate ? ' transform="rotate(-90 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"' : '') + '>' + esc(s) + '</text>';
  }
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) hi = lo + 1;
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, t = [];
    for (var v = a; v <= b + step * 1e-6; v += step) t.push(+v.toFixed(10));
    return { lo: a, hi: b, ticks: t };
  }
  /* xy chart: o = {x:[lo,hi], y:[lo,hi], xLabel, yLabel, shade:[a,b], curves:[{f, color, width, dash}], dots:[{x,y,color,hollow}], marks:[{x,label}], log:{x,y}} */
  function xyChart(o, W, H) {
    var pl = 52, pr = 14, pt = 12, pb = 38, iw = W - pl - pr, ih = H - pt - pb, out = [];
    var lx = o.log && o.log.x, ly = o.log && o.log.y, L = function (v, lg) { return lg ? Math.log10(v) : v; };
    var xa = L(o.x[0], lx), xb = L(o.x[1], lx), ya = L(o.y[0], ly), yb = L(o.y[1], ly);
    var X = function (v) { return pl + iw * (L(v, lx) - xa) / (xb - xa); }, Y = function (v) { return pt + ih * (1 - (L(v, ly) - ya) / (yb - ya)); };
    var yt = o.yTicks ? o.yTicks : ly ? [o.y[0], Math.sqrt(o.y[0] * o.y[1]), o.y[1]] : niceTicks(o.y[0], o.y[1], 4).ticks.filter(function (v) { return v >= o.y[0] - 1e-9 && v <= o.y[1] + 1e-9; });
    var xt = lx ? [o.x[0], Math.sqrt(o.x[0] * o.x[1]), o.x[1]] : niceTicks(o.x[0], o.x[1], Math.max(3, Math.min(7, Math.floor(iw / 70)))).ticks.filter(function (v) { return v >= o.x[0] - 1e-9 && v <= o.x[1] + 1e-9; });
    if (o.shade) out.push('<rect x="' + X(o.shade[0]).toFixed(1) + '" y="' + pt + '" width="' + Math.max(0, X(o.shade[1]) - X(o.shade[0])).toFixed(1) + '" height="' + ih + '" fill="rgba(37,99,235,.08)"/>');
    yt.forEach(function (v) { var y = Y(v); out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>'); out.push(txt(pl - 8, y + 4, o.yFmt ? o.yFmt(v) : ly ? fx(v, v < 10 ? 1 : 0) : String(v), { anchor: 'end' })); });
    xt.forEach(function (v) { out.push(txt(X(v), H - pb + 16, lx ? fx(v, v < 10 ? 1 : 0) : String(v))); });
    out.push('<line x1="' + pl + '" x2="' + pl + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/><line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/>');
    if (o.xLabel) out.push(txt(pl + iw / 2, H - 4, o.xLabel, { fill: '#475569' }));
    if (o.yLabel) out.push(txt(13, pt + ih / 2, o.yLabel, { fill: '#475569', rotate: true }));
    (o.marks || []).forEach(function (m) { var x = X(m.x).toFixed(1); out.push('<line x1="' + x + '" x2="' + x + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + (m.color || C.amber) + '" stroke-width="1.2" stroke-dasharray="3 3"/>'); if (m.label) out.push(txt(+x + 4, pt + 11, m.label, { anchor: 'start', fill: m.color || C.amber, size: 11, weight: 700 })); });
    out.push('<clipPath id="xyc' + (o.id || 0) + '"><rect x="' + pl + '" y="' + pt + '" width="' + iw + '" height="' + ih + '"/></clipPath><g clip-path="url(#xyc' + (o.id || 0) + ')">');
    (o.curves || []).forEach(function (c) {
      var d = '', n = Math.max(60, Math.floor(iw / 2));
      for (var i = 0; i <= n; i++) { var xv = lx ? Math.pow(10, xa + (xb - xa) * i / n) : o.x[0] + (o.x[1] - o.x[0]) * i / n, yv = c.f(xv); if (!isFinite(yv) || (ly && yv <= 0)) continue; var yy = Math.max(-2000, Math.min(4000, Y(yv))); d += (d ? 'L' : 'M') + X(xv).toFixed(1) + ' ' + yy.toFixed(1) + ' '; }
      out.push('<path d="' + d + '" fill="none" stroke="' + c.color + '" stroke-width="' + (c.width || 2.4) + '"' + (c.dash ? ' stroke-dasharray="' + c.dash + '"' : '') + ' stroke-linejoin="round"/>');
    });
    (o.polys || []).forEach(function (pl2) { var d = ''; pl2.pts.forEach(function (pt2) { var px = X(pt2[0]), py = Y(pt2[1]); if (!isFinite(px) || !isFinite(py)) return; d += (d ? 'L' : 'M') + Math.max(-2000, Math.min(4000, px)).toFixed(1) + ' ' + Math.max(-2000, Math.min(4000, py)).toFixed(1); }); if (d) out.push('<path d="' + d + '" fill="none" stroke="' + pl2.color + '" stroke-width="' + (pl2.width || 2) + '"' + (pl2.dash ? ' stroke-dasharray="' + pl2.dash + '"' : '') + ' stroke-linejoin="round" opacity="' + (pl2.op || 1) + '"/>'); });
    (o.dots || []).forEach(function (p) { out.push('<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="' + (p.r || 3.2) + '" fill="' + (p.hollow ? '#fff' : (p.color || C.ink)) + '" stroke="' + (p.color || C.ink) + '" stroke-width="1.3"/>'); if (p.label) out.push(txt(X(p.x) + 7, Y(p.y) - 6, p.label, { anchor: 'start', fill: p.color || C.ink, size: 11, weight: 700 })); });
    out.push('</g>');
    return out.join('');
  }

  // ------------------------------------------------------------------ math: least squares, 1-D search
  function solve(A, b) {   // Gaussian elimination with partial pivoting (small systems)
    var n = b.length, M = A.map(function (r, i) { return r.slice().concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      var tmp = M[c]; M[c] = M[p]; M[p] = tmp; if (Math.abs(M[c][c]) < 1e-14) return null;
      for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    var x = new Array(n); for (var i = n - 1; i >= 0; i--) { var s = M[i][n]; for (var j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }
  /* polynomial of degree d fitted to (x, y); x is scaled by `sc` for conditioning; returns f(x) */
  function polyFit(xs, ys, d, sc) {
    sc = sc || 1; var n = d + 1, A = [], b = [], i, j, k;
    for (i = 0; i < n; i++) { A.push(new Array(n).fill(0)); b.push(0); }
    for (k = 0; k < xs.length; k++) { var u = xs[k] / sc, pw = [1]; for (i = 1; i < 2 * n; i++) pw.push(pw[i - 1] * u); for (i = 0; i < n; i++) { b[i] += ys[k] * pw[i]; for (j = 0; j < n; j++) A[i][j] += pw[i + j]; } }
    for (i = 0; i < n; i++) A[i][i] += 1e-10 * (A[i][i] || 1);
    var c = solve(A, b) || new Array(n).fill(0);
    var f = function (x) { var u = x / sc, s = 0; for (var i = n - 1; i >= 0; i--) s = s * u + c[i]; return s; };
    f.coef = c; return f;
  }
  function golden(fn, a, b, it) {
    var g = (Math.sqrt(5) - 1) / 2, c = b - g * (b - a), d = a + g * (b - a), fc = fn(c), fd = fn(d);
    for (var i = 0; i < (it || 80); i++) { if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = fn(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = fn(d); } }
    return (a + b) / 2;
  }
  function rmse(f, xs, ys) { if (!xs.length) return NaN; var s = 0; for (var i = 0; i < xs.length; i++) { var e = f(xs[i]) - ys[i]; s += e * e; } return Math.sqrt(s / xs.length); }


  function pc(x, d) { return isFinite(x) ? (100 * x).toFixed(d === undefined ? 1 : d) + '%' : '–'; }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function mae(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return a.length ? s / a.length : NaN; }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function logit(p) { p = Math.min(0.995, Math.max(0.005, p)); return Math.log(p / (1 - p)); }
  function marker(root) { var done = {}; return function (i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', !!done[i]); }; }
  /* ordinary least squares with an intercept; X: rows of features; returns predict(row) */
  function ols(X, y, ridge) {
    var p = X[0].length + 1, A = [], b = [], i, j, k;
    for (i = 0; i < p; i++) { A.push(new Array(p).fill(0)); b.push(0); }
    for (k = 0; k < X.length; k++) { var r = [1].concat(X[k]); for (i = 0; i < p; i++) { b[i] += r[i] * y[k]; for (j = 0; j < p; j++) A[i][j] += r[i] * r[j]; } }
    for (i = 1; i < p; i++) A[i][i] += (ridge || 1e-6) * X.length;
    var w = solve(A, b) || new Array(p).fill(0);
    var f = function (row) { var s = w[0]; for (var i = 0; i < row.length; i++) s += w[i + 1] * row[i]; return s; };
    f.w = w; return f;
  }
  /* standardise columns using the training rows */
  function scaler(X) { var p = X[0].length, mu = [], sd = []; for (var j = 0; j < p; j++) { var col = X.map(function (r) { return r[j]; }), m = mean(col), v = mean(col.map(function (x) { return (x - m) * (x - m); })); mu.push(m); sd.push(Math.sqrt(v) || 1); } return function (r) { return r.map(function (x, j) { return (x - mu[j]) / sd[j]; }); }; }
  function knn(X, y, k) { return function (row) { var d = X.map(function (r, i) { var s = 0; for (var j = 0; j < r.length; j++) { var e = r[j] - row[j]; s += e * e; } return [s, y[i]]; }); d.sort(function (a, b) { return a[0] - b[0]; }); var s = 0, n = Math.min(k, d.length); for (var i = 0; i < n; i++) s += d[i][1]; return s / n; }; }
  /* a regression tree (CART, squared error), depth-limited; returns predict(row) and the root split */
  function tree(X, y, depth, minLeaf) {
    minLeaf = minLeaf || 5;
    function build(idx, d) {
      var m = mean(idx.map(function (i) { return y[i]; }));
      if (d === 0 || idx.length < 2 * minLeaf) return { v: m, n: idx.length };
      var best = null, p = X[0].length;
      for (var j = 0; j < p; j++) {
        var s = idx.slice().sort(function (a, b) { return X[a][j] - X[b][j]; }), tot = 0, tot2 = 0, n = s.length;
        s.forEach(function (i) { tot += y[i]; tot2 += y[i] * y[i]; });
        var l = 0, l2 = 0;
        for (var k = 0; k < n - 1; k++) {
          l += y[s[k]]; l2 += y[s[k]] * y[s[k]];
          if (k + 1 < minLeaf || n - k - 1 < minLeaf || X[s[k]][j] === X[s[k + 1]][j]) continue;
          var nl = k + 1, nr = n - nl, sse = (l2 - l * l / nl) + ((tot2 - l2) - (tot - l) * (tot - l) / nr);
          if (!best || sse < best.sse) best = { sse: sse, j: j, thr: (X[s[k]][j] + X[s[k + 1]][j]) / 2 };
        }
      }
      if (!best) return { v: m, n: idx.length };
      var L = idx.filter(function (i) { return X[i][best.j] < best.thr; }), R = idx.filter(function (i) { return X[i][best.j] >= best.thr; });
      return { j: best.j, thr: best.thr, v: m, n: idx.length, l: build(L, d - 1), r: build(R, d - 1) };
    }
    var root = build(X.map(function (_, i) { return i; }), depth);
    var f = function (row) { var nd = root; while (nd.l) nd = row[nd.j] < nd.thr ? nd.l : nd.r; return nd.v; };
    f.root = root; return f;
  }
  function quantile(a, qq) { var s = a.slice().sort(function (x, y) { return x - y; }); var i = Math.min(s.length - 1, Math.max(0, Math.ceil(qq * s.length) - 1)); return s[i]; }
  function bars(rows, W, H, o) {   /* horizontal bars: rows [{label, v, color, text}], o = {max, target} */
    o = o || {}; var pl = Math.min(220, W * 0.38), pr = 70, out = [], bh = Math.min(26, (H - 20) / rows.length - 8), mx = o.max || Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    rows.forEach(function (r, i) { var y = 10 + i * (bh + 8), w = Math.max(0, (W - pl - pr) * Math.min(1, r.v / mx));
      out.push(txt(pl - 8, y + bh * 0.7, r.label, { anchor: 'end', fill: '#334155', size: 12 }));
      out.push('<rect x="' + pl + '" y="' + y + '" width="' + (W - pl - pr) + '" height="' + bh + '" rx="5" fill="rgba(148,163,184,.15)"/>');
      out.push('<rect x="' + pl + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + bh + '" rx="5" fill="' + r.color + '"/>');
      out.push(txt(pl + w + 6, y + bh * 0.7, r.text, { anchor: 'start', fill: r.color, size: 12, weight: 700 })); });
    if (o.target) { var x = pl + (W - pl - pr) * o.target / mx; out.push('<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="4" y2="' + (H - 4) + '" stroke="#111827" stroke-dasharray="5 4"/>'); }
    return out.join('');
  }

  // ------------------------------------------------------------------ Lab 1 · Lantern Bay's observers (Module 1; the invented town of the videos)
  var LB = { declared: 1334.44, underground: 136.37, informal: 139.49, illegal: 25.94, own: 30.15, newFirms: 61.08, statFirms: 1277.29, statOwn: 29.44, cardDeclaredShare: 0.655, cardHidden: 0.1, taxRate: 0.18 };
  LB.total = LB.declared + LB.underground + LB.informal + LB.illegal + LB.own;
  function obsCalc(o) {
    var informalSeen = LB.informal * o.honesty, firms = LB.statFirms + (o.register ? LB.newFirms * (LB.statFirms / (LB.declared - LB.newFirms)) : 0);
    var stats = firms + informalSeen + LB.statOwn;
    var tax = LB.declared, card = LB.declared * LB.cardDeclaredShare + (LB.underground + LB.informal) * LB.cardHidden;
    var missed = LB.total - stats, under = LB.underground;
    return { tax: tax, stats: stats, card: card, missed: missed, noeTrue: missed / LB.total, noeGDP: missed / stats, shadowTrue: under / LB.total, shadowGDP: under / stats };
  }
  var PRODUCERS = [['A café that skips some receipts', 'underground'], ['A taxi with no licence', 'illegal'], ['A dressmaker sewing at home, unregistered', 'informal'], ['A family growing vegetables for its table', 'own'], ['A new bakery the register has not caught up with', 'omission']];
  function observersLab(root) {
    var el = { tax: q(root, 'tax'), stats: q(root, 'stats'), card: q(root, 'card'), reg: q(root, 'reg'), hon: q(root, 'hon'), def: q(root, 'def'), den: q(root, 'den') }, mark = marker(root);
    var sorts = root.querySelectorAll('[data-sort]');
    function run() {
      var o = { register: el.reg.checked, honesty: +el.hon.value / 100 }, R = obsCalc(o);
      set(q(root, 'hon-out'), el.hon.value + '%');
      var rows = [{ label: 'what was really produced', v: LB.total, color: C.ink, text: '100%' }];
      if (el.tax.checked) rows.push({ label: 'tax office', v: R.tax, color: C.amber, text: pc(R.tax / LB.total, 0) });
      if (el.stats.checked) rows.push({ label: 'statistics office', v: R.stats, color: C.cyan, text: pc(R.stats / LB.total, 0) });
      if (el.card.checked) rows.push({ label: 'card company', v: R.card, color: C.purple, text: pc(R.card / LB.total, 0) });
      render(q(root, 'chart'), function (W, H) { return bars(rows, W, H, { max: LB.total }); });
      var def = el.def.value, den = el.den.value, num = def === 'all' ? R.missed : LB.underground, d = den === 'true' ? LB.total : R.stats, v = num / d;
      set(q(root, 'size'), pc(v, 1)); set(q(root, 'stats-v'), pc(R.stats / LB.total, 1)); set(q(root, 'missed'), Math.round(R.missed) + ' M');
      var taxR = LB.taxRate * LB.declared; set(q(root, 'taxgdp'), pc(taxR / R.stats, 1) + ' / ' + pc(taxR / LB.total, 1));
      var good = 0; sorts.forEach(function (s) { if (s.value === s.getAttribute('data-sort')) good++; });
      set(q(root, 'sorted'), good + ' of 5 right');
      set(q(root, 'status'), 'Statistics office records ' + pc(R.stats / LB.total, 1) + ' of what was produced' + (o.register ? ' (register up to date)' : '') + '; its household survey catches ' + el.hon.value + '% of informal sales.');
      mark(0, def === 'all' && den === 'true' && v < 0.12);
      mark(1, v > 0.17);
      mark(2, good === 5);
      mark(3, R.stats < R.tax);
      root.setAttribute('data-obs', [o.register ? 1 : 0, el.hon.value, def, den, v.toFixed(4), R.stats.toFixed(2), good].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.tax, el.stats, el.card, el.reg, el.def, el.den].forEach(function (x) { on(x, 'change', run); }); on(el.hon, 'input', run);
    sorts.forEach(function (s) { on(s, 'change', run); });
    run();
  }

  // ------------------------------------------------------------------ Lab 2 · forty countries (Module 2)
  function countriesWorld(seed, reform) {
    var r = rng(seed), Cn = 40, T = 16, rows = [];
    for (var c = 0; c < Cn; c++) {
      var qq = gauss(r), a = 0.55 * gauss(r), pop = Math.exp(gauss(r)), cErr = 0.06 * gauss(r);
      for (var t = 0; t < T; t++) {
        var tax = 0.30 + 0.05 * qq + 0.015 * gauss(r), enf = sig(0.9 * qq + 0.25 * gauss(r)), trust = sig(0.8 * qq + 0.3 * gauss(r)), selfe = 0.25 - 0.06 * qq + 0.03 * gauss(r);
        var dig = Math.min(0.98, Math.max(0.02, 0.45 + 0.18 * qq + 0.02 * t + 0.05 * gauss(r))), ref = reform && c < Cn / 2 && t >= 10;
        if (ref) dig = Math.min(0.98, dig + 0.15);
        var z = -1.4 + 2.0 * (tax - 0.30) - 1.3 * (enf - 0.5) - 1.6 * (trust - 0.5) + 4.0 * (selfe - 0.25) - 0.25 * (dig - 0.45) + a + 0.05 * gauss(r) - (ref ? 0.25 : 0);
        var s = sig(z), cash = 1 - dig, b = Math.min(0.95, Math.max(0.005, s + 0.5 * (cash - 0.5) - 0.04 + cErr + 0.02 * gauss(r)));
        rows.push({ c: c, t: t, s: s, b: b, ref: ref, x: [tax, enf, trust, selfe, dig], pop: pop });
      }
    }
    return rows;
  }
  function countriesLab(root) {
    var el = { split: q(root, 'split'), score: q(root, 'score'), tag: q(root, 'tag'), reform: q(root, 'reform'), k: q(root, 'k') }, seed = 304, mark = marker(root);
    function run() {
      var rows = countriesWorld(seed, el.reform.checked), k = +el.k.value; set(q(root, 'k-out'), String(k));
      var test;
      if (el.split.value === 'random') { var r = rng(seed + 7); test = rows.map(function () { return r() < 0.25; }); }
      else test = rows.map(function (w) { return w.c >= 30; });
      var tr = rows.filter(function (_, i) { return !test[i]; }), te = rows.filter(function (_, i) { return test[i]; });
      var fx2 = function (w) { return el.tag.checked ? w.x.concat([Math.log(w.pop) * 3]) : w.x.slice(); };
      var lin = ols(tr.map(function (w) { return w.x; }), tr.map(function (w) { return logit(w.b); }));
      var S2 = scaler(tr.map(fx2)), kn = knn(tr.map(function (w) { return S2(fx2(w)); }), tr.map(function (w) { return w.b; }), k);
      var target = el.score.value === 'truth' ? te.map(function (w) { return w.s; }) : te.map(function (w) { return w.b; });
      var pl = te.map(function (w) { return sig(lin(w.x)); }), pk = te.map(function (w) { return kn(S2(fx2(w))); });
      var eL = mae(pl, target), eK = mae(pk, target), eB = mae(te.map(function (w) { return w.b; }), te.map(function (w) { return w.s; }));
      set(q(root, 'elin'), fx(100 * eL, 1)); set(q(root, 'eknn'), fx(100 * eK, 1)); set(q(root, 'ebench'), fx(100 * eB, 1));
      // the reform: change in mean (years 10+ vs year 9), reform countries
      var rc = rows.filter(function (w) { return w.c < 20; }), pre = rc.filter(function (w) { return w.t === 9; }), post = rc.filter(function (w) { return w.t >= 10; });
      var dB = mean(post.map(function (w) { return w.b; })) - mean(pre.map(function (w) { return w.b; })), dS = mean(post.map(function (w) { return w.s; })) - mean(pre.map(function (w) { return w.s; }));
      var noRef = countriesWorld(seed, false).filter(function (w) { return w.c < 20 && w.t >= 10; }), eff = el.reform.checked ? mean(post.map(function (w) { return w.s; })) - mean(noRef.map(function (w) { return w.s; })) : 0;
      set(q(root, 'dbench'), (dB >= 0 ? '+' : '') + fx(100 * dB, 1)); set(q(root, 'dtrue'), (dS >= 0 ? '+' : '') + fx(100 * dS, 1)); set(q(root, 'eff'), el.reform.checked ? fx(100 * eff, 1) : '–');
      render(q(root, 'chart'), function (W, H) { return bars([{ label: 'simple, theory-guided', v: eL, color: C.blue, text: fx(100 * eL, 1) + ' pts' }, { label: 'flexible (neighbours)', v: eK, color: C.orange, text: fx(100 * eK, 1) + ' pts' }, { label: 'the estimate vs truth', v: eB, color: C.grey, text: fx(100 * eB, 1) + ' pts' }], W, H, { max: 0.12 }); });
      set(q(root, 'status'), (el.split.value === 'random' ? 'Random quarter of rows held out' : 'Ten whole countries held out') + '; scored against the ' + (el.score.value === 'truth' ? 'truth' : 'published estimate') + '.');
      var st = root._st || (root._st = {}); st[el.split.value + el.score.value + (el.tag.checked ? 't' : 'n') + k] = [eL, eK];
      var a = st['randombenchmarkt' + k], b2 = st['countrybenchmarkt' + k];
      mark(0, a && b2 && a[1] < a[0] && b2[1] > b2[0]);
      mark(1, el.score.value === 'truth' && eL > eB && eK > eB);
      mark(2, el.reform.checked && Math.abs(dB) > 1.5 * Math.abs(eff) && eff < 0);
      var c1 = st['randombenchmarkt' + k], c2 = st['randombenchmarkn' + k];
      mark(3, c1 && c2 && (c2[1] - c1[1]) > 0.005);
      root.setAttribute('data-ctr', [el.split.value, el.score.value, el.tag.checked ? 1 : 0, el.reform.checked ? 1 : 0, k, eL.toFixed(4), eK.toFixed(4), eB.toFixed(4), dB.toFixed(4), eff.toFixed(4)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.split, el.score, el.tag, el.reform].forEach(function (x) { on(x, 'change', run); }); on(el.k, 'input', run);
    on(q(root, 'newdata'), 'click', function () { seed++; root._st = {}; run(); });
    run();
  }

  // ------------------------------------------------------------------ Lab 3 · the audit game (Module 3)
  function gameRun(F0, F1, c, bx, T) {
    var g = 1, r = 1, d = 1, bq = 30, eta = 0.03, x = 0.5, qq = 0.05, xs = [], qs = [];
    for (var t = 0; t < T; t++) { var F = t < T / 2 ? F0 : F1, ux = (1 - qq) * g - qq * F, uq = x * (r + d) - c;
      x += eta * (sig(bx * ux) - x); qq += eta * (sig(bq * uq) - qq); xs.push(x); qs.push(qq); }
    var h = T / 2; return { xs: xs, qs: qs, x0: mean(xs.slice(h - 60, h)), q0: mean(qs.slice(h - 60, h)), x1: mean(xs.slice(T - 60)), q1: mean(qs.slice(T - 60)), xmin: Math.min.apply(null, xs.slice(h, h + 200)) };
  }
  var CONF_U = (function () { var r = rng(305), u = []; for (var i = 0; i < 2000; i++) u.push(0.55 + 0.28 * gauss(r)); return u; })();
  function confSweep(alpha) {
    var KA = 12, aa = [], up = [], dn = [], E = 0.99, i;
    function settle(a, E0) { var E1 = E0; for (var it = 0; it < 300; it++) { var n = 0; for (var j = 0; j < CONF_U.length; j++) if (CONF_U[j] - KA * a + alpha * (E1 - 0.5) > 0) n++; var E2 = n / CONF_U.length; if (Math.abs(E2 - E1) < 1e-6) break; E1 = E2; } return E1; }
    for (i = 0; i <= 40; i++) aa.push(i * 0.0025);
    aa.forEach(function (a) { E = settle(a, E); up.push(E); });
    for (i = aa.length - 1; i >= 0; i--) { E = settle(aa[i], E); dn[i] = E; }
    var col = aa.find(function (a, j) { return up[j] < 0.5; }), rel = aa.slice().reverse().find(function (a) { return dn[aa.indexOf(a)] > 0.5; });
    var width = 0; for (i = 0; i < aa.length; i++) if (Math.abs(up[i] - dn[i]) > 0.25) width += 0.0025;   /* audit rates where the two paths disagree */
    return { a: aa, up: up, dn: dn, collapse: col, relapse: rel, width: width };
  }
  function auditLab(root) {
    var el = { F: q(root, 'fine'), c: q(root, 'cost'), bx: q(root, 'noise'), dbl: q(root, 'double'), alpha: q(root, 'alpha') }, mark = marker(root);
    function game() {
      var F = +el.F.value, c = +el.c.value, bx = +el.bx.value, F1 = el.dbl.checked ? 2 * F : F, G = gameRun(F, F1, c, bx, 900);
      set(q(root, 'fine-out'), F.toFixed(1) + '× the tax'); set(q(root, 'cost-out'), c.toFixed(2)); set(q(root, 'noise-out'), String(bx));
      set(q(root, 'x0'), pc(G.x0)); set(q(root, 'q0'), pc(G.q0)); set(q(root, 'x1'), pc(G.x1)); set(q(root, 'q1'), pc(G.q1));
      set(q(root, 'nash'), 'Exact equilibrium: audits ' + pc(1 / (1 + F1), 1) + ', evasion ' + pc(c / 2, 1) + ' (the fine never enters the evasion rate).');
      render(q(root, 'chart'), function (W, H) { return xyChart({ id: 31, x: [0, 900], y: [0, 0.6], xLabel: 'rounds of play' + (el.dbl.checked ? ' (fine doubles half way)' : ''), yLabel: 'share',
        marks: el.dbl.checked ? [{ x: 450, label: 'fine ×2' }] : [], polys: [{ pts: G.xs.map(function (v, i) { return [i, v]; }), color: C.cyan, width: 2.4 }, { pts: G.qs.map(function (v, i) { return [i, v]; }), color: C.amber, width: 2.4 }] }, W, H); });
      mark(0, el.dbl.checked && Math.abs(G.x1 - G.x0) < 0.015 && G.q1 < 0.75 * G.q0);
      mark(1, G.x1 < 0.04);
      root.setAttribute('data-game', [F, c, bx, el.dbl.checked ? 1 : 0, G.x0.toFixed(4), G.q0.toFixed(4), G.x1.toFixed(4), G.q1.toFixed(4)].join(':'));
    }
    function conf() {
      var al = +el.alpha.value, R = confSweep(al); set(q(root, 'alpha-out'), al.toFixed(2));
      set(q(root, 'loop'), R.width > 0 ? fx(100 * R.width, 2) + ' points of audit rate' : 'no loop');
      render(q(root, 'cchart'), function (W, H) { return xyChart({ id: 32, x: [0, 0.1], y: [0, 1], xLabel: 'audit rate', yLabel: 'share evading',
        polys: [{ pts: R.a.map(function (a, i) { return [a, R.up[i]]; }), color: C.orange, width: 2.6 }, { pts: R.a.map(function (a, i) { return [a, R.dn[i]]; }), color: C.cyan, width: 2.6 }] }, W, H); });
      mark(2, R.width > 0.02);
      mark(3, al === 0 && R.width < 0.0025);
      root.setAttribute('data-conf', [al, R.width.toFixed(4)].join(':'));
    }
    function run() { game(); conf(); set(q(root, 'status'), 'Learning firms against a learning tax office; the copying model uses 2,000 agents.'); root.setAttribute('data-ready', '1'); }
    [el.F, el.c, el.bx].forEach(function (x) { on(x, 'input', game); }); on(el.dbl, 'change', game); on(el.alpha, 'input', conf);
    run();
  }

  // ------------------------------------------------------------------ Lab 4 · estimate the Archipelago (Module 4)
  var ARCH_NAMES = ['tax burden', 'enforcement', 'trust', 'self-employment', 'unemployment', 'regulation', 'e-payments', 'bank access', 'currency ratio', 'electricity gap', 'spending gap'];
  function archWorld(seed) {
    var r = rng(seed), Cn = 50, T = 12, rows = [];
    var order = []; for (var i = 0; i < Cn; i++) order.push(i);
    for (i = Cn - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    var has = {}; order.slice(0, 30).forEach(function (c) { has[c] = true; });
    for (var c = 0; c < Cn; c++) {
      var qq = gauss(r), a = 0.55 * gauss(r), cult = 0.03 * gauss(r);
      for (var t = 0; t < T; t++) {
        var tax = 0.30 + 0.05 * qq + 0.015 * gauss(r), enf = sig(0.9 * qq + 0.25 * gauss(r)), trust = sig(0.8 * qq + 0.3 * gauss(r));
        var selfe = Math.min(0.6, Math.max(0.03, 0.24 - 0.06 * qq + 0.02 * gauss(r))), unemp = Math.min(0.3, Math.max(0.01, 0.08 - 0.025 * qq + 0.015 * gauss(r))), reg = 0.5 - 0.15 * qq + 0.05 * gauss(r);
        var bank = sig(0.8 * qq + 0.1 * t - 0.4 + 0.2 * gauss(r)), epay = sig(-0.5 + 0.9 * qq + 0.12 * t + 0.2 * gauss(r)), cash = 1 - epay;
        var z = -2.15 + 1.5 * (tax - 0.3) + 2.6 * selfe + 1.1 * reg + 4.0 * unemp - 1.1 * trust + 1.1 * (enf < 0.35 ? 1 : 0) - 0.7 * enf + 1.4 * cash * (1 - bank) + a + 0.06 * gauss(r);
        var s = 0.85 * sig(z), curr = 0.10 + 0.45 * cash + 0.35 * s + 0.03 * gauss(r), elec = 0.3 * s + 0.06 * gauss(r), gap = 0.45 * s + 0.3 * (selfe - 0.24) + cult + 0.04 * gauss(r);
        rows.push({ c: c, has: !!has[c], s: s, b: Math.min(0.95, Math.max(0.005, s + 0.02 * gauss(r))), x: [tax, enf, trust, selfe, unemp, reg, epay, bank, curr, elec, gap] });
      }
    }
    return rows;
  }
  function estimateLab(root) {
    var el = { model: q(root, 'model'), link: q(root, 'link'), depth: q(root, 'depth'), k: q(root, 'k'), cal: q(root, 'cal'), inputs: q(root, 'inputs') }, seed = 307, mark = marker(root), W0 = archWorld(seed);
    function cols(w) { return el.inputs.value === 'causes' ? w.x.slice(0, 8).concat([0, 0, 0]) : w.x; }
    function fitModel(tr) {
      var m = el.model.value, X = tr.map(cols), y = tr.map(function (w) { return w.b; });
      if (m === 'linear') { var S = scaler(X), f = ols(X.map(S), el.link.checked ? y.map(logit) : y); var g = function (row) { var v = f(S(row)); return el.link.checked ? sig(v) : v; }; return g; }
      if (m === 'tree') { var tf = tree(X, y, +el.depth.value, 2); return tf; }
      var S2 = scaler(X), kf = knn(X.map(S2), y, +el.k.value); return function (row) { return kf(S2(row)); };
    }
    function run() {
      set(q(root, 'depth-out'), el.depth.value); set(q(root, 'k-out'), el.k.value);
      var m = el.model.value; root.querySelectorAll('[data-for]').forEach(function (n) { n.hidden = n.getAttribute('data-for') !== m; });
      var tr = W0.filter(function (w) { return w.has; }), te = W0.filter(function (w) { return !w.has; });
      var f = fitModel(tr), pTr = tr.map(function (w) { return f(cols(w)); }), pTe = te.map(function (w) { return f(cols(w)); });
      var eTr = mae(pTr, tr.map(function (w) { return w.b; })), eTe = mae(pTe, te.map(function (w) { return w.s; })), neg = pTe.filter(function (v) { return v < 0; }).length;
      // 90% conformal range: calibrate on held-out rows or whole countries of the 30
      var r = rng(seed + 3), calc = {}, cs = []; tr.forEach(function (w) { if (cs.indexOf(w.c) < 0) cs.push(w.c); }); cs.forEach(function (c, i) { if (i % 3 === 0) calc[c] = true; });
      var isCal = el.cal.value === 'countries' ? tr.map(function (w) { return !!calc[w.c]; }) : tr.map(function () { return r() < 1 / 3; });
      var fitPart = tr.filter(function (_, i) { return !isCal[i]; }), calPart = tr.filter(function (_, i) { return isCal[i]; });
      var g = fitModel(fitPart), res = calPart.map(function (w) { return Math.abs(w.b - g(cols(w))); }), qq = quantile(res, Math.min(1, 0.9 * (1 + 1 / res.length)));
      var cov = mean(te.map(function (w) { var p = g(cols(w)); return (w.s >= p - qq && w.s <= p + qq) ? 1 : 0; }));
      set(q(root, 'etr'), fx(100 * eTr, 1)); set(q(root, 'ete'), fx(100 * eTe, 1)); set(q(root, 'neg'), String(neg)); set(q(root, 'cov'), pc(cov, 0) + ' (±' + fx(100 * qq, 1) + ' pts)');
      var split = '';
      if (m === 'tree' && f.root && f.root.l) split = 'First question: ' + ARCH_NAMES[f.root.j] + ' < ' + fx(f.root.thr, 2) + '?';
      set(q(root, 'split'), split || (m === 'linear' ? (el.link.checked ? 'Linear on the log-odds, squeezed back between 0 and 1.' : 'A straight line: nothing stops a negative share.') : 'Average of the ' + el.k.value + ' most similar benchmark country-years.'));
      var ex = te.filter(function (w, i) { return i % 12 === 0; }).slice(0, 20);
      render(q(root, 'chart'), function (W, H) { return xyChart({ id: 41, x: [0, 0.8], y: [-0.1, 0.8], xLabel: 'true hidden share (20 new countries)', yLabel: 'estimate',
        curves: [{ f: function (v) { return v; }, color: C.grey, width: 1.4, dash: '5 4' }], dots: te.map(function (w, i) { return { x: w.s, y: pTe[i], color: pTe[i] < 0 ? C.orange : C.blue, r: 2.6 }; }) }, W, H); });
      set(q(root, 'status'), 'Trained on 30 benchmark countries (360 country-years); scored on 20 new countries (240) against the truth.');
      mark(0, m === 'linear' && el.link.checked && neg === 0 && root._sawNeg);
      if (m === 'linear' && !el.link.checked && neg > 0) root._sawNeg = true;
      mark(1, m === 'tree' && f.root && f.root.l && f.root.j === 1 && Math.abs(f.root.thr - 0.35) < 0.03);
      mark(2, m === 'tree' && eTr < 0.015 && eTe > 0.06);
      mark(3, el.cal.value === 'countries' && cov >= 0.85);
      root.setAttribute('data-est', [m, el.inputs.value, el.link.checked ? 1 : 0, el.depth.value, el.k.value, el.cal.value, eTr.toFixed(4), eTe.toFixed(4), neg, cov.toFixed(3), f.root ? f.root.j + '@' + fx(f.root.thr, 3) : '-'].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.model, el.link, el.cal, el.inputs].forEach(function (x) { on(x, 'change', run); }); [el.depth, el.k].forEach(function (x) { on(x, 'change', run); on(x, 'input', function () { set(q(root, 'depth-out'), el.depth.value); set(q(root, 'k-out'), el.k.value); }); });
    run();
  }

  // ------------------------------------------------------------------ Lab 5 · the forecast desk (Module 5)
  /* 30 invented countries × 48 quarters. Shifts (each can be switched off): digital payments take over in 15 countries from quarter 20,
     a recession in quarters 28–35, e-invoicing in 10 countries from quarter 36. The careful benchmark covers a year and is published a year after it. */
  function deskWorld(o) {
    var r = rng(310), Cn = 30, T = 48, W = [];
    function recE(t) { return !o.rec || t < 28 ? 0 : t < 31 ? 0.026 * (t - 27) / 3 : t < 36 ? 0.026 : Math.max(0, 0.026 * (1 - (t - 35) / 8)); }
    for (var c = 0; c < Cn; c++) {
      var uc = 0.04 + 0.05 * r(), lvl = 0.12 + 2.4 * (uc - 0.04) + 0.05 * r(), fast = c % 2 === 0, ref = c % 3 === 0, e0 = 0.1 + 0.1 * r(), cb = 0.04 * gauss(r), hoard = c % 4 < 2, ar = 0, h = [], x = [], B = [];
      for (var t = 0; t < T; t++) {
        ar = 0.8 * ar + 0.0035 * gauss(r);
        var sh = o.tech && fast ? Math.min(1, Math.max(0, (t - 20) / 6)) : 0, rf = o.reform && ref ? Math.min(1, Math.max(0, (t - 36) / 4)) : 0;
        var u = uc + (o.rec && t >= 28 && t < 36 ? 0.06 : 0) + 0.003 * gauss(r);
        var hv = lvl - 0.0008 * t + recE(t) - 0.035 * rf + ar;
        var ep = e0 + 0.004 * t + 0.25 * sh + 0.15 * rf + 0.01 * gauss(r);
        var cash = 0.25 + cb + hv * (1 - 0.6 * sh) * (1 - 0.5 * rf) - 0.3 * (ep - e0) + (hoard && o.rec && t >= 28 && t < 36 ? 0.03 : 0) + 0.008 * gauss(r);   /* in half the countries a recession also brings cash hoarding */
        h.push(hv); x.push([cash, u, ep]);
      }
      for (var y = 0; y < 12; y++) B.push((h[4 * y] + h[4 * y + 1] + h[4 * y + 2] + h[4 * y + 3]) / 4 + 0.004 * gauss(r));
      W.push({ h: h, x: x, B: B, xb: B.map(function (_, y) { return [0, 1, 2].map(function (j) { return (x[4 * y][j] + x[4 * y + 1][j] + x[4 * y + 2][j] + x[4 * y + 3][j]) / 4; }); }) });
    }
    return W;
  }
  /* nowcasts for quarters 16–47 from what was published at each quarter (the benchmark of year y appears at quarter 4y + 8) */
  function deskRun(W, model, win) {
    var out = W.map(function () { return []; });
    for (var t = 16; t < 48; t++) {
      var ymax = Math.floor((t - 8) / 4), y0 = Math.max(0, ymax - win + 1), f = null;
      if (model === 'regression') {
        var X = [], Y = [];
        W.forEach(function (w) { for (var y = y0; y <= ymax; y++) for (var k = 0; k < 4; k++) { X.push(w.x[4 * y + k]); Y.push(w.B[y]); } });
        f = ols(X, Y, 1e-4);
      } else if (model === 'anchor') {
        var dX = [], dY = [];
        W.forEach(function (w) { for (var y = Math.max(1, y0); y <= ymax; y++) { dX.push(w.xb[y].map(function (v, j) { return v - w.xb[y - 1][j]; })); dY.push(w.B[y] - w.B[y - 1]); } });
        f = dX.length > 6 ? ols(dX, dY, 1e-4) : function () { return 0; };
      }
      W.forEach(function (w, c) {
        var p = model === 'persistence' ? w.B[ymax] : model === 'regression' ? f(w.x[t]) : w.B[ymax] + f(w.x[t].map(function (v, j) { return v - w.xb[ymax][j]; }));
        out[c].push(p);
      });
    }
    return out;
  }
  function deskScore(W, P) {
    var byT = [], all = [], rec = [];
    for (var k = 0; k < 32; k++) { var e = mean(W.map(function (w, c) { return Math.abs(P[c][k] - w.h[16 + k]); })); byT.push(e); all.push(e); if (16 + k >= 28 && 16 + k < 36) rec.push(e); }
    // drift alarm: at each release, score last year's nowcasts against the new benchmark; alarm when the error doubles its running average
    var rel = [], first = null;
    for (var y = 4; y <= 9; y++) {
      var s = mean([].concat.apply([], W.map(function (w, c) { return [0, 1, 2, 3].map(function (k) { return Math.abs(P[c][4 * y + k - 16] - w.B[y]); }); })));
      var base = rel.length ? mean(rel.map(function (r) { return r.e; })) : null, alarm = base !== null && s > 2 * base;
      rel.push({ q: 4 * y + 8, e: s, alarm: alarm }); if (alarm && first === null) first = 4 * y + 8;
    }
    return { byT: byT, all: mean(all), rec: mean(rec), rel: rel, first: first };
  }
  /* the tempting check: hold out random quarters, labels from every year's benchmark, publication lags ignored */
  function deskRandom(W) {
    var rows = []; W.forEach(function (w) { for (var t = 0; t < 48; t++) rows.push({ x: w.x[t], b: w.B[Math.floor(t / 4)], h: w.h[t] }); });
    var r = rng(311), fold = rows.map(function () { return Math.floor(r() * 5); }), err = [];
    for (var k = 0; k < 5; k++) {
      var tr = rows.filter(function (_, i) { return fold[i] !== k; }), te = rows.filter(function (_, i) { return fold[i] === k; });
      var f = ols(tr.map(function (z) { return z.x; }), tr.map(function (z) { return z.b; }), 1e-4);
      te.forEach(function (z) { err.push(Math.abs(f(z.x) - z.h)); });
    }
    return mean(err);
  }

  // ------------------------------------------------------------------ Lab 6 · the night atlas (Module 6)
  /* 160 invented districts on a hexagonal map (16 × 10): a river splits a West that hides less from an East with a smuggling corridor,
     two market towns and hills. Surveys exist in 40 districts, mostly in the West. */
  function atlasWorld() {
    var r = rng(312), D = [], i, j;
    for (var row = 0; row < 10; row++) for (var col = 0; col < 16; col++) D.push({ col: col, row: row, x: col + (row % 2) * 0.5, y: row * 0.866, west: col <= 5 });
    var nz = D.map(function () { return gauss(r); });
    D.forEach(function (d) { d.nb = []; });
    for (i = 0; i < D.length; i++) for (j = i + 1; j < D.length; j++) if (Math.hypot(D[i].x - D[j].x, D[i].y - D[j].y) < 1.1) { D[i].nb.push(j); D[j].nb.push(i); }
    D.forEach(function (d, k) {
      var sm = nz[k]; d.nb.forEach(function (n) { sm += nz[n]; }); sm /= (d.nb.length + 1);
      var t1 = Math.hypot(d.x - 11, d.y - 4.5), t2 = Math.hypot(d.x - 8, d.y - 2.2);
      var cd = Math.abs((d.x - 15.3) * 7.8 - (d.y - 0) * (9.5 - 15.3)) / Math.hypot(7.8, 9.5 - 15.3);   // distance to the corridor line
      d.s = d.west ? 13 + 3 * sm * 1.6 : 21 + 9 * Math.exp(-cd * cd / 0.7) * (d.y > 0.5 ? 1 : 0.6) + 11 * Math.exp(-t1 * t1 / 1.1) + 11 * Math.exp(-t2 * t2 / 1.1) + 3 * (d.row >= 7 ? 1 : 0) + 3 * sm * 1.6;
      d.cash = d.s + 3.0 * gauss(r); d.self = 0.5 * d.s + 2.2 * gauss(r);
    });
    var west = D.map(function (d, k) { return d.west ? k : -1; }).filter(function (k) { return k >= 0; }), east = D.map(function (d, k) { return d.west ? -1 : k; }).filter(function (k) { return k >= 0; });
    function pick(a, n) { a = a.slice(); for (var k = a.length - 1; k > 0; k--) { var m = Math.floor(r() * (k + 1)), t = a[k]; a[k] = a[m]; a[m] = t; } return a.slice(0, n); }
    var sv = pick(west, 30).concat(pick(east, 10)); sv.forEach(function (k) { D[k].surv = true; D[k].sv = D[k].s + 1.0 * gauss(r); });
    D.border = D.map(function (d, k) { return d.nb.some(function (n) { return D[n].west !== d.west; }) ? k : -1; }).filter(function (k) { return k >= 0; });
    return D;
  }
  function moran(D, v) {
    var m = mean(v), num = 0, den = 0, w = 0;
    D.forEach(function (d, i) { den += (v[i] - m) * (v[i] - m); d.nb.forEach(function (j) { num += (v[i] - m) * (v[j] - m); w++; }); });
    return (D.length / w) * num / den;
  }
  function shuffled(v, seed) { var r = rng(seed), a = v.slice(); for (var k = a.length - 1; k > 0; k--) { var m = Math.floor(r() * (k + 1)), t = a[k]; a[k] = a[m]; a[m] = t; } return a; }
  function moranTest(D, v, n) { var I = moran(D, v), ge = 0; for (var k = 0; k < n; k++) if (moran(D, shuffled(v, 900 + k)) >= I) ge++; return { I: I, p: (ge + 1) / (n + 1) }; }
  function lisa(D, v, n) {   // local Moran with conditional permutations; returns labels HH / LL / HL / LH / ns
    var m = mean(v), sd = Math.sqrt(mean(v.map(function (x) { return (x - m) * (x - m); }))), z = v.map(function (x) { return (x - m) / sd; }), r = rng(77);
    return D.map(function (d, i) {
      var lag = mean(d.nb.map(function (j) { return z[j]; })), Ii = z[i] * lag, ge = 0, k = d.nb.length;
      for (var p = 0; p < n; p++) { var s = 0; for (var q2 = 0; q2 < k; q2++) { var j; do { j = Math.floor(r() * D.length); } while (j === i); s += z[j]; } if (Math.abs(z[i] * s / k) >= Math.abs(Ii)) ge++; }
      if ((ge + 1) / (n + 1) >= 0.05) return 'ns';
      return z[i] >= 0 ? (lag >= 0 ? 'HH' : 'HL') : (lag >= 0 ? 'LH' : 'LL');
    });
  }
  function atlasEstimate(D, how, k, lam, cut) {
    var S = D.filter(function (d) { return d.surv; }), cs = mean(D.map(function (d) { return d.cash; })), ss = mean(D.map(function (d) { return d.self; }));
    var sdc = Math.sqrt(mean(D.map(function (d) { return (d.cash - cs) * (d.cash - cs); }))), sds = Math.sqrt(mean(D.map(function (d) { return (d.self - ss) * (d.self - ss); })));
    function dist(a, b) { var g = Math.hypot(a.x - b.x, a.y - b.y) / 2.5, e = Math.hypot((a.cash - b.cash) / sdc, (a.self - b.self) / sds); return how === 'map' ? g : how === 'economy' ? e : g + e; }
    var est = D.map(function (d) { if (d.surv) return d.sv; var nn = S.map(function (s) { return [dist(d, s), s.sv]; }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, k); return mean(nn.map(function (z) { return z[1]; })); });
    if (lam > 0) { var z = est.slice(); for (var it = 0; it < 80; it++) z = D.map(function (d, i) { var nb = d.nb.filter(function (j) { return !cut || D[j].west === d.west; }), s = 0; nb.forEach(function (j) { s += z[j]; }); return (est[i] + lam * s) / (1 + lam * nb.length); }); est = z; }
    var un = D.map(function (d, i) { return d.surv ? -1 : i; }).filter(function (i) { return i >= 0; });
    var err = mean(un.map(function (i) { return Math.abs(est[i] - D[i].s); }));
    function step(v) { var e = D.border.filter(function (i) { return !D[i].west; }), w = D.border.filter(function (i) { return D[i].west; }); return mean(e.map(function (i) { return v[i]; })) - mean(w.map(function (i) { return v[i]; })); }
    return { est: est, err: err, step: step(est), stepTrue: step(D.map(function (d) { return d.s; })) };
  }

  // ------------------------------------------------------------------ Lab 7 · town in silico (Module 7)
  /* A small Saltmarsh: 300 invented firms decide each quarter how much of their cash sales to declare, weighing tax, perceived audit risk,
     a moral cost that grows with trust, and what their peer group does. Trust follows the revenue the town collects. */
  function gammaR(r, k, th) {   // Marsaglia–Tsang
    if (k < 1) return gammaR(r, k + 1, th) * Math.pow(r(), 1 / k);
    var d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) { var x = gauss(r), v = Math.pow(1 + c * x, 3); if (v <= 0) continue; var u = r(); if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v * th; }
  }
  var DOPT = [0, 0.25, 0.5, 0.75, 1];
  function townRun(o) {   // o: {audit, peer, hetero, recession, einv, feedback, start, seed}
    var r = rng(o.seed || 315), N = 300, T = 40, burn = 40, tau = 0.25, phi = 0.6, lam = 60, MSC = 0.55, i;
    var size = [], card = [], m0 = [], grp = [], pbel = [], d = [];
    for (i = 0; i < N; i++) size.push(Math.exp(0.8 * gauss(r)));
    var ms = mean(size); size = size.map(function (s) { return s / ms; }); var q75 = quantile(size, 0.75);
    for (i = 0; i < N; i++) { var bt = gammaR(r, 2, 1), bt2 = gammaR(r, 3, 1); card.push(Math.min(0.95, bt / (bt + bt2) + (size[i] > q75 ? 0.25 : 0)));
      m0.push(gammaR(r, 2 / (o.hetero * o.hetero), MSC * o.hetero * o.hetero / 2)); grp.push(Math.floor(r() * 15)); pbel.push(o.audit * (0.5 + r())); d.push(o.start === undefined ? 0.8 : 1 - o.start); }
    var big = size.map(function (s) { return s >= q75; }), trust = 0.6, baseRev = null, path = [], small = [], fin = null;
    for (var tt = 0; tt < burn + T; tt++) {
      var t = tt - burn, rec = o.recession && t >= 12 && t < 20, einv = o.einv && t >= 20, demand = rec ? 0.85 : 1;
      var att = size.map(function (s, k) { return s * (1 + 0.5 * (1 - d[k]) * (1 - card[k]) * (einv && big[k] ? 0 : 1)); }), sa = 0; att.forEach(function (a) { sa += a; });
      var sales = att.map(function (a) { return demand * N * a / sa; }), cash = sales.map(function (s, k) { return einv && big[k] ? 0 : s * (1 - card[k]); }), hid = cash.map(function (c, k) { return c * (1 - d[k]); });
      var emp = rec ? 0.86 : 0.94, side = 2000 * (1 - emp) * 0.04 * (1.3 - 0.3 * trust) * (N / 400);
      var S = 0, H = 0; sales.forEach(function (s) { S += s; }); hid.forEach(function (h) { H += h; });
      var nA = Math.round(o.audit * N), aud = new Array(N).fill(false), cnt = 0; while (cnt < nA) { var k2 = Math.floor(r() * N); if (!aud[k2]) { aud[k2] = true; cnt++; } }
      var det = 0; for (i = 0; i < N; i++) if (aud[i]) det += hid[i];
      var rev = tau * (S - H) + (tau + phi) * det; if (baseRev === null) { var C2 = 0; cash.forEach(function (c) { C2 += c; }); baseRev = tau * (S - 0.2 * C2); }
      if (o.feedback) trust += 0.25 * (Math.min(1.5, Math.max(0, rev / baseRev)) * 0.6 - trust);
      var gs = new Array(15).fill(0), gn = new Array(15).fill(0), ga = new Array(15).fill(0);
      for (i = 0; i < N; i++) { gs[grp[i]] += 1 - d[i]; gn[grp[i]]++; if (aud[i]) ga[grp[i]]++; }
      for (i = 0; i < N; i++) {
        pbel[i] = 0.85 * pbel[i] + 0.15 * Math.min(1, 2 * ga[grp[i]] / gn[grp[i]]); if (aud[i] && d[i] < 1) pbel[i] = Math.max(pbel[i], 0.4);
        var mc = m0[i] * (0.4 + trust) - o.peer * gs[grp[i]] / gn[grp[i]], V = DOPT.map(function (dd) { return -tau * dd - pbel[i] * (tau + phi) * (1 - dd) - mc * (1 - dd); }), vm = Math.max.apply(null, V);
        var P = V.map(function (v) { return Math.exp(lam * (v - vm)); }), ps = P[0] + P[1] + P[2] + P[3] + P[4], u = r() * ps, ch = 0; while (ch < 4 && u > P[ch]) { u -= P[ch]; ch++; }
        d[i] = einv && big[i] ? 1 : 0.7 * d[i] + 0.3 * DOPT[ch];
      }
      if (t >= 0) {
        path.push((H + side) / (S + side));
        var hs = 0, ss2 = 0; for (i = 0; i < N; i++) if (!big[i]) { hs += hid[i]; ss2 += sales[i]; } small.push(hs / ss2);
        if (t === T - 1) { var hf = hid.map(function (h, k) { return { h: h, c: cash[k] }; }), tot = 0, honest = 0, nc = 0; hf.forEach(function (z) { tot += z.h; if (z.c > 1e-9) { nc++; if (z.h < 1e-6 * z.c + 1e-9 || z.h / z.c < 0.01) honest++; } });
          var srt = hid.slice().sort(function (a, b) { return b - a; }), top = 0; for (i = 0; i < N / 10; i++) top += srt[i]; fin = { honest: honest / nc, top10: top / tot, trust: trust }; }
      }
    }
    return { path: path, small: small, end: mean(path.slice(-4)), smallEnd: mean(small.slice(-4)), fin: fin };
  }

  // ------------------------------------------------------------------ Lab 8 · the policy room (Module 8)
  /* the course's ten-year teaching model of the Mainland: audits a, digital reporting d, services f (yearly cost a + 1.5d + 1.3f, budget 1);
     states: true hidden share n, observability o, trust q. Every response coefficient is drawn per future (300 futures). */
  var PNAMES = ['a_eff', 'd_obs', 'd_eff', 'f_eff', 'backlash', 'q_f', 'q_a', 'drift', 'shock'];
  var PLO = [0.010, 0.04, 0.002, 0.000, 0.000, 0.02, 0.01, 0.000, 0.0], PHI_ = [0.035, 0.12, 0.012, 0.035, 0.030, 0.08, 0.07, 0.008, 0.03];
  function policyFutures(S, pin) {   // pin: null, or a fixed services effect learned from a pilot
    var r = rng(318), F = [];
    for (var s = 0; s < S; s++) {
      var th = PLO.map(function (lo, k) { return lo + (PHI_[k] - lo) * r(); }); if (pin !== null && pin !== undefined) th[3] = pin;
      var yr = Math.floor(r() * 10), hit = r() < 0.5, sh = new Array(10).fill(0); if (hit) { sh[yr] = 0.5; if (yr + 1 < 10) sh[yr + 1] = 0.5; }
      var nz = []; for (var t = 0; t < 10; t++) nz.push(0.004 * gauss(r));
      F.push({ th: th, sh: sh, nz: nz });
    }
    return F;
  }
  function policyRun(p, F) {   // p = [a, d, f] → final hidden shares, trust, observability per future
    var out = { n: [], q: [], o: [] };
    F.forEach(function (fu) {
      var A = fu.th, n = 0.27, o = 0.45, q2 = 0.5;
      for (var t = 0; t < 10; t++) {
        var cap = Math.min(1, (t + 1) / 3);
        o = Math.min(0.98, Math.max(0.05, o + A[1] * p[1] * cap + 0.02 * p[0] - 0.05 * (o - 0.45)));
        q2 = Math.min(0.98, Math.max(0.05, q2 + A[5] * p[2] - A[6] * p[0] + 0.1 * (0.25 - n) - 0.05 * (q2 - 0.5)));
        n = Math.min(0.6, Math.max(0.02, n + A[7] - A[0] * (1 - Math.exp(-2.5 * p[0])) * o * 2 - A[2] * p[1] * cap - A[3] * p[2] * q2 * 2 + A[4] * p[0] * (1 - q2) + A[8] * fu.sh[t] + fu.nz[t]));
      }
      out.n.push(n); out.q.push(q2); out.o.push(o);
    });
    return { mean: mean(out.n), p90: quantile(out.n, 0.9), worst: Math.max.apply(null, out.n), pT: mean(out.n.map(function (v) { return v <= 0.22 ? 1 : 0; })), trust: mean(out.q), n: out.n };
  }
  function policyCost(p) { return p[0] + 1.5 * p[1] + 1.3 * p[2]; }
  function policyGrid(F) {
    var G = [];
    for (var a = 0; a <= 10; a++) for (var d = 0; d <= 6; d++) for (var f = 0; f <= 7; f++) { var p = [a / 10, d / 10, f / 10]; if (policyCost(p) <= 1.0001) { var R = policyRun(p, F); G.push({ p: p, cost: policyCost(p), mean: R.mean, p90: R.p90 }); } }
    G.forEach(function (g) { g.front = !G.some(function (h) { return h.cost <= g.cost + 1e-9 && h.mean <= g.mean + 1e-9 && (h.cost < g.cost - 1e-9 || h.mean < g.mean - 1e-9); }); });
    return G;
  }
  var PACKS = { 'status quo': [0.2, 0, 0], 'enforcement first': [1, 0, 0], 'digital reporting first': [0.1, 0.6, 0], 'services first': [0, 0, 0.75] };

  // ------------------------------------------------------------------ Lab 9 · study designer (Module 9)
  /* part B: the best of K specifications on the same folds, 40 invented countries, 22 candidate predictors (2 real) */
  function forkWorld() {
    var r = rng(320), P = 22;
    function world(n) { var X = [], y = []; for (var i = 0; i < n; i++) { var row = []; for (var j = 0; j < P; j++) row.push(gauss(r)); X.push(row); y.push(20 + 3 * row[0] + 2 * row[1] + 4 * gauss(r)); } return { X: X, y: y }; }
    var S = world(40), Fr = world(2000), specs = [];
    for (var k = 0; k < 300; k++) { var m = 1 + Math.floor(r() * 6), cols = []; while (cols.length < m) { var c = Math.floor(r() * P); if (cols.indexOf(c) < 0) cols.push(c); } specs.push(cols.sort(function (a, b) { return a - b; })); }
    var folds = S.X.map(function (_, i) { return i % 5; }); var perm = shuffled(folds, 5); return { S: S, Fr: Fr, specs: specs, folds: perm };
  }
  function cvErr(X, y, cols, folds, K) {
    var e = [];
    for (var k = 0; k < K; k++) { var tr = [], ty = [], te = [], ey = []; X.forEach(function (row, i) { var z = cols.map(function (c) { return row[c]; }); if (folds[i] === k) { te.push(z); ey.push(y[i]); } else { tr.push(z); ty.push(y[i]); } });
      var f = ols(tr, ty, 1e-6); te.forEach(function (z, i) { e.push(Math.abs(f(z) - ey[i])); }); }
    return mean(e);
  }
  function forkRun(FW, K, nested) {
    var S = FW.S, specs = FW.specs.slice(0, K), cv = specs.map(function (c) { return cvErr(S.X, S.y, c, FW.folds, 5); }), b = 0;
    cv.forEach(function (v, i) { if (v < cv[b]) b = i; });
    var cols = specs[b], f = ols(S.X.map(function (row) { return cols.map(function (c) { return row[c]; }); }), S.y, 1e-6);
    var fresh = mean(FW.Fr.X.map(function (row, i) { return Math.abs(f(cols.map(function (c) { return row[c]; })) - FW.Fr.y[i]); }));
    var nest = null;
    if (nested) {   // the whole selection inside an outer 5-fold split
      var e = [];
      for (var k = 0; k < 5; k++) {
        var trI = [], teI = []; S.X.forEach(function (_, i) { (FW.folds[i] === k ? teI : trI).push(i); });
        var Xtr = trI.map(function (i) { return S.X[i]; }), ytr = trI.map(function (i) { return S.y[i]; }), inner = trI.map(function (_, j) { return j % 4; });
        var bb = 0, bv = Infinity; specs.forEach(function (c, i) { var v = cvErr(Xtr, ytr, c, inner, 4); if (v < bv) { bv = v; bb = i; } });
        var cc = specs[bb], g = ols(Xtr.map(function (row) { return cc.map(function (c) { return row[c]; }); }), ytr, 1e-6);
        teI.forEach(function (i) { e.push(Math.abs(g(cc.map(function (c) { return S.X[i][c]; })) - S.y[i])); });
      }
      nest = mean(e);
    }
    return { best: cv[b], fresh: fresh, nested: nest, cols: cols, real: (cols.indexOf(0) >= 0 ? 1 : 0) + (cols.indexOf(1) >= 0 ? 1 : 0) };
  }
  /* part A: the task card; each rule returns null when fine, or a flag */
  var STUDY_RULES = [
    function (s) { var want = { measurement: 'level', detection: 'ranking', forecasting: 'trajectory', causal: 'effect', simulation: 'distribution', policy: 'portfolio' }; return s.output !== want[s.task] ? 'The output does not match the task: a ' + s.task + ' task produces a ' + want[s.task] + '.' : null; },
    function (s) { return s.task === 'detection' && (s.unit === 'country-year' || s.unit === 'region') ? 'Level mismatch: a ' + s.unit + ' model cannot say which firm is hiding. Use firms or transactions.' : null; },
    function (s) { return (s.task === 'forecasting' && s.validation !== 'later years') ? 'A forecast should be checked on later years (rolling origin), not ' + s.validation + '.' : null; },
    function (s) { return (s.task === 'detection' && s.validation === 'random rows') ? 'Past audits were not random: check rankings against random audits.' : null; },
    function (s) { return (s.task === 'causal' && s.comparator === 'none') ? 'A causal estimand needs a comparator: compared with what?' : null; },
    function (s) { return (s.task === 'causal' && s.horizon === 'none') ? 'A causal estimand needs a horizon.' : null; },
    function (s) { return s.denominator === 'unstated' ? 'State the denominator: a share of what?' : null; },
    function (s) { return s.uncertainty === 'none' ? 'No uncertainty reported.' : s.uncertainty === 'standard error' ? 'A standard error covers sampling only; test interval coverage, by subgroup.' : null; },
    function (s) { return !s.limits ? 'Add a list of what the study cannot tell you.' : null; },
    function (s) { return !s.code ? 'Share code, data access and seeds so others can reproduce the numbers.' : null; },
    function (s) { return !s.prereg ? 'Write the estimand and validation design down before seeing results.' : null; }
  ];

  function nowcastLab(root) {
    var el = { model: q(root, 'model'), win: q(root, 'win'), check: q(root, 'check'), tech: q(root, 'tech'), rec: q(root, 'rec'), reform: q(root, 'reform') }, mark = marker(root), cache = {};
    var NAME = { persistence: 'persistence', regression: 'regression on levels', anchor: 'anchor and update' };
    function world() { var k = [el.tech.checked, el.rec.checked, el.reform.checked].map(Number).join(''); if (!cache[k]) { var W = deskWorld({ tech: el.tech.checked, rec: el.rec.checked, reform: el.reform.checked }); cache[k] = { W: W, rnd: deskRandom(W), per: deskScore(W, deskRun(W, 'persistence', 99)) }; } return cache[k]; }
    function run() {
      var Wd = world(), W = Wd.W, m = el.model.value, win = +el.win.value, S = deskScore(W, deskRun(W, m, win)), per = function (a, b) { return mean(S.byT.slice(a - 16, b - 16)); };
      var shown = el.check.value === 'random' && m === 'regression' ? Wd.rnd : S.all;
      set(q(root, 'all'), fx(100 * shown, 1) + ' pts'); set(q(root, 'rec-e'), el.rec.checked ? fx(100 * per(28, 36), 1) + ' pts' : '–');
      set(q(root, 'alarm'), S.first === null ? 'none' : 'quarter ' + S.first); set(q(root, 'calm'), fx(100 * per(16, 20), 1) + ' pts');
      set(q(root, 'note'), el.check.value === 'random' ? (m === 'regression' ? 'Random quarters held out (publication lags ignored): ' + fx(100 * Wd.rnd, 1) + ' pts. Rolling origin: ' + fx(100 * S.all, 1) + ' pts.' : 'The random check only applies to the regression here; persistence and anchor-and-update are scored with a rolling origin.')
        : 'Rolling origin: at each quarter, only what was published by then. The benchmark of a year appears a year after it ends.');
      var marks = []; if (el.tech.checked) marks.push({ x: 20, label: 'digital payments', color: C.cyan }); if (el.rec.checked) marks.push({ x: 28, label: 'recession', color: C.orange }); if (el.reform.checked) marks.push({ x: 36, label: 'e-invoicing', color: C.green });
      S.rel.forEach(function (r) { if (r.alarm) marks.push({ x: r.q, label: '', color: '#b91c1c' }); });
      render(q(root, 'chart'), function (Wd2, H) { return xyChart({ id: 51, x: [16, 47], y: [0, 0.08], xLabel: 'quarter', yLabel: 'nowcast error (share)', marks: marks,
        polys: [{ pts: Wd.per.byT.map(function (v, i) { return [16 + i, v]; }), color: C.grey, width: 1.8, dash: '6 4' }, { pts: S.byT.map(function (v, i) { return [16 + i, v]; }), color: C.blue, width: 2.6 }] }, Wd2, H); });
      set(q(root, 'status'), NAME[m] + (m === 'persistence' ? '' : ', last ' + (win > 20 ? 'all' : win) + (win > 20 ? ' history' : ' years')) + ' · grey dashed: persistence · red marks: drift alarms (last year’s nowcasts scored when a benchmark is published).');
      var all3 = el.tech.checked && el.rec.checked && el.reform.checked;
      mark(0, el.rec.checked && per(16, 20) < 0.02 && per(28, 36) > 0.04);
      mark(1, el.check.value === 'random' && m === 'regression' && S.all - Wd.rnd >= 0.005);
      mark(2, !el.tech.checked && !el.rec.checked && !el.reform.checked && S.first === null);
      mark(3, all3 && S.all < 0.017);
      root.setAttribute('data-desk', [m, win, el.check.value, el.tech.checked ? 1 : 0, el.rec.checked ? 1 : 0, el.reform.checked ? 1 : 0, S.all.toFixed(4), per(28, 36).toFixed(4), S.first, Wd.rnd.toFixed(4)].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.model, el.win, el.check, el.tech, el.rec, el.reform].forEach(function (x) { on(x, 'change', run); });
    run();
  }

  function mapLab(root) {
    var el = { layer: q(root, 'layer'), how: q(root, 'how'), k: q(root, 'k'), lam: q(root, 'lam'), cut: q(root, 'cut'), shuf: q(root, 'shuf') }, mark = marker(root), D = atlasWorld(), sawHigh = false;
    var truth = D.map(function (d) { return d.s; }), shuf = shuffled(truth, 16), LC = { HH: '#d55e00', LL: '#0891b2', HL: '#d97706', LH: '#93c5fd', ns: '#e2e8f0' }, lisaCache = {};
    function heatC(v) { var u = Math.min(1, Math.max(0, (v - 8) / 30)), A = [[30, 58, 138], [37, 99, 235], [8, 145, 178], [217, 119, 6], [213, 94, 0]], k = Math.min(3, Math.floor(u * 4)), f = u * 4 - k; return 'rgb(' + A[k].map(function (x, j) { return Math.round(x + (A[k + 1][j] - x) * f); }).join(',') + ')'; }
    function hexes(vals, color, W, H) {
      var sc = Math.min((W - 20) / 16.5, (H - 30) / 8.6), r = sc / Math.sqrt(3) * 0.98, ox = (W - 16.5 * sc) / 2 + sc / 2, oy = 10 + r, out = [];
      D.forEach(function (d, i) { var cx = ox + d.x * sc, cy = oy + (7.8 - d.y) * sc, p = [90, 30, -30, -90, -150, 150].map(function (a) { return (cx + r * Math.cos(a * Math.PI / 180)).toFixed(1) + ',' + (cy - r * Math.sin(a * Math.PI / 180)).toFixed(1); }).join(' ');
        out.push('<polygon points="' + p + '" fill="' + color(vals[i], i) + '" stroke="#fff" stroke-width="1"/>'); if (d.surv) out.push('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r * 0.32).toFixed(1) + '" fill="none" stroke="#111827" stroke-width="1.4"/>'); });
      var rx = ox + 5.62 * sc; out.push('<line x1="' + rx.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y1="' + (oy - r) + '" y2="' + (oy + 7.8 * sc + r).toFixed(1) + '" stroke="#0891b2" stroke-width="2.4" stroke-dasharray="5 4"/>');
      return out.join('');
    }
    function run() {
      set(q(root, 'k-out'), el.k.value); set(q(root, 'lam-out'), (+el.lam.value).toFixed(1));
      var base = el.shuf.checked ? shuf : truth, T = moranTest(D, base, 199), E = atlasEstimate(D, el.how.value, +el.k.value, +el.lam.value, el.cut.checked), key = el.shuf.checked ? 's' : 't';
      if (!lisaCache[key]) lisaCache[key] = lisa(D, base, 99);
      var L2 = lisaCache[key], nsig = L2.filter(function (x) { return x !== 'ns'; }).length;
      set(q(root, 'moran'), fx(T.I, 2) + ' (p ' + fx(T.p, 3) + ')'); set(q(root, 'err'), fx(E.err, 1) + ' pts'); set(q(root, 'step'), fx(E.step, 1) + ' (true ' + fx(E.stepTrue, 1) + ')'); set(q(root, 'nsig'), String(nsig));
      var lay = el.layer.value;
      render(q(root, 'chart'), function (W, H) { return lay === 'clusters' ? hexes(L2, function (v) { return LC[v]; }, W, H) : hexes(lay === 'truth' ? base : E.est, heatC, W, H); });
      set(q(root, 'status'), (lay === 'clusters' ? 'Local clusters (orange: high among high, teal: low among low, amber/blue: outliers, grey: not significant at 5%)' : lay === 'truth' ? 'The invented truth' : 'Estimate from the 40 surveys (rings)') + (el.shuf.checked ? ' · values shuffled across the map' : '') + ' · dashed line: the river.');
      if (!el.shuf.checked && T.I > 0.8) sawHigh = true;
      mark(0, sawHigh && el.shuf.checked && Math.abs(T.I) < 0.05);
      mark(1, E.err < 2.3);
      mark(2, +el.lam.value >= 1 && E.step >= 7);
      mark(3, el.shuf.checked && lay === 'clusters' && nsig >= 3);
      root.setAttribute('data-map', [lay, el.how.value, el.k.value, el.lam.value, el.cut.checked ? 1 : 0, el.shuf.checked ? 1 : 0, T.I.toFixed(3), E.err.toFixed(3), E.step.toFixed(2), nsig].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.layer, el.how, el.cut, el.shuf, el.k, el.lam].forEach(function (x) { on(x, 'change', run); }); [el.k, el.lam].forEach(function (x) { on(x, 'input', function () { set(q(root, 'k-out'), el.k.value); set(q(root, 'lam-out'), (+el.lam.value).toFixed(1)); }); });
    run();
  }

  function townLab(root) {
    var el = { audit: q(root, 'audit'), peer: q(root, 'peer'), het: q(root, 'het'), rec: q(root, 'rec'), einv: q(root, 'einv'), fb: q(root, 'fb') }, mark = marker(root);
    function run() {
      var o = { audit: +el.audit.value / 100, peer: +el.peer.value, hetero: +el.het.value, recession: el.rec.checked, einv: el.einv.checked, feedback: el.fb.checked };
      set(q(root, 'audit-out'), el.audit.value + '%'); set(q(root, 'peer-out'), (+el.peer.value).toFixed(1)); set(q(root, 'het-out'), (+el.het.value).toFixed(2));
      var R = townRun(o), twin = (o.recession || o.einv) ? townRun(Object.assign({}, o, { recession: false, einv: false })) : R;
      var Hi = townRun(Object.assign({}, o, { recession: false, einv: false, start: 0.6 })), Lo = townRun(Object.assign({}, o, { recession: false, einv: false, start: 0.02 }));
      var gap = Hi.end - Lo.end, linger = o.recession ? R.path[27] - twin.path[27] : NaN, smallDrop = o.einv ? twin.smallEnd - R.smallEnd : NaN;
      set(q(root, 'hidden'), pc(R.end, 1)); set(q(root, 'honest'), pc(R.fin.honest, 0)); set(q(root, 'top'), pc(R.fin.top10, 0)); set(q(root, 'gap'), (gap >= 0 ? '+' : '') + fx(100 * gap, 1) + ' pts');
      var notes = []; if (o.recession) notes.push('two years after the recession: ' + (linger >= 0 ? '+' : '') + fx(100 * linger, 1) + ' pts vs no recession');
      if (o.einv) notes.push('small firms (not reformed): ' + pc(twin.smallEnd, 0) + ' → ' + pc(R.smallEnd, 0));
      set(q(root, 'note'), notes.length ? notes.join(' · ') : 'Switch on the recession or e-invoicing to compare with the same town without them.');
      var marks = []; if (o.recession) { marks.push({ x: 12, label: 'recession', color: C.orange }); marks.push({ x: 20, label: '', color: C.grey }); } if (o.einv) marks.push({ x: 20, label: 'e-invoicing', color: C.green });
      render(q(root, 'chart'), function (W, H) { return xyChart({ id: 71, x: [0, 39], y: [0, 0.55], xLabel: 'quarter', yLabel: 'hidden share of output', marks: marks,
        polys: [{ pts: Hi.path.map(function (v, i) { return [i, v]; }), color: C.orange, width: 1.6, dash: '6 4' }, { pts: Lo.path.map(function (v, i) { return [i, v]; }), color: C.cyan, width: 1.6, dash: '6 4' },
                (o.recession || o.einv) ? { pts: twin.path.map(function (v, i) { return [i, v]; }), color: C.grey, width: 1.6 } : null, { pts: R.path.map(function (v, i) { return [i, v]; }), color: C.blue, width: 2.8 }].filter(Boolean) }, W, H); });
      set(q(root, 'status'), 'Blue: your town · dashed: the same town started with hiding common (orange) or rare (teal), no shocks' + ((o.recession || o.einv) ? ' · grey: no recession, no reform' : '') + '.');
      mark(0, gap >= 0.05);
      mark(1, o.recession && linger >= 0.01);
      mark(2, o.einv && smallDrop >= 0.08);
      mark(3, R.end < 0.15 && o.audit <= 0.08);
      root.setAttribute('data-town', [o.audit, o.peer, o.hetero, o.recession ? 1 : 0, o.einv ? 1 : 0, o.feedback ? 1 : 0, R.end.toFixed(4), gap.toFixed(4), isFinite(linger) ? linger.toFixed(4) : '-', isFinite(smallDrop) ? smallDrop.toFixed(4) : '-'].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.audit, el.peer, el.het, el.rec, el.einv, el.fb].forEach(function (x) { on(x, 'change', run); });
    [el.audit, el.peer, el.het].forEach(function (x) { on(x, 'input', function () { set(q(root, 'audit-out'), el.audit.value + '%'); set(q(root, 'peer-out'), (+el.peer.value).toFixed(1)); set(q(root, 'het-out'), (+el.het.value).toFixed(2)); }); });
    run();
  }

  function policyLab(root) {
    var el = { a: q(root, 'a'), d: q(root, 'd'), f: q(root, 'f'), pilot: q(root, 'pilot'), pin: q(root, 'pin') }, mark = marker(root), cache = {};
    function futures() { var k = el.pilot.checked ? el.pin.value : 'u'; if (!cache[k]) { var F = policyFutures(300, el.pilot.checked ? +el.pin.value / 1000 : null); cache[k] = { F: F, G: policyGrid(F), P: {} }; Object.keys(PACKS).forEach(function (n) { cache[k].P[n] = policyRun(PACKS[n], F); }); } return cache[k]; }
    function run() {
      var p = [+el.a.value / 10, +el.d.value / 10, +el.f.value / 20], cost = policyCost(p), ok = cost <= 1.0001, Fu = futures(), R = policyRun(p, Fu.F);
      set(q(root, 'a-out'), p[0].toFixed(1)); set(q(root, 'd-out'), p[1].toFixed(1)); set(q(root, 'f-out'), p[2].toFixed(2)); set(q(root, 'pin-out'), (+el.pin.value / 1000).toFixed(3));
      q(root, 'pin').disabled = !el.pilot.checked;
      set(q(root, 'mean'), pc(R.mean, 1)); set(q(root, 'p90'), pc(R.p90, 1)); set(q(root, 'pt'), pc(R.pT, 0)); set(q(root, 'cost'), cost.toFixed(2) + (ok ? '' : ' (over budget)'));
      var dominated = Fu.G.some(function (g) { return g.cost <= cost + 1e-9 && g.mean <= R.mean + 1e-9 && (g.cost < cost - 1e-9 || g.mean < R.mean - 0.0005); });
      var best = function (key, max) { return Object.keys(PACKS).sort(function (x, y) { return max ? Fu.P[y][key] - Fu.P[x][key] : Fu.P[x][key] - Fu.P[y][key]; })[0]; };
      set(q(root, 'note'), (ok ? (dominated ? 'Another affordable mix is cheaper and leaves less hidden: yours is not on the front.' : 'On the front: no affordable mix is both cheaper and better on average.') : 'Over budget: cost must be at most 1.0.')
        + ' Among the four named packages: best on average ' + best('mean') + ', best in the worst tenth ' + best('p90') + ', most often below 22% ' + best('pT', true) + '.');
      var G = Fu.G, FR = G.filter(function (g) { return g.front; }).sort(function (x, y) { return x.cost - y.cost; });
      render(q(root, 'chart'), function (W, H) { return xyChart({ id: 81, x: [0, 1], y: [0.1, 0.34], xLabel: 'yearly cost (share of the budget)', yLabel: 'average hidden share after 10 years',
        dots: G.filter(function (g) { return !g.front; }).map(function (g) { return { x: g.cost, y: g.mean, color: '#cbd5e1', r: 2.6 }; }).concat(FR.map(function (g) { return { x: g.cost, y: g.mean, color: C.amber, r: 3.2 }; })).concat([{ x: Math.min(1, cost), y: Math.min(0.34, R.mean), color: ok ? C.blue : '#b91c1c', r: 6 }]),
        polys: [{ pts: FR.map(function (g) { return [g.cost, g.mean]; }), color: C.amber, width: 1.8 }] }, W, H); });
      set(q(root, 'status'), '300 futures, each with its own response coefficients, recessions and noise · amber: the Pareto front of 145 affordable mixes · blue: your mix.');
      var sq = Fu.P['status quo'];
      mark(0, ok && R.mean < sq.mean && R.p90 < sq.p90);
      mark(1, ok && R.pT >= 0.85);
      mark(2, ok && !dominated && cost < 0.5 && cost > 0 && !(p[0] === 0.2 && p[1] === 0 && p[2] === 0));
      mark(3, el.pilot.checked && +el.pin.value <= 5 && Fu.P['services first'].mean > Fu.P['enforcement first'].mean);
      root.setAttribute('data-policy', [p.join('/'), cost.toFixed(3), R.mean.toFixed(4), R.p90.toFixed(4), R.pT.toFixed(3), dominated ? 0 : 1, el.pilot.checked ? el.pin.value : '-'].join(':'));
      root.setAttribute('data-ready', '1');
    }
    [el.a, el.d, el.f, el.pin].forEach(function (x) { on(x, 'input', run); }); on(el.pilot, 'change', run);
    run();
  }

  function studyLab(root) {
    var keys = ['task', 'audience', 'output', 'unit', 'comparator', 'horizon', 'validation', 'denominator', 'uncertainty'], el = {}, mark = marker(root), FW = null;
    keys.concat(['limits', 'code', 'prereg', 'specs', 'nested']).forEach(function (k) { el[k] = q(root, k); });
    function card() {
      var s = {}; keys.forEach(function (k) { s[k] = el[k].value; }); s.limits = el.limits.checked; s.code = el.code.checked; s.prereg = el.prereg.checked;
      var flags = STUDY_RULES.map(function (f) { return f(s); }).filter(Boolean), ul = q(root, 'flags');
      ul.innerHTML = flags.length ? flags.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') : '<li class="ok">No flags: the card is complete and consistent.</li>';
      set(q(root, 'score'), (STUDY_RULES.length - flags.length) + ' / ' + STUDY_RULES.length);
      mark(0, flags.length === 0);
      mark(1, flags.some(function (f) { return f.indexOf('Level mismatch') === 0; }));
      root.setAttribute('data-card', [s.task, s.output, s.unit, s.validation, flags.length].join(':'));
    }
    function fork() {
      if (!FW) FW = forkWorld();
      var K = +el.specs.value, R = forkRun(FW, K, el.nested.checked); set(q(root, 'specs-out'), String(K));
      set(q(root, 'best'), fx(R.best, 2)); set(q(root, 'fresh'), fx(R.fresh, 2)); set(q(root, 'nest'), R.nested === null ? '–' : fx(R.nested, 2));
      set(q(root, 'fnote'), 'Winner: ' + R.cols.length + ' predictors, ' + R.real + ' of the 2 real ones. Errors in points; fresh = 2,000 new countries from the same invented world.');
      mark(2, K >= 300 && R.fresh - R.best >= 0.3);
      mark(3, el.nested.checked && R.nested !== null && Math.abs(R.nested - R.fresh) <= 0.2);
      root.setAttribute('data-fork', [K, el.nested.checked ? 1 : 0, R.best.toFixed(3), R.fresh.toFixed(3), R.nested === null ? '-' : R.nested.toFixed(3)].join(':'));
    }
    keys.forEach(function (k) { on(el[k], 'change', card); }); ['limits', 'code', 'prereg'].forEach(function (k) { on(el[k], 'change', card); });
    on(el.specs, 'change', fork); on(el.specs, 'input', function () { set(q(root, 'specs-out'), el.specs.value); }); on(el.nested, 'change', fork);
    card(); fork(); set(q(root, 'status'), 'The card checks itself as you change it; the selection experiment runs in your browser.'); root.setAttribute('data-ready', '1');
  }

  // ------------------------------------------------------------------ start the labs on this page
  window.NoeLabs = { rng: rng, gauss: gauss, ols: ols, tree: tree, knn: knn, obsCalc: obsCalc, LB: LB, countriesWorld: countriesWorld, gameRun: gameRun, confSweep: confSweep, archWorld: archWorld, deskWorld: deskWorld, deskRun: deskRun, deskScore: deskScore, deskRandom: deskRandom, atlasWorld: atlasWorld, moran: moran, lisa: lisa, atlasEstimate: atlasEstimate, townRun: townRun, policyFutures: policyFutures, policyRun: policyRun, policyGrid: policyGrid, forkWorld: forkWorld, forkRun: forkRun, STUDY_RULES: STUDY_RULES };
  var LABS = { observers: observersLab, countries: countriesLab, audit: auditLab, estimate: estimateLab, nowcast: nowcastLab, map: mapLab, town: townLab, policy: policyLab, study: studyLab };
  document.querySelectorAll('[data-noex]').forEach(function (root) {
    var f = LABS[root.getAttribute('data-noex')];
    if (!f) return;
    try { f(root); } catch (e) { if (window.console) console.error('noe-labs (' + root.id + '):', e); }
  });
})();
