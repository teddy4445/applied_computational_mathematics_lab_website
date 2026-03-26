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

// ======================
// Lab Statistics (NEW)
// ======================

// Change this to your actual "home country" string as it appears in JSON
const HOME_COUNTRY = 'Israel';

const round1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const round2 = (x) => (Math.round(x * 100) / 100).toFixed(2);

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const isEndDateCurrent = (e = '') => String(e).trim().toLowerCase() === 'current';

const inStats = (m) => m && m.include_in_stats === true;

const normGender = (g) => {
  const v = String(g || '').trim().toLowerCase();
  if (!v) return null;
  if (['m', 'male', 'man', 'masculine'].includes(v)) return 'male';
  if (['f', 'female', 'woman', 'feminine'].includes(v)) return 'female';
  return null;
};

// International flag:
// Prefer boolean is_international, else compare country to HOME_COUNTRY
const intlFlag = (m) => {
  if (typeof m.is_international === 'boolean') return m.is_international;
  const c = String(m.country || '').trim();
  if (!c) return null;
  return c !== HOME_COUNTRY;
};

// Prefer explicit degree_level in JSON; fallback to parsing title
// degree_level expected: "phd" | "master"
const inferDegreeLevel = (m) => {
  const dl = String(m.degree_level || '').trim().toLowerCase();
  if (dl === 'phd' || dl === 'doctorate') return 'phd';
  if (dl === 'master' || dl === 'msc' || dl === 'mcs') return 'master';

  const t = String(m.title || '').toLowerCase();
  if (t.includes('phd')) return 'phd';
  if (t.includes('mcs') || t.includes('msc') || t.includes('ms.')) return 'master';
  return null;
};

// Dates: your JSON is mostly d/m/yyyy but some are ambiguous (1/10/2023).
// Heuristic resolves:
// - If first > 12 -> day/month
// - If second > 12 -> month/day
// - Else assume day/month
const parseDateSmart = (s) => {
  if (!s) return null;
  const v = String(s).trim();
  if (!v || v.toLowerCase() === 'current') return null;

  const parts = v.split('/').map(p => p.trim());
  if (parts.length !== 3) return null;

  let a = Number(parts[0]);
  let b = Number(parts[1]);
  const y = Number(parts[2]);
  if (![a, b, y].every(Number.isFinite)) return null;

  let day, month;
  if (a > 12 && b <= 12) { day = a; month = b; }
  else if (b > 12 && a <= 12) { day = b; month = a; }
  else { day = a; month = b; }

  const dt = new Date(Date.UTC(y, month - 1, day));
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const yearsBetween = (start, end) => (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

// Publications: allow any of these input styles:
// 1) pub_q1_ratio: 0..1
// 2) pub_q1_pct: 0..100
// 3) pub_q1_count with pub_count
const q1RatioFromMember = (m) => {
  const r = Number(m.pub_q1_ratio);
  if (Number.isFinite(r)) return r;

  const pct = Number(m.pub_q1_pct);
  if (Number.isFinite(pct)) return pct / 100;

  const q1c = Number(m.pub_q1_count);
  const pc = Number(m.pub_count);
  if (Number.isFinite(q1c) && Number.isFinite(pc) && pc > 0) return q1c / pc;

  return null;
};

function wireGraphActivation(grid) {
  if (!grid) return;
  grid.querySelectorAll('.team-card').forEach((card, index) => {
    if (card.dataset.graphBound === 'true') return;
    card.dataset.graphBound = 'true';
    card.addEventListener('mouseenter', () => {
      window.ACMLTeamGraph?.activateForCard(index);
    });
  });
}

function computeAndRenderStats(members) {
  // Notes implemented:
  // 1) Male/Female uses include_in_stats === true, split by e_date === "Current" for Now, and all for Overall
  // 2) International same
  // 3) Completion time uses category_name === "Alumni" (and include_in_stats === true)
  // 4) Publications uses category_name === "Alumni" (and include_in_stats === true)

  const overall = members.filter(inStats);
  const now = overall.filter(m => isEndDateCurrent(m.e_date));

  // --- Gender (strict: if any missing gender among included -> TBD) ---
  const missingGenderOverall = overall.filter(m => !normGender(m.gender)).map(m => m.name);
  const missingGenderNow = now.filter(m => !normGender(m.gender)).map(m => m.name);

  let genderNowText = 'Now: TBD';
  let genderOverallText = 'Overall: TBD';

  if (overall.length && missingGenderOverall.length === 0) {
    const male = overall.filter(m => normGender(m.gender) === 'male').length;
    const female = overall.filter(m => normGender(m.gender) === 'female').length;
    const total = male + female;
    if (total > 0) genderOverallText = `Overall: ${round1((male / total) * 100)}% / ${round1((female / total) * 100)}%`;
  } else if (missingGenderOverall.length) {
    console.warn('Stats: missing/invalid "gender" for OVERALL include_in_stats members:', missingGenderOverall);
  }

  if (now.length && missingGenderNow.length === 0) {
    const male = now.filter(m => normGender(m.gender) === 'male').length;
    const female = now.filter(m => normGender(m.gender) === 'female').length;
    const total = male + female;
    if (total > 0) genderNowText = `Now: ${round1((male / total) * 100)}% / ${round1((female / total) * 100)}%`;
  } else if (missingGenderNow.length) {
    console.warn('Stats: missing/invalid "gender" for NOW include_in_stats members:', missingGenderNow);
  }

  // --- International (strict: if any missing intl info among included -> TBD) ---
  const missingIntlOverall = overall.filter(m => intlFlag(m) === null).map(m => m.name);
  const missingIntlNow = now.filter(m => intlFlag(m) === null).map(m => m.name);

  let intlNowText = 'Now: TBD';
  let intlOverallText = 'Overall: TBD';

  if (overall.length && missingIntlOverall.length === 0) {
    const intlCount = overall.filter(m => intlFlag(m) === true).length;
    intlOverallText = `Overall: ${round1((intlCount / overall.length) * 100)}%`;
  } else if (missingIntlOverall.length) {
    console.warn('Stats: missing "country" or "is_international" for OVERALL include_in_stats members:', missingIntlOverall);
  }

  if (now.length && missingIntlNow.length === 0) {
    const intlCount = now.filter(m => intlFlag(m) === true).length;
    intlNowText = `Now: ${round1((intlCount / now.length) * 100)}%`;
  } else if (missingIntlNow.length) {
    console.warn('Stats: missing "country" or "is_international" for NOW include_in_stats members:', missingIntlNow);
  }

  // --- Alumni-only groups for completion time and publications ---
  const alumni = members
    .filter(m => isAlumni(m.category_name || ''))
    .filter(inStats);

  // Completion time (years) per degree level
  const completionYears = (level /* 'phd'|'master' */) => {
    const yrs = [];
    const missing = [];
    for (const m of alumni) {
      if (inferDegreeLevel(m) !== level) continue;
      const s = parseDateSmart(m.s_date);
      const e = parseDateSmart(m.e_date);
      if (!s || !e) {
        missing.push(m.name);
        continue;
      }
      const y = yearsBetween(s, e);
      if (Number.isFinite(y) && y > 0) yrs.push(y);
      else missing.push(m.name);
    }
    if (missing.length) console.warn(`Stats: missing/invalid dates for alumni completion time (${level}):`, missing);
    return yrs;
  };

  const phdYears = completionYears('phd');
  const masterYears = completionYears('master');

  const timePhdText = (avg(phdYears) === null) ? 'PhD: TBD yrs' : `PhD: ${round2(avg(phdYears))} yrs`;
  const timeMasterText = (avg(masterYears) === null) ? 'Master: TBD yrs' : `Master: ${round2(avg(masterYears))} yrs`;

  // Publications (avg pub_count + overall Q1% weighted by pub_count)
  const pubStats = (level /* 'phd'|'master' */) => {
    const rows = alumni.filter(m => inferDegreeLevel(m) === level);

    const missingPub = rows.filter(m => !Number.isFinite(Number(m.pub_count))).map(m => m.name);
    const missingQ1 = rows.filter(m => q1RatioFromMember(m) === null).map(m => m.name);

    if (missingPub.length) console.warn(`Stats: missing/invalid "pub_count" for alumni (${level}):`, missingPub);
    if (missingQ1.length) console.warn(`Stats: missing Q1 info for alumni (${level}) — add pub_q1_ratio/pub_q1_pct/pub_q1_count:`, missingQ1);

    const valid = rows
      .map(m => {
        const pubCount = Number(m.pub_count);
        const q1r = q1RatioFromMember(m);
        if (!Number.isFinite(pubCount)) return null;
        if (q1r === null || !Number.isFinite(q1r)) return null;
        return { pubCount, q1r };
      })
      .filter(Boolean);

    if (!valid.length) return null;

    const sumPubs = valid.reduce((s, x) => s + x.pubCount, 0);
    const avgPubs = sumPubs / valid.length;

    const sumQ1Weighted = valid.reduce((s, x) => s + (x.pubCount * x.q1r), 0);
    const q1Pct = sumPubs > 0 ? (sumQ1Weighted / sumPubs) * 100 : null;

    return { avgPubs, q1Pct };
  };

  const phdP = pubStats('phd');
  const masterP = pubStats('master');

  const pubsPhdText = phdP ? `PhD: ${round1(phdP.avgPubs)} (${round1(phdP.q1Pct)}% Q1)` : 'PhD: TBD';
  const pubsMasterText = masterP ? `Master: ${round1(masterP.avgPubs)} (${round1(masterP.q1Pct)}% Q1)` : 'Master: TBD';

  // Write to HTML (IDs you will add below)
  setText('stat-gender-now', genderNowText);
  setText('stat-gender-overall', genderOverallText);
  setText('stat-intl-now', intlNowText);
  setText('stat-intl-overall', intlOverallText);
  setText('stat-time-phd', timePhdText);
  setText('stat-time-master', timeMasterText);
  setText('stat-pubs-phd', pubsPhdText);
  setText('stat-pubs-master', pubsMasterText);
}

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

  window.ACMLAnimations?.refreshCount(teamCountEl, current.length);
  window.ACMLAnimations?.refreshCount(alumniCountEl, alumni.length);
  window.ACMLAnimations?.enhance(currentGrid);
  window.ACMLAnimations?.enhance(alumniGrid);
  wireGraphActivation(currentGrid);

  // NEW: compute and render Lab Statistics
  computeAndRenderStats(members);
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
