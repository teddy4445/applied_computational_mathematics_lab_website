/* ACML videos
   - Click-to-load YouTube players: any .yt-player on a page (home, sock page, videos page).
     The page shows only a thumbnail until someone presses play, so it stays fast and no
     YouTube cookies are set before that (privacy-enhanced youtube-nocookie.com embed).
   - The Videos page (videos.html), rendered from data/videos.json.
   - A "Video" button on matching papers on the Publications page (opens a pop-up player).
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
    };
    img.addEventListener('error', next);
    img.addEventListener('load', () => {
      if (img.naturalWidth > 0 && img.naturalWidth <= 120) next();
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

  async function renderVideosPage() {
    const longGrid = document.getElementById('videos-long');
    const shortGrid = document.getElementById('videos-shorts');
    if (!longGrid && !shortGrid) return;

    let videos = [];
    try {
      videos = await loadVideos();
    } catch (error) {
      console.error(error);
      const target = longGrid || shortGrid;
      target.innerHTML = `<div class="video-load-error">Videos could not be loaded. Check that <code>${esc(DATA_URL)}</code> exists and is valid JSON.</div>`;
      return;
    }

    const animate = Boolean(window.ACMLAnimations && window.ACMLAnimations.enhance);
    const groups = [
      [longGrid, videos.filter((video) => !isShort(video)), 'videos-long-count'],
      [shortGrid, videos.filter(isShort), 'videos-shorts-count']
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

    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.classList.contains('video-card')) {
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
      if (video.paper && video.paper.title) byPaper.set(normTitle(video.paper.title), video);
    });
    if (!byPaper.size) return;

    const apply = () => {
      container.querySelectorAll('[data-title]:not([data-video-checked])').forEach((card) => {
        card.dataset.videoChecked = '1';
        const video = byPaper.get(normTitle(card.dataset.title));
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
