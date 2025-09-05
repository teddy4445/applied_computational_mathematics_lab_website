

const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
let menuOpen = false;

menuBtn.addEventListener("click", () => {
  menuOpen = !menuOpen;
  if (menuOpen) {
	mobileMenu.classList.remove("max-h-0");
	mobileMenu.classList.add("max-h-screen");
  } else {
	mobileMenu.classList.remove("max-h-screen");
	mobileMenu.classList.add("max-h-0");
  }
});

tailwind.config = {
theme: {
extend: {
colors: {
primary: '#2563eb',
secondary: '#f43f5e'
},
borderRadius: {
'none': '0px',
'sm': '4px',
DEFAULT: '8px',
'md': '12px',
'lg': '16px',
'xl': '20px',
'2xl': '24px',
'3xl': '32px',
'full': '9999px',
'button': '8px'
}
}
}
}

document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    if (window.location.pathname.includes(link.getAttribute('href'))) {
      link.classList.add('text-primary', 'bg-white', 'shadow-sm');
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const abstractToggles = document.querySelectorAll('.abstract-toggle');
  abstractToggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      const content = this.parentElement.querySelector('.abstract-content');
      const icon = this.querySelector('i');
      const text = this.querySelector('span');
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
        text.textContent = 'Hide Abstract';
      } else {
        content.classList.add('hidden');
        icon.classList.remove('rotate-180');
        text.textContent = 'Show Abstract';
      }
    });
  });

  const yearFilter = document.getElementById('year-filter');
  const categoryFilter = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-input');
  const sortFilter = document.getElementById('sort-filter');
  const publicationsContainer = document.getElementById('publications-container');

  function filterAndSortPublications() {
    const cards = Array.from(document.querySelectorAll('.publication-card'));
    const yearValue = yearFilter.value;
    const categoryValue = categoryFilter.value;
    const searchValue = searchInput.value.toLowerCase();
    const sortValue = sortFilter.value;

    let filteredCards = cards.filter(card => {
      const year = card.getAttribute('data-year');
      const category = card.getAttribute('data-category');
      const title = card.querySelector('h3').textContent.toLowerCase();
      const authors = card.querySelector('p').textContent.toLowerCase();
      const yearMatch = !yearValue || year === yearValue;
      const categoryMatch = !categoryValue || category === categoryValue;
      const searchMatch = !searchValue || title.includes(searchValue) || authors.includes(searchValue);
      return yearMatch && categoryMatch && searchMatch;
    });

    filteredCards.sort((a, b) => {
      const titleA = a.querySelector('h3').textContent;
      const titleB = b.querySelector('h3').textContent;
      const yearA = parseInt(a.getAttribute('data-year'));
      const yearB = parseInt(b.getAttribute('data-year'));
      switch (sortValue) {
        case 'date-asc': return yearA - yearB;
        case 'date-desc': return yearB - yearA;
        case 'title': return titleA.localeCompare(titleB);
        default: return yearB - yearA;
      }
    });

    publicationsContainer.innerHTML = '';
    filteredCards.forEach(card => publicationsContainer.appendChild(card));
  }

  [yearFilter, categoryFilter, searchInput, sortFilter].forEach(element => {
    if (element) {
      element.addEventListener('change', filterAndSortPublications);
      element.addEventListener('input', filterAndSortPublications);
    }
  });
});

// Navbar background on scroll
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (window.scrollY > 20) {
	nav.classList.add("nav-scrolled");
  } else {
	nav.classList.remove("nav-scrolled");
  }
});


/* =============== Media Coverage rendering =============== */
/**
 * Expects `/data/media.json` to be an array of items with:
 * { title, outlet, dateLabel, dateISO, image, href }
 */
(async function mediaPageBoot() {
  const grid   = document.getElementById("mediaGrid");
  const empty  = document.getElementById("mediaEmpty");
  const search = document.getElementById("mediaSearch");
  const outlet = document.getElementById("mediaOutlet");
  const sortSel= document.getElementById("mediaSort");

  if (!grid || !search || !outlet || !sortSel) return; // not on media page

  // ---- Load data from /data/media.json ----
  let MEDIA_ITEMS = [];
  try {
    const res = await fetch("/data/media.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("JSON is not an array");
    MEDIA_ITEMS = data;
  } catch (err) {
    // Show an error state & stop
    console.error("Failed to load media.json:", err);
    grid.innerHTML = "";
    if (empty) {
      empty.classList.remove("hidden");
      empty.textContent = "Could not load media items.";
    }
    return;
  }

  // ---- Populate Outlet filter options dynamically ----
  (function populateOutlets() {
    const unique = Array.from(new Set(MEDIA_ITEMS.map(m => m.outlet))).sort();
    // Preserve first option (e.g., "All outlets") if present; otherwise add one.
    const hasFirstAll = outlet.options.length && outlet.options[0].value === "";
    outlet.innerHTML = hasFirstAll ? outlet.innerHTML : `<option value="">All outlets</option>`;
    unique.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      outlet.appendChild(opt);
    });
  })();

  // ---- Default sort: newest first ----
  let current = [...MEDIA_ITEMS].sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));

  function render(list) {
    grid.innerHTML = "";
    if (!list.length) {
      empty.classList.remove("hidden");
      empty.textContent = "No media items match your filters.";
      return;
    }
    empty.classList.add("hidden");

    list.forEach(item => {
      const card = document.createElement("article");
      card.className =
        "media-card bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100";

      const safeImg = item.image || "img/media/placeholder.png";

      card.innerHTML = `
        <div class="w-full h-48 overflow-hidden bg-gray-100">
          <img src="${safeImg}" alt="${item.title} - ${item.outlet}" class="w-full h-full object-cover object-top" loading="lazy">
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-primary">${item.outlet ?? ""}</span>
            <span class="text-xs text-gray-400">${item.dateLabel ?? ""}</span>
          </div>
          <h3 class="font-semibold text-lg mb-3 line-clamp-3">${item.title ?? ""}</h3>
          <a href="${item.href}" class="inline-flex items-center text-secondary hover:text-primary transition-colors duration-200 text-sm font-medium" target="_blank" rel="noopener">
            Read Article <i class="ri-arrow-right-line ml-1"></i>
          </a>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function applyFilters() {
    const q = (search.value || "").toLowerCase().trim();
    const out = outlet.value;

    let filtered = MEDIA_ITEMS.filter(m => {
      const hitText = ((m.title || "") + " " + (m.outlet || "")).toLowerCase();
      const matchSearch = !q || hitText.includes(q);
      const matchOutlet = !out || m.outlet === out;
      return matchSearch && matchOutlet;
    });

    // sort
    if (sortSel.value === "newest") {
      filtered.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
    } else {
      filtered.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    }

    current = filtered;
    render(current);
  }

  // ---- Wire up events ----
  search.addEventListener("input", applyFilters);
  outlet.addEventListener("change", applyFilters);
  sortSel.addEventListener("change", applyFilters);

  // ---- Initial render ----
  render(current);
})();

/* ===========================================
   Publications: fetch & render from remote JSON
   =========================================== */

(async function bootPublicationsFromRemote() {
  const container = document.getElementById('publications-container');
  const emptyEl = document.getElementById('pub-empty');
  const yearSel = document.getElementById('year-filter');
  const catSel = document.getElementById('category-filter');
  const searchInp = document.getElementById('search-input');
  const sortSel = document.getElementById('sort-filter');
  const statsTotal = document.getElementById('stats-total')?.querySelector('strong');
  const statsVisible = document.getElementById('stats-visible')?.querySelector('strong');

  if (!container || !yearSel || !catSel || !searchInp || !sortSel) return; // not on this page

  // ---- 1) Load JSON from your URL (same-origin is ideal for CORS) ----
  const JSON_URL = 'data/academic-publications.json';

  async function loadData() {
    if (window.PUBLICATIONS_JSON?.publications) return window.PUBLICATIONS_JSON; // optional override
    const res = await fetch(JSON_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to fetch publications: ${res.status}`);
    return res.json();
  }

  let ALL = [];
  try {
    const data = await loadData();
    ALL = Array.isArray(data.publications) ? data.publications : [];
  } catch (e) {
    console.error('[Publications] Fetch error:', e);
    ALL = [];
  }

  if (statsTotal) statsTotal.textContent = String(ALL.length);

  // ---- 2) Helpers ----
  const norm = s => (s ?? '').toString().trim();
  const yearOf = p => Number(p.year) || 0;
  const titleOf = p => norm(p.name);
  const topicOf = p => norm(p.topic);
  const statusOf = p => norm(p.publicationStatus);
  const pubLine = p => {
    const bits = [];
    if (p.publisher) bits.push(p.publisher);
    const y = yearOf(p);
    if (y) bits.push(y);
    return bits.join(', ');
  };

  // Category mapping from your JSON "topic"
  function mapTopicToCategory(topic) {
    const t = (topic || '').toLowerCase();
    if (t.includes('machine')) return 'Machine learning';
    if (t.includes('biomath') || t.includes('bio')) return 'Biomathematics';
    if (t.includes('econ')) return 'Computational Economics';
    if (t.includes('math')) return 'Computational Mathematics';
    return 'Others';
  }

  // Build dynamic Year options (desc) & Category options (alpha)
  const years = [...new Set(ALL.map(yearOf).filter(Boolean))].sort((a,b)=>b-a);
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    yearSel.appendChild(opt);
  });

  const cats = [...new Set(ALL.map(p => mapTopicToCategory(p.topic)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSel.appendChild(opt);
  });

  // ---- 3) Rendering ----
  function render(list) {
    container.innerHTML = '';
    if (statsVisible) statsVisible.textContent = String(list.length);

    if (!list.length) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    list.forEach(p => {
      const title = titleOf(p);
      const authors = norm(p.authors);
      const line = pubLine(p);
      const cat = mapTopicToCategory(topicOf(p));
      const status = statusOf(p);
      const abstract = norm(p.description);

      // fileLinks: [{info,type,link}]
      const linkBtns = (Array.isArray(p.fileLinks) ? p.fileLinks : []).map(f => {
        const t = Number(f.type);
        if (t === 1) {
          return `<a href="https://teddylazebnik.com${f.link}" class="inline-flex items-center gap-1 text-primary hover:text-secondary transition-colors duration-200" target="_blank" rel="noopener">
                    <i class="ri-download-2-line"></i><span>${f.info || 'Download'}</span>
                  </a>`;
        } else if (t === 2) {
          return `<a href="https://teddylazebnik.com${f.link}" class="inline-flex items-center gap-1 text-primary hover:text-secondary transition-colors duration-200" target="_blank" rel="noopener">
                    <i class="ri-external-link-line"></i><span>${f.info || 'View'}</span>
                  </a>`;
        } else if (t === 3) {
          // here link contains a citation string
          return `<button type="button" class="inline-flex items-center gap-1 text-primary hover:text-secondary transition-colors duration-200 copy-cite" data-cite="${String(f.link).replace(/"/g, '&quot;')}">
                    <i class="ri-double-quotes-l"></i><span>${f.info || 'Cite'}</span>
                  </button>`;
        }
        return '';
      }).filter(Boolean).join('<span class="mx-2 text-gray-300">|</span>');

      const card = document.createElement('article');
      card.className = 'publication-card bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300';
      card.dataset.year = String(yearOf(p));
      card.dataset.category = cat;

      card.innerHTML = `
        <h3 class="text-xl font-semibold mb-3">${title}</h3>
        <p class="text-gray-600 mb-2"><strong>Authors:</strong> ${authors || '—'}</p>
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${line ? `<span class="text-sm text-gray-500">${line}</span>` : ''}
          <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${cat}</span>
          ${status ? `<span class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">${status}</span>` : ''}
          ${p.type ? `<span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">${p.type}</span>` : ''}
        </div>

        ${abstract ? `
          <div class="mb-4">
            <button class="abstract-toggle text-primary font-medium hover:text-secondary transition-colors duration-200 flex items-center">
              <span>Show Abstract</span>
              <i class="ri-arrow-down-s-line ml-1 transform transition-transform duration-200"></i>
            </button>
            <div class="abstract-content hidden mt-3 p-4 bg-gray-50 rounded-lg pub-abstract">
              <p class="text-gray-700 leading-relaxed">${abstract}</p>
            </div>
          </div>` : ''}

        <div class="flex flex-wrap items-center gap-4">
          ${linkBtns || '<span class="text-sm text-gray-400">No links available</span>'}
        </div>
      `;

      container.appendChild(card);
    });

    // post-render wiring
    container.querySelectorAll('.abstract-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.parentElement.querySelector('.abstract-content');
        const icon = btn.querySelector('i');
        const textSpan = btn.querySelector('span');
        const isHidden = content.classList.contains('hidden');
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180', isHidden);
        textSpan.textContent = isHidden ? 'Hide Abstract' : 'Show Abstract';
      });
    });

    container.querySelectorAll('.copy-cite').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cite = btn.getAttribute('data-cite') || '';
        try {
          await navigator.clipboard.writeText(cite);
          btn.innerHTML = `<i class="ri-check-line"></i><span>Copied</span>`;
          setTimeout(() => (btn.innerHTML = `<i class="ri-double-quotes-l"></i><span>Cite</span>`), 1400);
        } catch {
          alert(cite);
        }
      });
    });
  }

  // ---- 4) Filtering + Sorting ----
  function applyFilters() {
    const q = (searchInp.value || '').toLowerCase().trim();
    const year = yearSel.value;
    const cat = catSel.value;

    let list = ALL.filter(p => {
      const matchesYear = !year || String(yearOf(p)) === year;
      const mapped = mapTopicToCategory(topicOf(p));
      const matchesCat = !cat || mapped === cat;
      const inTitle = titleOf(p).toLowerCase().includes(q);
      return matchesYear && matchesCat && (!q || inTitle);
    });

    const mode = sortSel.value;
    if (mode === 'title') {
      list.sort((a,b) => titleOf(a).localeCompare(titleOf(b)));
    } else if (mode === 'date-asc') {
      list.sort((a,b) => yearOf(a) - yearOf(b));
    } else {
      list.sort((a,b) => yearOf(b) - yearOf(a));
    }

    render(list);
  }

  searchInp.addEventListener('input', applyFilters);
  yearSel.addEventListener('change', applyFilters);
  catSel.addEventListener('change', applyFilters);
  sortSel.addEventListener('change', applyFilters);

  // Initial render
  applyFilters();
})();


(async function () {
  const res = await fetch("data/projects.json");
  const DATA = await res.json();
  const container = document.getElementById("projects-container");
  if (!container) return;

  function badge(label, color = "blue") {
    return `<span class="px-3 py-1 bg-${color}-100 text-${color}-800 rounded-full text-sm">${label}</span>`;
  }

  function person(p) {
    const links = [];
    if (p.links?.website) links.push(`<a href="${p.links.website}" target="_blank" class="underline">website</a>`);
    if (p.links?.google_scholar) links.push(`<a href="${p.links.google_scholar}" target="_blank" class="underline">scholar</a>`);
    if (p.links?.linkedin) links.push(`<a href="${p.links.linkedin}" target="_blank" class="underline">linkedin</a>`);
    const linksHtml = links.length ? " · " + links.join(" · ") : "";
    return `
      <div class="flex items-center gap-3">
        <img src="${p.avatar || "img/people/default.jpg"}" alt="${p.name}" class="w-10 h-10 rounded-full object-cover">
        <div class="text-sm">
          <div class="font-medium">${p.name}${p.degree ? ", " + p.degree : ""}</div>
          <div class="text-gray-500">${p.role || ""}${linksHtml}</div>
        </div>
      </div>`;
  }

  function projectCard(prj, i) {
    const imgCol = `
      <div class="lg:w-1/3">
        <img src="${prj.image}" alt="${prj.title}" class="w-full h-48 object-cover object-top rounded-lg">
      </div>`;
    const textCol = `
      <div class="lg:w-2/3">
        <h3 class="text-2xl font-semibold mb-2">${prj.title}</h3>
        <div class="text-sm text-gray-500 mb-4">${prj.period} · ${prj.category}</div>
        <p class="text-gray-600 mb-4 leading-relaxed">${prj.summary}</p>
        <div class="flex flex-wrap gap-2 mb-6">
          ${prj.tags?.map((t, idx) => badge(t, ["blue","green","purple","orange","indigo"][idx%5])).join("")}
        </div>
        ${prj.team?.length ? `<div class="space-y-3 mb-4">${prj.team.map(person).join("")}</div>` : ""}
        ${prj.links?.read_more ? `<a class="text-primary font-medium hover:text-secondary transition-colors duration-200" href="${prj.links.read_more}">Learn More →</a>` : ""}
      </div>`;

    const order = (prj.orientation === "right" || (prj.orientation == null && i % 2 === 1))
      ? `${textCol}${imgCol}` : `${imgCol}${textCol}`;

    return `
      <article class="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
        <div class="flex flex-col lg:flex-row ${prj.orientation === "right" ? "lg:flex-row-reverse" : ""} gap-8">
          ${order}
        </div>
      </article>`;
  }

  container.innerHTML = DATA.projects.map(projectCard).join("");
})();

