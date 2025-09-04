/* ======== Publications: Particle-Built Text Morph (3D) ======== */
(function(){
  const host = document.getElementById('pub-hero-particles');
  if(!host) return;

  // ---- config (tweak freely) ----
  const WORDS = (window.__pubParticleWords && window.__pubParticleWords.length)
    ? window.__pubParticleWords
    : ["Math", "Economy","Animals","Cancer","Social","Medicine","Eng."];

  const MAX_PARTICLES_DESKTOP = 6000;
  const MAX_PARTICLES_MOBILE  = 4000;
  const PARTICLE_SIZE = 0.15;     // world units
  const DEPTH_JITTER = 1.0;       // ±Z variance added on each morph
  const MORPH_TIME   = 1400;      // ms base morph duration
  const STAGGER_MS   = 600;       // ms random per-particle delay span
  const FLOAT_AMPL   = 0.25;      // idle sinus wobble amplitude
  const FLOAT_SPEED  = 0.7;       // idle wobble speed factor
  const BG_ROT_SPEED = 0.12;      // slow background rotation

  // ---- three.js bootstrapping ----
  const canvas = document.getElementById('pubParticleCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.z = 28;

  // gentle fog for depth perception (works with alpha=0 material)
  scene.fog = new THREE.FogExp2(new THREE.Color(0x0f172a), 0.03);

  // geometry + material
  const isMobile = Math.min(innerWidth, innerHeight) < 700;
  const COUNT = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const startPositions = new Float32Array(COUNT * 3); // for per-morph lerp start
  const targetPositions = new Float32Array(COUNT * 3);
  const delays = new Float32Array(COUNT);   // per-particle delay (ms)
  const durations = new Float32Array(COUNT); // per-particle duration (ms)
  const idleSeeds = new Float32Array(COUNT); // for idle wobble phase

  // seed initial sphere-ish distribution
  for (let i=0;i<COUNT;i++){
    const r = 12 * (0.55 + Math.random()*0.45);
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2*v - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i*3+0] = startPositions[i*3+0] = x;
    positions[i*3+1] = startPositions[i*3+1] = y;
    positions[i*3+2] = startPositions[i*3+2] = z;

    targetPositions[i*3+0] = x;
    targetPositions[i*3+1] = y;
    targetPositions[i*3+2] = z;

    delays[i] = Math.random() * STAGGER_MS;
    durations[i] = MORPH_TIME * (0.85 + Math.random()*0.3);
    idleSeeds[i] = Math.random() * 1000.0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // ---- offscreen canvas to rasterize words and sample points ----
  const textCanvas = document.createElement('canvas');
  const tctx = textCanvas.getContext('2d');

  function sampleWordPoints(text, bboxW, bboxH, density = 1.0){
    // Render very large, then sample opaque pixels
    const SCALE = 4; // supersample to get smooth edges
    const pad = 30 * SCALE;

    textCanvas.width  = Math.max(2, Math.floor(bboxW * SCALE));
    textCanvas.height = Math.max(2, Math.floor(bboxH * SCALE));

    // choose font size that fits height nicely
    const baseFontPx = Math.floor((bboxH * 0.7) * SCALE);
    const font = `600 ${baseFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    tctx.clearRect(0,0,textCanvas.width,textCanvas.height);
    tctx.fillStyle = '#000';
    tctx.font = font;
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';

    // shrink font if too wide
    let metrics = tctx.measureText(text);
    let width = metrics.width;
    let fs = baseFontPx;
    const maxW = bboxW * SCALE - pad*2;
    if (width > maxW) {
      const ratio = maxW / width;
      fs = Math.max(20, Math.floor(baseFontPx * ratio));
      tctx.font = `600 ${fs}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
      metrics = tctx.measureText(text);
      width = metrics.width;
    }

    tctx.fillText(text, textCanvas.width/2, textCanvas.height/2);

    const img = tctx.getImageData(0,0,textCanvas.width,textCanvas.height).data;

    // stride controls how dense points are sampled from text bitmap
    const targetCount = COUNT;
    let stride = Math.max(1, Math.floor((textCanvas.width * textCanvas.height) / (targetCount * 2.2)));
    // keep it square-ish
    stride = Math.floor(Math.sqrt(stride));

    const pts = [];
    for (let y=0; y<textCanvas.height; y+=stride){
      for (let x=0; x<textCanvas.width; x+=stride){
        const idx = (y * textCanvas.width + x) * 4;
        const alpha = img[idx+3];
        if (alpha > 100) {
          // map from canvas space to world-ish box [-W/2..W/2], [+H/2..-H/2]
          const nx = (x / textCanvas.width) - 0.5;
          const ny = (y / textCanvas.height) - 0.5;
          const worldX = nx * bboxW * 0.9;  // 90% of width
          const worldY = -ny * bboxH * 0.9; // invert Y
          pts.push([worldX, worldY]);
        }
      }
    }
    return pts;
  }

  // ---- morph engine ----
  let loopIdx = 0;
  let morphStart = 0; // ms timestamp when morph began
  let morphing = false;

  function setTargetsFromWord(word){
    const w = host.clientWidth  || 800;
    const h = host.clientHeight || 500;

    // compute target XYs from text
    const pts = sampleWordPoints(word, 20, 10); // world-space bbox (arbitrary but works with camera Z)

    // if not enough points, repeat; if too many, skip some
    for (let i=0;i<COUNT;i++){
      const p = pts[i % pts.length];
      const jitterZ = (Math.random()*2 - 1) * DEPTH_JITTER;
      targetPositions[i*3+0] = p[0];
      targetPositions[i*3+1] = p[1];
      targetPositions[i*3+2] = jitterZ;
      // refresh per-particle timing for variety each morph
      delays[i] = Math.random() * STAGGER_MS;
      durations[i] = MORPH_TIME * (0.85 + Math.random()*0.3);
      // capture current as start
      startPositions[i*3+0] = positions[i*3+0];
      startPositions[i*3+1] = positions[i*3+1];
      startPositions[i*3+2] = positions[i*3+2];
    }

    morphStart = performance.now();
    morphing = true;
  }

  function easeInOutCubic(t){
    return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  }

  function animate(){
    const now = performance.now();
    const tGlobal = (now - morphStart);

    // particle updates
    const pos = geometry.attributes.position.array;
    for (let i=0;i<COUNT;i++){
      const i3 = i*3;

      let x = positions[i3+0];
      let y = positions[i3+1];
      let z = positions[i3+2];

      if (morphing){
        const local = Math.max(0, Math.min(1, (tGlobal - delays[i]) / Math.max(1, durations[i])));
        const k = easeInOutCubic(local);

        x = startPositions[i3+0] + (targetPositions[i3+0] - startPositions[i3+0]) * k;
        y = startPositions[i3+1] + (targetPositions[i3+1] - startPositions[i3+1]) * k;
        z = startPositions[i3+2] + (targetPositions[i3+2] - startPositions[i3+2]) * k;

        // when all done (approx), stop morphing
        if (i===COUNT-1 && tGlobal > STAGGER_MS + MORPH_TIME + 40) {
          morphing = false;
        }
      }

      // subtle idle float (also active during morph for organic feel)
      const wobble = (now * 0.001 * FLOAT_SPEED) + idleSeeds[i];
      x += Math.sin(wobble) * FLOAT_AMPL * 0.6;
      y += Math.cos(wobble*1.1) * FLOAT_AMPL * 0.6;
      z += Math.sin(wobble*0.7) * FLOAT_AMPL * 0.35;

      pos[i3+0] = positions[i3+0] = x;
      pos[i3+1] = positions[i3+1] = y;
      pos[i3+2] = positions[i3+2] = z;
    }

    // slow scene rotation for depth
    points.rotation.y += BG_ROT_SPEED * 0.0015;
    points.rotation.x = Math.sin(now * 0.00012) * 0.08;

    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // ---- hero sizing / camera ----
  function resize(){
    const w = host.clientWidth  || 800;
    const h = host.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ---- loop driver ----
  function beginLoop(){
    // start on first word, then cycle
    setTargetsFromWord(WORDS[0]);

    let idx = 1;
    function scheduleNext(){
      // hold time after morph settles
      const hold = 2500;
      const nextAt = MORPH_TIME + STAGGER_MS + hold;
      setTimeout(() => {
        setTargetsFromWord(WORDS[idx % WORDS.length]);
        idx++;
        scheduleNext();
      }, nextAt);
    }
    scheduleNext();
  }

  // ---- bootstrap ----
  function start(){
    resize();
    animate();
    beginLoop();
    addEventListener('resize', resize, { passive:true });

    // re-fit text targets on resize after a tiny debounce
    let rto;
    addEventListener('resize', () => {
      clearTimeout(rto);
      rto = setTimeout(() => {
        // remap current word to new bounds without jumping:
        const currentWord = WORDS[(loopIdx)%WORDS.length] || WORDS[0];
        // do not snap; set new targets from same word so particles glide
        setTargetsFromWord(currentWord);
      }, 120);
    }, { passive:true });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
