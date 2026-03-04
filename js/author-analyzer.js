/* ============================================================
   Author Analyzer (Front-end only)
   Score = Disruption Index (D-index) from OpenAlex
   Based on your disruption script logic:
   D = (nf - nb) / (nf + nb + nl)
   nf/nb/nl definitions match your file. :contentReference[oaicite:3]{index=3}
   ============================================================ */

/* -------------------------
   DOM helpers
------------------------- */
const $ = (sel) => document.querySelector(sel);

const form = $("#analyzeForm");
const personLinkInput = $("#personLink");
const apiKeyInput = $("#apiKey");
const errorBox = $("#errorBox");

const resultsSection = $("#section-results");
const analyzeBtn = form?.querySelector('button[type="submit"]');
const analyzeBtnOriginalHtml = analyzeBtn ? analyzeBtn.innerHTML : "Analyze";

const authorPanel = $("#authorPanel");
const authorBadge = $("#authorBadge");

const worksTbody = $("#worksTbody");
const tableSearch = $("#tableSearch");
const downloadCsvBtn = $("#downloadCsvBtn");

const regEquation = $("#regEquation");
const regR2 = $("#regR2");

const statsEls = {
  mean: $("#statMean"),
  std: $("#statStd"),
  median: $("#statMedian"),
  max: $("#statMax"),
  min: $("#statMin"),
  n: $("#statN"),
};

const loadingOverlay = $("#loadingOverlay");
const loadingMessage = $("#loadingMessage");
const loadingMeta = $("#loadingMeta");
const loadingBar = $("#loadingBar");
const cancelBtn = $("#cancelBtn");

let histChart = null;
let scatterChart = null;
let currentAbort = null;

let currentWorksAll = [];
let currentWorks = [];

const PERSON_PARAM = "person";

/* -------------------------
   UX: loading + disable
------------------------- */
function openLoading() {
  loadingOverlay?.classList.remove("hidden");
}
function closeLoading() {
  loadingOverlay?.classList.add("hidden");
}
function setLoading({ message, meta, progress01 }) {
  if (loadingMessage && message) loadingMessage.textContent = message;
  if (loadingMeta && meta) loadingMeta.textContent = meta;
  if (loadingBar && typeof progress01 === "number") {
    const p = Math.max(0.02, Math.min(1, progress01));
    loadingBar.style.width = `${Math.round(p * 100)}%`;
  }
}

function setPersonParamInUrl(personLink) {
  const url = new URL(window.location.href);

  const v = (personLink || "").trim();
  if (v) url.searchParams.set(PERSON_PARAM, v);
  else url.searchParams.delete(PERSON_PARAM);

  // Replace (no extra back-button entries). Use pushState if you want history entries.
  window.history.replaceState({}, "", url.toString());
}

function getPersonParamFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get(PERSON_PARAM) || "";
}

function setAnalyzeBusy(isBusy) {
  if (!analyzeBtn) return;
  analyzeBtn.disabled = isBusy;
  analyzeBtn.setAttribute("aria-busy", isBusy ? "true" : "false");
  if (isBusy) {
    analyzeBtn.classList.add("opacity-60", "cursor-not-allowed");
    analyzeBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Analyzing...`;
  } else {
    analyzeBtn.classList.remove("opacity-60", "cursor-not-allowed");
    analyzeBtn.innerHTML = analyzeBtnOriginalHtml;
  }
}

function revealResultsAndScroll() {
  if (!resultsSection) return;
  resultsSection.classList.remove("hidden-author-analyzer");
  requestAnimationFrame(() => {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function showError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}
function clearError() {
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/* -------------------------
   OpenAlex basics
------------------------- */
const OA_BASE = "https://api.openalex.org";

// IMPORTANT:
// Your original script uses a fixed MAILTO for the "polite pool". :contentReference[oaicite:4]{index=4}
// In a public front-end page, it's better to set your own email (or leave empty).
const MAILTO = ""; // e.g. "you@example.com"

function getApiKey() {
  return (apiKeyInput?.value || "").trim();
}

function buildUrl(path, params = {}) {
  const url = new URL(`${OA_BASE}${path}`);
  const apiKey = getApiKey();
  if (apiKey) url.searchParams.set("api_key", apiKey);
  if (MAILTO) url.searchParams.set("mailto", MAILTO);

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

// Retry logic mirrors your script’s apiFetch retry/backoff on 429. :contentReference[oaicite:5]{index=5}
async function apiFetchJson(url, { signal } = {}, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { signal, headers: { Accept: "application/json" } });

      if (res.status === 429) {
        const wait = 1500 * (attempt + 1);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`OpenAlex HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      return await res.json();
    } catch (err) {
      if (signal?.aborted) throw err;
      if (attempt === retries - 1) throw err;
      await sleep(800 * (attempt + 1));
    }
  }
}

/* -------------------------
   Input: author link/ORCID
------------------------- */
function normalizePersonInput(raw) {
  const s = (raw || "").trim();
  if (!s) throw new Error("Please paste an OpenAlex author link or an ORCID link.");

  const directA = s.match(/^A\d+$/i);
  if (directA) return { kind: "openalexKey", id: directA[0].toUpperCase() };

  const oaMatch = s.match(/openalex\.org\/(?:authors\/|people\/)?(A\d+)/i);
  if (oaMatch) return { kind: "openalexKey", id: oaMatch[1].toUpperCase() };

  const apiMatch = s.match(/api\.openalex\.org\/authors\/(A\d+)/i);
  if (apiMatch) return { kind: "openalexKey", id: apiMatch[1].toUpperCase() };

  const orcidMatch = s.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  if (orcidMatch) return { kind: "orcid", id: `https://orcid.org/${orcidMatch[1]}` };

  throw new Error("Unrecognized link. Provide openalex.org/A... or orcid.org/....");
}

async function fetchAuthor(authorInput, { signal }) {
  const select = "id,display_name,orcid,works_count,cited_by_count,last_known_institutions";
  const path =
    authorInput.kind === "openalexKey"
      ? `/authors/${encodeURIComponent(authorInput.id)}`
      : `/authors/${encodeURIComponent(authorInput.id)}`;

  const url = buildUrl(path, { select });
  return apiFetchJson(url, { signal });
}

function extractAuthorKeyFromAuthor(author) {
  const id = String(author?.id || "");
  const m = id.match(/openalex\.org\/(A\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

function renderAuthorPanel(author) {
  if (!authorPanel) return;
  if (authorBadge) authorBadge.classList.remove("hidden");

  const name = author?.display_name ?? "—";
  const id = author?.id ?? "—";
  const orcid = author?.orcid ?? null;
  const worksCount = author?.works_count ?? "—";
  const citedBy = author?.cited_by_count ?? "—";
  const inst = author?.last_known_institutions?.map(i => i.display_name).join(", ") ?? null;

  authorPanel.innerHTML = `
    <div class="space-y-2">
      <div class="text-lg font-semibold text-gray-900">${escapeHtml(name)}</div>
      <div class="text-sm text-gray-700 space-y-1">
        <div><span class="text-gray-500">OpenAlex ID:</span> <a class="hover:text-primary" target="_blank" rel="noopener noreferrer" href="${id}">${id}</a></div>
        <div><span class="text-gray-500">ORCID:</span> ${orcid ? `<a class="hover:text-primary" target="_blank" rel="noopener noreferrer" href="${orcid}">${orcid}</a>` : "—"}</div>
        <div><span class="text-gray-500">Works:</span> <b>${worksCount}</b> · <span class="text-gray-500">Citations:</span> <b>${citedBy}</b></div>
        <div><span class="text-gray-500">Last known institution:</span> ${inst ? `<b>${escapeHtml(inst)}</b>` : "—"}</div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------------
   Fetch author works (include referenced_works)
------------------------- */
async function fetchAllWorksByAuthorKey(authorKey, { signal, onProgress }) {
  let cursor = "*";
  const per_page = 200;

  // We include referenced_works so we can compute D without fetching the focal again.
  const select = "id,display_name,publication_year,authorships,referenced_works";

  const baseParams = {
    filter: `author.id:${authorKey}`,
    per_page,
    cursor,
    select,
    sort: "publication_year:asc",
  };

  let page = 0;
  let total = null;
  const results = [];

  while (true) {
    page++;
    baseParams.cursor = cursor;
    const url = buildUrl("/works", baseParams);

    const data = await apiFetchJson(url, { signal });
    const pageResults = Array.isArray(data?.results) ? data.results : [];
    results.push(...pageResults);

    if (total === null && data?.meta?.count != null) total = Number(data.meta.count);
    cursor = data?.meta?.next_cursor;

    onProgress?.({ page, loaded: results.length, total });

    if (!cursor || pageResults.length === 0) break;
    await sleep(80);
  }

  return results;
}

/* ============================================================
   Disruption Index (D-index) — browser version
   Logic mirrors your script:
   - fetch all citers including referenced_works :contentReference[oaicite:6]{index=6}
   - nf/nb computed by overlap with focal references :contentReference[oaicite:7]{index=7}
   - D computed as (nf-nb)/(nf+nb+nl) :contentReference[oaicite:8]{index=8}
============================================================ */

// Your Node script extracts W-id from many input formats. :contentReference[oaicite:9]{index=9}
function extractWorkId(input) {
  input = String(input || "").trim();
  const m = input.match(/W\d+/);
  if (m) return m[0];
  if (input.startsWith("https://doi.org/") || input.startsWith("10.")) return input;
  throw new Error(`Cannot identify an OpenAlex ID from input: "${input}"`);
}

async function fetchWorkByIdOrDoi(idOrDoi, { signal }) {
  if (/^W\d+$/.test(idOrDoi)) {
    // fetch focal details if needed
    const url = buildUrl(`/works/${encodeURIComponent(idOrDoi)}`, {
      select: "id,display_name,publication_year,referenced_works",
    });
    return apiFetchJson(url, { signal });
  }

  // DOI fallback (same strategy as your script) :contentReference[oaicite:10]{index=10}
  const doi = idOrDoi.replace("https://doi.org/", "");
  const url = buildUrl("/works", {
    filter: `doi:${encodeURIComponent(doi)}`,
    per_page: 1,
    select: "id,display_name,publication_year,referenced_works",
  });
  const data = await apiFetchJson(url, { signal });
  if (!data?.results?.length) throw new Error(`No work found for DOI: ${doi}`);
  return data.results[0];
}

async function fetchAllCiters(workShortId, { signal, onProgress }) {
  const citers = [];
  let cursor = "*";
  const per_page = 200;
  let total = null;
  let page = 0;

  while (true) {
    page++;
    const url = buildUrl("/works", {
      filter: `cites:${workShortId}`,
      per_page,
      cursor,
      select: "id,referenced_works",
    });

    const data = await apiFetchJson(url, { signal });
    const pageResults = Array.isArray(data?.results) ? data.results : [];
    citers.push(...pageResults);

    if (total === null && data?.meta?.count != null) total = Number(data.meta.count);
    cursor = data?.meta?.next_cursor;

    onProgress?.({ page, loaded: citers.length, total });

    if (!cursor || pageResults.length === 0) break;
    await sleep(70);
  }

  return citers;
}

// Optional (VERY slow): nl computation mirrors your script’s “fetch citer ids per reference”. :contentReference[oaicite:11]{index=11}
async function fetchCiterIds(workShortId, excludeSet, { signal }) {
  const result = new Set();
  let cursor = "*";
  const per_page = 200;

  while (true) {
    const url = buildUrl("/works", {
      filter: `cites:${workShortId}`,
      per_page,
      cursor,
      select: "id",
    });

    const data = await apiFetchJson(url, { signal });
    for (const w of data.results || []) {
      const shortId = String(w.id || "").replace("https://openalex.org/", "");
      if (shortId && !excludeSet.has(shortId)) result.add(shortId);
    }

    const total = data.meta?.count ?? 0;
    if (!data.meta?.next_cursor || result.size + excludeSet.size >= total) break;
    cursor = data.meta.next_cursor;
    await sleep(60);
  }

  return result;
}

// Control how expensive D-index is:
const COMPUTE_NL = false;         // default false (fast). nl is costly. :contentReference[oaicite:12]{index=12}
const MAX_WORKS_SCORED = 40;      // keep runtime reasonable in-browser
const SCORE_CONCURRENCY = 3;      // parallel scoring, limited to reduce rate limits

const disruptionCache = new Map(); // workShortId -> {D, nf, nb, nl}

async function computeDisruptionForWork(workObjOrId, { signal, onProgress } = {}) {
  // workObjOrId can be OpenAlex work object (from author list) OR a string
  let focal;
  if (typeof workObjOrId === "string") {
    focal = await fetchWorkByIdOrDoi(extractWorkId(workObjOrId), { signal });
  } else {
    focal = workObjOrId;
    if (!Array.isArray(focal?.referenced_works)) {
      // fallback: fetch full record
      const shortId = String(focal?.id || "").replace("https://openalex.org/", "");
      if (shortId) focal = await fetchWorkByIdOrDoi(shortId, { signal });
    }
  }

  const focalShortId = String(focal?.id || "").replace("https://openalex.org/", "");
  if (!focalShortId) return null;

  if (disruptionCache.has(focalShortId)) return disruptionCache.get(focalShortId);

  const references = new Set(
    (focal.referenced_works || []).map((r) => String(r).replace("https://openalex.org/", ""))
  );

  if (references.size === 0) {
    // Same behavior as your script: cannot compute if no refs. :contentReference[oaicite:13]{index=13}
    const res = { D: null, nf: 0, nb: 0, nl: 0 };
    disruptionCache.set(focalShortId, res);
    return res;
  }

  // Fetch all citers with their references (needed for nf/nb). :contentReference[oaicite:14]{index=14}
  const citers = await fetchAllCiters(focalShortId, {
    signal,
    onProgress,
  });

  if (!citers.length) {
    const res = { D: null, nf: 0, nb: 0, nl: 0 };
    disruptionCache.set(focalShortId, res);
    return res;
  }

  // nf/nb computation matches your overlap logic. :contentReference[oaicite:15]{index=15}
  let nf = 0;
  let nb = 0;

  const citerIdSet = new Set(
    citers.map((c) => String(c.id || "").replace("https://openalex.org/", ""))
  );

  for (const citer of citers) {
    const citerRefs = new Set(
      (citer.referenced_works || []).map((r) => String(r).replace("https://openalex.org/", ""))
    );

    let overlap = false;
    for (const ref of references) {
      if (citerRefs.has(ref)) {
        overlap = true;
        break;
      }
    }
    if (overlap) nb++;
    else nf++;
  }

  let nl = 0;

  // Optional nl (very slow) — same strategy as your script. :contentReference[oaicite:16]{index=16}
  if (COMPUTE_NL) {
    const nlPapers = new Set();
    let idx = 0;

    for (const refId of references) {
      idx++;
      // Papers that cite this ref but are NOT in citerIdSet
      try {
        const refCiters = await fetchCiterIds(refId, citerIdSet, { signal });
        for (const id of refCiters) nlPapers.add(id);
      } catch {
        // ignore missing references
      }
      await sleep(40);
    }
    nl = nlPapers.size;
  }

  const denom = nf + nb + nl;
  const D = denom > 0 ? (nf - nb) / denom : 0; // :contentReference[oaicite:17]{index=17}

  const res = { D, nf, nb, nl };
  disruptionCache.set(focalShortId, res);
  return res;
}

/* -------------------------
   Small concurrency helper
------------------------- */
function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job()
      .catch(() => {})
      .finally(() => {
        active--;
        next();
      });
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        }
      });
      next();
    });
}

/* -------------------------
   Stats + math
------------------------- */
function mean(arr) {
  if (!arr.length) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdPop(arr) {
  if (!arr.length) return NaN;
  const m = mean(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

function median(arr) {
  if (!arr.length) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function linearRegression(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;

  const xMean = mean(xs);
  const yMean = mean(ys);

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    num += dx * (ys[i] - yMean);
    den += dx * dx;
  }
  if (den === 0) return null;

  const b = num / den;
  const a = yMean - b * xMean;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = a + b * xs[i];
    ssRes += (ys[i] - yHat) ** 2;
    ssTot += (ys[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : (1 - ssRes / ssTot);
  return { a, b, r2 };
}

function formatNum(x, digits = 3) {
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(digits);
}

/* -------------------------
   Charts (Chart.js)
------------------------- */
function destroyCharts() {
  if (histChart) { histChart.destroy(); histChart = null; }
  if (scatterChart) { scatterChart.destroy(); scatterChart = null; }
}

function renderHistogram(scores) {
  const ctx = $("#histChart");
  if (!ctx) return;

  if (!scores.length) {
    if (histChart) histChart.destroy();
    histChart = null;
    return;
  }

  const minS = Math.min(...scores);
  const maxS = Math.max(...scores);

  const nBins = Math.max(8, Math.min(24, Math.ceil(Math.sqrt(scores.length))));
  const range = maxS - minS;
  let binSize = range === 0 ? 0.1 : range / nBins;

  const bins = new Array(nBins).fill(0);
  const labels = [];

  for (let i = 0; i < nBins; i++) {
    const a = minS + i * binSize;
    const b = i === nBins - 1 ? maxS : (minS + (i + 1) * binSize);
    labels.push(`${a.toFixed(2)}–${b.toFixed(2)}`);
  }

  for (const s of scores) {
    let idx = range === 0 ? 0 : Math.floor((s - minS) / binSize);
    if (idx >= nBins) idx = nBins - 1;
    if (idx < 0) idx = 0;
    bins[idx]++;
  }

  if (histChart) histChart.destroy();
  histChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: "Count", data: bins }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "D-index bins" }, grid: { display: false } },
        y: { title: { display: true, text: "Papers" }, beginAtZero: true }
      }
    }
  });
}

function renderScatter(ages, scores, reg) {
  const ctx = $("#scatterChart");
  if (!ctx) return;

  const points = ages.map((x, i) => ({ x, y: scores[i] }));
  const datasets = [{
    type: "scatter",
    label: "Papers",
    data: points,
    pointRadius: 3,
  }];

  if (reg) {
    const minX = Math.min(...ages);
    const maxX = Math.max(...ages);
    datasets.push({
      type: "line",
      label: "Regression",
      data: [
        { x: minX, y: reg.a + reg.b * minX },
        { x: maxX, y: reg.a + reg.b * maxX },
      ],
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
    });
  }

  if (scatterChart) scatterChart.destroy();
  scatterChart = new Chart(ctx, {
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Paper age (year − oldest year)" }, beginAtZero: true },
        // D-index can be negative, so do NOT force beginAtZero
        y: { title: { display: true, text: "D-index score" }, beginAtZero: false }
      }
    }
  });
}

/* -------------------------
   Table + CSV
------------------------- */
function setTableRows(rows) {
  currentWorks = rows;
  if (!worksTbody) return;

  worksTbody.innerHTML = "";
  if (!rows.length) {
    worksTbody.innerHTML = `<tr><td class="px-6 py-5 text-gray-500" colspan="4">No works found.</td></tr>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="px-6 py-4 text-gray-900">
        <a class="hover:text-primary" target="_blank" rel="noopener noreferrer" href="${r.work_url}">${escapeHtml(r.title)}</a>
        <div class="text-xs text-gray-500 mt-1">${escapeHtml(r.work_id)}</div>
      </td>
      <td class="px-6 py-4 text-gray-700">${r.year ?? "—"}</td>
      <td class="px-6 py-4 text-gray-700">${r.n_authors}</td>
      <td class="px-6 py-4 text-gray-900 font-semibold">${r.score_display}</td>
    `;
    frag.appendChild(tr);
  }
  worksTbody.appendChild(frag);
}

function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const header = ["title", "year", "n_authors", "score_D", "work_id", "work_url", "nf", "nb", "nl"];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push([
      esc(r.title),
      esc(r.year),
      esc(r.n_authors),
      esc(r.score),
      esc(r.work_id),
      esc(r.work_url),
      esc(r.nf),
      esc(r.nb),
      esc(r.nl),
    ].join(","));
  }
  return lines.join("\n");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* -------------------------
   Compute + render
------------------------- */
function resetUIForNewRun() {
  if (authorBadge) authorBadge.classList.add("hidden");
  if (authorPanel) authorPanel.innerHTML = `<div class="text-sm text-gray-500">Loading…</div>`;

  Object.values(statsEls).forEach((el) => { if (el) el.textContent = "—"; });
  if (regEquation) regEquation.textContent = "y = —";
  if (regR2) regR2.textContent = "R² = —";

  if (worksTbody) worksTbody.innerHTML = `<tr><td class="px-6 py-5 text-gray-500" colspan="4">Loading…</td></tr>`;
  if (tableSearch) tableSearch.value = "";

  destroyCharts();
  currentWorksAll = [];
  currentWorks = [];
}

function computeAndRender(rows) {
  const numericScores = rows.map(r => r.score).filter(Number.isFinite);
  const years = rows.map(r => r.year).filter(Number.isFinite);

  if (statsEls.n) statsEls.n.textContent = String(numericScores.length);

  if (!numericScores.length || !years.length) return;

  const m = mean(numericScores);
  const sd = stdPop(numericScores);
  const med = median(numericScores);
  const minV = Math.min(...numericScores);
  const maxV = Math.max(...numericScores);

  if (statsEls.mean) statsEls.mean.textContent = formatNum(m, 3);
  if (statsEls.std) statsEls.std.textContent = formatNum(sd, 3);
  if (statsEls.median) statsEls.median.textContent = formatNum(med, 3);
  if (statsEls.min) statsEls.min.textContent = formatNum(minV, 3);
  if (statsEls.max) statsEls.max.textContent = formatNum(maxV, 3);

  renderHistogram(numericScores);

  const oldestYear = Math.min(...years);
  const ages = rows
    .filter(r => Number.isFinite(r.score) && Number.isFinite(r.year))
    .map(r => r.year - oldestYear);

  const scoresForScatter = rows
    .filter(r => Number.isFinite(r.score) && Number.isFinite(r.year))
    .map(r => r.score);

  const reg = linearRegression(ages, scoresForScatter);
  renderScatter(ages, scoresForScatter, reg);

  if (regEquation && regR2 && reg) {
    const sign = reg.b >= 0 ? "+" : "−";
    regEquation.textContent = `y = ${formatNum(reg.a, 3)} ${sign} ${formatNum(Math.abs(reg.b), 3)}·x`;
    regR2.textContent = `R² = ${formatNum(reg.r2, 3)}`;
  }
}

/* -------------------------
   Main submit handler
------------------------- */
const cuteMessages = [
  "Summoning citations…",
  "Brewing coffee for the API…",
  "Counting overlaps (nf/nb)…",
  "Estimating disruption scores…",
  "Drawing charts with dramatic flair…",
];

function startCuteMessageLoop(signal) {
  let i = 0;
  setLoading({ message: cuteMessages[0] });
  const t = setInterval(() => {
    if (signal.aborted) { clearInterval(t); return; }
    i = (i + 1) % cuteMessages.length;
    setLoading({ message: cuteMessages[i] });
  }, 2400);
  return () => clearInterval(t);
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  setPersonParamInUrl(personLinkInput.value);

  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  setAnalyzeBusy(true);
  openLoading();
  setLoading({ meta: "Preparing…", progress01: 0.06 });

  const stopLoop = startCuteMessageLoop(currentAbort.signal);

  try {
    resetUIForNewRun();

    const parsed = normalizePersonInput(personLinkInput.value);

    setLoading({ meta: "Resolving author…", progress01: 0.10 });
    const author = await fetchAuthor(parsed, { signal: currentAbort.signal });
    renderAuthorPanel(author);

    const authorKey = extractAuthorKeyFromAuthor(author);
    if (!authorKey) throw new Error("Could not extract OpenAlex author key.");

    setLoading({ meta: "Fetching works list…", progress01: 0.18 });
    const works = await fetchAllWorksByAuthorKey(authorKey, {
      signal: currentAbort.signal,
      onProgress: ({ page, loaded, total }) => {
        const p = total
          ? Math.min(0.45, 0.18 + 0.27 * (loaded / Math.max(1, total)))
          : Math.min(0.45, 0.18 + 0.03 * page);
        setLoading({
          meta: total
            ? `Fetched ${loaded.toLocaleString()} / ${total.toLocaleString()} works`
            : `Fetched ${loaded.toLocaleString()} works`,
          progress01: p,
        });
      }
    });

    // Normalize basic table rows first
    const baseRows = works
      .map(w => {
        const year = Number(w.publication_year);
        if (!Number.isFinite(year)) return null;

        const title = String(w.display_name || "").trim() || "(untitled)";
        const nAuthors = Array.isArray(w.authorships) ? w.authorships.length : 0;

        const workId = String(w.id || "");
        const workShort = workId.replace("https://openalex.org/", "");
        const workUrl = workShort ? `https://openalex.org/${workShort}` : workId;

        return {
          _workObj: w, // keep for scoring
          title,
          year,
          n_authors: nAuthors,
          work_id: workId,
          work_url: workUrl,
          score: null,
          score_display: "…",
          nf: "",
          nb: "",
          nl: "",
        };
      })
      .filter(Boolean);

    // Limit scoring to keep runtime sane in-browser
    // (You can raise MAX_WORKS_SCORED if you want.)
    const rowsToScore = baseRows
      .sort((a, b) => b.year - a.year)
      .slice(0, MAX_WORKS_SCORED);

    // Score in parallel with limited concurrency
    const limit = createLimiter(SCORE_CONCURRENCY);
    let done = 0;

    setLoading({ meta: `Computing D-index for ${rowsToScore.length} works…`, progress01: 0.50 });

    await Promise.all(rowsToScore.map((row, idx) =>
      limit(async () => {
        if (currentAbort.signal.aborted) return;

        // per-work progress
        const workShortId = String(row.work_id).replace("https://openalex.org/", "");
        const label = workShortId ? workShortId : `work #${idx + 1}`;

        const res = await computeDisruptionForWork(row._workObj, {
          signal: currentAbort.signal,
          onProgress: ({ loaded, total }) => {
            // keep this lightweight
            if (total && loaded && loaded % 400 === 0) {
              setLoading({ meta: `Scoring ${label}: fetched ${loaded}/${total} citers…` });
            }
          }
        });

        // Set score
        if (res?.D === null || !Number.isFinite(res?.D)) {
          row.score = null;
          row.score_display = "—";
        } else {
          row.score = res.D;
          row.score_display = formatNum(res.D, 3);
        }
        row.nf = res?.nf ?? "";
        row.nb = res?.nb ?? "";
        row.nl = res?.nl ?? "";

        done++;
        const prog = 0.50 + 0.45 * (done / Math.max(1, rowsToScore.length));
        setLoading({
          meta: `Computed D-index: ${done}/${rowsToScore.length}`,
          progress01: Math.min(0.95, prog),
        });
      })
    ));

    // For works we didn’t score, mark as —
    const scoredSet = new Set(rowsToScore.map(r => r.work_id));
    for (const r of baseRows) {
      if (!scoredSet.has(r.work_id)) {
        r.score = null;
        r.score_display = "—";
      }
      delete r._workObj;
    }

    // Show table newest first
    currentWorksAll = baseRows.sort((a, b) => (b.year - a.year));
    setTableRows(currentWorksAll);

    // compute stats/charts on scored subset only (numeric scores)
    computeAndRender(currentWorksAll.filter(r => Number.isFinite(r.score)));

    setLoading({ meta: "Done.", progress01: 1.0 });

    closeLoading();
    revealResultsAndScroll();
  } catch (err) {
    closeLoading();
    showError(err?.message || "Something went wrong.");
  } finally {
    stopLoop();
    setAnalyzeBusy(false);
  }
});

cancelBtn?.addEventListener("click", () => {
  if (currentAbort) currentAbort.abort();
  closeLoading();
  showError("Canceled.");
  setAnalyzeBusy(false);
});

window.addEventListener("DOMContentLoaded", () => {
  const person = getPersonParamFromUrl();
  if (!person) return;

  // Fill input
  personLinkInput.value = person;

  // Auto-run analysis once
  // Guard against multiple runs (e.g. hot reload / double event)
  if (analyzeBtn?.disabled) return;

  // Trigger submit in a browser-friendly way
  if (form.requestSubmit) form.requestSubmit();
  else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
});

/* -------------------------
   Search + CSV
------------------------- */
tableSearch?.addEventListener("input", () => {
  const q = (tableSearch.value || "").trim().toLowerCase();
  if (!q) { setTableRows(currentWorksAll); return; }
  const filtered = currentWorksAll.filter(r => r.title.toLowerCase().includes(q));
  setTableRows(filtered);
});

downloadCsvBtn?.addEventListener("click", () => {
  if (!currentWorksAll.length) return showError("No data to export yet.");
  clearError();
  const csv = toCsv(currentWorksAll);
  const safeName = (personLinkInput.value || "author").replaceAll(/[^a-z0-9]+/gi, "_").slice(0, 40);
  downloadText(`${safeName}_openalex_d_index.csv`, csv);
});