/* ==========================================================================
   Projects page — 3D Particle Text Morph + BACKGROUND EQUATIONS (fixed init order)
   ========================================================================== */
(function () {
  // Only run on the Projects page (supports /projects and /projects.html)
  const path = location.pathname.toLowerCase();
  if (!(path.endsWith('/projects') || path.includes('projects.html') || path.endsWith('/projects/'))) return;

  // Find the hero's right column robustly
  function getHeroRight() {
    let el = document.querySelector('main section .grid .relative');
    if (el) return el;
    const heroSection = document.querySelector('main section');
    const grid = heroSection?.querySelector('.grid');
    const kids = grid ? Array.from(grid.children) : [];
    el = kids.find(n => n.classList.contains('relative'));
    return el || heroSection?.querySelector('.relative') || null;
  }
  const rightHero = getHeroRight();
  if (!rightHero) return;

  // Overlay container
  const overlay = document.createElement('div');
  overlay.id = 'projects-3d-morph';
  Object.assign(overlay.style, { position: 'absolute', inset: '0', zIndex: '50', pointerEvents: 'none' });
  rightHero.style.position = 'relative';
  rightHero.appendChild(overlay);

  // Load THREE (fallback CDN)
  function loadThree() {
    return new Promise((resolve, reject) => {
      if (window.THREE) return resolve(window.THREE);
      const inject = (src) => new Promise((ok, bad) => {
        const s = document.createElement('script');
        s.src = src; s.crossOrigin = 'anonymous';
        s.onload = ok; s.onerror = () => bad(new Error('Failed ' + src));
        document.head.appendChild(s);
      });
      inject('https://unpkg.com/three@0.158.0/build/three.min.js')
        .catch(() => inject('https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js'))
        .then(() => window.THREE ? resolve(window.THREE) : reject(new Error('THREE not available')))
        .catch(reject);
    });
  }

  // Project words + equations
  function collectProjectWords() {
    const words = [
      'Machine Learning',
      'Symbolic Regression',
      'System Design',
      'Cancer Treatment',
      'Fluid Dynamics',
      'Knowledge Rep.',
      'Biological Modelling',
      'Informal Economy'
    ];
    return words;
  }
  const equations = [
    '∇·u = 0', '∂u/∂t + (u·∇)u',
    'E = mc²', 'argminₓ ‖Ax−b‖²',
    '∇²φ = 0', 'π ≈ 3.14159',
    'Σ (i=1..n)', '𝔽{∂f/∂t}'
  ];

  loadThree().then((THREE) => {
    /* -----------------------------
       Scene / camera / renderer
       ----------------------------- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(0, 0, 520);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' });
    overlay.appendChild(renderer.domElement);

    // ===== Define BG + bounds + helpers FIRST (so onResize can use them) =====
    const sizeVec = new THREE.Vector2();

    // Background equation layer config
    const BG = {
      z: -300,
      count: 14,
      basePx: 30,     // approximate on-screen text height in CSS px
      speedMin: 40,
      speedMax: 80,
      opacity: 0.33
    };

    // Convert CSS px to world units at a given depth
    function pxToWorld(px, z) {
      renderer.getSize(sizeVec);
      const d = Math.abs(camera.position.z - z);
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const worldH = 2 * Math.tan(vFov / 2) * d;
      return px * (worldH / sizeVec.y);
    }

    // World bounds at BG.z (half-sizes)
    const eqBounds = { halfW: 1, halfH: 1 };
    function updateEqBounds() {
      renderer.getSize(sizeVec);
      const d = Math.abs(camera.position.z - BG.z);
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const worldH = 2 * Math.tan(vFov / 2) * d;
      const worldW = worldH * camera.aspect;
      eqBounds.halfW = (worldW * 0.95) / 2;
      eqBounds.halfH = (worldH * 0.95) / 2;
    }

    // Background equation sprites group (behind points)
    const equationsGroup = new THREE.Group();
    equationsGroup.renderOrder = 0;
    scene.add(equationsGroup);

    function rescaleEquationSprites() {
      equationsGroup.children.forEach(spr => {
        const worldH = pxToWorld(spr.userData.cssH, BG.z);
        spr.scale.set(worldH * spr.userData.aspect, worldH, 1);
      });
    }

    function makeEquationSprite(text) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fontPx = BG.basePx;
      const cnv = document.createElement('canvas');
      const ctx = cnv.getContext('2d');

      cnv.width = Math.ceil(fontPx * dpr * 6);
      cnv.height = Math.ceil(fontPx * dpr * 2);
      ctx.scale(dpr, dpr);

      const grad = ctx.createLinearGradient(0, 0, cnv.width / dpr, cnv.height / dpr);
      grad.addColorStop(0, '#2563eb'); grad.addColorStop(1, '#f43f5e');
      ctx.fillStyle = grad;
      ctx.font = `700 ${fontPx}px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10;
      ctx.clearRect(0, 0, cnv.width / dpr, cnv.height / dpr);
      ctx.fillText(text, (cnv.width / dpr) / 2, (cnv.height / dpr) / 2);

      const tex = new THREE.CanvasTexture(cnv);
      tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;

      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: BG.opacity,
        depthWrite: false, depthTest: false
      });

      const spr = new THREE.Sprite(mat);
      spr.position.z = BG.z;

      const worldH = pxToWorld(fontPx, BG.z);
      const aspect = (cnv.width / dpr) / (cnv.height / dpr);
      spr.scale.set(worldH * aspect, worldH, 1);

      spr.position.x = (Math.random() * 2 - 1) * eqBounds.halfW;
      spr.position.y = (Math.random() * 2 - 1) * eqBounds.halfH;

      const speed = BG.speedMin + Math.random() * (BG.speedMax - BG.speedMin);
      const dir = Math.random() * Math.PI * 2;
      spr.userData = { vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, cssH: fontPx, aspect };
      return spr;
    }

    function spawnEquationSprites() {
      equationsGroup.clear();
      for (let i = 0; i < BG.count; i++) {
        equationsGroup.add(makeEquationSprite(equations[(Math.random() * equations.length) | 0]));
      }
    }

    // ===== Now onResize can safely use BG + bounds + rescale =====
    function onResize() {
      const rect = rightHero.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateEqBounds();
      rescaleEquationSprites();
    }
    addEventListener('resize', onResize, { passive: true });
    onResize();              // <- BG is already defined
    updateEqBounds();
    spawnEquationSprites();

    /* ---------------------------
       FRONT: particle text morph
       --------------------------- */
    const MAX_POINTS = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_POINTS * 3);
    const colors = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const primary = new THREE.Color('#2563eb');
    const pointsMat = new THREE.PointsMaterial({
      size: 1.6, vertexColors: true, transparent: true, opacity: 0.95, depthTest: false
    });
    const points = new THREE.Points(geometry, pointsMat);
    points.renderOrder = 2;
    scene.add(points);

    for (let i = 0; i < MAX_POINTS; i++) {
      positions[3*i+0] = 0; positions[3*i+1] = 0; positions[3*i+2] = 0;
      const hueJitter = 0.03 * (Math.random() - 0.5);
      const c = primary.clone().offsetHSL(hueJitter, 0, 0);
      colors[3*i+0] = c.r; colors[3*i+1] = c.g; colors[3*i+2] = c.b;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    // Offscreen sampler
    const sampleCanvas = document.createElement('canvas');
    const sctx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    function buildTargetsFromText(text, sizePx = 170, step = 4) {
      const pad = 40;
      sctx.font = `bold ${sizePx}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      const metrics = sctx.measureText(text);
      const textW = Math.ceil(metrics.width);
      const textH = Math.ceil(sizePx * 1.2);

      sampleCanvas.width = textW + pad * 2;
      sampleCanvas.height = textH + pad * 2;

      sctx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
      sctx.fillStyle = '#000';
      sctx.textBaseline = 'middle';
      sctx.textAlign = 'center';
      sctx.font = `bold ${sizePx}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      sctx.fillText(text, sampleCanvas.width / 2, sampleCanvas.height / 2);

      const img = sctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      const pts = [];
      for (let y = 0; y < sampleCanvas.height; y += step) {
        for (let x = 0; x < sampleCanvas.width; x += step) {
          const aIdx = (y * sampleCanvas.width + x) * 4 + 3;
          if (img[aIdx] > 50) {
            const cx = x - sampleCanvas.width / 2;
            const cy = -(y - sampleCanvas.height / 2); // flip Y only
            const scale = 0.25;
            pts.push(new THREE.Vector3(cx * scale, cy * scale, (Math.random() - 0.5) * 3));
          }
        }
      }
      if (pts.length < 300) return buildTargetsFromText(text, sizePx, Math.max(2, step - 1));
      return pts;
    }

    const sequence = collectProjectWords();
    let fromPositions = new Float32Array(MAX_POINTS * 3);
    let toPositions = new Float32Array(MAX_POINTS * 3);
    let startTime = performance.now();
    let morphDuration = 3000;
    let holdDuration = 2200;
    let phase = 'morph';
    let seqIndex = 0;

    function setTargetsFor(text) {
      fromPositions.set(positions);
      const pts = buildTargetsFromText(text);
      for (let i = 0; i < MAX_POINTS; i++) {
        const p = pts[i % pts.length];
        toPositions[3*i+0] = p.x;
        toPositions[3*i+1] = p.y;
        toPositions[3*i+2] = p.z;
      }
      startTime = performance.now();
      phase = 'morph';
    }
    setTargetsFor(sequence[seqIndex % sequence.length]);

    const easeInOutQuad = (t) => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;

    // Main loop
    function animate(now) {
      requestAnimationFrame(animate);

      const elapsed = now - startTime;
      if (phase === 'morph') {
        const t = Math.min(1, elapsed / morphDuration);
        const e = easeInOutQuad(t);
        for (let i = 0; i < MAX_POINTS; i++) {
          const i3 = 3 * i;
          positions[i3+0] = fromPositions[i3+0] + (toPositions[i3+0] - fromPositions[i3+0]) * e;
          positions[i3+1] = fromPositions[i3+1] + (toPositions[i3+1] - fromPositions[i3+1]) * e;
          positions[i3+2] = fromPositions[i3+2] + (toPositions[i3+2] - fromPositions[i3+2]) * e;
        }
        geometry.attributes.position.needsUpdate = true;
        if (t >= 1) { phase = 'hold'; startTime = performance.now(); }
      } else if (elapsed >= holdDuration) {
        seqIndex = (seqIndex + 1) % sequence.length;
        setTargetsFor(sequence[seqIndex]);
      }

      // Background equations: integrate + bounce
      const dt = 1 / 60;
      for (let i = equationsGroup.children.length - 1; i >= 0; i--) {
        const spr = equationsGroup.children[i];
        spr.position.x += spr.userData.vx * dt;
        spr.position.y += spr.userData.vy * dt;

        if (spr.position.x > eqBounds.halfW) { spr.position.x = eqBounds.halfW; spr.userData.vx *= -1; }
        else if (spr.position.x < -eqBounds.halfW) { spr.position.x = -eqBounds.halfW; spr.userData.vx *= -1; }

        if (spr.position.y > eqBounds.halfH) { spr.position.y = eqBounds.halfH; spr.userData.vy *= -1; }
        else if (spr.position.y < -eqBounds.halfH) { spr.position.y = -eqBounds.halfH; spr.userData.vy *= -1; }

        spr.rotation.z += 0.0012;
      }

      renderer.render(scene, camera);
    }

    document.addEventListener('visibilitychange', () => { startTime = performance.now(); });
    requestAnimationFrame(animate);
  }).catch((e) => {
    console.warn('[ACM] Projects morph failed to initialize:', e);
  });
})();
