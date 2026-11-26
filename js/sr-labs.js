/* Interactive labs of the Symbolic Physical Laws Discovery course (symbolic-laws/module-NN/, made by tools/build_sr_course.py).
   One file; each lab starts only when its root element ([data-srx="..."]) is on the page.
   Markup: tools/templates/sr-lab-*.html. Styles: css/exploration-lab.css + css/rl-labs.css + css/epi-course.css.
   Everything runs in the browser; the data are simulated here, with made-up but plausible constants. */
(function () {
  'use strict';

  var C = { blue: '#2563eb', navy: '#1e3a8a', orange: '#d55e00', green: '#009e73', grey: '#94a3b8', amber: '#d97706', ink: '#111827', muted: '#64748b', purple: '#7c3aed', teal: '#0f766e' };
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

  // ------------------------------------------------------------------ Lab 1 · curve versus law (falling ball with quadratic drag; Kepler's third law)
  var G = 9.81, K2 = 0.12, TMAX = 3.5;
  var vLin = function (k) { return function (t) { return (G / k) * (1 - Math.exp(-k * t)); }; };
  var vQua = function (k) { var vt = Math.sqrt(G / k); return function (t) { return vt * Math.tanh(t * Math.sqrt(G * k)); }; };
  function fallData(seed, sigma) { var r = rng(seed), ts = [], vs = [], truth = vQua(K2); for (var i = 0; i <= 70; i++) { var t = i * 0.05; ts.push(t); vs.push(truth(t) + sigma * gauss(r)); } return { t: ts, v: vs }; }
  /* fit the three candidates to the readings with t <= win; returns models, constants and errors inside/after the window */
  function curveFit(D, win, deg) {
    var ti = [], vi = [], to = [], vo = [];
    D.t.forEach(function (t, i) { if (t <= win + 1e-9) { ti.push(t); vi.push(D.v[i]); } else { to.push(t); vo.push(D.v[i]); } });
    var sse = function (f) { var s = 0; for (var i = 0; i < ti.length; i++) { var e = f(ti[i]) - vi[i]; s += e * e; } return s; };
    var k1 = Math.exp(golden(function (lk) { return sse(vLin(Math.exp(lk))); }, Math.log(1e-3), Math.log(8)));
    var k2 = Math.exp(golden(function (lk) { return sse(vQua(Math.exp(lk))); }, Math.log(1e-3), Math.log(3)));
    var P = polyFit(ti, vi, Math.min(deg, Math.max(1, ti.length - 1)), TMAX), Lf = vLin(k1), Qf = vQua(k2);
    var out = { k1: k1, k2: k2, poly: P, lin: Lf, qua: Qf, n_in: ti.length, n_out: to.length };
    [['poly', P], ['lin', Lf], ['qua', Qf]].forEach(function (m) { out[m[0] + '_in'] = rmse(m[1], ti, vi); out[m[0] + '_out'] = rmse(m[1], to, vo); });
    var lo = Infinity, hi = -Infinity; for (var t = 0; t <= TMAX + 1e-9; t += 0.01) { var y = P(t); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    out.poly_min = lo; out.poly_max = hi;
    return out;
  }
  // Kepler: a [AU], T [years] for the classical planets and Uranus (standard values)
  var PLANETS = [['Mercury', 0.387, 0.241], ['Venus', 0.723, 0.615], ['Earth', 1.0, 1.0], ['Mars', 1.524, 1.881], ['Jupiter', 5.203, 11.862], ['Saturn', 9.537, 29.457], ['Uranus', 19.191, 84.011]];
  function keplerFit(deg) {
    var tr = PLANETS.slice(0, 6), U = PLANETS[6];
    var la = tr.map(function (p) { return Math.log(p[1]); }), lt = tr.map(function (p) { return Math.log(p[2]); });
    var pl = polyFit(la, lt, 1, 1), c = Math.exp(pl.coef[0]), p = pl.coef[1], law = function (a) { return c * Math.pow(a, p); };
    var P = polyFit(tr.map(function (q) { return q[1]; }), tr.map(function (q) { return q[2]; }), Math.min(deg, 5), 10);
    var relIn = function (f) { var m = 0; tr.forEach(function (q) { m = Math.max(m, Math.abs(f(q[1]) - q[2]) / q[2]); }); return m; };
    return { c: c, p: p, law: law, poly: P, lawU: law(U[1]), polyU: P(U[1]), lawErrU: Math.abs(law(U[1]) - U[2]) / U[2], polyErrU: Math.abs(P(U[1]) - U[2]) / U[2], lawIn: relIn(law), polyIn: relIn(P) };
  }

  function curveLab(root) {
    var el = { win: q(root, 'win'), deg: q(root, 'deg'), sig: q(root, 'sig'), kdeg: q(root, 'kdeg') }, seed = 203, done = [false, false, false, false];
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function run() {
      var win = +el.win.value, deg = +el.deg.value, sig = +el.sig.value;
      set(q(root, 'win-out'), win.toFixed(1) + ' s'); set(q(root, 'deg-out'), String(deg)); set(q(root, 'sig-out'), sig.toFixed(2) + ' m/s');
      var D = fallData(seed, sig), R = curveFit(D, win, deg);
      set(q(root, 'k1'), fx(R.k1, 3) + ' /s'); set(q(root, 'k2'), fx(R.k2, 3) + ' /m');
      set(q(root, 'pin'), fx(R.poly_in, 3)); set(q(root, 'pout'), R.n_out ? fx(R.poly_out, R.poly_out > 100 ? 0 : 2) : '–');
      set(q(root, 'lin'), fx(R.lin_in, 3)); set(q(root, 'lout'), R.n_out ? fx(R.lin_out, 2) : '–');
      set(q(root, 'qin'), fx(R.qua_in, 3)); set(q(root, 'qout'), R.n_out ? fx(R.qua_out, 2) : '–');
      var best = [['polynomial', R.poly_out], ['linear drag', R.lin_out], ['quadratic drag', R.qua_out]].filter(function (x) { return isFinite(x[1]); }).sort(function (a, b) { return a[1] - b[1]; });
      set(q(root, 'status'), R.n_out ? 'Fitted on ' + R.n_in + ' readings up to ' + win.toFixed(1) + ' s. Best after the window: ' + best[0][0] + '. Terminal speed of the quadratic law: ' + fx(Math.sqrt(G / R.k2), 1) + ' m/s; of the linear law: ' + fx(G / R.k1, 1) + ' m/s.' : 'The window covers all the data: nothing left to predict. Shorten it.');
      var ymax = Math.max(12, Math.ceil(Math.max.apply(null, D.v)) + 1);
      render(q(root, 'chart'), function (W, H) {
        return xyChart({ id: 1, x: [0, TMAX], y: [-2, ymax], xLabel: 't [s]', yLabel: 'v [m/s]', shade: [0, win],
          curves: [{ f: R.poly, color: C.orange, width: 2.6 }, { f: R.lin, color: C.grey, width: 2.4, dash: '7 5' }, { f: R.qua, color: C.blue, width: 2.8 }],
          dots: D.t.map(function (t, i) { return { x: t, y: D.v[i], hollow: t > win + 1e-9, color: C.ink, r: 2.6 }; }) }, W, H);
      });
      mark(0, win <= 1.0 + 1e-9 && R.n_out > 0 && R.poly_in < R.qua_in && R.poly_out > 10 * R.qua_out);
      mark(1, sig >= 0.1 - 1e-9 && Math.abs(R.k2 - K2) / K2 < 0.05);
      mark(2, R.poly_min < 0 || R.poly_max > 30);
      root.setAttribute('data-curve', [win.toFixed(1), deg, sig.toFixed(2), R.k1.toFixed(4), R.k2.toFixed(4), R.poly_in.toFixed(4), isFinite(R.poly_out) ? R.poly_out.toFixed(3) : 'na', R.qua_out.toFixed ? (isFinite(R.qua_out) ? R.qua_out.toFixed(4) : 'na') : 'na'].join(':'));
      kepler();
      root.setAttribute('data-ready', '1');
    }
    function kepler() {
      var d = +el.kdeg.value, K = keplerFit(d);
      set(q(root, 'kdeg-out'), String(d));
      set(q(root, 'kp'), fx(K.p, 3)); set(q(root, 'klaw'), fx(K.lawU, 1) + ' yr (' + fx(100 * K.lawErrU, 1) + '% off)'); set(q(root, 'kpoly'), fx(K.polyU, 1) + ' yr (' + fx(100 * K.polyErrU, 0) + '% off)');
      set(q(root, 'kin'), 'worst miss on the six planets: law ' + fx(100 * K.lawIn, 1) + '%, polynomial ' + fx(100 * K.polyIn, 1) + '%');
      render(q(root, 'kchart'), function (W, H) {
        return xyChart({ id: 2, x: [0.3, 25], y: [0.15, 140], log: { x: true, y: true }, xLabel: 'distance a [AU] (log scale)', yLabel: 'period T [years] (log)',
          curves: [{ f: K.poly, color: C.orange, width: 2.4 }, { f: K.law, color: C.blue, width: 2.6 }],
          dots: PLANETS.map(function (p, i) { return { x: p[1], y: p[2], hollow: i === 6, color: i === 6 ? C.amber : C.ink, r: i === 6 ? 5 : 3.6, label: i >= 4 ? p[0] : '' }; }) }, W, H);
      });
      mark(3, K.polyIn < 0.01 && K.polyErrU > 0.2 && K.lawErrU < 0.02);
      root.setAttribute('data-kepler', [d, K.p.toFixed(4), K.lawErrU.toFixed(4), K.polyErrU.toFixed(4), K.polyIn.toFixed(5)].join(':'));
    }
    ['win', 'deg', 'sig'].forEach(function (k) { on(el[k], 'input', run); });
    on(el.kdeg, 'input', kepler);
    on(q(root, 'newdata'), 'click', function () { seed = (seed * 1103515245 + 12345) % 2147483647; run(); });
    run();
  }

  // ------------------------------------------------------------------ lab 2 · expression workbench (Module 2)
  // A small parser turns typed formulas into trees; everything else (prefix, postfix, sharing, units, equivalence, counts) is computed from the tree.
  var ARITY = { '+': 2, '-': 2, '*': 2, '/': 2, '^': 2, neg: 1, sin: 1, cos: 1, exp: 1, log: 1, sqrt: 1, abs: 1 };
  var FUNS = { sin: 1, cos: 1, exp: 1, log: 1, sqrt: 1, abs: 1 };
  var WT = { '+': 1, '-': 1, '*': 1, neg: 1, '/': 2, sqrt: 2, abs: 2, '^': 3, sin: 3, cos: 3, exp: 3, log: 3 };   // leaves weigh 1
  var SHOW = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^', neg: 'neg' };
  function tokens(src) {
    var out = [], i = 0, m, re = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)|([A-Za-z_Ͱ-Ͽ][A-Za-z0-9_Ͱ-Ͽ]*)|([-+*/^(),·×÷−]))/y;
    src = String(src);
    while (i < src.length) {
      if (/^\s*$/.test(src.slice(i))) break;
      re.lastIndex = i; m = re.exec(src);
      if (!m) throw new Error('unexpected “' + src.slice(i).trim().charAt(0) + '” at position ' + (i + 1));
      i = re.lastIndex;
      if (m[1] !== undefined) out.push({ t: 'n', v: parseFloat(m[1]) });
      else if (m[2] !== undefined) out.push({ t: 'id', v: m[2] });
      else out.push({ t: 'op', v: { '·': '*', '×': '*', '÷': '/', '−': '-' }[m[3]] || m[3] });
    }
    return out;
  }
  function parse(src) {
    var T = tokens(src), k = 0;
    function peek(v) { return T[k] && T[k].t === 'op' && T[k].v === v; }
    function need(v) { if (!peek(v)) throw new Error('expected “' + v + '”' + (T[k] ? ' before “' + T[k].v + '”' : ' at the end')); k++; }
    function expr() { var a = peek('-') ? (k++, { op: 'neg', k: [term()] }) : term(); while (peek('+') || peek('-')) { var o = T[k++].v; a = { op: o, k: [a, term()] }; } return a; }
    function term() { var a = unary(); while (peek('*') || peek('/')) { var o = T[k++].v; a = { op: o, k: [a, unary()] }; } return a; }
    function unary() { if (peek('-')) { k++; return { op: 'neg', k: [unary()] }; } if (peek('+')) { k++; return unary(); } return power(); }
    function power() { var a = atom(); if (peek('^')) { k++; return { op: '^', k: [a, unary()] }; } return a; }
    function atom() {
      var tk = T[k];
      if (!tk) throw new Error('the formula ends too early');
      if (tk.t === 'n') { k++; return { n: tk.v }; }
      if (tk.t === 'id') {
        k++;
        if (FUNS[tk.v]) { need('('); var a = expr(); need(')'); return { op: tk.v, k: [a] }; }
        if (tk.v === 'pi' || tk.v === 'π') return { n: Math.PI, s: 'π' };
        if (peek('(')) throw new Error('unknown function “' + tk.v + '” (use sin, cos, exp, log, sqrt, abs)');
        return { v: tk.v };
      }
      if (peek('(')) { k++; var e = expr(); need(')'); return e; }
      throw new Error('unexpected “' + tk.v + '”');
    }
    var root = expr();
    if (k < T.length) throw new Error('unexpected “' + T[k].v + '”');
    return root;
  }
  function numStr(x) { return x === Math.PI ? 'π' : String(+x.toPrecision(4)); }
  function leafStr(n) { return n.v !== undefined ? n.v : n.s || numStr(n.n); }
  function label(n) { return n.op ? (SHOW[n.op] || n.op) : leafStr(n); }
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };
  function fmt(n, pp, right) {
    if (!n.op) return leafStr(n);
    if (FUNS[n.op]) return n.op + '(' + fmt(n.k[0], 0) + ')';
    var p = PREC[n.op], s;
    if (n.op === 'neg') s = '−' + fmt(n.k[0], 3);
    else if (n.op === '^') s = fmt(n.k[0], 5) + '^' + fmt(n.k[1], 4);
    else s = fmt(n.k[0], p) + ' ' + SHOW[n.op] + ' ' + fmt(n.k[1], p + (n.op === '-' || n.op === '/' ? 1 : 0));
    return p < pp || (right && p === pp) ? '(' + s + ')' : s;
  }
  function walk(n, f, d) { d = d || 0; f(n, d); (n.k || []).forEach(function (c) { walk(c, f, d + 1); }); }
  function prefix(n) { var o = []; walk(n, function (m) { o.push(label(m)); }); return o; }
  function postfix(n) { var o = []; (function go(m) { (m.k || []).forEach(go); o.push(label(m)); })(n); return o; }
  function key(n) { return n.op ? n.op + '(' + n.k.map(key).join(',') + ')' : n.v !== undefined ? 'v:' + n.v : 'n:' + n.n; }
  function stats(n) {
    var nodes = 0, depth = 0, w = 0, keys = {}, vars = {};
    walk(n, function (m, d) { nodes++; depth = Math.max(depth, d); w += m.op ? WT[m.op] : 1; keys[key(m)] = 1; if (m.v !== undefined) vars[m.v] = 1; });
    return { nodes: nodes, depth: depth, weighted: w, dag: Object.keys(keys).length, vars: Object.keys(vars).sort() };
  }
  function ev(n, env) {
    if (n.n !== undefined) return n.n;
    if (n.v !== undefined) return env[n.v];
    var a = ev(n.k[0], env), b = n.k[1] ? ev(n.k[1], env) : 0;
    switch (n.op) {
      case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; case '^': return Math.pow(a, b);
      case 'neg': return -a; case 'sin': return Math.sin(a); case 'cos': return Math.cos(a); case 'exp': return Math.exp(a);
      case 'log': return a > 0 ? Math.log(a) : NaN; case 'sqrt': return a >= 0 ? Math.sqrt(a) : NaN; case 'abs': return Math.abs(a);
    }
    return NaN;
  }
  /** numerical equivalence on random points: {n: points where both are defined, maxRel, at} */
  function compare(A, B, lo, hi, seed) {
    var vars = {}, r = rng(seed || 7), best = { n: 0, maxRel: 0, at: null };
    walk(A, function (m) { if (m.v !== undefined) vars[m.v] = 1; }); walk(B, function (m) { if (m.v !== undefined) vars[m.v] = 1; });
    var names = Object.keys(vars);
    for (var i = 0; i < 400; i++) {
      var env = {}; names.forEach(function (v) { env[v] = lo + (hi - lo) * r(); });
      var fa = ev(A, env), fb = ev(B, env);
      if (!isFinite(fa) || !isFinite(fb)) continue;
      best.n++; var rel = Math.abs(fa - fb) / (1 + Math.abs(fa) + Math.abs(fb));
      if (rel > best.maxRel) { best.maxRel = rel; best.at = { env: env, fa: fa, fb: fb }; }
    }
    return best;
  }
  // units: vectors of powers of [L, T, M, Θ]; null = a free constant that can take any unit
  var UNITS = [['free', 'free constant (any unit)', null], ['1', 'pure number', [0, 0, 0, 0]], ['L', 'length L', [1, 0, 0, 0]], ['T', 'time T', [0, 1, 0, 0]], ['L/T', 'speed L/T', [1, -1, 0, 0]],
    ['L/T²', 'acceleration L/T²', [1, -2, 0, 0]], ['1/T', 'rate 1/T', [0, -1, 0, 0]], ['1/T²', '1/T²', [0, -2, 0, 0]], ['M', 'mass M', [0, 0, 1, 0]], ['Θ', 'temperature Θ', [0, 0, 0, 1]], ['Θ/T', 'Θ/T', [0, -1, 0, 1]]];
  var UNIT_OF = {}; UNITS.forEach(function (u) { UNIT_OF[u[0]] = u[2]; });
  function defaultUnit(v) {
    return { x: 'L', y: 'L', z: 'L', h: 'L', L: 'L', t: 'T', v: 'L/T', g: 'L/T²', T: 'Θ', Te: 'Θ', θ: '1', theta: '1', ω: '1/T', w: '1/T', m: 'M' }[v] || 'free';
  }
  function unitStr(u) {
    if (u === null) return 'any (a free constant sets it)';
    var nm = ['L', 'T', 'M', 'Θ'], up = [], dn = [];
    u.forEach(function (e, i) { if (!e) return; var p = Math.abs(e), s = nm[i] + (p === 1 ? '' : p === 2 ? '²' : p === 3 ? '³' : p === 0.5 ? '^½' : '^' + p); (e > 0 ? up : dn).push(s); });
    if (!up.length && !dn.length) return '1 (pure number)';
    return (up.length ? up.join('·') : '1') + (dn.length ? '/' + (dn.length > 1 ? '(' + dn.join('·') + ')' : dn[0]) : '');
  }
  function sameU(a, b) { for (var i = 0; i < 4; i++) if (Math.abs(a[i] - b[i]) > 1e-9) return false; return true; }
  function units(n, U) {
    if (n.n !== undefined) return [0, 0, 0, 0];
    if (n.v !== undefined) return U[n.v] === undefined ? null : U[n.v];
    var a = units(n.k[0], U), b = n.k[1] ? units(n.k[1], U) : null, z = [0, 0, 0, 0];
    function bad(msg) { var e = new Error(msg); e.node = n; throw e; }
    switch (n.op) {
      case '+': case '-':
        if (a && b && !sameU(a, b)) bad('“' + fmt(n, 0) + '” adds [' + unitStr(a) + '] and [' + unitStr(b) + ']');
        return a || b;
      case '*': return a && b ? a.map(function (x, i) { return x + b[i]; }) : null;
      case '/': return a && b ? a.map(function (x, i) { return x - b[i]; }) : null;
      case '^':
        if (n.k[1].n !== undefined) return a ? a.map(function (x) { return x * n.k[1].n; }) : null;
        if (b && !sameU(b, z)) bad('the exponent in “' + fmt(n, 0) + '” is not a pure number');
        if (a && !sameU(a, z)) bad('“' + fmt(n, 0) + '”: a variable exponent needs a pure-number base');
        return z;
      case 'neg': case 'abs': return a;
      case 'sqrt': return a ? a.map(function (x) { return x / 2; }) : null;
      default:
        if (a && !sameU(a, z)) bad(n.op + '(…) needs a pure number inside, got [' + unitStr(a) + ']');
        return z;
    }
  }
  /** the units the free constants must carry: top-down from a wanted unit (the target, or a pure number inside sin, exp, log). out[name] = unit vector */
  function inferFree(n, want, U, out) {
    var z = [0, 0, 0, 0], add = function (p, q2, s) { return p.map(function (x, i) { return x + s * q2[i]; }); }, safe = function (m) { try { return units(m, U); } catch (e) { return undefined; } };
    if (n.n !== undefined) return;
    if (n.v !== undefined) { if (U[n.v] === null && want) { if (out[n.v] && !sameU(out[n.v], want)) out[n.v + ' (conflict)'] = want; else out[n.v] = want; } return; }
    var a = n.k[0], b = n.k[1];
    switch (n.op) {
      case '+': case '-': inferFree(a, want, U, out); inferFree(b, want, U, out); return;
      case 'neg': case 'abs': inferFree(a, want, U, out); return;
      case 'sqrt': inferFree(a, want ? want.map(function (x) { return 2 * x; }) : undefined, U, out); return;
      case '^': if (b.n !== undefined) inferFree(a, want ? want.map(function (x) { return x / b.n; }) : undefined, U, out); else { inferFree(a, z, U, out); inferFree(b, z, U, out); } return;
      case '*': case '/':
        var ua = safe(a), ub = safe(b);
        if (n.op === '*') { inferFree(a, want && ub ? add(want, ub, -1) : undefined, U, out); inferFree(b, want && ua ? add(want, ua, -1) : undefined, U, out); }
        else { inferFree(a, want && ub ? add(want, ub, 1) : undefined, U, out); inferFree(b, want && ua ? add(ua, want, -1) : undefined, U, out); }
        return;
      default: inferFree(a, z, U, out);
    }
  }
  /** exact counts for the tiny language of video 4: operators + − × ÷, leaves x [L], t [T], v [L/T], c [1] */
  function unitCount(nmax) {
    var leaves = [[1, 0], [0, 1], [1, -1], [0, 0]], cnt = [{}], rows = [];
    leaves.forEach(function (d) { var kk = d.join(','); cnt[0][kk] = (cnt[0][kk] || 0) + 1; });
    for (var n = 1; n <= nmax; n++) {
      var c = {};
      for (var i = 0; i < n; i++) {
        var A = cnt[i], B = cnt[n - 1 - i];
        Object.keys(A).forEach(function (ka) { Object.keys(B).forEach(function (kb) {
          var w = A[ka] * B[kb], da = ka.split(',').map(Number), db = kb.split(',').map(Number);
          if (ka === kb) c[ka] = (c[ka] || 0) + 2 * w;
          var km = (da[0] + db[0]) + ',' + (da[1] + db[1]), kd = (da[0] - db[0]) + ',' + (da[1] - db[1]);
          c[km] = (c[km] || 0) + w; c[kd] = (c[kd] || 0) + w;
        }); });
      }
      cnt.push(c);
      var cat = 1; for (var j = 0; j < n; j++) cat = cat * 2 * (2 * j + 1) / (j + 2);
      var total = Math.round(cat) * Math.pow(4, n) * Math.pow(4, n + 1), valid = 0; Object.keys(c).forEach(function (kk) { valid += c[kk]; });
      rows.push({ n: n, total: total, valid: valid, speed: c['1,-1'] || 0 });
    }
    return rows;
  }
  function randomTree(r, vars, depth) {
    var leaves = vars.concat(['1', '2']);
    if (depth <= 0 || r() < 0.35) { var s = leaves[Math.floor(r() * leaves.length)]; return /^\d/.test(s) ? { n: +s } : { v: s }; }
    var ops = ['+', '-', '*', '/', 'sin', 'exp'], o = ops[Math.floor(r() * ops.length)];
    return ARITY[o] === 1 ? { op: o, k: [randomTree(r, vars, depth - 1)] } : { op: o, k: [randomTree(r, vars, depth - 1), randomTree(r, vars, depth - 1)] };
  }
  function mutate(root, r) {
    var all = []; walk(root, function (m) { all.push(m); });
    var target = all[Math.floor(r() * all.length)], vars = stats(root).vars;
    var fresh = randomTree(r, vars.length ? vars : ['x'], 2);
    function copy(m) { if (m === target) return fresh; return m.op ? { op: m.op, k: m.k.map(copy) } : m.n !== undefined ? { n: m.n, s: m.s } : { v: m.v }; }
    return { tree: copy(root), old: fmt(target, 0), fresh: fmt(fresh, 0) };
  }
  function treeSvg(root, W, H, hiKey) {
    var leaf = 0, pos = [], depth = 0;
    (function lay(m, d) { depth = Math.max(depth, d); if (!m.k) { m._x = leaf++; } else { m.k.forEach(function (c) { lay(c, d + 1); }); m._x = (m.k[0]._x + m.k[m.k.length - 1]._x) / 2; } m._d = d; })(root, 0);
    var r = Math.max(11, Math.min(17, (W - 40) / Math.max(1, leaf) / 2.4)), dx = Math.min(64, (W - 40) / Math.max(1, leaf)), dy = Math.min(64, (H - 2 * r - 16) / Math.max(1, depth));
    var x0 = W / 2 - (leaf - 1) * dx / 2, out = '';
    walk(root, function (m) { m._px = x0 + m._x * dx; m._py = r + 8 + m._d * dy; pos.push(m); });
    pos.forEach(function (m) { (m.k || []).forEach(function (c) { out += '<line x1="' + m._px.toFixed(1) + '" y1="' + m._py.toFixed(1) + '" x2="' + c._px.toFixed(1) + '" y2="' + c._py.toFixed(1) + '" stroke="' + C.grey + '" stroke-width="1.6"/>'; }); });
    pos.forEach(function (m) {
      var hi = hiKey && key(m) === hiKey, col = hi ? C.orange : m.op ? C.navy : C.blue, s = label(m);
      out += m.op ? '<circle cx="' + m._px.toFixed(1) + '" cy="' + m._py.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#fff" stroke="' + col + '" stroke-width="' + (hi ? 2.6 : 1.8) + '"/>'
        : '<rect x="' + (m._px - r).toFixed(1) + '" y="' + (m._py - r).toFixed(1) + '" width="' + (2 * r).toFixed(1) + '" height="' + (2 * r).toFixed(1) + '" rx="4" fill="#eff6ff" stroke="' + col + '" stroke-width="1.6"/>';
      out += txt(m._px, m._py + 4, s, { size: s.length > 2 ? 9.5 : 12, fill: C.ink, weight: 700 });
    });
    return out;
  }
  var PRESETS = ['c*(Te - T) + q*sin(w*t)', '(x - 2)*y', 'exp(-t)*cos(t) + exp(-t)', 'a*x/(b + x)', 'x + x', '2*x'];
  function exprLab(root) {
    var el = { f: q(root, 'f'), g: q(root, 'g'), rng: q(root, 'range'), n: q(root, 'n'), sp: q(root, 'speed'), tgt: q(root, 'target') }, seed = 204, done = [false, false, false, false], U = {}, hist = [];
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    if (el.tgt) el.tgt.innerHTML = '<option value="">no target</option>' + UNITS.slice(1).map(function (u) { return '<option value="' + u[0] + '">' + esc(u[1]) + '</option>'; }).join('');
    function unitRows(vars) {
      var box = q(root, 'units'); if (!box) return;
      vars.forEach(function (v) { if (!U[v]) U[v] = defaultUnit(v); });
      box.innerHTML = vars.map(function (v) {
        return '<label class="srx-urow"><span>' + esc(v) + '</span><select data-u="' + esc(v) + '" class="control-select">' +
          UNITS.map(function (u) { return '<option value="' + u[0] + '"' + (U[v] === u[0] ? ' selected' : '') + '>' + esc(u[1]) + '</option>'; }).join('') + '</select></label>';
      }).join('') || '<p class="rlx-hint">No variables.</p>';
      box.querySelectorAll('select[data-u]').forEach(function (s) { on(s, 'change', function () { U[s.getAttribute('data-u')] = s.value; run(); }); });
    }
    function run() {
      var A, B, st, msg = '';
      try { A = parse(el.f.value); } catch (e) { set(q(root, 'status'), 'Formula A: ' + e.message); root.setAttribute('data-expr', 'error'); return; }
      st = stats(A);
      set(q(root, 'infix'), fmt(A, 0)); set(q(root, 'prefix'), prefix(A).join(' ')); set(q(root, 'postfix'), postfix(A).join(' '));
      set(q(root, 'nodes'), String(st.nodes)); set(q(root, 'depth'), String(st.depth)); set(q(root, 'weighted'), String(st.weighted)); set(q(root, 'dag'), String(st.dag));
      render(q(root, 'tree'), function (W, H) { return treeSvg(A, W, H); });
      unitRows(st.vars);
      var Uv = {}; st.vars.forEach(function (v) { Uv[v] = UNIT_OF[U[v]]; });
      var ures, uerr = null;
      try { ures = units(A, Uv); } catch (e) { uerr = e.message; }
      var tg = el.tgt && el.tgt.value ? UNIT_OF[el.tgt.value] : undefined, okT = !uerr && tg !== undefined && ures !== null && sameU(ures, tg);
      var inf = {}; if (!uerr) inferFree(A, tg, Uv, inf);
      var infTxt = Object.keys(inf).map(function (v) { return v + ' → ' + unitStr(inf[v]); }).join(', ');
      set(q(root, 'ures'), uerr ? 'rejected: ' + uerr : 'units of the result: ' + unitStr(ures) + (tg === undefined ? '' : okT ? ' · matches the target' : ures === null ? ' · free constants can supply the target units' : ' · does not match the target [' + unitStr(tg) + ']') + (infTxt ? ' · free constants must carry: ' + infTxt : ''));
      var cmpTxt = '–', same = false;
      try {
        B = parse(el.g.value);
        var lo = el.rng.value === 'pos' ? 0.1 : -3, hi = 3, R = compare(A, B, lo, hi, 11);
        if (R.n < 50) cmpTxt = 'Only ' + R.n + ' of 400 random points are defined for both: widen or change the range.';
        else if (R.maxRel < 1e-9) { same = true; cmpTxt = 'Numerically the same function on ' + R.n + ' random points in [' + lo + ', ' + hi + '] (largest relative gap ' + R.maxRel.toExponential(1) + ').'; }
        else { var at = R.at, where = Object.keys(at.env).map(function (v) { return v + ' = ' + at.env[v].toFixed(3); }).join(', '); cmpTxt = 'Different: at ' + where + ', A = ' + fx(at.fa, 4) + ' and B = ' + fx(at.fb, 4) + '.'; }
        set(q(root, 'gprefix'), prefix(B).join(' '));
      } catch (e) { cmpTxt = 'Formula B: ' + e.message; set(q(root, 'gprefix'), '–'); }
      set(q(root, 'eq'), cmpTxt);
      // counts
      var N = +el.n.value, rows = unitCount(6), sp = el.sp && el.sp.checked;
      set(q(root, 'n-out'), String(N));
      var tb = q(root, 'count');
      if (tb) tb.innerHTML = '<tr><th>operators</th><th>all formulas</th><th>' + (sp ? 'give a speed' : 'pass the unit check') + '</th><th>share</th></tr>' + rows.map(function (r) {
        var k = sp ? r.speed : r.valid; return '<tr' + (r.n === N ? ' style="font-weight:700;background:#eff6ff"' : '') + '><td>' + r.n + '</td><td>' + r.total.toLocaleString('en-US') + '</td><td>' + k.toLocaleString('en-US') + '</td><td>' + (100 * k / r.total).toFixed(r.n > 4 ? 2 : 1) + '%</td></tr>';
      }).join('');
      set(q(root, 'status'), st.nodes + ' nodes as a tree, ' + st.dag + ' as a graph with sharing; depth ' + st.depth + '; weighted complexity ' + st.weighted + '.' + (hist.length ? ' Last mutation: ' + hist[hist.length - 1].msg : ''));
      // challenges
      var preset = PRESETS.some(function (p) { try { return key(parse(p)) === key(A); } catch (e) { return false; } });
      mark(0, same && B && prefix(A).join(' ') !== prefix(B).join(' '));
      mark(1, !preset && st.nodes - st.dag >= 4);
      var hasTrig = false; walk(A, function (m) { if (m.op === 'sin' || m.op === 'cos') hasTrig = true; });
      mark(2, !uerr && ures !== null && sameU(ures, [1, -1, 0, 0]) && hasTrig);
      var fr = rows.map(function (r) { return r.valid / r.total; }), first = 0; while (first < fr.length && fr[first] >= 0.05) first++;
      mark(3, N === first + 1 && !sp);
      root.setAttribute('data-expr', [st.nodes, st.depth, st.weighted, st.dag, prefix(A).join(' '), postfix(A).join(' ')].join('|'));
      root.setAttribute('data-units', uerr ? 'error' : unitStr(ures)); root.setAttribute('data-infer', infTxt || ''); root.setAttribute('data-eq', same ? 'same' : 'diff');
      root.setAttribute('data-ready', '1');
    }
    ['f', 'g'].forEach(function (k) { on(el[k], 'input', run); });
    ['rng', 'n', 'sp', 'tgt'].forEach(function (k) { on(el[k], k === 'n' ? 'input' : 'change', run); });
    root.querySelectorAll('[data-preset]').forEach(function (b) { on(b, 'click', function () { el.f.value = PRESETS[+b.getAttribute('data-preset')]; hist = []; run(); }); });
    on(q(root, 'mutate'), 'click', function () {
      try { var A = parse(el.f.value), r = rng(seed); seed = (seed * 1103515245 + 12345) % 2147483647; var M = mutate(A, r);
        hist.push({ text: el.f.value, msg: '“' + M.old + '” became “' + M.fresh + '”.' }); el.f.value = fmt(M.tree, 0).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'); run(); } catch (e) { set(q(root, 'status'), e.message); }
    });
    on(q(root, 'undo'), 'click', function () { if (hist.length) { el.f.value = hist.pop().text; run(); } });
    run();
  }

  // ------------------------------------------------------------------ lab 3 · units guard (Module 3)
  // The draining tank of videos 6 and 7: Torricelli's law with a discharge coefficient Cd = 0.6 (a typical, made-up value), simulated here.
  var GV = 9.81, CD0 = 0.6;
  var VARS3 = [['T', 'drain time', [0, 1, 0, 0]], ['h', 'start level', [1, 0, 0, 0]], ['g', 'gravity', [1, -2, 0, 0]], ['a', 'hole area', [2, 0, 0, 0]], ['A', 'tank area', [2, 0, 0, 0]],
    ['d', 'hole diameter', [1, 0, 0, 0]], ['nu', 'kinematic viscosity ν', [2, -1, 0, 0]], ['rho', 'water density ρ', [-3, 0, 1, 0]]];   // powers of [L, T, M, Θ], as in lab 2
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function frac(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return [n / g, d / g]; }
  function fadd(x, y) { return frac(x[0] * y[1] + y[0] * x[1], x[1] * y[1]); }
  function fmul(x, y) { return frac(x[0] * y[0], x[1] * y[1]); }
  function fdiv(x, y) { return frac(x[0] * y[1], x[1] * y[0]); }
  /** integer basis of the null space of a small integer matrix (rows = base dimensions, columns = variables) */
  function nullSpace(M) {
    var R = M.map(function (r) { return r.map(function (v) { return [v, 1]; }); }), n = M[0].length, piv = [], row = 0;
    for (var c = 0; c < n && row < R.length; c++) {
      var p = -1; for (var r = row; r < R.length; r++) if (R[r][c][0] !== 0) { p = r; break; }
      if (p < 0) continue;
      var tmp = R[p]; R[p] = R[row]; R[row] = tmp;
      var inv = R[row][c]; R[row] = R[row].map(function (v) { return fdiv(v, inv); });
      for (r = 0; r < R.length; r++) if (r !== row && R[r][c][0] !== 0) { var f = R[r][c]; R[r] = R[r].map(function (v, j) { return fadd(v, fmul([-f[0], f[1]], R[row][j])); }); }
      piv.push(c); row++;
    }
    var free = []; for (c = 0; c < n; c++) if (piv.indexOf(c) < 0) free.push(c);
    return { rank: piv.length, basis: free.map(function (fc) {
      var v = []; for (var j = 0; j < n; j++) v.push([0, 1]); v[fc] = [1, 1];
      piv.forEach(function (pc, i) { v[pc] = [-R[i][fc][0], R[i][fc][1]]; });
      var L = v.reduce(function (acc, x) { return acc * x[1] / gcd(acc, x[1]); }, 1);
      var ints = v.map(function (x) { return x[0] * (L / x[1]); }), g = ints.reduce(function (acc, x) { return gcd(acc, x); }, 0) || 1;
      ints = ints.map(function (x) { return x / g; });
      if (ints[fc] < 0) ints = ints.map(function (x) { return -x; });
      return ints;
    }) };
  }
  function groupStr(names, e) {
    var up = [], dn = [];
    e.forEach(function (p, i) { if (!p) return; var q2 = Math.abs(p), s2 = names[i] + (q2 === 1 ? '' : q2 === 2 ? '²' : q2 === 3 ? '³' : '^' + q2); (p > 0 ? up : dn).push(s2); });
    return (up.length ? up.join('·') : '1') + (dn.length ? ' / ' + (dn.length > 1 ? '(' + dn.join('·') + ')' : dn[0]) : '');
  }
  function tankRuns(n, h0r, dr, Dr, noise, seed) {
    var r = rng(seed), out = [];
    for (var i = 0; i < n; i++) {
      var H = h0r[0] + (h0r[1] - h0r[0]) * r(), d = dr[0] + (dr[1] - dr[0]) * r(), D = Dr[0] + (Dr[1] - Dr[0]) * r();
      var a = Math.PI * d * d / 4, A = Math.PI * D * D / 4, T = A / (CD0 * a) * Math.sqrt(2 * H / GV) * (1 + noise * gauss(r));
      out.push({ h: H, d: d, D: D, a: a, A: A, T: T });
    }
    return out;
  }
  function lsq(X, y) { var k = X[0].length, AtA = [], Aty = []; for (var i = 0; i < k; i++) { AtA.push(new Array(k).fill(0)); Aty.push(0); } X.forEach(function (row, n) { for (var i = 0; i < k; i++) { Aty[i] += row[i] * y[n]; for (var j = 0; j < k; j++) AtA[i][j] += row[i] * row[j]; } }); for (i = 0; i < k; i++) AtA[i][i] += 1e-12 * (1 + AtA[i][i]); return solve(AtA, Aty); }
  function relErr(pred, ys) { var s = 0; ys.forEach(function (y, i) { s += Math.pow((pred[i] - y) / y, 2); }); return Math.sqrt(s / ys.length); }
  /** the three rungs of video 7: data only (quadratic, 10 constants), units (power law in the groups), scaling (one constant) */
  function rungs(train, test) {
    var quad = function (t) { return [1, t.h, t.d, t.D, t.h * t.h, t.d * t.d, t.D * t.D, t.h * t.d, t.h * t.D, t.d * t.D]; };
    var c0 = lsq(train.map(quad), train.map(function (t) { return t.T; })), p0 = function (t) { return quad(t).reduce(function (u, v, i) { return u + v * c0[i]; }, 0); };
    var Pi = function (t) { return [Math.log(t.T * Math.sqrt(GV / t.h)), Math.log(t.a / t.A), Math.log(t.A / (t.h * t.h))]; };
    var c1 = lsq(train.map(function (t) { var P = Pi(t); return [1, P[1], P[2]]; }), train.map(function (t) { return Pi(t)[0]; }));
    var p1 = function (t) { var P = Pi(t); return Math.exp(c1[0] + c1[1] * P[1] + c1[2] * P[2]) * Math.sqrt(t.h / GV); };
    var C3 = Math.exp(train.reduce(function (u, t) { return u + Math.log(t.T * Math.sqrt(GV / t.h) * t.a / t.A); }, 0) / train.length), p3 = function (t) { return C3 * (t.A / t.a) * Math.sqrt(t.h / GV); };
    var ev3 = function (f) { return { train: relErr(train.map(f), train.map(function (t) { return t.T; })), test: relErr(test.map(f), test.map(function (t) { return t.T; })), neg: test.filter(function (t) { return f(t) < 0; }).length }; };
    var R0 = ev3(p0), R1 = ev3(p1), R3 = ev3(p3); R1.p = c1[1]; R1.q = c1[2]; R3.C = C3; R3.Cd = Math.SQRT2 / C3;
    return [R0, R1, R3];
  }
  /** the tank level readings of video 6 and a cubic with a soft (or hard) "never rises, never below empty" penalty on 0-240 s */
  function levelData(seed, noise) {
    var D = 0.20, d = 0.008, h0 = 0.40, k = CD0 * (d * d) / (D * D) * Math.sqrt(GV / 2), r = rng(seed), t = [], h = [];
    for (var i = 0; i <= 30; i++) { var ti = 2 * i, s2 = Math.sqrt(h0) - k * ti; t.push(ti); h.push((s2 > 0 ? s2 * s2 : 0) + noise * gauss(r)); }
    return { t: t, h: h, k: k, h0: h0, drain: Math.sqrt(h0) / k };
  }
  function softCubic(D, lam) {   // convex: data misfit + λ·(squared rises + squared negatives) on a 0-240 s grid; semismooth Newton with a line search
    var sc = 100, grid = []; for (var i = 0; i <= 120; i++) grid.push(2 * i);
    var row = function (t) { var u = t / sc; return [1, u, u * u, u * u * u]; }, drow = function (t) { var u = t / sc; return [0, 1, 2 * u, 3 * u * u]; };
    var dot = function (r, c) { return r[0] * c[0] + r[1] * c[1] + r[2] * c[2] + r[3] * c[3]; }, n = D.t.length, wD = Math.sqrt(1 / n), wP = Math.sqrt(lam / grid.length);
    var J = function (c) { var s2 = 0; D.t.forEach(function (t, j) { s2 += Math.pow(dot(row(t), c) - D.h[j], 2) / n; }); var p2 = 0; grid.forEach(function (t) { p2 += Math.pow(Math.max(0, dot(drow(t), c)), 2) + Math.pow(Math.max(0, -dot(row(t), c)), 2); }); return s2 + lam * p2 / grid.length; };
    var solveWith = function (c) {
      var X = [], y = [];
      D.t.forEach(function (t, j) { X.push(row(t).map(function (v) { return v * wD; })); y.push(D.h[j] * wD); });
      if (lam > 0) grid.forEach(function (t) { if (dot(drow(t), c) > 0) { X.push(drow(t).map(function (v) { return v * wP; })); y.push(0); } if (dot(row(t), c) < 0) { X.push(row(t).map(function (v) { return v * wP; })); y.push(0); } });
      return lsq(X, y);
    };
    var c = solveWith([0, -1, 0, 0]); c = solveWith(c);
    if (lam > 0) for (var it = 0; it < 80; it++) {
      var cn = solveWith(c), j0 = J(c), st = 1, ct = null;
      while (st > 1e-5) { ct = c.map(function (v, k) { return v + st * (cn[k] - v); }); if (J(ct) <= j0) break; st /= 2; }
      var dc = Math.abs(ct[0] - c[0]) + Math.abs(ct[1] - c[1]) + Math.abs(ct[2] - c[2]) + Math.abs(ct[3] - c[3]);
      c = ct; if (dc < 1e-12) break;
    }
    var f2 = function (t) { return dot(row(t), c); }, lo = Infinity;
    grid.forEach(function (t) { lo = Math.min(lo, f2(t)); });
    var res = 0; D.t.forEach(function (t, j) { res += Math.pow(f2(t) - D.h[j], 2); });
    return { f: f2, rmse: Math.sqrt(res / n), lowest: lo, at180: f2(180) };
  }
  var LAMS = [0, 0.001, 0.01, 0.1, 1, 10, 1e4];   // the last one acts as a hard rule
  function unitsLab(root) {
    var el = { f: q(root, 'cand'), lam: q(root, 'lam'), noise: q(root, 'noise') }, done = [false, false, false, false], picked = { T: 1, h: 1, g: 1, a: 1, A: 1 }, seedT = 2061, seedL = 206, last = null;
    var U = {}; VARS3.forEach(function (v) { U[v[0]] = v[2]; });
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    // A · the units guard
    function guard() {
      var msg, ok = false, novel = false;
      try {
        var F = parse(el.f.value), u = units(F, U), tT = [0, 1, 0, 0];
        ok = u !== null && sameU(u, tT);
        msg = ok ? 'Units check: a time, as a drain time must be.' : 'Rejected: the result has units [' + unitStr(u) + '], not a time.';
        if (ok) {   // same units as Torricelli; is it Torricelli's shape (up to a constant)?
          var r = rng(5), ratios = [];
          for (var i = 0; i < 60; i++) { var env = { h: 0.1 + r(), g: GV, a: 1e-5 + 1e-4 * r(), A: 0.01 + 0.2 * r(), d: 0.003 + 0.01 * r(), nu: 1e-6, rho: 1000, T: 1 }; var fv = ev(F, env), tv = env.A / env.a * Math.sqrt(env.h / env.g); if (isFinite(fv) && fv !== 0) ratios.push(fv / tv); }
          var m = ratios.reduce(function (s2, x) { return s2 + x; }, 0) / Math.max(1, ratios.length), sd = Math.sqrt(ratios.reduce(function (s2, x) { return s2 + (x - m) * (x - m); }, 0) / Math.max(1, ratios.length));
          novel = ratios.length > 30 && Math.abs(sd / m) > 0.01;
          msg += novel ? ' But it is not Torricelli\'s shape: the units can\'t tell you which one is right.' : ' It has Torricelli\'s shape, T ∝ (A/a)·√(h/g).';
        }
      } catch (e) { msg = 'Rejected: ' + e.message; }
      set(q(root, 'verdict'), msg); root.setAttribute('data-guard', ok ? (novel ? 'novel' : 'torricelli') : 'rejected');
      mark(0, ok && novel);
    }
    // B · dimensionless groups
    function groups() {
      var names = VARS3.filter(function (v) { return picked[v[0]]; }), box = q(root, 'groups');
      if (names.length < 2) { set(box, 'Pick at least two quantities.'); root.setAttribute('data-groups', '0'); return; }
      var dims = [0, 1, 2, 3].filter(function (k) { return names.some(function (v) { return v[2][k] !== 0; }); });
      var M = dims.map(function (k) { return names.map(function (v) { return v[2][k]; }); }), NS = nullSpace(M);
      var lbl = names.map(function (v) { return v[0] === 'nu' ? 'ν' : v[0] === 'rho' ? 'ρ' : v[0]; });
      var gs = NS.basis.map(function (b) { return groupStr(lbl, b); });
      box.innerHTML = '<p class="rlx-sub">' + names.length + ' quantities, ' + dims.length + ' base dimensions involved, rank ' + NS.rank + ': <b>' + NS.basis.length + ' dimensionless group' + (NS.basis.length === 1 ? '' : 's') + '</b>.</p>' +
        '<ul class="srx-glist">' + gs.map(function (g2) { return '<li>' + esc(g2) + '</li>'; }).join('') + '</ul>';
      root.setAttribute('data-groups', NS.basis.length + '|' + gs.join(';'));
      var withT = picked.T && NS.basis.some(function (b) { return b[0] !== 0; });
      mark(1, NS.basis.length === 2 && withT);
    }
    // C · hard versus soft
    function soft() {
      var li = +el.lam.value, lam = LAMS[li], D = levelData(seedL, 0.002), R = softCubic(D, lam), R0 = softCubic(D, 0), ok = function (X) { return X.rmse < 0.0025 && X.lowest > -0.01; }, tor = function (t) { var s2 = Math.sqrt(D.h0) - D.k * t; return s2 > 0 ? s2 * s2 : 0; };
      set(q(root, 'lam-out'), li === LAMS.length - 1 ? 'hard' : String(lam));
      set(q(root, 'plain'), 'plain cubic: lowest level ' + fx(R0.lowest * 100, 1) + ' cm, ' + fx(R0.at180 * 100, 1) + ' cm at 3 min'); var cm1 = function (v) { return fx(Math.abs(v) < 0.0005 ? 0 : v * 100, 1) + ' cm'; }; set(q(root, 'rin'), fx(R.rmse * 1000, 1) + ' mm'); set(q(root, 'r180'), cm1(R.at180)); set(q(root, 'rlow'), cm1(R.lowest));
      render(q(root, 'lchart'), function (W, H) {
        return xyChart({ id: 31, x: [0, 300], y: [-0.3, 0.45], xLabel: 't [s]', yLabel: 'level [m]', shade: [0, 60],
          curves: [{ f: R.f, color: C.orange, width: 2.8 }, { f: tor, color: C.blue, width: 2.2, dash: '6 5' }, { f: function () { return 0; }, color: C.grey, width: 1 }],
          dots: D.t.map(function (t, i) { return { x: t, y: D.h[i], color: C.ink, r: 2.4 }; }) }, W, H);
      });
      root.setAttribute('data-soft', [seedL, li, R.rmse.toFixed(5), R.lowest.toFixed(4), R.at180.toFixed(4), R0.lowest.toFixed(4)].join('|'));
      mark(2, R0.lowest < -0.01 && li > 0 && li < LAMS.length - 1 && ok(R) && (li === 1 || !ok(softCubic(D, LAMS[li - 1]))));
    }
    // D · the ladder
    function ladderRun() {
      var nz = +el.noise.value / 100, train = tankRuns(40, [0.2, 0.6], [0.004, 0.010], [0.15, 0.30], nz, seedT), test = tankRuns(10, [1.0, 2.0], [0.010, 0.020], [0.40, 0.60], nz, seedT + 1);
      last = rungs(train, test);
      set(q(root, 'noise-out'), (nz * 100).toFixed(0) + '%');
      var names = ['0 · data only', '1 · units', '3 · scaling'], tb = q(root, 'rungs');
      if (tb) tb.innerHTML = '<tr><th>rung</th><th>fit, small tanks</th><th>error, big tanks</th><th>note</th></tr>' + last.map(function (R, i) {
        return '<tr><td>' + names[i] + '</td><td>' + fx(100 * R.train, 1) + '%</td><td>' + fx(100 * R.test, 1) + '%</td><td>' + (i === 0 ? R.neg + ' of 10 negative' : i === 1 ? 'exponents ' + fx(R.p, 2) + ', ' + fx(R.q, 3) : 'Cd = ' + fx(R.Cd, 3)) + '</td></tr>';
      }).join('');
      root.setAttribute('data-ladder', [nz, last[0].test.toFixed(4), last[1].test.toFixed(4), last[2].test.toFixed(4), last[2].Cd.toFixed(4)].join('|'));
      mark(3, nz >= 0.1 - 1e-9 && Math.abs(last[2].Cd - CD0) / CD0 < 0.03);
    }
    function pickers() {
      var box = q(root, 'pick'); if (!box) return;
      box.innerHTML = VARS3.map(function (v) { return '<label class="srx-check"><input type="checkbox" data-v="' + v[0] + '"' + (picked[v[0]] ? ' checked' : '') + '> <b>' + esc(v[0] === 'nu' ? 'ν' : v[0] === 'rho' ? 'ρ' : v[0]) + '</b> ' + esc(v[1]) + ' [' + esc(unitStr(v[2])) + ']</label>'; }).join('');
      box.querySelectorAll('input[data-v]').forEach(function (c) { on(c, 'change', function () { picked[c.getAttribute('data-v')] = c.checked ? 1 : 0; groups(); }); });
    }
    on(el.f, 'input', guard);
    root.querySelectorAll('[data-cand]').forEach(function (b) { on(b, 'click', function () { el.f.value = b.getAttribute('data-cand'); guard(); }); });
    on(el.lam, 'input', soft); on(el.noise, 'input', ladderRun);
    on(q(root, 'newlevels'), 'click', function () { seedL = (seedL * 1103515245 + 12345) % 2147483647; soft(); });
    on(q(root, 'newtanks'), 'click', function () { seedT = (seedT * 1103515245 + 12345) % 2147483647; ladderRun(); });
    pickers(); guard(); groups(); soft(); ladderRun();
    root.setAttribute('data-ready', '1');
  }

  // ------------------------------------------------------------------ lab 4 · search arena (Module 4)
  // The hidden law: the range of a throw, R = v²·sin(2θ)/g. Language: + − × ÷ sin cos, leaves v, θ, 1; every candidate gets a fitted scale and offset.
  var AR = { BIN: ['+', '-', '*', '/'], UN: ['sin', 'cos'], LEAF: ['v', 't', '1'] };
  function arenaData(noise, seed) {
    var r = rng(seed), tr = { v: [], t: [], y: [] }, te = { v: [], t: [], y: [] };
    for (var i = 0; i < 60; i++) { var v = 5 + 10 * r(), t = 0.2 + 1.0 * r(); tr.v.push(v); tr.t.push(t); tr.y.push(v * v * Math.sin(2 * t) / GV * (1 + noise * gauss(r))); }
    for (i = 0; i < 200; i++) { v = 15 + 10 * r(); t = 0.1 + 1.35 * r(); te.v.push(v); te.t.push(t); te.y.push(v * v * Math.sin(2 * t) / GV); }
    return { tr: tr, te: te };
  }
  function aev(e, V, T) {
    var n = V.length, out = new Float64Array(n), i;
    if (typeof e === 'string') { for (i = 0; i < n; i++) out[i] = e === 'v' ? V[i] : e === 't' ? T[i] : 1; return out; }
    var a = aev(e[1], V, T);
    if (e.length === 2) { for (i = 0; i < n; i++) out[i] = e[0] === 'sin' ? Math.sin(a[i]) : Math.cos(a[i]); return out; }
    var b = aev(e[2], V, T);
    for (i = 0; i < n; i++) out[i] = e[0] === '+' ? a[i] + b[i] : e[0] === '-' ? a[i] - b[i] : e[0] === '*' ? a[i] * b[i] : a[i] / b[i];
    return out;
  }
  function asize(e) { return typeof e === 'string' ? 1 : 1 + asize(e[1]) + (e.length > 2 ? asize(e[2]) : 0); }
  function ashow(e) { if (typeof e === 'string') return e === 't' ? 'θ' : e; if (e.length === 2) return e[0] + '(' + ashow(e[1]) + ')'; return '(' + ashow(e[1]) + ' ' + ({ '*': '×', '/': '÷', '-': '−' }[e[0]] || e[0]) + ' ' + ashow(e[2]) + ')'; }
  function scaleFit(f, y) {
    var n = f.length, mf = 0, my = 0, i; for (i = 0; i < n; i++) { if (!isFinite(f[i])) return null; mf += f[i]; my += y[i]; } mf /= n; my /= n;
    var sff = 0, sfy = 0; for (i = 0; i < n; i++) { sff += (f[i] - mf) * (f[i] - mf); sfy += (f[i] - mf) * (y[i] - my); }
    if (sff < 1e-18 * n) return null; var a = sfy / sff; return [a, my - a * mf];
  }
  function anrmse(e, D) {
    var f = aev(e, D.tr.v, D.tr.t), c = scaleFit(f, D.tr.y); if (!c) return { err: 9, c: null };
    var s2 = 0, m = 0, i, n = f.length; for (i = 0; i < n; i++) m += D.tr.y[i]; m /= n; var sy = 0; for (i = 0; i < n; i++) { s2 += Math.pow(c[0] * f[i] + c[1] - D.tr.y[i], 2); sy += Math.pow(D.tr.y[i] - m, 2); }
    return { err: Math.sqrt(s2 / sy), c: c };
  }
  function arecovered(e, c, D) {
    if (!c) return false; var f = aev(e, D.te.v, D.te.t), s2 = 0, m = 0, sy = 0, i, n = f.length;
    for (i = 0; i < n; i++) { if (!isFinite(f[i])) return false; m += D.te.y[i]; } m /= n;
    for (i = 0; i < n; i++) { s2 += Math.pow(c[0] * f[i] + c[1] - D.te.y[i], 2); sy += Math.pow(D.te.y[i] - m, 2); }
    return Math.sqrt(s2 / sy) < 0.02;
  }
  var FPV = [7.3, 11.1, 13.9, 5.6, 9.2], FPT = [0.31, 0.77, 1.05, 1.33, 0.52];
  function fpAffine(e) { var f = aev(e, FPV, FPT), m = 0, s2 = 0, i; for (i = 0; i < 5; i++) { if (!isFinite(f[i])) return null; m += f[i]; } m /= 5; for (i = 0; i < 5; i++) s2 += (f[i] - m) * (f[i] - m); var sd = Math.sqrt(s2 / 5); if (sd < 1e-9) return null; var k = ''; for (i = 0; i < 5; i++) k += ((f[i] - m) / sd).toFixed(5) + ','; return k; }
  function fpExact(e) { var f = aev(e, FPV, FPT), k = ''; for (var i = 0; i < 5; i++) { if (!isFinite(f[i])) return null; k += f[i].toPrecision(9) + ','; } return k; }
  var ENUM_CACHE = null;
  function enumOrder(limit) {   // distinct candidates (up to scale and offset) by size, built from one block per distinct function of each smaller size
    if (ENUM_CACHE && (ENUM_CACHE.order.length >= limit || ENUM_CACHE.done)) return ENUM_CACHE.order;
    var reps = {}, seenX = {}, seenA = {}, order = [];
    for (var n = 1; n <= 9 && order.length < limit; n++) {
      var cand = [];
      if (n === 1) cand = AR.LEAF.slice(); else {
        AR.UN.forEach(function (u) { reps[n - 1].forEach(function (k) { cand.push([u, k]); }); });
        for (var i = 1; i < n - 1; i++) AR.BIN.forEach(function (o) { reps[i].forEach(function (x) { reps[n - 1 - i].forEach(function (y) { cand.push([o, x, y]); }); }); });
      }
      reps[n] = [];
      for (var j = 0; j < cand.length; j++) { var fx = fpExact(cand[j]); if (fx === null || seenX[fx]) continue; seenX[fx] = 1; reps[n].push(cand[j]); var fa = fpAffine(cand[j]); if (fa === null || seenA[fa]) continue; seenA[fa] = 1; order.push(cand[j]); }
    }
    ENUM_CACHE = { order: order, done: n > 9 };
    return order;
  }
  function randTree(r, d) { if (d === 0 || (d < 4 && r() < 0.3)) return AR.LEAF[Math.floor(r() * 3)]; if (r() < 0.25) return [AR.UN[Math.floor(r() * 2)], randTree(r, d - 1)]; return [AR.BIN[Math.floor(r() * 4)], randTree(r, d - 1), randTree(r, d - 1)]; }
  function paths(e, p, out) { out.push(p); if (typeof e !== 'string') { for (var i = 1; i < e.length; i++) paths(e[i], p.concat([i]), out); } return out; }
  function getAt(e, p) { for (var i = 0; i < p.length; i++) e = e[p[i]]; return e; }
  function setAt(e, p, v) { if (!p.length) return v; var c = e.slice(); c[p[0]] = setAt(e[p[0]], p.slice(1), v); return c; }
  /** one run of a searcher; returns best error, recovery, evaluations to the first success, a trace, and (for GP) the final population */
  function runSearch(kind, seed, D, o) {
    var r = rng(seed * 7919 + 13), best = { err: 9, e: null, c: null }, first = null, trace = [], evals = 0, B = o.budget;
    var consider = function (e, R) { evals++; if (R.err < best.err) best = { err: R.err, e: e, c: R.c }; if (first === null && R.err < 0.03 && arecovered(e, R.c, D)) first = evals; if (evals % Math.max(1, Math.floor(B / 60)) === 0) trace.push([evals, best.err]); };
    if (kind === 'random') { while (evals < B) { var e = randTree(r, 1 + Math.floor(r() * 5)); consider(e, anrmse(e, D)); } }
    else if (kind === 'enum') { var ord = enumOrder(B); for (var k = 0; k < Math.min(B, ord.length); k++) consider(ord[k], anrmse(ord[k], D)); }
    else {
      var pop = o.pop, P = [], fit = [], arch = {};
      var note = function (e, R) { var z = asize(e); if (!arch[z] || R.err < arch[z][1]) arch[z] = [z, R.err, e]; };   // best formula of each size seen during the run
      for (var i = 0; i < pop; i++) { P.push(randTree(r, 1 + Math.floor(r() * 4))); fit.push(anrmse(P[i], D)); consider(P[i], fit[i]); note(P[i], fit[i]); }
      var tour = function () { var b = -1; for (var j = 0; j < o.tsize; j++) { var c = Math.floor(r() * pop); if (b < 0 || fit[c].err + 0.001 * asize(P[c]) < fit[b].err + 0.001 * asize(P[b])) b = c; } return P[b]; };
      while (evals < B) {
        var bi = 0; for (i = 1; i < pop; i++) if (fit[i].err < fit[bi].err) bi = i;
        var NP = [P[bi]], NF = [fit[bi]];
        while (NP.length < pop && evals < B) {
          var a = tour(), ch;
          if (r() < o.xover) { var b2 = tour(), pa = paths(a, [], []), pb = paths(b2, [], []); ch = setAt(a, pa[Math.floor(r() * pa.length)], getAt(b2, pb[Math.floor(r() * pb.length)])); }
          else { var pm = paths(a, [], []); ch = setAt(a, pm[Math.floor(r() * pm.length)], randTree(r, Math.floor(r() * 4))); }
          if (asize(ch) > 21) ch = a;
          var R2 = anrmse(ch, D); NP.push(ch); NF.push(R2); consider(ch, R2); note(ch, R2);
        }
        P = NP; fit = NF; pop = P.length;
      }
      best.pop = P.map(function (e, j) { return [asize(e), fit[j].err, ashow(e)]; });
      best.arch = Object.keys(arch).map(function (z) { return [arch[z][0], arch[z][1], ashow(arch[z][2])]; });
    }
    trace.push([evals, best.err]);
    return { err: best.err, rec: best.e ? arecovered(best.e, best.c, D) : false, first: first, best: best.e ? ashow(best.e) : '–', trace: trace, pop: best.pop, arch: best.arch };
  }
  function median(a) { if (!a.length) return NaN; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor((b.length - 1) / 2)]; }
  var BUDGETS = [1000, 2000, 5000, 10000, 20000, 50000, 80000];
  function arenaLab(root) {
    var el = { budget: q(root, 'budget'), seeds: q(root, 'seeds'), tsize: q(root, 'tsize'), xover: q(root, 'xover'), noise: q(root, 'noise') }, done = [false, false, false, false], busy = false, hist = [];
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function labels() { set(q(root, 'budget-out'), BUDGETS[+el.budget.value].toLocaleString('en-US')); set(q(root, 'seeds-out'), el.seeds.value); set(q(root, 'tsize-out'), el.tsize.value); set(q(root, 'noise-out'), el.noise.value + '%'); }
    function settings() { return { budget: BUDGETS[+el.budget.value], seeds: +el.seeds.value, tsize: +el.tsize.value, xover: el.xover.checked ? 0.8 : 0, pop: 200, noise: +el.noise.value / 100 }; }
    function show(res, o) {
      var names = { random: 'random search', 'enum': 'enumeration', gp: 'genetic programming' }, tb = q(root, 'table');
      tb.innerHTML = '<tr><th>searcher</th><th>recovered</th><th>median best error</th><th>median evaluations to first success</th><th>best formula (seed 1)</th></tr>' + ['random', 'enum', 'gp'].map(function (k) {
        var R = res[k], rec = R.filter(function (x) { return x.rec; }).length, f = R.map(function (x) { return x.first; }).filter(function (x) { return x !== null; });
        return '<tr><td>' + names[k] + '</td><td>' + rec + ' of ' + R.length + '</td><td>' + fx(100 * median(R.map(function (x) { return x.err; })), 1) + '%</td><td>' + (f.length ? Math.round(median(f)).toLocaleString('en-US') : '–') + '</td><td class="srx-mono">' + esc(R[0].best) + '</td></tr>';
      }).join('');
      render(q(root, 'trace'), function (W, H) {
        return xyChart({ id: 41, x: [0, o.budget], y: [0, 0.6], xLabel: 'evaluations', yLabel: 'best error (seed 1)',
          curves: [['random', C.grey], ['enum', C.orange], ['gp', C.blue]].map(function (p) { var tr = res[p[0]][0].trace; return { f: function (x) { var v = 0.6; for (var i = 0; i < tr.length; i++) { if (tr[i][0] <= x) v = Math.min(0.6, tr[i][1]); } return v; }, color: p[1], width: 2.6 }; }) }, W, H);
      });
      var popl = res.gp[0].pop || [], front = [], bestv = 9; (res.gp[0].arch || popl).slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }).forEach(function (p) { if (p[1] < bestv - 1e-9) { front.push(p); bestv = p[1]; } });
      render(q(root, 'front'), function (W, H) {
        return xyChart({ id: 42, x: [0, 22], y: [0, 0.6], xLabel: 'formula size (nodes)', yLabel: 'error',
          dots: popl.filter(function (p) { return p[1] <= 0.6; }).map(function (p) { return { x: p[0], y: p[1], color: C.grey, r: 2.2 }; }).concat(front.map(function (p) { return { x: p[0], y: Math.min(0.6, p[1]), color: C.blue, r: 4.5 }; })) }, W, H);
      });
      set(q(root, 'fronttxt'), front.map(function (p) { return p[0] + ' nodes: ' + fx(p[1], 4) + '  ' + p[2]; }).join('\n'));
    }
    function run() {
      if (busy) return; busy = true; var o = settings(), D = arenaData(o.noise, 208), res = { random: [], 'enum': [], gp: [] }, jobs = [];
      ['random', 'enum', 'gp'].forEach(function (k) { for (var s2 = 1; s2 <= (k === 'enum' ? 1 : o.seeds); s2++) jobs.push([k, s2]); });
      var btn = q(root, 'run'); if (btn) btn.disabled = true; var j = 0;
      (function step() {
        if (j >= jobs.length) {
          busy = false; if (btn) btn.disabled = false; show(res, o);
          var rec = function (k) { return res[k].filter(function (x) { return x.rec; }).length; };
          hist.push({ o: o, gp: rec('gp'), n: res.gp.length, en: rec('enum') });
          set(q(root, 'status'), 'Done: ' + jobs.length + ' runs, ' + o.budget.toLocaleString('en-US') + ' evaluations each, noise ' + (o.noise * 100).toFixed(0) + '%.');
          root.setAttribute('data-arena', [o.budget, o.seeds, o.tsize, o.xover, o.noise, rec('random'), rec('enum'), rec('gp')].join('|'));
          var same = function (x, y, skip) { return ['budget', 'seeds', 'tsize', 'xover', 'noise'].every(function (k) { return k === skip || x.o[k] === y.o[k]; }); };
          mark(0, rec('enum') > 0);
          mark(1, hist.some(function (h1) { return h1.o.xover > 0 && hist.some(function (h2) { return h2.o.xover === 0 && same(h1, h2, 'xover') && h2.gp > 0 && h2.gp >= h1.gp; }); }));
          mark(2, hist.some(function (h1) { return h1.o.tsize === 4 && hist.some(function (h2) { return h2.o.tsize !== 4 && same(h1, h2, 'tsize') && h2.gp < h1.gp; }); }));
          mark(3, hist.some(function (h1) { return h1.o.seeds >= 10 && h1.gp === 0 && hist.some(function (h2) { return h2.o.seeds >= 10 && h2.gp > 0 && h2.o.noise < h1.o.noise && h2.o.budget === h1.o.budget; }); }));
          root.setAttribute('data-ready', '1'); return;
        }
        var J = jobs[j++]; set(q(root, 'status'), 'Running ' + J[0] + ', seed ' + J[1] + ' (' + j + ' of ' + jobs.length + ')…');
        res[J[0]].push(runSearch(J[0], J[1], D, o)); setTimeout(step, 0);
      })();
    }
    ['budget', 'seeds', 'tsize', 'noise'].forEach(function (k) { on(el[k], 'input', labels); });
    on(q(root, 'run'), 'click', run);
    labels(); set(q(root, 'status'), 'Choose settings and press Run.'); root.setAttribute('data-ready', '1');
  }

  // ------------------------------------------------------------------ lab 5 · noisy derivatives (a weight on a spring, filmed by a phone)
  // a = −K·x − Cd·v (− K3·x³ when the spring stiffens). The camera sees x only. Three pipelines turn x into a law:
  // finite differences, local cubic smoothing (Savitzky–Golay), and a weak form (bump φ = (s(1−s))², integration by parts).
  var SK = 16, SCd = 0.4, SK3 = 400, SNAMES = ['1', 'x', 'v', 'x²', 'x·v', 'x³', 'x²·v'];
  function springRun(x0, v0, T, fs, k3) {
    var h = 1e-3, n = Math.round(T / h), s = [x0, v0], every = Math.max(1, Math.round(1 / fs / h)), t = [0], x = [x0], v = [v0];
    var f = function (a) { return [a[1], -SK * a[0] - SCd * a[1] - k3 * a[0] * a[0] * a[0]]; };
    for (var i = 1; i <= n; i++) {
      var k1 = f(s), k2 = f([s[0] + h / 2 * k1[0], s[1] + h / 2 * k1[1]]), k3_ = f([s[0] + h / 2 * k2[0], s[1] + h / 2 * k2[1]]), k4 = f([s[0] + h * k3_[0], s[1] + h * k3_[1]]);
      s = [s[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3_[0] + k4[0]), s[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3_[1] + k4[1])];
      if (i % every === 0) { t.push(i * h); x.push(s[0]); v.push(s[1]); }
    }
    return { t: t, x: x, v: v };
  }
  function libRow(x, v) { return [1, x, v, x * x, x * v, x * x * x, x * x * v]; }
  function pipeFD(t, x) { var dt = t[1] - t[0], A = [], y = []; for (var i = 1; i < x.length - 1; i++) { A.push(libRow(x[i], (x[i + 1] - x[i - 1]) / (2 * dt))); y.push((x[i + 1] - 2 * x[i] + x[i - 1]) / (dt * dt)); } return { A: A, y: y }; }
  function sgCoef(m, dt) {   // local cubic over 2m+1 points: rows that give value, first and second derivative at the centre
    var P = []; for (var j = -m; j <= m; j++) P.push([1, j, j * j, j * j * j]);
    var G = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; P.forEach(function (r) { for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) G[a][b] += r[a] * r[b]; });
    var rows = [[], [], []]; for (var k = 0; k < P.length; k++) { var e = [P[k][0], P[k][1], P[k][2], P[k][3]], c = solve(G, e); rows[0].push(c[0]); rows[1].push(c[1] / dt); rows[2].push(2 * c[2] / (dt * dt)); }
    return rows;
  }
  function pipeSG(t, x, m) {
    var dt = t[1] - t[0], R = sgCoef(m, dt), A = [], y = [];
    for (var i = m; i < x.length - m; i++) { var s0 = 0, s1 = 0, s2 = 0; for (var j = -m; j <= m; j++) { var xx = x[i + j]; s0 += R[0][j + m] * xx; s1 += R[1][j + m] * xx; s2 += R[2][j + m] * xx; } A.push(libRow(s0, s1)); y.push(s2); }
    return { A: A, y: y };
  }
  function pipeWeak(t, x, L) {
    var A = [], y = [], step = Math.max(1, Math.floor(L / 8));
    for (var i = 0; i + L <= x.length; i += step) {
      var a0 = t[i], D = t[i + L - 1] - a0, row = [0, 0, 0, 0, 0, 0, 0], rhs = 0;
      for (var j = 0; j < L; j++) {
        var s = (t[i + j] - a0) / D, w = (j === 0 || j === L - 1 ? 0.5 : 1) * (t[1] - t[0]), xx = x[i + j];
        var ph = Math.pow(s * (1 - s), 2), dph = 2 * s * (1 - s) * (1 - 2 * s) / D, ddph = (2 * Math.pow(1 - 2 * s, 2) - 4 * s * (1 - s)) / (D * D);
        row[0] += w * ph; row[1] += w * ph * xx; row[2] -= w * dph * xx; row[3] += w * ph * xx * xx; row[4] -= w * dph * xx * xx / 2; row[5] += w * ph * xx * xx * xx; row[6] -= w * dph * xx * xx * xx / 3; rhs += w * ddph * xx;
      }
      A.push(row); y.push(rhs);
    }
    return { A: A, y: y };
  }
  function lsqCols(A, y, cols) {
    var n = cols.length, G = [], b = []; for (var a = 0; a < n; a++) { G.push(new Array(n).fill(0)); b.push(0); }
    for (var i = 0; i < A.length; i++) for (var a2 = 0; a2 < n; a2++) { b[a2] += A[i][cols[a2]] * y[i]; for (var c = 0; c < n; c++) G[a2][c] += A[i][cols[a2]] * A[i][cols[c]]; }
    return solve(G, b);
  }
  function stlsqS(A, y, tau) {   // sequentially thresholded least squares on RMS-scaled columns
    var p = A[0].length, sc = [], ys = 0; for (var j = 0; j < p; j++) { var s = 0; for (var i = 0; i < A.length; i++) s += A[i][j] * A[i][j]; sc.push(Math.sqrt(s / A.length) || 1); }
    for (var i2 = 0; i2 < y.length; i2++) ys += y[i2] * y[i2]; ys = Math.sqrt(ys / y.length) || 1;
    var As = A.map(function (r) { return r.map(function (v, j) { return v / sc[j]; }); }), bs = y.map(function (v) { return v / ys; });
    var act = []; for (var j2 = 0; j2 < p; j2++) act.push(j2);
    var xi = new Array(p).fill(0);
    for (var it = 0; it < 10; it++) {
      var c = act.length ? lsqCols(As, bs, act) : []; xi = new Array(p).fill(0); if (!c) break;
      act.forEach(function (j, k) { xi[j] = c[k]; });
      var keep = act.filter(function (j) { return Math.abs(xi[j]) >= tau; }); if (keep.length === act.length) break; act = keep;
    }
    return xi.map(function (v, j) { return v * ys / sc[j]; });
  }
  function lawText(xi) {
    var parts = []; xi.forEach(function (c, j) { if (c !== 0) parts.push((c < 0 ? '− ' : '+ ') + fx(Math.abs(c), Math.abs(c) >= 10 ? 1 : 3) + (j ? '·' + SNAMES[j] : '')); });
    return parts.length ? ('a = ' + parts.join(' ')).replace('a = + ', 'a = ') : 'a = 0';
  }
  var DSTARTS = [[0.05, 0], [0.03, 0.25], [-0.04, 0.15], [0.02, -0.3]];
  function derivLab(root) {
    var el = { noise: q(root, 'noise'), fps: q(root, 'fps'), win: q(root, 'win'), wwin: q(root, 'wwin'), amp: q(root, 'amp') }, done = [false, false, false, false], seed = 1, hist = [], extra = null;
    var NOISE = [0, 0.1, 0.25, 0.5, 1, 2, 4, 8], FPS = [15, 30, 60, 120, 240];
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function o() { return { sig: NOISE[+el.noise.value] / 1000, fps: FPS[+el.fps.value], win: +el.win.value / 100, wwin: +el.wwin.value / 100 }; }
    function labels() { var p = o(); set(q(root, 'noise-out'), (p.sig * 1000) + ' mm'); set(q(root, 'fps-out'), p.fps + ' frames/s'); set(q(root, 'win-out'), fx(p.win, 2) + ' s'); set(q(root, 'wwin-out'), fx(p.wwin, 2) + ' s'); set(q(root, 'amp-out'), el.amp.value + ' cm'); }
    function noisy(rec, sig, r) { return rec.x.map(function (v) { return v + sig * gauss(r); }); }
    function stack(fn, recs) { var A = [], y = []; recs.forEach(function (R) { var o2 = fn(R); A = A.concat(o2.A); y = y.concat(o2.y); }); return { A: A, y: y }; }
    function run() {
      var p = o(), r = rng(seed * 7717 + 3), m = Math.max(2, Math.round(p.win * p.fps / 2)), L = Math.max(7, Math.round(p.wwin * p.fps) + 1);
      var recs = DSTARTS.map(function (s) { var R = springRun(s[0], s[1], 6, p.fps, 0); return { t: R.t, x: noisy(R, p.sig, r), xc: R.x, vc: R.v }; });
      var res = {}, rows = [];
      [['fd', 'finite differences', function (R) { return pipeFD(R.t, R.x); }], ['sg', 'smoothing', function (R) { return pipeSG(R.t, R.x, m); }], ['weak', 'weak form', function (R) { return pipeWeak(R.t, R.x, L); }]].forEach(function (P) {
        var S = stack(P[2], recs), xi = stlsqS(S.A, S.y, 0.05), ok = xi.every(function (c, j) { return (j === 1 || j === 2) ? c !== 0 : c === 0; });
        res[P[0]] = { xi: xi, ok: ok, cerr: Math.abs(xi[2] + SCd) / SCd, kerr: Math.abs(xi[1] + SK) / SK };
        rows.push('<tr><td>' + P[1] + '</td><td class="srx-mono">' + lawText(xi) + '</td><td>' + (ok ? 'yes' : 'no') + '</td><td>' + (xi[2] !== 0 ? fx(100 * res[P[0]].cerr, 1) + '%' : 'term lost') + '</td></tr>');
      });
      q(root, 'table').innerHTML = '<tr><th>pipeline</th><th>law found</th><th>right two terms?</th><th>damping error</th></tr>' + rows.join('');
      // acceleration noise of the finite differences on recording 1
      var R0 = recs[0], dt = R0.t[1] - R0.t[0], e2 = 0, n2 = 0, at = [], afd = [], asg = [];
      var sgR = sgCoef(m, dt);
      for (var i = 1; i < R0.x.length - 1; i++) { var a = (R0.x[i + 1] - 2 * R0.x[i] + R0.x[i - 1]) / (dt * dt), tr = -SK * R0.xc[i] - SCd * R0.vc[i]; e2 += (a - tr) * (a - tr); n2++; at.push([R0.t[i], tr]); afd.push([R0.t[i], a]); }
      for (var i3 = m; i3 < R0.x.length - m; i3++) { var s2 = 0; for (var j = -m; j <= m; j++) s2 += sgR[2][j + m] * R0.x[i3 + j]; asg.push([R0.t[i3], s2]); }
      var fdn = Math.sqrt(e2 / n2);
      set(q(root, 'fdnoise'), fx(fdn, fdn < 1 ? 3 : 1) + ' m/s²');
      var lin2 = function (pts) { return function (tv) { if (!pts.length) return NaN; var k = Math.min(pts.length - 1, Math.max(0, Math.round((tv - pts[0][0]) / (pts[pts.length > 1 ? 1 : 0][0] - pts[0][0] || 1)))); return pts[k][1]; }; };
      render(q(root, 'achart'), function (W, H) {
        return xyChart({ id: 51, x: [0, 6], y: [-2, 2], xLabel: 't [s] (recording 1)', yLabel: 'acceleration [m/s²]', curves: [{ f: lin2(afd), color: C.grey, width: 1.2 }, { f: lin2(asg), color: C.orange, width: 2.4 }, { f: lin2(at), color: C.ink, width: 2, dash: '5 4' }] }, W, H);
      });
      hist.push({ sig: p.sig, fps: p.fps, win: p.win, fdn: fdn, fd: res.fd, sg: res.sg, weak: res.weak });
      root.setAttribute('data-pipes', [res.fd.ok, res.sg.ok, res.weak.ok].map(Number).join('|') + '|' + fx(res.sg.cerr, 3) + '|' + fx(res.weak.cerr, 3) + '|' + fx(fdn, 3));
      mark(0, !res.fd.ok && res.weak.ok);
      mark(1, hist.some(function (h1) { return h1.fps > 30 && h1.sig > 0 && hist.some(function (h2) { return h2.fps === 30 && h2.sig === h1.sig && h1.fdn > h2.fdn; }); }));
      mark(2, res.sg.ok && res.sg.cerr > 0.3 && res.weak.cerr < 0.05);
      set(q(root, 'status'), 'σ = ' + (p.sig * 1000) + ' mm, ' + p.fps + ' frames/s, smoothing window ' + fx(p.win, 2) + ' s, weak window ' + fx(p.wwin, 2) + ' s.');
      root.setAttribute('data-ready', '1');
    }
    // B · the next swing (stiffening spring, real swings of 1, 1.5 and 2 cm, σ = 0.5 mm, weak form, library x, v, x³)
    var base = null;
    function k3fit(recs) { var S = stack(function (R) { return pipeWeak(R.t, R.x, 31); }, recs), c = lsqCols(S.A, S.y, [1, 2, 5]); return c ? -c[2] : NaN; }
    function swingRec(a0, r) { var R = springRun(a0, 0, 6, 30, SK3); return { t: R.t, x: noisy(R, 0.0005, r) }; }
    function nextInit() {
      var r = rng(4242 + seed); base = [0.01, 0.015, 0.02].map(function (a0) { return swingRec(a0, r); });
      var S = stack(function (R) { return pipeWeak(R.t, R.x, 31); }, base), lin = lsqCols(S.A, S.y, [1, 2]), cub = lsqCols(S.A, S.y, [1, 2, 5]);
      var k0 = k3fit(base); set(q(root, 'k3before'), fx(k0, 0)); set(q(root, 'k3after'), '–'); extra = null;
      render(q(root, 'dchart'), function (W, H) {
        return xyChart({ id: 52, x: [0, 10], y: [0, 0.25], xLabel: 'swing amplitude [cm]', yLabel: 'disagreement [m/s²]', shade: [0, 2],
          curves: [{ f: function (A) { var a = A / 100; return Math.abs(lin[0] * a - (cub[0] * a + cub[2] * a * a * a)) / 2; }, color: C.orange, width: 2.6 }],
          marks: extra ? [{ x: extra.amp, label: 'new swing' }] : [] }, W, H);
      });
      root.setAttribute('data-k3', fx(k0, 1) + '|');
    }
    function runSwing() {
      var a0 = +el.amp.value / 100, r = rng(9000 + seed * 31 + Math.round(a0 * 1000)), rec = swingRec(a0, r), k1 = k3fit(base.concat([rec]));
      extra = { amp: a0 * 100, k3: k1 }; set(q(root, 'k3after'), fx(k1, 0) + ' (with a ' + fx(a0 * 100, 0) + ' cm swing)');
      root.setAttribute('data-k3', fx(k3fit(base), 1) + '|' + fx(k1, 1));
      mark(3, Math.abs(k1 - SK3) / SK3 < 0.03);
      var svg = q(root, 'dchart'); if (svg && svg._draw) paint(svg);
    }
    ['noise', 'fps', 'win', 'wwin', 'amp'].forEach(function (k) { on(el[k], 'input', labels); });
    ['noise', 'fps', 'win', 'wwin'].forEach(function (k) { on(el[k], 'change', run); });
    on(q(root, 'redraw'), 'click', function () { seed++; run(); nextInit(); });
    on(q(root, 'swing'), 'click', runSwing);
    labels(); run(); nextInit();
  }

  // ------------------------------------------------------------------ lab 6 · collapse and envelope (pendulums on three worlds)
  var WORLDS6 = [['Earth', 9.81, '#009e73'], ['Mars', 3.71, '#d55e00'], ['Moon', 1.62, '#2563eb']], LENS6 = [0.3, 0.6, 1.2];
  var AMPS6 = []; for (var ia = 0; ia < 13; ia++) AMPS6.push(0.1 + 0.2 * ia);
  function pRatio(th) { var a = 1, b = Math.cos(th / 2); for (var i = 0; i < 12; i++) { var a2 = (a + b) / 2; b = Math.sqrt(a * b); a = a2; } return 1 / a; }   // exact T / T0 (AGM)
  function pendData(seed, heavy) {   // 9 pendulums × 13 swings; heavy: the 1.2 m bobs hang on a string as heavy as the bob (a physical pendulum: T0 × √(8/9))
    var r = rng(seed), out = [];
    WORLDS6.forEach(function (w) { LENS6.forEach(function (L) { AMPS6.forEach(function (th) {
      var T = 2 * Math.PI * Math.sqrt(L / w[1]) * pRatio(th) * (heavy && L === 1.2 ? Math.sqrt(8 / 9) : 1) * (1 + 0.005 * gauss(r));
      out.push({ world: w[0], g: w[1], L: L, th: th, T: T, c: w[2] }); }); }); });
    return out;
  }
  var YAX6 = { T: function (p) { return p.T; }, TL: function (p) { return p.T / p.L; }, Tg: function (p) { return p.T * p.g; }, TLg: function (p) { return p.T * Math.sqrt(p.L / p.g); }, TgL: function (p) { return p.T * Math.sqrt(p.g / p.L); } };
  var XAX6 = { th: function (t) { return t; }, th2: function (t) { return t * t; }, sin: function (t) { return Math.sin(t / 2); } };
  function scatter6(D, yk, xk) {   // RMS distance (relative) of the points from one smooth curve: a degree-4 polynomial in x fitted to log y
    var xs = D.map(function (p) { return XAX6[xk](p.th); }), ys = D.map(function (p) { return Math.log(YAX6[yk](p)); });
    var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs), X = xs.map(function (x) { var u = (x - lo) / (hi - lo); return [1, u, u * u, u * u * u, u * u * u * u]; });
    var c = lsq(X, ys), s = 0; X.forEach(function (row, i) { var f = 0; for (var j = 0; j < 5; j++) f += c[j] * row[j]; s += (ys[i] - f) * (ys[i] - f); });
    return Math.sqrt(s / ys.length);
  }
  function corrFit(D, tmax) { var X = [], y = []; D.forEach(function (p) { if (p.th <= tmax + 1e-9) { X.push([1, p.th * p.th, Math.pow(p.th, 4)]); y.push(p.T * Math.sqrt(p.g / p.L) / (2 * Math.PI)); } }); return lsq(X, y); }
  function envelope6(f, tol) { var last = 0; for (var t = 0.01; t <= 3.0001; t += 0.01) { if (Math.abs(f(t) / pRatio(t) - 1) > tol) return last; last = t; } return last; }
  function collapseLab(root) {
    var el = { yax: q(root, 'yax'), xax: q(root, 'xax'), string: q(root, 'string'), form: q(root, 'form'), fitmax: q(root, 'fitmax'), tol: q(root, 'tol') }, done = [false, false, false, false], seed = 1;
    var TOLS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1], data = null, plain = null;
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function fitmax() { return 0.5 + 0.2 * (+el.fitmax.value); }
    function tol() { return TOLS[+el.tol.value]; }
    function pctS(v) { return (v * 100 < 1 ? fx(v * 100, v * 100 < 0.1 ? 2 : 1) : fx(v * 100, v * 100 < 10 ? 1 : 0)) + '%'; }
    function labels() { set(q(root, 'fitmax-out'), fx(fitmax(), 1) + ' rad'); set(q(root, 'tol-out'), pctS(tol())); }
    function draw() {
      var yk = el.yax.value, xk = el.xax.value, heavy = el.string.checked, D = heavy ? data.heavy : data.plain, sc = scatter6(D, yk, xk);
      var ys = D.map(YAX6[yk]), xs = D.map(function (p) { return XAX6[xk](p.th); }), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = (y1 - y0) * 0.08 || 0.1;
      var yLab = el.yax.options[el.yax.selectedIndex].text, xLab = el.xax.options[el.xax.selectedIndex].text;
      render(q(root, 'cchart'), function (W, H) {
        return xyChart({ id: 61, x: [0, Math.max.apply(null, xs) * 1.04], y: [Math.max(0, y0 - pad), y1 + pad], xLabel: xLab, yLabel: yLab,
          dots: D.map(function (p, i) { return { x: xs[i], y: ys[i], color: p.c, r: p.L === 0.3 ? 2.6 : p.L === 0.6 ? 3.4 : 4.4 }; }) }, W, H);
      });
      set(q(root, 'scatter'), pctS(sc));
      var collapsing = yk === 'TgL';
      mark(0, sc < 0.01);
      mark(1, sc < 0.01 && xk !== 'th');
      mark(2, collapsing && heavy && sc > 0.02);
      root.setAttribute('data-scatter', fx(sc, 4));
      set(q(root, 'status'), (sc < 0.01 ? 'The nine pendulums fall on one curve: ' : 'Scatter ') + pctS(sc) + (heavy ? ' · heavy strings on the 1.2 m pendulums' : '') + '.');
    }
    function env() {
      var fk = el.form.value, c = corrFit(data.plain, fitmax()), f, txtF;
      if (fk === 'two') { f = function (t) { return 1 + t * t / 16; }; txtF = 'T ÷ T₀ = 1 + θ₀²/16'; }
      else if (fk === 'series') { f = function (t) { return 1 + t * t / 16 + 11 * Math.pow(t, 4) / 3072; }; txtF = 'T ÷ T₀ = 1 + θ₀²/16 + 11·θ₀⁴/3072'; }
      else { f = function (t) { return c[0] + c[1] * t * t + c[2] * Math.pow(t, 4); }; txtF = 'T ÷ T₀ = ' + fx(c[0], 4) + ' + ' + fx(c[1], 4) + '·θ₀² + ' + fx(c[2], 4) + '·θ₀⁴  (fitted to swings up to ' + fx(fitmax(), 1) + ' rad)'; }
      var tl = tol(), e = envelope6(f, tl), small = Math.abs(f(0.1) / pRatio(0.1) - 1);
      set(q(root, 'formula'), txtF); set(q(root, 'env'), e < 0.01 ? 'none: fails at small swings' : 'θ₀ ≤ ' + fx(e, 2) + ' rad'); set(q(root, 'small'), pctS(small));
      render(q(root, 'echart'), function (W, H) {
        return xyChart({ id: 62, x: [0, 3], y: [1e-5, 1], log: { y: true }, yTicks: [1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1], yFmt: function (v) { return (+(v * 100).toPrecision(1)) + '%'; }, xLabel: 'swing θ₀ [rad]', yLabel: 'error (log)', shade: [0, e], marks: e > 0.01 ? [{ x: e, label: fx(e, 2) + ' rad' }] : [],
          curves: [{ f: function (t) { return Math.max(1e-6, Math.abs(f(t) / pRatio(t) - 1)); }, color: C.blue, width: 2.6 }, { f: function () { return tl; }, color: C.orange, width: 1.6, dash: '6 5' }] }, W, H);
      });
      root.setAttribute('data-env', fk + '|' + fx(tl, 3) + '|' + fx(e, 2) + '|' + fx(small, 4));
      mark(3, fk === 'fit' && Math.abs(tl - 0.01) < 1e-9 && e > 2.3);
    }
    function newData() { data = { plain: pendData(6061 + seed * 17, false), heavy: null }; var r2 = pendData(6061 + seed * 17, true); data.heavy = r2; }
    ['yax', 'xax', 'string'].forEach(function (k) { on(el[k], 'change', draw); });
    ['form', 'fitmax', 'tol'].forEach(function (k) { on(el[k], 'input', function () { labels(); env(); }); on(el[k], 'change', env); });
    on(q(root, 'redraw'), 'click', function () { seed++; newData(); draw(); env(); });
    labels(); newData(); draw(); env(); root.setAttribute('data-ready', '1');
  }

  // ------------------------------------------------------------------ lab 7 · sparse dynamics (a chemical clock, the Brusselator)
  var BA = 1, BSTARTS = [[1, 1], [3, 1], [0.5, 3.5], [2.5, 3.5], [0.2, 0.5], [4, 4]], BNAMES = ['1', 'X', 'Y', 'X²', 'X·Y', 'Y²', 'X³', 'X²·Y', 'X·Y²', 'Y³'], BDT = 0.05;
  function bRhs(x, y, b) { return [BA - (b + 1) * x + x * x * y, b * x - x * x * y]; }
  function bTheta(x, y) { return [1, x, y, x * x, x * y, y * y, x * x * x, x * x * y, x * y * y, y * y * y]; }
  function rk4Run(f, x0, y0, T, dt, h) {   // f(x, y) → [dx, dy]; samples every dt; null if it blows up
    h = h || 0.01; var n = Math.round(T / h), ev = Math.round(dt / h), x = x0, y = y0, X = [x0], Y = [y0];
    for (var i = 1; i <= n; i++) {
      var k1 = f(x, y), k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1]), k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1]), k4 = f(x + h * k3[0], y + h * k3[1]);
      x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 1e3 || Math.abs(y) > 1e3) return null;
      if (i % ev === 0) { X.push(x); Y.push(y); }
    }
    return { X: X, Y: Y };
  }
  function clockRun(b, x0, y0, T) { return rk4Run(function (x, y) { return bRhs(x, y, b); }, x0, y0, T, BDT); }
  function dynRows(R, b, kind, withB) {   // rows of the library (×{1, b} when withB) and the two targets, by weak form or finite differences
    var A = [], D = [], n = R.X.length, row = function (th) { return withB ? th.concat(th.map(function (v) { return b * v; })) : th; };
    if (kind === 'fd') { for (var i = 1; i < n - 1; i++) { A.push(row(bTheta(R.X[i], R.Y[i]))); D.push([(R.X[i + 1] - R.X[i - 1]) / (2 * BDT), (R.Y[i + 1] - R.Y[i - 1]) / (2 * BDT)]); } return { A: A, D: D }; }
    var L = 41, step = 5, p = withB ? 20 : 10;
    for (var s0 = 0; s0 + L <= n; s0 += step) {
      var Dw = (L - 1) * BDT, rr = new Array(p).fill(0), dx = 0, dy = 0;
      for (var j = 0; j < L; j++) {
        var s = j / (L - 1), w = (j === 0 || j === L - 1 ? 0.5 : 1) * BDT, ph = Math.pow(s * (1 - s), 2), dph = 2 * s * (1 - s) * (1 - 2 * s) / Dw, th = row(bTheta(R.X[s0 + j], R.Y[s0 + j]));
        for (var k = 0; k < p; k++) rr[k] += w * ph * th[k];
        dx -= w * dph * R.X[s0 + j]; dy -= w * dph * R.Y[s0 + j];
      }
      A.push(rr); D.push([dx, dy]);
    }
    return { A: A, D: D };
  }
  function dynModel(xi, withB) { return function (b) { return function (x, y) { var th = bTheta(x, y), sx = 0, sy = 0; for (var k = 0; k < 10; k++) { sx += xi[0][k] * th[k]; sy += xi[1][k] * th[k]; if (withB) { sx += xi[0][k + 10] * b * th[k]; sy += xi[1][k + 10] * b * th[k]; } } return [sx, sy]; }; }; }
  function steady(f, g0) {   // Newton for f = 0 from the guess g0; returns [x, y, max Re λ] or null
    var x = g0[0], y = g0[1], e = 1e-6;
    for (var it = 0; it < 40; it++) {
      var F0 = f(x, y), fx1 = f(x + e, y), fy1 = f(x, y + e), J = [[(fx1[0] - F0[0]) / e, (fy1[0] - F0[0]) / e], [(fx1[1] - F0[1]) / e, (fy1[1] - F0[1]) / e]], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      if (Math.abs(det) < 1e-12) return null;
      var dx = (F0[0] * J[1][1] - F0[1] * J[0][1]) / det, dy = (J[0][0] * F0[1] - J[1][0] * F0[0]) / det; x -= dx; y -= dy;
      if (!isFinite(x) || !isFinite(y)) return null;
      if (Math.abs(dx) + Math.abs(dy) < 1e-10) break;
    }
    var G = f(x, y); if (Math.abs(G[0]) + Math.abs(G[1]) > 1e-6) return null;
    var a = f(x + e, y), c = f(x, y + e), j11 = (a[0] - G[0]) / e, j12 = (c[0] - G[0]) / e, j21 = (a[1] - G[1]) / e, j22 = (c[1] - G[1]) / e, tr = j11 + j22, dt2 = j11 * j22 - j12 * j21, disc = tr * tr / 4 - dt2;
    return [x, y, disc >= 0 ? tr / 2 + Math.sqrt(disc) : tr / 2];
  }
  function onsetOf(M) { var prev = null; for (var b = 1; b <= 3.5001; b += 0.01) { var s = steady(M(b), [1, b]); if (!s) { prev = null; continue; } if (prev !== null && prev < 0 && s[2] >= 0) return b; prev = s[2]; } return null; }
  function periodOf(R) { if (!R) return null; var x = R.X.slice(Math.floor(R.X.length / 2)), m = 0; x.forEach(function (v) { m += v; }); m /= x.length; var lo = Math.min.apply(null, x), hi = Math.max.apply(null, x); if (hi - lo < 0.05) return null; var up = []; for (var i = 0; i < x.length - 1; i++) if (x[i] < m && x[i + 1] >= m) up.push(i + (m - x[i]) / (x[i + 1] - x[i])); if (up.length < 3) return null; return (up[up.length - 1] - up[0]) / (up.length - 1) * BDT; }
  var BTAUS = [0.01, 0.03, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 2], BNOISE = [0, 0.005, 0.01, 0.02, 0.05, 0.1];
  function dynLab(root) {
    var el = { feed: q(root, 'feed'), runs: q(root, 'runs'), noise: q(root, 'noise'), pipe: q(root, 'pipe'), tau: q(root, 'tau') }, done = [false, false, false, false], seed = 1, hist = [];
    var cleanCache = {};
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function o() { return { feed: el.feed.value, runs: el.runs.value, sig: BNOISE[+el.noise.value], pipe: el.pipe.value, tau: BTAUS[+el.tau.value] }; }
    function labels() { var p = o(); set(q(root, 'noise-out'), p.sig === 0 ? 'none' : (p.sig * 50).toFixed(p.sig === 0.005 || p.sig === 0.05 ? 2 : 0).replace(/\.?0+$/, '') + '% (σ = ' + p.sig + ')'); set(q(root, 'tau-out'), String(p.tau)); }
    function clean(b, runs) {
      var k = b + '|' + runs; if (cleanCache[k]) return cleanCache[k];
      var out;
      if (runs === 'cycle') { var R = clockRun(b, 1, 1, 60); out = [{ X: R.X.slice(600), Y: R.Y.slice(600), b: b }]; }
      else out = BSTARTS.slice(0, +runs).map(function (s) { var R2 = clockRun(b, s[0], s[1], 15); return { X: R2.X, Y: R2.Y, b: b }; });
      cleanCache[k] = out; return out;
    }
    function lawStr(row, v, withB) {
      var parts = []; row.forEach(function (c, j) { if (c !== 0) { var nm = j < 10 ? BNAMES[j] : 'b·' + BNAMES[j - 10]; parts.push((c < 0 ? '− ' : '+ ') + fx(Math.abs(c), 2) + (nm === '1' ? '' : '·' + nm)); } });
      var s2 = parts.join(' '); s2 = s2.indexOf('+ ') === 0 ? s2.slice(2) : s2.indexOf('− ') === 0 ? '−' + s2.slice(2) : s2;
      return 'd' + v + '/dt = ' + (s2 || '0');
    }
    function truthOf(withB, b) { var t = [new Array(withB ? 20 : 10).fill(0), new Array(withB ? 20 : 10).fill(0)]; t[0][0] = 1; t[0][7] = 1; t[1][7] = -1; if (withB) { t[0][1] = -1; t[0][11] = -1; t[1][11] = 1; } else { t[0][1] = -(b + 1); t[1][1] = b; } return t; }
    function run() {
      var p = o(), withB = p.feed === 'all', feeds = withB ? [1.5, 2.5, 3] : [+p.feed], r = rng(seed * 7919 + 71), A = [], DX = [], DY = [], data = [];
      feeds.forEach(function (b) { clean(b, p.runs).forEach(function (R) { var N = { X: R.X.map(function (v) { return v + p.sig * gauss(r); }), Y: R.Y.map(function (v) { return v + p.sig * gauss(r); }), b: b }; data.push(N); var S = dynRows(N, b, p.pipe, withB); A = A.concat(S.A); S.D.forEach(function (d) { DX.push(d[0]); DY.push(d[1]); }); }); });
      var xi = [stlsqS(A, DX, p.tau), stlsqS(A, DY, p.tau)], tr = truthOf(withB, feeds[0]);
      var ok = [0, 1].every(function (k) { return xi[k].every(function (c, j) { return (c !== 0) === (tr[k][j] !== 0); }); });
      var err = 0; [0, 1].forEach(function (k) { tr[k].forEach(function (c, j) { if (c !== 0) err = Math.max(err, Math.abs(xi[k][j] - c) / Math.abs(c)); }); }); if (!ok) err = NaN;
      var nterms = xi[0].concat(xi[1]).filter(function (c) { return c !== 0; }).length;
      set(q(root, 'lawx'), lawStr(xi[0], 'X', withB)); set(q(root, 'lawy'), lawStr(xi[1], 'Y', withB));
      set(q(root, 'nterms'), String(nterms)); set(q(root, 'right'), ok ? 'yes · worst coefficient ' + fx(100 * err, err < 0.01 ? 2 : 1) + '%' : 'no');
      // the found law at the first feed: a run from the first start, and its steady state
      var M = dynModel(xi, withB), b0 = feeds[withB ? 1 : 0], sim = rk4Run(M(b0), BSTARTS[0][0], BSTARTS[0][1], 30, BDT), tru = clockRun(b0, BSTARTS[0][0], BSTARTS[0][1], 30), ss = steady(M(b0), [1, b0]);
      set(q(root, 'steady'), ss ? '(' + fx(ss[0], 2) + ', ' + fx(ss[1], 2) + ') at b = ' + b0 + (ss[2] < 0 ? ', stable' : ', unstable') : 'none found');
      var onB = withB ? onsetOf(M) : null, p4 = withB ? periodOf(rk4Run(M(4), 1, 1, 120, BDT)) : null, p4t = periodOf(clockRun(4, 1, 1, 120));
      set(q(root, 'onset'), withB ? (onB ? 'b = ' + fx(onB, 2) + ' (truth 2.00)' : 'not found') : 'put the feed in the library');
      set(q(root, 'p4'), withB ? (p4 ? fx(p4, 1) + ' min (truth ' + fx(p4t, 1) + ')' : sim === null ? 'blows up' : 'no ticking') : '–');
      var polys = data.filter(function (d) { return d.b === b0; }).map(function (d) { return { pts: d.X.map(function (v, i) { return [v, d.Y[i]]; }), color: C.grey, width: 1.2, op: 0.8 }; });
      if (tru) polys.push({ pts: tru.X.map(function (v, i) { return [v, tru.Y[i]]; }), color: C.ink, width: 2, dash: '6 5' });
      if (sim) polys.push({ pts: sim.X.map(function (v, i) { return [v, sim.Y[i]]; }), color: C.orange, width: 2.6 });
      render(q(root, 'pchart'), function (W, H) { return xyChart({ id: 71, x: [0, 4.5], y: [0, 5], xLabel: 'X', yLabel: 'Y', polys: polys, dots: ss ? [{ x: ss[0], y: ss[1], color: C.blue, r: 5 }] : [] }, W, H); });
      hist.push({ feed: p.feed, runs: p.runs, sig: p.sig, pipe: p.pipe, tau: p.tau, ok: ok, nterms: nterms });
      root.setAttribute('data-dyn', [p.feed, p.runs, p.sig, p.pipe, p.tau, ok ? 1 : 0, nterms, isFinite(err) ? fx(err, 4) : 'nan', onB ? fx(onB, 2) : '', p4 ? fx(p4, 2) : '', p4t ? fx(p4t, 2) : ''].join('|'));
      mark(0, ok && p.sig >= 0.02 && !withB);
      mark(1, hist.some(function (h) { return h.runs === 'cycle' && !h.ok && h.sig > 0; }) && hist.some(function (h) { return h.runs === '6' && h.ok && hist.some(function (g) { return g.runs === 'cycle' && !g.ok && g.sig === h.sig && g.pipe === h.pipe && g.tau === h.tau && g.feed === h.feed; }); }));
      var fails = hist.filter(function (h) { return !h.ok && h.runs === '6' && h.sig === 0.02 && h.pipe === 'weak' && h.feed === p.feed; });
      mark(2, fails.some(function (h) { return h.nterms > 10; }) && fails.some(function (h) { return h.nterms < 5; }) && hist.some(function (h) { return h.ok && h.runs === '6' && h.sig === 0.02 && h.pipe === 'weak'; }));
      mark(3, withB && ok && onB !== null && Math.abs(onB - 2) <= 0.05 && p4 !== null && Math.abs(p4 / p4t - 1) <= 0.03);
      set(q(root, 'status'), (ok ? 'Found the clock’s law' : 'Not the law') + ': ' + nterms + ' terms · ' + (withB ? 'feeds 1.5, 2.5 and 3 with b in the library' : 'feed b = ' + p.feed) + ' · ' + (p.runs === 'cycle' ? 'one run on the cycle' : p.runs + (p.runs === '1' ? ' start' : ' starts')) + ' · ' + (p.pipe === 'weak' ? 'weak form' : 'finite differences') + ' · threshold ' + p.tau + '.');
      root.setAttribute('data-ready', '1');
    }
    ['noise', 'tau'].forEach(function (k) { on(el[k], 'input', labels); on(el[k], 'change', run); });
    ['feed', 'runs', 'pipe'].forEach(function (k) { on(el[k], 'change', run); });
    on(q(root, 'redraw'), 'click', function () { seed++; run(); });
    labels(); run();
  }

  // ------------------------------------------------------------------ lab 8 · field discovery (a plant spreading along a coast, the Fisher–KPP equation)
  var FDIF = 4, FGRO = 0.5, FHX = 0.5, FHT = 0.01, FDTO = 0.25, FNX = 201, FWEEKS = 24, FNAMES = ['u', 'u²', 'u³', 'u_x', 'u_xx', 'u·u_x', 'u_xxx'];
  var FTRUE = [FGRO, -FGRO, 0, 0, FDIF, 0, 0], FNOISE = [0, 0.002, 0.005, 0.01, 0.02, 0.05], FTAUS = [0.02, 0.05, 0.1, 0.2, 0.4, 0.8, 1.5];
  function fLap(u) { var n = u.length, v = new Array(n), h2 = FHX * FHX; for (var i = 1; i < n - 1; i++) v[i] = (u[i + 1] - 2 * u[i] + u[i - 1]) / h2; v[0] = 2 * (u[1] - u[0]) / h2; v[n - 1] = 2 * (u[n - 2] - u[n - 1]) / h2; return v; }
  function fGrad(u) { var n = u.length, v = new Array(n); for (var i = 1; i < n - 1; i++) v[i] = (u[i + 1] - u[i - 1]) / (2 * FHX); v[0] = (u[1] - u[0]) / FHX; v[n - 1] = (u[n - 1] - u[n - 2]) / FHX; return v; }
  function fIC(kind) { var u = []; for (var i = 0; i < FNX; i++) { var x = i * FHX; u.push(kind === 'west' ? 0.8 * Math.exp(-Math.pow(x / 3, 2)) : kind === 'merge' ? 0.8 * Math.exp(-Math.pow((x - 25) / 3, 2)) + 0.8 * Math.exp(-Math.pow((x - 75) / 3, 2)) : 0.8 * Math.exp(-Math.pow((x - 50) / 3, 2))); } return u; }
  function fRhs(c) {   // a law on the library [u, u², u³, u_x, u_xx, u·u_x, u_xxx] → du/dt on the 0.5-km grid (no-flux ends)
    return function (u) {
      var L = fLap(u), G = (c[3] || c[5]) ? fGrad(u) : null, G3 = c[6] ? fGrad(L) : null, out = new Array(u.length);
      for (var i = 0; i < u.length; i++) { var v = u[i]; out[i] = c[0] * v + c[1] * v * v + c[2] * v * v * v + c[4] * L[i] + (G ? c[3] * G[i] + c[5] * v * G[i] : 0) + (G3 ? c[6] * G3[i] : 0); }
      return out;
    };
  }
  function fSim(u0, f) {   // RK4; readings every 0.25 week at every sensor (1 km); null if it blows up
    var u = u0.slice(), n = Math.round(FWEEKS / FHT), ev = Math.round(FDTO / FHT), out = [u.filter(function (_, i) { return i % 2 === 0; })], add = function (a, b, s) { return a.map(function (v, i) { return v + s * b[i]; }); };
    for (var k = 1; k <= n; k++) {
      var k1 = f(u), k2 = f(add(u, k1, FHT / 2)), k3 = f(add(u, k2, FHT / 2)), k4 = f(add(u, k3, FHT));
      for (var i = 0; i < u.length; i++) u[i] += FHT / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      if (k % 50 === 0 && u.some(function (v) { return !isFinite(v) || Math.abs(v) > 50; })) return null;
      if (k % ev === 0) out.push(u.filter(function (_, i) { return i % 2 === 0; }));
    }
    return out;
  }
  var FPB = [0, 0, 0, 0, 1, -4, 6, -4, 1];   // (s − s²)⁴ = s⁴ − 4s⁵ + 6s⁶ − 4s⁷ + s⁸
  function fBump(L, Lw, k) { var c = FPB.slice(); for (var d = 0; d < k; d++) c = c.slice(1).map(function (v, j) { return v * (j + 1); }); var out = []; for (var i = 0; i < L; i++) { var s = i / (L - 1), v = 0; for (var j = c.length - 1; j >= 0; j--) v = v * s + c[j]; out.push(v / Math.pow(Lw, k)); } return out; }
  function fWeak(U) {   // the weak form on 13 × 13 windows (12 km × 3 weeks), stride 4; U: rows = readings, columns = sensors
    var Lx = 13, Lt = 13, px = [0, 1, 2, 3].map(function (k) { return fBump(Lx, (Lx - 1) * 1, k); }), pt = [0, 1].map(function (k) { return fBump(Lt, (Lt - 1) * FDTO, k); });
    var wx = [], wt = [], A = [], y = []; for (var i = 0; i < Lx; i++) wx.push(i === 0 || i === Lx - 1 ? 0.5 : 1); for (i = 0; i < Lt; i++) wt.push((i === 0 || i === Lt - 1 ? 0.5 : 1) * FDTO);
    for (var i0 = 0; i0 + Lx <= U[0].length; i0 += 4) for (var k0 = 0; k0 + Lt <= U.length; k0 += 4) {
      var f = [0, 0, 0, 0, 0, 0, 0], r = 0;
      for (var a = 0; a < Lt; a++) for (var b = 0; b < Lx; b++) {
        var u = U[k0 + a][i0 + b], w = wt[a] * wx[b], ph = pt[0][a] * px[0][b], phx = pt[0][a] * px[1][b];
        f[0] += w * ph * u; f[1] += w * ph * u * u; f[2] += w * ph * u * u * u; f[3] -= w * phx * u; f[4] += w * pt[0][a] * px[2][b] * u; f[5] -= w * phx * u * u / 2; f[6] -= w * pt[0][a] * px[3][b] * u; r -= w * pt[1][a] * px[0][b] * u;
      }
      A.push(f); y.push(r);
    }
    return { A: A, y: y };
  }
  function fFD(U) {   // finite differences at every interior reading and sensor
    var A = [], y = [];
    for (var k = 1; k < U.length - 1; k++) for (var i = 2; i < U[0].length - 2; i++) {
      var u = U[k][i], ux = (U[k][i + 1] - U[k][i - 1]) / 2, uxx = U[k][i + 1] - 2 * u + U[k][i - 1], uxxx = (U[k][i + 2] - 2 * U[k][i + 1] + 2 * U[k][i - 1] - U[k][i - 2]) / 2;
      A.push([u, u * u, u * u * u, ux, uxx, u * ux, uxxx]); y.push((U[k + 1][i] - U[k - 1][i]) / (2 * FDTO));
    }
    return { A: A, y: y };
  }
  function fLaw(c) {
    var parts = []; c.forEach(function (v, j) { if (v !== 0) parts.push((v < 0 ? '− ' : '+ ') + fx(Math.abs(v), 2) + '·' + FNAMES[j]); });
    var s = parts.join(' '); s = s.indexOf('+ ') === 0 ? s.slice(2) : s.indexOf('− ') === 0 ? '−' + s.slice(2) : s; return 'u_t = ' + (s || '0');
  }
  var fCache = {};
  function fClean(kind) { if (!fCache[kind]) fCache[kind] = fSim(fIC(kind), fRhs(FTRUE)); return fCache[kind]; }
  /** one search: experiment, noise, pipeline, threshold, seed → the law and its tests */
  function fieldSearch(exp, sig, pipe, tau, seed) {
    var full = fClean(exp === 'window' ? 'west' : exp), r = rng(seed * 104729 + 811), U = full.map(function (row) { return row.map(function (v) { return v + sig * gauss(r); }); });
    if (exp === 'window') U = U.slice(24, 73).map(function (row) { return row.slice(30, 71); });   // weeks 6–18, km 30–70
    var S = pipe === 'fd' ? fFD(U) : fWeak(U), c = stlsqS(S.A, S.y, tau);
    var ok = c.every(function (v, j) { return (v !== 0) === (FTRUE[j] !== 0); }), err = NaN;
    if (ok) { err = 0; FTRUE.forEach(function (v, j) { if (v !== 0) err = Math.max(err, Math.abs(c[j] - v) / Math.abs(v)); }); }
    var truth = fClean('merge'), pr = fSim(fIC('merge'), fRhs(c)), test = Infinity;
    if (pr) { var s2 = 0, n = 0; pr.forEach(function (row, k) { row.forEach(function (v, i) { s2 += Math.pow(v - truth[k][i], 2); n++; }); }); test = Math.sqrt(s2 / n); }
    return { c: c, ok: ok, err: err, nterms: c.filter(function (v) { return v !== 0; }).length, drift: c[3] !== 0, test: test, pr: pr, U: U };
  }
  function fieldLab(root) {
    var el = { exp: q(root, 'exp'), noise: q(root, 'noise'), pipe: q(root, 'pipe'), tau: q(root, 'tau') }, done = [false, false, false, false], seed = 1, hist = [];
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function o() { return { exp: el.exp.value, sig: FNOISE[+el.noise.value], pipe: el.pipe.value, tau: FTAUS[+el.tau.value] }; }
    function pctN(s) { return s === 0 ? 'none' : (+(s * 100).toFixed(1)) + '%'; }
    function labels() { var p = o(); set(q(root, 'noise-out'), pctN(p.sig)); set(q(root, 'tau-out'), String(p.tau)); }
    function run() {
      var p = o(), R = fieldSearch(p.exp, p.sig, p.pipe, p.tau, seed);
      set(q(root, 'law'), fLaw(R.c)); set(q(root, 'nterms'), String(R.nterms));
      set(q(root, 'right'), R.ok ? 'yes · worst weight ' + fx(100 * R.err, R.err < 0.01 ? 2 : 1) + '% off' : R.drift ? 'no · it has a drift' : 'no');
      set(q(root, 'test'), isFinite(R.test) ? fx(R.test, 4) + ' of cover' : 'blows up');
      // the data the search saw: a space–time map (time runs down)
      var full = fClean(p.exp === 'window' ? 'west' : p.exp), rr = rng(seed * 104729 + 811), shown = full.map(function (row) { return row.map(function (v) { return v + p.sig * gauss(rr); }); });
      render(q(root, 'hchart'), function (W, H) {
        var pl = 46, pr = 10, pt = 8, pb = 30, iw = W - pl - pr, ih = H - pt - pb, nr = Math.ceil(shown.length / 2), cw = iw / 101, ch = ih / nr, out = [];
        for (var k = 0; k < shown.length; k += 2) for (var i = 0; i < 101; i++) { var u = Math.max(0, Math.min(1, shown[k][i])), cA = [219, 234, 254], cB = [0, 158, 115], m = cA.map(function (a, j) { return Math.round(a + (cB[j] - a) * u); });
          out.push('<rect x="' + (pl + i * cw).toFixed(1) + '" y="' + (pt + (k / 2) * ch).toFixed(1) + '" width="' + (cw + 0.6).toFixed(1) + '" height="' + (ch + 0.6).toFixed(1) + '" fill="rgb(' + m.join(',') + ')"/>'); }
        if (p.exp === 'window') out.push('<rect x="' + (pl + 30 * cw).toFixed(1) + '" y="' + (pt + 12 * ch).toFixed(1) + '" width="' + (41 * cw).toFixed(1) + '" height="' + (24.5 * ch).toFixed(1) + '" fill="none" stroke="' + C.orange + '" stroke-width="2.5"/>');
        out.push(txt(pl, H - 10, '0 km', { anchor: 'start' })); out.push(txt(pl + iw, H - 10, '100 km', { anchor: 'end' })); out.push(txt(pl - 6, pt + 10, 'wk 0', { anchor: 'end' })); out.push(txt(pl - 6, pt + ih, 'wk 24', { anchor: 'end' }));
        return out.join('');
      });
      // the held-out experiment: two releases that merge; truth (dashed) and the found law (orange)
      var truth = fClean('merge'), xs = []; for (var i = 0; i < 101; i++) xs.push(i);
      var polys = []; [16, 32, 48].forEach(function (k) { polys.push({ pts: xs.map(function (x) { return [x, truth[k][x]]; }), color: C.ink, width: 1.8, dash: '6 5' }); if (R.pr) polys.push({ pts: xs.map(function (x) { return [x, R.pr[k][x]]; }), color: C.orange, width: 2.4 }); });
      render(q(root, 'mchart'), function (W, H) { return xyChart({ id: 81, x: [0, 100], y: [0, 1.05], xLabel: 'km along the coast (weeks 4, 8 and 12)', yLabel: 'cover', polys: polys }, W, H); });
      hist.push({ exp: p.exp, sig: p.sig, pipe: p.pipe, tau: p.tau, ok: R.ok, drift: R.drift, test: R.test });
      root.setAttribute('data-fld', [p.exp, p.sig, p.pipe, p.tau, R.ok ? 1 : 0, R.nterms, R.drift ? 1 : 0, isFinite(R.err) ? fx(R.err, 4) : 'nan', isFinite(R.test) ? fx(R.test, 5) : 'inf'].join('|'));
      mark(0, R.ok && p.sig >= 0.01);
      mark(1, hist.some(function (h) { return h.exp === 'window' && h.drift && h.sig > 0 && hist.some(function (g) { return g.exp === 'middle' && g.ok && g.sig === h.sig && g.pipe === h.pipe; }); }));
      mark(2, hist.some(function (h) { return h.exp === 'middle' && h.pipe === 'weak' && h.sig === 0.01 && h.ok; }) && hist.some(function (h) { return h.exp === 'middle' && h.pipe === 'weak' && h.sig === 0.02 && !h.ok; }));
      mark(3, isFinite(R.test) && R.test <= 0.005 && p.sig >= 0.01);
      set(q(root, 'status'), (R.ok ? 'Found the plant’s law' : 'Not the law') + ': ' + R.nterms + ' terms · ' + el.exp.options[el.exp.selectedIndex].text + ' · noise ' + pctN(p.sig) + ' · ' + (p.pipe === 'weak' ? 'weak form' : 'finite differences') + ' · threshold ' + p.tau + '.');
      root.setAttribute('data-ready', '1');
    }
    ['noise', 'tau'].forEach(function (k) { on(el[k], 'input', labels); on(el[k], 'change', run); });
    ['exp', 'pipe'].forEach(function (k) { on(el[k], 'change', run); });
    on(q(root, 'redraw'), 'click', function () { seed++; run(); });
    labels(); run();
  }

  // ------------------------------------------------------------------ lab 9 · stress-test bench (a draining tank, Torricelli's law)
  var TKC = 0.6 * (Math.PI * 0.005 * 0.005 / 0.05) * Math.sqrt(2 * 9.81), TKDT = 2, TKFLOOR = 0.02, TKSYR = Math.log(50) / 600, TKZ = 1.645;
  var TKNOISE = [0, 0.0005, 0.001, 0.002, 0.005], TKLEV = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  var TKDATA = { full: [[1.0, 0]], short: [[1.0, 40]], three: [[1.0, 0], [0.7, 0], [0.4, 0]], top: [[1.0, -0.6]] };   // [start level, duration (0: to the floor; negative: watch down to that level)]
  function hPow(t, h0, c, p) { if (Math.abs(p - 1) < 1e-6) return h0 * Math.exp(-c * t); var b = Math.pow(h0, 1 - p) - (1 - p) * c * t; return b > 0 ? Math.pow(b, 1 / (1 - p)) : 0; }
  function hLin(t, h0, a, b) { return (h0 + a / b) * Math.exp(-b * t) - a / b; }
  function tkDrain(h0, dur, fluid) {
    var t = [], h = [], T = dur > 0 ? dur : 900;
    for (var s = 0; s <= T + 1e-9; s += TKDT) { var v = fluid === 'syrup' ? h0 * Math.exp(-TKSYR * s) : hPow(s, h0, TKC, 0.5); if (v < TKFLOOR || (dur < 0 && v < -dur)) break; t.push(s); h.push(v); }
    return { t: t, h: h };
  }
  function tkData(kind, fluid, sig, seed, shuffle) {
    var r = rng(seed), runs = TKDATA[kind].map(function (d) { var D = tkDrain(d[0], d[1], fluid); return { t: D.t, y: D.h.map(function (v) { return v + sig * gauss(r); }) }; });
    if (shuffle) runs.forEach(function (R) { for (var i = R.y.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), tmp = R.y[i]; R.y[i] = R.y[j]; R.y[j] = tmp; } });
    return runs;
  }
  function tkLogLog(runs, kind) {   // derivative estimates (differences or a 21-point smoothing slope), then a straight line on a log-log plot
    var X = [], Y = [];
    runs.forEach(function (R) { var n = R.y.length;
      for (var i = 0; i < n; i++) { var d = null;
        if (kind === 'fd') { if (i > 0 && i < n - 1) d = (R.y[i + 1] - R.y[i - 1]) / (2 * TKDT); }
        else if (n >= 21) {   // the slope of a 21-reading smoothing window (quadratic); at the ends, the slope of a quadratic through the first or last 21 readings
          if (i >= 10 && i < n - 10) { d = 0; for (var j = -10; j <= 10; j++) d += j * R.y[i + j]; d /= 770 * TKDT; }
          else { var s0 = i < 10 ? 0 : n - 21, A3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b3 = [0, 0, 0];
            for (var m3 = 0; m3 < 21; m3++) { var u = m3 - 10, pw = [1, u, u * u]; for (var a3 = 0; a3 < 3; a3++) { b3[a3] += pw[a3] * R.y[s0 + m3]; for (var c3 = 0; c3 < 3; c3++) A3[a3][c3] += pw[a3] * pw[c3]; } }
            var q3 = solve(A3, b3), uu = i - s0 - 10; d = q3 ? (q3[1] + 2 * q3[2] * uu) / TKDT : null; } }
        if (d !== null && d < 0 && R.y[i] > TKFLOOR) { X.push(Math.log(R.y[i])); Y.push(Math.log(-d)); } } });
    if (X.length < 4) return null;
    var n2 = X.length, mx = 0, my = 0; X.forEach(function (v, i) { mx += v; my += Y[i]; }); mx /= n2; my /= n2;
    var sxx = 0, sxy = 0; X.forEach(function (v, i) { sxx += (v - mx) * (v - mx); sxy += (v - mx) * (Y[i] - my); });
    var p = sxy / sxx, a = my - p * mx, s2 = 0; X.forEach(function (v, i) { s2 += Math.pow(Y[i] - a - p * v, 2); }); s2 /= Math.max(1, n2 - 2);
    return { p: p, c: Math.exp(a), se: Math.sqrt(s2 / sxx) };
  }
  /* Levenberg–Marquardt on whole trajectories: model(params, run index, t); returns params, their standard errors, residual RMS */
  function tkLM(runs, model, x0, lo, hi) {
    var x = x0.slice(), np = x.length, lam = 1e-3, res = function (xx) { var out = []; runs.forEach(function (R, k) { R.t.forEach(function (t, i) { out.push(model(xx, k, t) - R.y[i]); }); }); return out; };
    var r0 = res(x), ss = r0.reduce(function (s, v) { return s + v * v; }, 0), J = null;
    for (var it = 0; it < 60; it++) {
      J = []; for (var j = 0; j < np; j++) { var e = 1e-6 * Math.max(1e-3, Math.abs(x[j])), xp = x.slice(); xp[j] += e; var rp = res(xp); J.push(rp.map(function (v, i) { return (v - r0[i]) / e; })); }
      var A = [], g = []; for (var a = 0; a < np; a++) { A.push([]); var gs = 0; for (var b = 0; b < np; b++) { var s3 = 0; for (var i = 0; i < r0.length; i++) s3 += J[a][i] * J[b][i]; A[a].push(s3); } for (i = 0; i < r0.length; i++) gs += J[a][i] * r0[i]; g.push(-gs); }
      var improved = false;
      for (var tries = 0; tries < 8; tries++) {
        var Ad = A.map(function (row, k) { return row.map(function (v, l) { return k === l ? v * (1 + lam) + 1e-15 : v; }); }), dx = solve(Ad, g);
        if (!dx) { lam *= 10; continue; }
        var xn = x.map(function (v, k) { return Math.min(hi[k], Math.max(lo[k], v + dx[k])); }), rn = res(xn), sn = rn.reduce(function (s, v) { return s + v * v; }, 0);
        if (isFinite(sn) && sn < ss) { x = xn; r0 = rn; var rel = (ss - sn) / ss; ss = sn; lam = Math.max(1e-9, lam / 5); improved = true; if (rel < 1e-10) it = 99; break; }
        lam *= 10;
      }
      if (!improved) break;
    }
    var n = r0.length, s2 = ss / Math.max(1, n - np), A2 = []; for (var a2 = 0; a2 < np; a2++) { A2.push([]); for (var b2 = 0; b2 < np; b2++) { var s4 = 0; for (var i2 = 0; i2 < n; i2++) s4 += J[a2][i2] * J[b2][i2]; A2[a2].push(s4); } }
    var se = x.map(function (_, k) { var e = new Array(np).fill(0); e[k] = 1; var col = solve(A2, e); return col ? Math.sqrt(Math.max(0, col[k] * s2)) : NaN; });
    return { x: x, se: se, rms: Math.sqrt(ss / n) };
  }
  function tkFitPow(runs, fixP) {
    var h0 = runs.map(function (R) { return R.y[0]; }), free = fixP === undefined;
    var R = tkLM(runs, function (x, k, t) { return hPow(t, x[(free ? 2 : 1) + k], x[0], free ? x[1] : fixP); }, [TKC * 1.2].concat(free ? [0.6] : []).concat(h0), [1e-6].concat(free ? [0] : []).concat(h0.map(function () { return 0; })), [1].concat(free ? [1.5] : []).concat(h0.map(function () { return 3; })));
    return { c: R.x[0], p: free ? R.x[1] : fixP, se: free ? R.se[1] : 0, rms: R.rms, h0: R.x.slice(free ? 2 : 1) };
  }
  function tkFitLin(runs) {
    var h0 = runs.map(function (R) { return R.y[0]; });
    var R = tkLM(runs, function (x, k, t) { return hLin(t, x[2 + k], x[0], x[1]); }, [0.001, 0.003].concat(h0), [0, 1e-6].concat(h0.map(function () { return 0; })), [1, 1].concat(h0.map(function () { return 3; })));
    return { a: R.x[0], b: R.x[1], rms: R.rms };
  }
  /** one analysis: the data choice, the noise, the pipeline; returns p, its 90% interval, c, the trajectory error */
  function tkAnalyse(o, seed) {
    var runs = tkData(o.data, o.fluid, o.sig, seed, o.shuffle), out;
    if (o.pipe === 'traj') { var F = tkFitPow(runs); out = { p: F.p, se: F.se, c: F.c, rms: F.rms }; }
    else { var L = tkLogLog(runs, o.pipe); out = L ? { p: L.p, se: L.se, c: L.c, rms: NaN } : { p: NaN, se: NaN, c: NaN, rms: NaN }; }
    out.lo = out.p - TKZ * out.se; out.hi = out.p + TKZ * out.se; out.runs = runs; return out;
  }
  function tkPredict(runs, s) {   // the three rival laws, fitted on the data, each predicting a 60-s run from level s
    var P = tkFitPow(runs), L = tkFitLin(runs), E = tkFitPow(runs, 1), ts = []; for (var t = 0; t <= 60 + 1e-9; t += TKDT) ts.push(t);
    return { ts: ts, laws: [ts.map(function (t) { return hPow(t, s, P.c, P.p); }), ts.map(function (t) { return hLin(t, s, L.a, L.b); }), ts.map(function (t) { return hPow(t, s, E.c, 1); })], fits: [P.rms, L.rms, E.rms] };
  }
  var TKLAWS = ['power law (Torricelli)', 'straight-line rate', 'exponential'], TKCOL = [C.blue, C.orange, C.purple];
  function stressLab(root) {
    var el = { data: q(root, 'data'), fluid: q(root, 'fluid'), noise: q(root, 'noise'), pipe: q(root, 'pipe'), shuffle: q(root, 'shuffle'), level: q(root, 'level') }, done = [false, false, false, false], seed = 1, covers = {}, cache = null;
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function o() { return { data: el.data.value, fluid: el.fluid.value, sig: TKNOISE[+el.noise.value], pipe: el.pipe.value, shuffle: el.shuffle.checked }; }
    function labels() { var p = o(); set(q(root, 'noise-out'), p.sig === 0 ? 'none' : (p.sig * 1000) + ' mm'); }
    function run() {
      var p = o(), R = tkAnalyse(p, seed), truth = p.fluid === 'syrup' ? 1 : 0.5, inside = R.lo <= truth && truth <= R.hi;
      set(q(root, 'p'), isFinite(R.p) ? fx(R.p, 4) : '–'); set(q(root, 'ci'), isFinite(R.se) ? fx(R.lo, 4) + ' to ' + fx(R.hi, 4) : '–');
      set(q(root, 'inside'), isFinite(R.p) ? (inside ? 'yes' : 'no') + ' (truth ' + (truth === 1 ? '1' : '1/2') + ')' : '–');
      set(q(root, 'rms'), p.pipe === 'traj' ? fx(R.rms * 1000, 1) + ' mm' : 'not computed (no trajectories)');
      var dots = [], curves = [];
      R.runs.forEach(function (Rn) { Rn.t.forEach(function (t, i) { if (i % 2 === 0) dots.push({ x: t, y: Rn.y[i], color: C.grey, r: 2.2 }); }); });
      if (isFinite(R.p) && isFinite(R.c)) R.runs.forEach(function (Rn) { var h0 = Rn.y[0]; curves.push({ f: function (t) { return t <= (Rn.t[Rn.t.length - 1] || 0) + 1 ? hPow(t, h0, R.c, R.p) : NaN; }, color: C.blue, width: 2.2 }); });
      render(q(root, 'fchart'), function (W, H) { return xyChart({ id: 91, x: [0, 600], y: [0, 1.05], xLabel: 'seconds', yLabel: 'level [m]', dots: dots, curves: curves }, W, H); });
      var key = [p.data, p.fluid, p.sig, p.pipe, p.shuffle].join('|'); set(q(root, 'cover'), covers[key] !== undefined ? Math.round(covers[key] * 100) + '% of 100 experiments' : 'not checked yet');
      root.setAttribute('data-tk', [p.data, p.fluid, p.sig, p.pipe, p.shuffle ? 1 : 0, fx(R.p, 4), fx(R.se, 5), inside ? 1 : 0, p.pipe === 'traj' ? fx(R.rms * 1000, 2) : 'nan'].join('|'));
      mark(0, p.fluid === 'water' && !p.shuffle && p.sig >= 0.001 && Math.abs(R.p - 0.5) <= 0.01 && inside);
      mark(2, done[2] || (p.shuffle && p.pipe !== 'traj' && isFinite(R.p) && hist.some(function (h) { return h.shuffle && h.pipe === 'traj' && h.rms > 0.05; })) || (p.shuffle && p.pipe === 'traj' && R.rms > 0.05 && hist.some(function (h) { return h.shuffle && h.pipe !== 'traj' && isFinite(h.p); })));
      hist.push({ shuffle: p.shuffle, pipe: p.pipe, p: R.p, rms: R.rms });
      cache = R.runs; design();
      set(q(root, 'status'), (p.shuffle ? 'Shuffled readings · ' : '') + el.data.options[el.data.selectedIndex].text + ' · ' + p.fluid + ' · noise ' + (p.sig * 1000) + ' mm · ' + el.pipe.options[el.pipe.selectedIndex].text + (isFinite(R.p) ? ' · p = ' + fx(R.p, 3) : '') + '.');
      root.setAttribute('data-ready', '1');
    }
    var hist = [];
    function calibrate() {
      var p = o(), truth = p.fluid === 'syrup' ? 1 : 0.5, hit = 0, n = 100;
      for (var k = 0; k < n; k++) { var R = tkAnalyse(p, 9000 + seed * 131 + k); if (R.lo <= truth && truth <= R.hi) hit++; }
      var key = [p.data, p.fluid, p.sig, p.pipe, p.shuffle].join('|'); covers[key] = hit / n; set(q(root, 'cover'), hit + '% of 100 experiments');
      root.setAttribute('data-cover', [p.data, p.sig, p.pipe, hit].join('|'));
      var vals = Object.keys(covers).filter(function (k2) { return k2.indexOf('|true') < 0; }).map(function (k2) { return covers[k2]; });
      mark(1, vals.some(function (v) { return v < 0.5; }) && vals.some(function (v) { return v >= 0.85; }));
    }
    function design() {   // the rival laws, fitted on the current (unshuffled) data, and where they disagree
      var p = o(); if (p.shuffle || p.fluid !== 'water') { set(q(root, 'dstatus'), 'Use unshuffled water data to compare rival laws.'); render(q(root, 'dchart'), function () { return ''; }); return; }
      var sc = TKLEV.map(function (s) { var Pd = tkPredict(cache, s), m = 0; for (var a = 0; a < 3; a++) for (var b = a + 1; b < 3; b++) { var d = 0; Pd.laws[a].forEach(function (v, i) { d += Math.pow(v - Pd.laws[b][i], 2); }); m = Math.max(m, Math.sqrt(d / Pd.ts.length) / (Math.SQRT2 * Math.max(p.sig, 0.0005))); } return m; });
      render(q(root, 'dchart'), function (W, H) { return xyChart({ id: 92, x: [0.05, 1.05], y: [0, Math.max.apply(null, sc) * 1.1 || 1], xLabel: 'starting level of a 60-s run [m]', yLabel: 'disagreement (noise widths)', dots: TKLEV.map(function (s, i) { return { x: s, y: sc[i], color: C.orange, r: 5 }; }), curves: [] }, W, H); });
      set(q(root, 'dstatus'), 'The laws disagree most from ' + Math.round(TKLEV[sc.indexOf(Math.max.apply(null, sc))] * 100) + ' cm.');
    }
    function runExperiment() {
      var p = o(); if (p.shuffle || p.fluid !== 'water') return;
      var s = +el.level.value, Pd = tkPredict(cache, s), r = rng(seed * 7 + Math.round(s * 100)), obs = Pd.ts.map(function (t) { return hPow(t, s, TKC, 0.5) + p.sig * gauss(r); }), lim = 5 * Math.max(p.sig, 0.0005);
      var miss = Pd.laws.map(function (L) { var d = 0; L.forEach(function (v, i) { d += Math.pow(v - obs[i], 2); }); return Math.sqrt(d / L.length); });
      set(q(root, 'xres'), miss.map(function (m, i) { return TKLAWS[i] + ': ' + fx(m * 1000, 1) + ' mm' + (m > lim ? ' (falsified)' : ''); }).join(' · '));
      render(q(root, 'xchart'), function (W, H) { return xyChart({ id: 93, x: [0, 60], y: [0, s * 1.05], xLabel: 'seconds, from ' + Math.round(s * 100) + ' cm', yLabel: 'level [m]', dots: obs.map(function (v, i) { return { x: Pd.ts[i], y: v, color: C.grey, r: 2.4 }; }), polys: Pd.laws.map(function (L, k) { return { pts: L.map(function (v, i) { return [Pd.ts[i], v]; }), color: TKCOL[k], width: 2.2 }; }) }, W, H); });
      root.setAttribute('data-exp', [p.data, s, miss.map(function (m) { return fx(m * 1000, 2); }).join(',')].join('|'));
      mark(3, p.data === 'top' && miss[0] <= lim && miss[1] > lim && miss[2] > lim);
    }
    ['noise'].forEach(function (k) { on(el[k], 'input', labels); on(el[k], 'change', run); });
    ['data', 'fluid', 'pipe', 'shuffle'].forEach(function (k) { on(el[k], 'change', run); });
    on(q(root, 'redraw'), 'click', function () { seed++; run(); });
    on(q(root, 'calib'), 'click', calibrate);
    on(q(root, 'runx'), 'click', runExperiment);
    labels(); run();
  }

  // ------------------------------------------------------------------ lab 10 · distil a black box (a projectile's range, R = v²·sin 2θ / g)
  var DSG = 9.81, DSR = Math.PI / 180, DSNOISE = [0, 0.01, 0.02, 0.05];
  function dsLaw(v, th) { return v * v * Math.sin(2 * th) / DSG; }
  function dsPts(r, n, vlo, vhi) { var o = []; for (var i = 0; i < n; i++) { var v = vlo + (vhi - vlo) * r(), th = (10 + 70 * r()) * DSR; o.push([v, th]); } return o; }
  function dsShots(seed, noise) { var r = rng(seed), P = dsPts(r, 400, 5, 20); return P.map(function (p) { return [p[0], p[1], dsLaw(p[0], p[1]) * (1 + noise * gauss(r))]; }); }
  function dsKnn(S, k) {   // average of the k nearest shots, in speed and angle scaled by their ranges
    var sv = 15, st = 70 * DSR;
    return function (v, th) { var best = []; for (var i = 0; i < S.length; i++) { var a = (S[i][0] - v) / sv, b = (S[i][1] - th) / st, d = a * a + b * b;
      if (best.length < k) { best.push([d, i]); best.sort(function (x, y) { return y[0] - x[0]; }); } else if (d < best[0][0]) { best[0] = [d, i]; best.sort(function (x, y) { return y[0] - x[0]; }); } }
      var m = 0; best.forEach(function (b2) { m += S[b2[1]][2]; }); return m / best.length; };
  }
  function dsPoly(S, deg) {
    var row = function (v, th) { var a = (v - 12.5) / 7.5, b = (th - 45 * DSR) / (35 * DSR), o = []; for (var i = 0; i <= deg; i++) for (var j = 0; i + j <= deg; j++) o.push(Math.pow(a, i) * Math.pow(b, j)); return o; };
    var c = lsq(S.map(function (s) { return row(s[0], s[1]); }), S.map(function (s) { return s[2]; }));
    return function (v, th) { var r = row(v, th), y = 0; for (var i = 0; i < r.length; i++) y += c[i] * r[i]; return y; };
  }
  var DSF = { '1': function () { return 1; }, 'sin θ': Math.sin, 'cos θ': Math.cos, 'sin 2θ': function (t) { return Math.sin(2 * t); }, 'sin θ·cos θ': function (t) { return Math.sin(t) * Math.cos(t); }, 'sin² θ': function (t) { return Math.sin(t) * Math.sin(t); }, 'θ': function (t) { return t; }, 'θ·(π/2 − θ)': function (t) { return t * (Math.PI / 2 - t); } };
  var DSA = [0.5, 1, 1.5, 2, 2.5, 3];
  function dsStudent(X, y) {   // c·v^a·f(θ): every power and function, c by least squares, the smallest relative error wins
    var best = null;
    DSA.forEach(function (a) { Object.keys(DSF).forEach(function (fn) { var f = DSF[fn], zz = 0, zy = 0, yy = 0, z = X.map(function (p) { return Math.pow(p[0], a) * f(p[1]); });
      z.forEach(function (zi, i) { zz += zi * zi; zy += zi * y[i]; yy += y[i] * y[i]; }); var c = zy / zz, e = 0; z.forEach(function (zi, i) { e += Math.pow(y[i] - c * zi, 2); }); e = Math.sqrt(e / yy);
      if (!best || e < best.e) best = { e: e, a: a, fn: fn, c: c }; }); });
    best.f = function (v, th) { return best.c * Math.pow(v, best.a) * DSF[best.fn](th); }; best.z = function (v, th) { return Math.pow(v, best.a) * DSF[best.fn](th); };
    best.isLaw = best.a === 2 && (best.fn === 'sin 2θ' || best.fn === 'sin θ·cos θ'); return best;
  }
  function dsRel(P, f, g) { var s = 0; P.forEach(function (p) { var t = g(p[0], p[1]); s += Math.pow((f(p[0], p[1]) - t) / t, 2); }); return Math.sqrt(s / P.length); }
  function dsRun(o, seed) {
    var S = dsShots(seed, o.noise), T = o.teacher === 'poly' ? dsPoly(S, 4) : dsKnn(S, 8), r = rng(seed * 31 + 7), TEin = dsPts(r, 400, 5, 20), TEout = dsPts(r, 400, 20, 30);
    var Q = o.query === 'data' ? S.map(function (x) { return [x[0], x[1]]; }) : dsPts(r, 1000, 5, o.query === 'wide' ? 30 : 20), yq = o.query === 'data' ? S.map(function (x) { return x[2]; }) : Q.map(function (p) { return T(p[0], p[1]); });
    var st = dsStudent(Q, yq), R = { S: S, T: T, st: st, tIn: dsRel(TEin, T, dsLaw), tOut: dsRel(TEout, T, dsLaw), fid: o.query === 'data' ? NaN : dsRel(Q, st.f, T), aIn: dsRel(TEin, st.f, dsLaw), aOut: dsRel(TEout, st.f, dsLaw) };
    var raw = lsq(S.map(function (x) { return [1, x[0], x[1]]; }), S.map(function (x) { return x[2]; })), sym = lsq(S.map(function (x) { return [1, st.z(x[0], x[1])]; }), S.map(function (x) { return x[2]; }));
    var fr = function (v, th) { return raw[0] + raw[1] * v + raw[2] * th; }, fs = function (v, th) { return sym[0] + sym[1] * st.z(v, th); };
    R.rawIn = dsRel(TEin, fr, dsLaw); R.rawOut = dsRel(TEout, fr, dsLaw); R.symIn = dsRel(TEin, fs, dsLaw); R.symOut = dsRel(TEout, fs, dsLaw);
    return R;
  }
  function dsLawStr(st) { var p = st.a === 1 ? '' : st.a === 2 ? '²' : st.a === 3 ? '³' : '^' + st.a; return 'R = ' + st.c.toFixed(4) + '·v' + p + (st.fn === '1' ? '' : '·' + st.fn); }
  function dsPc(x) { return !isFinite(x) ? '–' : x < 0.001 ? '< 0.1%' : x < 0.1 ? fx(x * 100, 1) + '%' : fx(x * 100, 0) + '%'; }
  function distLab(root) {
    var el = { teacher: q(root, 'teacher'), noise: q(root, 'noise'), query: q(root, 'query') }, done = [false, false, false, false], seed = 1;
    function mark(i, ok) { if (ok) done[i] = true; var li = root.querySelector('[data-ch="' + i + '"]'); if (li) li.classList.toggle('is-done', done[i]); }
    function o() { return { teacher: el.teacher.value, noise: DSNOISE[+el.noise.value], query: el.query.value }; }
    function labels() { var p = o(); set(q(root, 'noise-out'), p.noise === 0 ? 'none' : (p.noise * 100) + '%'); }
    function run() {
      var p = o(), R = dsRun(p, seed), st = R.st, th45 = 45 * DSR;
      set(q(root, 'law'), 'Student: ' + dsLawStr(st) + (st.fn === 'sin θ·cos θ' ? ' = ' + fx(st.c / 2, 4) + '·v²·sin 2θ' : '') + (st.isLaw ? '  (the true law has 1/g = ' + fx(1 / DSG, 4) + ')' : ''));
      set(q(root, 'teach'), dsPc(R.tIn) + ' / ' + dsPc(R.tOut)); set(q(root, 'fid'), p.query === 'data' ? 'no teacher' : dsPc(R.fid));
      set(q(root, 'ain'), dsPc(R.aIn)); set(q(root, 'aout'), dsPc(R.aOut));
      set(q(root, 'raw'), dsPc(R.rawIn) + ' / ' + dsPc(R.rawOut)); set(q(root, 'sym'), dsPc(R.symIn) + ' / ' + dsPc(R.symOut));
      var curves = [{ f: function (v) { return dsLaw(v, th45); }, color: C.grey, width: 5 }, { f: function (v) { return R.T(v, th45); }, color: C.purple, width: 2.4 }, { f: function (v) { return st.f(v, th45); }, color: C.orange, width: 2.4, dash: '7 5' }];
      var dots = R.S.filter(function (x) { return Math.abs(x[1] - th45) < 4 * DSR; }).map(function (x) { return { x: x[0], y: x[2], color: C.ink, r: 2.6 }; });
      render(q(root, 'chart'), function (W, H) { return xyChart({ id: 101, x: [5, 30], y: [0, 100], shade: [5, 20], xLabel: 'speed [m/s], at 45°', yLabel: 'range [m]', curves: curves, dots: dots }, W, H); });
      root.setAttribute('data-ds', [p.teacher, p.noise, p.query, st.a, st.fn, fx(st.c, 4), st.isLaw ? 1 : 0, fx(R.tIn, 4), fx(R.tOut, 4), fx(R.fid, 4), fx(R.aIn, 4), fx(R.aOut, 4), fx(R.rawOut, 4), fx(R.symOut, 4)].join('|'));
      mark(0, p.query !== 'data' && st.isLaw && R.aIn < 0.02);
      mark(1, p.query !== 'data' && R.aIn < R.tIn);
      mark(2, p.query === 'wide' && R.aOut > 0.10);
      mark(3, p.query !== 'data' && R.symOut < 0.01 && R.rawOut > 0.20);
      set(q(root, 'status'), el.teacher.options[el.teacher.selectedIndex].text + ' · noise ' + (p.noise * 100) + '% · ' + el.query.options[el.query.selectedIndex].text + ' · shots #' + seed + '.');
      root.setAttribute('data-ready', '1');
    }
    on(el.noise, 'input', labels); on(el.noise, 'change', run); on(el.teacher, 'change', run); on(el.query, 'change', run);
    on(q(root, 'redraw'), 'click', function () { seed++; run(); });
    labels(); run();
  }

  // ------------------------------------------------------------------ start the labs on this page
  window.SrLabs = { rng: rng, gauss: gauss, polyFit: polyFit, golden: golden, rmse: rmse, vLin: vLin, vQua: vQua, fallData: fallData, curveFit: curveFit, keplerFit: keplerFit, PLANETS: PLANETS, K2: K2, parse: parse, fmt: fmt, prefix: prefix, postfix: postfix, stats: stats, units: units, unitStr: unitStr, compare: compare, unitCount: unitCount, mutate: mutate, inferFree: inferFree, nullSpace: nullSpace, groupStr: groupStr, tankRuns: tankRuns, rungs: rungs, levelData: levelData, softCubic: softCubic, arenaData: arenaData, runSearch: runSearch, enumOrder: enumOrder, pendData: pendData, scatter6: scatter6, corrFit: corrFit, envelope6: envelope6, pRatio: pRatio , fieldSearch: fieldSearch, fLaw: fLaw, fClean: fClean, FTRUE: FTRUE, tkAnalyse: tkAnalyse, tkPredict: tkPredict, tkData: tkData, dsRun: dsRun, dsLaw: dsLaw };   // used by the automated lab checks
  var LABS = { curve: curveLab, expr: exprLab, units: unitsLab, arena: arenaLab, deriv: derivLab, collapse: collapseLab, dynamics: dynLab, field: fieldLab, stress: stressLab, distill: distLab };
  document.querySelectorAll('[data-srx]').forEach(function (root) {
    var f = LABS[root.getAttribute('data-srx')];
    if (!f) return;
    try { f(root); } catch (e) { if (window.console) console.error('sr-labs (' + root.id + '):', e); }
  });
})();
