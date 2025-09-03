// js/hero-graph.js
// Left→Right 2D graph (square layout): Users (5) → Subjects (5) → Math Symbols (5, blue circles)
// On load: shuffle order of each column. Tight horizontal spacing for a compact square feel.
// Dashed black lines. No hover. Rewires every 3s. Each user guaranteed a U→S→M path.

const container = document.getElementById('acm-graph');
const svg = document.getElementById('graph-svg');
if (!container || !svg) throw new Error('Graph container/svg not found');

// Base sets
const USERS_BASE   = ['🧑‍🔬','👩‍💻','👨‍🔬','👩‍🏫','👨‍💻'];
const SUBJECTS_BASE= ['🧬','⚙️','💰️','🐱','🌡️'];
const SYMBOLS_BASE = ['Φ','Σ','π','μ','∞'];

// --- Shuffle on page load ---
const USERS    = shuffle([...USERS_BASE]);
const SUBJECTS = shuffle([...SUBJECTS_BASE]);
const SYMBOLS  = shuffle([...SYMBOLS_BASE]);

// ------------------ layers ------------------
while (svg.firstChild) svg.removeChild(svg.firstChild);
const edgeLayer = mk('g', { id: 'edges' });   // lines only
const nodeLayer = mk('g', { id: 'nodes' });   // emoji + symbol circles
svg.appendChild(edgeLayer);
svg.appendChild(nodeLayer);

// ------------------ layout state ------------------
const layout = { width: 600, height: 600, padX: 24, padY: 28 };
const cols = { usersX: 0, subjectsX: 0, symbolsX: 0 };
let users = [];    // {x,y,el}
let subjects = []; // {x,y,el}
let symbols = [];  // {x,y,groupEl,circleEl,textEl}
let edges = [];    // {line}

// ------------------ helpers ------------------
function mk(tag, attrs = {}, text = '') {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}
function randInt(max) { return Math.floor(Math.random() * max); }
function choice(arr) { return arr[randInt(arr.length)]; }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resize() {
  const r = container.getBoundingClientRect();
  // enforce a square viewBox that matches the container’s current square frame
  const size = Math.max(300, Math.floor(Math.min(r.width, r.height)));
  layout.width  = size;
  layout.height = size;

  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute('width', layout.width);
  svg.setAttribute('height', layout.height);

  // **TIGHTER HORIZONTAL SPACING** for a compact square look
  // Keep columns close together even on very wide screens
  const spacing = Math.max(120, Math.min(180, Math.floor((layout.width - 2*layout.padX - 30) / 2)));
  cols.usersX    = layout.padX + 10;
  cols.subjectsX = cols.usersX + spacing;
  cols.symbolsX  = cols.subjectsX + spacing;

  placeNodes();
  rewire(); // rebuild edges after layout
}

function placeColumnText(emojis, x, size, existing) {
  const n = emojis.length; // 5
  const top = layout.padY + 8;
  const bottom = layout.height - layout.padY - 8;
  const usable = Math.max(1, bottom - top);
  const step = n > 1 ? usable / (n - 1) : 0;

  const out = [];
  for (let i = 0; i < n; i++) {
    const y = top + i * step;
    let el;
    if (existing && existing[i]) {
      el = existing[i].el;
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.textContent = emojis[i];
    } else {
      el = mk('text', {
        'font-size': size,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#111111'
      }, emojis[i]);
      nodeLayer.appendChild(el);
      el.setAttribute('x', x); el.setAttribute('y', y);
    }
    out.push({ x, y, el });
  }
  return out;
}

// Right column with blue circles behind symbols
function placeSymbolsWithCircles(emojis, x, size, existing) {
  const n = emojis.length; // 5
  const top = layout.padY + 8;
  const bottom = layout.height - layout.padY - 8;
  const usable = Math.max(1, bottom - top);
  const step = n > 1 ? usable / (n - 1) : 0;

  const out = [];
  const R = 22; // circle radius

  for (let i = 0; i < n; i++) {
    const y = top + i * step;
    let group, circle, text;
    if (existing && existing[i]) {
      group = existing[i].groupEl;
      circle = existing[i].circleEl;
      text = existing[i].textEl;
      text.textContent = emojis[i];
      group.setAttribute('transform', `translate(${x},${y})`);
    } else {
      group = mk('g', { transform: `translate(${x},${y})` });
      circle = mk('circle', {
        r: R,
        cx: 0, cy: 0,
        fill: '#2563eb', // Tailwind blue-600
        stroke: 'rgba(255,255,255,0.85)',
        'stroke-width': 1.5
      });
      text = mk('text', {
        'font-size': size,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#ffffff'
      }, emojis[i]);
      group.appendChild(circle);
      group.appendChild(text);
      nodeLayer.appendChild(group);
    }
    out.push({ x, y, groupEl: group, circleEl: circle, textEl: text });
  }
  return out;
}

function placeNodes() {
  users    = placeColumnText(USERS,    cols.usersX,   28, users);
  subjects = placeColumnText(SUBJECTS, cols.subjectsX,30, subjects);
  symbols  = placeSymbolsWithCircles(SYMBOLS, cols.symbolsX, 20, symbols);
}

function clearEdges() {
  edges.forEach(e => e.line.remove());
  edges = [];
}

function addEdge(x1, y1, x2, y2) {
  const line = mk('line', {
    x1, y1, x2, y2,
    stroke: '#000000',           // black
    'stroke-width': 2,
    'stroke-dasharray': '6 6'    // dashed
  });
  edgeLayer.appendChild(line);
  edges.push({ line });
}

function rewire() {
  clearEdges();

  // Guarantee: each user gets a path U→S→M
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const s = choice(subjects);
    const m = choice(symbols);
    addEdge(u.x, u.y, s.x, s.y);
    addEdge(s.x, s.y, m.x, m.y);
  }

  // Optional: a few extra edges for variety in a compact layout
  const extraUS = 2, extraSM = 2;
  for (let k = 0; k < extraUS; k++) {
    const u = choice(users);
    const s = choice(subjects);
    addEdge(u.x, u.y, s.x, s.y);
  }
  for (let k = 0; k < extraSM; k++) {
    const s = choice(subjects);
    const m = choice(symbols);
    addEdge(s.x, s.y, m.x, m.y);
  }
}

// ------------------ init ------------------
resize();
window.addEventListener('resize', resize);
setInterval(rewire, 3000);

// Gentle idle bob to keep it lively (no hover)
let t = 0;
function tick() {
  t += 0.02;
  const bob = (i, baseY, amp, speed) => baseY + Math.sin(t*speed + i*0.8) * amp;

  const baseUsers = users.map(n => n.y);
  const baseSubjects = subjects.map(n => n.y);
  const baseSymbols = symbols.map(n => n.groupEl.transform.baseVal.consolidate()
    ? +symbols[i]?.groupEl?.transform?.baseVal?.consolidate()?.matrix?.f || symbols[i].y
    : symbols[i].y
  );

  users.forEach((n, i) => n.el.setAttribute('y', bob(i, baseUsers[i], 0.4, 1.0)));
  subjects.forEach((n, i) => n.el.setAttribute('y', bob(i, baseSubjects[i], 0.4, 0.9)));
  symbols.forEach((n, i) => {
    const y = bob(i, symbols[i].y, 0.4, 1.1);
    n.groupEl.setAttribute('transform', `translate(${n.x},${y})`);
  });

  requestAnimationFrame(tick);
}
tick();
