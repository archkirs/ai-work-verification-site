(() => {
  // Keep the public-site header on Record demo pages aligned with the current
  // production presentation: the primary navigation has four audience/site links,
  // while Pilot remains the separate CTA button on the right.
  document.querySelectorAll('.site-header .nav a').forEach((link) => {
    if (link.textContent.trim() === 'Pilot') link.remove();
  });

  const style = document.createElement('style');
  style.textContent = `
    .record-file-tabs {
      gap: 0;
      overflow-x: visible;
      overflow-y: hidden;
      padding: 12px 22px 0;
      scrollbar-width: none;
    }
    .record-file-tabs::-webkit-scrollbar { display: none; }
    .record-file-tab {
      min-width: 142px;
      margin-right: -1px;
      padding: 14px 24px 13px;
      border: 1px solid var(--line);
      border-bottom: 0;
      border-radius: 14px 14px 0 0;
      background: #ebe8df;
      color: var(--muted);
    }
    .record-file-tab::after { display: none; }
    .record-file-tab.is-active {
      z-index: 2;
      transform: translateY(1px);
      border-color: var(--line-strong);
      background: var(--record-paper);
      color: var(--ink);
    }
    .record-tab-title {
      max-width: 100%;
      font-size: clamp(24px, 3vw, 34px);
      line-height: 1.08;
      letter-spacing: -.035em;
      overflow-wrap: anywhere;
    }
    .record-file-grid-mark { margin-left: 4px; }
    .record-file-grid-mark i { opacity: .68; }
    .finding-id {
      display: block;
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 650;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    @media (max-width: 760px) {
      .record-file-tabs {
        overflow-x: auto;
        overscroll-behavior-x: contain;
        padding-right: 14px;
        padding-left: 14px;
      }
      .record-file-tab {
        min-width: 118px;
        padding-right: 18px;
        padding-left: 18px;
      }
    }
  `;
  document.head.appendChild(style);

  const recordRefinements = {
    'MR-PILOT-EC-P050-001': {
      workTitle: 'The Count of Monte Cristo — Page 050',
      scope: 'This comic page, its planning, generated panels, selection, text and final assembly.',
      resultTitle: 'AI helped create the page. The Creator made the key creative choices.',
      resultBody: 'The Creator planned the scenes, rejected weak options, chose the final images and assembled the finished page. AI helped generate images, develop scenes and work on parts of the text.',
      limitation: 'We do not have the complete history of every image that was generated or rejected. The Record also cannot show exactly which final words came from the Creator and which came from AI.',
      findings: {
        s001: ['S-001', 'The finished page has four panels.', 'The final page directly shows the four-panel structure.'],
        s002: ['S-002', 'The Creator changed the camera direction when the first staging felt repetitive.', 'The process conversation records this redirection.'],
        s008: ['S-008', 'AI helped with scene ideas, text suggestions and image prompts.', 'This is recorded in the available ChatGPT process material.'],
        s009: ['S-009', 'The page was developed through several rounds of correction and selection.', 'Earlier versions, rejected alternatives and process material show an iterative workflow.'],
        s011: ['S-011', 'The Creator says he assembled the final page in Clip Studio Paint EX.', 'Screenshots support the layered assembly workflow; who operated the software remains partly based on the Creator declaration.']
      }
    },
    'MR-PILOT-CV-001': {
      workTitle: 'Professional CV',
      scope: 'The English/Serbian CV, AI-assisted writing and translation, Creator review, and available process evidence.',
      resultTitle: 'AI helped write and translate the CV. The Creator kept the final review.',
      resultBody: 'The Creator says the professional facts came from him. ChatGPT helped organise and rewrite the English text and translate it into Serbian. The available process record also shows the Creator asking for the Serbian version to be checked and corrected.',
      limitation: 'This Record does not check whether the professional claims in the CV are true. We also do not have the complete drafting history or exact line-by-line human/AI contribution.',
      findings: {
        's2-001': ['S2-001', 'The final work is a two-page CV in English and Serbian.', 'The approved redacted preview directly shows both pages.'],
        's2-002': ['S2-002', 'The Creator says the professional facts came from him, not ChatGPT.', 'This comes from the Creator declaration; the professional facts themselves are not independently checked by this Record.'],
        's2-003': ['S2-003', 'The Creator says ChatGPT helped organise and rewrite the English CV.', 'The earlier ChatGPT interaction for this part has not been located as controlled Evidence.'],
        's2-004': ['S2-004', 'The available ChatGPT record shows the CV being translated into Serbian and then checked and corrected.', 'The process record contains the translation request, AI output and later checking/correction step.'],
        's2-005': ['S2-005', 'The Creator reviewed the Serbian translation and says he approved the final CV text.', 'The process record supports active Serbian-language review; approval of the complete final text remains Creator-declared.']
      }
    }
  };

  const createGridMark = () => {
    const mark = document.createElement('span');
    mark.className = 'grid-mark record-file-grid-mark';
    mark.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 16; index += 1) mark.appendChild(document.createElement('i'));
    return mark;
  };

  const shells = document.querySelectorAll('[data-record-shell]');

  shells.forEach((shell) => {
    const recordId = shell.querySelector('.record-meta-item strong')?.textContent.trim();
    const refinement = recordRefinements[recordId];

    const brand = shell.querySelector('.record-file-brand');
    if (brand && !brand.querySelector('.record-file-grid-mark')) brand.appendChild(createGridMark());

    if (refinement) {
      const title = shell.querySelector('[data-record-panel="record"] .record-tab-title');
      if (title) title.textContent = recordId;

      const identityBlock = shell.querySelector('[data-record-panel="record"] .record-identity-block');
      if (identityBlock && !identityBlock.querySelector('[data-record-work-row]')) {
        const workRow = document.createElement('div');
        workRow.className = 'record-identity-row';
        workRow.dataset.recordWorkRow = '';
        workRow.innerHTML = `<span>Work</span><strong>${refinement.workTitle}</strong>`;
        identityBlock.prepend(workRow);
      }

      const scopeRow = Array.from(shell.querySelectorAll('[data-record-panel="record"] .record-identity-row')).find((row) => row.querySelector('span')?.textContent.trim() === 'Scope');
      if (scopeRow) scopeRow.querySelector('strong').textContent = refinement.scope;

      const result = shell.querySelector('[data-record-panel="record"] .record-result');
      if (result) {
        const resultTitle = result.querySelector('h2');
        const resultBody = result.querySelector('p:last-child');
        if (resultTitle) resultTitle.textContent = refinement.resultTitle;
        if (resultBody) resultBody.textContent = refinement.resultBody;
      }

      const findingsHead = shell.querySelector('[data-record-panel="record"] .principal-findings-head p');
      if (findingsHead) findingsHead.textContent = 'Open a finding to see what supports it and what Evidence this reader can access.';

      shell.querySelectorAll('[data-record-panel="record"] .finding-item').forEach((item) => {
        const button = item.querySelector('[data-view-evidence]');
        const finding = refinement.findings[button?.dataset.viewEvidence];
        if (!finding) return;
        const heading = item.querySelector('.finding-copy h3');
        const detail = item.querySelector('.finding-copy p');
        if (heading) heading.innerHTML = `<span class="finding-id">${finding[0]}</span>${finding[1]}`;
        if (detail) detail.textContent = finding[2];
      });

      const limitation = shell.querySelector('[data-record-panel="record"] .record-limitation p');
      if (limitation) limitation.textContent = refinement.limitation;
    }

    const tabs = Array.from(shell.querySelectorAll('[role="tab"]'));
    const panels = Array.from(shell.querySelectorAll('[role="tabpanel"]'));
    const evidenceTab = tabs.find((tab) => tab.dataset.recordTab === 'evidence');
    const evidenceGroups = Array.from(shell.querySelectorAll('[data-evidence-group]'));
    const evidenceSelectors = Array.from(shell.querySelectorAll('[data-evidence-select]'));

    const activateTab = (targetName, focus = false) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.recordTab === targetName;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle('is-active', active);
        if (active && focus) tab.focus();
      });

      panels.forEach((panel) => {
        const active = panel.dataset.recordPanel === targetName;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    };

    const activateEvidence = (findingId) => {
      if (!findingId || evidenceGroups.length === 0) return;

      evidenceGroups.forEach((group) => {
        const active = group.dataset.evidenceGroup === findingId;
        group.hidden = !active;
        group.classList.toggle('is-active', active);
      });

      evidenceSelectors.forEach((selector) => {
        const active = selector.dataset.evidenceSelect === findingId;
        selector.classList.toggle('is-active', active);
        selector.setAttribute('aria-pressed', String(active));
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab.dataset.recordTab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();

        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;

        activateTab(tabs[nextIndex].dataset.recordTab, true);
      });
    });

    shell.querySelectorAll('[data-view-evidence]').forEach((button) => {
      button.addEventListener('click', () => {
        const findingId = button.dataset.viewEvidence;
        activateEvidence(findingId);
        activateTab('evidence');
        evidenceTab?.focus({ preventScroll: true });
        shell.querySelector('[data-record-panel="evidence"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    evidenceSelectors.forEach((selector) => {
      selector.addEventListener('click', () => activateEvidence(selector.dataset.evidenceSelect));
    });

    const initialTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.recordTab || 'record';
    activateTab(initialTab);

    const initialEvidence = evidenceSelectors.find((selector) => selector.classList.contains('is-active'))?.dataset.evidenceSelect || evidenceGroups[0]?.dataset.evidenceGroup;
    if (initialEvidence) activateEvidence(initialEvidence);
  });
})();
