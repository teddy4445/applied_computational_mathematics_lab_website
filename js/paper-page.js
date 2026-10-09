/* Paper pages (publications/<slug>/): reference previews and search-term highlighting. */
(function () {
  var text = document.getElementById('full-text');
  if (!text) return;

  // ---- reference previews: hover or focus a citation ([12], a superscript or "Smith et al., 2020") to read the reference
  var tip = document.createElement('div');
  tip.className = 'cite-tip';
  tip.id = 'cite-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.appendChild(tip);
  var current = null, showTimer = 0, hideTimer = 0;
  var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  var lastPointer = '', wasOpen = false;
  document.addEventListener('pointerdown', function (e) {
    lastPointer = e.pointerType;
    wasOpen = !tip.hidden && current !== null && current === citation(e.target);     // a second tap on the same citation
  }, true);
  function tapped() { return touch || lastPointer === 'touch' || lastPointer === 'pen'; }

  function citation(el) {
    var a = el && el.closest ? el.closest('a[href^="#ref-"]') : null;
    return a && text.contains(a) && !a.closest('.paper-refs') ? a : null;
  }

  function place(a) {
    var r = a.getBoundingClientRect(), gap = 8;
    tip.style.maxWidth = Math.min(440, window.innerWidth - 24) + 'px';
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
    var below = r.bottom + gap + h < window.innerHeight || r.top < h + gap;
    tip.classList.toggle('is-above', !below);
    tip.style.left = left + window.scrollX + 'px';
    tip.style.top = (below ? r.bottom + gap : r.top - gap - h) + window.scrollY + 'px';
  }

  function show(a) {
    var id = a.getAttribute('href').slice(1), ref = document.getElementById(id);
    if (!ref) return;
    clearTimeout(hideTimer);
    if (current && current !== a) current.removeAttribute('aria-describedby');
    var numbered = ref.parentElement && ref.parentElement.tagName === 'OL';
    tip.innerHTML = '<div class="cite-tip-text"></div><a class="cite-tip-go" href="#' + id + '">Go to the reference <i class="ri-arrow-down-line" aria-hidden="true"></i></a>';
    var body = tip.firstChild;
    body.innerHTML = (numbered ? '<span class="cite-tip-n">[' + id.replace('ref-', '') + ']</span> ' : '') + ref.innerHTML;
    body.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    tip.hidden = false;
    place(a);
    a.setAttribute('aria-describedby', 'cite-tip');
    current = a;
  }

  function hide() {
    clearTimeout(showTimer);
    tip.hidden = true;
    if (current) current.removeAttribute('aria-describedby');
    current = null;
  }

  text.addEventListener('mouseover', function (e) {
    var a = citation(e.target);
    if (!a || tapped()) return;
    clearTimeout(hideTimer); clearTimeout(showTimer);
    showTimer = setTimeout(function () { show(a); }, 120);
  });
  text.addEventListener('mouseout', function (e) {
    if (!citation(e.target) || tapped()) return;
    clearTimeout(showTimer);
    hideTimer = setTimeout(hide, 220);
  });
  tip.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
  tip.addEventListener('mouseleave', function () { hideTimer = setTimeout(hide, 220); });
  text.addEventListener('focusin', function (e) { var a = citation(e.target); if (a) show(a); });
  text.addEventListener('focusout', function (e) { if (!tip.contains(e.relatedTarget)) hideTimer = setTimeout(hide, 150); });
  // touch screens: the first tap shows the reference, "Go to the reference" (or a second tap) jumps to it
  text.addEventListener('click', function (e) {
    var a = citation(e.target);
    if (a && tapped() && !wasOpen) { e.preventDefault(); show(a); }
  });
  tip.addEventListener('click', function (e) { if (e.target.closest('.cite-tip-go')) hide(); });
  document.addEventListener('click', function (e) {
    if (!tip.hidden && !tip.contains(e.target) && !citation(e.target)) hide();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tip.hidden) { var a = current; hide(); if (a) a.focus(); } });
  window.addEventListener('resize', function () { if (current && !tip.hidden) place(current); });

  // ---- arriving from the full-text search: mark the words and scroll to the first one in the chosen section
  var params = new URLSearchParams(location.search);
  if (!params.get('highlight')) return;
  import('/pagefind/pagefind-highlight.js').then(function () {
    new window.PagefindHighlight({ highlightParam: 'highlight' });
    var tries = 0;
    (function jump() {
      var marks = Array.prototype.slice.call(document.querySelectorAll('#full-text mark'));
      if (!marks.length) { if (tries++ < 30) setTimeout(jump, 100); return; }
      var target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      var mark = marks[0];
      if (target) {
        for (var i = 0; i < marks.length; i++) {
          if (target.compareDocumentPosition(marks[i]) & Node.DOCUMENT_POSITION_FOLLOWING) { mark = marks[i]; break; }
        }
      }
      mark.scrollIntoView({ block: 'center' });
      mark.classList.add('is-first');
    })();
  }).catch(function () {});
})();
