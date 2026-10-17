/* The collaboration map, with a timeline that adds the papers one by one (team.html and statistics-demo.html).
   Data, both written by tools/build_statistics.py: the "map" part of the <script id="stats-data"> block on
   statistics-demo.html, or window.ACML_COLLAB from data/collab-map.js on team.html (loaded by js/collab-map-loader.js).
   Needs d3 (js/vendor/d3.min.js), topojson-client (js/vendor/topojson-client.min.js) and the world outline (data/world-50m.js). */
(function () {
  'use strict';
  const mapEl = document.getElementById('cm-map');
  const dataEl = document.getElementById('stats-data');
  const loading = document.getElementById('cm-loading');
  const ALL = dataEl ? JSON.parse(dataEl.textContent) : window.ACML_COLLAB;
  if (!mapEl || !ALL) return;
  if (!window.d3 || !window.topojson || !window.ACML_WORLD) {
    if (loading) loading.textContent = dataEl ? 'The map could not load. The same data is in the table below.' : 'The map could not load. Please refresh the page.';
    return;
  }
  const d3 = window.d3;
  const DATA = Object.assign({ totals: ALL.totals }, ALL.map);
  const ALL_PLACES = DATA.places.filter((p) => p.people > 0 || p.hub);
  const ORDER = DATA.papers;                               // every paper, oldest first
  const RANK = new Map(ORDER.map((p, i) => [p.slug, i]));
  const LAST = ORDER.length - 1;
  let step = LAST;
  let places = ALL_PLACES;
  const homes = DATA.hubs.map((h) => ALL_PLACES.find((p) => p.key === h.key)).filter(Boolean);
  const HOME_A = [homes[0].lng, homes[0].lat];
  const HOME_B = [homes[1].lng, homes[1].lat];
  const MID = d3.geoInterpolate(HOME_A, HOME_B)(0.5);
  const world = window.topojson.feature(window.ACML_WORLD, window.ACML_WORLD.objects.countries);
  world.features = world.features.filter((f) => f.id !== '010');   // no Antarctica
  const VIEWS = { europe: [[-11, 35], [40, 60.5]], israel: [[34.25, 31.35], [35.85, 33.2]] };

  const svg = d3.select('#cm-svg');
  const tip = document.getElementById('cm-tip');
  const panel = document.getElementById('cm-panel');
  const viewButtons = Array.from(document.querySelectorAll('button[data-view]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gZoom = svg.append('g');
  const gLand = gZoom.append('g');
  const gArcs = gZoom.append('g');
  const gHome = gZoom.append('g');
  const gMarks = svg.append('g');
  const gLabels = svg.append('g').attr('aria-hidden', 'true');

  let W = 0, H = 0, S = 1, projection, path, transform = d3.zoomIdentity, clusters = [], selectedKey = null, hoverKeys = null;
  const wide = window.matchMedia('(min-width: 1024px)');
  const radius = (n, home) => S * Math.max(home ? 7.5 : 4, Math.min(22, 3 + 2.1 * Math.sqrt(n)));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  const zoom = d3.zoom()
    .scaleExtent([1, 140])
    .filter((e) => (e.type === 'wheel' ? e.ctrlKey || e.metaKey : !e.button))
    .on('zoom', (e) => {
      transform = e.transform;
      gZoom.attr('transform', transform);
      if (e.sourceEvent) setPressed(null);
      drawMarks();
    });
  svg.call(zoom).on('dblclick.zoom', null);

  // ------------------------------------------------------------------ layout
  function layout() {
    W = mapEl.clientWidth;
    H = Math.round(Math.max(220, Math.min(620, W * 0.56)));
    S = W < 640 ? 0.75 : 1;
    mapEl.style.height = H + 'px';
    panel.style.maxHeight = wide.matches ? H + 'px' : '';
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    projection = d3.geoNaturalEarth1().fitExtent([[12, 12], [W - 12, H - 12]], world);
    path = d3.geoPath(projection);
    zoom.extent([[0, 0], [W, H]]).translateExtent([[-W * 0.25, -H * 0.25], [W * 1.25, H * 1.25]]);

    gLand.selectAll('path').data(world.features).join('path').attr('class', 'cm-land').attr('d', path);
    gArcs.selectAll('path').remove();
    drawArcs(false);
    const line = { type: 'LineString', coordinates: [HOME_A, HOME_B] };
    gHome.selectAll('path').data(['cm-home-casing', 'cm-home-line']).join('path').attr('class', (c) => c).attr('d', path(line));
    if (loading) loading.hidden = true;
  }

  function drawArcs(animate) {
    const arcs = places.filter((p) => !p.hub && p.people > 0);
    gArcs.selectAll('path').data(arcs, (p) => p.key).join(
      (enter) => enter.append('path').attr('class', 'cm-arc')
        .attr('d', (p) => path({ type: 'LineString', coordinates: [MID, [p.lng, p.lat]] }))
        .each(function () {
          if (!animate || reduceMotion) return;
          const len = this.getTotalLength();
          d3.select(this).attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
            .transition().duration(700).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
            .on('end', function () { d3.select(this).attr('stroke-dasharray', null).attr('stroke-dashoffset', null); });
        }),
      (update) => update,
      (exit) => exit.remove())
      .style('stroke-width', (p) => (0.7 + 0.45 * Math.sqrt(p.people)) + 'px');
  }

  // ------------------------------------------------------------------ the timeline: the map as it was after paper k
  function derive(k) {
    const out = [];
    for (const p of ALL_PLACES) {
      const seen = new Set();
      const insts = [];
      for (const inst of p.institutions) {
        const ppl = [];
        for (const q of inst.people) {
          const s = q.slugs.filter((x) => RANK.get(x) <= k);
          if (s.length) { ppl.push({ name: q.name, lab: q.lab, papers: s.length }); s.forEach((x) => seen.add(x)); }
        }
        if (ppl.length) insts.push({ name: inst.name, people: ppl.sort((a, b) => (b.papers - a.papers) || a.name.localeCompare(b.name)) });
      }
      const people = insts.reduce((n, i) => n + i.people.length, 0);
      if (people || p.hub) out.push(Object.assign({}, p, { institutions: insts.sort((a, b) => b.people.length - a.people.length), people, papers: seen.size }));
    }
    return out.sort((a, b) => (b.people - a.people) || (b.papers - a.papers) || a.city.localeCompare(b.city));
  }
  const stepInput = document.getElementById('cm-step');
  const stepLabel = document.getElementById('cm-time-label');
  const stepPaper = document.getElementById('cm-time-paper');
  const playBtn = document.getElementById('cm-play');
  let timer = null;
  function applyStep(k, animate) {
    step = k;
    places = k >= LAST ? ALL_PLACES : derive(k);
    if (stepInput) stepInput.value = String(k);
    const paper = ORDER[k];
    if (stepLabel) {
      stepLabel.textContent = k >= LAST ? `All ${ORDER.length} papers, ${ORDER[0].year}–${ORDER[LAST].year}` : `${paper.year} · paper ${k + 1} of ${ORDER.length}`;
    }
    if (stepPaper) stepPaper.textContent = k >= LAST ? '' : paper.title;
    drawArcs(animate);
    const sel = selectedKey && places.find((q) => q.key === selectedKey);
    if (selectedKey && !sel) selectedKey = null;
    renderPanel(sel || null);
    drawMarks();
    highlight(null);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    if (playBtn) { playBtn.classList.remove('is-playing'); playBtn.querySelector('.cm-play-text').textContent = 'Play'; playBtn.setAttribute('aria-label', 'Play: grow the network paper by paper'); }
  }
  function play() {
    if (step >= LAST) applyStep(0, true);
    playBtn.classList.add('is-playing');
    playBtn.querySelector('.cm-play-text').textContent = 'Pause';
    playBtn.setAttribute('aria-label', 'Pause');
    timer = setInterval(() => {
      if (step >= LAST) { stop(); return; }
      applyStep(step + 1, true);
    }, Math.max(90, Math.round(18000 / ORDER.length)));
  }
  if (stepInput) {
    stepInput.max = String(LAST);
    stepInput.value = String(LAST);
    stepInput.addEventListener('input', () => { stop(); applyStep(Number(stepInput.value), false); });
    layoutTicks();
  }
  function layoutTicks() {
    const ticks = document.getElementById('cm-ticks');
    if (!ticks) return;
    ticks.replaceChildren();
    const width = ticks.clientWidth || 300;
    const firstOfYear = new Map();
    ORDER.forEach((p, i) => { if (!firstOfYear.has(p.year)) firstOfYear.set(p.year, i); });
    const items = Array.from(firstOfYear, ([y, i]) => ({ y, px: (width * i) / Math.max(1, LAST) }));
    const kept = items.length ? [items[0]] : [];     // the first year, then the most recent years that fit
    for (let k = items.length - 1; k >= 1; k--) {
      if (kept.every((t) => Math.abs(t.px - items[k].px) >= 34)) kept.push(items[k]);
    }
    kept.forEach((t) => {
      const s = el('span', null, String(t.y));
      s.style.left = `${(100 * t.px) / width}%`;
      ticks.append(s);
    });
  }
  if (playBtn) playBtn.addEventListener('click', () => (timer ? stop() : play()));

  // ------------------------------------------------------------------ marks (screen space, so dots keep their size)
  function cluster() {
    const pts = places.map((p) => {
      const [x, y] = transform.apply(projection([p.lng, p.lat]));
      return { p, x, y, r: radius(p.people, p.hub) };
    }).sort((a, b) => (b.p.hub - a.p.hub) || (b.p.people - a.p.people));
    const out = [];
    for (const q of pts) {
      const c = out.find((c) => Math.hypot(c.x - q.x, c.y - q.y) < (c.r + q.r) * 0.85 + 2);
      if (c) {
        c.members.push(q.p);
        c.people += q.p.people;
        c.r = radius(c.people, c.home);
      } else {
        out.push({ x: q.x, y: q.y, r: q.r, members: [q.p], people: q.p.people, home: q.p.hub });
      }
    }
    out.forEach((c) => {
      c.key = c.members.map((m) => m.key).join('|');
      c.single = c.members.length === 1;
    });
    return out;
  }

  function drawMarks() {
    clusters = cluster();
    const [mx, my] = transform.apply(projection(MID));
    gMarks.selectAll('circle.cm-mid').data([0]).join((enter) => enter.append('circle').attr('class', 'cm-mid').attr('r', 4.5)
      .call((c) => c.append('title').text('Halfway between Haifa and Jönköping: every line starts here')))
      .attr('cx', mx).attr('cy', my);

    const marks = gMarks.selectAll('g.cm-mark').data(clusters, (c) => c.key).join((enter) => {
      const g = enter.append('g').attr('class', 'cm-mark');
      g.append('circle').attr('class', 'cm-dot');
      g.append('circle').attr('class', 'cm-hit').attr('tabindex', 0).attr('role', 'button')
        .on('pointerenter pointermove', (e, c) => { if (e.pointerType !== 'touch') { showTip(c, e); highlight(c); } })
        .on('pointerleave', () => { hideTip(); highlight(null); })
        .on('focus', function (e, c) { this.parentNode.classList.add('is-focus'); showTip(c); highlight(c); })
        .on('blur', function () { this.parentNode.classList.remove('is-focus'); hideTip(); highlight(null); })
        .on('click', (e, c) => { e.stopPropagation(); choose(c); })
        .on('keydown', (e, c) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(c); } });
      return g;
    });
    marks.attr('transform', (c) => `translate(${c.x},${c.y})`)
      .classed('is-selected', (c) => selectedKey != null && c.members.some((m) => m.key === selectedKey));
    marks.select('.cm-dot').attr('r', (c) => c.r)
      .classed('is-home', (c) => c.home).classed('is-cluster', (c) => !c.single);
    marks.select('.cm-hit').attr('r', (c) => Math.max(12, c.r + 6))
      .attr('aria-label', (c) => (c.single
        ? `${c.members[0].city}, ${c.members[0].country}: ${plural(c.people, 'co-author')}, ${plural(c.members[0].papers, 'joint paper')}`
        : `${c.members.length} places around ${c.members[0].city}: ${plural(c.people, 'co-author')}. Press Enter to zoom in.`));
    marks.selectAll('text.cm-count').data((c) => (c.single ? [] : [c])).join('text').attr('class', 'cm-count')
      .text((c) => c.members.length);
    drawLabels();
  }

  function drawLabels() {
    const placed = [];
    const items = [];
    const order = clusters.slice().sort((a, b) => (b.home - a.home) || (b.people - a.people));
    for (const c of order) {
      const name = c.single ? c.members[0].city : `${c.members[0].city} +${c.members.length - 1}`;
      const w = name.length * (c.home ? 7.4 : 6.6) + 4, h = 14;
      const spots = [[c.x + c.r + 4, c.y - h / 2], [c.x - c.r - 4 - w, c.y - h / 2], [c.x - w / 2, c.y - c.r - 3 - h], [c.x - w / 2, c.y + c.r + 3]];
      for (const [x, y] of spots) {
        if (x < 4 || x + w > W - 4 || y < 2 || y + h > H - 2) continue;
        const hitsLabel = placed.some((b) => x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y);
        const hitsMark = clusters.some((o) => o !== c && o.x + o.r > x && o.x - o.r < x + w && o.y + o.r > y && o.y - o.r < y + h);
        if (hitsLabel || hitsMark) continue;
        placed.push({ x, y, w, h });
        items.push({ c, name, x, y: y + h / 2 });
        break;
      }
    }
    gLabels.selectAll('text').data(items, (d) => d.c.key).join('text')
      .attr('class', (d) => 'cm-label' + (d.c.home ? ' is-home' : ''))
      .attr('x', (d) => d.x).attr('y', (d) => d.y).attr('dy', '0.35em').text((d) => d.name);
  }

  function highlight(c) {
    hoverKeys = c ? new Set(c.members.map((m) => m.key)) : null;
    const sel = selectedKey;
    gArcs.selectAll('path')
      .classed('is-on', (p) => (hoverKeys ? hoverKeys.has(p.key) : p.key === sel))
      .classed('is-dim', (p) => (hoverKeys ? !hoverKeys.has(p.key) : sel != null && p.key !== sel));
  }

  // ------------------------------------------------------------------ tooltip
  function showTip(c, e) {
    tip.replaceChildren();
    if (c.single) {
      const p = c.members[0];
      tip.append(el('h3', null, `${p.city}, ${p.country}`));
      const nums = el('p', 'cm-tip-nums');
      if (p.people) {
        nums.append(el('b', null, String(p.people)), ` ${p.people === 1 ? 'co-author' : 'co-authors'} · `,
          el('b', null, String(p.papers)), ` ${p.papers === 1 ? 'joint paper' : 'joint papers'}`);
      } else {
        nums.textContent = 'One of our two homes';
      }
      tip.append(nums);
      let shown = 0, insts = 0;
      for (const inst of p.institutions) {
        if (shown >= 9) break;
        insts += 1;
        tip.append(el('p', 'cm-inst', inst.name));
        const ul = el('ul');
        const take = inst.people.slice(0, Math.max(1, Math.min(inst.people.length, 9 - shown)));
        take.forEach((q) => {
          const li = el('li');
          const n = el('span', null, q.name);
          if (q.lab) n.append(el('span', 'cm-badge', 'Lab'));
          li.append(n, el('span', null, plural(q.papers, 'paper')));
          ul.append(li);
        });
        shown += take.length;
        tip.append(ul);
        if (take.length < inst.people.length) tip.append(el('p', 'cm-more', `and ${inst.people.length - take.length} more`));
      }
      const restInst = p.institutions.length - insts;
      if (restInst > 0) tip.append(el('p', 'cm-more', `and ${plural(restInst, 'more institution')}`));
      if (p.people) tip.append(el('p', 'cm-hint', 'Click for the full list'));
    } else {
      tip.append(el('h3', null, `${c.members.length} places around ${c.members[0].city}`));
      const nums = el('p', 'cm-tip-nums');
      nums.append(el('b', null, String(c.people)), ' co-authors');
      tip.append(nums);
      const ul = el('ul');
      c.members.slice(0, 10).forEach((m) => {
        const li = el('li');
        li.append(el('span', null, m.city + (m.hub ? ' (home)' : '')), el('span', null, plural(m.people, 'co-author')));
        ul.append(li);
      });
      tip.append(ul);
      if (c.members.length > 10) tip.append(el('p', 'cm-more', `and ${c.members.length - 10} more`));
      tip.append(el('p', 'cm-hint', 'Click to zoom in'));
    }
    tip.hidden = false;
    const box = mapEl.getBoundingClientRect();
    let x, y;
    if (e && e.clientX != null) { x = e.clientX - box.left + 14; y = e.clientY - box.top + 14; } else { x = c.x + c.r + 10; y = c.y + 10; }
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > W - 8) x = Math.max(8, x - tw - 28);
    if (y + th > H - 8) y = Math.max(8, H - th - 8);
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function hideTip() { tip.hidden = true; }

  // ------------------------------------------------------------------ selection and the side panel
  function choose(c) {
    hideTip();
    if (!c.single) { zoomToPlaces(c.members); return; }
    select(c.members[0].key);
  }

  function select(key) {
    selectedKey = key;
    const p = places.find((q) => q.key === key);
    renderPanel(p);
    drawMarks();
    highlight(null);
  }

  function renderPanel(p) {
    panel.replaceChildren();
    if (!p) {
      const live = places.filter((q) => q.people > 0);
      const t = { placed: live.reduce((n, q) => n + q.people, 0), places: live.length, countries: new Set(live.map((q) => q.country)).size,
        abroad: live.filter((q) => q.country !== 'Israel').reduce((n, q) => n + q.people, 0) };
      panel.append(el('h3', null, step >= LAST ? 'Where our co-authors are' : `By ${ORDER[step].year}, after ${plural(step + 1, 'paper')}`));
      const sub = el('p', 'cm-p-sub');
      sub.append(el('b', null, String(t.placed)), ' co-authors in ', el('b', null, String(t.places)), ' cities and ',
        el('b', null, String(t.countries)), ' countries. ', el('b', null, String(t.abroad)), ' of them work outside Israel.');
      panel.append(sub);
      panel.append(el('h4', null, 'Most co-authors'));
      const ul = el('ul');
      places.filter((q) => q.people > 0).slice(0, 12).forEach((q) => {
        const li = el('li');
        const b = el('button', 'cm-row');
        b.type = 'button';
        b.append(el('span', 'name', `${q.city}, ${q.country}`), el('span', 'n', plural(q.people, 'co-author')));
        b.addEventListener('click', () => { goTo(q); select(q.key); });
        li.append(b);
        ul.append(li);
      });
      panel.append(ul);
      const missing = (DATA.unplaced || []).filter((u) => u.slugs.some((x) => RANK.get(x) <= step));
      if (missing.length) {
        panel.append(el('p', 'cm-p-foot', `Not on the map: ${missing.map((u) => u.name).join(', ')}. Our copies of their papers do not print an affiliation.`));
      }
      return;
    }
    const close = el('button', 'cm-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Back to the overview');
    close.addEventListener('click', () => { selectedKey = null; renderPanel(null); drawMarks(); highlight(null); });
    panel.append(close, el('h3', null, p.city));
    const sub = el('p', 'cm-p-sub');
    if (p.people) {
      sub.append(`${p.country} · `, el('b', null, String(p.people)), ` ${p.people === 1 ? 'co-author' : 'co-authors'} · `,
        el('b', null, String(p.papers)), ` ${p.papers === 1 ? 'joint paper' : 'joint papers'}`);
    } else {
      sub.textContent = `${p.country} · one of our two homes`;
    }
    panel.append(sub);
    p.institutions.forEach((inst) => {
      panel.append(el('h4', null, `${inst.name} (${inst.people.length})`));
      const ul = el('ul');
      inst.people.forEach((q) => {
        const li = el('li');
        const n = el('span', 'name', q.name);
        if (q.lab) n.append(el('span', 'cm-badge', q.lab === 'current' ? 'Lab' : 'Lab alumni'));
        li.append(n, el('span', 'n', plural(q.papers, 'paper')));
        ul.append(li);
      });
      panel.append(ul);
    });
  }

  // ------------------------------------------------------------------ zooming
  function boundsOf(rect) {
    const [[lon0, lat0], [lon1, lat1]] = rect;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const lon = lon0 + (lon1 - lon0) * i / 8, lat = lat0 + (lat1 - lat0) * i / 8;
      pts.push([lon, lat0], [lon, lat1], [lon0, lat], [lon1, lat]);
    }
    const xy = pts.map((q) => projection(q));
    return [[d3.min(xy, (q) => q[0]), d3.min(xy, (q) => q[1])], [d3.max(xy, (q) => q[0]), d3.max(xy, (q) => q[1])]];
  }
  function zoomToRect(rect, duration) {
    if (!rect) {
      svg.transition().duration(duration == null ? 650 : duration).call(zoom.transform, d3.zoomIdentity);
      return;
    }
    const [[x0, y0], [x1, y1]] = boundsOf(rect);
    const k = Math.max(1, Math.min(140, 0.9 / Math.max((x1 - x0) / W, (y1 - y0) / H)));
    const t = d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, H / 2 - k * (y0 + y1) / 2).scale(k);
    svg.transition().duration(duration == null ? 750 : duration).call(zoom.transform, t);
  }
  function zoomToPlaces(list) {
    const lons = list.map((p) => p.lng), lats = list.map((p) => p.lat);
    const pad = 0.35;
    const lon0 = d3.min(lons), lon1 = d3.max(lons), lat0 = d3.min(lats), lat1 = d3.max(lats);
    const cx = (lon0 + lon1) / 2, cy = (lat0 + lat1) / 2;
    const sx = Math.max(0.6, (lon1 - lon0) * (1 + pad)), sy = Math.max(0.45, (lat1 - lat0) * (1 + pad));
    setPressed(null);
    zoomToRect([[cx - sx / 2, cy - sy / 2], [cx + sx / 2, cy + sy / 2]]);
  }
  function inRect(p, rect) { return p.lng >= rect[0][0] && p.lng <= rect[1][0] && p.lat >= rect[0][1] && p.lat <= rect[1][1]; }
  function goTo(p) {
    const view = inRect(p, VIEWS.israel) ? 'israel' : inRect(p, VIEWS.europe) ? 'europe' : 'world';
    setPressed(view);
    zoomToRect(VIEWS[view] || null);
  }
  function setPressed(view) { viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view))); }
  viewButtons.forEach((b) => b.addEventListener('click', () => { setPressed(b.dataset.view); zoomToRect(VIEWS[b.dataset.view] || null); }));

  svg.on('click', () => { hideTip(); });
  document.querySelectorAll('.cm-zoom button').forEach((b) => b.addEventListener('click', () => {
    setPressed(null);
    svg.transition().duration(350).call(zoom.scaleBy, b.dataset.zoom === 'in' ? 1.8 : 1 / 1.8);
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideTip(); if (selectedKey) { selectedKey = null; renderPanel(null); drawMarks(); highlight(null); } }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (Math.abs(mapEl.clientWidth - W) < 2) return;
      layout();
      layoutTicks();
      transform = d3.zoomIdentity;
      svg.call(zoom.transform, d3.zoomIdentity);
      setPressed('world');
      drawMarks();
    }, 200);
  });

  layout();
  applyStep(LAST, false);
})();
