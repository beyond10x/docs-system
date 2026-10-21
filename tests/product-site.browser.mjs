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

const failures = [];
try {
  for (const {issue, name, run} of checks) {
    try { await run(); console.log(`ok #${issue} ${name}`); }
    catch (error) { failures.push(issue); console.log(`FAIL #${issue} ${name}\n  ${String(error.message).split('\n').join('\n  ')}`); }
  }
} finally { await browser.close(); await server.close(); }
if (failures.length) { console.log(`product-site browser checks failed: #${failures.join(', #')}`); process.exit(1); }
console.log(`product-site browser checks: ${checks.length} passed`);
