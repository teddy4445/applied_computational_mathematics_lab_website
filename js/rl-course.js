/* RL course pages (rl-course/, made by tools/build_rl_course.py): menu, section menu, the episode player and its transcript.
   Video players use js/videos.js (click to load a privacy-enhanced YouTube embed). The labs are in js/rl-labs.js. */
(function () {
  // menu and navbar (js/main.js expects to sit at the site root)
  var btn = document.getElementById('menu-btn'), menu = document.getElementById('mobile-menu'), nav = document.getElementById('navbar');
  if (btn && menu) btn.addEventListener('click', function () { menu.classList.toggle('max-h-0'); menu.classList.toggle('max-h-screen'); });
  if (nav) {
    var onScroll = function () { nav.classList.toggle('nav-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // section menu: mark the section being read
  var links = {};
  document.querySelectorAll('.proj-subnav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var sections = Object.keys(links).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var activeLink = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || !links[e.target.id]) return;
        if (activeLink) activeLink.classList.remove('is-active');
        activeLink = links[e.target.id];
        activeLink.classList.add('is-active');
        var bar = activeLink.parentNode.parentNode;
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: activeLink.offsetLeft - 16, behavior: 'smooth' });
      });
    }, { rootMargin: '-140px 0px -60% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  // ---- episode player (lecture pages) ----
  var dataEl = document.getElementById('rl-episodes');
  var player = document.getElementById('rl-player');
  if (!dataEl || !player) return;
  var episodes;
  try { episodes = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var byEp = {};
  episodes.forEach(function (e) { byEp[e.ep] = e; });
  var items = Array.prototype.slice.call(document.querySelectorAll('.rl-ep[data-ep]'));
  var now = {
    num: document.getElementById('rl-now-num'), title: document.getElementById('rl-now-title'), hook: document.getElementById('rl-now-hook'),
    take: document.getElementById('rl-now-take'), txWhich: document.getElementById('rl-tx-which')
  };
  var tx = document.getElementById('rl-tx');
  var txEps = Array.prototype.slice.call(document.querySelectorAll('.rl-tx-ep[data-ep]'));

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function watchUrl(e, start) { return 'https://www.youtube.com/watch?v=' + encodeURIComponent(e.youtube) + (start ? '&t=' + start + 's' : ''); }

  function facade(e) {
    player.dataset.ytId = e.youtube;
    player.dataset.ytTitle = e.title;
    player.classList.remove('is-playing');
    player.innerHTML = '<a class="yt-play" href="' + esc(watchUrl(e)) + '" aria-label="Play episode ' + e.ep + ': ' + esc(e.title) + '">' +
      '<img src="' + esc(e.thumbAbs) + '" alt="" decoding="async"><span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a>';
  }

  function playAt(e, start) {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(e.youtube) + '?autoplay=1&rel=0&playsinline=1' + (start ? '&start=' + start : '');
    iframe.title = e.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    player.dataset.ytId = e.youtube;
    player.replaceChildren(iframe);
    player.classList.add('is-playing');
  }

  function show(e, autoplay) {
    items.forEach(function (it) {
      var on = Number(it.dataset.ep) === e.ep;
      it.classList.toggle('is-active', on);
      if (on) it.setAttribute('aria-current', 'true'); else it.removeAttribute('aria-current');
    });
    if (now.num) now.num.textContent = 'Episode ' + e.ep + ' · ' + e.duration;
    if (now.title) now.title.textContent = e.title;
    if (now.hook) now.hook.textContent = e.hook;
    if (now.take) now.take.lastElementChild.textContent = e.takeaway;
    if (now.txWhich) now.txWhich.textContent = 'Episode ' + e.ep;
    txEps.forEach(function (t) { t.hidden = Number(t.dataset.ep) !== e.ep; });
    current = e;
    if (autoplay) playAt(e, 0); else facade(e);
  }

  var current = byEp[items.length ? Number(items[0].dataset.ep) : episodes[0].ep];

  items.forEach(function (it) {
    it.addEventListener('click', function (ev) {
      if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      var e = byEp[Number(it.dataset.ep)];
      show(e, true);
      if (history.replaceState) history.replaceState(null, '', '#ep-' + e.ep);
      var top = player.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * 0.6) player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // transcript: a timestamp plays the current episode from there
  if (tx) {
    tx.addEventListener('click', function (ev) {
      var b = ev.target.closest('.rl-tx-t');
      if (!b || !current) return;
      playAt(current, Number(b.dataset.s) || 0);
      var top = player.getBoundingClientRect().top;
      if (top < 130) player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // #ep-N in the address selects that episode (without playing it)
  function fromHash() {
    var m = /^#ep-(\d+)$/.exec(location.hash);
    if (m && byEp[Number(m[1])]) {
      show(byEp[Number(m[1])], false);
      var w = document.getElementById('watch');
      if (w) w.scrollIntoView();
    }
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
