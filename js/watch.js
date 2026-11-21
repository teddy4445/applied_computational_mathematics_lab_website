/* Watch pages (watch/<slug>/, made by tools/build_watch_pages.py)
   - Menu button and navbar shadow (js/main.js expects to sit at the site root).
   - A video that was still scheduled when the page was built: from its release time on, swap the "coming on" card
     for the player and add its VideoObject data (kept in #watch-video-data) to the page, so no rebuild is needed.
   - Related-video thumbnails: YouTube answers a missing size with a 120x90 placeholder, so step down a size, and
     leave the plain background if none exists yet (scheduled videos have no public thumbnail).
*/
(function () {
  var btn = document.getElementById('menu-btn'), menu = document.getElementById('mobile-menu'), nav = document.getElementById('navbar');
  if (btn && menu) btn.addEventListener('click', function () { menu.classList.toggle('max-h-0'); menu.classList.toggle('max-h-screen'); });
  if (nav) {
    var onScroll = function () { nav.classList.toggle('nav-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  var player = document.querySelector('.watch-player.is-coming');
  if (player) {
    var release = Date.parse(player.getAttribute('data-release'));
    if (!isNaN(release) && Date.now() >= release) {
      var frame = document.createElement('iframe');
      frame.src = player.getAttribute('data-src').replace(/&amp;/g, '&');
      frame.title = player.getAttribute('data-title') || 'YouTube video';
      frame.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      player.replaceChildren(frame);
      player.classList.remove('is-coming');
      var data = document.getElementById('watch-video-data');
      if (data) {
        var ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.textContent = data.textContent;
        document.head.appendChild(ld);
      }
      document.querySelectorAll('.watch-kicker span').forEach(function (s) {
        if (/^Coming /.test(s.textContent)) s.textContent = s.textContent.replace(/^Coming /, 'Published ');
      });
    }
  }

  document.querySelectorAll('.watch-thumb img[data-fallbacks]').forEach(function (img) {
    var rest = (img.getAttribute('data-fallbacks') || '').split(/\s+/).filter(Boolean);
    var next = function () { var src = rest.shift(); if (src) img.src = src; else img.hidden = true; };
    img.addEventListener('error', next);
    img.addEventListener('load', function () { if (img.naturalWidth > 0 && img.naturalWidth <= 120) next(); });
    if (img.complete && img.naturalWidth > 0 && img.naturalWidth <= 120) next();
  });
})();
