// projects.html: recount the numbers at the top of the page (research projects, papers, lab members)
// from the data files every time the page loads, so they never go stale.
// Same rules as tools/build_projects.py: papers = distinct paper pages listed in any project;
// lab members = distinct people in the project teams who are in data/lab.json (current and past).
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-project-stat]');
  if (!els.length || !window.fetch || !window.Promise) return;

  function norm(text) {
    return String(text || '').normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
  function plainName(name) {
    return String(name || '').trim().replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+/, '');
  }
  function nameKeys(name) {
    var n = plainName(name);
    var parts = n.split(/\s+/).filter(Boolean);
    var keys = [norm(n)];
    if (parts.length >= 2) keys.push(norm(parts[0]) + '|' + norm(parts[parts.length - 1]));
    return keys;
  }
  function samePerson(a, b) {
    var kb = nameKeys(b);
    return nameKeys(a).some(function (k) { return kb.indexOf(k) !== -1; });
  }
  function getJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  Promise.all([getJson('/data/projects-info.json'), getJson('/data/lab.json'), getJson('/data/paper-pages.json')])
    .then(function (res) {
      var projects = (res[0] && res[0].projects) || [];
      var lab = Array.isArray(res[1]) ? res[1] : (res[1] && res[1].members) || [];
      var pages = {};
      ((res[2] && res[2].pages) || []).forEach(function (p) { pages[p.slug] = true; });

      var papers = {}, people = {};
      projects.forEach(function (p) {
        (p.papers || []).forEach(function (slug) { if (pages[slug]) papers[slug] = true; });
        (p.team || []).forEach(function (entry) {
          for (var i = 0; i < lab.length; i++) {
            if (samePerson(lab[i].name, entry.name)) { people[norm(plainName(lab[i].name))] = true; break; }
          }
        });
      });
      var values = { projects: projects.length, papers: Object.keys(papers).length, members: Object.keys(people).length };
      Array.prototype.forEach.call(els, function (el) {
        var v = values[el.getAttribute('data-project-stat')];
        if (typeof v === 'number' && v > 0) el.textContent = String(v);
      });
    })
    .catch(function (err) { if (window.console) console.warn('Project numbers kept as built:', err); });
})();
