/* Publication Score Analyzer
   - Score = cited_by_count (OpenAlex citations)
   - Histogram + descriptive stats
   - Scatter: age (year - oldestYear) vs score + linear regression + R^2

   Notes:
   - OpenAlex now expects API keys for reliable usage. Docs: API key required. (Used if provided)
   - We use cursor paging and select fields to reduce payload.
*/

const $ = (sel) => document.querySelector(sel);

const form = $("#analyzeForm");
const personLinkInput = $("#personLink");
const apiKeyInput = $("#apiKey");
const errorBox = $("#errorBox");

const authorPanel = $("#authorPanel");
const authorBadge = $("#authorBadge");

const statsEls = {
  mean: $("#statMean"),
  std: $("#statStd"),
  median: $("#statMedian"),
  max: $("#statMax"),
  min: $("#statMin"),
  n: $("#statN"),
};

const worksTbody = $("#worksTbody");
const tableSearch = $("#tableSearch");
const downloadCsvBtn = $("#downloadCsvBtn");

const loadingOverlay = $("#loadingOverlay");
const loadingMessage = $("#loadingMessage");
const loadingMeta = $("#loadingMeta");
const loadingBar = $("#loadingBar");
const cancelBtn = $("#cancelBtn");

const regEquation = $("#regEquation");
const regR2 = $("#regR2");

const resultsSection = document.getElementById("section-results");
const analyzeBtn = form?.querySelector('button[type="submit"]');

const analyzeBtnOriginalHtml = analyzeBtn ? analyzeBtn.innerHTML : "";

let histChart = null;
let scatterChart = null;

let currentAbort = null;
let currentWorks = []; // normalized rows used by table/csv/filter


function setAnalyzeBusy(isBusy) {
  if (!analyzeBtn) return;

  analyzeBtn.disabled = isBusy;
  analyzeBtn.setAttribute("aria-busy", isBusy ? "true" : "false");

  // Visual + optional label change
  if (isBusy) {
    analyzeBtn.classList.add("opacity-60", "cursor-not-allowed");
    analyzeBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Analyzing...`;
  } else {
    analyzeBtn.classList.remove("opacity-60", "cursor-not-allowed");
    analyzeBtn.innerHTML = analyzeBtnOriginalHtml || "Analyze";
  }
}

function revealResultsAndScroll() {
  if (!resultsSection) return;

  // show results on first successful analysis
  resultsSection.classList.remove("hidden-author-analyzer");

  // scroll to results
  requestAnimationFrame(() => {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}


// -----------------------------
// Navbar helpers (so this page works even without site JS)
// -----------------------------
(function setupNavbar() {
  const btn = $("#menu-btn");
  const menu = $("#mobile-menu");
  const nav = $("#navbar");

  if (btn && menu) {
    btn.addEventListener("click", () => {
      const expanded = menu.style.maxHeight && menu.style.maxHeight !== "0px";
      menu.style.maxHeight = expanded ? "0px" : `${menu.scrollHeight}px`;
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) menu.style.maxHeight = "0px";
    });
  }

  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add("nav-scrolled");
      else nav.classList.remove("nav-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();

// -----------------------------
// OpenAlex utilities
// -----------------------------
const OA_BASE = "https://api.openalex.org";

function buildUrl(path, params = {}) {
  const url = new URL(`${OA_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

function getApiKey() {
  return (apiKeyInput?.value || "").trim();
}

function normalizePersonInput(raw) {
  const s = (raw || "").trim();
  if (!s) throw new Error("Please paste an OpenAlex author link or an ORCID link.");

  // OpenAlex Author key (A123...)
  const directA = s.match(/^A\d+$/i);
  if (directA) return { kind: "openalexKey", id: directA[0].toUpperCase() };

  // Any OpenAlex URL containing A\d+
  const oaMatch = s.match(/openalex\.org\/(?:authors\/|people\/)?(A\d+)/i);
  if (oaMatch) return { kind: "openalexKey", id: oaMatch[1].toUpperCase() };

  // API URL with authors/A...
  const apiMatch = s.match(/api\.openalex\.org\/authors\/(A\d+)/i);
  if (apiMatch) return { kind: "openalexKey", id: apiMatch[1].toUpperCase() };

  // ORCID formats
  const orcidMatch = s.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  if (orcidMatch) return { kind: "orcid", id: `https://orcid.org/${orcidMatch[1]}` };

  throw new Error("Unrecognized link. Please provide an OpenAlex author URL (openalex.org/A...) or an ORCID (orcid.org/....).");
}

async function oaFetchJson(url, { signal } = {}) {
  const r = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      "Accept": "application/json",
    },
  });

  if (!r.ok) {
    let msg = `OpenAlex request failed (${r.status}).`;
    try {
      const t = await r.text();
      if (t) msg += ` ${t.slice(0, 280)}`;
    } catch {}
    throw new Error(msg);
  }

  return r.json();
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function openLoading() {
  loadingOverlay.classList.remove("hidden");
}
function closeLoading() {
  loadingOverlay.classList.add("hidden");
}
function setLoading({ message, meta, progress01 }) {
  if (message) loadingMessage.textContent = message;
  if (meta) loadingMeta.textContent = meta;
  if (typeof progress01 === "number") {
    const p = Math.max(0.02, Math.min(1, progress01));
    loadingBar.style.width = `${Math.round(p * 100)}%`;
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}
function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

// -----------------------------
// “Score” definition (change here if needed)
// -----------------------------
function scoreFromWork(work) {
  // score = cited_by_count
  const v = Number(work?.cited_by_count ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function yearFromWork(work) {
  const y = Number(work?.publication_year);
  return Number.isFinite(y) ? y : null;
}

function titleFromWork(work) {
  return String(work?.display_name ?? "").trim() || "(untitled)";
}

function authorCountFromWork(work) {
  const n = Array.isArray(work?.authorships) ? work.authorships.length : 0;
  return Number.isFinite(n) ? n : 0;
}

function workIdToOpenAlexWeb(id) {
  // id usually like https://openalex.org/W...
  const m = String(id || "").match(/openalex\.org\/(W\d+)/i);
  if (m) return `https://openalex.org/${m[1]}`;
  return String(id || "");
}

// -----------------------------
// Math helpers
// -----------------------------
function mean(arr) {
  if (!arr.length) return NaN;
  let s = 0;
  for (const x of arr) s += x;
  return s / arr.length;
}

function stdPop(arr) {
  if (!arr.length) return NaN;
  const m = mean(arr);
  let v = 0;
  for (const x of arr) v += (x - m) ** 2;
  return Math.sqrt(v / arr.length);
}

function median(arr) {
  if (!arr.length) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function linearRegression(xs, ys) {
  // y = a + b x
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;

  const xMean = mean(xs);
  const yMean = mean(ys);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    num += dx * (ys[i] - yMean);
    den += dx * dx;
  }
  if (den === 0) return null;

  const b = num / den;
  const a = yMean - b * xMean;

  // R^2
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = a + b * xs[i];
    ssRes += (ys[i] - yHat) ** 2;
    ssTot += (ys[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : (1 - ssRes / ssTot);

  return { a, b, r2 };
}

function formatNum(x, digits = 2) {
  if (!Number.isFinite(x)) return "—";
  // keep integers as integers
  if (Number.isInteger(x)) return String(x);
  return x.toFixed(digits);
}

// -----------------------------
// Charts
// -----------------------------
function destroyCharts() {
  if (histChart) { histChart.destroy(); histChart = null; }
  if (scatterChart) { scatterChart.destroy(); scatterChart = null; }
}

function renderHistogram(scores) {
  const ctx = $("#histChart");
  if (!ctx) return;

  if (!scores.length) {
    destroyCharts();
    return;
  }

  const minS = Math.min(...scores);
  const maxS = Math.max(...scores);

  // bins: sqrt(n), clamped
  const nBins = Math.max(5, Math.min(20, Math.ceil(Math.sqrt(scores.length))));
  const range = maxS - minS;

  let binSize = range === 0 ? 1 : range / nBins;

  // ensure non-zero binSize for tight integer ranges
  if (binSize === 0) binSize = 1;

  const bins = new Array(nBins).fill(0);
  const labels = [];

  for (let i = 0; i < nBins; i++) {
    const a = minS + i * binSize;
    const b = i === nBins - 1 ? maxS : (minS + (i + 1) * binSize);
    labels.push(`${Math.floor(a)}–${Math.floor(b)}`);
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
    data: {
      labels,
      datasets: [{
        label: "Count",
        data: bins,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Score range: ${items?.[0]?.label ?? ""}`,
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Score bins" },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: "Papers" },
          beginAtZero: true,
        }
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
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `age=${item.raw.x}, score=${item.raw.y}`,
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Academic age (Publish year − first publish year)" },
          beginAtZero: true,
        },
        y: {
          title: { display: true, text: "Disruptive score" },
          beginAtZero: true,
        }
      }
    }
  });
}

// -----------------------------
// Table
// -----------------------------
function setTableRows(rows) {
  currentWorks = rows;

  // clear
  worksTbody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="px-6 py-5 text-gray-500" colspan="4">No works found.</td>`;
    worksTbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();

  for (const r of rows) {
    const tr = document.createElement("tr");

    const titleTd = document.createElement("td");
    titleTd.className = "px-6 py-4 text-gray-900";

    const a = document.createElement("a");
    a.className = "hover:text-primary";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.href = r.work_url;
    a.textContent = r.title;

    const sub = document.createElement("div");
    sub.className = "text-xs text-gray-500 mt-1";
    sub.textContent = r.work_id;

    titleTd.appendChild(a);
    titleTd.appendChild(sub);

    const yearTd = document.createElement("td");
    yearTd.className = "px-6 py-4 text-gray-700";
    yearTd.textContent = String(r.year ?? "—");

    const authorsTd = document.createElement("td");
    authorsTd.className = "px-6 py-4 text-gray-700";
    authorsTd.textContent = String(r.n_authors);

    const scoreTd = document.createElement("td");
    scoreTd.className = "px-6 py-4 text-gray-900 font-semibold";
    scoreTd.textContent = String(r.score);

    tr.appendChild(titleTd);
    tr.appendChild(yearTd);
    tr.appendChild(authorsTd);
    tr.appendChild(scoreTd);

    frag.appendChild(tr);
  }

  worksTbody.appendChild(frag);
}

function filterTable(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    setTableRows(currentWorksAll);
    return;
  }
  const filtered = currentWorksAll.filter(r => r.title.toLowerCase().includes(q));
  setTableRows(filtered);
}

function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const header = ["title", "year", "n_authors", "score", "work_id", "work_url"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      esc(r.title),
      esc(r.year),
      esc(r.n_authors),
      esc(r.score),
      esc(r.work_id),
      esc(r.work_url),
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

// -----------------------------
// OpenAlex fetch pipeline
// -----------------------------
let currentWorksAll = [];

async function fetchAuthor(authorInput, { signal }) {
  const apiKey = getApiKey();

  // Use select to keep it light
  const authorSelect =
    "id,display_name,orcid,works_count,cited_by_count,last_known_institutions,affiliations";

  let authorPath;
  if (authorInput.kind === "openalexKey") {
    authorPath = `/authors/${encodeURIComponent(authorInput.id)}`;
  } else {
    // ORCID: docs show /authors/<ORCID URL> works (URL-encoded)
    authorPath = `/authors/${encodeURIComponent(authorInput.id)}`;
  }

  const url = buildUrl(authorPath, {
    select: authorSelect,
    api_key: apiKey || undefined,
  });

  return oaFetchJson(url, { signal });
}

async function fetchAllWorksByAuthorKey(authorKey, { signal, onProgress }) {
  const apiKey = getApiKey();

  // Cursor paging docs: cursor=* then next_cursor in meta :contentReference[oaicite:4]{index=4}
  let cursor = "*";
  let results = [];
  let total = null;

  // Select fields docs :contentReference[oaicite:5]{index=5}
  const select = "id,display_name,publication_year,cited_by_count,authorships";

  // Filter by author.id (works) – example shows author.id:A... :contentReference[oaicite:6]{index=6}
  // We also sort by publication_year asc to make “oldest year” stable.
  const baseParams = {
    filter: `author.id:${authorKey}`,
    per_page: 200,
    cursor,
    select,
    sort: "publication_year:asc",
    api_key: apiKey || undefined,
  };

  let page = 0;

  while (true) {
    page++;
    baseParams.cursor = cursor;

    const url = buildUrl("/works", baseParams);
    const data = await oaFetchJson(url, { signal });

    if (total === null && data?.meta?.count != null) total = Number(data.meta.count);

    const pageResults = Array.isArray(data?.results) ? data.results : [];
    results.push(...pageResults);

    cursor = data?.meta?.next_cursor;

    if (onProgress) {
      onProgress({
        page,
        loaded: results.length,
        total: Number.isFinite(total) ? total : null,
        cursor,
      });
    }

    if (!cursor || pageResults.length === 0) break;

    // A tiny pause helps avoid hammering the API in the browser
    await sleep(120);
    if (results.length > 8000) break; // safety cap
  }

  return results;
}

function extractAuthorKeyFromAuthor(author) {
  const id = String(author?.id || "");
  const m = id.match(/openalex\.org\/(A\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

function renderAuthorPanel(author) {
  authorBadge.classList.remove("hidden");
  authorPanel.innerHTML = "";

  const name = author?.display_name ?? "—";
  const id = author?.id ?? "—";
  const orcid = author?.orcid ?? null;
  const worksCount = author?.works_count ?? "—";
  const citedBy = author?.cited_by_count ?? "—";
  const inst = author?.last_known_institution?.display_name ?? null;
  const country = author?.last_known_institution?.country_code ?? null;

  const wrap = document.createElement("div");
  wrap.className = "space-y-3";

  const title = document.createElement("div");
  title.className = "text-lg font-semibold text-gray-900";
  title.textContent = name;

  const meta = document.createElement("div");
  meta.className = "text-sm text-gray-700 space-y-1";

  const idRow = document.createElement("div");
  idRow.innerHTML = `<span class="text-gray-500">OpenAlex ID:</span> <a class="hover:text-primary" target="_blank" rel="noopener noreferrer" href="${id}">${id}</a>`;

  const orcidRow = document.createElement("div");
  orcidRow.innerHTML = orcid
    ? `<span class="text-gray-500">ORCID:</span> <a class="hover:text-primary" target="_blank" rel="noopener noreferrer" href="${orcid}">${orcid}</a>`
    : `<span class="text-gray-500">ORCID:</span> —`;

  const countsRow = document.createElement("div");
  countsRow.innerHTML = `<span class="text-gray-500">Works:</span> <b>${worksCount}</b> &nbsp; · &nbsp; <span class="text-gray-500">Citations:</span> <b>${citedBy}</b>`;

  const instRow = document.createElement("div");
  instRow.innerHTML = inst
    ? `<span class="text-gray-500">Last known institution:</span> <b>${inst}</b>${country ? ` <span class="text-gray-500">(${country})</span>` : ""}`
    : `<span class="text-gray-500">Last known institution:</span> —`;

  wrap.appendChild(title);
  meta.appendChild(idRow);
  meta.appendChild(orcidRow);
  meta.appendChild(countsRow);
  meta.appendChild(instRow);
  wrap.appendChild(meta);

  authorPanel.appendChild(wrap);
}

// -----------------------------
// Main analysis
// -----------------------------
const cuteMessages = [
  "Summoning citations…",
  "Brewing coffee for the API…",
  "Sorting years and authors…",
  "Counting papers like a tiny librarian…",
  "Binning scores into neat little boxes…",
  "Drawing charts with dramatic flair…",
];

function startCuteMessageLoop(signal) {
  let i = 0;
  setLoading({ message: cuteMessages[0] });
  const t = setInterval(() => {
    if (signal.aborted) { clearInterval(t); return; }
    i = (i + 1) % cuteMessages.length;
    setLoading({ message: cuteMessages[i] });
  }, 2600);
  return () => clearInterval(t);
}

function resetUIForNewRun() {
  authorBadge.classList.add("hidden");
  authorPanel.innerHTML = `<div class="text-sm text-gray-500">Loading…</div>`;

  for (const k of Object.keys(statsEls)) statsEls[k].textContent = "—";
  regEquation.textContent = "y = —";
  regR2.textContent = "R² = —";

  worksTbody.innerHTML = `<tr><td class="px-6 py-5 text-gray-500" colspan="4">Loading…</td></tr>`;
  tableSearch.value = "";

  destroyCharts();
  currentWorksAll = [];
  currentWorks = [];
}

function computeAndRender(rows) {
  // stats + charts use all rows (unfiltered)
  const scores = rows.map(r => r.score).filter(Number.isFinite);
  const years = rows.map(r => r.year).filter(Number.isFinite);

  const n = scores.length;
  statsEls.n.textContent = String(n);
  if (!n) return;

  const m = mean(scores);
  const sd = stdPop(scores);
  const med = median(scores);
  const minV = Math.min(...scores);
  const maxV = Math.max(...scores);

  statsEls.mean.textContent = formatNum(m, 2);
  statsEls.std.textContent = formatNum(sd, 2);
  statsEls.median.textContent = formatNum(med, 2);
  statsEls.min.textContent = formatNum(minV, 0);
  statsEls.max.textContent = formatNum(maxV, 0);

  renderHistogram(scores);

  const oldestYear = Math.min(...years);
  const ages = rows.map(r => r.year - oldestYear);
  const reg = linearRegression(ages, scores);

  renderScatter(ages, scores, reg);

  if (reg) {
    const a = reg.a;
    const b = reg.b;
    const sign = b >= 0 ? "+" : "−";
    regEquation.textContent = `y = ${formatNum(a, 2)} ${sign} ${formatNum(Math.abs(b), 2)}·x`;
    regR2.textContent = `R² = ${formatNum(reg.r2, 3)}`;
  } else {
    regEquation.textContent = "y = — (not enough variation/data)";
    regR2.textContent = "R² = —";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  // cancel prior
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  setAnalyzeBusy(true);      // ✅ disable button
  openLoading();             // ✅ show overlay
  setLoading({ meta: "Preparing…", progress01: 0.08 });

  const stopLoop = startCuteMessageLoop(currentAbort.signal);

  try {
    resetUIForNewRun();

    const parsed = normalizePersonInput(personLinkInput.value);

    setLoading({ meta: "Resolving author…", progress01: 0.12 });
    const author = await fetchAuthor(parsed, { signal: currentAbort.signal });
    renderAuthorPanel(author);

    const authorKey = extractAuthorKeyFromAuthor(author);
    if (!authorKey) throw new Error("Could not extract OpenAlex author key.");

    setLoading({ meta: `Fetching works…`, progress01: 0.18 });
    const works = await fetchAllWorksByAuthorKey(authorKey, {
      signal: currentAbort.signal,
      onProgress: ({ page, loaded, total }) => {
        const p = total
          ? Math.min(0.92, 0.18 + 0.74 * (loaded / Math.max(1, total)))
          : Math.min(0.90, 0.18 + 0.02 * page);

        setLoading({
          meta: total
            ? `Fetched ${loaded.toLocaleString()} / ${total.toLocaleString()} works (page ${page})`
            : `Fetched ${loaded.toLocaleString()} works (page ${page})`,
          progress01: p,
        });
      },
    });

    setLoading({ meta: "Computing + rendering…", progress01: 0.95 });

    // Normalize rows
    const rows = works
      .map(w => {
        const year = yearFromWork(w);
        if (year === null) return null;

        const title = titleFromWork(w);
        const score = scoreFromWork(w);
        const nAuthors = authorCountFromWork(w);

        const workId = String(w?.id || "");
        const workUrl = workIdToOpenAlexWeb(workId);

        return {
          title,
          year,
          n_authors: nAuthors,
          score,
          work_id: workId,
          work_url: workUrl,
        };
      })
      .filter(Boolean);

    currentWorksAll = rows;

    // Table (default: newest first is often nicer)
    const tableRows = [...rows].sort((a, b) => (b.year - a.year) || (b.score - a.score));
    setTableRows(tableRows);

    computeAndRender(rows);

    setLoading({ meta: "Done.", progress01: 1.0 });

    // ✅ only now show results and scroll
    closeLoading();                 // ✅ remove overlay
    revealResultsAndScroll();       // ✅ unhide + scroll
  } catch (err) {
    closeLoading();                 // ✅ remove overlay on error
    showError(err?.message || "Something went wrong.");
  } finally {
    stopLoop();
    setAnalyzeBusy(false);          // ✅ re-enable button always
  }
});

cancelBtn.addEventListener("click", () => {
  if (currentAbort) currentAbort.abort();
  closeLoading();
  showError("Canceled.");
  setAnalyzeBusy(false);
});

// search
tableSearch.addEventListener("input", () => {
  const q = (tableSearch.value || "").trim().toLowerCase();
  if (!q) {
    setTableRows([...currentWorksAll].sort((a, b) => (b.year - a.year) || (b.score - a.score)));
    return;
  }
  const filtered = currentWorksAll
    .filter(r => r.title.toLowerCase().includes(q))
    .sort((a, b) => (b.year - a.year) || (b.score - a.score));
  setTableRows(filtered);
});

// csv download
downloadCsvBtn.addEventListener("click", () => {
  if (!currentWorksAll.length) {
    showError("No data to export yet.");
    return;
  }
  clearError();
  const csv = toCsv(currentWorksAll);
  const safeName = (personLinkInput.value || "author").replaceAll(/[^a-z0-9]+/gi, "_").slice(0, 40);
  downloadText(`${safeName}_openalex_scores.csv`, csv);
});