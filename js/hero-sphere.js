// js/hero-sphere.js
import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

const container = document.getElementById('acm-sphere');
if (!container) throw new Error('acm-sphere container not found');

const tooltip = document.getElementById('eq-tooltip');

// Tailwind palette (keep in sync with tailwind.config values)
const COLORS = {
  primary: 0x2563eb,     // blue-600
  secondary: 0xf43f5e,   // rose-500
  teal: 0x14b8a6,        // teal-500
  amber: 0xf59e0b,       // amber-500
  violet: 0x8b5cf6       // violet-500
};

// ------------------------------------------------------------------
// Scene setup
// ------------------------------------------------------------------
// --- scene, renderer ---
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0); // transparent
container.appendChild(renderer.domElement);

// --- camera BEFORE the first resize ---
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 3.2);

// --- correct, container-based resize ---
function resizeRenderer() {
  // Use the container’s box, not the window
  const { width, height } = container.getBoundingClientRect();
  // Fallbacks for first layout pass
  const w = Math.max(1, Math.floor(width || container.clientWidth || 600));
  const h = Math.max(1, Math.floor(height || container.clientHeight || 600));

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Make sure canvas fills the container exactly
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

const group = new THREE.Group();
scene.add(group);

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const keyLight = new THREE.PointLight(0xffffff, 0.8);
keyLight.position.set(2, 2, 3);
scene.add(keyLight);
const rimLight = new THREE.PointLight(COLORS.secondary, 0.3);
rimLight.position.set(-2, -1.5, -2.5);
scene.add(rimLight);

// subtle wire sphere
const wire = new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 32, 32));
const wireMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.25 });
const wireMesh = new THREE.LineSegments(wire, wireMat);
group.add(wireMesh);

// ------------------------------------------------------------------
// Markers on a sphere + equations
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
  'dS/dt=−βSI/N; dI/dt=βSI/N−γI; dR/dt=γI',
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
    color,
    metalness: 0.2,
    roughness: 0.3,
    emissive: color,
    emissiveIntensity: 0.35
  });
  const m = new THREE.Mesh(markerGeom, mat);
  m.position.copy(pos.clone().multiplyScalar(1.01)); // just above wire surface
  m.userData.eq = equations[Math.floor(Math.random() * equations.length)];
  markers.push(m);
  group.add(m);
});

// gentle motion trails lines (optional, tiny arcs from points toward tangent)
const trailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
const trailGroup = new THREE.Group();
group.add(trailGroup);
markers.forEach((m, idx) => {
  // short arc in local tangent plane (stylized "motion scheme")
  const p0 = m.position.clone();
  const tangent = new THREE.Vector3().crossVectors(p0, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(0.15);
  const p1 = p0.clone().add(tangent);
  const curve = new THREE.QuadraticBezierCurve3(p0, p1, p0.clone().addScaledVector(tangent, 0.4));
  const pts = curve.getPoints(16);
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  trailGroup.add(new THREE.Line(g, trailMat));
  if (idx > 110) return; // keep it light
});

// ------------------------------------------------------------------
// Interaction (hover tooltip)
// ------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-2, -2); // off-screen by default

container.addEventListener('pointermove', (e) => {
  const r = container.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
});

container.addEventListener('pointerleave', () => hideTooltip());

function showTooltip(obj) {
  const { width, height } = container.getBoundingClientRect();
  const v = obj.getWorldPosition(new THREE.Vector3()).project(camera);
  const x = (v.x * 0.5 + 0.5) * width;
  const y = (-v.y * 0.5 + 0.5) * height;

  tooltip.textContent = obj.userData.eq;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.remove('opacity-0');
}

function hideTooltip() {
  tooltip.classList.add('opacity-0');
}

// ------------------------------------------------------------------
// Animation
// ------------------------------------------------------------------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) container.setAttribute('data-reduced-motion', 'true');

let t = 0;
function animate() {
  const rotSpeed = prefersReducedMotion ? 0.0006 : 0.0032;
  t += 0.005;
  group.rotation.y += rotSpeed;
  group.rotation.x = Math.sin(t) * (prefersReducedMotion ? 0.02 : 0.07);

  // hover detection
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(markers, false);
  if (hit.length) showTooltip(hit[0].object); else hideTooltip();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ------------------------------------------------------------------
// Utils & resize
// ------------------------------------------------------------------
function fibonacciSphere(n) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

// Change cursor when hittable
let hovering = false;

function setCursor(isHovering) {
  if (hovering === isHovering) return;
  hovering = isHovering;
  renderer.domElement.style.cursor = isHovering ? 'pointer' : 'default';
}

// In animate(), after raycaster.intersectObjects:
const hit = raycaster.intersectObjects(markers, false);
if (hit.length) {
  showTooltip(hit[0].object);
  setCursor(true);
} else {
  hideTooltip();
  setCursor(false);
}

