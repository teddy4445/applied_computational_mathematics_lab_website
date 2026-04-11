const STEP_ORDER = ["upload", "map", "objective", "review", "results"];
const STEP_CAPTIONS = {
  upload: "Start by uploading a CSV file up to 1MB.",
  map: "Review the detected columns, override types where needed, and assign variable roles.",
  objective: "Set the study goal and design so the rule-based selector can narrow the method.",
  review: "Inspect the recommendation, assumptions, and alternatives before running.",
  results: "Review the computed output, diagnostics, and plain-language interpretation."
};

const MAX_FILE_SIZE = 1024 * 1024;
const MISSING_TOKENS = new Set(["", "na", "n/a", "null", "none", "nan", "missing", ".", "-", "--"]);
const POSITIVE_BINARY_HINTS = ["1", "yes", "y", "true", "case", "event", "positive", "success", "present"];
const ORDINAL_SEQUENCES = [
  ["very low", "low", "medium", "high", "very high"],
  ["strongly disagree", "disagree", "neutral", "agree", "strongly agree"],
  ["never", "rarely", "sometimes", "often", "always"],
  ["poor", "fair", "good", "very good", "excellent"],
  ["minimal", "mild", "moderate", "severe"]
];

const TEST_LIBRARY = {
  independent_t_test: {
    name: "Independent t-test",
    explanation: "Compares the difference between two independent group means using a pooled estimate of the common variance.",
    assumptions: [
      "Independent observations within and across groups.",
      "The outcome is numeric and measured on a roughly interval scale.",
      "Group distributions are not strongly skewed and have similar variance."
    ]
  },
  welch_t_test: {
    name: "Welch t-test",
    explanation: "Compares the difference between two independent group means while allowing the group variances to differ.",
    assumptions: [
      "Independent observations within and across groups.",
      "The outcome is numeric and approximately continuous.",
      "Group variances may differ, but the mean remains a sensible summary."
    ]
  },
  paired_t_test: {
    name: "Paired t-test",
    explanation: "Tests whether the mean within-subject difference between two paired conditions is different from zero.",
    assumptions: [
      "Each pair corresponds to the same subject or matched unit measured twice.",
      "The paired differences are numeric and not strongly skewed.",
      "Pairs are complete and correctly matched."
    ]
  },
  mann_whitney_u: {
    name: "Mann-Whitney U",
    explanation: "Ranks observations from two independent groups and evaluates whether one group tends to have larger values than the other.",
    assumptions: [
      "Independent observations across the two groups.",
      "The outcome can be ordered meaningfully.",
      "The method is interpreted as a distributional shift, especially when shapes differ."
    ]
  },
  wilcoxon_signed_rank: {
    name: "Wilcoxon signed-rank",
    explanation: "Ranks the absolute paired differences and evaluates whether positive and negative differences are balanced around zero.",
    assumptions: [
      "Pairs are matched correctly and measured on the same subjects or units.",
      "The paired differences can be ordered meaningfully.",
      "Differences are roughly symmetric around the median difference."
    ]
  },
  one_way_anova: {
    name: "One-way ANOVA",
    explanation: "Partitions outcome variability into between-group and within-group components and tests whether at least one group mean differs.",
    assumptions: [
      "Independent observations across groups.",
      "The outcome is numeric.",
      "Group distributions are not severely skewed and variance is not extremely imbalanced."
    ]
  },
  kruskal_wallis: {
    name: "Kruskal-Wallis",
    explanation: "Ranks observations across multiple groups and tests whether at least one group tends to occupy different ranks.",
    assumptions: [
      "Independent observations across groups.",
      "The outcome can be ranked meaningfully.",
      "Interpretation is strongest when group distributions have similar shapes."
    ]
  },
  chi_square_independence: {
    name: "Chi-square test of independence",
    explanation: "Compares observed contingency-table counts to the expected counts under independence between two categorical variables.",
    assumptions: [
      "Observations contribute to one cell only.",
      "The variables are categorical.",
      "Expected cell counts are not too small for the chi-square approximation."
    ]
  },
  fisher_exact: {
    name: "Fisher exact test",
    explanation: "Computes the exact probability of a 2x2 contingency table, conditional on the observed margins.",
    assumptions: [
      "Observations contribute to one 2x2 cell only.",
      "The variables are categorical with exactly two levels each.",
      "Useful when expected counts are small and an exact calculation is preferred."
    ]
  },
  pearson_correlation: {
    name: "Pearson correlation",
    explanation: "Measures the strength and direction of the linear relationship between two numeric variables.",
    assumptions: [
      "Both variables are numeric.",
      "The relationship is approximately linear.",
      "Large outliers do not dominate the association."
    ]
  },
  spearman_correlation: {
    name: "Spearman correlation",
    explanation: "Ranks both variables and measures whether higher values in one variable tend to align with higher values in the other.",
    assumptions: [
      "Both variables can be ordered meaningfully.",
      "The relationship is monotonic rather than strictly linear.",
      "Interpretation is robust to non-normality but still sensitive to heavy ties."
    ]
  },
  simple_linear_regression: {
    name: "Simple linear regression",
    explanation: "Fits a straight-line model with one predictor to estimate how the expected outcome changes with the predictor.",
    assumptions: [
      "One numeric outcome and one numeric or encoded ordered predictor.",
      "The mean relationship is approximately linear.",
      "Residual variance is not dominated by strong outliers or severe heteroskedasticity."
    ]
  },
  binary_logistic_regression: {
    name: "Binary logistic regression",
    explanation: "Fits a one-predictor logistic model to estimate how the log-odds of a binary outcome change with the predictor.",
    assumptions: [
      "The outcome has exactly two levels.",
      "Observations are independent.",
      "The predictor has enough variation and the data are not perfectly separated."
    ]
  }
};

const state = {
  step: "upload",
  file: null,
  rawText: "",
  dataset: null,
  profile: [],
  typeOverrides: {},
  mapping: {
    outcome: "",
    grouping: "",
    pairing: "",
    covariates: [],
    predictors: []
  },
  objective: {
    goal: "compare-groups",
    design: "independent",
    tail: "two-sided",
    alpha: 0.05,
    parametric: "auto"
  },
  recommendation: null,
  result: null,
  headerEnabled: true
};

const dom = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheDom();
  bindEvents();
  resetWizard();
}

function cacheDom() {
  dom.panels = Array.from(document.querySelectorAll(".wizard-panel"));
  dom.stepIndicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
  dom.stepCaption = document.getElementById("stepCaption");
  dom.globalNotice = document.getElementById("globalNotice");
  dom.uploadDropzone = document.getElementById("uploadDropzone");
  dom.csvFileInput = document.getElementById("csvFileInput");
  dom.hasHeaderToggle = document.getElementById("hasHeaderToggle");
  dom.uploadFileMeta = document.getElementById("uploadFileMeta");
  dom.uploadError = document.getElementById("uploadError");
  dom.datasetSummaryChips = document.getElementById("datasetSummaryChips");
  dom.mappingDatasetWarnings = document.getElementById("mappingDatasetWarnings");
  dom.mappingError = document.getElementById("mappingError");
  dom.profileTableBody = document.getElementById("profileTableBody");
  dom.outcomeSelect = document.getElementById("outcomeSelect");
  dom.groupingSelect = document.getElementById("groupingSelect");
  dom.pairingSelect = document.getElementById("pairingSelect");
  dom.covariatesSelect = document.getElementById("covariatesSelect");
  dom.predictorsSelect = document.getElementById("predictorsSelect");
  dom.mappingFileSummary = document.getElementById("mappingFileSummary");
  dom.mappingContinueBtn = document.getElementById("mappingContinueBtn");
  dom.objectiveError = document.getElementById("objectiveError");
  dom.alphaInput = document.getElementById("alphaInput");
  dom.parametricPreference = document.getElementById("parametricPreference");
  dom.objectiveContinueBtn = document.getElementById("objectiveContinueBtn");
  dom.reviewError = document.getElementById("reviewError");
  dom.reviewStatusBadge = document.getElementById("reviewStatusBadge");
  dom.recommendedTestName = document.getElementById("recommendedTestName");
  dom.recommendedTestBadge = document.getElementById("recommendedTestBadge");
  dom.recommendedTestSummary = document.getElementById("recommendedTestSummary");
  dom.reviewWhyList = document.getElementById("reviewWhyList");
  dom.reviewExplanation = document.getElementById("reviewExplanation");
  dom.reviewAssumptions = document.getElementById("reviewAssumptions");
  dom.reviewWarnings = document.getElementById("reviewWarnings");
  dom.reviewAlternatives = document.getElementById("reviewAlternatives");
  dom.reviewSpecSummary = document.getElementById("reviewSpecSummary");
  dom.runAnalysisBtn = document.getElementById("runAnalysisBtn");
  dom.resultsBadge = document.getElementById("resultsBadge");
  dom.resultsOverview = document.getElementById("resultsOverview");
  dom.resultInterpretation = document.getElementById("resultInterpretation");
  dom.resultDetails = document.getElementById("resultDetails");
  dom.resultWarnings = document.getElementById("resultWarnings");
  dom.resultAssumptions = document.getElementById("resultAssumptions");
  dom.resultSpecSummary = document.getElementById("resultSpecSummary");
  dom.resultCoefficients = document.getElementById("resultCoefficients");
  dom.restartWizardBtn = document.getElementById("restartWizardBtn");
  dom.loader = document.getElementById("statsLoader");
  dom.loaderTitle = document.getElementById("statsLoaderTitle");
  dom.loaderSubtitle = document.getElementById("statsLoaderSubtitle");
}

function bindEvents() {
  dom.uploadDropzone?.addEventListener("click", () => dom.csvFileInput?.click());
  dom.uploadDropzone?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      dom.csvFileInput?.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dom.uploadDropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.uploadDropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    dom.uploadDropzone?.addEventListener(eventName, () => {
      dom.uploadDropzone.classList.remove("is-dragover");
    });
  });

  dom.uploadDropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  });

  dom.csvFileInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  });

  dom.hasHeaderToggle?.addEventListener("change", () => {
    state.headerEnabled = Boolean(dom.hasHeaderToggle.checked);
  });

  dom.mappingContinueBtn?.addEventListener("click", handleMappingContinue);
  dom.objectiveContinueBtn?.addEventListener("click", handleObjectiveContinue);
  dom.runAnalysisBtn?.addEventListener("click", handleRunAnalysis);
  dom.restartWizardBtn?.addEventListener("click", resetWizard);

  [dom.outcomeSelect, dom.groupingSelect, dom.pairingSelect, dom.covariatesSelect, dom.predictorsSelect].forEach((control) => {
    control?.addEventListener("change", () => {
      syncMappingFromControls();
    });
  });

  dom.profileTableBody?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-type-override]");
    if (!select) return;
    const columnName = select.getAttribute("data-column-name");
    state.typeOverrides[columnName] = select.value;
    renderMappingSelectors();
    renderProfileTable();
    renderDatasetWarnings();
  });

  document.querySelectorAll("input[name='goal'], input[name='design'], input[name='tail']").forEach((input) => {
    input.addEventListener("change", () => {
      syncObjectiveFromControls();
    });
  });

  dom.alphaInput?.addEventListener("change", syncObjectiveFromControls);
  dom.parametricPreference?.addEventListener("change", syncObjectiveFromControls);

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleNavigationAction(button.getAttribute("data-action"));
    });
  });
}

function resetWizard() {
  state.step = "upload";
  state.file = null;
  state.rawText = "";
  state.dataset = null;
  state.profile = [];
  state.typeOverrides = {};
  state.mapping = { outcome: "", grouping: "", pairing: "", covariates: [], predictors: [] };
  state.objective = {
    goal: "compare-groups",
    design: "independent",
    tail: "two-sided",
    alpha: 0.05,
    parametric: "auto"
  };
  state.recommendation = null;
  state.result = null;
  state.headerEnabled = true;

  if (dom.csvFileInput) dom.csvFileInput.value = "";
  if (dom.hasHeaderToggle) dom.hasHeaderToggle.checked = true;
  if (dom.uploadFileMeta) dom.uploadFileMeta.textContent = "";
  if (dom.alphaInput) dom.alphaInput.value = String(state.objective.alpha);
  if (dom.parametricPreference) dom.parametricPreference.value = state.objective.parametric;
  if (document.getElementById("goalCompare")) document.getElementById("goalCompare").checked = true;
  if (document.getElementById("designIndependent")) document.getElementById("designIndependent").checked = true;
  if (document.getElementById("tailTwoSided")) document.getElementById("tailTwoSided").checked = true;

  clearMessage(dom.uploadError);
  clearMessage(dom.mappingDatasetWarnings);
  clearMessage(dom.mappingError);
  clearMessage(dom.objectiveError);
  clearMessage(dom.reviewError);
  clearMessage(dom.globalNotice);

  renderUploadState();
  renderDatasetSummary();
  renderDatasetWarnings();
  renderMappingSelectors();
  renderProfileTable();
  renderRecommendation();
  renderResults();
  goToStep("upload");
}

function handleNavigationAction(action) {
  switch (action) {
    case "back-to-upload":
      goToStep("upload");
      break;
    case "back-to-map":
      goToStep("map");
      break;
    case "back-to-objective":
      goToStep("objective");
      break;
    case "back-to-review":
      goToStep("review");
      break;
    default:
      break;
  }
}

function goToStep(step) {
  state.step = step;
  dom.panels.forEach((panel) => {
    const isMatch = panel.dataset.step === step;
    panel.hidden = !isMatch;
    panel.classList.toggle("is-active", isMatch);
  });

  dom.stepIndicators.forEach((indicator) => {
    const index = STEP_ORDER.indexOf(indicator.dataset.stepIndicator);
    const currentIndex = STEP_ORDER.indexOf(step);
    indicator.classList.toggle("is-active", index === currentIndex);
    indicator.classList.toggle("is-complete", index < currentIndex);
  });

  if (dom.stepCaption) {
    dom.stepCaption.textContent = STEP_CAPTIONS[step] || "";
  }
}

function renderUploadState() {
  setMessage(dom.uploadError, "error", "", true);
}

async function handleSelectedFile(file) {
  clearMessage(dom.uploadError);
  clearMessage(dom.globalNotice);

  const fileError = validateIncomingFile(file);
  if (fileError) {
    setMessage(dom.uploadError, "error", fileError);
    return;
  }

  state.file = file;
  state.headerEnabled = Boolean(dom.hasHeaderToggle?.checked);
  if (dom.uploadFileMeta) {
    dom.uploadFileMeta.textContent = `${file.name} - ${formatBytes(file.size)}`;
  }

  try {
    await withLoader("Parsing CSV and profiling columns...", "Detecting the delimiter, validating structure, and inferring variable types.", async () => {
      const rawText = await file.text();
      const dataset = analyzeCsvText(rawText, { hasHeader: state.headerEnabled });
      state.rawText = rawText;
      state.dataset = dataset;
      state.profile = dataset.profile;
      state.typeOverrides = Object.fromEntries(dataset.profile.map((column) => [column.name, column.inferredType]));
      state.mapping = suggestDefaultMapping();
      state.recommendation = null;
      state.result = null;
    });

    renderDatasetSummary();
    renderDatasetWarnings();
    renderMappingSelectors();
    renderProfileTable();
    renderRecommendation();
    renderResults();
    goToStep("map");
  } catch (error) {
    setMessage(dom.uploadError, "error", error.message || "The CSV could not be parsed.");
  }
}

function validateIncomingFile(file) {
  if (!file) {
    return "Choose a CSV file to continue.";
  }
  const isCsvName = /\.csv$/i.test(file.name || "");
  const isCsvType = String(file.type || "").toLowerCase().includes("csv");
  if (!isCsvName && !isCsvType) {
    return "Only CSV files are supported on this page.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "This file is larger than 1MB. Please upload a smaller CSV.";
  }
  return "";
}

async function withLoader(title, subtitle, task) {
  if (dom.loaderTitle) dom.loaderTitle.textContent = title;
  if (dom.loaderSubtitle) dom.loaderSubtitle.textContent = subtitle;
  dom.loader?.classList.remove("hidden");

  const startedAt = performance.now();
  try {
    const output = await task();
    const elapsed = performance.now() - startedAt;
    if (elapsed < 420) {
      await sleep(420 - elapsed);
    }
    return output;
  } finally {
    dom.loader?.classList.add("hidden");
  }
}

function analyzeCsvText(text, { hasHeader }) {
  const normalized = String(text || "").replace(/^\uFEFF/, "");
  if (!normalized.trim()) {
    throw new Error("This CSV is empty. Upload a file with a header row and at least one data row.");
  }

  const delimiterInfo = detectDelimiter(normalized);
  const parsed = parseCsv(normalized, delimiterInfo.delimiter);
  if (parsed.error) {
    throw new Error(parsed.error);
  }

  let rows = parsed.rows.filter((row) => row.some((cell) => String(cell || "").trim() !== ""));
  if (!rows.length) {
    throw new Error("This CSV is empty. Upload a file with at least one non-empty row.");
  }

  let headers;
  let dataRows;
  if (hasHeader) {
    headers = rows[0];
    dataRows = rows.slice(1);
  } else {
    dataRows = rows;
    headers = Array.from({ length: getMaxRowLength(rows) }, (_, index) => `Column ${index + 1}`);
  }

  if (!dataRows.length) {
    throw new Error("The CSV contains headers but no data rows.");
  }

  const width = Math.max(headers.length, getMaxRowLength(dataRows));
  headers = normalizeHeaders(headers, width);
  dataRows = dataRows.map((row) => padRow(row, width));

  const records = dataRows.map((row, index) => {
    const record = { __rowNumber: index + 1 };
    headers.forEach((header, columnIndex) => {
      record[header] = String(row[columnIndex] ?? "").trim();
    });
    return record;
  });

  return {
    delimiter: delimiterInfo.delimiter,
    headers,
    rows: dataRows,
    records,
    rowCount: records.length,
    columnCount: headers.length,
    profile: buildDatasetProfile(headers, dataRows),
    notes: delimiterInfo.notes
  };
}

function detectDelimiter(text) {
  const candidates = [",", ";", "\t", "|"];
  const scores = [];

  candidates.forEach((delimiter) => {
    const preview = parseCsv(text, delimiter, { limitRows: 25 });
    if (preview.error || !preview.rows.length) return;

    const widths = preview.rows
      .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
      .slice(0, 12)
      .map((row) => row.length);

    if (!widths.length) return;

    const maxWidth = Math.max(...widths);
    const minWidth = Math.min(...widths);
    const consistentCount = widths.filter((width) => width === maxWidth).length;
    const consistency = consistentCount / widths.length;
    const score = maxWidth * 100 + consistency * 10 - (maxWidth - minWidth);

    scores.push({ delimiter, score });
  });

  if (!scores.length) {
    return { delimiter: ",", notes: ["Delimiter defaulted to a comma."] };
  }

  scores.sort((left, right) => right.score - left.score);
  return { delimiter: scores[0].delimiter, notes: [] };
}

function parseCsv(text, delimiter, options = {}) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let justClosedQuote = false;
  const limitRows = options.limitRows ?? Infinity;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (inQuotes) {
      if (char === "\"") {
        if (normalized[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      if (field.length === 0) {
        inQuotes = true;
        continue;
      }
      return { error: "Malformed CSV detected. A quote appears inside an unquoted field.", rows: [] };
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      justClosedQuote = false;
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      if (rows.length >= limitRows) {
        break;
      }
      row = [];
      field = "";
      justClosedQuote = false;
      continue;
    }

    if (justClosedQuote) {
      if (/\s/.test(char)) {
        continue;
      }
      return { error: "Malformed CSV detected. Found extra characters after a closing quote.", rows: [] };
    }

    field += char;
  }

  if (inQuotes) {
    return { error: "Malformed CSV detected. A quoted field was not closed.", rows: [] };
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return { rows };
}

function normalizeHeaders(rawHeaders, width) {
  const headers = Array.from({ length: width }, (_, index) => {
    const raw = String(rawHeaders[index] ?? "").trim();
    return raw || `Column ${index + 1}`;
  });

  const seen = new Map();
  return headers.map((header) => {
    const key = header.toLowerCase();
    const count = seen.get(key) || 0;
    seen.set(key, count + 1);
    return count === 0 ? header : `${header} (${count + 1})`;
  });
}

function padRow(row, width) {
  return Array.from({ length: width }, (_, index) => String(row[index] ?? ""));
}

function getMaxRowLength(rows) {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function buildDatasetProfile(headers, rows) {
  return headers.map((header, columnIndex) => {
    const values = rows.map((row) => String(row[columnIndex] ?? "").trim());
    const nonMissingValues = values.filter((value) => !isMissing(value));
    const numericValues = nonMissingValues.map(parseLocaleNumber).filter(Number.isFinite);
    const uniqueValues = uniquePreserveOrder(nonMissingValues);
    const inferredType = inferColumnType(nonMissingValues, numericValues, uniqueValues);

    return {
      name: header,
      inferredType,
      missingCount: values.length - nonMissingValues.length,
      missingRatio: values.length ? (values.length - nonMissingValues.length) / values.length : 0,
      uniqueCount: uniqueValues.length,
      sampleValues: uniqueValues.slice(0, 4),
      numericSummary: numericValues.length ? summarizeNumeric(numericValues) : null,
      numericLikeRatio: nonMissingValues.length ? numericValues.length / nonMissingValues.length : 0,
      hasVariance: uniqueValues.length > 1
    };
  });
}

function inferColumnType(nonMissingValues, numericValues, uniqueValues) {
  if (!nonMissingValues.length) return "categorical";
  if (uniqueValues.length <= 2) return "binary";
  if (matchesOrdinalSequence(uniqueValues)) return "ordinal";

  const numericRatio = numericValues.length / nonMissingValues.length;
  if (numericRatio >= 0.9) {
    const distinctNumeric = uniquePreserveOrder(numericValues.map((value) => String(value)));
    const allIntegers = numericValues.every((value) => Number.isInteger(value));
    if (allIntegers && distinctNumeric.length >= 3 && distinctNumeric.length <= 7) {
      return "ordinal";
    }
    return "numeric";
  }

  return "categorical";
}

function matchesOrdinalSequence(uniqueValues) {
  const lowerValues = uniqueValues.map((value) => canonicalValue(value));
  return ORDINAL_SEQUENCES.some((sequence) => {
    const set = new Set(sequence);
    return lowerValues.length >= 3 && lowerValues.every((value) => set.has(value));
  });
}

function summarizeNumeric(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    n: values.length,
    mean: mean(values),
    median: median(sorted),
    stdDev: stdDev(values),
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

function suggestDefaultMapping() {
  const activeColumns = state.profile.filter((column) => getEffectiveType(column.name) !== "ignore");
  const numericColumns = activeColumns.filter((column) => ["numeric", "ordinal", "binary"].includes(getEffectiveType(column.name)));
  const categoricalColumns = activeColumns.filter((column) => ["categorical", "binary", "ordinal"].includes(getEffectiveType(column.name)));

  const outcome = numericColumns[0]?.name || activeColumns[0]?.name || "";
  const grouping = categoricalColumns.find((column) => column.name !== outcome)?.name || "";
  const pairing = activeColumns.find((column) => column.name !== outcome && column.name !== grouping && column.uniqueCount >= Math.max(3, Math.floor((state.dataset?.rowCount || 0) * 0.85)))?.name || "";
  const predictor = numericColumns.find((column) => column.name !== outcome)?.name;

  return {
    outcome,
    grouping,
    pairing,
    covariates: [],
    predictors: predictor ? [predictor] : []
  };
}

function renderDatasetSummary() {
  if (!dom.datasetSummaryChips) return;
  if (!state.dataset) {
    dom.datasetSummaryChips.innerHTML = "";
    if (dom.mappingFileSummary) dom.mappingFileSummary.textContent = "No file has been parsed yet.";
    return;
  }

  const chips = [
    `Rows: ${state.dataset.rowCount.toLocaleString()}`,
    `Columns: ${state.dataset.columnCount}`,
    `Delimiter: ${humanizeDelimiter(state.dataset.delimiter)}`,
    `Headers: ${state.headerEnabled ? "Yes" : "Generated"}`
  ];

  dom.datasetSummaryChips.innerHTML = chips.map((chip) => `<span class="summary-chip">${escapeHtml(chip)}</span>`).join("");

  if (dom.mappingFileSummary) {
    const noteText = state.dataset.notes?.length ? ` ${state.dataset.notes.join(" ")}` : "";
    dom.mappingFileSummary.textContent = `${state.file?.name || "CSV"} with ${state.dataset.rowCount.toLocaleString()} data row(s) and ${state.dataset.columnCount} column(s).${noteText}`;
  }
}

function renderDatasetWarnings() {
  if (!state.profile.length) {
    clearMessage(dom.mappingDatasetWarnings);
    return;
  }

  const effectiveProfiles = state.profile.map((column) => ({
    ...column,
    effectiveType: getEffectiveType(column.name)
  }));

  const warnings = [];
  if (!effectiveProfiles.some((column) => ["numeric", "ordinal", "binary"].includes(column.effectiveType))) {
    warnings.push("No numeric or ordered columns were detected. Parametric and ranked outcome tests may not be available.");
  }
  if (!effectiveProfiles.some((column) => ["categorical", "binary", "ordinal"].includes(column.effectiveType))) {
    warnings.push("No categorical columns were detected. Group comparison and contingency-table tests may be limited.");
  }

  const constants = effectiveProfiles.filter((column) => column.uniqueCount <= 1).map((column) => column.name);
  if (constants.length) {
    warnings.push(`Constant-value column(s) detected: ${constants.slice(0, 4).join(", ")}${constants.length > 4 ? ", ..." : ""}.`);
  }

  if (warnings.length) {
    setMessage(dom.mappingDatasetWarnings, "warning", warnings.join(" "));
  } else {
    clearMessage(dom.mappingDatasetWarnings);
  }
}

function renderMappingSelectors() {
  const options = state.profile.map((column) => ({
    value: column.name,
    label: `${column.name} (${getEffectiveType(column.name)})`
  }));

  populateSelect(dom.outcomeSelect, options, "Select an outcome");
  populateSelect(dom.groupingSelect, options, "Optional grouping variable");
  populateSelect(dom.pairingSelect, options, "Optional subject ID");
  populateMultiSelect(dom.covariatesSelect, options);
  populateMultiSelect(dom.predictorsSelect, options);

  if (dom.outcomeSelect) dom.outcomeSelect.value = state.mapping.outcome || "";
  if (dom.groupingSelect) dom.groupingSelect.value = state.mapping.grouping || "";
  if (dom.pairingSelect) dom.pairingSelect.value = state.mapping.pairing || "";
  setMultiSelectValues(dom.covariatesSelect, state.mapping.covariates);
  setMultiSelectValues(dom.predictorsSelect, state.mapping.predictors);
}

function renderProfileTable() {
  if (!dom.profileTableBody) return;
  if (!state.profile.length) {
    dom.profileTableBody.innerHTML = `
      <tr>
        <td data-label="Column" colspan="5" class="text-center text-gray-500 py-8">
          Upload a CSV to see the column profile and type controls.
        </td>
      </tr>
    `;
    return;
  }

  dom.profileTableBody.innerHTML = state.profile
    .map((column) => {
      const override = getEffectiveType(column.name);

      return `
        <tr>
          <td data-label="Column"><div class="column-name">${escapeHtml(column.name)}</div></td>
          <td data-label="Inferred"><span class="type-badge ${escapeHtml(column.inferredType)}">${escapeHtml(column.inferredType)}</span></td>
          <td data-label="Missing">${column.missingCount} (${formatPercent(column.missingRatio)})</td>
          <td data-label="Unique">${column.uniqueCount}</td>
          <td data-label="Override" class="text-right">
            <select class="field-input" data-type-override data-column-name="${escapeHtmlAttribute(column.name)}">
              ${["numeric", "categorical", "ordinal", "binary", "ignore"]
                .map((type) => `<option value="${type}" ${override === type ? "selected" : ""}>${humanizeType(type)}</option>`)
                .join("")}
            </select>
          </td>
        </tr>
      `;
    })
    .join("");
}

function handleMappingContinue() {
  syncMappingFromControls();
  const errors = validateMappingSelections();
  if (errors.length) {
    setMessage(dom.mappingError, "error", errors.join(" "));
    return;
  }

  clearMessage(dom.mappingError);
  goToStep("objective");
}

function syncMappingFromControls() {
  state.mapping.outcome = dom.outcomeSelect?.value || "";
  state.mapping.grouping = dom.groupingSelect?.value || "";
  state.mapping.pairing = dom.pairingSelect?.value || "";
  state.mapping.covariates = getMultiSelectValues(dom.covariatesSelect);
  state.mapping.predictors = getMultiSelectValues(dom.predictorsSelect);
}

function validateMappingSelections() {
  const errors = [];
  if (!state.mapping.outcome) {
    errors.push("Select an outcome variable before continuing.");
  }

  if (!state.mapping.grouping && !state.mapping.predictors.length) {
    errors.push("Choose at least one grouping or predictor variable.");
  }

  const selections = [
    state.mapping.outcome,
    state.mapping.grouping,
    state.mapping.pairing,
    ...state.mapping.covariates,
    ...state.mapping.predictors
  ].filter(Boolean);

  const duplicates = findDuplicates(selections);
  if (duplicates.length) {
    errors.push(`A column can only fill one role at a time: ${duplicates.join(", ")}.`);
  }

  if (state.mapping.outcome && getEffectiveType(state.mapping.outcome) === "ignore") {
    errors.push("The selected outcome variable is marked as ignored.");
  }

  return errors;
}

function syncObjectiveFromControls() {
  state.objective.goal = getCheckedValue("goal") || "compare-groups";
  state.objective.design = getCheckedValue("design") || "independent";
  state.objective.tail = getCheckedValue("tail") || "two-sided";
  state.objective.alpha = clamp(Number(dom.alphaInput?.value || 0.05), 0.001, 0.2);
  state.objective.parametric = dom.parametricPreference?.value || "auto";
  if (dom.alphaInput) {
    dom.alphaInput.value = String(state.objective.alpha);
  }
}

function handleObjectiveContinue() {
  syncMappingFromControls();
  syncObjectiveFromControls();

  const errors = validateObjectiveSelections();
  if (errors.length) {
    setMessage(dom.objectiveError, "error", errors.join(" "));
    return;
  }

  clearMessage(dom.objectiveError);
  runRecommendationFlow();
}

async function runRecommendationFlow() {
  try {
    await withLoader("Generating recommendation...", "Reviewing mapped roles, diagnostics, and alternative statistical paths.", async () => {
      state.recommendation = generateRecommendation();
    });

    renderRecommendation();
    goToStep("review");
  } catch (error) {
    setMessage(dom.objectiveError, "error", error.message || "The recommendation engine could not complete the analysis setup.");
  }
}

function validateObjectiveSelections() {
  const errors = [];
  if (!Number.isFinite(state.objective.alpha) || state.objective.alpha <= 0 || state.objective.alpha >= 1) {
    errors.push("Alpha must be between 0 and 1.");
  }

  if (!state.mapping.outcome) {
    errors.push("Select an outcome variable before defining the objective.");
  }

  if (state.objective.goal === "compare-groups") {
    if (!state.mapping.grouping) {
      errors.push("A grouping variable is required for group comparison.");
    }
    if (state.objective.design === "paired" && !state.mapping.pairing) {
      errors.push("A pairing or subject ID variable is required for paired designs.");
    }
  }

  if (["measure-correlation", "predict-outcome"].includes(state.objective.goal) && state.mapping.predictors.length !== 1) {
    errors.push("This page currently supports exactly one predictor variable for correlation and prediction workflows.");
  }

  if (state.objective.goal === "predict-outcome" && state.mapping.covariates.length) {
    errors.push("The current browser-side regression engine supports one predictor and no covariate adjustment.");
  }

  if (state.objective.goal === "test-association" && !state.mapping.grouping && !state.mapping.predictors.length) {
    errors.push("Test association requires either a grouping variable or one predictor variable.");
  }

  return errors;
}

function generateRecommendation() {
  const spec = getCurrentSpec();

  switch (state.objective.goal) {
    case "compare-groups":
      return recommendComparison(spec);
    case "test-association":
      return recommendAssociation(spec);
    case "measure-correlation":
      return recommendCorrelation(spec);
    case "predict-outcome":
      return recommendPrediction(spec);
    default:
      throw new Error("The selected goal is not supported.");
  }
}

function recommendComparison(spec) {
  if (!spec.grouping) {
    throw new Error("A grouping variable is required for group comparison.");
  }

  const outcomeType = getEffectiveType(spec.outcome);

  if (spec.design === "paired") {
    if (!spec.pairing) {
      throw new Error("A pairing variable is required for paired group comparison.");
    }
    if (!["numeric", "ordinal", "binary"].includes(outcomeType)) {
      throw new Error("Paired browser-side execution currently requires a numeric, binary, or ordinal outcome.");
    }

    const pairedContext = preparePairedNumericGroups(spec.outcome, spec.grouping, spec.pairing);
    const reasons = [
      `The design is paired and uses ${pairedContext.totalUsed} complete matched pair(s).`,
      `The outcome column "${spec.outcome}" is treated as ${humanizeType(outcomeType)}.`,
      `The comparison uses the two repeated conditions "${pairedContext.levels[0]}" and "${pairedContext.levels[1]}".`
    ];

    const warnings = [...pairedContext.warnings];
    let testId = "paired_t_test";
    if (state.objective.parametric === "non-parametric-only" || outcomeType === "ordinal" || (state.objective.parametric === "auto" && !pairedContext.parametricReady.ready)) {
      testId = "wilcoxon_signed_rank";
    }

    return finalizeRecommendation(testId, {
      summary: `${TEST_LIBRARY[testId].name} is recommended for a paired two-condition design with a ${humanizeType(outcomeType)} outcome.`,
      reasons,
      warnings,
      alternatives: buildAlternativeNotes(testId, pairedContext.parametricReady.ready ? "Paired differences can still support a mean-based paired test." : "The paired differences are not ideal for a mean-based paired test."),
      payload: pairedContext,
      executionMeta: `Running on ${pairedContext.totalUsed} complete pair(s). Difference direction is evaluated as ${pairedContext.levels[0]} minus ${pairedContext.levels[1]}.`,
      ignoredDesignNote: null
    });
  }

  if (["categorical", "binary"].includes(outcomeType)) {
    const table = prepareContingency(spec.outcome, spec.grouping);

    const useFisher = table.isTwoByTwo && table.lowExpectedCount;
    const testId = useFisher ? "fisher_exact" : "chi_square_independence";
    const reasons = [
      `Both "${spec.outcome}" and "${spec.grouping}" are treated as categorical variables.`,
      `The observed contingency table is ${table.rowLevels.length}x${table.columnLevels.length}.`,
      useFisher ? "At least one expected count is small, so an exact 2x2 method is safer than the chi-square approximation." : "Expected counts are adequate for a standard independence test."
    ];

    return finalizeRecommendation(testId, {
      summary: `${TEST_LIBRARY[testId].name} is recommended because both mapped variables are categorical and the question is about differences in group composition.`,
      reasons,
      warnings: table.warnings,
      alternatives: buildAlternativeNotes(testId, useFisher ? "The 2x2 table contains small expected counts." : "The contingency table is suitable for a standard large-sample approximation."),
      payload: table,
      executionMeta: `Running on ${table.totalUsed} complete case(s) across ${table.rowLevels.length} outcome level(s) and ${table.columnLevels.length} group level(s).`,
      ignoredDesignNote: null
    });
  }

  const context = prepareIndependentNumericGroups(spec.outcome, spec.grouping);

  let testId;
  if (context.groups.length === 2) {
    if (state.objective.parametric === "non-parametric-only" || outcomeType === "ordinal" || (state.objective.parametric === "auto" && !context.parametricReady.ready)) {
      testId = "mann_whitney_u";
    } else if (state.objective.parametric === "parametric-only") {
      testId = context.varianceRatio && context.varianceRatio <= 2.5 ? "independent_t_test" : "welch_t_test";
    } else {
      testId = context.parametricReady.ready && context.varianceRatio && context.varianceRatio <= 2.5 ? "independent_t_test" : context.parametricReady.ready ? "welch_t_test" : "mann_whitney_u";
    }
  } else {
    testId = state.objective.parametric === "non-parametric-only" || outcomeType === "ordinal" || (state.objective.parametric === "auto" && !context.parametricReady.ready)
      ? "kruskal_wallis"
      : "one_way_anova";
  }

  const reasons = [
    `The outcome "${spec.outcome}" is treated as ${humanizeType(outcomeType)} and grouped by "${spec.grouping}".`,
    `The data contain ${context.groups.length} observed group(s) after dropping incomplete rows.`,
    context.groups.length === 2
      ? `The variance ratio across the two groups is ${context.varianceRatio ? formatNumber(context.varianceRatio) : "not available"}.`
      : `The smallest group size is ${context.parametricReady.minGroupSize}.`
  ];

  return finalizeRecommendation(testId, {
    summary: `${TEST_LIBRARY[testId].name} is recommended for a ${context.groups.length}-group comparison with a ${humanizeType(outcomeType)} outcome.`,
    reasons,
    warnings: context.warnings,
    alternatives: buildAlternativeNotes(testId, context.parametricReady.ready ? "The group distributions are reasonably suitable for parametric summaries." : "Distributional diagnostics point away from a mean-based parametric summary."),
    payload: context,
    executionMeta: `Running on ${context.totalUsed} complete observation(s) across ${context.groups.length} group(s). Difference direction for two-group tests is ${context.groups[0]?.label || "Group 1"} minus ${context.groups[1]?.label || "Group 2"}.`,
    ignoredDesignNote: null
  });
}

function recommendAssociation(spec) {
  if (spec.grouping) {
    return recommendComparison(spec);
  }

  const predictor = spec.predictors[0];
  if (!predictor) {
    throw new Error("Choose one predictor or grouping variable to test association.");
  }

  const outcomeType = getEffectiveType(spec.outcome);
  const predictorType = getEffectiveType(predictor);
  const ignoredDesignNote = state.objective.design === "paired" ? "The paired design toggle is not used for this association setup." : null;

  if (["categorical", "binary"].includes(outcomeType) && ["categorical", "binary"].includes(predictorType)) {
    const table = prepareContingency(spec.outcome, predictor);
    const useFisher = table.isTwoByTwo && table.lowExpectedCount;
    const testId = useFisher ? "fisher_exact" : "chi_square_independence";
    return finalizeRecommendation(testId, {
      summary: `${TEST_LIBRARY[testId].name} is recommended because both mapped variables are categorical.`,
      reasons: [
        `The outcome "${spec.outcome}" and predictor "${predictor}" are both categorical.`,
        `The contingency table is ${table.rowLevels.length}x${table.columnLevels.length}.`,
        useFisher ? "Small expected counts make an exact 2x2 calculation safer." : "Expected counts are adequate for the chi-square approximation."
      ],
      warnings: table.warnings,
      alternatives: buildAlternativeNotes(testId, useFisher ? "Small expected counts make the exact route preferable." : "The contingency table supports a standard large-sample approximation."),
      payload: table,
      executionMeta: `Running on ${table.totalUsed} complete case(s).`,
      ignoredDesignNote
    });
  }

  if (outcomeType === "binary") {
    const logisticContext = prepareBinaryOutcomePredictor(spec.outcome, predictor);
    return finalizeRecommendation("binary_logistic_regression", {
      summary: `Binary logistic regression is recommended because the outcome "${spec.outcome}" is binary and the predictor "${predictor}" can be encoded numerically.`,
      reasons: [
        `The outcome "${spec.outcome}" has exactly two observed levels.`,
        `The predictor "${predictor}" is treated as ${humanizeType(predictorType)}.`,
        "The association is framed through a change in log-odds rather than a mean difference."
      ],
      warnings: logisticContext.warnings,
      alternatives: buildAlternativeNotes("binary_logistic_regression", "The current browser-side predictor/outcome pairing is naturally modeled through binary odds."),
      payload: logisticContext,
      executionMeta: `Running on ${logisticContext.totalUsed} complete case(s). The event level is "${logisticContext.outcomeLabels[1]}".`,
      ignoredDesignNote
    });
  }

  const pairContext = prepareNumericPair(spec.outcome, predictor);
  const preferSpearman = state.objective.parametric === "non-parametric-only"
    || outcomeType === "ordinal"
    || predictorType === "ordinal"
    || (state.objective.parametric === "auto" && !pairContext.parametricReady.ready);
  const testId = preferSpearman ? "spearman_correlation" : "pearson_correlation";

  return finalizeRecommendation(testId, {
    summary: `${TEST_LIBRARY[testId].name} is recommended for the association between "${spec.outcome}" and "${predictor}".`,
    reasons: [
      `The outcome "${spec.outcome}" and predictor "${predictor}" can both be analyzed on an ordered numeric scale.`,
      `There are ${pairContext.totalUsed} complete paired observations available.`,
      preferSpearman ? "A rank-based association is safer for the current diagnostics or type selection." : "A linear association summary is appropriate for the current diagnostics."
    ],
    warnings: pairContext.warnings,
    alternatives: buildAlternativeNotes(testId, preferSpearman ? "Current diagnostics favor a monotonic rank-based summary." : "Current diagnostics support a standard linear association summary."),
    payload: pairContext,
    executionMeta: `Running on ${pairContext.totalUsed} complete observation pair(s).`,
    ignoredDesignNote
  });
}

function recommendCorrelation(spec) {
  const predictor = spec.predictors[0];
  if (!predictor) {
    throw new Error("Choose one predictor variable to measure correlation.");
  }

  const outcomeType = getEffectiveType(spec.outcome);
  const predictorType = getEffectiveType(predictor);
  const pairContext = prepareNumericPair(spec.outcome, predictor);
  const preferSpearman = state.objective.parametric === "non-parametric-only"
    || outcomeType === "ordinal"
    || predictorType === "ordinal"
    || (state.objective.parametric === "auto" && !pairContext.parametricReady.ready);
  const testId = preferSpearman ? "spearman_correlation" : "pearson_correlation";

  return finalizeRecommendation(testId, {
    summary: `${TEST_LIBRARY[testId].name} is recommended for the ordered relationship between "${spec.outcome}" and "${predictor}".`,
    reasons: [
      `Both mapped variables can be analyzed on an ordered numeric scale.`,
      `There are ${pairContext.totalUsed} complete paired observations.`,
      preferSpearman ? "A monotonic rank-based summary is safer for the selected types or diagnostics." : "A linear correlation summary is appropriate for the current diagnostics."
    ],
    warnings: [
      ...pairContext.warnings,
      ...(state.objective.design === "paired" ? ["The paired design toggle is not used for correlation workflows."] : [])
    ],
    alternatives: buildAlternativeNotes(testId, preferSpearman ? "Ranks provide a safer summary under the current conditions." : "A direct linear correlation is appropriate for the current conditions."),
    payload: pairContext,
    executionMeta: `Running on ${pairContext.totalUsed} complete observation pair(s).`,
    ignoredDesignNote: null
  });
}

function recommendPrediction(spec) {
  const predictor = spec.predictors[0];
  if (!predictor) {
    throw new Error("Choose one predictor variable to build a prediction-oriented model.");
  }

  const outcomeType = getEffectiveType(spec.outcome);
  const predictorType = getEffectiveType(predictor);
  const ignoredDesignNote = state.objective.design === "paired" ? "The paired design toggle is not used for one-predictor regression workflows." : null;

  if (outcomeType === "binary") {
    const logisticContext = prepareBinaryOutcomePredictor(spec.outcome, predictor);
    return finalizeRecommendation("binary_logistic_regression", {
      summary: `Binary logistic regression is recommended because the outcome "${spec.outcome}" has two levels.`,
      reasons: [
        `The outcome "${spec.outcome}" is binary.`,
        `The predictor "${predictor}" is treated as ${humanizeType(predictorType)} and can be encoded numerically.`,
        "The requested workflow is prediction-oriented, so the model reports coefficients and odds-based interpretation."
      ],
      warnings: logisticContext.warnings,
      alternatives: buildAlternativeNotes("binary_logistic_regression", "A binary outcome calls for an odds-based model instead of a mean-based regression line."),
      payload: logisticContext,
      executionMeta: `Running on ${logisticContext.totalUsed} complete case(s). The event level is "${logisticContext.outcomeLabels[1]}".`,
      ignoredDesignNote
    });
  }

  if (!["numeric", "ordinal", "binary"].includes(outcomeType)) {
    throw new Error("Simple browser-side regression currently requires a numeric, ordinal, or binary-encoded outcome.");
  }

  const regressionContext = prepareNumericPair(spec.outcome, predictor);
  return finalizeRecommendation("simple_linear_regression", {
    summary: `Simple linear regression is recommended because the outcome "${spec.outcome}" can be modeled from one predictor "${predictor}".`,
    reasons: [
      `The outcome "${spec.outcome}" is treated as ${humanizeType(outcomeType)}.`,
      `The predictor "${predictor}" is treated as ${humanizeType(predictorType)}.`,
      "The selected workflow asks for a one-predictor model rather than a pure correlation summary."
    ],
    warnings: regressionContext.warnings,
    alternatives: buildAlternativeNotes("simple_linear_regression", "A regression model provides coefficients, fit statistics, and prediction-oriented interpretation."),
    payload: regressionContext,
    executionMeta: `Running on ${regressionContext.totalUsed} complete case(s).`,
    ignoredDesignNote
  });
}

function finalizeRecommendation(testId, config) {
  const libraryEntry = TEST_LIBRARY[testId];
  if (!libraryEntry) {
    throw new Error("The selected statistical method is not defined in the test library.");
  }

  const warnings = uniquePreserveOrder([
    ...config.warnings,
    ...(config.ignoredDesignNote ? [config.ignoredDesignNote] : []),
    ...(state.mapping.covariates.length ? ["Selected covariates are recorded in the experiment specification, but they are not adjusted for by the current browser-side execution engine."] : [])
  ]);

  const statusLabel = warnings.length ? "Review warnings" : "Ready to run";
  const statusClass = warnings.length ? "neutral" : "";

  return {
    testId,
    testName: libraryEntry.name,
    summary: config.summary,
    reasons: config.reasons,
    explanation: libraryEntry.explanation,
    assumptions: libraryEntry.assumptions,
    warnings,
    alternatives: config.alternatives,
    payload: config.payload,
    executionMeta: config.executionMeta,
    statusLabel,
    statusClass,
    specRows: buildSpecRows(libraryEntry.name)
  };
}

function getCurrentSpec() {
  return {
    outcome: state.mapping.outcome,
    grouping: state.mapping.grouping,
    pairing: state.mapping.pairing,
    covariates: [...state.mapping.covariates],
    predictors: [...state.mapping.predictors],
    goal: state.objective.goal,
    design: state.objective.design,
    tail: state.objective.tail,
    alpha: state.objective.alpha,
    parametric: state.objective.parametric
  };
}

function buildSpecRows(recommendedTest) {
  return [
    { label: "Recommended test", value: recommendedTest || "Pending" },
    { label: "Outcome", value: state.mapping.outcome || "Not selected" },
    { label: "Grouping", value: state.mapping.grouping || "Not selected" },
    { label: "Pairing ID", value: state.mapping.pairing || "Not selected" },
    { label: "Predictor(s)", value: state.mapping.predictors.length ? state.mapping.predictors.join(", ") : "Not selected" },
    { label: "Covariates", value: state.mapping.covariates.length ? state.mapping.covariates.join(", ") : "None" },
    { label: "Goal", value: humanizeGoal(state.objective.goal) },
    { label: "Design", value: humanizeDesign(state.objective.design) },
    { label: "Tail", value: humanizeTail(state.objective.tail) },
    { label: "Alpha", value: String(state.objective.alpha) },
    { label: "Parametric preference", value: humanizeParametricPreference(state.objective.parametric) }
  ];
}

function buildAlternativeNotes(selectedTestId, rationale) {
  const candidates = {
    independent_t_test: [
      { name: TEST_LIBRARY.welch_t_test.name, reason: "Not selected because the current variance balance does not require the unequal-variance correction." },
      { name: TEST_LIBRARY.mann_whitney_u.name, reason: "Not selected because the current setup still supports a mean-based independent comparison." }
    ],
    welch_t_test: [
      { name: TEST_LIBRARY.independent_t_test.name, reason: "Not selected because the current group variances look too imbalanced for a pooled-variance shortcut." },
      { name: TEST_LIBRARY.mann_whitney_u.name, reason: "Not selected because the current diagnostics still support a mean-based comparison with unequal variances." }
    ],
    paired_t_test: [
      { name: TEST_LIBRARY.wilcoxon_signed_rank.name, reason: "Not selected because the paired differences can still support a mean-based parametric summary." }
    ],
    wilcoxon_signed_rank: [
      { name: TEST_LIBRARY.paired_t_test.name, reason: "Not selected because the paired differences are better handled with a rank-based paired summary." }
    ],
    mann_whitney_u: [
      { name: TEST_LIBRARY.welch_t_test.name, reason: "Not selected because the current diagnostics point away from a mean-based two-group comparison." }
    ],
    one_way_anova: [
      { name: TEST_LIBRARY.kruskal_wallis.name, reason: "Not selected because the group diagnostics still allow a mean-based omnibus comparison." }
    ],
    kruskal_wallis: [
      { name: TEST_LIBRARY.one_way_anova.name, reason: "Not selected because the current diagnostics point away from a mean-based omnibus comparison." }
    ],
    chi_square_independence: [
      { name: TEST_LIBRARY.fisher_exact.name, reason: "Not selected because the observed contingency table does not require an exact 2x2 small-sample method." }
    ],
    fisher_exact: [
      { name: TEST_LIBRARY.chi_square_independence.name, reason: "Not selected because the 2x2 table has small expected counts, so the exact route is safer." }
    ],
    pearson_correlation: [
      { name: TEST_LIBRARY.spearman_correlation.name, reason: "Not selected because the current setup supports a direct linear association summary." },
      { name: TEST_LIBRARY.simple_linear_regression.name, reason: "Not selected because the objective emphasizes association strength rather than a prediction-oriented model coefficient." }
    ],
    spearman_correlation: [
      { name: TEST_LIBRARY.pearson_correlation.name, reason: "Not selected because a rank-based monotonic summary is safer for the current diagnostics or data type." }
    ],
    simple_linear_regression: [
      { name: TEST_LIBRARY.pearson_correlation.name, reason: "Not selected because the objective asks for model coefficients and fitted predictions, not only association strength." }
    ],
    binary_logistic_regression: [
      { name: TEST_LIBRARY.pearson_correlation.name, reason: "Not selected because a binary outcome is better modeled through odds than through linear correlation." }
    ]
  };

  return uniquePreserveOrder([...(candidates[selectedTestId] || []), { name: "Selector note", reason: rationale }], (entry) => `${entry.name}|${entry.reason}`);
}

function prepareIndependentNumericGroups(outcomeName, groupingName) {
  const outcomeEncoder = buildColumnEncoder(outcomeName);
  const groups = new Map();
  let droppedRows = 0;

  state.dataset.records.forEach((record) => {
    const groupRaw = record[groupingName];
    const outcomeRaw = record[outcomeName];
    if (isMissing(groupRaw) || isMissing(outcomeRaw)) {
      droppedRows += 1;
      return;
    }

    const value = outcomeEncoder.encode(outcomeRaw);
    if (!Number.isFinite(value)) {
      droppedRows += 1;
      return;
    }

    const label = normalizeCategory(groupRaw);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label).push(value);
  });

  const groupList = Array.from(groups, ([label, values]) => ({ label, values }));
  if (groupList.length < 2) {
    throw new Error("The selected grouping variable does not provide at least two analyzable groups.");
  }

  const warnings = [...outcomeEncoder.warnings];
  if (droppedRows) {
    warnings.push(`${droppedRows} row(s) were excluded because of missing or non-numeric values.`);
  }
  groupList.forEach((group) => {
    if (group.values.length < 3) {
      warnings.push(`Group "${group.label}" has a very small sample (${group.values.length}).`);
    }
    if (variance(group.values) === 0) {
      warnings.push(`Group "${group.label}" has zero variance in the outcome.`);
    }
  });

  return {
    kind: "independent-groups",
    outcomeName,
    groupingName,
    groups: groupList,
    totalUsed: groupList.reduce((sumValue, group) => sumValue + group.values.length, 0),
    varianceRatio: groupList.length === 2 ? varianceRatio(groupList[0].values, groupList[1].values) : null,
    parametricReady: assessGroupParametricReadiness(groupList),
    warnings
  };
}

function preparePairedNumericGroups(outcomeName, groupingName, pairingName) {
  const outcomeEncoder = buildColumnEncoder(outcomeName);
  const subjectMap = new Map();
  const levelOrder = [];
  let droppedRows = 0;
  let duplicatePairs = 0;

  state.dataset.records.forEach((record) => {
    const pairRaw = record[pairingName];
    const groupRaw = record[groupingName];
    const outcomeRaw = record[outcomeName];
    if (isMissing(pairRaw) || isMissing(groupRaw) || isMissing(outcomeRaw)) {
      droppedRows += 1;
      return;
    }

    const numericValue = outcomeEncoder.encode(outcomeRaw);
    if (!Number.isFinite(numericValue)) {
      droppedRows += 1;
      return;
    }

    const subjectId = String(pairRaw).trim();
    const groupLabel = normalizeCategory(groupRaw);
    if (!levelOrder.includes(groupLabel)) {
      levelOrder.push(groupLabel);
    }

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, new Map());
    }

    const byGroup = subjectMap.get(subjectId);
    if (byGroup.has(groupLabel)) {
      duplicatePairs += 1;
      return;
    }
    byGroup.set(groupLabel, numericValue);
  });

  if (levelOrder.length !== 2) {
    throw new Error(`Paired execution requires exactly two observed repeated conditions. Found ${levelOrder.length}.`);
  }

  const pairs = [];
  let incompletePairs = 0;
  subjectMap.forEach((byGroup, subjectId) => {
    if (byGroup.has(levelOrder[0]) && byGroup.has(levelOrder[1])) {
      pairs.push({
        subjectId,
        left: byGroup.get(levelOrder[0]),
        right: byGroup.get(levelOrder[1])
      });
    } else {
      incompletePairs += 1;
    }
  });

  if (!pairs.length) {
    throw new Error("No complete subject pairs were found for the selected pairing variable.");
  }

  const differences = pairs.map((pair) => pair.left - pair.right);
  const warnings = [...outcomeEncoder.warnings];
  if (droppedRows) warnings.push(`${droppedRows} row(s) were excluded because of missing or non-numeric values.`);
  if (duplicatePairs) warnings.push(`${duplicatePairs} duplicated subject-condition row(s) were ignored.`);
  if (incompletePairs) warnings.push(`${incompletePairs} subject(s) were dropped because the pair was incomplete.`);
  if (pairs.length < 5) warnings.push(`Only ${pairs.length} complete pair(s) are available for the paired analysis.`);

  return {
    kind: "paired-groups",
    outcomeName,
    groupingName,
    pairingName,
    levels: levelOrder,
    pairs,
    leftValues: pairs.map((pair) => pair.left),
    rightValues: pairs.map((pair) => pair.right),
    totalUsed: pairs.length,
    differences,
    parametricReady: assessPairedParametricReadiness(differences),
    warnings
  };
}

function prepareContingency(rowVariable, columnVariable) {
  const rowLevels = [];
  const columnLevels = [];
  const counts = new Map();
  let droppedRows = 0;

  state.dataset.records.forEach((record) => {
    const rowRaw = record[rowVariable];
    const columnRaw = record[columnVariable];
    if (isMissing(rowRaw) || isMissing(columnRaw)) {
      droppedRows += 1;
      return;
    }

    const rowLabel = normalizeCategory(rowRaw);
    const columnLabel = normalizeCategory(columnRaw);
    if (!rowLevels.includes(rowLabel)) rowLevels.push(rowLabel);
    if (!columnLevels.includes(columnLabel)) columnLevels.push(columnLabel);

    const key = `${rowLabel}|||${columnLabel}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  if (!rowLevels.length || !columnLevels.length) {
    throw new Error("A contingency-table analysis requires two categorical variables with non-missing values.");
  }

  const matrix = rowLevels.map((rowLabel) => columnLevels.map((columnLabel) => counts.get(`${rowLabel}|||${columnLabel}`) || 0));
  const expected = computeExpectedTable(matrix);
  const lowExpectedCount = expected.flat().some((value) => value < 5);

  const warnings = [];
  if (droppedRows) warnings.push(`${droppedRows} row(s) were excluded because of missing values.`);
  if (lowExpectedCount) warnings.push("At least one expected count is below 5.");

  return {
    kind: "contingency",
    rowVariable,
    columnVariable,
    rowLevels,
    columnLevels,
    matrix,
    expected,
    isTwoByTwo: rowLevels.length === 2 && columnLevels.length === 2,
    lowExpectedCount,
    totalUsed: matrix.flat().reduce((sumValue, value) => sumValue + value, 0),
    warnings
  };
}

function prepareNumericPair(outcomeName, predictorName) {
  const outcomeEncoder = buildColumnEncoder(outcomeName);
  const predictorEncoder = buildColumnEncoder(predictorName);
  const x = [];
  const y = [];
  let droppedRows = 0;

  state.dataset.records.forEach((record) => {
    const predictorRaw = record[predictorName];
    const outcomeRaw = record[outcomeName];
    if (isMissing(predictorRaw) || isMissing(outcomeRaw)) {
      droppedRows += 1;
      return;
    }

    const xValue = predictorEncoder.encode(predictorRaw);
    const yValue = outcomeEncoder.encode(outcomeRaw);
    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
      droppedRows += 1;
      return;
    }

    x.push(xValue);
    y.push(yValue);
  });

  if (x.length < 3) {
    throw new Error("At least three complete predictor/outcome pairs are required.");
  }

  const warnings = [...outcomeEncoder.warnings, ...predictorEncoder.warnings];
  if (droppedRows) warnings.push(`${droppedRows} row(s) were excluded because of missing or non-numeric values.`);
  if (variance(x) === 0) warnings.push(`The predictor "${predictorName}" has zero variance after cleaning.`);
  if (variance(y) === 0) warnings.push(`The outcome "${outcomeName}" has zero variance after cleaning.`);

  return {
    kind: "numeric-pair",
    outcomeName,
    predictorName,
    x,
    y,
    totalUsed: x.length,
    predictorMeta: predictorEncoder.meta,
    outcomeMeta: outcomeEncoder.meta,
    parametricReady: assessPairParametricReadiness(x, y),
    warnings
  };
}

function prepareBinaryOutcomePredictor(outcomeName, predictorName) {
  const outcomeEncoder = buildColumnEncoder(outcomeName);
  if (outcomeEncoder.type !== "binary" || !outcomeEncoder.meta?.levels) {
    throw new Error("Binary logistic regression requires an outcome with exactly two levels.");
  }

  const predictorEncoder = buildColumnEncoder(predictorName);
  if (!["numeric", "binary", "ordinal"].includes(predictorEncoder.type)) {
    throw new Error("Binary logistic regression currently supports numeric, binary, or ordinal predictors only.");
  }

  const x = [];
  const y = [];
  let droppedRows = 0;

  state.dataset.records.forEach((record) => {
    const outcomeRaw = record[outcomeName];
    const predictorRaw = record[predictorName];
    if (isMissing(outcomeRaw) || isMissing(predictorRaw)) {
      droppedRows += 1;
      return;
    }

    const xValue = predictorEncoder.encode(predictorRaw);
    const yValue = outcomeEncoder.encode(outcomeRaw);
    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
      droppedRows += 1;
      return;
    }

    x.push(xValue);
    y.push(yValue);
  });

  const eventCount = y.reduce((sumValue, value) => sumValue + value, 0);
  if (!eventCount || eventCount === y.length) {
    throw new Error("Binary logistic regression requires both outcome levels to be present after cleaning.");
  }
  if (x.length < 8) {
    throw new Error("Binary logistic regression requires at least 8 complete cases for a stable browser-side fit.");
  }

  const warnings = [...outcomeEncoder.warnings, ...predictorEncoder.warnings];
  if (droppedRows) warnings.push(`${droppedRows} row(s) were excluded because of missing or non-numeric values.`);
  if (variance(x) === 0) warnings.push(`The predictor "${predictorName}" has zero variance after cleaning.`);
  if (eventCount < 3 || y.length - eventCount < 3) warnings.push("One outcome class has fewer than 3 observations, so the fitted odds may be unstable.");

  return {
    kind: "binary-regression",
    outcomeName,
    predictorName,
    x,
    y,
    totalUsed: x.length,
    predictorMeta: predictorEncoder.meta,
    outcomeMeta: outcomeEncoder.meta,
    outcomeLabels: outcomeEncoder.meta.levels,
    warnings
  };
}

function buildColumnEncoder(columnName) {
  const type = getEffectiveType(columnName);
  const rawValues = state.dataset.records.map((record) => record[columnName]).filter((value) => !isMissing(value));

  if (type === "numeric") {
    return {
      type,
      encode: (value) => parseLocaleNumber(value),
      warnings: [],
      meta: null
    };
  }

  if (type === "binary") {
    const meta = buildBinaryEncoding(rawValues);
    if (!meta) {
      throw new Error(`The column "${columnName}" could not be encoded as a binary variable.`);
    }
    return {
      type,
      encode: (value) => meta.map.get(canonicalValue(value)),
      warnings: [],
      meta
    };
  }

  if (type === "ordinal") {
    const meta = buildOrdinalEncoding(rawValues);
    return {
      type,
      encode: (value) => meta.map.get(canonicalValue(value)),
      warnings: meta.warning ? [meta.warning] : [],
      meta
    };
  }

  if (type === "categorical") {
    throw new Error(`The column "${columnName}" is categorical and cannot be converted into the numeric scale required by the selected method.`);
  }

  throw new Error(`The column "${columnName}" is currently ignored.`);
}

function buildBinaryEncoding(values) {
  const uniqueValues = uniquePreserveOrder(values.map((value) => String(value).trim()));
  if (uniqueValues.length !== 2) return null;

  const lowerValues = uniqueValues.map((value) => canonicalValue(value));
  let positiveIndex = lowerValues.findIndex((value) => POSITIVE_BINARY_HINTS.includes(value));
  if (positiveIndex === -1) {
    positiveIndex = 1;
  }

  const negativeIndex = positiveIndex === 0 ? 1 : 0;
  const levels = [uniqueValues[negativeIndex], uniqueValues[positiveIndex]];
  const map = new Map([
    [canonicalValue(levels[0]), 0],
    [canonicalValue(levels[1]), 1]
  ]);

  return { map, levels };
}

function buildOrdinalEncoding(values) {
  const uniqueValues = uniquePreserveOrder(values.map((value) => String(value).trim()));
  const numericValues = uniqueValues.map(parseLocaleNumber);

  if (numericValues.every(Number.isFinite)) {
    const map = new Map(uniqueValues.map((value) => [canonicalValue(value), parseLocaleNumber(value)]));
    const sortedValues = [...numericValues].sort((left, right) => left - right);
    return { map, levels: sortedValues.map(String), warning: "" };
  }

  const lowerValues = uniqueValues.map((value) => canonicalValue(value));
  const matchingSequence = ORDINAL_SEQUENCES.find((sequence) => lowerValues.every((value) => sequence.includes(value)));
  if (matchingSequence) {
    const orderedValues = matchingSequence.filter((entry) => lowerValues.includes(entry));
    const displayOrder = orderedValues.map((entry) => uniqueValues.find((value) => canonicalValue(value) === entry));
    const map = new Map(orderedValues.map((value, index) => [value, index + 1]));
    return { map, levels: displayOrder, warning: "" };
  }

  const map = new Map(uniqueValues.map((value, index) => [canonicalValue(value), index + 1]));
  return {
    map,
    levels: uniqueValues,
    warning: "An ordinal column was ranked by first-observed level order because no standard ordinal sequence was detected."
  };
}

function assessGroupParametricReadiness(groups) {
  const groupDiagnostics = groups.map((group) => ({
    label: group.label,
    n: group.values.length,
    variance: variance(group.values),
    skewness: skewness(group.values),
    outlierShare: outlierShare(group.values)
  }));

  const minGroupSize = Math.min(...groupDiagnostics.map((group) => group.n));
  const ready = groupDiagnostics.every((group) => group.n >= 8 && group.variance > 0 && Math.abs(group.skewness) <= 1.5 && group.outlierShare <= 0.2);

  return { ready, minGroupSize, groupDiagnostics };
}

function assessPairedParametricReadiness(differences) {
  if (!differences.length) return { ready: false, n: 0, skewness: 0 };
  return {
    ready: differences.length >= 8 && variance(differences) > 0 && Math.abs(skewness(differences)) <= 1.5 && outlierShare(differences) <= 0.2,
    n: differences.length,
    skewness: skewness(differences)
  };
}

function assessPairParametricReadiness(x, y) {
  return {
    ready: x.length >= 8 && variance(x) > 0 && variance(y) > 0 && outlierShare(x) <= 0.2 && outlierShare(y) <= 0.2,
    n: x.length
  };
}

async function handleRunAnalysis() {
  if (!state.recommendation) {
    setMessage(dom.reviewError, "error", "Generate a recommendation before running the analysis.");
    return;
  }

  clearMessage(dom.reviewError);

  try {
    await withLoader("Running statistical execution...", "Computing the selected method directly in the browser.", async () => {
      state.result = executeRecommendedTest();
    });

    renderResults();
    goToStep("results");
  } catch (error) {
    setMessage(dom.reviewError, "error", error.message || "The statistical execution could not complete.");
  }
}

function executeRecommendedTest() {
  const { testId, payload } = state.recommendation;
  let result;

  switch (testId) {
    case "independent_t_test":
      result = runIndependentTTest(payload);
      break;
    case "welch_t_test":
      result = runWelchTTest(payload);
      break;
    case "paired_t_test":
      result = runPairedTTest(payload);
      break;
    case "mann_whitney_u":
      result = runMannWhitney(payload);
      break;
    case "wilcoxon_signed_rank":
      result = runWilcoxonSignedRank(payload);
      break;
    case "one_way_anova":
      result = runOneWayAnova(payload);
      break;
    case "kruskal_wallis":
      result = runKruskalWallis(payload);
      break;
    case "chi_square_independence":
      result = runChiSquareTest(payload);
      break;
    case "fisher_exact":
      result = runFisherExact(payload);
      break;
    case "pearson_correlation":
      result = runPearsonCorrelation(payload);
      break;
    case "spearman_correlation":
      result = runSpearmanCorrelation(payload);
      break;
    case "simple_linear_regression":
      result = runSimpleLinearRegression(payload);
      break;
    case "binary_logistic_regression":
      result = runBinaryLogisticRegression(payload);
      break;
    default:
      throw new Error("The recommended test is not executable.");
  }

  return finalizeResult(result);
}

function sum(values) {
  return values.reduce((sumValue, value) => sumValue + value, 0);
}

function mean(values) {
  return values.length ? sum(values) / values.length : NaN;
}

function variance(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return values.reduce((sumValue, value) => sumValue + (value - average) ** 2, 0) / (values.length - 1);
}

function stdDev(values) {
  return Math.sqrt(Math.max(variance(values), 0));
}

function median(sortedValues) {
  if (!sortedValues.length) return NaN;
  const middle = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 ? sortedValues[middle] : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
}

function skewness(values) {
  if (values.length < 3) return 0;
  const average = mean(values);
  const deviation = stdDev(values);
  if (deviation === 0) return 0;
  const n = values.length;
  const thirdMoment = values.reduce((sumValue, value) => sumValue + ((value - average) / deviation) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * thirdMoment;
}

function outlierShare(values) {
  if (values.length < 4) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  if (iqr === 0) return 0;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const outliers = values.filter((value) => value < lower || value > upper).length;
  return outliers / values.length;
}

function quantile(sortedValues, probability) {
  if (!sortedValues.length) return NaN;
  const position = (sortedValues.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function varianceRatio(firstValues, secondValues) {
  const firstVariance = variance(firstValues);
  const secondVariance = variance(secondValues);
  if (firstVariance === 0 || secondVariance === 0) return Infinity;
  return Math.max(firstVariance, secondVariance) / Math.min(firstVariance, secondVariance);
}

function rankArray(values) {
  const indexed = values.map((value, index) => ({ value, index })).sort((left, right) => left.value - right.value);
  const ranks = new Array(values.length);
  let tieCorrection = 0;

  for (let index = 0; index < indexed.length; ) {
    let end = index + 1;
    while (end < indexed.length && indexed[end].value === indexed[index].value) {
      end += 1;
    }
    const averageRank = (index + 1 + end) / 2;
    for (let rankIndex = index; rankIndex < end; rankIndex += 1) {
      ranks[indexed[rankIndex].index] = averageRank;
    }
    const tieSize = end - index;
    if (tieSize > 1) {
      tieCorrection += tieSize ** 3 - tieSize;
    }
    index = end;
  }

  return { ranks, tieCorrection };
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  return sign * y;
}

function normalCdf(value) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function inverseNormalCdf(probability) {
  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1 for the inverse normal CDF.");
  }

  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lower = 0.02425;
  const upper = 1 - lower;
  let q;
  let r;

  if (probability < lower) {
    q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (probability > upper) {
    q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  q = probability - 0.5;
  r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function logGamma(value) {
  const coefficients = [
    0.9999999999998099,
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7
  ];

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }

  const z = value - 1;
  let accumulator = coefficients[0];
  for (let index = 1; index < coefficients.length; index += 1) {
    accumulator += coefficients[index] / (z + index);
  }
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(accumulator);
}

function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const betaValue = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return betaValue * betaContinuedFraction(x, a, b) / a;
  }
  return 1 - betaValue * betaContinuedFraction(1 - x, b, a) / b;
}

function betaContinuedFraction(x, a, b) {
  const maxIterations = 200;
  const epsilon = 3e-7;
  const fpMin = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) d = fpMin;
  d = 1 / d;
  let h = d;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const evenIndex = 2 * iteration;
    let numerator = (iteration * (b - iteration) * x) / ((qam + evenIndex) * (a + evenIndex));
    d = 1 + numerator * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + numerator / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    h *= d * c;

    numerator = (-(a + iteration) * (qab + iteration) * x) / ((a + evenIndex) * (qap + evenIndex));
    d = 1 + numerator * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + numerator / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }

  return h;
}

function regularizedGammaP(a, x) {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  if (x < a + 1) {
    let sumValue = 1 / a;
    let delta = sumValue;
    let term = a;
    for (let iteration = 1; iteration <= 200; iteration += 1) {
      term += 1;
      delta *= x / term;
      sumValue += delta;
      if (Math.abs(delta) < Math.abs(sumValue) * 1e-12) {
        break;
      }
    }
    return sumValue * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
  return 1 - regularizedGammaQ(a, x);
}

function regularizedGammaQ(a, x) {
  const fpMin = 1e-30;
  let b = x + 1 - a;
  let c = 1 / fpMin;
  let d = 1 / b;
  let h = d;

  for (let iteration = 1; iteration <= 200; iteration += 1) {
    const an = -iteration * (iteration - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = b + an / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function studentTCdf(statistic, degreesOfFreedom) {
  if (!Number.isFinite(statistic) || !Number.isFinite(degreesOfFreedom) || degreesOfFreedom <= 0) {
    return NaN;
  }
  const x = degreesOfFreedom / (degreesOfFreedom + statistic * statistic);
  const probability = regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5);
  return statistic >= 0 ? 1 - 0.5 * probability : 0.5 * probability;
}

function inverseTCdf(probability, degreesOfFreedom) {
  let lower = -20;
  let upper = 20;
  while (studentTCdf(lower, degreesOfFreedom) > probability) lower *= 2;
  while (studentTCdf(upper, degreesOfFreedom) < probability) upper *= 2;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    const cdf = studentTCdf(midpoint, degreesOfFreedom);
    if (cdf < probability) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }

  return (lower + upper) / 2;
}

function chiSquareCdf(value, degreesOfFreedom) {
  if (value < 0) return 0;
  return regularizedGammaP(degreesOfFreedom / 2, value / 2);
}

function fCdf(value, numeratorDf, denominatorDf) {
  if (value <= 0) return 0;
  const x = (numeratorDf * value) / (numeratorDf * value + denominatorDf);
  return regularizedIncompleteBeta(x, numeratorDf / 2, denominatorDf / 2);
}

function pValueFromSymmetricStatistic(statistic, cdfFunction) {
  const cdf = cdfFunction(statistic);
  if (state.objective.tail === "greater") {
    return 1 - cdf;
  }
  if (state.objective.tail === "less") {
    return cdf;
  }
  return 2 * Math.min(cdf, 1 - cdf);
}

function ciLevelLabel() {
  return `${Math.round((1 - state.objective.alpha) * 100)}% CI`;
}

function hedgesCorrection(degreesOfFreedom) {
  return degreesOfFreedom > 1 ? 1 - 3 / (4 * degreesOfFreedom - 1) : 1;
}

function logCombination(n, k) {
  if (k < 0 || k > n) return -Infinity;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

function runIndependentTTest(context) {
  const [firstGroup, secondGroup] = context.groups;
  const n1 = firstGroup.values.length;
  const n2 = secondGroup.values.length;
  const mean1 = mean(firstGroup.values);
  const mean2 = mean(secondGroup.values);
  const variance1 = variance(firstGroup.values);
  const variance2 = variance(secondGroup.values);
  const pooledVariance = (((n1 - 1) * variance1) + ((n2 - 1) * variance2)) / (n1 + n2 - 2);
  const standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));
  if (!Number.isFinite(standardError) || standardError === 0) {
    throw new Error("The independent t-test cannot run because the outcome variance is zero after cleaning.");
  }
  const difference = mean1 - mean2;
  const statistic = difference / standardError;
  const degreesOfFreedom = n1 + n2 - 2;
  const pValue = pValueFromSymmetricStatistic(statistic, (value) => studentTCdf(value, degreesOfFreedom));
  const criticalValue = inverseTCdf(1 - state.objective.alpha / 2, degreesOfFreedom);
  const ci = [difference - criticalValue * standardError, difference + criticalValue * standardError];
  const effect = (difference / Math.sqrt(pooledVariance)) * hedgesCorrection(degreesOfFreedom);

  return {
    testId: "independent_t_test",
    testName: TEST_LIBRARY.independent_t_test.name,
    statisticLabel: "t",
    statisticValue: statistic,
    degreesOfFreedom,
    pValue,
    effectLabel: "Hedges g",
    effectValue: effect,
    ciLabel: ciLevelLabel(),
    ci,
    sampleSummary: `${firstGroup.label}: n=${n1}; ${secondGroup.label}: n=${n2}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.independent_t_test.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `${firstGroup.label} differs significantly from ${secondGroup.label} on "${context.outcomeName}" at alpha ${state.objective.alpha}.`
      : `At alpha ${state.objective.alpha}, the independent-group mean difference between ${firstGroup.label} and ${secondGroup.label} is not statistically significant.`,
    details: [
      { title: "Group means", items: [`${firstGroup.label}: ${formatNumber(mean1)}`, `${secondGroup.label}: ${formatNumber(mean2)}`] },
      { title: "Difference estimate", items: [`Mean difference (${firstGroup.label} - ${secondGroup.label}) = ${formatNumber(difference)}`, `${ciLevelLabel()} ${formatInterval(ci)}`] }
    ],
    coefficients: []
  };
}

function runWelchTTest(context) {
  const [firstGroup, secondGroup] = context.groups;
  const n1 = firstGroup.values.length;
  const n2 = secondGroup.values.length;
  const mean1 = mean(firstGroup.values);
  const mean2 = mean(secondGroup.values);
  const variance1 = variance(firstGroup.values);
  const variance2 = variance(secondGroup.values);
  const difference = mean1 - mean2;
  const standardError = Math.sqrt(variance1 / n1 + variance2 / n2);
  if (!Number.isFinite(standardError) || standardError === 0) {
    throw new Error("The Welch t-test cannot run because the outcome variance is zero after cleaning.");
  }
  const statistic = difference / standardError;
  const numerator = (variance1 / n1 + variance2 / n2) ** 2;
  const denominator = ((variance1 / n1) ** 2) / (n1 - 1) + ((variance2 / n2) ** 2) / (n2 - 1);
  const degreesOfFreedom = numerator / denominator;
  const pValue = pValueFromSymmetricStatistic(statistic, (value) => studentTCdf(value, degreesOfFreedom));
  const criticalValue = inverseTCdf(1 - state.objective.alpha / 2, degreesOfFreedom);
  const ci = [difference - criticalValue * standardError, difference + criticalValue * standardError];
  const pooledVariance = (((n1 - 1) * variance1) + ((n2 - 1) * variance2)) / (n1 + n2 - 2);
  const effect = (difference / Math.sqrt(pooledVariance)) * hedgesCorrection(n1 + n2 - 2);

  return {
    testId: "welch_t_test",
    testName: TEST_LIBRARY.welch_t_test.name,
    statisticLabel: "t",
    statisticValue: statistic,
    degreesOfFreedom,
    pValue,
    effectLabel: "Hedges g",
    effectValue: effect,
    ciLabel: ciLevelLabel(),
    ci,
    sampleSummary: `${firstGroup.label}: n=${n1}; ${secondGroup.label}: n=${n2}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.welch_t_test.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `${firstGroup.label} differs significantly from ${secondGroup.label} on "${context.outcomeName}" after allowing unequal variances.`
      : `At alpha ${state.objective.alpha}, the unequal-variance mean difference between ${firstGroup.label} and ${secondGroup.label} is not statistically significant.`,
    details: [
      { title: "Group means", items: [`${firstGroup.label}: ${formatNumber(mean1)}`, `${secondGroup.label}: ${formatNumber(mean2)}`] },
      { title: "Difference estimate", items: [`Mean difference (${firstGroup.label} - ${secondGroup.label}) = ${formatNumber(difference)}`, `${ciLevelLabel()} ${formatInterval(ci)}`] }
    ],
    coefficients: []
  };
}

function runPairedTTest(context) {
  const differences = context.differences;
  const n = differences.length;
  const meanDifference = mean(differences);
  const sdDifference = stdDev(differences);
  const standardError = sdDifference / Math.sqrt(n);
  if (!Number.isFinite(standardError) || standardError === 0) {
    throw new Error("The paired t-test cannot run because the paired differences have zero variance.");
  }
  const statistic = meanDifference / standardError;
  const degreesOfFreedom = n - 1;
  const pValue = pValueFromSymmetricStatistic(statistic, (value) => studentTCdf(value, degreesOfFreedom));
  const criticalValue = inverseTCdf(1 - state.objective.alpha / 2, degreesOfFreedom);
  const ci = [meanDifference - criticalValue * standardError, meanDifference + criticalValue * standardError];
  const effect = sdDifference === 0 ? 0 : meanDifference / sdDifference;

  return {
    testId: "paired_t_test",
    testName: TEST_LIBRARY.paired_t_test.name,
    statisticLabel: "t",
    statisticValue: statistic,
    degreesOfFreedom,
    pValue,
    effectLabel: "dz",
    effectValue: effect,
    ciLabel: ciLevelLabel(),
    ci,
    sampleSummary: `${context.totalUsed} complete pair(s)`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.paired_t_test.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `The paired mean difference between ${context.levels[0]} and ${context.levels[1]} is statistically significant at alpha ${state.objective.alpha}.`
      : `At alpha ${state.objective.alpha}, the paired mean difference between ${context.levels[0]} and ${context.levels[1]} is not statistically significant.`,
    details: [
      { title: "Condition means", items: [`${context.levels[0]}: ${formatNumber(mean(context.leftValues))}`, `${context.levels[1]}: ${formatNumber(mean(context.rightValues))}`] },
      { title: "Difference estimate", items: [`Mean difference (${context.levels[0]} - ${context.levels[1]}) = ${formatNumber(meanDifference)}`, `${ciLevelLabel()} ${formatInterval(ci)}`] }
    ],
    coefficients: []
  };
}

function runMannWhitney(context) {
  const [firstGroup, secondGroup] = context.groups;
  const combined = [
    ...firstGroup.values.map((value) => ({ group: 0, value })),
    ...secondGroup.values.map((value) => ({ group: 1, value }))
  ];
  const { ranks, tieCorrection } = rankArray(combined.map((entry) => entry.value));
  let rankSumFirst = 0;
  ranks.forEach((rank, index) => {
    if (combined[index].group === 0) rankSumFirst += rank;
  });

  const n1 = firstGroup.values.length;
  const n2 = secondGroup.values.length;
  const u1 = rankSumFirst - (n1 * (n1 + 1)) / 2;
  const meanU = (n1 * n2) / 2;
  const n = n1 + n2;
  const tieTerm = tieCorrection / (n * (n - 1));
  const sdU = Math.sqrt((n1 * n2 / 12) * ((n + 1) - tieTerm));
  if (!Number.isFinite(sdU) || sdU === 0) {
    throw new Error("Mann-Whitney U cannot run because all ranked values collapse to the same value.");
  }
  const continuity = u1 === meanU ? 0 : 0.5 * Math.sign(u1 - meanU);
  const zValue = (u1 - meanU - continuity) / sdU;
  const pValue = pValueFromSymmetricStatistic(zValue, normalCdf);
  const effect = (2 * u1) / (n1 * n2) - 1;

  return {
    testId: "mann_whitney_u",
    testName: TEST_LIBRARY.mann_whitney_u.name,
    statisticLabel: "U",
    statisticValue: u1,
    degreesOfFreedom: null,
    pValue,
    effectLabel: "Rank-biserial r",
    effectValue: effect,
    ciLabel: "",
    ci: null,
    sampleSummary: `${firstGroup.label}: n=${n1}; ${secondGroup.label}: n=${n2}`,
    warnings: uniquePreserveOrder([...context.warnings, "The p-value uses a normal approximation with tie adjustment."]),
    assumptions: TEST_LIBRARY.mann_whitney_u.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `${firstGroup.label} and ${secondGroup.label} differ significantly in their ranked outcome distributions.`
      : `At alpha ${state.objective.alpha}, the ranked outcome distributions for ${firstGroup.label} and ${secondGroup.label} do not differ significantly.`,
    details: [
      { title: "Group medians", items: [`${firstGroup.label}: ${formatNumber(median([...firstGroup.values].sort((a, b) => a - b)))}`, `${secondGroup.label}: ${formatNumber(median([...secondGroup.values].sort((a, b) => a - b)))}`] },
      { title: "Rank summary", items: [`U statistic = ${formatNumber(u1)}`, `Normal approximation z = ${formatNumber(zValue)}`] }
    ],
    coefficients: []
  };
}

function runWilcoxonSignedRank(context) {
  const differences = context.differences.filter((value) => value !== 0);
  if (!differences.length) {
    throw new Error("Wilcoxon signed-rank requires at least one non-zero paired difference.");
  }

  const absoluteDifferences = differences.map((value) => Math.abs(value));
  const { ranks, tieCorrection } = rankArray(absoluteDifferences);
  let positiveRankSum = 0;
  let negativeRankSum = 0;
  differences.forEach((difference, index) => {
    if (difference > 0) positiveRankSum += ranks[index];
    if (difference < 0) negativeRankSum += ranks[index];
  });

  const n = differences.length;
  const meanW = (n * (n + 1)) / 4;
  const sdW = Math.sqrt((n * (n + 1) * (2 * n + 1) - tieCorrection) / 24);
  if (!Number.isFinite(sdW) || sdW === 0) {
    throw new Error("Wilcoxon signed-rank cannot run because the non-zero paired differences do not vary.");
  }
  const continuity = positiveRankSum === meanW ? 0 : 0.5 * Math.sign(positiveRankSum - meanW);
  const zValue = (positiveRankSum - meanW - continuity) / sdW;
  const pValue = pValueFromSymmetricStatistic(zValue, normalCdf);
  const effect = (positiveRankSum - negativeRankSum) / (positiveRankSum + negativeRankSum);

  return {
    testId: "wilcoxon_signed_rank",
    testName: TEST_LIBRARY.wilcoxon_signed_rank.name,
    statisticLabel: "W+",
    statisticValue: positiveRankSum,
    degreesOfFreedom: null,
    pValue,
    effectLabel: "Rank-biserial r",
    effectValue: effect,
    ciLabel: "",
    ci: null,
    sampleSummary: `${context.totalUsed} complete pair(s); ${differences.length} non-zero differences`,
    warnings: uniquePreserveOrder([...context.warnings, "The p-value uses a normal approximation with tie adjustment."]),
    assumptions: TEST_LIBRARY.wilcoxon_signed_rank.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `The paired ranked differences between ${context.levels[0]} and ${context.levels[1]} are statistically significant.`
      : `At alpha ${state.objective.alpha}, the paired ranked differences between ${context.levels[0]} and ${context.levels[1]} are not statistically significant.`,
    details: [
      { title: "Condition medians", items: [`${context.levels[0]}: ${formatNumber(median([...context.leftValues].sort((a, b) => a - b)))}`, `${context.levels[1]}: ${formatNumber(median([...context.rightValues].sort((a, b) => a - b)))}`] },
      { title: "Signed-rank summary", items: [`Positive rank sum = ${formatNumber(positiveRankSum)}`, `Normal approximation z = ${formatNumber(zValue)}`] }
    ],
    coefficients: []
  };
}

function runOneWayAnova(context) {
  const groups = context.groups;
  const totalN = groups.reduce((sumValue, group) => sumValue + group.values.length, 0);
  const grandMean = mean(groups.flatMap((group) => group.values));
  const ssBetween = groups.reduce((sumValue, group) => sumValue + group.values.length * (mean(group.values) - grandMean) ** 2, 0);
  const ssWithin = groups.reduce((sumValue, group) => sumValue + group.values.reduce((groupSum, value) => groupSum + (value - mean(group.values)) ** 2, 0), 0);
  const dfBetween = groups.length - 1;
  const dfWithin = totalN - groups.length;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  if (!Number.isFinite(msWithin) || msWithin === 0) {
    throw new Error("One-way ANOVA cannot run because there is no within-group variance after cleaning.");
  }
  const statistic = msBetween / msWithin;
  const pValue = 1 - fCdf(statistic, dfBetween, dfWithin);
  const effect = ssBetween / (ssBetween + ssWithin);

  return {
    testId: "one_way_anova",
    testName: TEST_LIBRARY.one_way_anova.name,
    statisticLabel: "F",
    statisticValue: statistic,
    degreesOfFreedom: `${dfBetween}, ${dfWithin}`,
    pValue,
    effectLabel: "Eta squared",
    effectValue: effect,
    ciLabel: "",
    ci: null,
    sampleSummary: `${groups.length} groups; N=${totalN}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.one_way_anova.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `At alpha ${state.objective.alpha}, at least one group mean differs significantly from the others.`
      : `At alpha ${state.objective.alpha}, the data do not show a statistically significant mean difference across groups.`,
    details: [
      { title: "Group means", items: groups.map((group) => `${group.label}: ${formatNumber(mean(group.values))} (n=${group.values.length})`) },
      { title: "ANOVA components", items: [`SS between = ${formatNumber(ssBetween)}`, `SS within = ${formatNumber(ssWithin)}`] }
    ],
    coefficients: []
  };
}

function runKruskalWallis(context) {
  const combined = [];
  context.groups.forEach((group, groupIndex) => {
    group.values.forEach((value) => combined.push({ groupIndex, value }));
  });
  const { ranks, tieCorrection } = rankArray(combined.map((entry) => entry.value));
  const rankSums = new Array(context.groups.length).fill(0);
  ranks.forEach((rank, index) => {
    rankSums[combined[index].groupIndex] += rank;
  });

  const totalN = combined.length;
  let statistic = 0;
  context.groups.forEach((group, index) => {
    statistic += (rankSums[index] ** 2) / group.values.length;
  });
  statistic = (12 / (totalN * (totalN + 1))) * statistic - 3 * (totalN + 1);
  const correctionFactor = 1 - tieCorrection / (totalN ** 3 - totalN);
  if (correctionFactor > 0) {
    statistic /= correctionFactor;
  }
  const degreesOfFreedom = context.groups.length - 1;
  const pValue = 1 - chiSquareCdf(statistic, degreesOfFreedom);
  const effect = (statistic - context.groups.length + 1) / (totalN - context.groups.length);

  return {
    testId: "kruskal_wallis",
    testName: TEST_LIBRARY.kruskal_wallis.name,
    statisticLabel: "H",
    statisticValue: statistic,
    degreesOfFreedom,
    pValue,
    effectLabel: "Epsilon squared",
    effectValue: effect,
    ciLabel: "",
    ci: null,
    sampleSummary: `${context.groups.length} groups; N=${totalN}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.kruskal_wallis.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `At alpha ${state.objective.alpha}, at least one group differs in its ranked outcome distribution.`
      : `At alpha ${state.objective.alpha}, the ranked outcome distributions do not differ significantly across groups.`,
    details: [
      { title: "Group medians", items: context.groups.map((group) => `${group.label}: ${formatNumber(median([...group.values].sort((a, b) => a - b)))} (n=${group.values.length})`) },
      { title: "Rank summary", items: rankSums.map((rankSum, index) => `${context.groups[index].label}: rank sum ${formatNumber(rankSum)}`) }
    ],
    coefficients: []
  };
}

function runChiSquareTest(context) {
  const { matrix, expected } = context;
  let statistic = 0;
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < matrix[rowIndex].length; columnIndex += 1) {
      const observed = matrix[rowIndex][columnIndex];
      const expectedValue = expected[rowIndex][columnIndex];
      statistic += ((observed - expectedValue) ** 2) / expectedValue;
    }
  }
  const degreesOfFreedom = (context.rowLevels.length - 1) * (context.columnLevels.length - 1);
  const pValue = 1 - chiSquareCdf(statistic, degreesOfFreedom);
  const denominator = context.totalUsed * Math.min(context.rowLevels.length - 1, context.columnLevels.length - 1);
  const effect = denominator > 0 ? Math.sqrt(statistic / denominator) : 0;

  return {
    testId: "chi_square_independence",
    testName: TEST_LIBRARY.chi_square_independence.name,
    statisticLabel: "Chi-square",
    statisticValue: statistic,
    degreesOfFreedom,
    pValue,
    effectLabel: "Cramer's V",
    effectValue: effect,
    ciLabel: "",
    ci: null,
    sampleSummary: `Table ${context.rowLevels.length}x${context.columnLevels.length}; N=${context.totalUsed}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.chi_square_independence.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `The two categorical variables show a statistically significant association at alpha ${state.objective.alpha}.`
      : `At alpha ${state.objective.alpha}, the contingency table does not show a statistically significant association.`,
    details: [
      { title: "Observed counts", items: flattenContingencyTable(context.rowLevels, context.columnLevels, matrix) },
      { title: "Expected counts", items: flattenContingencyTable(context.rowLevels, context.columnLevels, expected, true) }
    ],
    coefficients: []
  };
}

function runFisherExact(context) {
  const [[a, b], [c, d]] = context.matrix;
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const total = row1 + row2;
  const minValue = Math.max(0, col1 - row2);
  const maxValue = Math.min(row1, col1);

  const probabilityFor = (value) => Math.exp(logCombination(col1, value) + logCombination(total - col1, row1 - value) - logCombination(total, row1));
  const observedProbability = probabilityFor(a);
  let pValue = 0;

  if (state.objective.tail === "greater") {
    for (let value = a; value <= maxValue; value += 1) pValue += probabilityFor(value);
  } else if (state.objective.tail === "less") {
    for (let value = minValue; value <= a; value += 1) pValue += probabilityFor(value);
  } else {
    for (let value = minValue; value <= maxValue; value += 1) {
      const probability = probabilityFor(value);
      if (probability <= observedProbability + 1e-12) pValue += probability;
    }
  }

  const correctedOddsRatio = ((a + 0.5) * (d + 0.5)) / ((b + 0.5) * (c + 0.5));

  return {
    testId: "fisher_exact",
    testName: TEST_LIBRARY.fisher_exact.name,
    statisticLabel: "Odds ratio",
    statisticValue: correctedOddsRatio,
    degreesOfFreedom: null,
    pValue,
    effectLabel: "Odds ratio",
    effectValue: correctedOddsRatio,
    ciLabel: "",
    ci: null,
    sampleSummary: `2x2 table; N=${context.totalUsed}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.fisher_exact.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `The two categorical variables show a statistically significant association under Fisher's exact test.`
      : `At alpha ${state.objective.alpha}, Fisher's exact test does not detect a statistically significant association.`,
    details: [
      { title: "Observed counts", items: flattenContingencyTable(context.rowLevels, context.columnLevels, context.matrix) },
      { title: "Exact test summary", items: [`Two-sided handling follows the selected hypothesis tail: ${humanizeTail(state.objective.tail)}.`] }
    ],
    coefficients: []
  };
}

function computePearson(x, y) {
  const meanX = mean(x);
  const meanY = mean(y);
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  for (let index = 0; index < x.length; index += 1) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    sumXX += dx * dx;
    sumYY += dy * dy;
    sumXY += dx * dy;
  }
  return { r: sumXY / Math.sqrt(sumXX * sumYY), sumXX, sumYY, sumXY, meanX, meanY };
}

function runPearsonCorrelation(context) {
  const correlation = computePearson(context.x, context.y);
  if (!Number.isFinite(correlation.r)) {
    throw new Error("Pearson correlation requires both variables to vary after cleaning.");
  }
  const n = context.totalUsed;
  const statistic = correlation.r * Math.sqrt((n - 2) / (1 - correlation.r ** 2));
  const pValue = pValueFromSymmetricStatistic(statistic, (value) => studentTCdf(value, n - 2));
  const fisherZ = 0.5 * Math.log((1 + correlation.r) / (1 - correlation.r));
  const zCritical = inverseNormalCdf(1 - state.objective.alpha / 2);
  const se = 1 / Math.sqrt(n - 3);
  const ci = n > 3
    ? [Math.tanh(fisherZ - zCritical * se), Math.tanh(fisherZ + zCritical * se)]
    : null;

  return {
    testId: "pearson_correlation",
    testName: TEST_LIBRARY.pearson_correlation.name,
    statisticLabel: "r",
    statisticValue: correlation.r,
    degreesOfFreedom: n - 2,
    pValue,
    effectLabel: "Correlation",
    effectValue: correlation.r,
    ciLabel: ci ? ciLevelLabel() : "",
    ci,
    sampleSummary: `n=${n}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.pearson_correlation.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `The relationship between "${context.predictorName}" and "${context.outcomeName}" is statistically significant and ${correlation.r >= 0 ? "positive" : "negative"}.`
      : `At alpha ${state.objective.alpha}, the linear correlation between "${context.predictorName}" and "${context.outcomeName}" is not statistically significant.`,
    details: [
      { title: "Correlation summary", items: [`r = ${formatNumber(correlation.r)}`, `t(${n - 2}) = ${formatNumber(statistic)}`] },
      { title: "Confidence interval", items: ci ? [`${ciLevelLabel()} ${formatInterval(ci)}`] : ["A correlation confidence interval requires at least 4 complete cases."] }
    ],
    coefficients: []
  };
}

function runSpearmanCorrelation(context) {
  const rankedX = rankArray(context.x).ranks;
  const rankedY = rankArray(context.y).ranks;
  const correlation = computePearson(rankedX, rankedY);
  if (!Number.isFinite(correlation.r)) {
    throw new Error("Spearman correlation requires both ranked variables to vary after cleaning.");
  }
  const n = context.totalUsed;
  const statistic = correlation.r * Math.sqrt((n - 2) / (1 - correlation.r ** 2));
  const pValue = pValueFromSymmetricStatistic(statistic, (value) => studentTCdf(value, n - 2));

  return {
    testId: "spearman_correlation",
    testName: TEST_LIBRARY.spearman_correlation.name,
    statisticLabel: "rho",
    statisticValue: correlation.r,
    degreesOfFreedom: n - 2,
    pValue,
    effectLabel: "Rank correlation",
    effectValue: correlation.r,
    ciLabel: "",
    ci: null,
    sampleSummary: `n=${n}`,
    warnings: uniquePreserveOrder([...context.warnings, "The p-value uses the standard large-sample t approximation for Spearman correlation."]),
    assumptions: TEST_LIBRARY.spearman_correlation.assumptions,
    interpretation: pValue < state.objective.alpha
      ? `The monotonic relationship between "${context.predictorName}" and "${context.outcomeName}" is statistically significant and ${correlation.r >= 0 ? "positive" : "negative"}.`
      : `At alpha ${state.objective.alpha}, the ranked monotonic relationship is not statistically significant.`,
    details: [
      { title: "Correlation summary", items: [`Spearman rho = ${formatNumber(correlation.r)}`, `Approximate t(${n - 2}) = ${formatNumber(statistic)}`] }
    ],
    coefficients: []
  };
}

function runSimpleLinearRegression(context) {
  const n = context.totalUsed;
  const pearson = computePearson(context.x, context.y);
  if (!Number.isFinite(pearson.sumXX) || pearson.sumXX === 0) {
    throw new Error("Simple linear regression requires a predictor with non-zero variance.");
  }
  const slope = pearson.sumXY / pearson.sumXX;
  const intercept = pearson.meanY - slope * pearson.meanX;
  const fitted = context.x.map((value) => intercept + slope * value);
  const residuals = context.y.map((value, index) => value - fitted[index]);
  const sse = residuals.reduce((sumValue, value) => sumValue + value * value, 0);
  const sst = context.y.reduce((sumValue, value) => sumValue + (value - pearson.meanY) ** 2, 0);
  const sigmaSquared = sse / (n - 2);
  const slopeSe = Math.sqrt(sigmaSquared / pearson.sumXX);
  const interceptSe = Math.sqrt(sigmaSquared * (1 / n + (pearson.meanX ** 2) / pearson.sumXX));
  const slopeT = slope / slopeSe;
  const slopeP = pValueFromSymmetricStatistic(slopeT, (value) => studentTCdf(value, n - 2));
  const tCritical = inverseTCdf(1 - state.objective.alpha / 2, n - 2);
  const slopeCi = [slope - tCritical * slopeSe, slope + tCritical * slopeSe];
  const interceptCi = [intercept - tCritical * interceptSe, intercept + tCritical * interceptSe];
  const rSquared = sst === 0 ? 0 : 1 - sse / sst;

  return {
    testId: "simple_linear_regression",
    testName: TEST_LIBRARY.simple_linear_regression.name,
    statisticLabel: "Slope t",
    statisticValue: slopeT,
    degreesOfFreedom: n - 2,
    pValue: slopeP,
    effectLabel: "R squared",
    effectValue: rSquared,
    ciLabel: ciLevelLabel(),
    ci: slopeCi,
    sampleSummary: `n=${n}`,
    warnings: [...context.warnings],
    assumptions: TEST_LIBRARY.simple_linear_regression.assumptions,
    interpretation: slopeP < state.objective.alpha
      ? `The predictor "${context.predictorName}" is significantly associated with changes in "${context.outcomeName}" at alpha ${state.objective.alpha}.`
      : `At alpha ${state.objective.alpha}, the fitted slope for "${context.predictorName}" is not statistically significant.`,
    details: [
      { title: "Regression line", items: [`${context.outcomeName} = ${formatNumber(intercept)} + ${formatNumber(slope)} x ${context.predictorName}`, `R^2 = ${formatNumber(rSquared)}`] },
      { title: "Coefficient intervals", items: [`Slope ${ciLevelLabel()} ${formatInterval(slopeCi)}`, `Intercept ${ciLevelLabel()} ${formatInterval(interceptCi)}`] }
    ],
    coefficients: [
      { term: "Intercept", estimate: intercept, standardError: interceptSe, statistic: intercept / interceptSe, pValue: pValueFromSymmetricStatistic(intercept / interceptSe, (value) => studentTCdf(value, n - 2)), lower: interceptCi[0], upper: interceptCi[1] },
      { term: context.predictorName, estimate: slope, standardError: slopeSe, statistic: slopeT, pValue: slopeP, lower: slopeCi[0], upper: slopeCi[1] }
    ]
  };
}

function runBinaryLogisticRegression(context) {
  const n = context.totalUsed;
  const xMean = mean(context.x);
  const xSd = stdDev(context.x);
  if (xSd === 0) {
    throw new Error("Binary logistic regression requires a predictor with non-zero variance.");
  }

  const scaledX = context.x.map((value) => (value - xMean) / xSd);
  let beta0 = Math.log((sum(context.y) + 0.5) / (n - sum(context.y) + 0.5));
  let beta1 = 0;
  let converged = false;
  let information = null;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const probabilities = scaledX.map((value) => clampProbability(sigmoid(beta0 + beta1 * value)));
    const weights = probabilities.map((value) => value * (1 - value));
    const gradient0 = sum(context.y.map((value, index) => value - probabilities[index]));
    const gradient1 = sum(context.y.map((value, index) => (value - probabilities[index]) * scaledX[index]));
    const i00 = sum(weights);
    const i01 = sum(weights.map((weight, index) => weight * scaledX[index]));
    const i11 = sum(weights.map((weight, index) => weight * scaledX[index] * scaledX[index]));
    const determinant = i00 * i11 - i01 * i01;
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-10) {
      throw new Error("Binary logistic regression became numerically unstable, which often indicates near-separation or a constant predictor.");
    }

    const step0 = (gradient0 * i11 - gradient1 * i01) / determinant;
    const step1 = (i00 * gradient1 - i01 * gradient0) / determinant;
    beta0 += step0;
    beta1 += step1;
    information = { i00, i01, i11 };

    if (Math.max(Math.abs(step0), Math.abs(step1)) < 1e-8) {
      converged = true;
      break;
    }
  }

  if (!information) {
    throw new Error("Binary logistic regression did not initialize correctly.");
  }

  const scaledCovariance = invert2x2(information.i00, information.i01, information.i11);
  const intercept = beta0 - (beta1 * xMean) / xSd;
  const slope = beta1 / xSd;
  const interceptVar = scaledCovariance[0][0] + ((xMean / xSd) ** 2) * scaledCovariance[1][1] - 2 * (xMean / xSd) * scaledCovariance[0][1];
  const slopeVar = scaledCovariance[1][1] / (xSd ** 2);
  const interceptCovSlope = scaledCovariance[0][1] / xSd - (xMean * scaledCovariance[1][1]) / (xSd ** 2);
  const interceptSe = Math.sqrt(Math.max(interceptVar, 0));
  const slopeSe = Math.sqrt(Math.max(slopeVar, 0));
  const zCritical = inverseNormalCdf(1 - state.objective.alpha / 2);
  const slopeZ = slope / slopeSe;
  const interceptZ = intercept / interceptSe;
  const slopeP = pValueFromSymmetricStatistic(slopeZ, normalCdf);
  const interceptP = 2 * Math.min(normalCdf(interceptZ), 1 - normalCdf(interceptZ));
  const slopeCi = [slope - zCritical * slopeSe, slope + zCritical * slopeSe];
  const interceptCi = [intercept - zCritical * interceptSe, intercept + zCritical * interceptSe];

  const predicted = context.x.map((value) => clampProbability(sigmoid(intercept + slope * value)));
  const logLikelihood = sum(context.y.map((value, index) => value * Math.log(predicted[index]) + (1 - value) * Math.log(1 - predicted[index])));
  const outcomeMean = mean(context.y);
  const nullLogLikelihood = sum(context.y.map((value) => value * Math.log(outcomeMean) + (1 - value) * Math.log(1 - outcomeMean)));
  const pseudoR2 = 1 - logLikelihood / nullLogLikelihood;

  const warnings = [...context.warnings];
  if (!converged) warnings.push("The logistic model reached the iteration limit before satisfying a strict convergence threshold.");
  if (Math.max(...predicted) > 0.99 || Math.min(...predicted) < 0.01) warnings.push("Predicted probabilities are extremely close to 0 or 1, which may indicate near-separation.");
  if (Math.abs(interceptCovSlope) > 1e6) warnings.push("The fitted covariance structure is unstable.");

  return {
    testId: "binary_logistic_regression",
    testName: TEST_LIBRARY.binary_logistic_regression.name,
    statisticLabel: "Slope z",
    statisticValue: slopeZ,
    degreesOfFreedom: null,
    pValue: slopeP,
    effectLabel: "Odds ratio",
    effectValue: Math.exp(slope),
    ciLabel: ciLevelLabel(),
    ci: [Math.exp(slopeCi[0]), Math.exp(slopeCi[1])],
    sampleSummary: `n=${n}; event = "${context.outcomeLabels[1]}"`,
    warnings,
    assumptions: TEST_LIBRARY.binary_logistic_regression.assumptions,
    interpretation: slopeP < state.objective.alpha
      ? `The predictor "${context.predictorName}" is significantly associated with the odds of "${context.outcomeLabels[1]}" at alpha ${state.objective.alpha}.`
      : `At alpha ${state.objective.alpha}, the fitted log-odds slope for "${context.predictorName}" is not statistically significant.`,
    details: [
      { title: "Model fit", items: [`McFadden pseudo R^2 = ${formatNumber(pseudoR2)}`, `Odds ratio for ${context.predictorName} = ${formatNumber(Math.exp(slope))}`] },
      { title: "Coefficient intervals", items: [`Log-odds slope ${ciLevelLabel()} ${formatInterval(slopeCi)}`, `Odds ratio ${ciLevelLabel()} ${formatInterval([Math.exp(slopeCi[0]), Math.exp(slopeCi[1])])}`] }
    ],
    coefficients: [
      { term: "Intercept", estimate: intercept, standardError: interceptSe, statistic: interceptZ, pValue: interceptP, lower: interceptCi[0], upper: interceptCi[1] },
      { term: context.predictorName, estimate: slope, standardError: slopeSe, statistic: slopeZ, pValue: slopeP, lower: slopeCi[0], upper: slopeCi[1] }
    ]
  };
}

function finalizeResult(result) {
  return {
    ...result,
    overviewCards: [
      { label: "Test", value: result.testName, copy: result.sampleSummary },
      { label: "Statistic", value: `${result.statisticLabel} = ${formatNumber(result.statisticValue)}`, copy: result.degreesOfFreedom !== null ? `df ${result.degreesOfFreedom}` : "Distribution-specific statistic" },
      { label: "p-value", value: formatPValue(result.pValue), copy: `alpha = ${state.objective.alpha}` },
      { label: result.effectLabel, value: formatNumber(result.effectValue), copy: result.ci ? `${result.ciLabel} ${formatInterval(result.ci)}` : "Effect-size summary" }
    ],
    specRows: buildSpecRows(result.testName)
  };
}

function renderRecommendation() {
  if (!state.recommendation) {
    if (dom.recommendedTestName) dom.recommendedTestName.textContent = "No recommendation yet";
    if (dom.recommendedTestSummary) dom.recommendedTestSummary.textContent = "Complete the objective step to generate a recommendation.";
    if (dom.recommendedTestBadge) dom.recommendedTestBadge.textContent = "Pending";
    if (dom.reviewStatusBadge) dom.reviewStatusBadge.textContent = "Awaiting recommendation";
    renderList(dom.reviewWhyList, [], "The selector has not run yet.");
    renderList(dom.reviewAssumptions, [], "Assumptions will appear here.");
    renderList(dom.reviewWarnings, [], "Warnings will appear here.");
    if (dom.reviewExplanation) dom.reviewExplanation.textContent = "";
    if (dom.reviewAlternatives) dom.reviewAlternatives.innerHTML = "";
    if (dom.reviewSpecSummary) dom.reviewSpecSummary.innerHTML = renderSpecSummaryHtml(buildSpecRows("Pending"));
    return;
  }

  const recommendation = state.recommendation;
  if (dom.recommendedTestName) dom.recommendedTestName.textContent = recommendation.testName;
  if (dom.recommendedTestSummary) dom.recommendedTestSummary.textContent = recommendation.summary;
  if (dom.recommendedTestBadge) {
    dom.recommendedTestBadge.textContent = recommendation.statusLabel;
    dom.recommendedTestBadge.className = `wizard-pill ${recommendation.statusClass}`.trim();
  }
  if (dom.reviewStatusBadge) {
    dom.reviewStatusBadge.textContent = recommendation.statusLabel;
    dom.reviewStatusBadge.className = `wizard-pill ${recommendation.statusClass}`.trim();
  }

  renderList(dom.reviewWhyList, recommendation.reasons, "No rationale was generated.");
  renderList(dom.reviewAssumptions, recommendation.assumptions, "No assumptions were recorded.");
  renderList(dom.reviewWarnings, recommendation.warnings, "No active warnings.");
  if (dom.reviewExplanation) dom.reviewExplanation.textContent = recommendation.explanation;
  if (dom.reviewAlternatives) {
    dom.reviewAlternatives.innerHTML = recommendation.alternatives
      .map((alternative) => `
        <article class="alternative-card">
          <h5>${escapeHtml(alternative.name)}</h5>
          <p>${escapeHtml(alternative.reason)}</p>
        </article>
      `)
      .join("");
  }
  if (dom.reviewSpecSummary) dom.reviewSpecSummary.innerHTML = renderSpecSummaryHtml(recommendation.specRows);
}

function renderResults() {
  if (!state.result) {
    if (dom.resultsOverview) dom.resultsOverview.innerHTML = "";
    if (dom.resultInterpretation) dom.resultInterpretation.textContent = "Run the suggested test to see browser-side results here.";
    renderList(dom.resultWarnings, [], "Warnings will appear here.");
    renderList(dom.resultAssumptions, [], "Assumptions will appear here.");
    if (dom.resultDetails) dom.resultDetails.innerHTML = "";
    if (dom.resultSpecSummary) dom.resultSpecSummary.innerHTML = renderSpecSummaryHtml(buildSpecRows("Pending"));
    if (dom.resultCoefficients) dom.resultCoefficients.innerHTML = '<div class="text-sm text-gray-500 p-4">Coefficient output appears here when relevant.</div>';
    return;
  }

  const result = state.result;
  if (dom.resultsBadge) dom.resultsBadge.textContent = result.pValue < state.objective.alpha ? "Signal detected" : "Result ready";
  if (dom.resultsOverview) {
    dom.resultsOverview.innerHTML = result.overviewCards
      .map((card) => `
        <article class="result-card">
          <div class="result-card-label">${escapeHtml(card.label)}</div>
          <div class="result-card-value">${escapeHtml(card.value)}</div>
          <div class="result-card-copy">${escapeHtml(card.copy)}</div>
        </article>
      `)
      .join("");
  }
  if (dom.resultInterpretation) dom.resultInterpretation.textContent = result.interpretation;
  renderList(dom.resultWarnings, result.warnings, "No active warnings.");
  renderList(dom.resultAssumptions, result.assumptions, "No assumptions were recorded.");
  if (dom.resultDetails) {
    dom.resultDetails.innerHTML = result.details
      .map((detail) => `
        <article class="result-detail-card">
          <h5>${escapeHtml(detail.title)}</h5>
          ${detail.items ? `<ul>${detail.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p>${escapeHtml(detail.body || "")}</p>`}
        </article>
      `)
      .join("");
  }
  if (dom.resultSpecSummary) dom.resultSpecSummary.innerHTML = renderSpecSummaryHtml(result.specRows);
  if (dom.resultCoefficients) {
    dom.resultCoefficients.innerHTML = result.coefficients.length
      ? `
          <table class="coef-table">
            <thead>
              <tr>
                <th>Term</th>
                <th>Estimate</th>
                <th>SE</th>
                <th>Statistic</th>
                <th>p-value</th>
                <th>Lower</th>
                <th>Upper</th>
              </tr>
            </thead>
            <tbody>
              ${result.coefficients
                .map((coefficient) => `
                  <tr>
                    <td><strong>${escapeHtml(coefficient.term)}</strong></td>
                    <td>${formatNumber(coefficient.estimate)}</td>
                    <td>${formatNumber(coefficient.standardError)}</td>
                    <td>${formatNumber(coefficient.statistic)}</td>
                    <td>${formatPValue(coefficient.pValue)}</td>
                    <td>${formatNumber(coefficient.lower)}</td>
                    <td>${formatNumber(coefficient.upper)}</td>
                  </tr>
                `)
                .join("")}
            </tbody>
          </table>
        `
      : '<div class="text-sm text-gray-500 p-4">This method does not produce a coefficient table.</div>';
  }
}

function renderList(element, items, emptyMessage) {
  if (!element) return;
  if (!items.length) {
    element.classList.add("empty");
    element.innerHTML = `<li>${escapeHtml(emptyMessage)}</li>`;
    return;
  }
  element.classList.remove("empty");
  element.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderSpecSummaryHtml(rows) {
  return rows
    .map((row) => `
      <dl class="spec-row">
        <dt>${escapeHtml(row.label)}</dt>
        <dd>${escapeHtml(row.value)}</dd>
      </dl>
    `)
    .join("");
}

function populateSelect(select, options, placeholderLabel) {
  if (!select) return;
  select.innerHTML = [`<option value="">${escapeHtml(placeholderLabel)}</option>`, ...options.map((option) => `<option value="${escapeHtmlAttribute(option.value)}">${escapeHtml(option.label)}</option>`)].join("");
}

function populateMultiSelect(select, options) {
  if (!select) return;
  select.innerHTML = options.map((option) => `<option value="${escapeHtmlAttribute(option.value)}">${escapeHtml(option.label)}</option>`).join("");
}

function getMultiSelectValues(select) {
  if (!select) return [];
  return Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean);
}

function setMultiSelectValues(select, values) {
  if (!select) return;
  const valueSet = new Set(values);
  Array.from(select.options).forEach((option) => {
    option.selected = valueSet.has(option.value);
  });
}

function getCheckedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function getEffectiveType(columnName) {
  return state.typeOverrides[columnName] || state.profile.find((column) => column.name === columnName)?.inferredType || "categorical";
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });
  return Array.from(duplicates);
}

function isMissing(value) {
  const text = String(value ?? "").trim();
  return MISSING_TOKENS.has(text.toLowerCase());
}

function parseLocaleNumber(value) {
  const raw = String(value ?? "").trim();
  if (isMissing(raw)) return NaN;
  let normalized = raw.replace(/\s+/g, "");
  if (/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^[-+]?\d+,\d+$/.test(normalized)) {
    normalized = normalized.replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i.test(normalized)) {
    return NaN;
  }
  return Number(normalized);
}

function uniquePreserveOrder(values, keyFn = (value) => String(value)) {
  const seen = new Set();
  const output = [];
  values.forEach((value) => {
    const key = keyFn(value);
    if (seen.has(key)) return;
    seen.add(key);
    output.push(value);
  });
  return output;
}

function canonicalValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCategory(value) {
  return String(value ?? "").trim();
}

function computeExpectedTable(matrix) {
  const rowTotals = matrix.map((row) => sum(row));
  const columnTotals = matrix[0].map((_, columnIndex) => sum(matrix.map((row) => row[columnIndex])));
  const total = sum(rowTotals);
  return matrix.map((row, rowIndex) => row.map((_, columnIndex) => (rowTotals[rowIndex] * columnTotals[columnIndex]) / total));
}

function flattenContingencyTable(rowLevels, columnLevels, matrix, roundValues = false) {
  const output = [];
  for (let rowIndex = 0; rowIndex < rowLevels.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnLevels.length; columnIndex += 1) {
      output.push(`${rowLevels[rowIndex]} x ${columnLevels[columnIndex]}: ${roundValues ? formatNumber(matrix[rowIndex][columnIndex]) : matrix[rowIndex][columnIndex]}`);
    }
  }
  return output;
}

function invert2x2(a, b, c) {
  const determinant = a * c - b * b;
  if (Math.abs(determinant) < 1e-12) {
    throw new Error("A 2x2 matrix was singular during model fitting.");
  }
  return [
    [c / determinant, -b / determinant],
    [-b / determinant, a / determinant]
  ];
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function clampProbability(value) {
  return Math.min(1 - 1e-8, Math.max(1e-8, value));
}

function clamp(value, lower, upper) {
  return Math.min(upper, Math.max(lower, value));
}

function setMessage(element, type, message, silentEmpty = false) {
  if (!element) return;
  element.classList.remove("hidden", "error", "warning");
  if (!message && silentEmpty) {
    element.textContent = "";
    element.classList.add("hidden");
    return;
  }
  element.classList.add(type);
  element.textContent = message;
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = "";
  element.classList.add("hidden");
  element.classList.remove("error", "warning");
}

function humanizeDelimiter(delimiter) {
  if (delimiter === "\t") return "Tab";
  if (delimiter === ";") return "Semicolon";
  if (delimiter === "|") return "Pipe";
  return "Comma";
}

function humanizeType(type) {
  return type === "non-parametric-only"
    ? "Non-parametric only"
    : type === "parametric-only"
      ? "Parametric only"
      : type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}

function humanizeGoal(goal) {
  return goal.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function humanizeDesign(design) {
  return design.charAt(0).toUpperCase() + design.slice(1);
}

function humanizeTail(tail) {
  return tail === "two-sided" ? "Two-sided" : tail.charAt(0).toUpperCase() + tail.slice(1);
}

function humanizeParametricPreference(preference) {
  if (preference === "parametric-only") return "Parametric only";
  if (preference === "non-parametric-only") return "Non-parametric only";
  return "Auto";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024)} KB`;
  return `${formatNumber(bytes / (1024 * 1024))} MB`;
}

function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return "NA";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.abs(value) < 1 && value !== 0 ? Math.min(digits, 3) : 0
  });
}

function formatPercent(value) {
  return `${formatNumber(value * 100, 1)}%`;
}

function formatPValue(value) {
  if (!Number.isFinite(value)) return "NA";
  if (value < 0.0001) return "< 0.0001";
  return formatNumber(value, 4);
}

function formatInterval(interval) {
  if (!interval) return "";
  return `[${formatNumber(interval[0])}, ${formatNumber(interval[1])}]`;
}

function sleep(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value);
}
