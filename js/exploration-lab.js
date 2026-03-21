(() => {
  const ACTIONS = [
    { key: "up", dr: -1, dc: 0, icon: "ri-arrow-up-line", label: "Up" },
    { key: "right", dr: 0, dc: 1, icon: "ri-arrow-right-line", label: "Right" },
    { key: "down", dr: 1, dc: 0, icon: "ri-arrow-down-line", label: "Down" },
    { key: "left", dr: 0, dc: -1, icon: "ri-arrow-left-line", label: "Left" }
  ];

  const ACTION_MAP = Object.fromEntries(ACTIONS.map((action) => [action.key, action]));
  const LATERAL_ACTIONS = {
    up: ["left", "right"],
    right: ["up", "down"],
    down: ["left", "right"],
    left: ["up", "down"]
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const randomIndex = (count) => Math.floor(Math.random() * count);

  function formatFixed(value, digits = 2) {
    return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
  }

  function formatCompact(value) {
    if (!Number.isFinite(value)) return "0";
    if (Math.abs(value) >= 100) return value.toFixed(0);
    if (Math.abs(value) >= 10) return value.toFixed(1);
    return value.toFixed(2);
  }

  function normalizeTick(value) {
    return Math.abs(value) < 1e-9 ? 0 : Number(value.toFixed(10));
  }

  function buildTickSet(minValue, maxValue, count = 5, includeZero = false) {
    let min = minValue;
    let max = maxValue;
    if (includeZero) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }

    if (Math.abs(max - min) < 1e-9) {
      const bump = Math.abs(max) < 1 ? 1 : Math.abs(max) * 0.2;
      min -= bump;
      max += bump;
    }

    const roughStep = (max - min) / Math.max(count - 1, 1);
    const magnitude = 10 ** Math.floor(Math.log10(Math.max(Math.abs(roughStep), 1e-6)));
    const residual = roughStep / magnitude;
    let niceResidual = 1;
    if (residual > 5) {
      niceResidual = 10;
    } else if (residual > 2) {
      niceResidual = 5;
    } else if (residual > 1) {
      niceResidual = 2;
    }
    const step = niceResidual * magnitude;
    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;
    const ticks = [];
    for (let value = niceMin; value <= niceMax + step / 2; value += step) {
      ticks.push(normalizeTick(value));
    }
    return {
      min: normalizeTick(niceMin),
      max: normalizeTick(niceMax),
      ticks
    };
  }

  function setStatus(element, state, text) {
    if (!element) return;
    element.dataset.state = state;
    element.textContent = text;
  }

  function pickRandomBest(values) {
    const maxValue = Math.max(...values);
    const ties = [];
    values.forEach((value, index) => {
      if (Math.abs(value - maxValue) < 1e-9) {
        ties.push(index);
      }
    });
    return ties[randomIndex(ties.length)];
  }

  function pickStableBest(entries) {
    let bestIndex = 0;
    let bestValue = entries[0];
    for (let index = 1; index < entries.length; index += 1) {
      if (entries[index] > bestValue) {
        bestIndex = index;
        bestValue = entries[index];
      }
    }
    return bestIndex;
  }

  function normalSample() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function gammaSample(shape) {
    if (shape < 1) {
      return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      const x = normalSample();
      let v = 1 + c * x;
      if (v <= 0) continue;
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  function betaSample(alpha, beta) {
    const x = gammaSample(alpha);
    const y = gammaSample(beta);
    return x / (x + y);
  }

  function renderSeriesChart(svg, series, emptyText, options = {}) {
    if (!svg) return;
    const usableSeries = series.filter((entry) => entry.values.length);
    if (!usableSeries.length) {
      svg.innerHTML = `
        <rect x="0" y="0" width="560" height="220" fill="transparent"></rect>
        <text x="280" y="114" text-anchor="middle" fill="rgba(100, 116, 139, 0.95)" font-size="14" font-family="Inter, sans-serif">${emptyText}</text>
      `;
      return;
    }

    const width = 560;
    const height = 220;
    const padLeft = 58;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 40;
    const innerWidth = width - padLeft - padRight;
    const innerHeight = height - padTop - padBottom;
    const allValues = usableSeries.flatMap((entry) => entry.values);
    const yTicks = buildTickSet(Math.min(...allValues), Math.max(...allValues), 5, options.yIncludeZero === true);
    const yRange = yTicks.max - yTicks.min;
    const xValues = options.xValues && options.xValues.length
      ? options.xValues
      : usableSeries[0].values.map((_, index) => index + 1);
    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    if (Math.abs(xMax - xMin) < 1e-9) {
      xMax = xMin + 1;
    }

    const yToSvg = (value) => height - padBottom - ((value - yTicks.min) / yRange) * innerHeight;
    const xToSvg = (value) => padLeft + ((value - xMin) / (xMax - xMin)) * innerWidth;

    const yGrid = yTicks.ticks
      .map((tick) => {
        const y = yToSvg(tick);
        return `
          <line x1="${padLeft}" y1="${y.toFixed(2)}" x2="${width - padRight}" y2="${y.toFixed(2)}" stroke="rgba(148, 163, 184, 0.24)" stroke-width="1" stroke-dasharray="4 4"></line>
          <text x="${padLeft - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="rgba(100, 116, 139, 0.92)" font-size="11" font-family="Inter, sans-serif">${formatCompact(tick)}</text>
        `;
      })
      .join("");

    const singlePoint = xValues.length === 1;
    const xTickCount = singlePoint ? 1 : Math.min(5, Math.max(2, xValues.length));
    const xTicks = singlePoint
      ? [xMin + (xMax - xMin) / 2]
      : Array.from({ length: xTickCount }, (_, index) => xMin + ((xMax - xMin) * index) / (xTickCount - 1));
    const xGrid = xTicks
      .map((tick) => {
        const x = xToSvg(tick);
        const tickValue = singlePoint ? xValues[0] : tick;
        const label = options.xTickFormatter ? options.xTickFormatter(tickValue) : Math.round(tickValue).toString();
        return `
          <line x1="${x.toFixed(2)}" y1="${height - padBottom}" x2="${x.toFixed(2)}" y2="${height - padBottom + 5}" stroke="rgba(100, 116, 139, 0.7)" stroke-width="1"></line>
          <text x="${x.toFixed(2)}" y="${height - 12}" text-anchor="middle" fill="rgba(100, 116, 139, 0.92)" font-size="11" font-family="Inter, sans-serif">${label}</text>
        `;
      })
      .join("");

    const axes = `
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="rgba(100, 116, 139, 0.78)" stroke-width="1.2"></line>
      <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="rgba(100, 116, 139, 0.78)" stroke-width="1.2"></line>
      ${options.xLabel ? `<text x="${padLeft + innerWidth / 2}" y="${height - 2}" text-anchor="middle" fill="rgba(71, 85, 105, 0.96)" font-size="11" font-family="Inter, sans-serif">${options.xLabel}</text>` : ""}
      ${options.yLabel ? `<text x="16" y="${padTop + innerHeight / 2}" text-anchor="middle" transform="rotate(-90 16 ${padTop + innerHeight / 2})" fill="rgba(71, 85, 105, 0.96)" font-size="11" font-family="Inter, sans-serif">${options.yLabel}</text>` : ""}
    `;

    const pathMarkup = usableSeries
      .map((entry) => {
        const points = entry.values
          .map((value, index) => {
            const x = entry.values.length === 1 ? padLeft + innerWidth / 2 : xToSvg(xValues[index]);
            const y = yToSvg(value);
            return { x, y };
          });

        const path = points
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
          .join(" ");

        const endPoint = points[points.length - 1];
        return `
          <path d="${path}" fill="none" stroke="${entry.color}" stroke-width="${entry.width || 3}" stroke-linecap="round" stroke-linejoin="round"></path>
          <circle cx="${endPoint.x.toFixed(2)}" cy="${endPoint.y.toFixed(2)}" r="4" fill="${entry.color}"></circle>
        `;
      })
      .join("");

    svg.innerHTML = `
      <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
      ${yGrid}
      ${axes}
      ${xGrid}
      ${pathMarkup}
    `;
  }

  function renderBarChart(svg, bars, emptyText, options = {}) {
    if (!svg) return;
    if (!bars.length) {
      svg.innerHTML = `
        <rect x="0" y="0" width="560" height="220" fill="transparent"></rect>
        <text x="280" y="114" text-anchor="middle" fill="rgba(100, 116, 139, 0.95)" font-size="14" font-family="Inter, sans-serif">${emptyText}</text>
      `;
      return;
    }

    const width = 560;
    const height = 220;
    const padLeft = 58;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 40;
    const innerWidth = width - padLeft - padRight;
    const innerHeight = height - padTop - padBottom;
    const values = bars.map((bar) => bar.value);
    const ticks = buildTickSet(Math.min(...values), Math.max(...values), 5, true);
    const yRange = ticks.max - ticks.min;
    const yToSvg = (value) => height - padBottom - ((value - ticks.min) / yRange) * innerHeight;
    const zeroY = yToSvg(0);
    const slotWidth = innerWidth / bars.length;
    const barWidth = Math.min(84, slotWidth * 0.55);

    const yGrid = ticks.ticks
      .map((tick) => {
        const y = yToSvg(tick);
        return `
          <line x1="${padLeft}" y1="${y.toFixed(2)}" x2="${width - padRight}" y2="${y.toFixed(2)}" stroke="rgba(148, 163, 184, 0.24)" stroke-width="1" stroke-dasharray="4 4"></line>
          <text x="${padLeft - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="rgba(100, 116, 139, 0.92)" font-size="11" font-family="Inter, sans-serif">${formatCompact(tick)}</text>
        `;
      })
      .join("");

    const barsMarkup = bars
      .map((bar, index) => {
        const centerX = padLeft + slotWidth * index + slotWidth / 2;
        const barX = centerX - barWidth / 2;
        const barY = yToSvg(Math.max(bar.value, 0));
        const barHeight = Math.abs(zeroY - yToSvg(bar.value));
        const labelY = bar.value >= 0 ? barY - 8 : zeroY + barHeight + 14;
        const fill = bar.color || (bar.value >= 0 ? "rgba(16, 185, 129, 0.86)" : "rgba(37, 99, 235, 0.82)");
        return `
          <rect x="${barX.toFixed(2)}" y="${Math.min(barY, zeroY).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${Math.max(barHeight, 2).toFixed(2)}" rx="14" fill="${fill}"></rect>
          <text x="${centerX.toFixed(2)}" y="${labelY.toFixed(2)}" text-anchor="middle" fill="rgba(15, 23, 42, 0.9)" font-size="11" font-family="Inter, sans-serif">${formatCompact(bar.value)}</text>
          <text x="${centerX.toFixed(2)}" y="${height - 12}" text-anchor="middle" fill="rgba(100, 116, 139, 0.92)" font-size="11" font-family="Inter, sans-serif">${bar.label}</text>
        `;
      })
      .join("");

    svg.innerHTML = `
      <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
      ${yGrid}
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="rgba(100, 116, 139, 0.78)" stroke-width="1.2"></line>
      <line x1="${padLeft}" y1="${zeroY.toFixed(2)}" x2="${width - padRight}" y2="${zeroY.toFixed(2)}" stroke="rgba(100, 116, 139, 0.78)" stroke-width="1.2"></line>
      ${options.yLabel ? `<text x="16" y="${padTop + innerHeight / 2}" text-anchor="middle" transform="rotate(-90 16 ${padTop + innerHeight / 2})" fill="rgba(71, 85, 105, 0.96)" font-size="11" font-family="Inter, sans-serif">${options.yLabel}</text>` : ""}
      ${barsMarkup}
    `;
  }

  function initBandit() {
    const els = {
      arms: document.getElementById("banditArms"),
      armsValue: document.getElementById("banditArmsValue"),
      strategy: document.getElementById("banditStrategy"),
      drift: document.getElementById("banditDrift"),
      param: document.getElementById("banditParam"),
      paramLabel: document.getElementById("banditParamLabel"),
      paramValue: document.getElementById("banditParamValue"),
      paramHint: document.getElementById("banditParamHint"),
      stepBtn: document.getElementById("banditStepBtn"),
      episodeBtn: document.getElementById("banditEpisodeBtn"),
      batchBtn: document.getElementById("banditBatchBtn"),
      resetBtn: document.getElementById("banditResetBtn"),
      strategyIcon: document.getElementById("banditStrategyIcon"),
      strategyBlurb: document.getElementById("banditStrategyBlurb"),
      pulls: document.getElementById("banditPulls"),
      reward: document.getElementById("banditReward"),
      regret: document.getElementById("banditRegret"),
      average: document.getElementById("banditAverage"),
      bestArm: document.getElementById("banditBestArm"),
      armRows: document.getElementById("banditArmRows"),
      trendChart: document.getElementById("banditTrendChart"),
      deltaChart: document.getElementById("banditDeltaChart"),
      historyCount: document.getElementById("banditHistoryCount"),
      decisionLog: document.getElementById("banditDecisionLog"),
      status: document.getElementById("banditStatusTag")
    };

    if (!els.arms || !els.strategy) return;

    const strategyConfig = {
      epsilon: {
        label: "Exploration rate (epsilon)",
        min: 0.02,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.12,
        icon: "ri-scales-3-line",
        hint: "Higher epsilon forces more random exploration instead of greedy choice.",
        blurb: "Epsilon-greedy mostly exploits the best estimate so far, but reserves a fixed random-exploration budget."
      },
      ucb: {
        label: "Confidence bonus (c)",
        min: 0.4,
        max: 3.0,
        step: 0.05,
        defaultValue: 1.4,
        icon: "ri-compass-3-line",
        hint: "Larger confidence bonuses keep the policy probing uncertain arms for longer.",
        blurb: "UCB adds an uncertainty bonus to each arm so rarely sampled options stay competitive until they are tested."
      },
      thompson: {
        label: "Prior optimism",
        min: 1.0,
        max: 4.0,
        step: 0.1,
        defaultValue: 1.5,
        icon: "ri-bubble-chart-line",
        hint: "Higher prior optimism starts each arm with a slightly more favorable posterior.",
        blurb: "Thompson sampling draws a plausible reward rate for each arm from its posterior and acts on the sampled leader."
      }
    };

    const state = {
      numArms: 5,
      strategy: "epsilon",
      drifting: false,
      param: 0.12,
      envMeans: [],
      estimates: [],
      counts: [],
      priors: [],
      pulls: 0,
      cumulativeReward: 0,
      oracleReward: 0,
      regret: 0,
      rewardHistory: [],
      oracleHistory: [],
      decisionLog: [],
      running: false
    };

    function updateStrategyUI() {
      const config = strategyConfig[els.strategy.value];
      els.paramLabel.textContent = config.label;
      els.param.min = String(config.min);
      els.param.max = String(config.max);
      els.param.step = String(config.step);
      const currentValue = Number(els.param.value);
      if (currentValue < config.min || currentValue > config.max) {
        els.param.value = String(config.defaultValue);
      }
      els.paramValue.textContent = formatFixed(Number(els.param.value), 2);
      els.paramHint.textContent = config.hint;
      els.strategyIcon.className = `${config.icon} text-primary text-xl`;
      els.strategyBlurb.textContent = config.blurb;
    }

    function setDisabled(disabled) {
      [
        els.arms,
        els.strategy,
        els.drift,
        els.param,
        els.stepBtn,
        els.episodeBtn,
        els.batchBtn,
        els.resetBtn
      ].forEach((element) => {
        if (element) element.disabled = disabled;
      });
    }

    function resetBandit() {
      state.numArms = Number(els.arms.value);
      state.strategy = els.strategy.value;
      state.drifting = els.drift.checked;
      state.param = Number(els.param.value);
      state.envMeans = Array.from({ length: state.numArms }, () => randomBetween(0.14, 0.9));
      state.estimates = Array(state.numArms).fill(0);
      state.counts = Array(state.numArms).fill(0);
      state.priors = Array.from({ length: state.numArms }, () => ({
        alpha: state.strategy === "thompson" ? state.param : 1,
        beta: 1
      }));
      state.pulls = 0;
      state.cumulativeReward = 0;
      state.oracleReward = 0;
      state.regret = 0;
      state.rewardHistory = [];
      state.oracleHistory = [];
      state.decisionLog = [];
      state.running = false;
      setDisabled(false);
      setStatus(els.status, "ready", "Ready");
      renderBandit();
    }

    function chooseArm() {
      if (state.strategy === "epsilon") {
        const greedyArm = pickRandomBest(state.estimates);
        if (Math.random() < state.param) {
          return { arm: randomIndex(state.numArms), mode: "explore", reason: "epsilon random step" };
        }
        return { arm: greedyArm, mode: "exploit", reason: "best current estimate" };
      }

      if (state.strategy === "ucb") {
        const untried = state.counts
          .map((count, index) => ({ count, index }))
          .filter((entry) => entry.count === 0);
        if (untried.length) {
          return { arm: untried[randomIndex(untried.length)].index, mode: "explore", reason: "untried arm bonus" };
        }
        const greedyArm = pickRandomBest(state.estimates);
        const scores = state.estimates.map((estimate, index) => {
          const bonus = state.param * Math.sqrt(Math.log(state.pulls + 1) / state.counts[index]);
          return estimate + bonus;
        });
        const arm = pickRandomBest(scores);
        return {
          arm,
          mode: arm === greedyArm ? "exploit" : "explore",
          reason: arm === greedyArm ? "highest estimate still wins" : "confidence bonus favored uncertainty"
        };
      }

      const posteriorMeans = state.priors.map((prior) => prior.alpha / (prior.alpha + prior.beta));
      const samples = state.priors.map((prior) => betaSample(prior.alpha, prior.beta));
      const arm = pickRandomBest(samples);
      const greedyPosterior = pickRandomBest(posteriorMeans);
      return {
        arm,
        mode: arm === greedyPosterior ? "exploit" : "explore",
        reason: arm === greedyPosterior ? "posterior mean leader" : "posterior sample backed a different arm"
      };
    }

    function applyDrift() {
      state.envMeans = state.envMeans.map((mean) => clamp(mean + randomBetween(-0.035, 0.035), 0.05, 0.95));
    }

    function stepBandit() {
      const selection = chooseArm();
      const arm = selection.arm;
      const chosenMean = state.envMeans[arm];
      const bestMean = Math.max(...state.envMeans);
      const reward = Math.random() < chosenMean ? 1 : 0;

      state.pulls += 1;
      state.cumulativeReward += reward;
      state.oracleReward += bestMean;
      state.regret += bestMean - chosenMean;
      state.counts[arm] += 1;
      state.estimates[arm] += (reward - state.estimates[arm]) / state.counts[arm];

      if (state.strategy === "thompson") {
        if (reward) {
          state.priors[arm].alpha += 1;
        } else {
          state.priors[arm].beta += 1;
        }
      }

      state.rewardHistory.push(state.cumulativeReward);
      state.oracleHistory.push(state.oracleReward);
      state.decisionLog.unshift({
        arm,
        reward,
        mean: chosenMean,
        best: Math.abs(bestMean - chosenMean) < 1e-9,
        mode: selection.mode,
        reason: selection.reason
      });
      state.decisionLog = state.decisionLog.slice(0, 12);

      if (state.drifting) {
        applyDrift();
      }
    }

    function renderBandit() {
      els.armsValue.textContent = String(els.arms.value);
      els.paramValue.textContent = formatFixed(Number(els.param.value), 2);
      els.pulls.textContent = String(state.pulls);
      els.reward.textContent = formatFixed(state.cumulativeReward, 2);
      els.regret.textContent = formatFixed(state.regret, 2);
      els.average.textContent = state.pulls ? formatFixed(state.cumulativeReward / state.pulls, 2) : "0.00";
      const bestIndex = pickStableBest(state.envMeans.length ? state.envMeans : [0]);
      els.bestArm.textContent = `Arm ${bestIndex + 1}`;

      els.armRows.innerHTML = state.envMeans
        .map((mean, index) => {
          const estimate = state.estimates[index];
          return `
            <div class="bandit-arm-row">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-semibold text-gray-900">Arm ${index + 1}</span>
                <span class="text-gray-500">${state.counts[index]} pulls</span>
              </div>
              <div class="bandit-bar-track">
                <div class="bandit-bar-fill" style="width: ${(estimate * 100).toFixed(1)}%;"></div>
                <span class="bandit-bar-marker" style="left: ${(mean * 100).toFixed(1)}%;"></span>
              </div>
              <div class="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                <span>Estimate ${formatFixed(estimate, 2)}</span>
                <span>Latent mean ${formatFixed(mean, 2)}</span>
              </div>
            </div>
          `;
        })
        .join("");

      const rewardWindow = state.rewardHistory.slice(-60);
      const oracleWindow = state.oracleHistory.slice(-60);
      const rewardStart = state.pulls - rewardWindow.length + 1;
      const xValues = rewardWindow.map((_, index) => rewardStart + index);
      els.historyCount.textContent = `${rewardWindow.length} pulls`;
      renderSeriesChart(
        els.trendChart,
        [
          { values: rewardWindow, color: "rgba(37, 99, 235, 0.95)" },
          { values: oracleWindow, color: "rgba(16, 185, 129, 0.95)" }
        ],
        "Run the bandit to draw a reward trail.",
        {
          xValues,
          xLabel: "Pull number",
          yLabel: "Cumulative reward",
          yIncludeZero: true,
          xTickFormatter: (value) => Math.round(value).toString()
        }
      );

      const overallDelta = state.oracleReward - state.cumulativeReward;
      const windowSize = Math.min(50, state.rewardHistory.length);
      const rewardWindowStart = windowSize && state.rewardHistory.length > windowSize ? state.rewardHistory[state.rewardHistory.length - windowSize - 1] : 0;
      const oracleWindowStart = windowSize && state.oracleHistory.length > windowSize ? state.oracleHistory[state.oracleHistory.length - windowSize - 1] : 0;
      const lastWindowDelta = windowSize
        ? (state.oracleReward - oracleWindowStart) - (state.cumulativeReward - rewardWindowStart)
        : 0;
      renderBarChart(
        els.deltaChart,
        state.rewardHistory.length
          ? [
              { label: "Overall", value: overallDelta, color: "rgba(16, 185, 129, 0.82)" },
              { label: `Last ${windowSize}`, value: lastWindowDelta, color: "rgba(37, 99, 235, 0.82)" }
            ]
          : [],
        "Run the bandit to compare oracle and learner gaps.",
        { yLabel: "Oracle - learner" }
      );

      els.decisionLog.innerHTML = state.decisionLog.length
        ? state.decisionLog
            .map(
              (entry) => `
                <span class="decision-pill" data-reward="${entry.reward}">
                  <span class="decision-mode" data-mode="${entry.mode}">${entry.mode === "explore" ? "Explore" : "Exploit"}</span>
                  <span class="font-semibold">Arm ${entry.arm + 1}</span>
                  <span>${entry.reward ? "reward 1" : "reward 0"}</span>
                  <span>p=${formatFixed(entry.mean, 2)}</span>
                  <span>${entry.reason}</span>
                  ${entry.best ? '<i class="ri-star-smile-line text-primary"></i>' : ""}
                </span>
              `
            )
            .join("")
        : '<div class="trajectory-empty">No pulls yet. Step once or run a short episode to populate the log.</div>';
    }

    function runPulls(totalPulls, completionText) {
      if (state.running) return;
      state.running = true;
      setDisabled(true);
      setStatus(els.status, "running", completionText === "Episode complete" ? "Running episode" : "Running batch");

      let remaining = totalPulls;
      const frame = () => {
        const chunk = Math.min(remaining, totalPulls > 80 ? 20 : 6);
        for (let index = 0; index < chunk; index += 1) {
          stepBandit();
        }
        remaining -= chunk;
        renderBandit();

        if (remaining > 0) {
          window.requestAnimationFrame(frame);
          return;
        }

        state.running = false;
        setDisabled(false);
        setStatus(els.status, "ready", completionText);
      };

      window.requestAnimationFrame(frame);
    }

    els.arms.addEventListener("input", () => {
      els.armsValue.textContent = els.arms.value;
    });

    els.arms.addEventListener("change", resetBandit);
    els.strategy.addEventListener("change", () => {
      updateStrategyUI();
      resetBandit();
    });
    els.drift.addEventListener("change", resetBandit);
    els.param.addEventListener("input", () => {
      els.paramValue.textContent = formatFixed(Number(els.param.value), 2);
      if (state.strategy !== "thompson") {
        state.param = Number(els.param.value);
        renderBandit();
      }
    });
    els.param.addEventListener("change", () => {
      if (els.strategy.value === "thompson") {
        resetBandit();
      } else {
        state.param = Number(els.param.value);
      }
    });

    els.stepBtn.addEventListener("click", () => {
      if (state.running) return;
      stepBandit();
      setStatus(els.status, "ready", "Stepped");
      renderBandit();
    });

    els.episodeBtn.addEventListener("click", () => runPulls(40, "Episode complete"));
    els.batchBtn.addEventListener("click", () => runPulls(220, "Batch complete"));
    els.resetBtn.addEventListener("click", resetBandit);

    updateStrategyUI();
    resetBandit();
  }

  function initGridworld() {
    const els = {
      algorithm: document.getElementById("gridAlgorithm"),
      noise: document.getElementById("gridNoise"),
      epsilon: document.getElementById("gridEpsilon"),
      epsilonValue: document.getElementById("gridEpsilonValue"),
      alpha: document.getElementById("gridAlpha"),
      alphaValue: document.getElementById("gridAlphaValue"),
      gamma: document.getElementById("gridGamma"),
      gammaValue: document.getElementById("gridGammaValue"),
      optimistic: document.getElementById("gridOptimistic"),
      decay: document.getElementById("gridDecay"),
      trainEpisodes: document.getElementById("gridTrainEpisodes"),
      stepBtn: document.getElementById("gridStepBtn"),
      trainBtn: document.getElementById("gridTrainBtn"),
      resetBtn: document.getElementById("gridResetBtn"),
      episodes: document.getElementById("gridEpisodes"),
      currentEpsilon: document.getElementById("gridCurrentEpsilon"),
      lastReward: document.getElementById("gridLastReward"),
      lastLength: document.getElementById("gridLastLength"),
      goalRate: document.getElementById("gridGoalRate"),
      board: document.getElementById("gridBoard"),
      rewardChart: document.getElementById("gridRewardChart"),
      historyCount: document.getElementById("gridHistoryCount"),
      trajectorySummary: document.getElementById("gridTrajectorySummary"),
      status: document.getElementById("gridStatusTag")
    };

    if (!els.algorithm || !els.board) return;

    const rows = 5;
    const cols = 5;
    const startKey = "4,0";
    const goalKey = "0,4";
    const hazardCells = new Set(["1,3", "3,4"]);
    const wallCells = new Set(["1,1", "2,2", "3,1"]);

    const state = {
      algorithm: "qlearning",
      epsilonBase: 0.18,
      currentEpsilon: 0.18,
      alpha: 0.3,
      gamma: 0.92,
      optimistic: false,
      decay: true,
      noise: false,
      q: {},
      episodes: 0,
      rewardHistory: [],
      lastReward: 0,
      lastLength: 0,
      recentOutcomes: [],
      latestTrajectory: [],
      latestOutcome: "ready",
      running: false
    };

    const toKey = (row, col) => `${row},${col}`;
    const fromKey = (key) => key.split(",").map(Number);

    function isInside(row, col) {
      return row >= 0 && row < rows && col >= 0 && col < cols;
    }

    function isTerminal(key) {
      return key === goalKey || hazardCells.has(key);
    }

    function readControls(resetEpsilon) {
      state.algorithm = els.algorithm.value;
      state.noise = els.noise.checked;
      state.epsilonBase = Number(els.epsilon.value);
      state.alpha = Number(els.alpha.value);
      state.gamma = Number(els.gamma.value);
      state.optimistic = els.optimistic.checked;
      state.decay = els.decay.checked;
      if (resetEpsilon || state.episodes === 0) {
        state.currentEpsilon = state.epsilonBase;
      }
      els.epsilonValue.textContent = formatFixed(state.epsilonBase, 2);
      els.alphaValue.textContent = formatFixed(state.alpha, 2);
      els.gammaValue.textContent = formatFixed(state.gamma, 2);
    }

    function setDisabled(disabled) {
      [
        els.algorithm,
        els.noise,
        els.epsilon,
        els.alpha,
        els.gamma,
        els.optimistic,
        els.decay,
        els.trainEpisodes,
        els.stepBtn,
        els.trainBtn,
        els.resetBtn
      ].forEach((element) => {
        if (element) element.disabled = disabled;
      });
    }

    function resetGridworld() {
      readControls(true);
      const initialValue = state.optimistic ? 0.6 : 0;
      state.q = {};
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const key = toKey(row, col);
          if (wallCells.has(key)) continue;
          state.q[key] = {
            up: initialValue,
            right: initialValue,
            down: initialValue,
            left: initialValue
          };
          if (isTerminal(key)) {
            state.q[key] = { up: 0, right: 0, down: 0, left: 0 };
          }
        }
      }
      state.episodes = 0;
      state.rewardHistory = [];
      state.lastReward = 0;
      state.lastLength = 0;
      state.recentOutcomes = [];
      state.latestTrajectory = [];
      state.latestOutcome = "ready";
      state.running = false;
      setDisabled(false);
      setStatus(els.status, "ready", "Ready");
      renderGridworld();
    }

    function greedyAction(key, randomTie = false) {
      const qState = state.q[key];
      if (!qState || isTerminal(key)) return null;
      const scores = ACTIONS.map((action) => qState[action.key]);
      const bestIndex = randomTie ? pickRandomBest(scores) : pickStableBest(scores);
      return ACTIONS[bestIndex].key;
    }

    function maxQ(key) {
      const action = greedyAction(key, false);
      return action ? state.q[key][action] : 0;
    }

    function behaviorAction(key) {
      if (Math.random() < state.currentEpsilon) {
        return ACTIONS[randomIndex(ACTIONS.length)].key;
      }
      return greedyAction(key, true);
    }

    function resolveAction(actionKey) {
      if (!state.noise) return actionKey;
      const roll = Math.random();
      if (roll < 0.7) return actionKey;
      if (roll < 0.85) return LATERAL_ACTIONS[actionKey][0];
      return LATERAL_ACTIONS[actionKey][1];
    }

    function transition(stateKey, intendedAction) {
      const actualAction = resolveAction(intendedAction);
      const [row, col] = fromKey(stateKey);
      const move = ACTION_MAP[actualAction];
      const nextRow = row + move.dr;
      const nextCol = col + move.dc;
      let nextKey = stateKey;

      if (isInside(nextRow, nextCol) && !wallCells.has(toKey(nextRow, nextCol))) {
        nextKey = toKey(nextRow, nextCol);
      }

      let reward = -0.04;
      let terminal = false;
      if (nextKey === goalKey) {
        reward = 1;
        terminal = true;
      } else if (hazardCells.has(nextKey)) {
        reward = -1;
        terminal = true;
      } else if (nextKey === stateKey) {
        reward = -0.08;
      }

      return { nextKey, reward, terminal, actualAction };
    }

    function runEpisode() {
      let currentState = startKey;
      let action = behaviorAction(currentState);
      const trajectory = [{ key: currentState, action: null, reward: 0 }];
      let totalReward = 0;
      let outcome = "timeout";

      for (let step = 0; step < 40; step += 1) {
        const result = transition(currentState, action);
        totalReward += result.reward;
        trajectory.push({ key: result.nextKey, action: result.actualAction, reward: result.reward });

        if (state.algorithm === "qlearning") {
          const target = result.reward + (result.terminal ? 0 : state.gamma * maxQ(result.nextKey));
          state.q[currentState][action] += state.alpha * (target - state.q[currentState][action]);
          currentState = result.nextKey;
          if (result.terminal) {
            outcome = result.nextKey === goalKey ? "goal" : "hazard";
            break;
          }
          action = behaviorAction(currentState);
        } else {
          const nextAction = result.terminal ? null : behaviorAction(result.nextKey);
          const nextValue = result.terminal ? 0 : state.q[result.nextKey][nextAction];
          const target = result.reward + state.gamma * nextValue;
          state.q[currentState][action] += state.alpha * (target - state.q[currentState][action]);
          currentState = result.nextKey;
          action = nextAction;
          if (result.terminal) {
            outcome = result.nextKey === goalKey ? "goal" : "hazard";
            break;
          }
        }
      }

      state.episodes += 1;
      state.lastReward = totalReward;
      state.lastLength = trajectory.length - 1;
      state.latestTrajectory = trajectory;
      state.latestOutcome = outcome;
      state.rewardHistory.push(totalReward);
      state.rewardHistory = state.rewardHistory.slice(-120);
      state.recentOutcomes.push(outcome);
      state.recentOutcomes = state.recentOutcomes.slice(-20);

      if (state.decay) {
        state.currentEpsilon = Math.max(0.02, state.currentEpsilon * 0.985);
      } else {
        state.currentEpsilon = state.epsilonBase;
      }
    }

    function cellFill(value, key) {
      if (key === goalKey) {
        return "linear-gradient(180deg, rgba(16, 185, 129, 0.24), rgba(255, 255, 255, 0.96))";
      }
      if (hazardCells.has(key)) {
        return "linear-gradient(180deg, rgba(244, 63, 94, 0.22), rgba(255, 255, 255, 0.96))";
      }
      const magnitude = clamp(Math.abs(value) / 1.25, 0, 1);
      if (value >= 0) {
        return `linear-gradient(180deg, rgba(37, 99, 235, ${0.08 + magnitude * 0.34}), rgba(255, 255, 255, 0.96))`;
      }
      return `linear-gradient(180deg, rgba(244, 63, 94, ${0.08 + magnitude * 0.3}), rgba(255, 255, 255, 0.96))`;
    }

    function stateLabel(key) {
      if (key === startKey) return "Start";
      if (key === goalKey) return "Goal";
      if (hazardCells.has(key)) return "Hazard";
      const [row, col] = fromKey(key);
      return `R${row + 1}C${col + 1}`;
    }

    function renderGridworld() {
      els.episodes.textContent = String(state.episodes);
      els.currentEpsilon.textContent = formatFixed(state.currentEpsilon, 2);
      els.lastReward.textContent = formatFixed(state.lastReward, 2);
      els.lastLength.textContent = String(state.lastLength);
      const goals = state.recentOutcomes.filter((outcome) => outcome === "goal").length;
      const goalRate = state.recentOutcomes.length ? Math.round((goals / state.recentOutcomes.length) * 100) : 0;
      els.goalRate.textContent = `${goalRate}%`;

      const firstVisit = {};
      state.latestTrajectory.forEach((entry, index) => {
        if (firstVisit[entry.key] === undefined) {
          firstVisit[entry.key] = index;
        }
      });

      const cells = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const key = toKey(row, col);
          if (wallCells.has(key)) {
            cells.push(`
              <div class="grid-cell grid-cell-wall">
                <div class="grid-cell-top"><span class="grid-cell-type">Wall</span></div>
                <div class="grid-cell-policy"><i class="ri-forbid-2-line"></i></div>
                <div class="grid-cell-value">Blocked</div>
              </div>
            `);
            continue;
          }

          const bestAction = greedyAction(key, false);
          const value = isTerminal(key) ? (key === goalKey ? 1 : -1) : maxQ(key);
          const stepBadge = firstVisit[key] !== undefined ? `<span class="grid-cell-step">${firstVisit[key]}</span>` : "";
          const typeLabel = key === startKey ? "Start" : key === goalKey ? "Goal" : hazardCells.has(key) ? "Hazard" : stateLabel(key);
          const policyMarkup = key === goalKey
            ? '<i class="ri-flag-2-line"></i>'
            : hazardCells.has(key)
              ? '<i class="ri-alarm-warning-line"></i>'
              : `<i class="${ACTION_MAP[bestAction]?.icon || "ri-compass-3-line"}"></i>`;
          const valueMarkup = key === goalKey
            ? "+1 terminal"
            : hazardCells.has(key)
              ? "-1 terminal"
              : `V ${formatFixed(value, 2)}`;

          cells.push(`
            <div class="grid-cell" style="--cell-fill: ${cellFill(value, key)};">
              <div class="grid-cell-top">
                <span class="grid-cell-type">${typeLabel}</span>
                ${stepBadge}
              </div>
              <div class="grid-cell-policy">${policyMarkup}</div>
              <div class="grid-cell-value">${valueMarkup}</div>
            </div>
          `);
        }
      }

      els.board.innerHTML = cells.join("");
      const rewardWindow = state.rewardHistory.slice(-80);
      const startEpisode = state.episodes - rewardWindow.length + 1;
      const xValues = rewardWindow.map((_, index) => startEpisode + index);
      els.historyCount.textContent = `${rewardWindow.length} episodes`;
      renderSeriesChart(
        els.rewardChart,
        [{ values: rewardWindow, color: "rgba(37, 99, 235, 0.95)" }],
        "Train the agent to draw the return history.",
        {
          xValues,
          xLabel: "Episode",
          yLabel: "Episode reward",
          yIncludeZero: true,
          xTickFormatter: (value) => Math.round(value).toString()
        }
      );

      if (!state.latestTrajectory.length) {
        els.trajectorySummary.innerHTML = '<div class="trajectory-empty">No episode has been trained yet. Run one episode to highlight a path and inspect the state sequence.</div>';
        return;
      }

      const outcomeLabel = state.latestOutcome === "goal"
        ? "Reached the goal"
        : state.latestOutcome === "hazard"
          ? "Fell into a hazard"
          : "Timed out before termination";

      const visibleNodes = state.latestTrajectory.slice(0, 14);
      const nodesMarkup = visibleNodes
        .map(
          (entry, index) => `
            <span class="trajectory-node">
              <span class="trajectory-index">${index}</span>
              <span>${stateLabel(entry.key)}</span>
            </span>
          `
        )
        .join("");
      const overflowMarkup = state.latestTrajectory.length > visibleNodes.length
        ? `<span class="trajectory-node">+${state.latestTrajectory.length - visibleNodes.length} more</span>`
        : "";

      els.trajectorySummary.innerHTML = `
        <div class="trajectory-meta">
          ${outcomeLabel}. Total reward ${formatFixed(state.lastReward, 2)} over ${state.lastLength} steps. The numbered badges on the grid show the first time each state was visited in this episode.
        </div>
        <div class="trajectory-strip">
          ${nodesMarkup}
          ${overflowMarkup}
        </div>
      `;
    }

    function runTraining(totalEpisodes) {
      if (state.running) return;
      state.running = true;
      setDisabled(true);
      setStatus(els.status, "running", totalEpisodes === 1 ? "Running episode" : "Training");

      let remaining = totalEpisodes;
      const frame = () => {
        const chunk = Math.min(remaining, totalEpisodes > 30 ? 10 : 3);
        readControls(false);
        for (let index = 0; index < chunk; index += 1) {
          runEpisode();
        }
        remaining -= chunk;
        renderGridworld();

        if (remaining > 0) {
          window.requestAnimationFrame(frame);
          return;
        }

        state.running = false;
        setDisabled(false);
        const statusText = state.latestOutcome === "goal"
          ? "Goal reached"
          : state.latestOutcome === "hazard"
            ? "Hazard hit"
            : "Batch complete";
        setStatus(els.status, "ready", statusText);
      };

      window.requestAnimationFrame(frame);
    }

    els.epsilon.addEventListener("input", () => {
      els.epsilonValue.textContent = formatFixed(Number(els.epsilon.value), 2);
    });
    els.alpha.addEventListener("input", () => {
      els.alphaValue.textContent = formatFixed(Number(els.alpha.value), 2);
    });
    els.gamma.addEventListener("input", () => {
      els.gammaValue.textContent = formatFixed(Number(els.gamma.value), 2);
    });

    els.algorithm.addEventListener("change", resetGridworld);
    els.noise.addEventListener("change", resetGridworld);
    els.optimistic.addEventListener("change", resetGridworld);
    els.decay.addEventListener("change", () => {
      state.decay = els.decay.checked;
      if (!state.decay) {
        state.currentEpsilon = Number(els.epsilon.value);
        renderGridworld();
      }
    });

    els.stepBtn.addEventListener("click", () => runTraining(1));
    els.trainBtn.addEventListener("click", () => {
      const total = clamp(Number(els.trainEpisodes.value) || 60, 5, 300);
      els.trainEpisodes.value = String(total);
      runTraining(total);
    });
    els.resetBtn.addEventListener("click", resetGridworld);

    readControls(true);
    resetGridworld();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBandit();
    initGridworld();
  });
})();
