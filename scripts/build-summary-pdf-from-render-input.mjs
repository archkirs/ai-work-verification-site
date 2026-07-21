import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/build-summary-pdf-from-render-input.mjs <render-input.json> <output.html>');
  process.exit(2);
}

const root = process.cwd();
const inputPath = resolve(root, inputArg);
const outputPath = resolve(root, outputArg);
const data = JSON.parse(await readFile(inputPath, 'utf8'));

const required = (condition, message) => {
  if (!condition) throw new Error(message);
};

required(data.schema_version === 'record-export-render-input-v1', 'Unsupported canonical render-input schema');
required(data.trusted_source?.type === 'canonical_supabase_record_data', 'Render input is not marked as canonical Supabase Record data');
required(data.record?.lifecycle_status === 'issued_current', 'Render input source Record Version is not issued_current');
required(data.export?.profile === 'summary', 'Only Summary PDF profile is supported');
required(data.export?.profile_version === 'summary-pdf-v1', 'Unsupported Summary PDF profile version');
required(data.export?.access_profile === 'public', 'Only public Summary PDF access profile is supported');
required(data.export?.export_id, 'Export ID is required');
required(data.render_input_checksum?.length === 64, 'Canonical render-input checksum is missing');
required(Array.isArray(data.principal_findings) && data.principal_findings.length > 0, 'Principal findings are required');
required(Array.isArray(data.process_steps) && data.process_steps.length > 0, 'Process steps are required');
required(Array.isArray(data.evidence?.embedded_previews) && data.evidence.embedded_previews.length > 0, 'Approved embedded previews are required');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const statusMeta = {
  directly_supported: ['Directly supported', 'direct'],
  partially_supported: ['Partially supported', 'partial'],
  declared_independently_unsupported: ['Declared, independently unsupported', 'declared'],
  source_tool_recorded: ['Source-tool recorded', 'source'],
  inferred_from_available_evidence: ['Inferred from evidence', 'inferred'],
  conflicting_evidence: ['Conflicting evidence', 'partial'],
  not_established: ['Not established', 'declared'],
  not_assessed: ['Not assessed', 'declared'],
  evidence_unavailable_or_withdrawn: ['Evidence unavailable / withdrawn', 'declared']
};

const contributionMeta = {
  human: ['Human contribution', 'human'],
  ai: ['AI contribution', 'ai'],
  mixed: ['Mixed human/AI contribution', 'mixed'],
  unknown_not_established: ['Contribution not established', 'mixed'],
  not_applicable: ['Context / observation', 'mixed']
};

function formatMaterialIds(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return 'None';
  const parsed = unique.map(id => {
    const match = String(id).match(/^(.*?-)(\d+)$/);
    return match ? { id, prefix: match[1], number: Number(match[2]), width: match[2].length } : null;
  });
  if (parsed.some(item => !item)) return unique.join(' · ');
  const prefixes = [...new Set(parsed.map(item => item.prefix))];
  if (prefixes.length !== 1) return unique.join(' · ');
  const items = [...parsed].sort((a, b) => a.number - b.number);
  const ranges = [];
  let start = items[0];
  let previous = items[0];
  const emit = () => {
    if (start.number === previous.number) ranges.push(start.id);
    else if (previous.number === start.number + 1) ranges.push(`${start.id} · ${previous.id}`);
    else ranges.push(`${start.id}–${previous.id}`);
  };
  for (const item of items.slice(1)) {
    if (item.number === previous.number + 1) {
      previous = item;
      continue;
    }
    emit();
    start = previous = item;
  }
  emit();
  return ranges.join(' · ');
}

const record = data.record;
const work = record.work;
const exportInfo = data.export;
const layout = exportInfo.layout_variant;
required(layout === 'comic' || layout === 'cv', `Unsupported layout variant: ${layout}`);

const issueDate = record.issue_date || 'Not recorded';
const generatedDate = String(exportInfo.generated_at).slice(0, 10);
const displayUrl = String(record.canonical_record_url).replace(/^https?:\/\//, '');
const summaryStatements = data.summary_statements || [];
const summaryHeadline = summaryStatements[0]?.statement_text || record.record_scope_summary || work.title;
const summaryBody = summaryStatements.slice(1).map(item => item.statement_text).join(' ') || record.record_scope_summary || '';
const contributionStates = [...new Set(summaryStatements.map(item => item.contribution_state).filter(Boolean))].slice(0, 3);
const contributionBadges = contributionStates.map(state => {
  const [label, className] = contributionMeta[state] || [state, 'mixed'];
  return `<span class="context-pill ${className}">${esc(label)}</span>`;
}).join('');

const findingsHtml = data.principal_findings.map(finding => {
  const [label, className] = statusMeta[finding.evidence_status] || [finding.evidence_status, 'declared'];
  const supportingText = finding.basis_reasoning
    || finding.uncertainty
    || finding.evidence_links?.[0]?.explanation
    || 'See the linked canonical Evidence relationships for this finding.';
  return `
        <article class="finding-card">
          <div class="finding-top"><span class="statement-id">${esc(finding.statement_id)}</span><span class="status-pill ${className}">${esc(label)}</span></div>
          <h2>${esc(finding.statement_text)}</h2>
          <p>${esc(supportingText)}</p>
          <div class="material-links">Linked Materials: ${esc(formatMaterialIds(finding.linked_material_ids))}</div>
        </article>`;
}).join('');

const processHtml = data.process_steps.map((step, index) => `
            <li><span class="step-number">${index + 1}</span><div><h3>${esc(step.subject || step.statement_id)}</h3><p>${esc(step.statement_text)}</p><div class="material-links">Related Materials: ${esc(formatMaterialIds(step.linked_material_ids))}</div></div></li>`).join('');

const previews = data.evidence.embedded_previews;
const primaryPreviews = previews.filter(preview => String(preview.role || '').startsWith('primary'));
const selectedPreviews = layout === 'comic' ? previews.filter(preview => preview.role !== 'primary') : primaryPreviews;
required(primaryPreviews.length > 0, 'At least one primary preview is required');

const heroPreviewHtml = layout === 'cv'
  ? `<div class="cv-page-pair" aria-label="Approved privacy-safe Record preview">${primaryPreviews.map((preview, index) => `<div class="cv-page-preview"><img src="${esc(preview.render_src)}" alt="Approved privacy-safe preview page ${index + 1} for ${esc(preview.material_id)}" /></div>`).join('')}</div>`
  : `<div class="asset-frame asset-frame-page"><img src="${esc(primaryPreviews[0].render_src)}" alt="Approved public presentation preview for ${esc(primaryPreviews[0].material_id)}" /></div>`;

const pageThreePreviewHtml = layout === 'cv'
  ? `<div class="cv-evidence-pair">${selectedPreviews.map((preview, index) => `<figure class="cv-evidence-card"><div class="preview-head">${esc(preview.material_id)} · PAGE ${index + 1}</div><div class="cv-evidence-image"><img src="${esc(preview.render_src)}" alt="Approved redacted public preview page ${index + 1}" /></div><figcaption>Approved branded redacted preview</figcaption></figure>`).join('')}</div>`
  : `<div class="preview-grid">${selectedPreviews.map((preview, index) => `<figure class="preview-card"><div class="preview-head">${esc(preview.material_id)}</div><div class="preview-image"><img src="${esc(preview.render_src)}" alt="Approved branded public preview for ${esc(preview.material_id)}" /></div><figcaption>${esc(preview.material_label || `Selected preview ${index + 1}`)}</figcaption><span>Approved branded public copy</span></figure>`).join('')}</div>`;

const evidenceGroups = data.evidence;
const inclusionHtml = `
              <div><dt><span class="legend-dot public"></span>Public previews</dt><dd>${esc(formatMaterialIds(previews.map(preview => preview.material_id)))} · only approved public/redacted presentation objects are embedded.</dd></div>
              <div><dt><span class="legend-dot restricted"></span>Restricted / not included</dt><dd>${esc(formatMaterialIds(evidenceGroups.restricted_not_included_material_ids))}</dd></div>
              <div><dt><span class="legend-dot metadata"></span>Metadata only</dt><dd>${esc(formatMaterialIds(evidenceGroups.metadata_only_material_ids))}</dd></div>
              <div><dt><span class="legend-dot unavailable"></span>Not available</dt><dd>${esc(formatMaterialIds(evidenceGroups.unavailable_material_ids))}</dd></div>
              ${evidenceGroups.other_not_embedded_material_ids?.length ? `<div><dt>Other not embedded</dt><dd>${esc(formatMaterialIds(evidenceGroups.other_not_embedded_material_ids))}</dd></div>` : ''}`;

const limitations = (data.limitations || []).slice(0, 4);
const limitationsText = limitations.length
  ? limitations.join(' ')
  : 'No additional limitation text was selected beyond the canonical Record status and Evidence relationships.';

const cvStyles = layout === 'cv'
  ? '  <link rel="stylesheet" href="summary-pdf-cv.css" />\n  <link rel="stylesheet" href="summary-pdf-cv-export.css" />\n'
  : '';
const bodyClass = layout === 'cv'
  ? 'summary-pdf-prototype cv-summary-prototype cv-summary-export canonical-summary-export'
  : 'summary-pdf-prototype canonical-summary-export';
const heroClass = layout === 'cv' ? 'hero-grid cv-hero-grid' : 'hero-grid';
const workCardClass = layout === 'cv' ? 'work-card cv-work-card' : 'work-card';
const processGridClass = layout === 'cv' ? 'process-evidence-grid cv-process-evidence-grid' : 'process-evidence-grid';
const previewLabel = layout === 'cv' ? 'BRANDED REDACTED PREVIEW' : 'BRANDED PREVIEW';
const pageThreeHeading = layout === 'cv' ? 'Process and redacted Evidence' : 'Process and selected Evidence';
const pageThreeContext = layout === 'cv' ? 'PROCESS · REDACTED EVIDENCE · LIMITS' : 'PROCESS · SELECTED EVIDENCE · LIMITS';

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MADE Record — Summary PDF — ${esc(work.title)}</title>
  <meta name="robots" content="noindex,nofollow" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="summary-pdf.css" />
  <link rel="stylesheet" href="summary-pdf-overrides.css" />
${cvStyles}</head>
<body class="${bodyClass}">
  <main class="pdf-document" aria-label="MADE Record Summary PDF generated from canonical Record data">
    <section class="pdf-page" aria-label="Summary PDF page 1 of 3">
      <header class="pdf-header"><div class="pdf-brand-lockup"><img src="asmade-wordmark.svg" alt="AsMade" class="pdf-wordmark" /><span style="border-left:1px solid var(--pdf-line);padding-left:3mm">MADE Record</span></div><div class="pdf-header-context"><span>SUMMARY PDF · ${esc(exportInfo.profile_version)}</span><img src="favicon.svg" alt="" aria-hidden="true" class="pdf-grid-mark" /></div></header>
      <div class="pdf-kicker">${esc(work.work_type)}</div>
      <h1 class="pdf-title">${esc(work.title)}</h1>
      <dl class="identity-strip"><div><dt>Record ID</dt><dd>${esc(record.record_id)}</dd></div><div><dt>Version</dt><dd>${esc(record.record_version_id)}</dd></div><div><dt>Status at generation</dt><dd>Issued — current</dd></div><div><dt>Work version</dt><dd>${esc(work.work_version_id)}</dd></div></dl>
      <div class="${heroClass}">
        <figure class="${workCardClass}"><div class="work-card-head"><strong>${esc(primaryPreviews[0].material_id)}</strong><span>${previewLabel}</span></div>${heroPreviewHtml}<figcaption>${esc(primaryPreviews[0].material_label || 'Approved public-safe Record preview')}</figcaption></figure>
        <section class="record-summary-card"><div class="pdf-small-label">What this Record shows</div><h2>${esc(summaryHeadline)}</h2><p>${esc(summaryBody)}</p><div class="summary-divider"></div><dl class="creator-meta"><div><dt>Creator</dt><dd>${esc(data.creator.display_name)}</dd></div><div><dt>Contribution context</dt><dd class="context-badges">${contributionBadges}</dd></div></dl></section>
      </div>
      <section class="snapshot-card"><div class="snapshot-copy"><h2>Snapshot identity</h2><dl class="snapshot-fields"><div><dt>Record issue date</dt><dd>${esc(issueDate)}</dd></div><div><dt>PDF generated</dt><dd>${esc(generatedDate)}</dd></div><div><dt>Export profile</dt><dd>${esc(exportInfo.profile_version)}</dd></div></dl><dl class="snapshot-export-id"><div><dt>Export ID</dt><dd>${esc(exportInfo.export_id)}</dd></div></dl></div><div class="snapshot-link"><img src="${esc(exportInfo.qr_asset)}" alt="QR code linking to the current online MADE Record" /><span>Check current Record</span><a href="${esc(record.canonical_record_url)}">${esc(displayUrl)}</a></div></section>
      <footer class="pdf-footer"><span>MADE Record Summary PDF</span><span>${esc(record.record_id)} · v${esc(record.record_version_id)} · 1/3</span></footer>
    </section>

    <section class="pdf-page" aria-label="Summary PDF page 2 of 3">
      <header class="pdf-header"><div class="pdf-brand-lockup"><img src="asmade-wordmark.svg" alt="AsMade" class="pdf-wordmark" /><span style="border-left:1px solid var(--pdf-line);padding-left:3mm">MADE Record</span></div><div class="pdf-header-context"><span>PRINCIPAL FINDINGS</span><img src="favicon.svg" alt="" aria-hidden="true" class="pdf-grid-mark" /></div></header>
      <h1 class="section-title">Principal findings</h1>
      <p class="section-intro">Evidence Status describes support for each finding. Material access state separately describes what a reader can open.</p>
      <div class="finding-list">${findingsHtml}
      </div>
      <aside class="boundary-box"><h2>Important interpretation boundary</h2><p>These findings describe the available evidence and attributed statements. They do not establish legal authorship, ownership, originality, rights clearance, a complete reconstruction of every creation step, or an automatic human/AI contribution score.</p></aside>
      <footer class="pdf-footer"><span>MADE Record Summary PDF</span><span>${esc(record.record_id)} · v${esc(record.record_version_id)} · 2/3</span></footer>
    </section>

    <section class="pdf-page" aria-label="Summary PDF page 3 of 3">
      <header class="pdf-header"><div class="pdf-brand-lockup"><img src="asmade-wordmark.svg" alt="AsMade" class="pdf-wordmark" /><span style="border-left:1px solid var(--pdf-line);padding-left:3mm">MADE Record</span></div><div class="pdf-header-context"><span>${pageThreeContext}</span><img src="favicon.svg" alt="" aria-hidden="true" class="pdf-grid-mark" /></div></header>
      <h1 class="section-title">${pageThreeHeading}</h1>
      <p class="section-intro">A concise recipient-facing sequence generated from selected canonical Statements and their Evidence relationships.</p>
      <div class="${processGridClass}"><section><h2 class="column-title">Supported workflow summary</h2><ol class="process-list">${processHtml}
          </ol></section><section><h2 class="column-title">Selected approved public previews</h2>${pageThreePreviewHtml}<aside class="evidence-inclusion-box"><h2>What Evidence is included in this PDF</h2><p class="box-intro">Only approved public-safe presentation objects are embedded; other Materials remain represented by status or canonical references.</p><dl>${inclusionHtml}
            </dl></aside></section></div>
      <aside class="limits-box"><h2>Limitations and snapshot notice</h2><p>${esc(limitationsText)}</p><div class="limits-divider"></div><h3>Snapshot notice</h3><p>This PDF is a snapshot of MADE Record ${esc(record.record_id)}, version ${esc(record.record_version_id)}, at the stated generation time. Check the online MADE Record for the current version and status.</p><p class="small-boundary">Not an AI detector, legal certification, proof of copyright or ownership, proof of complete evidence, or an automatic human/AI contribution score.</p></aside>
      <footer class="pdf-footer"><span>MADE Record Summary PDF</span><span>${esc(record.record_id)} · v${esc(record.record_version_id)} · 3/3</span></footer>
    </section>
  </main>
</body>
</html>
`;

await writeFile(outputPath, html, 'utf8');
console.log(`Built ${outputPath} from trusted canonical render input ${data.render_input_checksum}`);
