/* statistics-demo.html: the charts below the map (research mix, review race, journals, lab timeline, team size).
   Data: the <script id="stats-data"> block written by tools/build_statistics.py. Needs d3 (js/vendor/d3.min.js). */
(function () {
  'use strict';
  const dataEl = document.getElementById('stats-data');
  if (!dataEl || !window.d3) return;
  const d3 = window.d3;
  const DATA = JSON.parse(dataEl.textContent);
  const tip = document.getElementById('st-tip');
  const SERIES = ['var(--st-1)', 'var(--st-2)', 'var(--st-3)', 'var(--st-4)', 'var(--st-5)', 'var(--st-6)', 'var(--st-7)'];
  const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fmtMonth = (ym) => (ym ? `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}` : '');
  const toDate = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1);

  // ------------------------------------------------------------------ shared tooltip
  function showTip(e, build) {
    tip.replaceChildren();
    build(tip);
    tip.hidden = false;
    const r = e.target && e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
    let x = e.clientX != null && e.clientX !== 0 ? e.clientX : (r ? r.right : 0);
    let y = e.clientY != null && e.clientY !== 0 ? e.clientY : (r ? r.top : 0);
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    x = x + 14 + tw > window.innerWidth - 8 ? Math.max(8, x - tw - 14) : x + 14;
    y = y + 14 + th > window.innerHeight - 8 ? Math.max(8, y - th - 14) : y + 14;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    shownAt = Date.now();
  }
  let shownAt = 0;
  function hideTip() { tip.hidden = true; }
  function tipTitle(t, text) { t.append(el('h3', null, text)); }
  function tipRow(t, value, label, color) {
    const p = el('p', 'st-tip-row');
    if (color) { const k = el('i'); k.style.background = color; p.append(k); }
    p.append(el('b', null, String(value)), ' ', label);
    t.append(p);
  }
  function tipNote(t, text) { t.append(el('p', 'st-tip-note', text)); }
  function hover(sel, build) {
    sel.attr('tabindex', 0)
      .on('pointerenter pointermove', function (e, d) { this.classList.add('is-hover'); showTip(e, (t) => build(t, d)); })
      .on('pointerleave', function () { this.classList.remove('is-hover'); hideTip(); })
      .on('focus', function (e, d) { this.classList.add('is-hover'); const r = this.getBoundingClientRect(); showTip({ clientX: r.right, clientY: r.top }, (t) => build(t, d)); })
      .on('blur', function () { this.classList.remove('is-hover'); hideTip(); });
  }
  function frame(id, height, margin) {
    const box = document.getElementById(id);
    if (!box) return null;
    const W = box.clientWidth;
    box.replaceChildren();
    const svg = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${height}`).attr('width', W).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.l},${margin.t})`);
    return { svg, g, W, H: height, w: W - margin.l - margin.r, h: height - margin.t - margin.b };
  }
  function roundedTop(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  function roundedEnd(x, y, w, h, r) {
    r = Math.min(r, h / 2, w);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  }
  function legend(id, items, shape) {
    const box = document.getElementById(id);
    if (!box) return;
    box.replaceChildren();
    items.forEach(([label, color]) => {
      const s = el('span');
      const k = el('i', shape || '');
      k.style.background = color;
      s.append(k, label);
      box.append(s);
    });
  }

  // ------------------------------------------------------------------ 1. research mix: stacked columns
  let topicMode = 'count';
  function drawTopics() {
    const T = DATA.topics;
    const narrow = document.getElementById('chart-topics').clientWidth < 560;
    const f = frame('chart-topics', narrow ? 280 : 340, { l: 40, r: 8, t: 12, b: 28 });
    if (!f) return;
    const years = T.years;
    const share = topicMode === 'share';
    const x = d3.scaleBand().domain(years).range([0, f.w]).paddingInner(0.28).paddingOuter(0.1);
    const ymax = share ? 1 : d3.max(T.totals);
    const y = d3.scaleLinear().domain([0, ymax]).nice().range([f.h, 0]);
    const ticks = y.ticks(5);
    f.g.append('g').attr('class', 'st-gridlines').selectAll('line').data(ticks).join('line')
      .attr('x1', 0).attr('x2', f.w).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(ticks).join('text')
      .attr('x', -8).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end')
      .text((d) => (share ? `${Math.round(d * 100)}%` : d));
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(years).join('text')
      .attr('x', (d) => x(d) + x.bandwidth() / 2).attr('y', f.h + 18).attr('text-anchor', 'middle').text((d) => d);
    years.forEach((yr, k) => {
      const total = T.totals[k];
      if (!total) return;
      let acc = 0;
      const segs = T.topics.map((t, i) => ({ t, i, v: t.counts[k] })).filter((s) => s.v > 0);
      const col = f.g.append('g');
      segs.forEach((s, j) => {
        const v0 = share ? acc / total : acc, v1 = share ? (acc + s.v) / total : acc + s.v;
        acc += s.v;
        const y0 = y(v0), y1 = y(v1);
        const top = j === segs.length - 1;
        const hgt = Math.max(0, y0 - y1 - (top ? 0 : 2));
        col.append('path').attr('d', top ? roundedTop(x(yr), y1, x.bandwidth(), hgt, 4) : `M${x(yr)},${y1 + 2}h${x.bandwidth()}v${hgt}h${-x.bandwidth()}Z`)
          .style('fill', SERIES[s.i % SERIES.length]);
      });
      const hit = f.g.append('rect').attr('class', 'st-hit').attr('x', x(yr) - x.step() * x.paddingInner() / 2).attr('width', x.step())
        .attr('y', 0).attr('height', f.h).datum(k).attr('aria-label', `${yr}: ${plural(total, 'paper')}`);
      hover(hit, (t) => {
        tipTitle(t, `${yr}`);
        tipRow(t, total, total === 1 ? 'paper' : 'papers');
        T.topics.slice().reverse().forEach((tp) => {
          const i = T.topics.indexOf(tp);
          if (tp.counts[k]) tipRow(t, share ? `${Math.round((100 * tp.counts[k]) / total)}%` : tp.counts[k], tp.name, SERIES[i % SERIES.length]);
        });
      });
    });
    f.g.append('line').attr('class', 'st-base').attr('x1', 0).attr('x2', f.w).attr('y1', f.h).attr('y2', f.h);
  }
  legend('topics-legend', DATA.topics.topics.map((t, i) => [t.name, SERIES[i % SERIES.length]]));
  document.querySelectorAll('.st-switch button').forEach((b) => b.addEventListener('click', () => {
    topicMode = b.dataset.mode;
    document.querySelectorAll('.st-switch button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    drawTopics();
  }));

  // ------------------------------------------------------------------ 2. review race
  function drawRace() {
    const R = DATA.review;
    const rows = R.publishers;
    const narrow = document.getElementById('chart-race').clientWidth < 480;
    const ml = narrow ? 112 : 150;
    const f = frame('chart-race', rows.length * 38 + 34, { l: ml, r: 64, t: 6, b: 26 });
    if (!f) return;
    const max = d3.max(rows, (p) => p.review + (p.production || 0));
    const x = d3.scaleLinear().domain([0, max]).nice().range([0, f.w]);
    const y = d3.scaleBand().domain(rows.map((p) => p.name)).range([0, rows.length * 38]).paddingInner(0.38);
    const ticks = x.ticks(narrow ? 3 : 5);
    f.g.append('g').attr('class', 'st-gridlines').selectAll('line').data(ticks).join('line')
      .attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', 0).attr('y2', rows.length * 38);
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(ticks).join('text')
      .attr('x', (d) => x(d)).attr('y', rows.length * 38 + 18).attr('text-anchor', 'middle').text((d) => (d ? `${d} d` : '0'));
    rows.forEach((p) => {
      const g = f.g.append('g');
      const yy = y(p.name), bh = y.bandwidth();
      const w1 = x(p.review);
      g.append('path').attr('d', p.production ? `M0,${yy}h${Math.max(0, w1 - 1)}v${bh}h${-Math.max(0, w1 - 1)}Z` : roundedEnd(0, yy, w1, bh, 4)).style('fill', SERIES[0]);
      if (p.production) g.append('path').attr('d', roundedEnd(w1 + 1, yy, Math.max(2, x(p.review + p.production) - w1 - 1), bh, 4)).style('fill', SERIES[1]);
      f.g.append('text').attr('class', 'st-label').attr('x', -10).attr('y', yy + bh / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
        .text(narrow && p.name.length > 15 ? p.name.slice(0, 14) + '…' : p.name);
      f.g.append('text').attr('class', 'st-value').attr('x', x(p.review + (p.production || 0)) + 6).attr('y', yy + bh / 2).attr('dy', '0.35em')
        .text(`${Math.round(p.review + (p.production || 0))} d`);
      const hit = f.g.append('rect').attr('class', 'st-hit').attr('x', -ml).attr('width', f.w + ml).attr('y', yy - 6).attr('height', bh + 12)
        .attr('aria-label', `${p.name}: ${p.review} days to acceptance${p.production ? `, ${p.production} more to publication` : ''}`).datum(p);
      hover(hit, (t) => {
        tipTitle(t, p.name);
        tipRow(t, `${p.review} days`, `median, submission to acceptance (${plural(p.reviewN, 'paper')})`, SERIES[0]);
        if (p.production) tipRow(t, `${p.production} days`, `median, acceptance to publication (${plural(p.productionN, 'paper')})`, SERIES[1]);
        tipNote(t, p.journals.slice(0, 6).join(', ') + (p.journals.length > 6 ? ` and ${p.journals.length - 6} more` : ''));
      });
    });
    f.g.append('line').attr('class', 'st-base').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', rows.length * 38);
  }

  function drawRaceDots() {
    const pts = DATA.review.papers.filter((p) => p.review != null).sort((a, b) => a.review - b.review);
    const box = document.getElementById('chart-race-dots');
    if (!box) return;
    const W = box.clientWidth, r = W < 480 ? 4 : 5;
    const x = d3.scaleLinear().domain([0, d3.max(pts, (p) => p.review)]).nice().range([14, W - 14]);
    // dodge: stack dots upwards where they would overlap
    const placed = [];
    pts.forEach((p) => {
      const px = x(p.review);
      let lvl = 0;
      while (placed.some((q) => Math.abs(q.x - px) < 2 * r + 1 && q.lvl === lvl)) lvl++;
      placed.push({ p, x: px, lvl });
    });
    const levels = d3.max(placed, (q) => q.lvl) + 1;
    const H = Math.max(150, levels * (2 * r + 1) + 70);
    const f = frame('chart-race-dots', H, { l: 0, r: 0, t: 10, b: 28 });
    const base = f.h;
    const med = DATA.review.review;
    const ticks = x.ticks(W < 480 ? 4 : 6);
    f.g.append('g').attr('class', 'st-gridlines').selectAll('line').data(ticks).join('line').attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', 0).attr('y2', base);
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(ticks).join('text').attr('x', (d) => x(d)).attr('y', base + 18).attr('text-anchor', 'middle').text((d) => `${d} d`);
    f.g.append('line').attr('class', 'st-median').attr('x1', x(med)).attr('x2', x(med)).attr('y1', 0).attr('y2', base);
    f.g.append('text').attr('class', 'st-value').attr('x', x(med) + 6).attr('y', 10).text(`median ${med} days`);
    const dots = f.g.selectAll('circle.st-dotmark').data(placed).join('circle').attr('class', 'st-dotmark')
      .attr('cx', (q) => q.x).attr('cy', (q) => base - r - 1 - q.lvl * (2 * r + 1)).attr('r', r)
      .attr('aria-label', (q) => `${q.p.title}: ${q.p.review} days`);
    hover(dots, (t, q) => {
      tipTitle(t, q.p.title);
      tipRow(t, `${q.p.review} days`, 'from submission to acceptance', SERIES[0]);
      if (q.p.production != null) tipRow(t, `${q.p.production} days`, 'from acceptance to publication', SERIES[1]);
      tipNote(t, `${q.p.journal} · ${q.p.year}`);
    });
    f.g.append('line').attr('class', 'st-base').attr('x1', 0).attr('x2', W).attr('y1', base).attr('y2', base);
  }

  // ------------------------------------------------------------------ 3. where we publish
  function drawJournals() {
    const V = DATA.venues;
    const rows = V.journals.slice(0, 12);
    const narrow = document.getElementById('chart-journals').clientWidth < 520;
    const ml = narrow ? 150 : 250;
    const f = frame('chart-journals', rows.length * 30 + 10, { l: ml, r: 36, t: 4, b: 6 });
    if (!f) return;
    const x = d3.scaleLinear().domain([0, d3.max(rows, (j) => j.papers)]).range([0, f.w]);
    const y = d3.scaleBand().domain(rows.map((j) => j.name)).range([0, rows.length * 30]).paddingInner(0.3);
    rows.forEach((j) => {
      const yy = y(j.name), bh = y.bandwidth();
      f.g.append('path').attr('d', roundedEnd(0, yy, Math.max(3, x(j.papers)), bh, 4)).style('fill', SERIES[0]);
      const maxc = narrow ? 22 : 36;
      f.g.append('text').attr('class', 'st-label').attr('x', -10).attr('y', yy + bh / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
        .text(j.name.length > maxc ? j.name.slice(0, maxc - 1) + '…' : j.name);
      f.g.append('text').attr('class', 'st-value').attr('x', x(j.papers) + 6).attr('y', yy + bh / 2).attr('dy', '0.35em').text(j.papers);
      const hit = f.g.append('rect').attr('class', 'st-hit').attr('x', -ml).attr('width', f.w + ml + 30).attr('y', yy - 4).attr('height', bh + 8)
        .attr('aria-label', `${j.name}: ${plural(j.papers, 'paper')}`).datum(j);
      hover(hit, (t) => {
        tipTitle(t, j.name);
        tipRow(t, j.papers, j.papers === 1 ? 'paper' : 'papers');
        tipRow(t, j.open, 'open access');
        tipNote(t, j.publisher + (j.quartile ? ` · SCImago ${j.quartile}` : ''));
      });
    });
    f.g.append('line').attr('class', 'st-base').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', rows.length * 30);
  }

  function drawTiles() {
    const V = DATA.venues;
    const open = document.getElementById('tile-open');
    if (open) {
      const pct = Math.round((100 * V.open) / V.total);
      open.replaceChildren(el('p', 'st-tile-label', 'Open access'), el('p', 'st-tile-num', `${pct}%`),
        el('p', 'st-tile-sub', `${V.open} of ${V.total} papers can be read for free on the publisher's site.`));
      const bar = el('div', 'st-bar');
      const fill = el('span');
      fill.style.width = `${pct}%`;
      bar.append(fill);
      open.append(bar);
    }
    const q = document.getElementById('tile-q1');
    if (q) {
      if (V.q1) {
        q.replaceChildren(el('p', 'st-tile-label', 'Top-quartile (Q1) journals'), el('p', 'st-tile-num', `${Math.round((100 * V.q1.q1) / V.q1.known)}%`),
          el('p', 'st-tile-sub', `${V.q1.q1} of ${V.q1.known} papers in journals with a SCImago quartile.`));
      } else {
        q.replaceChildren(el('p', 'st-tile-label', 'Top-quartile (Q1) journals'), el('p', 'st-tile-num st-tile-pending', 'Coming soon'),
          el('p', 'st-tile-sub', 'Waiting for each journal\'s SCImago quartile in data/journals.json.'));
      }
    }
    const pub = document.getElementById('tile-publishers');
    if (pub) {
      pub.replaceChildren(el('p', 'st-tile-label', 'Publishers'), el('p', 'st-tile-num', String(V.publishers.filter((p) => p.name !== 'Other' && p.name !== 'Conference').length)));
      const ul = el('ul', 'st-mini');
      const top = V.publishers.filter((p) => p.name !== 'Other').slice(0, 5);
      const max = top[0] ? top[0].papers : 1;
      top.forEach((p) => {
        const li = el('li');
        const b = el('span', 'st-mini-bar');
        b.style.width = `${(100 * p.papers) / max}%`;
        li.append(el('span', 'st-mini-name', p.name), el('span', 'st-mini-track'), el('span', 'st-mini-n', String(p.papers)));
        li.children[1].append(b);
        ul.append(li);
      });
      pub.append(ul);
    }
  }

  // ------------------------------------------------------------------ 4. the lab over time
  function drawLab() {
    const L = DATA.lab;
    const rows = L.members.filter((m) => m.start);
    const box = document.getElementById('chart-lab');
    if (!box) return;
    const narrow = box.clientWidth < 600;
    const ml = narrow ? 118 : 190;
    const rowH = 24;
    const f = frame('chart-lab', rows.length * rowH + 40, { l: ml, r: 16, t: 4, b: 30 });
    const now = toDate(L.today);
    const firstYears = rows.filter((m) => m.first).map((m) => new Date(m.first.year, 0, 1));
    const t0 = d3.min([...rows.map((m) => toDate(m.start)), ...firstYears]);
    const x = d3.scaleTime().domain([new Date(t0.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31)]).range([0, f.w]);
    const ticks = x.ticks(d3.timeYear.every(1));
    f.g.append('g').attr('class', 'st-gridlines').selectAll('line').data(ticks).join('line').attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', 0).attr('y2', rows.length * rowH);
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(ticks).join('text').attr('x', (d) => x(d) + 4).attr('y', rows.length * rowH + 18)
      .text((d) => (narrow ? `'${String(d.getFullYear()).slice(2)}` : d.getFullYear()));
    f.g.append('line').attr('class', 'st-today').attr('x1', x(now)).attr('x2', x(now)).attr('y1', -2).attr('y2', rows.length * rowH);
    rows.forEach((m, i) => {
      const yy = i * rowH + 5, bh = rowH - 10;
      const gi = L.groups.indexOf(m.group);
      const a = x(toDate(m.start));
      const endDate = m.current ? now : new Date(toDate(m.end).getFullYear(), toDate(m.end).getMonth() + 1, 0);
      const b = Math.max(a + 4, x(endDate));
      f.g.append('path').attr('d', m.current ? `M${a},${yy}H${b}V${yy + bh}H${a}Z` : roundedEnd(a, yy, b - a, bh, 3)).style('fill', SERIES[gi]).attr('class', m.current ? 'st-bar-now' : '');
      if (m.first) {
        const fx = x(new Date(m.first.year, 6, 1));
        f.g.append('path').attr('class', 'st-first').attr('d', d3.symbol(d3.symbolDiamond, 52)()).attr('transform', `translate(${fx},${yy + bh / 2})`);
      }
      const maxc = narrow ? 15 : 26;
      f.g.append('text').attr('class', 'st-label').attr('x', -10).attr('y', yy + bh / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
        .text(m.name.length > maxc ? m.name.slice(0, maxc - 1) + '…' : m.name);
      const hit = f.g.append('rect').attr('class', 'st-hit').attr('x', -ml).attr('width', f.w + ml).attr('y', i * rowH).attr('height', rowH)
        .attr('aria-label', `${m.name}, ${m.title}, ${fmtMonth(m.start)} to ${m.current ? 'now' : fmtMonth(m.end)}`).datum(m);
      hover(hit, (t) => {
        tipTitle(t, m.name);
        tipRow(t, m.title, '', SERIES[gi]);
        tipNote(t, `${fmtMonth(m.start)} – ${m.current ? 'now' : fmtMonth(m.end)}`);
        tipRow(t, m.papers, m.papers === 1 ? 'joint paper' : 'joint papers');
        if (m.first) tipNote(t, `First paper with us (${m.first.year}): ${m.first.title}`);
      });
    });
  }
  const labLegend = DATA.lab.groups.map((g, i) => [g, SERIES[i]]);
  legend('lab-legend', labLegend);
  (function () {
    const box = document.getElementById('lab-legend');
    if (!box) return;
    const s = el('span');
    const k = el('i', 'st-diamond');
    s.append(k, 'First joint paper');
    const s2 = el('span');
    s2.append(el('i', 'st-today-key'), 'Today');
    box.append(s, s2);
  })();

  // ------------------------------------------------------------------ 5. team size
  function drawTeam() {
    const T = DATA.team;
    const box = document.getElementById('chart-team');
    if (!box) return;
    const narrow = box.clientWidth < 560;
    const f = frame('chart-team', narrow ? 300 : 360, { l: 36, r: 12, t: 12, b: 28 });
    const years = T.years.map((t) => t.year);
    const x = d3.scaleBand().domain(years).range([0, f.w]).padding(0.12);
    const y = d3.scaleLinear().domain([0, d3.max(T.papers, (p) => p.authors) + 1]).nice().range([f.h, 0]);
    const r = narrow ? 3.2 : 4;
    const ticks = y.ticks(6).filter((d) => Number.isInteger(d));
    f.g.append('g').attr('class', 'st-gridlines').selectAll('line').data(ticks).join('line').attr('x1', 0).attr('x2', f.w).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(ticks).join('text').attr('x', -8).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text((d) => d);
    f.g.append('g').attr('class', 'st-axis').selectAll('text').data(years).join('text').attr('x', (d) => x(d) + x.bandwidth() / 2).attr('y', f.h + 18).attr('text-anchor', 'middle').text((d) => d);
    f.g.append('text').attr('class', 'st-axis').attr('x', -8).attr('y', -2).attr('text-anchor', 'start').attr('transform', null).text('');
    // dots: centred in their year, spread sideways where they share a value
    const pts = [];
    years.forEach((yr) => {
      const inYear = T.papers.filter((p) => p.year === yr);
      const byVal = d3.group(inYear, (p) => p.authors);
      byVal.forEach((list, v) => {
        const gap = list.length > 1 ? Math.min(2 * r + 1.5, (x.bandwidth() - 2 * r) / (list.length - 1)) : 0;
        list.forEach((p, i) => {
          const cx = x(yr) + x.bandwidth() / 2 + (i - (list.length - 1) / 2) * gap;
          pts.push({ p, cx, cy: y(v) });
        });
      });
    });
    const dots = f.g.selectAll('circle.st-dotmark').data(pts).join('circle').attr('class', 'st-dotmark').attr('cx', (q) => q.cx).attr('cy', (q) => q.cy).attr('r', r)
      .attr('aria-label', (q) => `${q.p.title}: ${plural(q.p.authors, 'author')}`);
    hover(dots, (t, q) => {
      tipTitle(t, q.p.title);
      tipRow(t, q.p.authors, q.p.authors === 1 ? 'author' : 'authors', SERIES[0]);
      tipNote(t, `${q.p.journal} · ${q.p.year}`);
    });
    const line = d3.line().x((t) => x(t.year) + x.bandwidth() / 2).y((t) => y(t.median));
    f.g.append('path').attr('class', 'st-median-line').attr('d', line(T.years));
    const meds = f.g.selectAll('g.st-med').data(T.years).join('g').attr('class', 'st-med');
    meds.append('circle').attr('cx', (t) => x(t.year) + x.bandwidth() / 2).attr('cy', (t) => y(t.median)).attr('r', 4.5);
    hover(meds, (t, d) => {
      tipTitle(t, String(d.year));
      tipRow(t, d.median, 'authors, median');
      tipRow(t, d.mean, 'authors, mean');
      tipRow(t, d.max, 'authors on the largest paper');
      tipNote(t, plural(d.papers, 'paper'));
    });
    f.g.append('line').attr('class', 'st-base').attr('x1', 0).attr('x2', f.w).attr('y1', f.h).attr('y2', f.h);
  }

  // ------------------------------------------------------------------ draw, and redraw on resize
  function drawAll() { hideTip(); drawTopics(); drawRace(); drawRaceDots(); drawJournals(); drawTiles(); drawLab(); drawTeam(); }
  drawAll();
  let lastW = window.innerWidth, timer = null;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (Math.abs(window.innerWidth - lastW) > 8) { lastW = window.innerWidth; drawAll(); } }, 200);
  });
  window.addEventListener('scroll', () => { if (Date.now() - shownAt > 250) hideTip(); }, { passive: true });
})();
