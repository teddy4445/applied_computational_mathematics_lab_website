// js/lab.js
const DATA_URL = 'data/lab.json';

// helpers
const isCurrent = (cat = '') => cat.trim().toLowerCase().startsWith('current');
const isAlumni  = (cat = '') => cat.trim().toLowerCase().startsWith('alumni');

// Some JSON rows use "offical" / "unoffical" - normalize but we don't actually display that bit.
const normalizeCategory = (cat = '') => {
  return cat.replace(/offical|unoffical/gi, m => (m.toLowerCase() === 'offical' ? 'official' : 'unofficial'));
};

const fallbackImg = (img) => {
  img.onerror = null;
  img.src = 'img/lab/user.png';
};

// Build a hover image path by inserting "hover-" before the filename.
// Example: /img/lab/alice.jpg -> /img/lab/hover-alice.jpg
const deriveHoverFromPrimary = (src = '') => {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.href);
    const segments = url.pathname.split('/');
    const file = segments.pop() || '';
    if (!file || file.startsWith('hover-')) return ''; // already a hover or missing file
    // Skip placeholder
    if (/^user\.(png|jpe?g|webp|svg)$/i.test(file)) return '';
    const hoverFile = `hover-${file}`;
    url.pathname = [...segments, hoverFile].join('/');
    return url.toString();
  } catch {
    // Relative path fallback (no base URL)
    const i = src.lastIndexOf('/');
    const dir = i >= 0 ? src.slice(0, i + 1) : '';
    const file = i >= 0 ? src.slice(i + 1) : src;
    if (!file || file.startsWith('hover-')) return '';
    if (/^user\.(png|jpe?g|webp|svg)$/i.test(file)) return '';
    return `${dir}hover-${file}`;
  }
};

const cardTemplate = (m) => {
  const hasLink = (m.info_link || '').trim().length > 0;
  const image = (m.image_link || '').trim() || 'img/lab/user.png';
  const hoverImage = deriveHoverFromPrimary(image);
  const useHover = !!hoverImage && hoverImage !== image;

  const wrapOpen  = hasLink ? `<a href="${m.info_link}" target="_blank" rel="noopener" class="block group">` : `<div class="block group">`;
  const wrapClose = hasLink ? `</a>` : `</div>`;

  // Two stacked images: base + hover (which fades in on group hover). If hover 404s, we remove it.
  return `
    ${wrapOpen}
      <div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden team-card">
        <div class="aspect-square overflow-hidden relative">
          <img
            src="${image}"
            alt="${m.name}"
            loading="lazy" decoding="async"
            class="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${useHover ? 'group-hover:opacity-0' : ''}"
            onerror="this.onerror=null;this.src='img/lab/user.png';"
          />
          ${useHover ? `
            <img
              src="${hoverImage}"
              alt="${m.name} (alternate)"
              loading="lazy" decoding="async" aria-hidden="true"
              class="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              onerror="this.onerror=null;this.remove();"
            />
          ` : ``}
        </div>
        <div class="p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-1 ${hasLink ? 'group-hover:text-primary transition-colors' : ''}">${m.name}</h3>
          <p class="text-primary font-medium mb-2">${m.title}</p>
          <p class="text-sm text-gray-600">${m.description || ''}</p>
        </div>
      </div>
    ${wrapClose}
  `;
};

async function loadMembers() {
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
  const json = await res.json();

  const members = Array.isArray(json.members) ? json.members.slice() : [];
  // sort by "order" ascending, then by name
  members.sort((a, b) => {
    const ao = Number(a.order ?? 9999);
    const bo = Number(b.order ?? 9999);
    if (ao !== bo) return ao - bo;
    return (a.name || '').localeCompare(b.name || '');
  });

  // group
  const current = members.filter(m => isCurrent(m.category_name || ''));
  const alumni  = members.filter(m => isAlumni(m.category_name || ''));

  // render
  const currentGrid = document.getElementById('current-grid');
  const alumniGrid  = document.getElementById('alumni-grid');

  currentGrid.innerHTML = current.map(cardTemplate).join('');
  alumniGrid.innerHTML  = alumni.map(cardTemplate).join('');

  // swap skeletons for real grids
  document.getElementById('current-grid-skeleton')?.classList.add('hidden');
  currentGrid.classList.remove('hidden');

  document.getElementById('alumni-grid-skeleton')?.classList.add('hidden');
  alumniGrid.classList.remove('hidden');

  // update counters in hero
  const teamCountEl   = document.getElementById('team-count');
  const alumniCountEl = document.getElementById('alumni-count');
  if (teamCountEl)   teamCountEl.textContent   = `${current.length}`;
  if (alumniCountEl) alumniCountEl.textContent = `${alumni.length}`;
}

loadMembers().catch(err => {
  console.error(err);
  // fail-safe: hide skeletons even on error
  document.getElementById('current-grid-skeleton')?.classList.add('hidden');
  document.getElementById('alumni-grid-skeleton')?.classList.add('hidden');
  // show simple error message blocks
  const errorBox = `
    <div class="col-span-full bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-xl">
      Could not load <code>data/lab.json</code>. Please verify the file path and JSON shape.
    </div>`;
  document.getElementById('current-grid')?.classList.remove('hidden');
  document.getElementById('alumni-grid')?.classList.remove('hidden');
  if (document.getElementById('current-grid')) document.getElementById('current-grid').innerHTML = errorBox;
  if (document.getElementById('alumni-grid'))  document.getElementById('alumni-grid').innerHTML  = '';
});
