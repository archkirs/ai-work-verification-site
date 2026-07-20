(() => {
  const shell = document.querySelector('[data-record-shell][aria-label*="MR-PILOT-CV-001"]');
  if (!shell) return;

  document.body.classList.add('cv-stage-b-record');

  const style = document.createElement('style');
  style.textContent = `
    body.cv-stage-b-record .site-header .brand {
      display: inline-flex;
      align-items: center;
      width: fit-content;
    }
    body.cv-stage-b-record .site-header .brand::after {
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
      body.cv-stage-b-record .site-header .brand::after {
        margin-left: 8px;
        padding-left: 8px;
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);

  const replaceText = (root, selector, value) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  };

  // Record first layer.
  const recordPanel = shell.querySelector('[data-record-panel="record"]');
  if (recordPanel) {
    const previewCaption = recordPanel.querySelector('.work-preview-caption');
    if (previewCaption) {
      const strong = previewCaption.querySelector('strong');
      const note = previewCaption.querySelector('span');
      if (strong) strong.textContent = 'Work preview';
      if (note) note.textContent = 'Redacted public preview · English and Serbian pages';
    }

    const scopeRow = Array.from(recordPanel.querySelectorAll('.record-identity-row')).find((row) => row.querySelector('span')?.textContent.trim() === 'Scope');
    if (scopeRow) {
      scopeRow.querySelector('span').textContent = 'This Record covers';
      scopeRow.querySelector('strong').textContent = 'This English and Serbian CV, AI-assisted writing and translation, Creator review, and the available supporting materials.';
    }

    const result = recordPanel.querySelector('.record-result');
    if (result) {
      replaceText(result, 'h2', 'AI helped write and translate the CV. The Creator reviewed the result and says he approved the final text.');
      replaceText(result, 'p:last-child', 'The Creator states that the professional facts came from him. ChatGPT helped organise and rewrite the English text and translate it into Serbian. The available process record also shows the Creator asking for the Serbian wording to be checked and corrected.');
    }

    const findingsHead = recordPanel.querySelector('.principal-findings-head');
    if (findingsHead) {
      replaceText(findingsHead, 'h2', 'What we found');
      replaceText(findingsHead, 'p', 'Each finding shows what the available information supports. Open it to see the related evidence.');
    }

    const findingCopy = {
      's2-001': ['The final work is a two-page CV in English and Serbian.', 'The approved redacted preview directly shows both pages.'],
      's2-002': ['The Creator says the professional facts came from him, not ChatGPT.', 'This comes from the Creator declaration; the professional facts themselves are not independently checked by this Record.'],
      's2-003': ['The Creator says ChatGPT helped organise and rewrite the English CV.', 'The earlier ChatGPT interaction for this part has not been located as controlled Evidence.'],
      's2-004': ['The available ChatGPT record shows the CV being translated into Serbian and then checked and corrected.', 'The process record contains the translation request, AI output and later checking/correction step.'],
      's2-005': ['The Creator reviewed the Serbian translation and says he approved the final CV text.', 'The process record supports active Serbian-language review; approval of the complete final text remains Creator-declared.']
    };

    recordPanel.querySelectorAll('.finding-item').forEach((item) => {
      const button = item.querySelector('[data-view-evidence]');
      const copy = findingCopy[button?.dataset.viewEvidence];
      if (!copy) return;
      replaceText(item, '.finding-copy h3', copy[0]);
      replaceText(item, '.finding-copy p', copy[1]);
      if (button) button.textContent = 'See evidence';
    });

    recordPanel.querySelectorAll('.evidence-status.declared').forEach((el) => { el.textContent = 'Creator-declared'; });
    recordPanel.querySelectorAll('.evidence-status.source').forEach((el) => { el.textContent = 'Recorded in source tool'; });
  }

  // Process: keep the accepted sequence, remove Material/access strings from the main workflow.
  const processPanel = shell.querySelector('[data-record-panel="process"]');
  if (processPanel) {
    replaceText(processPanel, '.record-tab-lede', 'This view shows the main preparation steps supported by the available information. Some steps are based on the Creator\'s declaration because the original source interaction is not available.');
    processPanel.querySelectorAll('.process-materials').forEach((el) => el.remove());
    replaceText(processPanel, '.record-boundary-note', 'The available Canva screenshot shows a two-page editable CV project. It does not establish the complete assembly or export history, so this Record does not reconstruct those steps.');
  }

  // Evidence: plain-language entry, deeper traceability preserved.
  const evidencePanel = shell.querySelector('[data-record-panel="evidence"]');
  if (evidencePanel) {
    replaceText(evidencePanel, '.record-tab-title', 'What supports each finding');
    replaceText(evidencePanel, '.record-tab-lede', 'Choose a finding to see its Evidence Status and the Materials linked to it. Evidence Status describes how the finding is supported. Access shows whether you can open a redacted preview, see a summary, or whether a Material is unavailable.');

    const selectorLabels = {
      's2-001': 'Final bilingual CV',
      's2-002': 'Professional information',
      's2-003': 'English AI assistance',
      's2-004': 'Serbian translation',
      's2-005': 'Creator review'
    };
    evidencePanel.querySelectorAll('[data-evidence-select]').forEach((selector) => {
      const label = selectorLabels[selector.dataset.evidenceSelect];
      if (label) selector.textContent = label;
    });

    const evidenceCopy = {
      's2-001': ['S2-001', 'Final bilingual CV', 'The redacted preview directly supports this finding. It is one Material with three public Representations: an English page preview, a Serbian page preview and a two-page PDF.'],
      's2-002': ['S2-002', 'Professional information came from the Creator', 'The Creator process declaration supports this statement. The Record does not independently verify the professional claims themselves.'],
      's2-003': ['S2-003', 'ChatGPT helped structure and rewrite the English CV', 'The Creator process declaration describes this AI assistance. The earlier structuring and rewriting interaction is not currently available.'],
      's2-004': ['S2-004', 'Serbian translation and later checking', 'The available ChatGPT interaction records the translation request, AI translation output and later Creator-requested checking and correction.'],
      's2-005': ['S2-005', 'Creator review and final approval', 'The available process interaction supports active review of the Serbian text. Approval of the complete final text remains Creator-declared.']
    };

    evidencePanel.querySelectorAll('[data-evidence-group]').forEach((group) => {
      const copy = evidenceCopy[group.dataset.evidenceGroup];
      const head = group.querySelector('.evidence-group-head');
      if (copy && head) {
        const heading = head.querySelector('h2');
        const paragraph = head.querySelector('p');
        if (heading) heading.innerHTML = `<span class="finding-id">Finding ${copy[0]}</span>${copy[1]}`;
        if (paragraph) paragraph.textContent = copy[2];
      }
    });

    evidencePanel.querySelectorAll('.evidence-status.declared').forEach((el) => { el.textContent = 'Creator-declared'; });
    evidencePanel.querySelectorAll('.evidence-status.source').forEach((el) => { el.textContent = 'Recorded in source tool'; });
    evidencePanel.querySelectorAll('.access-badge.access-restricted').forEach((badge) => { badge.textContent = 'Restricted'; });

    evidencePanel.querySelectorAll('.material-card').forEach((card) => {
      const heading = card.querySelector('h3');
      if (heading) {
        const match = heading.textContent.trim().match(/^(M2-\d+)\s*·\s*(.+)$/);
        if (match) heading.innerHTML = `<span class="material-id">Material ${match[1]}</span>${match[2]}`;
      }
    });

    const m2001 = evidencePanel.querySelector('[data-evidence-group="s2-001"] .material-card');
    if (m2001) {
      replaceText(m2001, 'p', 'One Material with an approved redacted public preview. Phone, personal email, address, website and LinkedIn URL are excluded. The portrait is intentionally retained under explicit authorisation. The raw CV remains restricted.');
      replaceText(m2001, '.representation-group strong', 'Available views');
      const links = m2001.querySelectorAll('.representation-links a');
      if (links[0]) links[0].textContent = 'English page';
      if (links[1]) links[1].textContent = 'Serbian page';
      if (links[2]) links[2].textContent = 'Two-page PDF';
    }

    evidencePanel.querySelectorAll('.material-card').forEach((card) => {
      const badge = card.querySelector('.access-badge.access-restricted');
      const paragraph = card.querySelector('p');
      if (!badge || !paragraph) return;
      const text = paragraph.textContent.trim();
      if (text.startsWith('Approved public summary: the Creator states')) {
        paragraph.textContent = 'Public summary shown here: the Creator states that he supplied the professional facts. The full source remains restricted.';
      } else if (text.startsWith('Approved public summary: ChatGPT helped')) {
        paragraph.textContent = 'Public summary shown here: ChatGPT helped collect, structure, rewrite and propose wording based on information supplied by the Creator. The full source remains restricted.';
      } else if (text.startsWith('Privacy-safe process summary:')) {
        paragraph.textContent = 'Public summary shown here: English CV text → request for Serbian translation → AI translation → Creator requests checking and correction. The raw conversation remains restricted.';
      }
    });

    const catalogueHead = evidencePanel.querySelector('.evidence-row-head');
    if (catalogueHead?.children[3]) catalogueHead.children[3].textContent = 'Availability note';

    evidencePanel.querySelectorAll('.full-catalogue .evidence-row:not(.evidence-row-head)').forEach((row) => {
      const accessCell = row.children[2];
      if (!accessCell) return;
      if (accessCell.textContent.trim() === 'Restricted / summary only') accessCell.textContent = 'Restricted';
      if (accessCell.textContent.trim() === 'Catalogue only / restricted') accessCell.textContent = 'Restricted';
    });

    replaceText(evidencePanel, '.full-catalogue .record-boundary-note', 'Material ID M2-007 is unused. A separate earlier-draft file set could not be established, so no Material was created for it.');
  }

  // Route the approved public CV PDF through the branded Evidence Viewer instead of direct B2 delivery.
  const publicCvPdf = 'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-preview-v1.pdf';
  document.querySelectorAll('a[href]').forEach((link) => {
    if (link.href === publicCvPdf) link.href = 'evidence-viewer.html?asset=cv-pdf';
  });

  // History.
  const historyPanel = shell.querySelector('[data-record-panel="history"]');
  if (historyPanel) {
    replaceText(historyPanel, '.record-tab-title', 'Version history');
    replaceText(historyPanel, '.record-tab-lede', 'This view shows the issued history of this MADE Record. Internal working drafts are not public Record versions.');
    const items = historyPanel.querySelectorAll('.history-item');
    if (items[0]) replaceText(items[0], 'p', 'This is the current issued MADE Record for Work Version WV-001.');
    if (items[1]) replaceText(items[1], 'p', 'Earlier internal drafts were used during preparation and review before Version 0.3 was issued. They were never public Record versions.');
  }
})();
