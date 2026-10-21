// Rendered-page checks for the product-site template, built from examples/product-site.
// Each check names the docs-system issue it guards. PRODUCT_SITE_CHECKS=19,22 runs a subset.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {productSiteServer} from './product-site-server.mjs';

const server = await productSiteServer();
const browser = await chromium.launch({headless: true, ...(process.env.B10X_CHROME_BIN ? {executablePath: process.env.B10X_CHROME_BIN} : {}), args: ['--no-sandbox', '--disable-dev-shm-usage']})
  .catch(async error => { await server.close(); throw error; });
const only = process.env.PRODUCT_SITE_CHECKS?.split(',').map(Number);
const widths = [1440, 1280, 996, 390];
const themes = ['light', 'dark'];
const checks = [];
const check = (issue, name, run) => { if (!only || only.includes(issue)) checks.push({issue, name, run}); };

async function open(url, {width = 1440, theme = 'light', touch = false} = {}) {
  const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme, ...(touch ? {isMobile: true, hasTouch: true} : {})});
  await context.addInitScript(value => { try { localStorage.setItem('theme', value); } catch {} }, theme);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(String(error)));
  await page.goto(new URL(url, server.url).href, {waitUntil: 'load'});
  await page.evaluate(() => document.fonts.ready);
  return {page, errors, close: () => context.close()};
}

check(19, 'hero terminal output is visible at first paint and after scrolling to it', async () => {
  for (const theme of themes) for (const width of widths) {
    const {page, errors, close} = await open('', {width, theme});
    try {
      const hidden = () => page.evaluate(() => {
        const terminal = document.querySelector('.b10x-hero-art .b10x-terminal');
        if (!terminal) return ['no hero terminal'];
        return [...terminal.querySelectorAll('.b10x-terminal__output, .b10x-terminal__command')]
          .filter(line => getComputedStyle(line).visibility !== 'visible' || line.closest('.b10x-terminal__pending'))
          .map(line => line.textContent.slice(0, 40));
      });
      assert.deepEqual(await hidden(), [], `${theme} ${width}px at load`);
      await page.evaluate(() => document.querySelector('.b10x-hero-art .b10x-terminal')?.scrollIntoView({block: 'center'}));
      await page.waitForTimeout(300);
      assert.deepEqual(await hidden(), [], `${theme} ${width}px after scrolling`);
      const contrast = await page.evaluate(() => {
        const luminance = color => {
          const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const c = value / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const body = document.querySelector('.b10x-hero-art .b10x-terminal__body');
        let surface = body; while (surface && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(surface).backgroundColor)) surface = surface.parentElement;
        const back = luminance(getComputedStyle(surface).backgroundColor);
        return Math.min(...[...body.querySelectorAll('.b10x-terminal__output > span')].map(line => {
          const fore = luminance(getComputedStyle(line).color);
          return (Math.max(fore, back) + 0.05) / (Math.min(fore, back) + 0.05);
        }));
      });
      assert.ok(contrast >= 4.5, `${theme} ${width}px output contrast ${contrast.toFixed(2)} is under 4.5`);
      assert.deepEqual(errors, []);
    } finally { await close(); }
  }
});

check(20, 'a hero action that opens a new tab says so in its accessible name', async () => {
  const {page, close} = await open('');
  try {
    const actions = await page.locator('.b10x-hero__actions a').evaluateAll(links => links.map(link => {
      const spoken = node => node.nodeType === Node.TEXT_NODE ? node.textContent : node.getAttribute?.('aria-hidden') === 'true' ? '' : [...node.childNodes].map(spoken).join('');
      return {href: link.getAttribute('href'), newTab: link.target === '_blank', name: spoken(link).replace(/\s+/g, ' ').trim()};
    }));
    assert.ok(actions.some(action => action.newTab), 'the example hero has an action that opens a new tab');
    for (const action of actions) {
      assert.equal(/\(opens in new tab\)/.test(action.name), action.newTab, `${action.href}: "${action.name}"`);
    }
  } finally { await close(); }
});

check(21, 'the home title names the product once', async () => {
  const {page, close} = await open('');
  try {
    const name = await page.locator('.navbar__title').first().innerText();
    const title = await page.title();
    assert.equal(title.split(name).length - 1, 1, `"${title}" names "${name}"`);
    assert.match(title, /What has been earned\./);
  } finally { await close(); }
});

check(22, 'a table stays inside the article column and scrolls in a labelled region with a cue', async () => {
  for (const width of widths) {
    const {page, close} = await open('docs/reference', {width});
    try {
      await page.waitForTimeout(200);
      const tables = await page.evaluate(() => {
        const column = document.querySelector('article .markdown').getBoundingClientRect();
        return [...document.querySelectorAll('article .markdown table')].filter(table => table.checkVisibility()).map(table => {
          let frame = table;
          while (frame.parentElement && !/auto|scroll/.test(getComputedStyle(frame).overflowX) && frame.parentElement.matches(':not(.markdown)')) frame = frame.parentElement;
          const box = frame.getBoundingClientRect();
          const overflowing = table.getBoundingClientRect().width > box.width + 1;
          const cue = frame.nextElementSibling?.matches('.b10x-table-guidance') && frame.nextElementSibling.offsetHeight > 0;
          const codes = [...table.querySelectorAll('td code')].map(code => getComputedStyle(code)).map(style => `${style.whiteSpace}/${style.wordBreak}/${style.overflowWrap}`);
          return {heading: table.rows[0].cells[0].textContent, right: Math.round(box.right), column: Math.round(column.right), overflowing, region: frame.getAttribute('role') === 'region' && frame.tabIndex === 0 && !!frame.getAttribute('aria-label'), cue, codes: [...new Set(codes)]};
        });
      });
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(pageOverflow <= 1, `${width}px: the page scrolls sideways by ${pageOverflow}px`);
      for (const table of tables) {
        assert.ok(table.right <= table.column + 1, `${width}px "${table.heading}" table ends at ${table.right}, the column at ${table.column}`);
        if (table.overflowing) assert.ok(table.region && table.cue, `${width}px "${table.heading}" overflows without a labelled region and a visible cue`);
        assert.deepEqual(table.codes.filter(code => !/^(normal|pre-wrap)\/normal\/normal$/.test(code)), [], `${width}px "${table.heading}" cell code must wrap at spaces only`);
      }
      if (width === 390) assert.ok(tables.some(table => table.overflowing), 'the example has a table wider than a phone column');
    } finally { await close(); }
  }
});

const failures = [];
try {
  for (const {issue, name, run} of checks) {
    try { await run(); console.log(`ok #${issue} ${name}`); }
    catch (error) { failures.push(issue); console.log(`FAIL #${issue} ${name}\n  ${String(error.message).split('\n').join('\n  ')}`); }
  }
} finally { await browser.close(); await server.close(); }
if (failures.length) { console.log(`product-site browser checks failed: #${failures.join(', #')}`); process.exit(1); }
console.log(`product-site browser checks: ${checks.length} passed`);
