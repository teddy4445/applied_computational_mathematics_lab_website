(() => {
      const ROLE_DEFS = [
        { key: 'conceptualization', label: 'Conceptualization', weight: 1.0 },
        { key: 'methodology', label: 'Methodology', weight: 1.0 },
        { key: 'software', label: 'Software / data / experiments', weight: 0.9 },
        { key: 'analysis', label: 'Analysis', weight: 1.0 },
        { key: 'draft', label: 'Writing - original draft', weight: 1.2 },
        { key: 'review', label: 'Writing - review & editing', weight: 0.7 },
        { key: 'supervision', label: 'Supervision / funding / administration', weight: 0.7 }
      ];

      const FIELD_SETTINGS = {
        biomedical: { label: 'Biomedical / life sciences', orderFactor: 1.15, alphabetical: false, lastBoost: 1.2 },
        'computer-science': { label: 'Computer science', orderFactor: 1.0, alphabetical: false, lastBoost: 0.95 },
        economics: { label: 'Economics / social science', orderFactor: 0.92, alphabetical: false, lastBoost: 0.85 },
        alphabetical: { label: 'Alphabetical-order tradition', orderFactor: 0.38, alphabetical: true, lastBoost: 0.4 },
        custom: { label: 'Custom / mixed', orderFactor: 0.82, alphabetical: false, lastBoost: 0.9 }
      };

      const STAGE_SETTINGS = {
        early: { label: 'Early collaboration', pressure: 12 },
        drafting: { label: 'Drafting', pressure: 22 },
        'near-submission': { label: 'Near submission', pressure: 34 },
        'under-revision': { label: 'Under revision', pressure: 38 }
      };

      const CAREER_STAGES = [
        { value: 'phd', label: 'PhD student' },
        { value: 'postdoc', label: 'Postdoc' },
        { value: 'pi', label: 'PI / faculty' },
        { value: 'staff', label: 'Research staff' },
        { value: 'other', label: 'Other' }
      ];

      const RELATIONSHIPS = [
        { value: 'none', label: 'None' },
        { value: 'advisor', label: 'Advisor of another author' },
        { value: 'advisee', label: 'Advisee of another author' },
        { value: 'peer', label: 'Peer collaborator' }
      ];

      const DEFAULT_CONTEST = '';

      const authorCountSelect = document.getElementById('author-count');
      const correspondingAuthorSelect = document.getElementById('corresponding-author');
      const scenarioAuthorSelect = document.getElementById('scenario-author');
      const authorsContainer = document.getElementById('authors-container');
      const fieldConventionSelect = document.getElementById('field-convention');
      const projectStageSelect = document.getElementById('project-stage');
      const largeCollabCheckbox = document.getElementById('large-collab');
      const form = document.getElementById('risk-form');
      const menuButton = document.getElementById('menu-btn');
      const mobileMenu = document.getElementById('mobile-menu');
      const navbar = document.getElementById('navbar');

      const computeButton = document.getElementById('compute-results');
      const resultsBody = document.getElementById('results-body');
      const resultsPlaceholder = document.getElementById('results-placeholder');
      const exportButton = document.getElementById('export-summary');
      const copyButton = document.getElementById('copy-link');

      let state = loadInitialState();
      let latestAnalysis = null;
      let hasComputed = false;

      buildAuthorCountOptions();
      syncTopLevelFields();
      renderAuthors();
      updateLinkedSelectors();
      resetResultsView('Complete the setup and click Compute fragility to see the analysis.');
      document.getElementById('footer-year').textContent = String(new Date().getFullYear());

      if (computeButton) {
        computeButton.addEventListener('click', () => {
          clearValidationErrors();
          const errors = validateState(state);
          if (errors.length) {
            resetResultsView('Complete the required fields before computing results.');
            applyValidationErrors(errors);
            setStatus(errors.map((error) => error.message).join(' '));
            return;
          }
          hasComputed = true;
          recomputeAndRender();
          if (resultsBody) resultsBody.hidden = false;
          if (resultsPlaceholder) resultsPlaceholder.hidden = true;
          if (exportButton) exportButton.disabled = false;
          if (copyButton) copyButton.disabled = false;
          setStatus('Results updated.');
        });
      }
      if (exportButton) {
        exportButton.addEventListener('click', () => {
          if (!latestAnalysis) return;
          exportSummary(latestAnalysis);
        });
      }
      if (copyButton) {
        copyButton.addEventListener('click', async () => {
          try {
            const shareUrl = buildShareUrl();
            await copyText(shareUrl);
            setStatus('Shareable link copied to the clipboard.');
          } catch (error) {
            setStatus('Could not copy automatically. The current state remains available on this page.');
          }
        });
      }
      form.addEventListener('input', handleFormEvent);
      form.addEventListener('change', handleFormEvent);
      scenarioAuthorSelect.addEventListener('change', () => {
        if (hasComputed && latestAnalysis) renderScenarios(latestAnalysis);
      });
      menuButton.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        mobileMenu.hidden = !isOpen;
        menuButton.setAttribute('aria-expanded', String(isOpen));
      });
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
      navbar.classList.toggle('scrolled', window.scrollY > 10);

      function handleFormEvent(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.id === 'field-convention') {
          state.fieldConvention = fieldConventionSelect.value;          resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
          return;
        }
        if (target.id === 'project-stage') {
          state.projectStage = projectStageSelect.value;          resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
          return;
        }
        if (target.id === 'author-count') {
          resizeAuthors(Number(authorCountSelect.value));          syncTopLevelFields();
          renderAuthors();
          updateLinkedSelectors();
          resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
          return;
        }
        if (target.id === 'corresponding-author') {
          state.correspondingAuthorId = correspondingAuthorSelect.value;          resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
          return;
        }
        if (target.id === 'large-collab') {
          state.largeCollab = largeCollabCheckbox.checked;          resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
          return;
        }
        const authorId = target.getAttribute('data-author-id');
        if (!authorId) return;
        const author = state.authors.find((entry) => entry.id === authorId);
        if (!author) return;        if (target.hasAttribute('data-field')) {
          const field = target.getAttribute('data-field');
          if (field === 'bylinePosition') {
            swapBylinePositions(authorId, Number(target.value));
            renderAuthors();
            updateLinkedSelectors();
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
          if (field === 'name') {
            author.name = target.value;
            updateLinkedSelectors();
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
          if (field === 'relationship') {
            author.relationship = target.value;
            if (author.relationship === 'none') author.relatedAuthorId = '';
            renderAuthors();
            updateLinkedSelectors();
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
          if (field === 'relatedAuthorId') {
            author.relatedAuthorId = target.value;
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
          if (field === 'importance') {
            author.importance = clampNumber(Number(target.value), 1, 5);
            updateInlineValue(target, author.importance);
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
          if (field === 'contest') {
            author.contest = target.value;
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
          if (field === 'careerStage') {
            author.careerStage = target.value;
            resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
            return;
          }
        }
        const roleKey = target.getAttribute('data-role');
        if (roleKey) {
          author.roles[roleKey] = clampNumber(Number(target.value), 0, 5);
          updateInlineValue(target, author.roles[roleKey]);
          resetResultsView('Inputs changed. Click Compute fragility to refresh the results.');
        }
      }

      function syncTopLevelFields() {
        normalizeState(state);
        fieldConventionSelect.value = state.fieldConvention;
        projectStageSelect.value = state.projectStage;
        authorCountSelect.value = String(state.authorCount);
        largeCollabCheckbox.checked = Boolean(state.largeCollab);
      }
      function renderAuthors() {
        normalizeState(state);
        const authorOptions = buildAuthorOptions(state.authors);
        authorsContainer.innerHTML = state.authors.map((author, index) => {
          const displayName = getDisplayName(author, index);
          const relationshipOptions = RELATIONSHIPS.map((option) => `<option value="${option.value}"${option.value === author.relationship ? ' selected' : ''}>${option.label}</option>`).join('');
          const careerOptions = CAREER_STAGES.map((option) => `<option value="${option.value}"${option.value === author.careerStage ? ' selected' : ''}>${option.label}</option>`).join('');
          const relatedOptions = [`<option value="">Select author</option>`].concat(authorOptions.filter((option) => option.id !== author.id).map((option) => `<option value="${option.id}"${option.id === author.relatedAuthorId ? ' selected' : ''}>${escapeHtml(option.label)}</option>`)).join('');
          const bylineOptions = Array.from({ length: state.authorCount }, (_, position) => {
            const value = position + 1;
            return `<option value="${value}"${value === author.bylinePosition ? ' selected' : ''}>${value}</option>`;
          }).join('');
          const contestOptions = [`<option value=""${author.contest === '' ? ' selected' : ''}>Not set</option>`].concat(Array.from({ length: 5 }, (_, idx) => {
            const value = String(idx + 1);
            return `<option value="${value}"${value === author.contest ? ' selected' : ''}>${value}</option>`;
          })).join('');
          return `
            <section class="author-card" aria-labelledby="author-title-${author.id}">
              <div class="author-header">
                <div>
                  <h3 id="author-title-${author.id}">${escapeHtml(displayName)}</h3>
                  <div class="author-chips">
                    <span class="mini-chip is-soft">Proposed byline #${author.bylinePosition}</span>
                    <span class="mini-chip is-soft">${escapeHtml(careerStageLabel(author.careerStage))}</span>
                    <span class="mini-chip is-soft">Importance ${author.importance}/5</span>
                  </div>
                </div>
              </div>
              <div class="author-grid">
                <div class="field">
                  <label for="name-${author.id}">Author name</label>
                  <input id="name-${author.id}" data-author-id="${author.id}" data-field="name" type="text" value="${escapeAttr(author.name)}" placeholder="Author ${index + 1}" />
                </div>
                <div class="field">
                  <label for="position-${author.id}">Proposed byline position</label>
                  <select id="position-${author.id}" data-author-id="${author.id}" data-field="bylinePosition">${bylineOptions}</select>
                </div>
                <div class="field">
                  <label for="career-${author.id}">Career stage</label>
                  <select id="career-${author.id}" data-author-id="${author.id}" data-field="careerStage">${careerOptions}</select>
                </div>
                <div class="field">
                  <label for="relationship-${author.id}">Relationship marker</label>
                  <select id="relationship-${author.id}" data-author-id="${author.id}" data-field="relationship">${relationshipOptions}</select>
                </div>
                <div class="field">
                  <label for="related-${author.id}">Related author</label>
                  <select id="related-${author.id}" data-author-id="${author.id}" data-field="relatedAuthorId"${author.relationship === 'none' ? ' disabled' : ''}>${relatedOptions}</select>
                </div>
                <div class="field">
                  <label for="contest-${author.id}">Willingness to contest authorship</label>
                  <select id="contest-${author.id}" data-author-id="${author.id}" data-field="contest">${contestOptions}</select>
                </div>
              </div>
              <div class="role-grid">
                <div class="range-row role-item">
                  <div class="range-top">
                    <label for="importance-${author.id}">Publication importance</label>
                    <span class="range-value" id="value-importance-${author.id}">${author.importance}</span>
                  </div>
                  <input id="importance-${author.id}" data-author-id="${author.id}" data-field="importance" type="range" min="1" max="5" step="1" value="${author.importance}" aria-describedby="importance-help-${author.id}" />
                  
                </div>
                ${ROLE_DEFS.map((role) => `
                  <div class="range-row role-item">
                    <div class="range-top">
                      <label for="${role.key}-${author.id}">${escapeHtml(role.label)}</label>
                      <span class="range-value" id="value-${role.key}-${author.id}">${author.roles[role.key]}</span>
                    </div>
                    <input id="${role.key}-${author.id}" data-author-id="${author.id}" data-role="${role.key}" type="range" min="0" max="5" step="1" value="${author.roles[role.key]}" />
                  </div>
                `).join('')}
              </div>
            </section>
          `;
        }).join('');
      }

      function updateLinkedSelectors() {
        normalizeState(state);
        const options = buildAuthorOptions(state.authors);
        correspondingAuthorSelect.innerHTML = options.map((option) => `<option value="${option.id}"${option.id === state.correspondingAuthorId ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
        if (!options.some((option) => option.id === state.correspondingAuthorId)) {
          state.correspondingAuthorId = options[0]?.id || '';
          correspondingAuthorSelect.value = state.correspondingAuthorId;
        }
        scenarioAuthorSelect.innerHTML = options.map((option) => `<option value="${option.id}">${escapeHtml(option.label)}</option>`).join('');
        const preferredId = latestAnalysis?.exposedAuthors?.[0]?.id || state.authors[0]?.id || '';
        if (options.some((option) => option.id === scenarioAuthorSelect.value)) return;
        scenarioAuthorSelect.value = preferredId;
      }

      function recomputeAndRender() {
        if (!hasComputed) return;
        normalizeState(state);
        latestAnalysis = computeAnalysis(state);
        renderScore(latestAnalysis);
        renderVetoPoints(latestAnalysis);
        renderMismatchTable(latestAnalysis);
        renderExposedAuthors(latestAnalysis);
        renderActions(latestAnalysis);
        renderBreakdown(latestAnalysis);
        renderScenarios(latestAnalysis);
        updateLinkedSelectors();
      }

      function validateState(stateToValidate) {
        const errors = [];
        const draft = cloneState(stateToValidate);
        normalizeState(draft);
        if (!draft.correspondingAuthorId) errors.push({ message: 'Select a corresponding author.', elementId: 'corresponding-author' });
        draft.authors.forEach((author, index) => {
          if (author.relationship !== 'none' && author.relationship !== 'peer' && !author.relatedAuthorId) {
            errors.push({ message: `Select the related author for ${getDisplayName(author, index)}.`, elementId: `related-${author.id}` });
          }
        });
        return errors;
      }
      function clearValidationErrors() {
        document.querySelectorAll('.is-invalid').forEach((node) => node.classList.remove('is-invalid'));
        document.querySelectorAll('[data-validation-note]').forEach((node) => node.remove());
      }
      function applyValidationErrors(errors) {
        let firstElement = null;
        errors.forEach((error) => {
          const element = document.getElementById(error.elementId);
          if (!element) return;
          const wrapper = element.closest('.field, .range-row, .checkbox-field') || element.parentElement;
          if (wrapper) {
            wrapper.classList.add('is-invalid');
            if (!wrapper.querySelector('[data-validation-note]')) {
              const note = document.createElement('div');
              note.className = 'validation-note';
              note.setAttribute('data-validation-note', 'true');
              note.textContent = error.message;
              wrapper.appendChild(note);
            }
          }
          element.classList.add('is-invalid');
          if (!firstElement) firstElement = element;
        });
        if (firstElement) {
          firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.setTimeout(() => firstElement.focus({ preventScroll: true }), 140);
        }
      }
      function resetResultsView(message) {
        clearValidationErrors();
        hasComputed = false;
        latestAnalysis = null;
        if (resultsBody) resultsBody.hidden = true;
        if (resultsPlaceholder) {
          resultsPlaceholder.hidden = false;
          resultsPlaceholder.innerHTML = message || 'Complete the setup and click <strong>Compute fragility</strong> to show the score, mismatch table, likely veto points, and action plan.';
        }
        if (exportButton) exportButton.disabled = true;
        if (copyButton) copyButton.disabled = true;
        setStatus(message || 'Inputs updated.');
      }

      function renderScore(analysis) {
        const score = Math.round(analysis.finalScore);
        const scoreBarFill = document.getElementById('score-bar-fill');
        const badge = document.getElementById('risk-badge');
        document.getElementById('score-value').textContent = String(score);
        document.getElementById('score-summary').textContent = analysis.scoreSummary;
        document.getElementById('summary-field').textContent = FIELD_SETTINGS[state.fieldConvention].label;
        document.getElementById('summary-stage').textContent = STAGE_SETTINGS[state.projectStage].label;
        document.getElementById('summary-corresponding').textContent = getDisplayNameById(state.correspondingAuthorId);
        document.getElementById('summary-pressure').textContent = analysis.primaryPressure;
        if (scoreBarFill) {
          scoreBarFill.style.width = `${score}%`;
          scoreBarFill.setAttribute('aria-valuenow', String(score));
          scoreBarFill.style.background = score < 25 ? '#22c55e' : score < 50 ? '#eab308' : '#ef4444';
        }
        badge.textContent = analysis.riskBand;
        badge.className = `risk-badge ${analysis.riskClass}`;
      }
      function renderVetoPoints(analysis) {
        document.getElementById('veto-list').innerHTML = analysis.vetoPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
      }
      function renderMismatchTable(analysis) {
        document.getElementById('mismatch-body').innerHTML = analysis.mismatchRows.map((row) => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>#${row.proposedPosition}</td>
            <td>#${row.expectedRank}</td>
            <td>${row.gapLabel}</td>
            <td>${escapeHtml(row.note)}</td>
          </tr>
        `).join('');
      }
      function renderExposedAuthors(analysis) {
        const container = document.getElementById('exposed-list');
        if (!analysis.exposedAuthors.length) {
          container.innerHTML = '<div class="exposed-item"><strong>No author is especially exposed right now.</strong><p>The current arrangement looks comparatively balanced, though documenting the rationale is still useful.</p></div>';
          return;
        }
        container.innerHTML = analysis.exposedAuthors.map((author) => `
          <div class="exposed-item">
            <strong>${escapeHtml(author.name)}</strong>
            <p>${escapeHtml(author.reason)}</p>
          </div>
        `).join('');
      }
      function renderActions(analysis) {
        document.getElementById('action-list').innerHTML = analysis.actions.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      }
      function renderBreakdown(analysis) {
        document.getElementById('breakdown-list').innerHTML = analysis.breakdown.map((item) => `
          <div class="breakdown-row">
            <div class="scenario-top">
              <strong>${escapeHtml(item.label)}</strong>
              <span class="mini-chip is-soft">${Math.round(item.value)}</span>
            </div>
            <div class="breakdown-bar" aria-hidden="true"><span style="width: ${Math.round(item.value)}%;"></span></div>
            <p>${escapeHtml(item.description)}</p>
          </div>
        `).join('');
      }

      function renderScenarios(analysis) {
        const container = document.getElementById('scenario-list');
        const scenarios = buildScenarios(state, analysis, scenarioAuthorSelect.value);
        container.innerHTML = scenarios.map((scenario) => {
          if (!scenario.available) {
            return `
              <div class="scenario-card">
                <div class="scenario-top">
                  <div>
                    <strong>${escapeHtml(scenario.label)}</strong>
                    <p>${escapeHtml(scenario.description)}</p>
                  </div>
                  <span class="delta-chip is-flat">Unavailable</span>
                </div>
              </div>
            `;
          }
          return `
            <div class="scenario-card">
              <div class="scenario-top">
                <div>
                  <strong>${escapeHtml(scenario.label)}</strong>
                  <p>${escapeHtml(scenario.description)}</p>
                </div>
                <span class="delta-chip ${scenario.deltaClass}">${escapeHtml(scenario.deltaLabel)}</span>
              </div>
              <div class="scenario-actions">
                <button class="scenario-btn" type="button" data-scenario-key="${scenario.key}">Apply scenario</button>
                <span class="helper-text">Projected score: ${Math.round(scenario.analysis.finalScore)}</span>
              </div>
            </div>
          `;
        }).join('');
        container.querySelectorAll('[data-scenario-key]').forEach((button) => {
          button.addEventListener('click', () => {
            const key = button.getAttribute('data-scenario-key');
            const nextScenario = scenarios.find((scenario) => scenario.key === key);
            if (!nextScenario?.available) return;
            state = nextScenario.state;
            syncTopLevelFields();
            renderAuthors();
            updateLinkedSelectors();
            hasComputed = true;
            recomputeAndRender();
            if (resultsBody) resultsBody.hidden = false;
            if (resultsPlaceholder) resultsPlaceholder.hidden = true;
            if (exportButton) exportButton.disabled = false;
            if (copyButton) copyButton.disabled = false;
            setStatus(`Applied scenario: ${nextScenario.label}.`);
          });
        });
      }

      function computeAnalysis(currentState) {
        const normalized = cloneState(currentState);
        normalizeState(normalized);
        const field = FIELD_SETTINGS[normalized.fieldConvention] || FIELD_SETTINGS.custom;
        const stage = STAGE_SETTINGS[normalized.projectStage] || STAGE_SETTINGS.drafting;
        const authors = normalized.authors.map((author, index) => {
          const weightedTotal = ROLE_DEFS.reduce((sum, role) => sum + role.weight * Number(author.roles[role.key] || 0), 0);
          const writingSignal = Number(author.roles.analysis) + Number(author.roles.draft) * 1.2 + Number(author.roles.methodology) * 0.6;
          const supervisionSignal = Number(author.roles.supervision) * 1.15 + Number(author.roles.conceptualization) * 0.35;
          return { ...author, index, name: getDisplayName(author, index), weightedTotal, writingSignal, supervisionSignal };
        });
        const ranked = [...authors].sort((left, right) => right.weightedTotal - left.weightedTotal || left.bylinePosition - right.bylinePosition || left.name.localeCompare(right.name));
        const expectedRankMap = new Map(ranked.map((author, index) => [author.id, index + 1]));
        const maxGap = Math.max(1, authors.length - 1);
        const mismatchRows = authors.map((author) => {
          const expectedRank = expectedRankMap.get(author.id) || author.bylinePosition;
          const gap = author.bylinePosition - expectedRank;
          const absGap = Math.abs(gap);
          const topSensitive = author.bylinePosition <= 2 || expectedRank <= 2;
          const lastSensitive = author.bylinePosition === authors.length || expectedRank === authors.length;
          let positionWeight = 1;
          if (topSensitive) positionWeight += author.bylinePosition === 1 || expectedRank === 1 ? 0.55 : 0.22;
          if (lastSensitive) positionWeight += field.lastBoost * 0.35;
          if (field.alphabetical) positionWeight *= 0.45;
          const underCreditFactor = gap > 0 ? 1.15 : 0.92;
          const penalty = clampNumber((absGap / maxGap) * 100 * 0.54 * field.orderFactor * positionWeight * underCreditFactor, 0, 100);
          return {
            id: author.id,
            name: author.name,
            proposedPosition: author.bylinePosition,
            expectedRank,
            gap,
            gapLabel: gap === 0 ? 'Aligned' : gap > 0 ? `+${gap}` : String(gap),
            absGap,
            penalty,
            note: mismatchNote(author, gap, expectedRank, authors.length, field),
            exposureBase: Math.max(0, gap) * 20 + author.importance * 5 + ((Number(author.contest || 0) || 0) * 3),
            topSensitive,
            lastSensitive
          };
        }).sort((left, right) => left.proposedPosition - right.proposedPosition);
        const mismatchScore = clampNumber(average(mismatchRows.map((row) => row.penalty)) + (mismatchRows.some((row) => row.expectedRank === 1 && row.proposedPosition !== 1) ? 9 : 0) + (mismatchRows.some((row) => row.expectedRank === authors.length && row.proposedPosition !== authors.length && !field.alphabetical) ? 6 : 0), 0, 100);
        const equalScoreDetails = computeEqualContributionScore(authors, field);
        const unresolvedPressure = clampNumber((mismatchScore * 0.72 + equalScoreDetails.score * 0.28) / 100, 0, 1);
        const stageScore = clampNumber(stage.pressure * (0.35 + unresolvedPressure * 1.1), 0, 100);
        let utilityScore = 0;
        mismatchRows.forEach((row) => {
          const author = authors.find((entry) => entry.id === row.id);
          const importanceNorm = ((author?.importance || 1) - 1) / 4;
          if (row.gap > 0) utilityScore += importanceNorm * (row.absGap / maxGap) * 52;
          else if (row.gap < 0 && importanceNorm < 0.35) utilityScore += (row.absGap / maxGap) * 10;
        });
        utilityScore += standardDeviation(authors.map((author) => author.importance)) * 11;
        if (field.alphabetical) utilityScore *= 0.76;
        utilityScore = clampNumber(utilityScore, 0, 100);
        let powerScore = 0;
        authors.forEach((author) => {
          const row = mismatchRows.find((entry) => entry.id === author.id);
          const related = authors.find((entry) => entry.id === author.relatedAuthorId);
          const seniorityGap = related ? Math.max(0, seniority(related.careerStage) - seniority(author.careerStage)) : 0;
          if (author.relationship === 'advisee' && row && row.gap > 0 && seniorityGap > 0) powerScore += 16 + (row.absGap / maxGap) * 22 + seniorityGap * 5;
          if (author.relationship === 'advisor' && row && row.gap < 0) powerScore += 10 + (row.absGap / maxGap) * 16;
          if (row && row.gap > 0 && seniorityGap > 1) powerScore += 8 + (row.absGap / maxGap) * 18;
        });
        const strongJunior = authors.filter((author) => seniority(author.careerStage) < 4 && author.writingSignal >= 6.5);
        authors.forEach((author) => {
          if (seniority(author.careerStage) >= 4 && author.bylinePosition <= 2) {
            const overshadowed = strongJunior.find((junior) => junior.weightedTotal > author.weightedTotal * 1.25 && junior.bylinePosition > author.bylinePosition);
            if (overshadowed) powerScore += 18;
          }
        });
        if (normalized.largeCollab) powerScore *= 0.85;
        powerScore = clampNumber(powerScore, 0, 100);
        const complexityScore = clampNumber((authors.length - 2) * 7.5 + (normalized.largeCollab ? 10 : 0), 0, 100);
        const contestValues = authors.filter((author) => author.contest !== '').map((author) => ((Number(author.contest) || 1) - 1) / 4);
        let contestScore = 0;
        if (contestValues.length) {
          const underCreditedContest = mismatchRows.filter((row) => row.gap > 0).map((row) => {
            const author = authors.find((entry) => entry.id === row.id);
            return author?.contest === '' ? null : ((Number(author.contest) || 1) - 1) / 4;
          }).filter((value) => value !== null);
          contestScore = clampNumber(average(contestValues) * 28 + average(underCreditedContest) * 18, 0, 100);
        }
        const baseScore = mismatchScore * 0.37 + stageScore * 0.18 + utilityScore * 0.18 + powerScore * 0.14 + complexityScore * 0.09 + contestScore * 0.04;
        const finalScore = clampNumber(baseScore, 0, 100);
        const riskBand = scoreBand(finalScore);
        const vetoPoints = buildVetoPoints({ authors, field, stage, mismatchRows, equalScoreDetails, mismatchScore, stageScore, utilityScore, powerScore, complexityScore });
        const exposedAuthors = buildExposedAuthors({ authors, mismatchRows, stage, field });
        const actions = buildActions({ mismatchRows, equalScoreDetails, stage, field, powerScore, finalScore, authors });
        const primaryPressure = determinePrimaryPressure({ mismatchScore, equal: equalScoreDetails.score, stageScore, utilityScore, powerScore, complexityScore });
        const scoreSummary = scoreSummaryText(finalScore, riskBand.label, primaryPressure, stage.label);
        return {
          finalScore,
          riskBand: riskBand.label,
          riskClass: riskBand.className,
          scoreSummary,
          primaryPressure,
          vetoPoints,
          mismatchRows,
          exposedAuthors,
          actions,
          breakdown: [
            { label: 'Contribution-order mismatch', value: mismatchScore, description: 'Compares weighted contribution rank to the proposed byline, with extra sensitivity near first, second, and last positions.' },
            { label: 'Stage pressure', value: stageScore, description: 'Late-stage disagreement is harder to absorb because the team has already invested more time and coordination.' },
            { label: 'Utility asymmetry', value: utilityScore, description: 'Higher when a career-critical author appears under-credited relative to the current role profile.' },
            { label: 'Power asymmetry', value: powerScore, description: 'Raises attention when senior-junior or advisor-advisee relations intersect with notable mismatch.' },
            { label: 'Author-count complexity', value: complexityScore, description: 'More authors generally means more coordination overhead and more potential veto points.' },
            { label: 'Contest propensity modifier', value: contestScore, description: 'Optional willingness-to-contest input is only used as a mild modifier, not a dominant driver.' }
          ],
          equalDetails: equalScoreDetails
        };
      }

      function computeEqualContributionScore() {
        return { score: 0, description: 'Equal-contribution controls are disabled for this checker.' };
      }
      function buildVetoPoints(context) {
        const points = [];
        const underCredited = [...context.mismatchRows].filter((row) => row.gap > 0).sort((left, right) => right.absGap - left.absGap);
        const topUnder = underCredited[0];
        if (topUnder) {
          const author = context.authors.find((entry) => entry.id === topUnder.id);
          const emphasis = author && author.writingSignal >= 6 ? 'writing and analysis' : 'overall contribution';
          points.push(`${topUnder.name} appears under-credited relative to ${emphasis} contributions.`);
        }
        if ((context.stage.label === 'Near submission' || context.stage.label === 'Under revision') && context.mismatchScore >= 24) points.push(`Late-stage order sensitivity is elevated because notable mismatch remains at the ${context.stage.label.toLowerCase()} stage.`);
        if (context.powerScore >= 26) points.push('Advisor-student or senior-junior power asymmetry may make renegotiation harder to resolve informally.');
        if (context.field.alphabetical) points.push('Alphabetical ordering reduces order-based risk, but role transparency still matters because order alone does not explain contribution differences.');
        else if (context.mismatchRows.some((row) => row.lastSensitive && row.absGap >= 1)) points.push('Last-author signaling may be ambiguous relative to supervision and drafting inputs.');
        if (context.complexityScore >= 34) points.push('A larger author set increases the number of possible veto points and makes informal alignment harder to maintain.');
        while (points.length < 3) points.push('Documenting the current byline rationale now would reduce the chance of ad hoc renegotiation later.');
        return points.slice(0, 5);
      }
      function buildExposedAuthors(context) {
        const exposures = context.mismatchRows.map((row) => {
          const author = context.authors.find((entry) => entry.id === row.id);
          const contest = author?.contest === '' ? 0 : Number(author?.contest || 0);
          let score = row.exposureBase;
          let reason = 'Current arrangement looks comparatively stable for this author.';
          if (row.gap > 0) {
            score += row.absGap * 8;
            reason = `${row.name} is placed lower than the current contribution profile suggests, which can create an under-credit signal.`;
            if ((author?.importance || 1) >= 4) reason = `${row.name} is both highly dependent on this publication and lower in the byline than the current role profile suggests.`;
            if ((contest || 0) >= 4) reason = `${row.name} is under-placed relative to the current role profile and also marked as more likely to contest the arrangement.`;
          } else if (row.gap < 0 && row.absGap >= 2) {
            score += 8;
            reason = `${row.name} may attract challenge because the proposed position looks stronger than the current role profile.`;
          }
          const related = context.authors.find((entry) => entry.id === author?.relatedAuthorId);
          if (author?.relationship === 'advisee' && related && row.gap > 0) {
            score += 9;
            reason = `${row.name} is under-placed in an advisor-advisee context, which may make renegotiation especially delicate.`;
          }
          if (context.stage.label === 'Near submission' || context.stage.label === 'Under revision') score += Math.max(0, row.gap) * 3;
          return { id: row.id, name: row.name, score, reason };
        });
        return exposures.filter((entry) => entry.score > 16).sort((left, right) => right.score - left.score).slice(0, 3);
      }
      function buildActions(context) {
        const actions = [];
        const hasTopMismatch = context.mismatchRows.some((row) => row.topSensitive && row.absGap >= 1);
        const hasLastMismatch = context.mismatchRows.some((row) => row.lastSensitive && row.absGap >= 1 && !context.field.alphabetical);
        const underCredited = context.mismatchRows.some((row) => row.gap > 0);
        if (hasTopMismatch) actions.push('Resolve first-author and second-author ambiguity before submission rather than after the final draft is locked.');
        if (hasLastMismatch) actions.push('Clarify whether last authorship reflects supervision, senior leadership, or a field-specific convention.');
        if (context.powerScore >= 26) actions.push('Separate supervision and funding credit from writing and analysis credit when discussing order.');
        if (context.stage.label === 'Near submission' || context.stage.label === 'Under revision') actions.push('Schedule a short authorship review immediately; late-stage renegotiation is usually more fragile.');
        if (context.field.alphabetical) actions.push('Add a transparent contribution statement so alphabetical order does not hide important role differences.');
        if (underCredited) actions.push('Revisit the byline against agreed role weights and record the outcome in a shared note before submission.');
        if (actions.length < 3) actions.push('Record the current order, corresponding author, and any equal-contribution notes so expectations stay aligned.');
        if (actions.length < 4) actions.push('If roles are still moving, plan one last structured review after the manuscript text is finalized.');
        return unique(actions).slice(0, 5);
      }
      function determinePrimaryPressure(scores) {
        const items = [
          { label: 'Contribution-order mismatch', value: scores.mismatchScore },
          { label: 'Stage pressure', value: scores.stageScore },
          { label: 'Utility asymmetry', value: scores.utilityScore },
          { label: 'Power asymmetry', value: scores.powerScore },
          { label: 'Author-count complexity', value: scores.complexityScore }
        ];
        return items.sort((left, right) => right.value - left.value)[0].label;
      }
      function scoreSummaryText(score, bandLabel, primaryPressure, stageLabel) {
        if (score < 25) return `Low overall fragility. The main thing to keep documented is ${primaryPressure.toLowerCase()}, especially as the project moves beyond ${stageLabel.toLowerCase()}.`;
        if (score < 50) return `Moderate fragility. ${primaryPressure} is the main reason this arrangement could become harder to defend without a short authorship conversation.`;
        if (score < 75) return `High fragility. ${primaryPressure} is creating a meaningful negotiation risk that is likely worth settling before submission.`;
        return `Severe fragility. ${primaryPressure} and current timing suggest this arrangement is vulnerable to late-stage challenge or veto pressure.`;
      }
      function buildScenarios(currentState, currentAnalysis, selectedAuthorId) {
        const scenarios = [];
        const authors = [...currentState.authors].sort((left, right) => left.bylinePosition - right.bylinePosition);
        const first = authors[0];
        const second = authors[1];
        const last = authors[authors.length - 1];
        const penultimate = authors[authors.length - 2];
        const selected = currentState.authors.find((author) => author.id === selectedAuthorId) || authors[0];
        scenarios.push(makeScenario('swap-top-two', 'Swap authors 1 and 2', 'Test whether the main byline tension is concentrated in the lead positions.', currentState, () => {
          if (!first || !second) return false;
          return swapPositionsInState(currentState, first.id, second.id);
        }));
        scenarios.push(makeScenario('swap-last-two', 'Swap the last two authors', 'Tests whether the back of the byline is carrying unnecessary friction.', currentState, () => {
          if (!last || !penultimate || currentState.authors.length < 3) return false;
          return swapPositionsInState(currentState, penultimate.id, last.id);
        }));
        scenarios.push(makeScenario('move-author-up', `Move ${getDisplayName(selected, currentState.authors.indexOf(selected))} up one position`, 'Use this when one specific author appears under-credited and you want to test a small order adjustment.', currentState, () => {
          if (!selected || selected.bylinePosition <= 1) return false;
          const next = cloneState(currentState);
          const moving = next.authors.find((author) => author.id === selected.id);
          const displaced = next.authors.find((author) => author.bylinePosition === moving.bylinePosition - 1);
          if (!moving || !displaced) return false;
          const originalPosition = moving.bylinePosition;
          moving.bylinePosition -= 1;
          displaced.bylinePosition = originalPosition;
          return next;
        }));
        scenarios.push(makeScenario('rebalance-rank', 'Rebalance by contribution rank', 'Sets byline positions directly from the current weighted contribution ranking.', currentState, () => {
          const next = cloneState(currentState);
          const ranked = computeAnalysis(next).mismatchRows.slice().sort((left, right) => left.expectedRank - right.expectedRank);
          ranked.forEach((row, index) => {
            const author = next.authors.find((entry) => entry.id === row.id);
            if (author) author.bylinePosition = index + 1;
          });
          return next;
        }));
        return scenarios.map((scenario) => {
          if (!scenario.available) return scenario;
          const delta = scenario.analysis.finalScore - currentAnalysis.finalScore;
          scenario.deltaLabel = delta < -0.5 ? `Lowers by ${Math.abs(Math.round(delta))}` : delta > 0.5 ? `Raises by ${Math.round(delta)}` : 'Little change';
          scenario.deltaClass = delta < -0.5 ? 'is-lower' : delta > 0.5 ? 'is-higher' : 'is-flat';
          return scenario;
        });
      }
      function makeScenario(key, label, description, currentState, producer) {
        const outcome = producer();
        if (outcome === false) return { key, label, description, available: false };
        const nextState = outcome;
        normalizeState(nextState);
        return { key, label, description, available: true, state: nextState, analysis: computeAnalysis(nextState), deltaLabel: '', deltaClass: 'is-flat' };
      }
      function swapBylinePositions(authorId, targetPosition) {
        const moving = state.authors.find((author) => author.id === authorId);
        if (!moving) return;
        const currentPosition = moving.bylinePosition;
        const occupant = state.authors.find((author) => author.bylinePosition === targetPosition && author.id !== authorId);
        moving.bylinePosition = targetPosition;
        if (occupant) occupant.bylinePosition = currentPosition;
      }
      function swapPositionsInState(currentState, firstId, secondId) {
        const next = cloneState(currentState);
        const firstAuthor = next.authors.find((author) => author.id === firstId);
        const secondAuthor = next.authors.find((author) => author.id === secondId);
        if (!firstAuthor || !secondAuthor) return next;
        const temp = firstAuthor.bylinePosition;
        firstAuthor.bylinePosition = secondAuthor.bylinePosition;
        secondAuthor.bylinePosition = temp;
        return next;
      }
      function resizeAuthors(nextCount) {
        nextCount = clampNumber(nextCount, 2, 12);
        normalizeState(state);
        if (nextCount === state.authors.length) { state.authorCount = nextCount; return; }
        if (nextCount > state.authors.length) {
          const currentLength = state.authors.length;
          for (let index = currentLength + 1; index <= nextCount; index += 1) state.authors.push(makeAuthor(index, { bylinePosition: index }));
        } else {
          state.authors = state.authors.sort((left, right) => left.bylinePosition - right.bylinePosition).slice(0, nextCount);
        }
        state.authorCount = nextCount;
        state.authors.forEach((author, index) => {
          author.bylinePosition = index + 1;
          if (author.relatedAuthorId && !state.authors.some((entry) => entry.id === author.relatedAuthorId)) {
            author.relatedAuthorId = '';
            if (author.relationship !== 'none') author.relationship = 'none';
          }
        });
        if (!state.authors.some((author) => author.id === state.correspondingAuthorId)) state.correspondingAuthorId = state.authors[0]?.id || '';
      }
      function exportSummary(analysis) {
        const lines = [];
        lines.push('Authorship Deal Risk Checker Summary', '', `Fragility score: ${Math.round(analysis.finalScore)} (${analysis.riskBand})`, `Field convention: ${FIELD_SETTINGS[state.fieldConvention].label}`, `Project stage: ${STAGE_SETTINGS[state.projectStage].label}`, `Corresponding author: ${getDisplayNameById(state.correspondingAuthorId)}`, '', 'Top veto points:');
        analysis.vetoPoints.forEach((point) => lines.push(`- ${point}`));
        lines.push('', 'Mismatch table:');
        analysis.mismatchRows.forEach((row) => lines.push(`- ${row.name}: proposed #${row.proposedPosition}, expected #${row.expectedRank}, gap ${row.gapLabel}. ${row.note}`));
        lines.push('', 'Most exposed authors:');
        if (analysis.exposedAuthors.length) analysis.exposedAuthors.forEach((author) => lines.push(`- ${author.name}: ${author.reason}`));
        else lines.push('- No author is especially exposed right now.');
        lines.push('', 'What to settle now:');
        analysis.actions.forEach((action) => lines.push(`- ${action}`));
        lines.push('', 'Note: This tool provides a structured way to surface fragile authorship arrangements. It does not determine correct authorship, and norms vary by field, journal, and team.');
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'authorship-deal-risk-summary.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus('Summary exported as a local text file.');
      }
      function buildShareUrl() {
        const payload = encodeState(state);
        const url = new URL(window.location.href);
        url.searchParams.set('state', payload);
        return url.toString();
      }
      function encodeState(value) {
        const json = JSON.stringify(value);
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      }
      function decodeState(encoded) {
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '==='.slice((base64.length + 3) % 4);
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
      }
      function loadInitialState() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('state');
        if (encoded) {
          try {
            const parsed = decodeState(encoded);
            normalizeState(parsed);
            parsed._presetKey = 'custom';
            return parsed;
          } catch (error) {
            console.warn('Could not parse shared state:', error);
          }
        }
        return createBlankState(2);
      }
      async function copyText(text) {
        if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
        const input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      function buildAuthorCountOptions() {
        authorCountSelect.innerHTML = Array.from({ length: 11 }, (_, idx) => {
          const value = idx + 2;
          return `<option value="${value}">${value}</option>`;
        }).join('');
      }
      function buildAuthorOptions(authors) {
        return authors.slice().sort((left, right) => left.bylinePosition - right.bylinePosition).map((author, index) => ({ id: author.id, label: `${getDisplayName(author, index)} (#${author.bylinePosition})` }));
      }
      function normalizeState(value) {
        if (!value.fieldConvention || !FIELD_SETTINGS[value.fieldConvention]) value.fieldConvention = 'custom';
        if (!value.projectStage || !STAGE_SETTINGS[value.projectStage]) value.projectStage = 'drafting';
        value.authorCount = clampNumber(Number(value.authorCount) || value.authors?.length || 2, 2, 12);
        if (!Array.isArray(value.authors)) value.authors = [];
        value.authors = value.authors.slice(0, value.authorCount).map((author, index) => normalizeAuthor(author, index + 1));
        while (value.authors.length < value.authorCount) value.authors.push(makeAuthor(value.authors.length + 1, { bylinePosition: value.authors.length + 1 }));
        value.authors = value.authors.sort((left, right) => left.bylinePosition - right.bylinePosition);
        value.authors.forEach((author, index) => {
          author.bylinePosition = index + 1;
          if (!value.authors.some((entry) => entry.id === author.relatedAuthorId) || author.relatedAuthorId === author.id) {
            author.relatedAuthorId = '';
            if (author.relationship !== 'none' && author.relationship !== 'peer') author.relationship = 'none';
          }
        });
        if (!value.authors.some((author) => author.id === value.correspondingAuthorId)) value.correspondingAuthorId = value.authors[0]?.id || '';
      }
      function normalizeAuthor(author, fallbackIndex) {
        const normalized = {
          id: author?.id || `a${fallbackIndex}`,
          name: typeof author?.name === 'string' ? author.name : '',
          bylinePosition: clampNumber(Number(author?.bylinePosition) || fallbackIndex, 1, 12),
          careerStage: CAREER_STAGES.some((option) => option.value === author?.careerStage) ? author.careerStage : 'other',
          relationship: RELATIONSHIPS.some((option) => option.value === author?.relationship) ? author.relationship : 'none',
          relatedAuthorId: typeof author?.relatedAuthorId === 'string' ? author.relatedAuthorId : '',
          importance: clampNumber(Number(author?.importance) || 3, 1, 5),
          contest: author?.contest === '' || author?.contest === undefined || author?.contest === null ? '' : String(clampNumber(Number(author.contest), 1, 5)),          roles: {}
        };
        ROLE_DEFS.forEach((role) => { normalized.roles[role.key] = clampNumber(Number(author?.roles?.[role.key]) || 0, 0, 5); });
        return normalized;
      }
      function createBlankState(authorCount) {
        return {
          fieldConvention: 'custom',
          projectStage: 'drafting',
          authorCount,
          correspondingAuthorId: 'a1',
          largeCollab: false,
          authors: Array.from({ length: authorCount }, (_, index) => makeAuthor(index + 1, { bylinePosition: index + 1 }))
        };
      }
      function makeAuthor(index, overrides = {}) {
        const base = {
          id: `a${index}`,
          name: '',
          bylinePosition: index,
          careerStage: 'other',
          relationship: 'none',
          relatedAuthorId: '',
          importance: 3,
          contest: DEFAULT_CONTEST,          roles: { conceptualization: 0, methodology: 0, software: 0, analysis: 0, draft: 0, review: 0, supervision: 0 }
        };
        return { ...base, ...overrides, roles: { ...base.roles, ...(overrides.roles || {}) } };
      }
      function contributionRangeRatio(values) {
        const clean = values.filter((value) => Number.isFinite(value));
        const max = Math.max(...clean, 0.0001);
        const min = Math.min(...clean, 0);
        return clampNumber((max - min) / max, 0, 1);
      }
      function mismatchNote(author, gap, expectedRank, authorCount, field) {
        if (field.alphabetical) {
          if (gap === 0) return 'Order is less informative here; role transparency still matters.';
          return gap > 0 ? 'Alphabetical convention softens the gap, but a contribution note would help.' : 'Alphabetical convention softens the gap, but this placement may still invite questions.';
        }
        if (gap >= 2) return 'Possible under-credit signal.';
        if (gap === 1) return 'Slight under-credit signal.';
        if (gap <= -2) return 'May appear over-placed relative to current role profile.';
        if (gap === -1) return 'Slightly advanced relative to current role profile.';
        if (expectedRank === authorCount && author.bylinePosition !== authorCount) return 'Last-author signal may be unclear.';
        return 'Broadly aligned with the current role profile.';
      }
      function getDisplayName(author, index) {
        const trimmed = (author.name || '').trim();
        return trimmed || `Author ${index + 1}`;
      }
      function getDisplayNameById(authorId) {
        const author = state.authors.find((entry) => entry.id === authorId);
        const index = state.authors.findIndex((entry) => entry.id === authorId);
        return author ? getDisplayName(author, index) : 'Not set';
      }
      function careerStageLabel(value) {
        return CAREER_STAGES.find((option) => option.value === value)?.label || 'Other';
      }
      function seniority(stage) {
        switch (stage) {
          case 'phd': return 1;
          case 'staff': return 2;
          case 'other': return 2;
          case 'postdoc': return 2.8;
          case 'pi': return 4;
          default: return 2;
        }
      }
      function scoreBand(score) {
        if (score < 25) return { label: 'Low', className: 'is-low' };
        if (score < 50) return { label: 'Moderate', className: 'is-moderate' };
        if (score < 75) return { label: 'High', className: 'is-high' };
        return { label: 'Severe', className: 'is-severe' };
      }
      function average(values) {
        const clean = values.filter((value) => Number.isFinite(value));
        if (!clean.length) return 0;
        return clean.reduce((sum, value) => sum + value, 0) / clean.length;
      }
      function standardDeviation(values) {
        const mean = average(values);
        const variance = average(values.map((value) => Math.pow(value - mean, 2)));
        return Math.sqrt(variance);
      }
      function clampNumber(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }
      function cloneState(value) {
        return JSON.parse(JSON.stringify(value));
      }
      function unique(items) {
        return [...new Set(items)];
      }
      function escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }
      function escapeAttr(value) {
        return escapeHtml(value).replace(/\n/g, '&#10;');
      }
      function updateInlineValue(input, value) {
        const output = document.getElementById(`value-${input.id}`);
        if (output) output.textContent = String(value);
      }
      function setStatus(message) {
        const statusNode = document.getElementById('form-status');
        if (statusNode) statusNode.textContent = message || '';
      }
    })();