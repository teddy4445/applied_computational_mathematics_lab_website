(async function bootCoursesPage() {
  const heroStats = document.getElementById('courses-hero-stats');
  const grid = document.getElementById('courses-grid');
  const scene = document.getElementById('course-path-scene');
  if (!heroStats || !grid || !scene) return;

  initPath();

  let data;
  try {
    const response = await fetch('data/courses.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.error('Failed to load courses data:', error);
    grid.innerHTML = '<div class="tools-grid-empty">Unable to load the courses right now.</div>';
    return;
  }

  heroStats.innerHTML = (data.hero?.stats || [])
    .map((stat) => `
          <div class="text-center">
            <div class="text-3xl font-bold text-primary">${stat.value}</div>
            <div class="text-sm text-gray-600">${stat.label}</div>
          </div>`)
    .join('');

  grid.innerHTML = (data.courses || [])
    .map((c) => `
          <article class="course-card bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col">
            <figure class="course-card-art">
              <img src="${c.image}" alt="${c.imageAlt || ''}" width="800" height="340" loading="lazy" decoding="async">
            </figure>
            <div class="course-card-body flex-1 flex flex-col">
              <h3 class="text-2xl font-semibold text-gray-900 mb-4"><a href="${c.primaryHref}" class="course-card-title">${c.title}</a></h3>
              ${(c.paragraphs || []).map((t) => `<p class="text-gray-600 leading-relaxed mb-4">${t}</p>`).join('')}
              <div class="mt-auto pt-2">
                <a href="${c.primaryHref}" class="course-card-btn bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition font-medium">${c.primaryLabel}</a>
              </div>
            </div>
          </article>`)
    .join('');

  // The hero animation: a learner travels a winding learning path; each milestone (watch, read, try, play, book)
  // lights up as it passes, and the graduation cap at the end celebrates before the next learner sets off.
  function initPath() {
    const svg = scene.querySelector('svg');
    const road = scene.querySelector('#course-path-road');
    const glow = scene.querySelector('#course-path-done');
    const learner = scene.querySelector('.course-learner');
    const stops = [...scene.querySelectorAll('.course-stop')];
    const sparks = scene.querySelector('.course-sparks');
    if (!svg || !road || !learner || !stops.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = road.getTotalLength();
    const at = stops.map((s) => parseFloat(s.dataset.at));
    let active = true, t0 = performance.now(), last = t0, lastCycle = -1;
    const DURATION = 9000, HOLD = 1600;

    function place() {
      const box = svg.viewBox.baseVal, w = scene.clientWidth, h = scene.clientHeight;
      const k = Math.min(w / box.width, h / box.height), ox = (w - box.width * k) / 2, oy = (h - box.height * k) / 2;
      stops.forEach((s, i) => {
        const p = road.getPointAtLength(total * at[i]);
        s.style.left = `${ox + p.x * k}px`; s.style.top = `${oy + p.y * k}px`;
      });
      return { k, ox, oy };
    }
    let geo = place();
    window.addEventListener('resize', () => { geo = place(); });

    if (reduced) {
      stops.forEach((s) => s.classList.add('is-done'));
      glow.style.strokeDasharray = `${total} ${total}`; glow.style.strokeDashoffset = '0';
      const p = road.getPointAtLength(total);
      learner.style.transform = `translate(${geo.ox + p.x * geo.k}px, ${geo.oy + p.y * geo.k}px)`;
      scene.dataset.motion = 'paused';
      return;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { active = e[0]?.isIntersecting ?? true; scene.dataset.motion = active ? 'active' : 'paused'; }, { threshold: 0.15 }).observe(scene);
    }
    glow.style.strokeDasharray = `${total} ${total}`;
    const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

    function burst() {
      if (!sparks) return;
      const cap = stops[stops.length - 1];
      for (let i = 0; i < 14; i += 1) {
        const d = document.createElement('span');
        const a = (Math.PI * 2 * i) / 14, r = 46 + Math.random() * 26;
        d.className = 'course-spark';
        d.style.left = cap.style.left; d.style.top = cap.style.top;
        d.style.setProperty('--dx', `${Math.cos(a) * r}px`); d.style.setProperty('--dy', `${Math.sin(a) * r}px`);
        d.style.background = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'][i % 5];
        sparks.appendChild(d);
        setTimeout(() => d.remove(), 1200);
      }
    }

    function frame(now) {
      if (!active) t0 += now - last;
      last = now;
      if (active) {
        const cyc = Math.floor((now - t0) / (DURATION + HOLD));
        const u = Math.min(((now - t0) % (DURATION + HOLD)) / DURATION, 1);
        if (cyc !== lastCycle) { stops.forEach((s) => s.classList.remove('is-done', 'is-cheer')); lastCycle = cyc; }
        const f = ease(u), p = road.getPointAtLength(total * f);
        learner.style.transform = `translate(${geo.ox + p.x * geo.k}px, ${geo.oy + p.y * geo.k}px)`;
        learner.style.opacity = u >= 1 ? '0' : '1';
        glow.style.strokeDashoffset = `${total * (1 - f)}`;
        stops.forEach((s, i) => {
          if (f >= at[i] - 0.004 && !s.classList.contains('is-done')) {
            s.classList.add('is-done');
            if (i === stops.length - 1) { s.classList.add('is-cheer'); burst(); }
          }
        });
      }
      requestAnimationFrame(frame);
    }
    scene.dataset.motion = 'active';
    requestAnimationFrame(frame);
  }
})();
