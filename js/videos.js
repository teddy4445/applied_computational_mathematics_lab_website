/* ACML videos
   - Click-to-load YouTube players: any .yt-player on a page (home, sock page, videos page).
     The page shows only a thumbnail until someone presses play, so it stays fast and no
     YouTube cookies are set before that (privacy-enhanced youtube-nocookie.com embed).
   - The Videos page (videos.html), rendered from data/videos.json.
   - A "Video" button on matching papers on the Publications page (opens a pop-up player).
   - The search and filter panel at the top of the Videos page (#video-finder).
*/
(() => {
  const DATA_URL = 'data/videos.json';

  let dataPromise = null;
  let modal = null;
  let lastFocus = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function normTitle(value) {
    return String(value || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  const isShort = (video) => video.format === 'short';
  const isEducational = (video) => video.section === 'educational';
  const isNaturesAlgorithms = (video) => video.section === 'natures-algorithms';
  const isMathematicsOfBeauty = (video) => video.section === 'mathematics-of-beauty';
  const isEstimateIt = (video) => video.section === 'estimate-it';
  const isAcademiaDecoded = (video) => video.section === 'academia-decoded';
  const isSeries = (video) => isNaturesAlgorithms(video) || isMathematicsOfBeauty(video) || isEstimateIt(video) || isAcademiaDecoded(video);
  const watchUrl = (video) => (isShort(video) ? `https://www.youtube.com/shorts/${video.id}` : `https://www.youtube.com/watch?v=${video.id}`);
  const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`;

  // Shorts use the larger 4:3 frame (cropped to 9:16); long videos use the HD frame.
  function thumbUrls(id, short) {
    const sizes = short ? ['sddefault', 'hqdefault'] : ['maxresdefault', 'sddefault', 'hqdefault'];
    return sizes.map((size) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${size}.jpg`);
  }

  function loadVideos() {
    if (!dataPromise) {
      dataPromise = fetch(DATA_URL, { cache: 'no-cache' })
        .then((response) => {
          if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);
          return response.json();
        })
        .then((data) => (Array.isArray(data.videos) ? data.videos.filter((video) => video && video.id) : []));
    }
    return dataPromise;
  }

  // YouTube answers a missing thumbnail size with a 120x90 placeholder, so step down a size.
  function wireThumb(img) {
    if (img.dataset.ytThumbWired) return;
    img.dataset.ytThumbWired = '1';
    const fallbacks = (img.dataset.ytFallbacks || '').split(/\s+/).filter(Boolean);
    const next = () => {
      const src = fallbacks.shift();
      if (src) img.src = src;
      else img.hidden = true;
    };
    img.addEventListener('error', next);
    img.addEventListener('load', () => {
      if (img.naturalWidth > 0 && img.naturalWidth <= 120) next();
      else img.hidden = false;
    });
    if (img.complete && img.naturalWidth <= 120) next();
  }

  function wireThumbs(root = document) {
    root.querySelectorAll('img[data-yt-fallbacks]').forEach(wireThumb);
  }

  function playerHtml(video, { badge = false } = {}) {
    const short = isShort(video);
    const [first, ...rest] = thumbUrls(video.id, short);
    return `
      <div class="yt-player ${short ? 'yt-9x16' : 'yt-16x9'}" data-yt-id="${esc(video.id)}" data-yt-title="${esc(video.title)}">
        <a class="yt-play" href="${esc(watchUrl(video))}" aria-label="Play video: ${esc(video.title)}">
          <img src="${first}" data-yt-fallbacks="${rest.join(' ')}" alt="" loading="lazy" decoding="async">
          <span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span>
          ${badge && short ? '<span class="yt-badge"><i class="ri-smartphone-line" aria-hidden="true"></i>Short</span>' : ''}
        </a>
      </div>`;
  }

  function play(player) {
    const id = player?.dataset.ytId;
    if (!id) return;
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(id);
    iframe.title = player.dataset.ytTitle || 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    player.replaceChildren(iframe);
    player.classList.add('is-playing');
  }

  // ---- Pop-up player (used by the Video buttons on the Publications page) ----
  function closeModal() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.querySelector('.yt-modal-frame').replaceChildren();
    document.documentElement.classList.remove('yt-modal-lock');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function openModal({ id, title, short }) {
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'yt-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = '<button type="button" class="yt-modal-close" aria-label="Close video"><i class="ri-close-line" aria-hidden="true"></i></button><div class="yt-modal-frame"></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('.yt-modal-close')) closeModal();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
      });
    }

    lastFocus = document.activeElement;
    const frame = modal.querySelector('.yt-modal-frame');
    frame.classList.toggle('is-short', short);
    frame.innerHTML = `<div class="yt-player ${short ? 'yt-9x16' : 'yt-16x9'}" data-yt-id="${esc(id)}" data-yt-title="${esc(title)}"></div>`;
    modal.setAttribute('aria-label', title || 'Video');
    modal.classList.add('is-open');
    document.documentElement.classList.add('yt-modal-lock');
    play(frame.firstElementChild);
    modal.querySelector('.yt-modal-close').focus();
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const trigger = event.target.closest('.yt-player .yt-play');
    if (trigger) {
      event.preventDefault();
      play(trigger.closest('.yt-player'));
      return;
    }

    const modalTrigger = event.target.closest('[data-yt-modal]');
    if (modalTrigger) {
      event.preventDefault();
      openModal({
        id: modalTrigger.dataset.ytModal,
        title: modalTrigger.dataset.ytTitle || '',
        short: modalTrigger.dataset.ytFormat === 'short'
      });
    }
  });

  // ---- Videos page ----
  function paperHtml(video) {
    const paper = video.paper;
    if (!paper || !paper.title) {
      return video.note ? `<p class="video-paper video-paper--none"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i>${esc(video.note)}</p>` : '';
    }
    return `<p class="video-paper" title="${esc(paper.title)}"><span class="video-paper-label">Based on</span> <cite>${esc(paper.title)}</cite>${paper.venue ? ` <span class="video-paper-venue">· ${esc(paper.venue)}</span>` : ''}</p>`;
  }

  function linksHtml(video) {
    const paper = video.paper;
    const links = [];
    if (paper && paper.url) {
      const external = /^https?:\/\//i.test(paper.url);
      links.push(`<a class="video-link video-link--paper" href="${esc(paper.url)}"${external ? ' target="_blank" rel="noopener"' : ''}><i class="ri-article-line" aria-hidden="true"></i>${esc(paper.label || 'Read the paper')}</a>`);
    }
    links.push(`<a class="video-link" href="${esc(watchUrl(video))}" target="_blank" rel="noopener"><i class="ri-youtube-line" aria-hidden="true"></i>YouTube</a>`);
    return links.join('');
  }

  function cardHtml(video, animate) {
    return `
      <article class="video-card${isShort(video) ? ' video-card--short' : ''}${animate ? ' reveal-card' : ''}" id="v-${esc(video.id)}">
        ${playerHtml(video, { badge: true })}
        <div class="video-card-body">
          ${video.topic ? `<span class="video-topic">${esc(video.topic)}</span>` : ''}
          <h3 class="video-title">${esc(video.title)}</h3>
          ${video.summary ? `<p class="video-summary">${esc(video.summary)}</p>` : ''}
          ${paperHtml(video)}
          <div class="video-card-links">${linksHtml(video)}</div>
        </div>
      </article>`;
  }

  // ---- Videos page: search and filters (#video-finder) ----
  // Free text matches the title, topic, summary and paper of a video (every word must match).
  // The topic list and the section chips narrow it further. Sections with no match are hidden,
  // and the filters are kept in the address (?q=…&topic=…&section=…) so a filtered view can be shared.
  const searchText = (value) => String(value ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function setupFinder(groups) {
    const panel = document.getElementById('video-finder');
    const qInput = document.getElementById('vf-q');
    const topicSelect = document.getElementById('vf-topic');
    if (!panel || !qInput || !topicSelect) return null;
    const chips = Array.from(panel.querySelectorAll('[data-vf-section]'));
    const clearButton = document.getElementById('vf-clear');
    const status = document.getElementById('vf-status');
    const empty = document.getElementById('vf-empty');

    const sections = [];
    const items = [];
    groups.forEach(([grid, list, countId]) => {
      if (!grid || !list.length) return;
      const section = grid.closest('section');
      const entry = { section, id: section ? section.id : '', count: document.getElementById(countId), total: list.length, items: [] };
      list.forEach((video) => {
        const el = document.getElementById(`v-${video.id}`);
        if (!el) return;
        const paper = video.paper || {};
        const item = {
          el,
          topic: video.topic || '',
          text: searchText([video.title, video.topic, video.summary, paper.title, paper.venue, video.note].join(' '))
        };
        entry.items.push(item);
        items.push(item);
      });
      sections.push(entry);
    });
    const total = items.length;

    // Topic list: alphabetical, with the number of videos on each topic.
    const topicCounts = new Map();
    items.forEach((item) => { if (item.topic) topicCounts.set(item.topic, (topicCounts.get(item.topic) || 0) + 1); });
    Array.from(topicCounts.keys()).sort((a, b) => a.localeCompare(b)).forEach((topic) => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = `${topic} (${topicCounts.get(topic)})`;
      topicSelect.appendChild(option);
    });
    // Chips for sections that have no videos are not shown.
    const present = new Set(sections.map((entry) => entry.id));
    chips.forEach((chip) => { if (chip.dataset.vfSection && !present.has(chip.dataset.vfSection)) chip.hidden = true; });

    const state = { q: '', topic: '', section: '' };
    const params = new URLSearchParams(location.search);
    state.q = (params.get('q') || '').slice(0, 200);
    state.topic = topicCounts.has(params.get('topic')) ? params.get('topic') : '';
    state.section = present.has(params.get('section')) ? params.get('section') : '';
    qInput.value = state.q;
    topicSelect.value = state.topic;

    function syncUrl() {
      const next = new URLSearchParams(location.search);
      ['q', 'topic', 'section'].forEach((key) => { if (state[key]) next.set(key, state[key]); else next.delete(key); });
      const query = next.toString();
      const url = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
      if (url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, '', url);
    }

    function apply() {
      const words = searchText(state.q).split(/\s+/).filter(Boolean);
      const filtered = Boolean(words.length || state.topic || state.section);
      let shown = 0;
      sections.forEach((entry) => {
        let visible = 0;
        const sectionOn = !state.section || state.section === entry.id;
        entry.items.forEach((item) => {
          const match = sectionOn
            && (!state.topic || item.topic === state.topic)
            && words.every((word) => item.text.includes(word));
          item.el.hidden = !match;
          if (match) {
            visible += 1;
            // Results of a search appear at once instead of waiting for the scroll-in animation.
            if (filtered) item.el.classList.add('reveal-visible');
          }
        });
        shown += visible;
        if (entry.section) entry.section.hidden = visible === 0;
        if (entry.count) entry.count.textContent = visible === entry.total ? String(entry.total) : `${visible} of ${entry.total}`;
      });
      chips.forEach((chip) => {
        const on = (chip.dataset.vfSection || '') === state.section;
        chip.classList.toggle('is-active', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (clearButton) clearButton.hidden = !filtered;
      if (empty) empty.hidden = shown > 0;
      if (status) {
        status.textContent = filtered
          ? `Showing ${shown} of ${total} videos`
          : `${total} videos. Search, or pick a topic or a section.`;
      }
      syncUrl();
    }

    function reset() {
      state.q = '';
      state.topic = '';
      state.section = '';
      qInput.value = '';
      topicSelect.value = '';
      apply();
    }

    let timer = 0;
    qInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = qInput.value.trim(); apply(); }, 150);
    });
    qInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && qInput.value) { qInput.value = ''; state.q = ''; apply(); }
    });
    topicSelect.addEventListener('change', () => { state.topic = topicSelect.value; apply(); });
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const value = chip.dataset.vfSection || '';
      state.section = state.section === value ? '' : value;
      apply();
    }));
    if (clearButton) clearButton.addEventListener('click', () => { reset(); qInput.focus(); });
    panel.querySelectorAll('.vf-reset').forEach((button) => button.addEventListener('click', reset));

    apply();
    return { reset };
  }

  async function renderVideosPage() {
    const longGrid = document.getElementById('videos-long');
    const shortGrid = document.getElementById('videos-shorts');
    const eduGrid = document.getElementById('videos-educational');
    const natureGrid = document.getElementById('videos-natures-algorithms');
    const beautyGrid = document.getElementById('videos-mathematics-of-beauty');
    const estimateGrid = document.getElementById('videos-estimate-it');
    const academiaGrid = document.getElementById('videos-academia-decoded');
    if (!longGrid && !shortGrid && !eduGrid && !natureGrid && !beautyGrid && !estimateGrid && !academiaGrid) return;

    let videos = [];
    try {
      videos = await loadVideos();
    } catch (error) {
      console.error(error);
      const target = longGrid || shortGrid || eduGrid || natureGrid || beautyGrid || estimateGrid || academiaGrid;
      target.innerHTML = `<div class="video-load-error">Videos could not be loaded. Check that <code>${esc(DATA_URL)}</code> exists and is valid JSON.</div>`;
      return;
    }

    const animate = Boolean(window.ACMLAnimations && window.ACMLAnimations.enhance);
    const groups = [
      [longGrid, videos.filter((video) => !isShort(video) && !isEducational(video) && !isSeries(video)), 'videos-long-count'],
      [shortGrid, videos.filter((video) => isShort(video) && !isEducational(video) && !isSeries(video)), 'videos-shorts-count'],
      [eduGrid, videos.filter(isEducational), 'videos-educational-count'],
      [natureGrid, videos.filter(isNaturesAlgorithms).sort((a, b) => a.episode - b.episode), 'videos-natures-algorithms-count'],
      [beautyGrid, videos.filter(isMathematicsOfBeauty).sort((a, b) => a.episode - b.episode), 'videos-mathematics-of-beauty-count'],
      [estimateGrid, videos.filter(isEstimateIt).sort((a, b) => a.episode - b.episode), 'videos-estimate-it-count'],
      [academiaGrid, videos.filter(isAcademiaDecoded).sort((a, b) => a.episode - b.episode), 'videos-academia-decoded-count']
    ];

    groups.forEach(([grid, list, countId]) => {
      if (!grid) return;
      grid.innerHTML = list.map((video) => cardHtml(video, animate)).join('');
      const section = grid.closest('section');
      if (section) section.hidden = list.length === 0;
      const count = document.getElementById(countId);
      if (count) count.textContent = String(list.length);
      wireThumbs(grid);
      if (animate) window.ACMLAnimations.enhance(grid);
    });

    const finder = setupFinder(groups);
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.classList.contains('video-card')) {
      if (target.hidden && finder) finder.reset();
      target.classList.add('is-target', 'reveal-visible');
      target.scrollIntoView({ block: 'center' });
    }
  }

  // ---- Publications page: a "Video" button on papers that have one ----
  async function addPublicationButtons() {
    const container = document.getElementById('publications-container');
    if (!container) return;

    let videos = [];
    try {
      videos = await loadVideos();
    } catch (error) {
      return;
    }

    const byPaper = new Map();
    videos.forEach((video) => {
      // a video whose paper names a year only matches the card with that year (two papers can share a title)
      if (video.paper && video.paper.title) byPaper.set(normTitle(video.paper.title) + (video.paper.year ? `|${video.paper.year}` : ''), video);
    });
    if (!byPaper.size) return;

    const apply = () => {
      container.querySelectorAll('[data-title]:not([data-video-checked])').forEach((card) => {
        card.dataset.videoChecked = '1';
        const video = byPaper.get(`${normTitle(card.dataset.title)}|${card.dataset.year || ''}`) || byPaper.get(normTitle(card.dataset.title));
        if (!video) return;
        const row = card.querySelector('.publication-action-button')?.parentElement;
        if (!row) return;
        row.insertAdjacentHTML('beforeend', `<a class="publication-action-button publication-source-button publication-video-button" href="${esc(watchUrl(video))}" data-yt-modal="${esc(video.id)}" data-yt-format="${isShort(video) ? 'short' : 'video'}" data-yt-title="${esc(video.title)}"><i class="ri-play-circle-fill" aria-hidden="true"></i>Video</a>`);
      });
    };

    apply();
    new MutationObserver(apply).observe(container, { childList: true });
  }

  function init() {
    wireThumbs();
    renderVideosPage();
    addPublicationButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
