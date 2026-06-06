(() => {
  const JSON_URL = 'data/academic-publications.json';
  const GENERATED_BASE_DIR = 'publications';
  const PAGE_SIZE = 24;
  const PDF_BASE_URL = 'http://teddylazebnik.com/files/';

  let allPublications = [];
  let visiblePublications = [];
  let renderedCount = 0;

  const els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function slugify(value) {
    return String(value || 'paper')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'paper';
  }

  function assignPublicationSlugs(publications) {
    const seen = new Map();
    return publications.map((publication) => {
      const providedSlug = String(publication.slug || publication.id || '').trim();
      const baseSlug = slugify(providedSlug || publication.name || publication.publisher || 'paper');
      const yearSuffix = publication.year ? `-${publication.year}` : '';
      let nextSlug = baseSlug;

      if (seen.has(nextSlug)) {
        nextSlug = `${baseSlug}${yearSuffix}`;
      }

      if (seen.has(nextSlug)) {
        const nextIndex = seen.get(baseSlug) + 1;
        nextSlug = `${baseSlug}${yearSuffix}-${nextIndex}`;
        seen.set(baseSlug, nextIndex);
      } else {
        seen.set(baseSlug, seen.get(baseSlug) || 1);
      }

      seen.set(nextSlug, 1);
      return { ...publication, slug: nextSlug };
    });
  }

  function normalizePath(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return String(path).replace(/^\//, '');
  }

  function normalizePdfPath(path) {
    const value = String(path || '').trim();
    if (!value) return '';

    const teddylazebnikMatch = value.match(/^https?:\/\/(?:www\.)?teddylazebnik\.com\/files\/(.+)$/i);
    if (teddylazebnikMatch) {
      return `${PDF_BASE_URL}${teddylazebnikMatch[1].replace(/^\/+/, '')}`;
    }

    if (/^(?:\/)?files\/.+/i.test(value)) {
      return `${PDF_BASE_URL}${value.replace(/^(?:\/)?files\//i, '')}`;
    }

    return value;
  }

  function getFileLink(publication, matcher) {
    return (publication.fileLinks || []).find((link) => matcher(String(link.info || '').toLowerCase(), Number(link.type), String(link.link || '')));
  }

  function getGeneratedMeta(publication) {
    const slug = publication.slug || slugify(publication.name);
    const base = normalizePath(publication.generatedBaseUrl || publication.generated_base_url || `${GENERATED_BASE_DIR}/${slug}`);
    const generated = publication.generatedAssets || publication.generated_assets || publication.generatedContent || publication.generated_content || publication.contentPages || publication.content_pages || {};

    function pick(key, fallbackPath) {
      const value = generated[key] || {};
      if (typeof value === 'string') return normalizePath(value);
      return normalizePath(value.html || value.page || value.url || `${base}/${fallbackPath}`);
    }

    return {
      slug,
      overview: pick('overview', ''),
      full: pick('full', 'paper.html'),
      easy: pick('easy', 'simple.html'),
      video: pick('video', 'video.html'),
      status: publication.generationStatus || publication.generation_status || generated.status || 'ready'
    };
  }

  function sourceButtons(publication) {
    const pdf = getFileLink(publication, (info, type) => info.includes('download') || type === 1);
    const buttons = [];

    if (pdf && pdf.link) {
      buttons.push(`<a class="publication-action-button publication-source-button" href="${escapeHtml(normalizePdfPath(pdf.link))}" target="_blank" rel="noopener"><i class="ri-file-pdf-2-line"></i>PDF</a>`);
    }

    return buttons.join('');
  }

  function generatedButtons(publication) {
    const meta = getGeneratedMeta(publication);
    const items = [
      ['Overview', 'ri-layout-grid-line', meta.overview],
      ['HTML', 'ri-article-line', meta.full],
      ['Friendly explanation', 'ri-chat-smile-3-line', meta.easy],
      ['Video', 'ri-youtube-line', meta.video]
    ];

    return items.map(([label, icon, href]) => {
      const safeHref = href || `${GENERATED_BASE_DIR}/${meta.slug}/`;
      return `<a class="publication-action-button publication-source-button" href="${escapeHtml(safeHref)}" data-generated-status="${escapeHtml(meta.status)}"><i class="${icon}"></i>${label}</a>`;
    }).join('');
  }

  function citationButton(publication) {
    const citation = getFileLink(publication, (info, type) => info.includes('cite') || type === 3);
    if (!citation || !citation.link) return '';
    return `<button type="button" class="publication-action-button publication-source-button js-copy-citation" data-citation="${escapeHtml(citation.link)}"><i class="ri-double-quotes-l"></i>Cite</button>`;
  }

  function renderCard(publication) {
    const meta = getGeneratedMeta(publication);
    const description = String(publication.description || '').trim();
    const shortDescription = description.length > 520 ? `${description.slice(0, 517).trim()}...` : description;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: publication.name || '',
      author: String(publication.authors || '')
        .split(',')
        .map((name) => ({ '@type': 'Person', name: name.trim() }))
        .filter((item) => item.name),
      datePublished: publication.year ? String(publication.year) : undefined,
      publisher: publication.publisher ? { '@type': 'Organization', name: String(publication.publisher).trim() } : undefined,
      description: description || undefined,
      url: `${GENERATED_BASE_DIR}/${meta.slug}/`
    };

    return `
      <article class="publication-card-shell bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition p-6 flex flex-col" itemscope itemtype="https://schema.org/ScholarlyArticle" data-title="${escapeHtml(publication.name)}" data-year="${escapeHtml(publication.year)}" data-topic="${escapeHtml(publication.topic)}">
        <h3 class="text-xl font-bold text-gray-900 leading-snug mb-3" itemprop="headline">
          <a href="${escapeHtml(`${GENERATED_BASE_DIR}/${meta.slug}/`)}" class="hover:text-primary transition-colors">${escapeHtml(publication.name)}</a>
        </h3>
        <p class="text-sm text-gray-600 mb-2" itemprop="author"><strong>Authors:</strong> ${escapeHtml(publication.authors || 'Not listed')}</p>
        <p class="text-sm text-gray-600 mb-4"><strong>Published in:</strong> <span itemprop="publisher">${escapeHtml(publication.publisher || 'Not listed')}</span></p>
        <div class="mb-4 flex flex-wrap gap-2 items-center">
          ${sourceButtons(publication)}
          <!--${generatedButtons(publication)}-->
          ${citationButton(publication)}
        </div>
        ${description ? `
          <div class="mb-4">
            <button class="abstract-toggle text-primary font-medium hover:text-secondary transition-colors duration-200 flex items-center">
              <span>Show Abstract</span>
              <i class="ri-arrow-down-s-line ml-1 transform transition-transform duration-200"></i>
            </button>
            <div class="abstract-content mt-3">
              <div class="p-4 bg-gray-50 rounded-lg pub-abstract">
                <p class="text-gray-700 leading-relaxed text-sm" itemprop="description">${escapeHtml(description)}</p>
              </div>
            </div>
          </div>` : `<p class="text-gray-700 leading-relaxed text-sm flex-grow" itemprop="description">${escapeHtml(shortDescription)}</p>`}

        <script type="application/ld+json">${escapeHtml(JSON.stringify(schema).replace(/<\/script/gi, '<\\/script'))}<\/script>
      </article>
    `;
  }

  function sortPublications(items) {
    const sortValue = els.sortFilter.value;
    const copy = [...items];

    if (sortValue === 'date-asc') {
      return copy.sort((left, right) => Number(left.year || 0) - Number(right.year || 0));
    }

    if (sortValue === 'title') {
      return copy.sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
    }

    return copy.sort((left, right) => Number(right.year || 0) - Number(left.year || 0));
  }

  function updateStats() {
    els.statsTotal.querySelector('strong').textContent = String(allPublications.length);
    els.statsVisible.querySelector('strong').textContent = String(visiblePublications.length);
    const heroCount = byId('papers-count');
    if (heroCount && window.ACMLAnimations?.refreshCount) {
      window.ACMLAnimations.refreshCount(heroCount, allPublications.length);
    } else if (heroCount) {
      heroCount.textContent = String(allPublications.length);
    }
  }

  function renderMore() {
    const next = visiblePublications.slice(renderedCount, renderedCount + PAGE_SIZE);

    if (next.length) {
      els.container.insertAdjacentHTML('beforeend', next.map(renderCard).join(''));
      renderedCount += next.length;
      window.ACMLAnimations?.enhance?.(els.container);
    }

    els.empty.classList.toggle('hidden', visiblePublications.length !== 0);
    els.loadState.classList.toggle('hidden', renderedCount >= visiblePublications.length);
    els.loadState.classList.toggle('flex', renderedCount < visiblePublications.length);
  }

  function applyFilters() {
    const year = els.yearFilter.value;
    const search = els.searchInput.value.trim().toLowerCase();

    visiblePublications = sortPublications(allPublications.filter((publication) => {
      const matchesYear = !year || String(publication.year) === year;
      const haystack = [
        publication.name,
        publication.authors,
        publication.description,
        publication.topic,
        publication.publisher,
        publication.publicationStatus
      ].join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesYear && matchesSearch;
    }));

    renderedCount = 0;
    els.container.innerHTML = '';
    renderMore();
    updateStats();
  }

  function populateYears() {
    const years = [...new Set(allPublications.map((publication) => publication.year).filter(Boolean))]
      .sort((left, right) => Number(right) - Number(left));

    els.yearFilter.insertAdjacentHTML(
      'beforeend',
      years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`).join('')
    );
  }

  async function loadPublications() {
    els.container.innerHTML = `
      <div class="lg:col-span-2 flex justify-center py-10">
        <div class="pub-load-pill">
          <div class="pub-loader-dots" aria-hidden="true"><span></span><span></span><span></span></div>
          <span class="text-sm font-medium">Loading publications</span>
        </div>
      </div>`;

    try {
      const response = await fetch(JSON_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${JSON_URL}`);

      const payload = await response.json();
      allPublications = assignPublicationSlugs(Array.isArray(payload.publications) ? payload.publications : []);
      els.container.innerHTML = '';
      populateYears();
      applyFilters();
    } catch (error) {
      console.error(error);
      els.container.innerHTML = `
        <div class="lg:col-span-2 bg-red-50 border border-red-100 text-red-700 rounded-xl p-6">
          Publications could not be loaded. Check that <code>${escapeHtml(JSON_URL)}</code> exists and is valid JSON.
        </div>`;
    }
  }

  function setupEvents() {
    els.yearFilter.addEventListener('change', applyFilters);
    els.searchInput.addEventListener('input', applyFilters);
    els.sortFilter.addEventListener('change', applyFilters);

    document.addEventListener('click', async (event) => {
      const button = event.target.closest('.js-copy-citation');
      if (!button) return;

      try {
        await navigator.clipboard.writeText(button.dataset.citation || '');
        const original = button.innerHTML;
        button.innerHTML = '<i class="ri-check-line"></i>Copied';
        setTimeout(() => {
          button.innerHTML = original;
        }, 1400);
      } catch (error) {
        alert(button.dataset.citation || 'Citation unavailable');
      }
    });

    if ('IntersectionObserver' in window && els.sentinel) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          renderMore();
        }
      }, { rootMargin: '350px' });

      observer.observe(els.sentinel);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    els.container = byId('publications-container');
    els.yearFilter = byId('year-filter');
    els.searchInput = byId('search-input');
    els.sortFilter = byId('sort-filter');
    els.statsTotal = byId('stats-total');
    els.statsVisible = byId('stats-visible');
    els.empty = byId('pub-empty');
    els.loadState = byId('pub-load-state');
    els.sentinel = byId('pub-scroll-sentinel');

    if (!els.container || !els.yearFilter || !els.searchInput || !els.sortFilter) return;

    setupEvents();
    loadPublications();
  });
})();
