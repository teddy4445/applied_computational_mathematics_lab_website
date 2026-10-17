/* team.html: loads the collaboration map only when its section comes near the screen, so the page itself stays light.
   Order: d3, topojson-client, the world outline and the map data (in parallel), then js/coauthor-map.js, which draws it. */
(function () {
  'use strict';
  const mapEl = document.getElementById('cm-map');
  if (!mapEl) return;
  let started = false;
  const load = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('could not load ' + src));
    document.body.appendChild(s);
  });
  function summary() {
    const out = document.getElementById('cm-summary');
    const data = window.ACML_COLLAB;
    if (!out || !data || !data.totals) return;
    const t = data.totals;
    out.textContent = `${t.coauthors} co-authors · ${t.institutions} institutions · ${t.places} cities · ${t.countries} countries`;
  }
  async function start() {
    if (started) return;
    started = true;
    try {
      await Promise.all([
        window.d3 ? null : load('js/vendor/d3.min.js'),
        window.topojson ? null : load('js/vendor/topojson-client.min.js'),
        window.ACML_WORLD ? null : load('data/world-50m.js'),
        window.ACML_COLLAB ? null : load('data/collab-map.js'),
      ]);
      summary();
      await load('js/coauthor-map.js');
    } catch (err) {
      const msg = document.getElementById('cm-loading');
      if (msg) msg.textContent = 'The map could not load. Please refresh the page.';
    }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '900px 0px' });
    io.observe(mapEl);
  } else {
    start();
  }
})();
