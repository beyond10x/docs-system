// Regression assets for the UX gate's own checks, run in headless Chromium on inline fixtures.
// UXF-014: the screen-only user reads a link's name the way the browser does, so block children are separate words.
// UXF-012: a docs sidebar taller than the screen scrolls inside its own column and is not "outside the viewport".
import assert from 'node:assert/strict';
import {DOCS_SITE_DEFAULTS} from '../dist/ux/adapter.js';
import {checkPage, openContext} from '../dist/ux/checks.js';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {launch} from '../dist/ux/run.js';
import {readFile} from 'node:fs/promises';
import {runScreenOnly} from '../dist/ux/screen-only.js';
import {serveSite} from '../dist/ux/site.js';

const adapter = {about: '', baseUrl: '/', ...DOCS_SITE_DEFAULTS};
const viewport = {width: 1024, height: 768};
const items = Array.from({length: 60}, (_, index) => `<li><a href="#${index}">Item ${index}</a></li>`).join('');
const sidebarPage = (container) => `<!doctype html><html data-theme="light"><body style="margin:0">
<nav class="navbar" style="height:60px">navbar</nav>
<div style="display:flex"><aside style="${container}"><ul class="theme-doc-sidebar-menu">${items}</ul></aside><main style="flex:1;height:4000px">content</main></div>
<footer style="height:200px">footer</footer></body></html>`;

const browser = await launch(process.env.B10X_CHROME_BIN);
let failures = 0;
const check = async (id, title, run) => {
  try { await run(); process.stdout.write(`ok ${id} ${title}\n`); } catch (error) { failures += 1; process.stderr.write(`FAIL ${id} ${title}\n${error.stack}\n`); }
};
try {
  const context = await openContext(browser, viewport, 'light');
  const page = await context.newPage();
  await check('UXF-012', 'a sidebar taller than the screen that scrolls in its own column is not reported as hidden', async () => {
    await page.setContent(sidebarPage('position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto;width:260px'));
    const facts = await checkPage(page, adapter, viewport, 'docs/guides', 'light');
    assert.deepEqual(facts.hidden.filter((entry) => entry.startsWith('sidebar')), []);
  });
  await check('UXF-012', 'a sidebar whose column itself leaves the screen is still reported', async () => {
    await page.setContent(sidebarPage('width:260px'));
    const facts = await checkPage(page, adapter, viewport, 'docs/guides', 'light');
    assert.ok(facts.hidden.some((entry) => entry.startsWith('sidebar')), 'a sidebar with no scroll column that runs past the screen must fail gate 2');
  });
  await check('UXF-014', 'the screen-only user follows a pagination link whose words sit in separate blocks, by keyboard', async () => {
    const root = await mkdtemp(path.join(import.meta.dirname, '..', '.cache', 'ux-name-')).catch(async () => { await mkdir(path.join(import.meta.dirname, '..', '.cache'), {recursive: true}); return mkdtemp(path.join(import.meta.dirname, '..', '.cache', 'ux-name-')); });
    await mkdir(path.join(root, 'docs'), {recursive: true});
    await writeFile(path.join(root, 'index.html'), '<!doctype html><main><a href="/docs/install"><div>Next</div><div>Install tool <span aria-hidden=\"true\">→</span></div></a></main>');
    await writeFile(path.join(root, 'docs', 'install.html'), '<!doctype html><main><pre>run the installer</pre></main>');
    const server = await serveSite(root, '/');
    try {
      const card = {id: 't', card: 'rotating', persona: '', task: '', start: '', keywords: ['install'], truth: {path: 'docs/install', text: 'run the installer'}, expectations: {maxActions: 4}};
      const result = await runScreenOnly(page, server.url, adapter, card, 'keyboard');
      assert.equal(result.completed, true, result.reason);
    } finally { await server.close(); await rm(root, {recursive: true, force: true}); }
  });
  await check('UXF-019', 'a hero with a tall aside keeps its heading and primary action on the first laptop screen', async () => {
    const styles = (await Promise.all(['tokens.css', 'product-theme.css', 'product-components.css'].map((name) => readFile(path.join(import.meta.dirname, '..', 'styles', name), 'utf8')))).join('\n');
    await page.setContent(`<!doctype html><html data-theme="light"><head><style>${styles}</style></head><body><nav style="height:60px">navbar</nav><section class="b10x-product" style="width:928px;margin:0 auto"><div class="b10x-hero"><div><p>Kicker</p><h1>Specify once. Derive contracts. <em>Prove the code.</em></h1><p class="b10x-hero__lede">${"A lede that turns system intent into a validated typed model and deterministic artifacts. ".repeat(5)}</p><div class="b10x-hero__actions"><a class="b10x-button" href="#">Get started</a></div></div><div class="b10x-hero__aside" style="height:1500px">aside</div></div></section></body></html>`);
    const bottom = await page.locator('.b10x-hero__actions .b10x-button').evaluate((button) => button.getBoundingClientRect().bottom);
    assert.ok(bottom <= viewport.height, `the primary action ends at ${Math.round(bottom)}px of ${viewport.height}px`);
  });
  await context.close();
} finally { await browser.close(); }
if (failures) process.exit(1);
