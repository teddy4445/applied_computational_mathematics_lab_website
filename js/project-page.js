/* Project pages (projects/<slug>/, made by tools/build_projects.py): menu, section menu and the paper filter. */
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
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (current) current.classList.remove('is-active');
        current = links[e.target.id];
        current.classList.add('is-active');
        if (current.scrollIntoView && current.parentNode.parentNode.scrollWidth > current.parentNode.parentNode.clientWidth) {
          var bar = current.parentNode.parentNode;
          bar.scrollTo({ left: current.offsetLeft - 16, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-140px 0px -60% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  // filter the papers by words in the title, authors, journal or summary
  var input = document.getElementById('pub-filter-input');
  if (!input) return;
  var items = Array.prototype.slice.call(document.querySelectorAll('.pub-item'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.pub-year'));
  var count = document.getElementById('pub-count'), empty = document.getElementById('pub-empty');
  var total = items.length;
  function fold(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  items.forEach(function (li) { li._text = fold(li.textContent); });
  function apply() {
    var words = fold(input.value).split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (li) {
      var ok = words.every(function (w) { return li._text.indexOf(w) !== -1; });
      li.hidden = !ok; if (ok) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.pub-item:not([hidden])'); });
    if (count) count.textContent = words.length ? shown + ' of ' + total + ' papers match' : total + (total === 1 ? ' paper' : ' papers');
    if (empty) empty.hidden = shown !== 0;
  }
  input.addEventListener('input', apply);
})();
