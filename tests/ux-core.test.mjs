// L1 for the UX loop: the core stays generic, the ratchet and the findings rule fail when they must.
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {checkFindings} from '../dist/ux/findings.js';
import {ratchet, toleranceFor, updateBaseline} from '../dist/ux/ratchet.js';
import {choose} from '../dist/ux/screen-only.js';
import {metricsOf, gateFailures} from '../dist/ux/run.js';
import {loadAdapter} from '../dist/ux/adapter.js';

const root = path.resolve(import.meta.dirname, '..');
const scratch = async () => { await mkdir(path.join(root, '.cache'), {recursive: true}); return mkdtemp(path.join(root, '.cache', 'ux-test-')); };

test('the UX core imports nothing from the docs-system UI', async () => {
  for (const name of await readdir(path.join(root, 'src/ux'))) {
    const source = await readFile(path.join(root, 'src/ux', name), 'utf8');
    for (const [, specifier] of source.matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g)) {
      const allowed = specifier.startsWith('node:') || specifier === 'playwright' || /^\.\/[a-z-]+\.js$/.test(specifier);
      assert.ok(allowed, `src/ux/${name} imports ${specifier}`);
    }
  }
});

test('the docs-system adapter gates two of the five measured docs-site viewports in both themes', async () => {
  const {adapter, scenarios} = await loadAdapter(path.join(root, 'ux/adapter.json'));
  assert.deepEqual(adapter.viewports.measured, ['1440x900', '1280x800', '1024x768', '768x1024', '390x844']);
  assert.ok(adapter.viewports.gating.every((viewport) => adapter.viewports.measured.includes(viewport)));
  assert.deepEqual(adapter.themes, ['light', 'dark']);
  assert.deepEqual(adapter.alwaysVisible.map((rule) => rule.name), ['navbar', 'search', 'theme toggle', 'menu toggle', 'sidebar']);
  assert.ok(scenarios.filter((card) => card.card === 'anchor').length >= 2);
});

const baseline = (value, tolerance = 0, decision) => ({about: '', tolerances: {counts: 0, steps: 0.05, layout_shift: 0.01}, scenarios: {a: {k: {value, tolerance, ...(decision ? {decision} : {})}}}});

test('the ratchet fails on worse, untaken improvements, missing values and an unexplained worse baseline', () => {
  assert.deepEqual(ratchet(baseline(2), {a: {k: 2}}), []);
  assert.match(ratchet(baseline(2), {a: {k: 3}})[0], /worse than the baseline/);
  assert.match(ratchet(baseline(2), {a: {k: 1}})[0], /improves on the baseline/);
  assert.match(ratchet(baseline(2), {a: {}})[0], /no measured value/);
  assert.match(ratchet(baseline(2), {a: {k: 2, j: 0}})[0], /not in the baseline/);
  assert.match(ratchet(baseline(3), {a: {k: 3}}, baseline(2))[0], /worse than main's 2 without a decision id/);
  assert.deepEqual(ratchet(baseline(3, 0, 'R-01'), {a: {k: 3}}, baseline(2)), []);
  assert.deepEqual(ratchet(baseline(0.1, 0.01), {a: {k: 0.105}}), []);
});

test('tolerances are 0 for counts, 5 % for step statistics and 0.01 for layout shift', () => {
  assert.equal(toleranceFor('screen_only.actions', 4), 0);
  assert.equal(toleranceFor('glance_cost.median', 2), 0.1);
  assert.equal(toleranceFor('layout_shift.cls_max', 0.3), 0.01);
});

test('updating the baseline refuses a worse value without a decision id', () => {
  const refused = updateBaseline(baseline(2), {a: {k: 3}});
  assert.equal(refused.baseline.scenarios.a.k.value, 2);
  assert.equal(refused.refused.length, 1);
  const decided = updateBaseline(baseline(2), {a: {k: 3}}, 'R-01');
  assert.deepEqual(decided.baseline.scenarios.a.k, {value: 3, tolerance: 0, decision: 'R-01'});
  assert.equal(updateBaseline(baseline(2), {a: {k: 1}}).baseline.scenarios.a.k.value, 1);
});

test('the screen-only user picks the link that names the task, primary region on a tie', () => {
  const links = [
    {name: 'Components', href: 'x/docs', region: 'other', index: 0},
    {name: 'Read the components', href: 'x/docs', region: 'primary', index: 5},
    {name: 'Adopt the template', href: 'x/adopt', region: 'other', index: 9},
  ];
  assert.equal(choose(links, ['adopt', 'components']).name, 'Adopt the template');
  assert.equal(choose(links.slice(0, 2), ['adopt', 'components']).name, 'Read the components');
  assert.equal(choose(links, ['install']), undefined);
});

test('gates and metrics count what each view reports', () => {
  const facts = (extra = {}) => ({pageScrollX: 0, overflow: [], truncated: [], hidden: [], missingOptional: [], axe: {serious: [], critical: [], moderate: [], minor: []}, axeNodes: {serious_critical: 0, moderate_minor: 0}, cls: 0, motion: [], errors: [], ...extra});
  const run = {
    pages: ['', 'docs'], viewports: ['390x844'], gating: ['390x844'], themes: ['light'],
    pageRuns: [{page: '', viewport: '390x844', theme: 'light', facts: facts({overflow: ['pre: spans 0..420 of 390px']})}, {page: 'docs', viewport: '390x844', theme: 'light', facts: facts({axe: {serious: ['color-contrast (2)'], critical: [], moderate: [], minor: []}, axeNodes: {serious_critical: 2, moderate_minor: 0}})}],
    botRuns: [{viewport: '390x844', theme: 'light', result: {scenario: 's', mode: 'pointer', completed: true, actions: 5, looks: 6, steers: 0, glances: [2, 1], timeToAct: [1, 2], trail: []}}],
    failures: [], metrics: {},
  };
  const cards = [{id: 's', expectations: {maxActions: 4}}];
  const failures = gateFailures(run, cards);
  assert.equal(failures.length, 3);
  assert.match(failures.join('\n'), /gate 1 no scroll/);
  assert.match(failures.join('\n'), /gate 5 accessibility/);
  assert.match(failures.join('\n'), /took 5 actions, card allows 4/);
  const metrics = metricsOf(run, cards);
  assert.equal(metrics['site@390x844@light']['layout.overflow'], 1);
  assert.equal(metrics['s@390x844']['screen_only.actions'], 5);
  assert.equal(metrics['s@390x844']['glance_cost.median'], 1.5);
});

test('a closed S1 or S2 finding needs a regression asset that names it', async () => {
  const directory = await scratch();
  try {
    const record = (id, status, asset) => `# ${id}\n\n- id: ${id}\n- title: t\n- class: layout\n- severity: S2\n- metric: m\n- status: ${status}\n- found_by: test\n- evidence_recording: none\n- evidence_screenshot: none\n- evidence_lines: none\n- regression_asset: ${asset}\n`;
    await mkdir(path.join(directory, 'findings'));
    await writeFile(path.join(directory, 'findings/UXF-001.md'), record('UXF-001', 'closed', 'none'));
    await writeFile(path.join(directory, 'findings/UXF-002.md'), record('UXF-002', 'closed', 'asset.mjs'));
    await writeFile(path.join(directory, 'findings/UXF-003.md'), record('UXF-003', 'open', 'none'));
    await writeFile(path.join(directory, 'asset.mjs'), '// UXF-001 only\n');
    const problems = await checkFindings(path.join(directory, 'findings'), directory);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /UXF-001.md: closed S2 without a regression asset/);
    assert.match(problems[1], /UXF-002.md: regression asset asset.mjs is missing or does not name UXF-002/);
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test('every finding on file in ux/findings passes the findings rule', async () => {
  assert.deepEqual(await checkFindings(path.join(root, 'ux/findings'), root), []);
});
