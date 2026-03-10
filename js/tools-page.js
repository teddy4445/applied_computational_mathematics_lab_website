(async function bootToolsPage() {
  const heroStats = document.getElementById('tools-hero-stats');
  const toolsGrid = document.getElementById('tools-grid');
  const conveyorScene = document.getElementById('tools-conveyor-scene');
  const conveyorItems = document.getElementById('tools-conveyor-items');
  const conveyorTrack = document.getElementById('tools-conveyor-track');

  if (!heroStats || !toolsGrid || !conveyorScene || !conveyorItems || !conveyorTrack) {
    return;
  }

  let data;
  try {
    const response = await fetch('data/tools.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.error('Failed to load tools data:', error);
    toolsGrid.innerHTML = '<div class="tools-grid-empty">Unable to load tools right now.</div>';
    return;
  }

  renderHeroStats(data.hero?.stats || []);
  renderTools(data.tools || []);
  initConveyor(data.conveyorIcons || []);

  function renderHeroStats(stats) {
    heroStats.innerHTML = stats
      .map(
        (stat) => `
          <div class="text-center">
            <div class="text-3xl font-bold text-primary">${stat.value}</div>
            <div class="text-sm text-gray-600">${stat.label}</div>
          </div>
        `
      )
      .join('');
  }

  function renderTools(tools) {
    if (!tools.length) {
      toolsGrid.innerHTML = '<div class="tools-grid-empty">No tools are available right now.</div>';
      return;
    }

    toolsGrid.innerHTML = tools
      .map((tool) => {
        const secondaryAttrs = tool.secondaryExternal ? ' target="_blank" rel="noopener"' : '';
        return `
          <article class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col">
            <div class="p-6 border-b border-gray-100 bg-gradient-to-br ${tool.gradient} text-white">
              <div class="flex items-center justify-between gap-4 mb-4">
                <span class="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">${tool.badge}</span>
                <i class="${tool.icon} text-2xl"></i>
              </div>
              <h3 class="text-2xl font-semibold mb-3">${tool.title}</h3>
              <p class="text-white/85">${tool.description}</p>
            </div>
            <div class="p-6 flex-1 flex flex-col">
              <div class="grid grid-cols-2 gap-3 mb-6">
                ${tool.metrics
                  .map(
                    (metric) => `
                      <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <div class="text-sm text-gray-500">${metric.label}</div>
                        <div class="text-lg font-semibold text-gray-900">${metric.value}</div>
                      </div>
                    `
                  )
                  .join('')}
              </div>
              <p class="text-gray-600 leading-relaxed mb-6">${tool.body}</p>
              <div class="mt-auto flex flex-wrap gap-4">
                <a href="${tool.primaryHref}" class="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition font-medium">${tool.primaryLabel}</a>
                <a href="${tool.secondaryHref}" class="text-primary font-medium hover:text-secondary transition-colors duration-200 flex items-center"${secondaryAttrs}>${tool.secondaryLabel} <i class="ri-arrow-right-line ml-1"></i></a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function initConveyor(iconDefs) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = [];
    const spawnIntervalMs = 1000;
    const crossingTime = 6;
    const itemSizeDesktop = 62;
    const itemSizeMobile = 56;
    let active = true;
    let lastFrame = performance.now();
    let spawnClock = 0;
    let iconIndex = 0;
    let laneY = 0;

    if (!iconDefs.length) {
      return;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          active = entries[0]?.isIntersecting ?? true;
          conveyorScene.dataset.motion = active ? 'active' : 'paused';
        },
        { threshold: 0.15 }
      );
      observer.observe(conveyorScene);
    }

    function getItemSize() {
      return window.innerWidth < 768 ? itemSizeMobile : itemSizeDesktop;
    }

    function updateLanePosition() {
      const sceneRect = conveyorScene.getBoundingClientRect();
      const laneRect = conveyorTrack.getBoundingClientRect();
      const itemSize = getItemSize();
      laneY = laneRect.top - sceneRect.top + laneRect.height / 2 - itemSize / 2;
    }

    function createItem(definition, index, total) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tool-belt-item';
      button.setAttribute('aria-label', definition.label);
      button.innerHTML = `<i class="${definition.icon}"></i>`;
      conveyorItems.appendChild(button);

      if (reducedMotion) {
        const itemSize = getItemSize();
        const availableWidth = conveyorScene.clientWidth - itemSize;
        const spacing = total > 1 ? availableWidth / (total - 1) : 0;
        const x = spacing * index;
        button.style.transform = `translate3d(${x}px, ${laneY}px, 0)`;
        button.style.opacity = '1';
      }

      return {
        el: button,
        x: -getItemSize(),
        born: performance.now()
      };
    }

    function trySpawn() {
      const itemSize = getItemSize();
      const minSpacing = itemSize * 1.1;
      const blocked = items.some((item) => item.x < minSpacing);
      if (blocked) return;

      const definition = iconDefs[iconIndex % iconDefs.length];
      iconIndex += 1;
      const item = createItem(definition, 0, 0);
      item.x = -itemSize;
      items.push(item);
    }

    function renderItems(now) {
      const itemSize = getItemSize();
      const speed = (conveyorScene.clientWidth + itemSize * 2) / crossingTime;
      const dt = (now - lastFrame) / 1000;
      lastFrame = now;

      if (active) {
        spawnClock += dt * 1000;
        while (spawnClock >= spawnIntervalMs) {
          trySpawn();
          spawnClock -= spawnIntervalMs;
        }

        for (let index = items.length - 1; index >= 0; index -= 1) {
          const item = items[index];
          item.x += speed * dt;
          const intro = Math.min((now - item.born) / 280, 1);
          const lift = (1 - intro) * 8;
          const scale = 0.95 + intro * 0.05;
          item.el.style.opacity = `${intro}`;
          item.el.style.transform = `translate3d(${item.x}px, ${laneY - lift}px, 0) scale(${scale})`;

          if (item.x > conveyorScene.clientWidth + itemSize) {
            item.el.remove();
            items.splice(index, 1);
          }
        }
      }

      requestAnimationFrame(renderItems);
    }

    updateLanePosition();

    if (reducedMotion) {
      conveyorScene.dataset.reducedMotion = 'true';
      conveyorScene.dataset.motion = 'paused';
      iconDefs.slice(0, 5).forEach((definition, index, all) => {
        createItem(definition, index, all.length);
      });
      return;
    }

    conveyorScene.dataset.motion = 'active';
    window.addEventListener('resize', updateLanePosition);
    requestAnimationFrame(renderItems);
  }
})();
