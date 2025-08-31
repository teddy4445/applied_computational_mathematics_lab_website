// js/hero-sphere.js
import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

const container = document.getElementById('acm-sphere');
if (!container) throw new Error('acm-sphere container not found');

const tooltip = document.getElementById('eq-tooltip');

// Tailwind palette (keep in sync with your theme)
const COLORS = {
  primary: 0x2563eb,
  secondary: 0xf43f5e,
  teal: 0x14b8a6,
  amber: 0xf59e0b,
  violet: 0x8b5cf6
};

// ------------------------------------------------------------------
// Scene + Camera + Renderer
// ------------------------------------------------------------------
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 3.2);

function resizeRenderer() {
  const { width, height } = container.getBoundingClientRect();
  const w = Math.max(1, Math.floor(width || container.clientWidth || 600));
  const h = Math.max(1, Math.floor(height || container.clientHeight || 600));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

// ------------------------------------------------------------------
// Base group and lights
// ------------------------------------------------------------------
const group = new THREE.Group();
scene.add(group);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const keyLight = new THREE.PointLight(0xffffff, 0.8);
keyLight.position.set(2, 2, 3);
scene.add(keyLight);
const rimLight = new THREE.PointLight(COLORS.secondary, 0.3);
rimLight.position.set(-2, -1.5, -2.5);
scene.add(rimLight);

// Wire sphere
const wire = new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 32, 32));
const wireMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.25 });
group.add(new THREE.LineSegments(wire, wireMat));

// ------------------------------------------------------------------
// Dots + equations
// ------------------------------------------------------------------
const equations = [
  '∇·u = 0',
  '∂u/∂t + (u·∇)u = -∇p/ρ + ν∇²u',
  'E = mc²',
  'iħ ∂ψ/∂t = Ĥψ',
  'P(A|B) = P(B|A)P(A)/P(B)',
  '∂T/∂t = α∇²T',
  '∂²φ/∂t² = c²∇²φ',
  'dx/dt = αx − βxy',
  'SIR: dS/dt=−βSI/N; dI/dt=βSI/N−γI; dR/dt=γI',
  'v = Vmax[S]/(Km + [S])',
  'F(ω) = ∫ f(t)e^{-iωt} dt',
  'Dₖₗ(P||Q) = Σ P log(P/Q)',
  'θₜ₊₁ = θₜ − η∇L(θₜ)',
  'σ(zᵢ)=e^{zᵢ}/Σⱼ e^{zⱼ}',
  '∇×E = −∂B/∂t',
  '∇×B = μ₀J + μ₀ε₀ ∂E/∂t'
];

const markerGeom = new THREE.SphereGeometry(0.02, 16, 16);
const markerColors = [COLORS.primary, COLORS.secondary, COLORS.teal, COLORS.amber, COLORS.violet];

const markers = [];
const samples = fibonacciSphere(140);
samples.forEach((pos, i) => {
  const color = markerColors[i % markerColors.length];
  const mat = new THREE.MeshStandardMaterial({
    color, metalness: 0.2, roughness: 0.3, emissive: color, emissiveIntensity: 0.35
  });
  const m = new THREE.Mesh(markerGeom, mat);
  m.position.copy(pos.clone().multiplyScalar(1.01));
  m.userData.eq = equations[Math.floor(Math.random() * equations.length)];
  m.userData.kind = 'dot';
  markers.push(m);
  group.add(m);
});

// faint motion trails (as before)
const trailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
const trailGroup = new THREE.Group();
group.add(trailGroup);
markers.forEach((m, idx) => {
  const p0 = m.position.clone();
  const tangent = new THREE.Vector3().crossVectors(p0, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(0.15);
  const p1 = p0.clone().add(tangent);
  const curve = new THREE.QuadraticBezierCurve3(p0, p1, p0.clone().addScaledVector(tangent, 0.4));
  const pts = curve.getPoints(16);
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  trailGroup.add(new THREE.Line(g, trailMat));
  if (idx > 110) return;
});

// ------------------------------------------------------------------
// SYMBOL NODES (replace 5–15 dots with sprites)
// ------------------------------------------------------------------

// Symbols to draw on the sphere
const SYMBOLS = ['🧬','⚙️','→','⇌','Σ','π','μ','∞','Φ','Δ','★','⚛️','📈','🌡️','🧪'];

// Each symbol’s tooltip text = an equation
const symbolLabels = {
  '🧬': 'v = Vmax[S] / (Km + [S])',                         // Michaelis–Menten
  '⚙️': 'ẋ = f(x, u, t)',                                   // state-space dynamics
  '→' : 'v = dr/dt',                                        // velocity
  '⇌': 'd[A]/dt = -k₁[A] + k₂[B]',                          // reversible reaction
  'Σ' : 'μ = (1/n) Σᵢ xᵢ',                                  // mean
  'π' : 'C = 2πr',                                          // circumference
  'μ' : 'σ² = (1/n) Σᵢ (xᵢ − μ)²',                          // variance
  '∞' : 'limₙ→∞ (1 + 1/n)ⁿ = e',                            // classic limit
  'Φ' : '∇²Φ = 0',                                          // Laplace’s equation
  'Δ' : 'Δu = ∇·∇u',                                        // Laplacian
  '★' : 'L(θ) = −Σᵢ log p(yᵢ|xᵢ,θ)',                        // log-likelihood
  '⚛️': 'Eₙ = −13.6 eV / n²',                               // Bohr model
  '📈': 'dN/dt = rN (1 − N/K)',                             // logistic growth
  '🌡️': '∂T/∂t = α ∇²T',                                    // heat equation
  '🧪': 'rate = k [A]^m [B]^n'                              // rate law
};

// choose 5–15 unique indices
const symbolCount = Math.floor(THREE.MathUtils.clamp(Math.round(markers.length * 0.12), 5, 15));
const chosenIdx = pickUniqueIndices(markers.length, symbolCount);

const symbolSprites = []; // keep refs for auto spotlight

chosenIdx.forEach((idx, i) => {
  const marker = markers[idx];
  const sym = SYMBOLS[i % SYMBOLS.length];
  const sprite = makeTextSprite(sym, 64, '28px sans-serif'); // emoji/simple symbols
  sprite.position.copy(marker.position.clone().multiplyScalar(1.05));
  sprite.userData.eq = symbolLabels[sym] || sym;
  sprite.userData.kind = 'symbol';
  sprite.userData.emoji = sym;

  // hide original dot and store back-reference
  marker.visible = false;
  sprite.userData.dot = marker;

  group.add(sprite);
  symbolSprites.push(sprite);
});

// ------------------------------------------------------------------
// Stronger connection lines BETWEEN symbol nodes (more visible)
// ------------------------------------------------------------------
const connectionMat = new THREE.LineBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0.35 // more visible than trails
});

// Strategy: connect each symbol to its 2 nearest other symbols
const connPositions = [];
symbolSprites.forEach((a, i) => {
  // compute distances to others
  const others = symbolSprites
    .map((b, j) => ({ b, j, d: a.position.distanceTo(b.position) }))
    .filter(x => x.j !== i)
    .sort((u, v) => u.d - v.d)
    .slice(0, 2);
  others.forEach(({ b }) => {
    connPositions.push(a.position.x, a.position.y, a.position.z);
    connPositions.push(b.position.x, b.position.y, b.position.z);
  });
});
const connGeom = new THREE.BufferGeometry();
connGeom.setAttribute('position', new THREE.Float32BufferAttribute(connPositions, 3));
const connectionLines = new THREE.LineSegments(connGeom, connectionMat);
group.add(connectionLines);

// ------------------------------------------------------------------
// Interaction + Tooltip (hover + auto spotlight)
// ------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-2, -2);
let hovering = false;
let lastUserHoverAt = 0;
let autoTarget = null;

container.addEventListener('pointermove', (e) => {
  const r = container.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
});

container.addEventListener('pointerleave', () => {
  hovering = false;
  hideTooltip();
});

function setCursor(isHovering) {
  if (hovering === isHovering) return;
  hovering = isHovering;
  renderer.domElement.style.cursor = isHovering ? 'pointer' : 'default';
}

function showTooltipFor(object3D) {
  const { width, height } = container.getBoundingClientRect();
  const v = object3D.getWorldPosition(new THREE.Vector3()).project(camera);
  const x = (v.x * 0.5 + 0.5) * width;
  const y = (-v.y * 0.5 + 0.5) * height;
  tooltip.textContent = object3D.userData.eq || '';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.remove('opacity-0');
}

function hideTooltip() {
  tooltip.classList.add('opacity-0');
}

// AUTO spotlight every 3s on a random symbol (unless user is actively hovering)
setInterval(() => {
  // if no symbols, bail
  if (!symbolSprites.length) return;
  // give user hover 1.5s priority window
  const now = performance.now();
  if (now - lastUserHoverAt < 1500) return;

  autoTarget = symbolSprites[Math.floor(Math.random() * symbolSprites.length)];
  showTooltipFor(autoTarget);
}, 3000);

// ------------------------------------------------------------------
// Animate
// ------------------------------------------------------------------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) container.setAttribute('data-reduced-motion', 'true');

let t = 0;
function animate() {
  const rotSpeed = prefersReducedMotion ? 0.0006 : 0.0032;
  t += 0.005;
  group.rotation.y += rotSpeed;
  group.rotation.x = Math.sin(t) * (prefersReducedMotion ? 0.02 : 0.07);

  // Hover picking over both dots and symbols
  raycaster.setFromCamera(mouse, camera);
  const pickables = [...markers.filter(m => m.visible), ...symbolSprites];
  const hit = raycaster.intersectObjects(pickables, false);

  if (hit.length) {
    const obj = hit[0].object;
    showTooltipFor(obj);
    setCursor(true);
    lastUserHoverAt = performance.now();
  } else {
    setCursor(false);
    // if an autoTarget exists and user isn't hovering, keep it visible
    if (autoTarget) {
      showTooltipFor(autoTarget);
    } else {
      hideTooltip();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------
function fibonacciSphere(n) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

function pickUniqueIndices(max, count) {
  const set = new Set();
  while (set.size < count) set.add(Math.floor(Math.random() * max));
  return [...set];
}

function makeTextSprite(text, size = 64, font = '24px sans-serif') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // clean background
  ctx.clearRect(0, 0, size, size);

  // outline circle glow (soft)
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // text
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  const scale = 0.14; // visual size vs sphere
  sprite.scale.set(scale, scale, 1);
  return sprite;
}
