/* Interactive labs of the RL course (rl-course/lecture-NN/, made by tools/build_rl_course.py).
   One file, seven labs; each starts only when its root element ([data-rlx="..."]) is on the page.
   Markup: tools/templates/rl-course-lab-*.html. Styles: css/rl-labs.css on top of css/exploration-lab.css.
   Everything runs in the browser; numbers shown are from the visitor's own runs. */
(function () {
  'use strict';

  var C = { blue: '#2563eb', navy: '#1e3a8a', rose: '#e11d48', wine: '#9f1239', green: '#059669', grey: '#94a3b8', amber: '#d97706', ink: '#111827', muted: '#64748b' };
  var FONT = 'Inter, system-ui, sans-serif';

  // ------------------------------------------------------------------ helpers
  function q(root, k) { return root.querySelector('[data-k="' + k + '"]'); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function randint(n) { return Math.floor(Math.random() * n); }
  function randn() { var u = 0; while (u === 0) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(x, d) { return (x === null || x === undefined || !isFinite(x)) ? '–' : Number(x).toFixed(d === undefined ? 2 : d); }
  function set(el, text) { if (el) el.textContent = text; }
  function html(el, s) { if (el) el.innerHTML = s; }
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }
  function sci(x) {
    if (x === null || !isFinite(x)) return '–';
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 0.001 && a < 100000) return String(+x.toPrecision(3));
    var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
    return (+m.toFixed(1)) + ' × 10' + sup(e);
  }
  function range(root, k, show, cb) {
    var el = q(root, k), out = q(root, k + '-out');
    function upd() { set(out, show(+el.value)); }
    on(el, 'input', function () { upd(); if (cb) cb(+el.value); });
    upd();
    return el;
  }
  function hexRGB(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var HEAT = ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'].map(hexRGB);
  function heatRGB(t) {
    t = clamp(t, 0, 1);
    var n = HEAT.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i, a = HEAT[i], b = HEAT[i + 1];
    return [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
  }
  function heat(t) { var c = heatRGB(t); return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  function legend(el, items) {
    html(el, items.map(function (x) { return '<span class="line-swatch' + (x.dash ? ' is-dash' : '') + '" style="--swatch:' + x.color + '">' + esc(x.name) + '</span>'; }).join(''));
  }

  // ------------------------------------------------------------------ SVG drawing, re-drawn at the element's real size
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
      '" font-family="' + FONT + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.rotate ? ' transform="rotate(-90 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"' : '') + '>' + esc(s) + '</text>';
  }
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) { hi = lo + 1; }
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, t = [];
    for (var v = a; v <= b + step * 1e-6; v += step) t.push(+v.toFixed(10));
    return { lo: a, hi: b, ticks: t };
  }
  function tickLabel(v) { var a = Math.abs(v); return a >= 10000 ? (v / 1000).toFixed(0) + 'k' : a >= 1000 ? v.toLocaleString('en-US') : String(+v.toPrecision(4)); }
  function powLabel(e) { return e >= 0 && e <= 4 ? String(Math.pow(10, e)) : e === -1 ? '0.1' : e === -2 ? '0.01' : '10' + sup(e); }

  /* o: {series:[{y, x?, color, width?, dash?, dots?}], log?, x0?, xMin?, xMax?, yMin?, yMax?, zero?, yMinLog?, xTicks?:[{x,label}], xLabel?, yLabel?, marks?:[x], empty?} */
  function lineChart(o, W, H) {
    var pl = o.yLabel ? 58 : 46, pr = 14, pt = 12, pb = o.xLabel ? 40 : 26;
    var iw = W - pl - pr, ih = H - pt - pb, x0 = o.x0 === undefined ? 1 : o.x0;
    var S = (o.series || []).filter(function (s) { return s.y && s.y.length; });
    var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    S.forEach(function (s) {
      for (var i = 0; i < s.y.length; i++) {
        var v = s.y[i];
        if (v === null || !isFinite(v) || (o.log && v <= 0) || (o.log && o.yMinLog !== undefined && v < Math.pow(10, o.yMinLog))) continue;
        var x = s.x ? s.x[i] : i + x0;
        if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (v < ymin) ymin = v; if (v > ymax) ymax = v;
      }
    });
    if (!isFinite(ymin)) return txt(W / 2, H / 2, o.empty || 'Nothing to show yet', { size: 13 });
    if (o.xMin !== undefined) xmin = o.xMin;
    if (o.xMax !== undefined) xmax = Math.max(o.xMax, xmax);
    if (!(xmax > xmin)) xmax = xmin + 1;
    var Y, ticks = [], out = [];
    if (o.log) {
      var lo = Math.floor(Math.log10(ymin)), hi = Math.ceil(Math.log10(ymax));
      if (o.yMinLog !== undefined) lo = Math.max(lo, o.yMinLog);
      if (hi <= lo) hi = lo + 1;
      var st = Math.max(1, Math.ceil((hi - lo) / 5));
      for (var e = lo; e <= hi; e += st) ticks.push({ v: e, label: powLabel(e) });
      Y = function (v) { return pt + ih * (1 - (Math.log10(Math.max(v, Math.pow(10, lo))) - lo) / (hi - lo)); };
      ticks.forEach(function (t) { t.y = pt + ih * (1 - (t.v - lo) / (hi - lo)); });
    } else {
      var a = o.yMin !== undefined ? o.yMin : (o.zero ? Math.min(0, ymin) : ymin), b = o.yMax !== undefined ? o.yMax : (o.zero ? Math.max(0, ymax) : ymax);
      if (!(b > a)) { b = a + 1; }
      var nt = niceTicks(a, b, 5);
      if (o.yMin !== undefined) nt.lo = o.yMin;
      if (o.yMax !== undefined) nt.hi = o.yMax;
      Y = function (v) { return pt + ih * (1 - (v - nt.lo) / (nt.hi - nt.lo)); };
      nt.ticks.forEach(function (v) { if (v >= nt.lo - 1e-9 && v <= nt.hi + 1e-9) ticks.push({ y: Y(v), label: o.yFormat ? o.yFormat(v) : tickLabel(v) }); });
    }
    var X = function (x) { return pl + iw * (x - xmin) / (xmax - xmin); };
    ticks.forEach(function (t) {
      out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + t.y.toFixed(1) + '" y2="' + t.y.toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>');
      out.push(txt(pl - 8, t.y + 4, t.label, { anchor: 'end' }));
    });
    var xt = o.xTicks;
    if (!xt) {
      var nx = niceTicks(xmin, xmax, Math.max(2, Math.min(6, Math.floor(iw / 80))));
      xt = nx.ticks.filter(function (v) { return v >= xmin - 1e-9 && v <= xmax + 1e-9 && (!o.xInt || Math.abs(v - Math.round(v)) < 1e-9); }).map(function (v) { return { x: v, label: tickLabel(v) }; });
    }
    xt.forEach(function (t) { out.push(txt(X(t.x), H - pb + 16, t.label)); });
    out.push('<line x1="' + pl + '" x2="' + pl + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/>');
    out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" stroke="rgba(100,116,139,.7)"/>');
    if (o.xLabel) out.push(txt(pl + iw / 2, H - 4, o.xLabel, { fill: '#475569' }));
    if (o.yLabel) out.push(txt(13, pt + ih / 2, o.yLabel, { fill: '#475569', rotate: true }));
    (o.marks || []).forEach(function (m) {
      if (m < xmin || m > xmax) return;
      out.push('<line x1="' + X(m).toFixed(1) + '" x2="' + X(m).toFixed(1) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + C.amber + '" stroke-width="1.2" stroke-dasharray="2 3"/>');
    });
    S.forEach(function (s) {
      var n = s.y.length, stride = Math.max(1, Math.floor(n / (iw * 1.5))), d = '', pen = false, dots = '';
      for (var i = 0; i < n; i++) {
        if (stride > 1 && i % stride && i !== n - 1) continue;
        var v = s.y[i], x = s.x ? s.x[i] : i + x0;
        var ok = v !== null && isFinite(v) && !(o.log && v <= 0) && !(o.log && o.yMinLog !== undefined && v < Math.pow(10, o.yMinLog));
        if (!ok) { pen = false; continue; }
        var px = X(x).toFixed(1), py = Y(v).toFixed(1);
        d += (pen ? 'L' : 'M') + px + ' ' + py + ' ';
        pen = true;
        if (s.dots) dots += '<circle cx="' + px + '" cy="' + py + '" r="' + (s.r || 3.2) + '" fill="' + s.color + '"/>';
      }
      if (d) out.push('<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + '/>');
      out.push(dots);
    });
    return out.join('');
  }
  function chart(svg, o) { render(svg, function (W, H) { return lineChart(o, W, H); }); }

  // ================================================================== 1. Dynamic programming (Lecture 3)
  function dpLab(root) {
    var el = {};
    ['mode', 'size', 'board', 'chart', 'status', 'sweeps', 'delta', 'changed', 'improve', 'run', 'step', 'reset', 'clear'].forEach(function (k) { el[k] = q(root, k); });
    var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1], ARW = ['↑', '→', '↓', '←'], UNIF = [0.25, 0.25, 0.25, 0.25], THETA = 1e-4;
    var n, N, walls, V, pol, sweeps, deltas, marks, lastChange, improvements, done, timer = null, prevKey, cells = [];
    var gamma = range(root, 'gamma', function (v) { return v.toFixed(2); }, function () { reset(); });
    var slip = range(root, 'slip', function (v) { return v.toFixed(2); }, function () { reset(); });

    function isTerm(s) { return s === 0 || s === N - 1; }
    function move(s, a) {
      var r = Math.floor(s / n) + DR[a], c = s % n + DC[a];
      if (r < 0 || r >= n || c < 0 || c >= n) return s;
      var t = r * n + c;
      return walls[t] ? s : t;
    }
    function qsa(s, a, Vv) {
      var g = +gamma.value, p = +slip.value, outs = [[a, 1 - p], [(a + 1) % 4, p / 2], [(a + 3) % 4, p / 2]], tot = 0;
      for (var i = 0; i < 3; i++) { if (outs[i][1] <= 0) continue; var t = move(s, outs[i][0]); tot += outs[i][1] * (-1 + g * Vv[t]); }
      return tot;
    }
    function greedy(s) {
      var qs = [0, 1, 2, 3].map(function (a) { return qsa(s, a, V); }), best = Math.max.apply(null, qs);
      return [0, 1, 2, 3].filter(function (a) { return qs[a] >= best - 1e-6 * Math.max(1, Math.abs(best)); });
    }
    function arrows(s) { return el.mode.value === 'pi' ? [0, 1, 2, 3].filter(function (a) { return pol[s][a] > 0; }) : greedy(s); }
    function key() { var k = ''; for (var s = 0; s < N; s++) if (!isTerm(s) && !walls[s]) k += arrows(s).join('') + '|'; return k; }
    function trapped() { // open cells that can never reach an exit
      var reach = new Uint8Array(N), changed = true, p = +slip.value;
      reach[0] = reach[N - 1] = 1;
      while (changed) {
        changed = false;
        for (var s = 0; s < N; s++) {
          if (reach[s] || walls[s]) continue;
          for (var a = 0; a < 4 && !reach[s]; a++) {
            var outs = p > 0 ? [a, (a + 1) % 4, (a + 3) % 4] : [a];
            for (var i = 0; i < outs.length; i++) if (reach[move(s, outs[i])]) { reach[s] = 1; changed = true; break; }
          }
        }
      }
      var c = 0;
      for (s = 0; s < N; s++) if (!walls[s] && !reach[s]) c++;
      return c;
    }
    function build() {
      n = +el.size.value; N = n * n; walls = new Uint8Array(N); cells = [];
      el.board.style.gridTemplateColumns = 'repeat(' + n + ', minmax(0, 1fr))';
      el.board.innerHTML = '';
      for (var s = 0; s < N; s++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'rlx-cell'; b.dataset.s = s;
        b.innerHTML = '<span class="v"></span><span class="a"></span>';
        el.board.appendChild(b); cells.push(b);
      }
      reset();
    }
    function stop() { if (timer) { clearTimeout(timer); timer = null; } if (el.run) el.run.innerHTML = '<i class="ri-play-circle-line" aria-hidden="true"></i>Run'; }
    function reset() {
      stop();
      V = new Float64Array(N); pol = []; for (var s = 0; s < N; s++) pol.push(UNIF.slice());
      sweeps = 0; deltas = []; marks = []; lastChange = 0; improvements = 0; done = false; prevKey = key();
      var tr = trapped();
      html(el.status, tr && +gamma.value > 0.999 ? '<b>Careful:</b> ' + tr + ' cell' + (tr > 1 ? 's are' : ' is') + ' walled off from both exits. With γ = 1 their values keep falling for ever; lower γ or remove a wall.'
        : 'Values start at 0. Press <b>One sweep</b>, or <b>Run</b>.');
      draw();
    }
    function sweep() {
      if (done) return false;
      var mode = el.mode.value, Vn = new Float64Array(N), d = 0, s, a;
      for (s = 0; s < N; s++) {
        if (isTerm(s) || walls[s]) continue;
        var v;
        if (mode === 'vi') { v = -Infinity; for (a = 0; a < 4; a++) v = Math.max(v, qsa(s, a, V)); }
        else { v = 0; var pi = mode === 'pi' ? pol[s] : UNIF; for (a = 0; a < 4; a++) if (pi[a]) v += pi[a] * qsa(s, a, V); }
        Vn[s] = v; d = Math.max(d, Math.abs(v - V[s]));
      }
      V = Vn; sweeps++; deltas.push(d);
      var k = key();
      if (k !== prevKey) { lastChange = sweeps; prevKey = k; }
      var msg = null, cap = trapped() && +gamma.value > 0.999 ? 300 : 5000;
      if (d < THETA) {
        if (mode === 'pi') {
          var changed = false;
          for (s = 0; s < N; s++) {
            if (isTerm(s) || walls[s]) continue;
            var best = greedy(s), np = [0, 0, 0, 0];
            best.forEach(function (b) { np[b] = 1 / best.length; });
            if (np.join() !== pol[s].join()) changed = true;
            pol[s] = np;
          }
          if (changed) { improvements++; marks.push(sweeps); prevKey = key(); lastChange = sweeps; msg = 'Values of the current policy settled (Δ < 10⁻⁴), so the policy was made greedy: <b>improvement ' + improvements + '</b>. Now it is evaluated again.'; }
          else { done = true; msg = '<b>Policy is stable</b> after ' + improvements + ' improvement' + (improvements === 1 ? '' : 's') + ' and ' + sweeps + ' sweeps: greedy with respect to its own values, so it is optimal.'; }
        } else {
          done = true;
          msg = mode === 'vi' ? '<b>Converged</b> after ' + sweeps + ' sweeps (Δ < 10⁻⁴): these are v*, and the arrows show an optimal policy.'
            : '<b>Converged</b> after ' + sweeps + ' sweeps (Δ < 10⁻⁴): these are the values of the random policy. The arrows are greedy with respect to them: one step of policy improvement.';
        }
      } else if (sweeps >= cap) {
        done = true;
        msg = cap === 300 ? 'Stopped after 300 sweeps: some cells are walled off from both exits, and with γ = 1 their values never settle.' : 'Stopped after ' + cap + ' sweeps.';
      }
      if (msg) html(el.status, msg);
      else if (sweeps === 1) html(el.status, 'After one sweep every open cell is −1: one step, and nothing else is known yet. Keep sweeping.');
      draw();
      return !done;
    }
    function draw() {
      var vmin = 0, s;
      for (s = 0; s < N; s++) if (!walls[s] && V[s] < vmin) vmin = V[s];
      for (s = 0; s < N; s++) {
        var c = cells[s], vEl = c.firstChild, aEl = c.lastChild;
        c.className = 'rlx-cell' + (isTerm(s) ? ' is-term' : walls[s] ? ' is-wall' : '');
        if (isTerm(s)) { vEl.textContent = 'exit'; aEl.textContent = ''; c.style.background = ''; c.style.color = ''; c.setAttribute('aria-label', 'Exit'); continue; }
        if (walls[s]) { vEl.textContent = 'wall'; aEl.textContent = ''; c.style.background = ''; c.style.color = ''; c.setAttribute('aria-label', 'Wall: click to remove'); continue; }
        var t = vmin < 0 ? V[s] / vmin : 0;
        c.style.background = heat(0.04 + 0.9 * t);
        c.style.color = t > 0.55 ? '#fff' : C.ink;
        vEl.textContent = Math.abs(V[s]) >= 100 ? V[s].toFixed(0) : V[s].toFixed(1);
        aEl.textContent = arrows(s).map(function (a) { return ARW[a]; }).join('');
        c.setAttribute('aria-label', 'Value ' + vEl.textContent + ', arrows ' + aEl.textContent + '. Click to add a wall.');
      }
      set(el.sweeps, sweeps);
      set(el.delta, deltas.length ? sci(deltas[deltas.length - 1]) : '–');
      set(el.changed, lastChange ? 'sweep ' + lastChange : '–');
      set(el.improve, el.mode.value === 'pi' ? improvements : '–');
      chart(el.chart, { series: [{ y: deltas, color: C.blue, dots: deltas.length < 40 }], log: true, yMinLog: -6, marks: marks, xInt: true, xLabel: 'sweep', empty: 'Run a sweep to see Δ' });
    }
    function run() {
      if (timer) { stop(); return; }
      if (done) reset();
      el.run.innerHTML = '<i class="ri-pause-circle-line" aria-hidden="true"></i>Pause';
      (function tick() {
        var per = Math.max(1, Math.floor(sweeps / 25)), go = true;
        for (var i = 0; i < per && go; i++) go = sweep();
        if (go) timer = setTimeout(tick, 110); else stop();
      })();
    }
    on(el.step, 'click', function () { stop(); if (done) reset(); sweep(); });
    on(el.run, 'click', run);
    on(el.reset, 'click', reset);
    on(el.clear, 'click', function () { walls = new Uint8Array(N); reset(); });
    on(el.mode, 'change', reset);
    on(el.size, 'change', build);
    on(el.board, 'click', function (ev) {
      var c = ev.target.closest('.rlx-cell');
      if (!c) return;
      var s = +c.dataset.s;
      if (isTerm(s)) return;
      walls[s] = walls[s] ? 0 : 1;
      reset();
    });
    build();
  }

  // ================================================================== 2. Contraction (Lecture 4)
  function contractionLab(root) {
    var el = {};
    ['op', 'chart', 'bars', 'status', 'k', 'dist', 'ratio', 'worst', 'step', 'step10', 'starts', 'mdp'].forEach(function (k) { el[k] = q(root, k); });
    var S = 6, A = 2, P, R, PI, u0, w0, u, w, vstar, k, dist, distStar, last, worst;
    var gamma = range(root, 'gamma', function (v) { return v.toFixed(2); }, function () { restart(); });

    function newMDP() {
      P = []; R = []; PI = [];
      for (var s = 0; s < S; s++) {
        P.push([]); R.push([]);
        for (var a = 0; a < A; a++) {
          var row = [], m = 1 + randint(3), tot = 0, i;
          for (i = 0; i < S; i++) row.push(0);
          for (i = 0; i < m; i++) row[randint(S)] += 0.1 + Math.random();
          for (i = 0; i < S; i++) tot += row[i];
          P[s].push(row.map(function (x) { return x / tot; }));
          R[s].push(Math.round((Math.random() * 2 - 1) * 10) / 10);
        }
        var p0 = 0.2 + 0.6 * Math.random();
        PI.push([p0, 1 - p0]);
      }
    }
    function T(v) {
      var g = +gamma.value, opt = el.op.value === 'opt', out = [];
      for (var s = 0; s < S; s++) {
        var best = -Infinity, avg = 0;
        for (var a = 0; a < A; a++) {
          var qv = R[s][a];
          for (var t = 0; t < S; t++) qv += g * P[s][a][t] * v[t];
          if (qv > best) best = qv;
          avg += PI[s][a] * qv;
        }
        out.push(opt ? best : avg);
      }
      return out;
    }
    function norm(a, b) { var m = 0; for (var i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; }
    function randVec() { var v = []; for (var i = 0; i < S; i++) v.push(Math.round((Math.random() * 40 - 20) * 10) / 10); return v; }
    function restart() {
      var v = [0, 0, 0, 0, 0, 0];
      for (var i = 0; i < 20000; i++) { var nv = T(v), d = norm(nv, v); v = nv; if (d < 1e-13) break; }
      vstar = v; u = u0.slice(); w = w0.slice(); k = 0; dist = [norm(u, w)]; distStar = [norm(u, vstar)]; last = null; worst = 0;
      html(el.status, 'u₀ and w₀ start ' + fmt(dist[0], 1) + ' apart (largest gap over the six states). Press <b>Apply once</b>.');
      draw();
    }
    function apply(times) {
      for (var i = 0; i < times; i++) {
        var d0 = norm(u, w);
        u = T(u); w = T(w); k++;
        var d1 = norm(u, w);
        dist.push(d1); distStar.push(norm(u, vstar));
        if (d0 > 1e-9) { last = d1 / d0; worst = Math.max(worst, last); }
      }
      var g = +gamma.value, bound = dist[0] * Math.pow(g, k), d = dist[dist.length - 1];
      html(el.status, d < 1e-9 ? 'After ' + k + ' steps u and w agree to nine decimal places: both have reached the same fixed point, whatever they started from.'
        : 'After ' + k + ' step' + (k === 1 ? '' : 's') + ' the gap is <b>' + sci(d) + '</b>; the bound γᵏ ‖u₀ − w₀‖∞ allows ' + sci(bound) + '. Every ratio so far is at most ' + fmt(worst, 3) + ' ≤ γ = ' + g.toFixed(2) + '.' +
          (last !== null && last > g - 0.002 ? ' The ratio is now γ itself: what is left of the gap is almost the same in every state, and T shrinks a constant shift by exactly γ.' : ''));
      draw();
    }
    function draw() {
      var g = +gamma.value, xs = [], bound = [];
      for (var i = 0; i <= k; i++) { xs.push(i); bound.push(dist[0] * Math.pow(g, i)); }
      set(el.k, k);
      set(el.dist, sci(dist[dist.length - 1]));
      set(el.ratio, last === null ? '–' : fmt(last, 3));
      set(el.worst, last === null ? '–' : fmt(worst, 3) + ' ≤ ' + g.toFixed(2));
      chart(el.chart, {
        series: [{ x: xs, y: bound, color: C.grey, dash: '6 4', width: 1.8 }, { x: xs, y: distStar, color: C.green, width: 1.8 }, { x: xs, y: dist, color: C.blue, dots: k < 40 }],
        log: true, yMinLog: -12, x0: 0, xMin: 0, xMax: Math.max(5, k), xInt: true, xLabel: 'steps k'
      });
      render(el.bars, function (W, H) {
        var pl = 40, pr = 10, pt = 12, pb = 26, iw = W - pl - pr, ih = H - pt - pb, all = u.concat(w, vstar, [0]);
        var nt = niceTicks(Math.min.apply(null, all), Math.max.apply(null, all), 5), out = [];
        var Y = function (v) { return pt + ih * (1 - (v - nt.lo) / (nt.hi - nt.lo)); };
        nt.ticks.forEach(function (t) { out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>' + txt(pl - 6, Y(t) + 4, tickLabel(t), { anchor: 'end' })); });
        out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(100,116,139,.8)"/>');
        var gw = iw / S, bw = Math.min(26, gw * 0.3);
        for (var s = 0; s < S; s++) {
          var cx = pl + gw * (s + 0.5);
          [[u[s], C.blue, -1], [w[s], C.rose, 1]].forEach(function (b) {
            var y0 = Y(0), y1 = Y(b[0]), x = cx + (b[2] < 0 ? -bw - 1 : 1);
            out.push('<rect x="' + x.toFixed(1) + '" y="' + Math.min(y0, y1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Math.abs(y1 - y0)).toFixed(1) + '" rx="3" fill="' + b[1] + '" fill-opacity=".8"/>');
          });
          out.push('<line x1="' + (cx - bw - 6).toFixed(1) + '" x2="' + (cx + bw + 6).toFixed(1) + '" y1="' + Y(vstar[s]).toFixed(1) + '" y2="' + Y(vstar[s]).toFixed(1) + '" stroke="' + C.green + '" stroke-width="3" stroke-linecap="round"/>');
          out.push(txt(cx, H - 8, 's' + (s + 1)));
        }
        return out.join('');
      });
    }
    on(el.step, 'click', function () { apply(1); });
    on(el.step10, 'click', function () { apply(10); });
    on(el.starts, 'click', function () { u0 = randVec(); w0 = randVec(); restart(); });
    on(el.mdp, 'click', function () { newMDP(); restart(); });
    on(el.op, 'change', restart);
    newMDP(); u0 = randVec(); w0 = randVec(); restart();
  }

  // ================================================================== 3. TD vs Monte Carlo (Lecture 5)
  function tdmcLab(root) {
    var el = {};
    ['est', 'err', 'errsub', 'eps', 'rmstd', 'rmsmc', 'last', 'walk', 'path', 'ep1', 'ep10', 'ep100', 'reset', 'avg'].forEach(function (k) { el[k] = q(root, k); });
    var NAMES = ['A', 'B', 'C', 'D', 'E'], TRUE = [1, 2, 3, 4, 5].map(function (x) { return x / 6; });
    var atd = range(root, 'atd', function (v) { return v.toFixed(2); });
    var amc = range(root, 'amc', function (v) { return v.toFixed(2); });
    var Vtd, Vmc, eps, errTD, errMC, view = 'run', avgTD = null, avgMC = null, avgNote = '', anim = 0;
    var dots = el.walk ? el.walk.querySelectorAll('span') : [];

    function episode() {
      var s = 2, path = [2];
      for (;;) {
        s += Math.random() < 0.5 ? -1 : 1;
        if (s < 0) return { path: path, r: 0 };
        if (s > 4) return { path: path, r: 1 };
        path.push(s);
      }
    }
    function learn(Vt, Vm, e, at, am) {
      var p = e.path, i;
      for (i = 0; i < p.length; i++) { var last = i === p.length - 1; Vt[p[i]] += at * ((last ? e.r : 0) + (last ? 0 : Vt[p[i + 1]]) - Vt[p[i]]); }
      for (i = 0; i < p.length; i++) Vm[p[i]] += am * (e.r - Vm[p[i]]);
    }
    function rms(V) { var s = 0; for (var i = 0; i < 5; i++) s += (V[i] - TRUE[i]) * (V[i] - TRUE[i]); return Math.sqrt(s / 5); }
    function reset() {
      anim++;
      Vtd = [0.5, 0.5, 0.5, 0.5, 0.5]; Vmc = Vtd.slice(); eps = 0; errTD = [rms(Vtd)]; errMC = [rms(Vmc)]; view = 'run';
      html(el.path, 'Press <b>1 episode</b> to watch a walk.');
      for (var i = 0; i < dots.length; i++) dots[i].classList.remove('is-on');
      set(el.last, '–');
      draw();
    }
    function describe(e) {
      return e.path.map(function (s) { return NAMES[s]; }).join(' → ') + ' → ' + (e.r ? 'right exit: reward 1' : 'left exit: reward 0') + ' (' + e.path.length + ' steps)';
    }
    function run(n) {
      anim++;
      view = 'run';
      var e;
      for (var i = 0; i < n; i++) {
        e = episode(); learn(Vtd, Vmc, e, +atd.value, +amc.value); eps++;
        errTD.push(rms(Vtd)); errMC.push(rms(Vmc));
      }
      set(el.last, e.path.length + ' steps, ' + (e.r ? '+1' : '0'));
      if (n === 1) animate(e); else { set(el.path, (n > 1 ? 'Last of ' + n + ': ' : '') + describe(e)); lightOff(); }
      draw();
    }
    function lightOff() { for (var i = 0; i < dots.length; i++) dots[i].classList.remove('is-on'); }
    function animate(e) {
      var tok = ++anim, seq = e.path.concat([e.r ? 5 : -1]), i = 0;
      set(el.path, '…');
      (function stepA() {
        if (tok !== anim) return;
        lightOff();
        var s = seq[i];
        if (dots[s + 1]) dots[s + 1].classList.add('is-on');
        i++;
        if (i < seq.length) setTimeout(stepA, Math.max(90, Math.min(260, 3200 / seq.length)));
        else set(el.path, describe(e));
      })();
    }
    function average() {
      var runs = 100, n = 100, sT = new Float64Array(n + 1), sM = new Float64Array(n + 1), at = +atd.value, am = +amc.value;
      for (var r = 0; r < runs; r++) {
        var vt = [0.5, 0.5, 0.5, 0.5, 0.5], vm = vt.slice();
        sT[0] += rms(vt); sM[0] += rms(vm);
        for (var i = 1; i <= n; i++) { learn(vt, vm, episode(), at, am); sT[i] += rms(vt); sM[i] += rms(vm); }
      }
      avgTD = Array.prototype.map.call(sT, function (x) { return x / runs; });
      avgMC = Array.prototype.map.call(sM, function (x) { return x / runs; });
      avgNote = 'Average of 100 runs of 100 episodes, α = ' + at.toFixed(2) + ' for TD and ' + am.toFixed(2) + ' for Monte Carlo (your browser’s runs).';
      view = 'avg';
      draw();
    }
    function draw() {
      set(el.eps, eps);
      set(el.rmstd, fmt(rms(Vtd), 3));
      set(el.rmsmc, fmt(rms(Vmc), 3));
      var xt = NAMES.map(function (nm, i) { return { x: i + 1, label: nm }; });
      chart(el.est, { series: [{ y: TRUE, color: C.grey, dash: '6 4', dots: true, r: 2.5, width: 1.6 }, { y: Vtd, color: C.blue, dots: true }, { y: Vmc, color: C.rose, dots: true }],
        yMin: 0, yMax: 1, xTicks: xt, xMin: 0.7, xMax: 5.3, xLabel: 'state' });
      var a = view === 'avg';
      set(el.errsub, a ? avgNote : 'Your run, one episode at a time.');
      chart(el.err, { series: [{ y: a ? avgTD : errTD, color: C.blue }, { y: a ? avgMC : errMC, color: C.rose }], x0: 0, xMin: 0, xMax: a ? 100 : Math.max(10, eps), yMin: 0, xInt: true, xLabel: 'episodes', zero: true });
    }
    on(el.ep1, 'click', function () { run(1); });
    on(el.ep10, 'click', function () { run(10); });
    on(el.ep100, 'click', function () { run(100); });
    on(el.reset, 'click', reset);
    on(el.avg, 'click', average);
    reset();
  }

  // ================================================================== 4. Mountain Car with tile coding (Lecture 7)
  function carLab(root) {
    var el = {};
    ['tilings', 'hill', 'map', 'chart', 'status', 'eps', 'steps', 'best', 'feat', 'ep1', 'ep10', 'ep100', 'reset', 'replay'].forEach(function (k) { el[k] = q(root, k); });
    var alphaEl = range(root, 'alpha', function (v) { return v.toFixed(2) + ' (α = ' + (v / (+el.tilings.value)).toFixed(3) + ')'; });
    var epsEl = range(root, 'eps', function (v) { return v.toFixed(2); });
    var XMIN = -1.2, XMAX = 0.5, VMAX = 0.07, CAP = 5000;
    var T, w, steps, best, busy = false, traj = null, carAt = { x: -0.5, v: 0, a: 1, n: 0 }, animTok = 0;

    function tiles(x, v, out) {
      var xs = (x - XMIN) / (XMAX - XMIN) * 8, vs = (v + VMAX) / (2 * VMAX) * 8;
      for (var t = 0; t < T; t++) {
        var ix = Math.min(8, Math.floor(xs + t / T)), iv = Math.min(8, Math.floor(vs + ((3 * t) % T) / T));
        out[t] = t * 81 + ix * 9 + iv;
      }
    }
    function qv(f, a) { var base = a * T * 81, s = 0; for (var t = 0; t < T; t++) s += w[base + f[t]]; return s; }
    function choose(f, e) {
      if (e > 0 && Math.random() < e) return randint(3);
      var b = -Infinity, list = [];
      for (var a = 0; a < 3; a++) { var v = qv(f, a); if (v > b + 1e-12) { b = v; list = [a]; } else if (Math.abs(v - b) <= 1e-12) list.push(a); }
      return list[randint(list.length)];
    }
    function stepEnv(x, v, a) {
      v = clamp(v + 0.001 * (a - 1) - 0.0025 * Math.cos(3 * x), -VMAX, VMAX);
      x += v;
      if (x <= XMIN) { x = XMIN; if (v < 0) v = 0; }
      if (x > XMAX) x = XMAX;
      return [x, v];
    }
    function episode() {
      var alpha = +alphaEl.value / T, e = +epsEl.value, f = new Int32Array(T), f2 = new Int32Array(T);
      var x = -0.6 + 0.2 * Math.random(), v = 0, n = 0, t;
      tiles(x, v, f);
      var a = choose(f, e);
      for (;;) {
        var s2 = stepEnv(x, v, a), base = a * T * 81, q0 = qv(f, a);
        n++;
        if (s2[0] >= XMAX) { for (t = 0; t < T; t++) w[base + f[t]] += alpha * (-1 - q0); break; }
        tiles(s2[0], s2[1], f2);
        var a2 = choose(f2, e), d = -1 + qv(f2, a2) - q0;
        for (t = 0; t < T; t++) w[base + f[t]] += alpha * d;
        var tmp = f; f = f2; f2 = tmp; x = s2[0]; v = s2[1]; a = a2;
        if (n >= CAP) break;
      }
      return n;
    }
    function setup() {
      animTok++;
      T = +el.tilings.value; w = new Float64Array(3 * T * 81); steps = []; best = null; traj = null; carAt = { x: -0.5, v: 0, a: 1, n: 0 };
      alphaEl.dispatchEvent(new Event('input'));
      html(el.status, 'The weights start at 0, which is optimistic: every step costs −1, so actions not tried yet look better than tried ones. That alone makes the car explore, even with ε = 0.');
      drawAll();
    }
    function busyUI(b) { busy = b; ['ep1', 'ep10', 'ep100', 'replay', 'reset'].forEach(function (k) { if (el[k]) el[k].disabled = b; }); el.tilings.disabled = b; }
    function train(N) {
      if (busy) return;
      animTok++; busyUI(true); traj = null;
      var done = 0;
      (function chunk() {
        var t0 = performance.now();
        while (done < N && performance.now() - t0 < 30) {
          var n = episode(); steps.push(n); done++;
          if (n < CAP && (best === null || n < best)) best = n;
        }
        html(el.status, 'Training: episode ' + steps.length + (done < N ? ' …' : '. ') + (done < N ? '' : 'Last one took ' + steps[steps.length - 1].toLocaleString('en-US') + ' steps' + (steps[steps.length - 1] >= CAP ? ' (stopped at the cap)' : '') + '.'));
        drawAll();
        if (done < N) setTimeout(chunk, 0); else busyUI(false);
      })();
    }
    function replay() {
      if (busy) return;
      var x = -0.5, v = 0, f = new Int32Array(T), path = [[x, v, 1]], reached = false;
      for (var i = 0; i < 1000; i++) {
        tiles(x, v, f);
        var a = choose(f, 0), s2 = stepEnv(x, v, a);
        x = s2[0]; v = s2[1]; path.push([x, v, a]);
        if (x >= XMAX) { reached = true; break; }
      }
      traj = path;
      var tok = ++animTok, k = 0, per = Math.max(1, Math.ceil(path.length / 260));
      drawMap();
      (function frame() {
        if (tok !== animTok) return;
        k = Math.min(path.length - 1, k + per);
        carAt = { x: path[k][0], v: path[k][1], a: path[k][2], n: k };
        drawHill();
        if (k < path.length - 1) requestAnimationFrame(frame);
        else html(el.status, reached ? 'The greedy policy reached the top in <b>' + (path.length - 1) + ' steps</b>. See its spiral in the cost-to-go map: it swings back to gain speed first.'
          : 'Not at the top after 1,000 steps yet: the policy still needs training.');
      })();
    }
    function sizeCanvas(cv) {
      var dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 400, H = cv.clientHeight || 200;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      var g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { g: g, W: W, H: H };
    }
    function drawHill() {
      if (!el.hill) return;
      var c = sizeCanvas(el.hill), g = c.g, W = c.W, H = c.H, pad = 16;
      var X = function (x) { return pad + (W - 2 * pad) * (x - XMIN) / (XMAX - XMIN); };
      var Yh = function (x) { return H - 22 - (H - 60) * (Math.sin(3 * x) + 1) / 2; };
      g.clearRect(0, 0, W, H);
      g.beginPath(); g.moveTo(X(XMIN), H);
      for (var i = 0; i <= 120; i++) { var x = XMIN + (XMAX - XMIN) * i / 120; g.lineTo(X(x), Yh(x)); }
      g.lineTo(X(XMAX), H); g.closePath();
      var grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#bfdbfe'); grd.addColorStop(1, '#dbeafe');
      g.fillStyle = grd; g.fill();
      g.strokeStyle = '#3b82f6'; g.lineWidth = 2;
      g.beginPath();
      for (i = 0; i <= 120; i++) { x = XMIN + (XMAX - XMIN) * i / 120; if (i) g.lineTo(X(x), Yh(x)); else g.moveTo(X(x), Yh(x)); }
      g.stroke();
      var fx = X(XMAX) - 2, fy = Yh(XMAX);
      g.strokeStyle = '#334155'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 30); g.stroke();
      g.fillStyle = C.amber; g.beginPath(); g.moveTo(fx, fy - 30); g.lineTo(fx - 18, fy - 24); g.lineTo(fx, fy - 18); g.closePath(); g.fill();
      var cx = X(carAt.x), cy = Yh(carAt.x), slope = -(H - 60) / 2 * 3 * Math.cos(3 * carAt.x) / ((W - 2 * pad) / (XMAX - XMIN));
      g.save(); g.translate(cx, cy); g.rotate(Math.atan(slope));
      g.fillStyle = C.rose; g.beginPath();
      if (g.roundRect) g.roundRect(-15, -17, 30, 12, 4); else g.rect(-15, -17, 30, 12);
      g.fill();
      g.fillStyle = '#1f2937'; g.beginPath(); g.arc(-8, -4, 4, 0, 7); g.arc(8, -4, 4, 0, 7); g.fill();
      g.restore();
      g.fillStyle = '#334155'; g.font = '600 12px ' + FONT; g.textAlign = 'left';
      g.fillText('step ' + carAt.n + '   engine ' + ['◀ back', '· off', 'forward ▶'][carAt.a], 12, 18);
    }
    function drawMap() {
      if (!el.map) return;
      var c = sizeCanvas(el.map), g = c.g, W = c.W, H = c.H, l = 40, b = 30, t = 8, r = 8, G = 56, f = new Int32Array(T), vals = [], mx = 0, i, j, a;
      g.clearRect(0, 0, W, H);
      for (j = 0; j < G; j++) for (i = 0; i < G; i++) {
        var x = XMIN + (XMAX - XMIN) * (i + 0.5) / G, v = VMAX - 2 * VMAX * (j + 0.5) / G, m = -Infinity;
        tiles(x, v, f);
        for (a = 0; a < 3; a++) m = Math.max(m, qv(f, a));
        vals.push(-m); if (-m > mx) mx = -m;
      }
      var off = document.createElement('canvas'); off.width = G; off.height = G;
      var og = off.getContext('2d'), img = og.createImageData(G, G);
      for (i = 0; i < G * G; i++) { var col = heatRGB(mx > 0 ? 0.04 + 0.92 * vals[i] / mx : 0.04); img.data[4 * i] = col[0]; img.data[4 * i + 1] = col[1]; img.data[4 * i + 2] = col[2]; img.data[4 * i + 3] = 255; }
      og.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false;
      var pw = W - l - r, ph = H - t - b;
      g.drawImage(off, l, t, pw, ph);
      if (traj) {
        g.strokeStyle = '#fbbf24'; g.lineWidth = 2; g.beginPath();
        traj.forEach(function (p, k) { var px = l + pw * (p[0] - XMIN) / (XMAX - XMIN), py = t + ph * (VMAX - p[1]) / (2 * VMAX); if (k) g.lineTo(px, py); else g.moveTo(px, py); });
        g.stroke();
      }
      g.fillStyle = '#475569'; g.font = '11px ' + FONT; g.textAlign = 'center';
      g.fillText('position x', l + pw / 2, H - 6);
      g.fillText('−1.2', l + 10, t + ph + 14); g.fillText('0.5', l + pw - 10, t + ph + 14);
      g.save(); g.translate(12, t + ph / 2); g.rotate(-Math.PI / 2); g.fillText('velocity v', 0, 0); g.restore();
      g.textAlign = 'right'; g.fillText('+0.07', l - 4, t + 10); g.fillText('−0.07', l - 4, t + ph);
      if (!(mx > 0)) { g.fillStyle = '#334155'; g.textAlign = 'center'; g.font = '600 13px ' + FONT; g.fillText('Not trained yet', l + pw / 2, t + ph / 2); }
      else {
        var lab = 'darkest ≈ ' + Math.round(mx) + ' steps';
        g.font = '600 11px ' + FONT; g.textAlign = 'left';
        var tw = g.measureText(lab).width;
        g.fillStyle = 'rgba(255,255,255,.88)'; g.fillRect(l + 5, t + 5, tw + 10, 18);
        g.fillStyle = '#1e3a8a'; g.fillText(lab, l + 10, t + 18);
      }
    }
    function drawAll() {
      set(el.eps, steps.length);
      set(el.steps, steps.length ? steps[steps.length - 1].toLocaleString('en-US') : '–');
      set(el.best, best === null ? '–' : best.toLocaleString('en-US'));
      set(el.feat, T + ' of ' + (3 * T * 81).toLocaleString('en-US'));
      chart(el.chart, { series: [{ y: steps, color: C.blue, dots: steps.length < 60 }], log: true, xInt: true, xLabel: 'episode', empty: 'Train to see the steps per episode' });
      drawHill(); drawMap();
    }
    on(el.ep1, 'click', function () { train(1); });
    on(el.ep10, 'click', function () { train(10); });
    on(el.ep100, 'click', function () { train(100); });
    on(el.reset, 'click', setup);
    on(el.tilings, 'change', setup);
    on(el.replay, 'click', replay);
    var rz = null;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { drawHill(); drawMap(); }, 120); });
    setup();
  }

  // ================================================================== 5. MCTS on tic-tac-toe (Lecture 9)
  function mctsLab(root) {
    var el = {};
    ['board', 'stats', 'statsub', 'status', 'you', 'bit', 'draw', 'lastsims', 'mark', 'newyou', 'newbit', 'hint'].forEach(function (k) { el[k] = q(root, k); });
    var SIMS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
    var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    var MARK = ['', 'X', 'O'];
    var sims = range(root, 'sims', function (v) { return SIMS[v].toLocaleString('en-US'); });
    var cEl = range(root, 'c', function (v) { return v.toFixed(1); });
    var board, human, bot, turn, over, last = -1, line = null, score = { you: 0, bit: 0, draw: 0 }, cells = [], thinking = false;

    function result(b) { // 1 or 2: winner, 3: draw, 0: not over
      for (var i = 0; i < 8; i++) { var L = LINES[i]; if (b[L[0]] && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return b[L[0]]; }
      for (i = 0; i < 9; i++) if (!b[i]) return 0;
      return 3;
    }
    function winLine(b) { for (var i = 0; i < 8; i++) { var L = LINES[i]; if (b[L[0]] && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return L; } return null; }
    function legal(b) { var m = []; for (var i = 0; i < 9; i++) if (!b[i]) m.push(i); return m; }
    function search(b0, toMove, n, c) {
      var root0 = { move: -1, parent: null, kids: [], untried: legal(b0), N: 0, W: 0, by: 3 - toMove };
      for (var it = 0; it < n; it++) {
        var node = root0, b = b0.slice(), turnS = toMove, res;
        while (!node.untried.length && node.kids.length) {
          var best = null, bs = -Infinity, lnN = Math.log(node.N);
          for (var k = 0; k < node.kids.length; k++) {
            var ch = node.kids[k], sc = ch.W / ch.N + c * Math.sqrt(lnN / ch.N);
            if (sc > bs) { bs = sc; best = ch; }
          }
          node = best; b[node.move] = node.by; turnS = 3 - node.by;
        }
        if (node.untried.length && !result(b)) {
          var m = node.untried.splice(randint(node.untried.length), 1)[0];
          b[m] = turnS;
          var child = { move: m, parent: node, kids: [], untried: result(b) ? [] : legal(b), N: 0, W: 0, by: turnS };
          node.kids.push(child); node = child; turnS = 3 - turnS;
        }
        res = result(b);
        while (!res) { var lm = legal(b); b[lm[randint(lm.length)]] = turnS; turnS = 3 - turnS; res = result(b); }
        for (; node; node = node.parent) { node.N++; if (res === node.by) node.W += 1; else if (res === 3) node.W += 0.5; }
      }
      return root0;
    }
    function build() {
      el.board.innerHTML = ''; el.stats.innerHTML = ''; cells = [];
      for (var i = 0; i < 9; i++) {
        var b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; el.board.appendChild(b); cells.push(b);
        el.stats.appendChild(document.createElement('div'));
      }
    }
    function newGame(humanFirst) {
      board = [0, 0, 0, 0, 0, 0, 0, 0, 0]; human = humanFirst ? 1 : 2; bot = 3 - human; turn = 1; over = false; last = -1; line = null;
      set(el.mark, MARK[human]);
      showStats(null);
      set(el.statsub, 'For each possible move: how often it was visited (N) and its value for the player to move (Q/N).');
      drawBoard();
      if (turn === bot) botMove(); else set(el.status, 'Your move: you are ' + MARK[human] + '.');
    }
    function drawBoard() {
      for (var i = 0; i < 9; i++) {
        var c = cells[i], m = board[i];
        c.textContent = MARK[m];
        c.className = (m === 1 ? 'is-x' : m === 2 ? 'is-o' : '') + (line && line.indexOf(i) >= 0 ? ' is-win' : '') + (i === last ? ' is-last' : '');
        c.disabled = !!m || over || turn !== human || thinking;
        c.setAttribute('aria-label', m ? MARK[m] : 'Empty square ' + (i + 1));
      }
      set(el.you, score.you); set(el.bit, score.bit); set(el.draw, score.draw);
    }
    function showStats(rootN, b) {
      b = b || board;
      var divs = el.stats.children, maxN = 1, pick = -1, byMove = {};
      if (rootN) rootN.kids.forEach(function (k) { byMove[k.move] = k; if (k.N > maxN) { maxN = k.N; } });
      if (rootN) pick = rootN.kids.reduce(function (a, k) { return !a || k.N > a.N ? k : a; }, null).move;
      for (var i = 0; i < 9; i++) {
        var d = divs[i], k = byMove[i];
        d.className = b[i] === 1 ? 'is-x' : b[i] === 2 ? 'is-o' : '';
        d.style.background = '';
        if (b[i]) { d.textContent = MARK[b[i]]; continue; }
        if (!k) { d.innerHTML = ''; continue; }
        d.innerHTML = '<span>N ' + k.N + '</span><b>' + Math.round(100 * k.W / k.N) + '%</b>';
        d.style.background = 'rgba(37,99,235,' + (0.06 + 0.4 * k.N / maxN).toFixed(3) + ')';
        if (i === pick) d.className = 'is-pick';
      }
    }
    function end() {
      var r = result(board);
      if (!r) return false;
      over = true; line = winLine(board);
      if (r === 3) { score.draw++; set(el.status, 'Draw. Start a new game, or change the number of simulations.'); }
      else if (r === human) { score.you++; set(el.status, 'You win. Try giving Bit more simulations.'); }
      else { score.bit++; set(el.status, 'Bit wins. Fewer simulations make it easier to beat.'); }
      drawBoard();
      return true;
    }
    function botMove() {
      thinking = true; drawBoard();
      var n = SIMS[+sims.value];
      set(el.status, 'Bit is thinking: ' + n.toLocaleString('en-US') + ' simulations …');
      setTimeout(function () {
        var before = board.slice(), rt = search(board, bot, n, +cEl.value);
        var best = rt.kids.reduce(function (a, k) { return !a || k.N > a.N ? k : a; }, null);
        set(el.statsub, 'Bit’s search before its move: visits N and Bit’s value Q/N for each move it considered.');
        board[best.move] = bot; last = best.move; turn = human; thinking = false;
        set(el.lastsims, n.toLocaleString('en-US') + ' sims');
        if (!end()) { set(el.status, 'Bit played square ' + (best.move + 1) + ' (value ' + Math.round(100 * best.W / best.N) + '% for Bit). Your move.'); drawBoard(); }
        showStats(rt, before);
      }, 40);
    }
    on(el.board, 'click', function (ev) {
      var b = ev.target.closest('button');
      if (!b || over || thinking || turn !== human) return;
      var i = +b.dataset.i;
      if (board[i]) return;
      board[i] = human; last = i; turn = bot;
      drawBoard();
      if (!end()) botMove();
    });
    on(el.hint, 'click', function () {
      if (over || thinking || turn !== human) return;
      var n = SIMS[+sims.value], rt = search(board, human, n, +cEl.value);
      set(el.statsub, 'A hint for you: visits N and your value Q/N for each move, from ' + n.toLocaleString('en-US') + ' simulations.');
      showStats(rt);
    });
    on(el.newyou, 'click', function () { if (!thinking) newGame(true); });
    on(el.newbit, 'click', function () { if (!thinking) newGame(false); });
    build(); newGame(true);
  }

  // ================================================================== 6. Policy-gradient bandit (Lecture 10)
  function pgLab(root) {
    var el = {};
    ['base', 'bars', 'chart', 'chart-legend', 'optsub', 'status', 't', 'avg', 'b', 'opt', 's1', 's100', 's1000', 'reset', 'compare'].forEach(function (k) { el[k] = q(root, k); });
    var K = 10;
    var alpha = range(root, 'alpha', function (v) { return v.toFixed(2); });
    var offset = range(root, 'offset', function (v) { return (v > 0 ? '+' : '') + v.toFixed(1); }, function () { html(el.status, 'Press <b>New bandit</b> to use the new reward offset.'); });
    var qs, H, pi, st, sum, opt, rate, win, best, view = 'run', cmp = null, busy = false, lastA = -1;

    function softmax(h, out) {
      var m = -Infinity, z = 0, i;
      for (i = 0; i < K; i++) if (h[i] > m) m = h[i];
      for (i = 0; i < K; i++) { out[i] = Math.exp(h[i] - m); z += out[i]; }
      for (i = 0; i < K; i++) out[i] /= z;
    }
    function pull(h, p, qv, a_, useBase, s) {
      var r = Math.random(), a = 0, c = p[0];
      while (r > c && a < K - 1) { a++; c += p[a]; }
      var R = qv[a] + randn();
      s.t++;
      var b = useBase ? (s.t === 1 ? R : s.rbar) : 0;
      for (var k = 0; k < K; k++) h[k] += a_ * (R - b) * ((k === a ? 1 : 0) - p[k]);
      s.rbar += (R - s.rbar) / s.t;
      softmax(h, p);
      return [a, R];
    }
    function argmax(v) { var b = 0; for (var i = 1; i < v.length; i++) if (v[i] > v[b]) b = i; return b; }
    function newBandit() {
      var off = +offset.value;
      qs = []; for (var i = 0; i < K; i++) qs.push(off + randn());
      best = argmax(qs); H = new Float64Array(K); pi = new Float64Array(K); softmax(H, pi);
      st = { t: 0, rbar: 0 }; sum = 0; opt = []; rate = []; win = 0; view = 'run'; lastA = -1;
      html(el.status, 'A fresh bandit with hidden means around ' + (off > 0 ? '+' : '') + off.toFixed(1) + '. Every arm starts with probability 0.10.');
      draw();
    }
    function run(n) {
      if (busy) return;
      view = 'run';
      for (var i = 0; i < n; i++) {
        var res = pull(H, pi, qs, +alpha.value, el.base.checked, st), o = res[0] === best ? 1 : 0;
        sum += res[1]; opt.push(o); win += o; if (opt.length > 50) win -= opt[opt.length - 51];
        rate.push(100 * win / Math.min(50, opt.length)); lastA = res[0];
      }
      var b = el.base.checked, off = +offset.value;
      html(el.status, 'Last pull: arm ' + (lastA + 1) + '. ' + (!b && off >= 2 && st.t < 300 ? 'Without a baseline every reward is positive, so each pulled arm gets pushed up, good or not.' : b ? 'With the baseline, only rewards above the running average push an arm up.' : ''));
      draw();
    }
    function compare() {
      if (busy) return;
      busy = true; el.compare.disabled = true;
      var cfg = [{ a: 0.1, b: true, name: 'α = 0.1, with baseline', color: C.blue }, { a: 0.4, b: true, name: 'α = 0.4, with baseline', color: C.navy },
                 { a: 0.1, b: false, name: 'α = 0.1, no baseline', color: C.rose }, { a: 0.4, b: false, name: 'α = 0.4, no baseline', color: C.wine }];
      var runs = 100, steps = 1000, off = +offset.value, sums = cfg.map(function () { return new Float64Array(steps); }), r = 0;
      (function chunk() {
        var t0 = performance.now();
        while (r < runs && performance.now() - t0 < 30) {
          var qv = [], i; for (i = 0; i < K; i++) qv.push(off + randn());
          var bst = argmax(qv);
          cfg.forEach(function (c, ci) {
            var h = new Float64Array(K), p = new Float64Array(K), s = { t: 0, rbar: 0 };
            softmax(h, p);
            for (var t = 0; t < steps; t++) if (pull(h, p, qv, c.a, c.b, s)[0] === bst) sums[ci][t] += 1;
          });
          r++;
        }
        html(el.status, 'Comparing: ' + r + ' of ' + runs + ' bandits …');
        if (r < runs) { setTimeout(chunk, 0); return; }
        cmp = cfg.map(function (c, ci) { return { name: c.name, color: c.color, y: Array.prototype.map.call(sums[ci], function (x) { return 100 * x / runs; }) }; });
        view = 'cmp'; busy = false; el.compare.disabled = false;
        html(el.status, 'Done: with rewards around ' + (off > 0 ? '+' : '') + off.toFixed(1) + ', compare the blue (baseline) and red (no baseline) curves.' + (off === 0 ? ' Try an offset of +4: without a baseline, learning gets much worse.' : ''));
        set(el.optsub, 'Average of 100 fresh bandits per setting, 1,000 pulls each, reward offset ' + (off > 0 ? '+' : '') + off.toFixed(1) + ' (your browser’s runs).');
        draw();
      })();
    }
    function draw() {
      set(el.t, st.t);
      set(el.avg, st.t ? fmt(sum / st.t, 2) : '–');
      set(el.b, el.base.checked ? (st.t ? fmt(st.rbar, 2) : '–') : '0 (off)');
      var lastN = opt.slice(-100), s = 0; lastN.forEach(function (x) { s += x; });
      set(el.opt, lastN.length ? Math.round(100 * s / lastN.length) + '%' : '–');
      render(el.bars, function (W, H) {
        var pl = 36, pr = 8, pt = 16, pb = 40, iw = W - pl - pr, ih = H - pt - pb, top = Math.max(0.2, Math.ceil(Math.max.apply(null, pi) * 10) / 10), out = [];
        var Y = function (v) { return pt + ih * (1 - v / top); };
        niceTicks(0, top, 4).ticks.forEach(function (t) { if (t > top + 1e-9) return; out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 4"/>' + txt(pl - 6, Y(t) + 4, String(+t.toFixed(2)), { anchor: 'end' })); });
        var gw = iw / K, bw = Math.min(30, gw * 0.62);
        for (var i = 0; i < K; i++) {
          var cx = pl + gw * (i + 0.5), y = Y(pi[i]);
          out.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Y(0) - y).toFixed(1) + '" rx="4" fill="' + (i === best ? C.green : C.blue) + '" fill-opacity="' + (i === lastA ? 1 : 0.75) + '"/>');
          if (pi[i] >= 0.05) out.push(txt(cx, y - 4, pi[i].toFixed(2), { size: 10, fill: C.ink }));
          out.push(txt(cx, H - pb + 15, String(i + 1), { weight: 700, fill: '#334155' }));
          out.push(txt(cx, H - pb + 29, qs[i].toFixed(1), { size: 10, fill: i === best ? C.green : C.muted }));
        }
        out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="rgba(100,116,139,.7)"/>');
        return out.join('');
      });
      if (view === 'cmp' && cmp) {
        legend(el['chart-legend'], cmp);
        chart(el.chart, { series: cmp.map(function (c) { return { y: c.y, color: c.color, width: 1.8 }; }), yMin: 0, yMax: 100, xInt: true, xLabel: 'pulls', yFormat: function (v) { return v + '%'; } });
      } else {
        legend(el['chart-legend'], [{ name: 'your run (last 50 pulls)', color: C.blue }]);
        set(el.optsub, 'Your run: share of the last 50 pulls that went to the best arm.');
        chart(el.chart, { series: [{ y: rate, color: C.blue }], yMin: 0, yMax: 100, xInt: true, xMax: Math.max(100, rate.length), xLabel: 'pulls', yFormat: function (v) { return v + '%'; }, empty: 'Pull some arms to see the curve' });
      }
    }
    on(el.s1, 'click', function () { run(1); });
    on(el.s100, 'click', function () { run(100); });
    on(el.s1000, 'click', function () { run(1000); });
    on(el.reset, 'click', newBandit);
    on(el.compare, 'click', compare);
    on(el.base, 'change', function () { draw(); });
    newBandit();
  }

  // ================================================================== 7. Bradley-Terry from comparisons (Lecture 12)
  function btLab(root) {
    var el = {};
    ['pair', 'tie', 'skip', 'scores', 'matrix', 'you', 'simn', 'top', 'agree', 'sim', 'reset', 'hidden'].forEach(function (k) { el[k] = q(root, k); });
    var L = ['A', 'B', 'C', 'D', 'E', 'F'];
    var ANS = [
      { t: 'Check the reward', x: 'It is probably rewarded for moving forward, whatever happens. Check the reward function: if bumping costs nothing, the wall is just part of the fastest route.' },
      { t: 'Check what it observes', x: 'It may not be able to see the wall at all. If its state has no distance reading, the wall is invisible to it. Add the sensor to the state and retrain.' },
      { t: 'It will stop on its own', x: 'Robots do that sometimes. It will probably stop on its own.' },
      { t: 'Explore more', x: 'It may never have tried turning away there. Raise exploration (a larger ε) for a while so it can find out that turning pays off.' },
      { t: 'Train longer', x: 'Train it for longer.' },
      { t: 'Paint the wall', x: 'Paint the wall a brighter colour.' }
    ];
    var HID = [1.2, 1.6, -1.0, 0.8, -0.6, -1.2], LAM = 0.1, n = 6;
    var comps, r, pair, mine;
    function sig(z) { return 1 / (1 + Math.exp(-z)); }
    function fit() {
      r = r && r.length === n ? r : new Float64Array(n);
      for (var it = 0; it < 30; it++) {
        var g = new Float64Array(n), Hm = [], i, j;
        for (i = 0; i < n; i++) { Hm.push(new Float64Array(n)); Hm[i][i] = LAM; g[i] = LAM * r[i]; }
        comps.forEach(function (c) {
          var p = sig(r[c.i] - r[c.j]), wv = p * (1 - p);
          g[c.i] += p - c.y; g[c.j] -= p - c.y;
          Hm[c.i][c.i] += wv; Hm[c.j][c.j] += wv; Hm[c.i][c.j] -= wv; Hm[c.j][c.i] -= wv;
        });
        var step = solve(Hm, g), nrm = 0;
        for (i = 0; i < n; i++) nrm = Math.max(nrm, Math.abs(step[i]));
        var sc = nrm > 3 ? 3 / nrm : 1;
        for (i = 0; i < n; i++) r[i] -= sc * step[i];
        if (nrm < 1e-10) break;
      }
      var m = 0; for (var k = 0; k < n; k++) m += r[k] / n;
      for (k = 0; k < n; k++) r[k] -= m;
    }
    function solve(A, b) { // Gaussian elimination with partial pivoting
      var M = A.map(function (row, i) { return Array.prototype.slice.call(row).concat([b[i]]); }), N = b.length, i, j, k;
      for (i = 0; i < N; i++) {
        var p = i; for (k = i + 1; k < N; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
        var tmp = M[i]; M[i] = M[p]; M[p] = tmp;
        for (k = i + 1; k < N; k++) { var f = M[k][i] / M[i][i]; for (j = i; j <= N; j++) M[k][j] -= f * M[i][j]; }
      }
      var x = new Array(N);
      for (i = N - 1; i >= 0; i--) { var s = M[i][N]; for (j = i + 1; j < N; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
      return x;
    }
    function nextPair() {
      var counts = {}, minC = Infinity, cand = [];
      comps.forEach(function (c) { if (c.src === 'you') { var k = Math.min(c.i, c.j) + '-' + Math.max(c.i, c.j); counts[k] = (counts[k] || 0) + 1; } });
      for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
        var c = counts[i + '-' + j] || 0;
        if (pair && ((pair[0] === i && pair[1] === j) || (pair[0] === j && pair[1] === i))) c += 0.5;
        if (c < minC) { minC = c; cand = [[i, j]]; } else if (c === minC) cand.push([i, j]);
      }
      var p = cand[randint(cand.length)];
      pair = Math.random() < 0.5 ? p : [p[1], p[0]];
      html(el.pair, pair.map(function (i, side) {
        return '<button type="button" class="rlx-answer" data-side="' + side + '"><small>Answer ' + L[i] + '</small><span>' + esc(ANS[i].x) + '</span><em>This one is more helpful</em></button>';
      }).join(''));
    }
    function add(i, j, y, src) { comps.push({ i: i, j: j, y: y, src: src }); }
    function reset() { comps = []; r = new Float64Array(n); pair = null; nextPair(); draw(); }
    function draw() {
      var you = 0, sim = 0, agree = 0, dec = 0;
      comps.forEach(function (c) {
        if (c.src === 'you') you++; else sim++;
        if (c.y !== 0.5) { dec++; var p = sig(r[c.i] - r[c.j]); if ((c.y === 1 && p > 0.5) || (c.y === 0 && p < 0.5)) agree++; }
      });
      set(el.you, you); set(el.simn, sim);
      var top = 0; for (var i = 1; i < n; i++) if (r[i] > r[top]) top = i;
      set(el.top, comps.length ? 'Answer ' + L[top] : '–');
      set(el.agree, dec ? Math.round(100 * agree / dec) + '%' : '–');
      var showH = el.hidden && el.hidden.checked, hm = HID.reduce(function (a, b) { return a + b; }, 0) / n;
      var span = Math.max(2, Math.ceil(Math.max.apply(null, Array.prototype.map.call(r, Math.abs).concat(showH ? HID.map(function (h) { return Math.abs(h - hm); }) : [])) + 0.2));
      var pos = function (v) { return 50 + 50 * v / span; };
      html(el.scores, L.map(function (lt, k) {
        var a = pos(Math.min(0, r[k])), b = pos(Math.max(0, r[k]));
        return '<div class="rlx-score"><b>' + lt + '</b><div class="rlx-score-track"><span class="t">' + esc(ANS[k].t) + '</span><span class="rlx-score-zero"></span>' +
          '<span class="rlx-score-fill' + (r[k] < 0 ? ' is-neg' : '') + '" style="left:' + a.toFixed(2) + '%;width:' + (b - a).toFixed(2) + '%"></span>' +
          (showH ? '<span class="rlx-score-hidden" style="left:' + pos(HID[k] - hm).toFixed(2) + '%" title="hidden score"></span>' : '') +
          '</div><em>' + (r[k] >= 0 ? '+' : '') + r[k].toFixed(2) + '</em></div>';
      }).join(''));
      var rows = '<tr><th></th>' + L.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>';
      for (i = 0; i < n; i++) {
        rows += '<tr><th>' + L[i] + '</th>';
        for (var j = 0; j < n; j++) {
          if (i === j) { rows += '<td style="color:#94a3b8">–</td>'; continue; }
          var p = sig(r[i] - r[j]), d = p - 0.5;
          var bg = d >= 0 ? 'rgba(37,99,235,' + (0.06 + 1.2 * d).toFixed(3) + ')' : 'rgba(225,29,72,' + (0.06 - 1.2 * d).toFixed(3) + ')';
          rows += '<td style="background:' + bg + ';color:' + (Math.abs(d) > 0.3 ? '#fff' : '#1f2937') + '">' + p.toFixed(2) + '</td>';
        }
        rows += '</tr>';
      }
      html(el.matrix, rows);
    }
    on(el.pair, 'click', function (ev) {
      var b = ev.target.closest('.rlx-answer');
      if (!b || !pair) return;
      var side = +b.dataset.side;
      add(pair[side], pair[1 - side], 1, 'you');
      fit(); nextPair(); draw();
    });
    on(el.tie, 'click', function () { if (!pair) return; add(pair[0], pair[1], 0.5, 'you'); fit(); nextPair(); draw(); });
    on(el.skip, 'click', function () { nextPair(); });
    on(el.sim, 'click', function () {
      for (var k = 0; k < 50; k++) {
        var i = randint(n), j = randint(n - 1); if (j >= i) j++;
        add(i, j, Math.random() < sig(HID[i] - HID[j]) ? 1 : 0, 'sim');
      }
      fit(); draw();
    });
    on(el.reset, 'click', reset);
    on(el.hidden, 'change', draw);
    reset();
  }

  // ------------------------------------------------------------------ start the labs on this page
  var LABS = { dp: dpLab, contraction: contractionLab, tdmc: tdmcLab, car: carLab, mcts: mctsLab, pg: pgLab, bt: btLab };
  document.querySelectorAll('[data-rlx]').forEach(function (root) {
    var f = LABS[root.getAttribute('data-rlx')];
    if (!f) return;
    try { f(root); } catch (e) { if (window.console) console.error('rl-labs (' + root.id + '):', e); }
  });
})();
