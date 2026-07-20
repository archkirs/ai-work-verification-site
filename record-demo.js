(() => {
  // Keep the public-site header on Record pages aligned with the current site navigation.
  document.querySelectorAll('.site-header .nav a').forEach((link) => {
    if (link.textContent.trim() === 'Pilot') link.remove();
  });

  const style = document.createElement('style');
  style.textContent = `
    .record-file-tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      overflow: visible;
      padding: 10px 24px 0;
      scrollbar-width: none;
    }
    .record-file-tabs::-webkit-scrollbar { display: none; }
    .record-file-tab {
      width: 100%;
      min-width: 0;
      margin: 0;
      padding: 10px 14px 9px;
      border: 1px solid var(--line);
      border-bottom-color: var(--line);
      border-radius: 9px 9px 0 0;
      background: #ebe8df;
      color: var(--muted);
      font-size: 12px;
      transition: background .16s ease, color .16s ease, border-color .16s ease;
    }
    .record-file-tab::after { display: none; }
    .record-file-tab:hover {
      background: #f1efe9;
      color: var(--ink);
    }
    .record-file-tab.is-active {
      z-index: 2;
      transform: translateY(1px);
      border-color: var(--line-strong);
      border-bottom-color: var(--record-paper);
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
    .record-file-grid-mark {
      display: grid !important;
      margin-left: 4px;
    }
    .record-file-grid-mark i { opacity: .68; }
    .finding-id,
    .material-id {
      display: block;
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 650;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .catalogue-item-link {
      color: var(--ink);
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: var(--line-strong);
      text-underline-offset: 3px;
    }
    .catalogue-item-link:hover { text-decoration-color: var(--ink); }
    .catalogue-representation-links {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 12px;
      margin-top: 7px;
    }
    .catalogue-representation-links a {
      color: var(--ink);
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: var(--line-strong);
      text-underline-offset: 3px;
    }
    body.comic-stage-b-record .site-header .brand {
      display: inline-flex;
      align-items: center;
      width: fit-content;
    }
    body.comic-stage-b-record .site-header .brand::after {
      content: "MADE Record";
      margin-left: 14px;
      padding-left: 14px;
      border-left: 1px solid var(--line-strong);
      color: var(--ink);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.2;
      letter-spacing: -.015em;
      white-space: nowrap;
    }
    @media (max-width: 760px) {
      .record-file-header { gap: 14px; }
      .record-file-brand { width: 100%; }
      .record-file-grid-mark {
        display: grid !important;
        margin-left: auto;
      }
      .record-file-tabs {
        gap: 4px;
        padding: 8px 8px 0;
      }
      .record-file-tab {
        padding: 10px 2px 9px;
        font-size: 10.5px;
      }
      .record-primary-grid {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .record-primary-grid > :not(.work-preview) { display: contents; }
      .record-primary-grid > :not(.work-preview) > .record-tab-kicker,
      .record-primary-grid > :not(.work-preview) > .record-tab-title,
      .record-primary-grid > :not(.work-preview) > .record-identity-block { order: 1; }
      .record-primary-grid > .work-preview {
        order: 2;
        margin-top: 24px;
      }
      .record-primary-grid > :not(.work-preview) > .record-result {
        order: 3;
        margin-top: 28px;
      }
      body.comic-stage-b-record .site-header .brand::after {
        margin-left: 8px;
        padding-left: 8px;
        font-size: 11px;
      }
    }
    @media (max-width: 480px) {
      .record-file-brand img { width: 72px; }
      .record-file-product { font-size: 11px; }
      .record-file-grid-mark {
        display: grid !important;
        transform: scale(.9);
        transform-origin: right center;
      }
      .record-file-meta {
        grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
      }
      .record-meta-item:first-child {
        grid-column: 1 / -1;
        padding-left: 0;
        border-bottom: 1px solid var(--line);
        border-left: 0;
      }
      .record-meta-item:nth-child(2) {
        padding-left: 0;
        border-top: 0;
        border-left: 0;
      }
      .record-meta-item:nth-child(3) {
        padding-left: 16px;
        border-top: 0;
        border-left: 1px solid var(--line);
      }
    }
  `;
  document.head.appendChild(style);

  const recordRefinements = {
    'MR-PILOT-EC-P050-001': {
      workTitle: 'The Count of Monte Cristo — Page 050',
      scope: 'This comic page, its planning, generated panels, selection, text and final assembly.',
      resultTitle: 'AI helped create the page. The Creator made the key creative choices.',
      resultBody: 'The Creator planned the scenes, rejected unsuitable options, chose the final images, and assembled the finished page. AI helped generate images, develop scenes, and work on parts of the text.',
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

  const evidenceToViewer = {
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-ec-p050-001/materials/m-001/presentation-v1.png': 'evidence-viewer.html?asset=comic-m001',
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-ec-p050-001/materials/m-002/presentation-v1.png': 'evidence-viewer.html?asset=comic-m002',
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-ec-p050-001/materials/m-003/presentation-v1.png': 'evidence-viewer.html?asset=comic-m003',
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-ec-p050-001/materials/m-004/presentation-v1.png': 'evidence-viewer.html?asset=comic-m004',
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-ec-p050-001/materials/m-005/presentation-v1.png': 'evidence-viewer.html?asset=comic-m005',
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-page-1-v1.webp': 'evidence-viewer.html?asset=cv-en',
    'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-page-2-v1.webp': 'evidence-viewer.html?asset=cv-sr'
  };

  document.querySelectorAll('a[href]').forEach((link) => {
    const viewerHref = evidenceToViewer[link.href];
    if (viewerHref) link.href = viewerHref;
  });

  const catalogueLinks = {
    'MR-PILOT-EC-P050-001': {
      'M-001': 'evidence-viewer.html?asset=comic-m001',
      'M-002': 'evidence-viewer.html?asset=comic-m002',
      'M-003': 'evidence-viewer.html?asset=comic-m003',
      'M-004': 'evidence-viewer.html?asset=comic-m004',
      'M-005': 'evidence-viewer.html?asset=comic-m005'
    },
    'MR-PILOT-CV-001': {
      'M2-001': 'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-preview-v1.pdf'
    }
  };

  const createGridMark = () => {
    const mark = document.createElement('span');
    mark.className = 'grid-mark record-file-grid-mark';
    mark.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 16; index += 1) mark.appendChild(document.createElement('i'));
    return mark;
  };

  const replaceText = (root, selector, value) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  };

  const shells = document.querySelectorAll('[data-record-shell]');

  shells.forEach((shell) => {
    const recordId = shell.querySelector('.record-meta-item strong')?.textContent.trim();
    const refinement = recordRefinements[recordId];
    const isComic = recordId === 'MR-PILOT-EC-P050-001';

    if (isComic) document.body.classList.add('comic-stage-b-record');

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
      if (scopeRow) {
        scopeRow.querySelector('span').textContent = isComic ? 'This Record covers' : 'Scope';
        scopeRow.querySelector('strong').textContent = refinement.scope;
      }

      const result = shell.querySelector('[data-record-panel="record"] .record-result');
      if (result) {
        const resultTitle = result.querySelector('h2');
        const resultBody = result.querySelector('p:last-child');
        if (resultTitle) resultTitle.textContent = refinement.resultTitle;
        if (resultBody) resultBody.textContent = refinement.resultBody;
      }

      const findingsHead = shell.querySelector('[data-record-panel="record"] .principal-findings-head');
      if (findingsHead) {
        const heading = findingsHead.querySelector('h2');
        const note = findingsHead.querySelector('p');
        if (heading) heading.textContent = isComic ? 'What we found' : 'Principal findings';
        if (note) note.textContent = isComic
          ? 'Each finding shows what the available information supports. Open it to see the related evidence.'
          : 'Open a finding to see what supports it and what Evidence this reader can access.';
      }

      shell.querySelectorAll('[data-record-panel="record"] .finding-item').forEach((item) => {
        const button = item.querySelector('[data-view-evidence]');
        const finding = refinement.findings[button?.dataset.viewEvidence];
        if (!finding) return;
        const heading = item.querySelector('.finding-copy h3');
        const detail = item.querySelector('.finding-copy p');
        if (heading) heading.innerHTML = isComic ? finding[1] : `<span class="finding-id">${finding[0]}</span>${finding[1]}`;
        if (detail) detail.textContent = finding[2];
        if (button && isComic) button.textContent = 'See evidence';
      });

      const limitation = shell.querySelector('[data-record-panel="record"] .record-limitation p');
      if (limitation) limitation.textContent = refinement.limitation;
    }

    if (isComic) {
      const previewCaption = shell.querySelector('[data-record-panel="record"] .work-preview-caption');
      if (previewCaption) {
        const strong = previewCaption.querySelector('strong');
        const note = previewCaption.querySelector('span');
        if (strong) strong.textContent = 'Work preview';
        if (note) note.textContent = 'Public presentation copy';
      }

      // Recipient-facing Evidence Status labels; canonical semantics/classes remain unchanged.
      shell.querySelectorAll('.evidence-status.source').forEach((el) => { el.textContent = 'Recorded in source tool'; });
      shell.querySelectorAll('.evidence-status.inferred').forEach((el) => { el.textContent = 'Inferred from available materials'; });

      // Process: keep the accepted sequence, remove technical Material/access strings from the first layer.
      const processPanel = shell.querySelector('[data-record-panel="process"]');
      if (processPanel) {
        replaceText(processPanel, '.record-tab-lede', 'This view shows the main steps supported by the available information. It does not reconstruct every generation or selection event.');
        processPanel.querySelectorAll('.process-materials').forEach((el) => el.remove());
        const steps = processPanel.querySelectorAll('.process-step');
        if (steps[1]) replaceText(steps[1], 'p', 'The available ChatGPT conversation includes scene breakdowns, dialogue and caption suggestions, and image-prompt wording produced in response to the Creator\'s direction.');
        if (steps[3]) replaceText(steps[3], 'p', 'Available earlier panel versions and rejected alternatives show multiple rounds of image generation. The complete generation log is not available.');
        if (steps[4]) replaceText(steps[4], 'p', 'The Creator replaced earlier panel versions with a later final set and selected the four panels used in the finished page.');
        if (steps[5]) replaceText(steps[5], 'p', 'The selected panels, text, balloons, caption and page layout were assembled into the final page. Screenshots show a layered Clip Studio workflow; who operated the software remains partly based on the Creator\'s statement.');
      }

      // Evidence: explain the architecture in plain English, while preserving IDs and semantics deeper in the view.
      const evidencePanel = shell.querySelector('[data-record-panel="evidence"]');
      if (evidencePanel) {
        replaceText(evidencePanel, '.record-tab-title', 'What supports each finding');
        replaceText(evidencePanel, '.record-tab-lede', 'Choose a finding to see its Evidence Status and the Materials linked to it. Evidence Status describes how the finding is supported. Access shows whether you can open each Material.');

        const selectorLabels = {
          s001: 'Final page structure',
          s002: 'Creative redirection',
          s008: 'AI assistance',
          s009: 'Iterative workflow',
          s011: 'Final assembly'
        };
        evidencePanel.querySelectorAll('[data-evidence-select]').forEach((selector) => {
          const label = selectorLabels[selector.dataset.evidenceSelect];
          if (label) selector.textContent = label;
        });

        const evidenceCopy = {
          s001: ['S-001', 'Final page structure and dramatic turning point', 'The final page directly supports this finding. Additional planning context is linked separately and is not public.'],
          s002: ['S-002', 'Creator rejected repetitive staging', 'The available process conversation records the Creator\'s rejection and redirection. The conversation itself is restricted.'],
          s008: ['S-008', 'AI-assisted scene, text and prompt work', 'The available ChatGPT process material records this AI assistance. The source material is restricted and is not public.'],
          s009: ['S-009', 'Iterative correction, generation and selection', 'Earlier panel versions, final selected panels, rejected alternatives and process material support this inference. The available archive may be incomplete.'],
          s011: ['S-011', 'Creator states he assembled the final page', 'Restricted Clip Studio screenshots support a layered assembly workflow. Creator correction and approval messages are represented as metadata only. Who operated the software is not independently established.']
        };

        evidencePanel.querySelectorAll('[data-evidence-group]').forEach((group) => {
          const copy = evidenceCopy[group.dataset.evidenceGroup];
          const head = group.querySelector('.evidence-group-head');
          if (copy && head) {
            const h2 = head.querySelector('h2');
            const p = head.querySelector('p');
            if (h2) h2.innerHTML = `<span class="finding-id">Finding ${copy[0]}</span>${copy[1]}`;
            if (p) p.textContent = copy[2];
          }
        });

        evidencePanel.querySelectorAll('.access-badge.access-restricted').forEach((badge) => { badge.textContent = 'Restricted'; });

        evidencePanel.querySelectorAll('.material-card').forEach((card) => {
          const heading = card.querySelector('h3');
          if (heading) {
            const match = heading.textContent.trim().match(/^((?:M|M2)-\d+(?:,\s*(?:M|M2)-\d+)*)\s*·\s*(.+)$/);
            if (match) heading.innerHTML = `<span class="material-id">Material ${match[1]}</span>${match[2]}`;
          }
          card.querySelectorAll('.material-card-actions a').forEach((link) => { link.textContent = 'Open material'; });
        });

        const descriptionReplacements = new Map([
          ['Approved public-presentation copy derived from a restricted private source Representation.', 'Public presentation copy. The original source file remains restricted.'],
          ['One of four selected Final panel Materials.', 'One of the four final selected panels.'],
          ['Records the Creator\'s rejection and redirection. No raw public Representation is authorised.', 'Records the Creator\'s rejection and redirection. The raw conversation is not public.'],
          ['Contains the relevant AI responses and process context. The full raw conversation is not public.', 'Contains the relevant AI responses and process context. The raw conversation is not public.']
        ]);
        evidencePanel.querySelectorAll('.material-card p').forEach((p) => {
          const replacement = descriptionReplacements.get(p.textContent.trim());
          if (replacement) p.textContent = replacement;
        });

        const catalogueHead = evidencePanel.querySelector('.evidence-row-head');
        if (catalogueHead?.children[3]) catalogueHead.children[3].textContent = 'Availability note';

        evidencePanel.querySelectorAll('.full-catalogue .evidence-row:not(.evidence-row-head)').forEach((row) => {
          const accessCell = row.children[2];
          const noteCell = row.children[3];
          if (accessCell?.textContent.trim() === 'Restricted / not public') accessCell.textContent = 'Restricted';
          if (!noteCell) return;
          const note = noteCell.textContent.trim();
          if (note === 'Private source exists; no approved public derivative.' || note === 'Private project material; no approved public derivative.' || note === 'Private planning material; no public object in this batch.') {
            noteCell.textContent = 'Source material exists but is not public.';
          }
          if (note === 'Approved public-presentation copy; private source remains restricted.') {
            noteCell.textContent = 'Public presentation copy available; original source remains restricted.';
          }
        });
      }

      const historyPanel = shell.querySelector('[data-record-panel="history"]');
      if (historyPanel) {
        replaceText(historyPanel, '.record-tab-title', 'Version history');
        replaceText(historyPanel, '.record-tab-lede', 'This view shows the issued history of this MADE Record. Internal working drafts are not treated as earlier public Record versions.');
        const items = historyPanel.querySelectorAll('.history-item');
        if (items[0]) replaceText(items[0], 'p', 'This is the current issued MADE Record for Work Version WV-003.');
        if (items[1]) replaceText(items[1], 'p', 'An earlier superseded Record exists. It is listed as metadata only and is not the current issued Record.');
      }
    }

    const availableLinks = catalogueLinks[recordId] || {};
    shell.querySelectorAll('.full-catalogue .evidence-row:not(.evidence-row-head)').forEach((row) => {
      const materialId = row.querySelector('strong')?.textContent.trim();
      const itemCell = row.children[1];
      const href = availableLinks[materialId];
      if (!materialId || !itemCell || !href) return;

      const link = document.createElement('a');
      link.className = 'catalogue-item-link';
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = itemCell.textContent;
      itemCell.replaceChildren(link);

      if (recordId === 'MR-PILOT-CV-001' && materialId === 'M2-001') {
        const noteCell = row.children[3];
        if (noteCell && !noteCell.querySelector('.catalogue-representation-links')) {
          const representationLinks = document.createElement('div');
          representationLinks.className = 'catalogue-representation-links';
          representationLinks.innerHTML = '<a href="evidence-viewer.html?asset=cv-en" target="_blank" rel="noopener">English WebP</a><a href="evidence-viewer.html?asset=cv-sr" target="_blank" rel="noopener">Serbian WebP</a><a href="https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-preview-v1.pdf" target="_blank" rel="noopener">Two-page PDF</a>';
          noteCell.appendChild(representationLinks);
        }
      }
    });

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