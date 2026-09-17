import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {viewerServer} from './ess-viewer-server.mjs';
const server = process.env.ESS_VIEWER_PREVIEW_URL ? undefined : await viewerServer();
const base = process.env.ESS_VIEWER_PREVIEW_URL ?? server.url;
const browser = await chromium.launch({headless: true, ...(process.env.B10X_CHROME_BIN ? {executablePath: process.env.B10X_CHROME_BIN} : {}), args: ['--no-sandbox', '--disable-dev-shm-usage']})
  .catch(async error => { await server?.close(); throw error; });
const page = await browser.newPage({viewport: {width: 1440, height: 1050}});
const errors = []; page.on('pageerror', error => errors.push(String(error)));
try {
  await page.goto(`${base}/contracts/`, {waitUntil: 'domcontentloaded'});
  await page.waitForSelector('.b10x-contract-viewer');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.getByRole('navigation', {name: 'Contract pages', exact: true}).getByRole('link').count(), 16);
  await page.getByRole('searchbox', {name: 'Find a contract'}).fill('Principal');
  await page.getByRole('navigation', {name: 'Contract search results'}).waitFor();
  assert.ok(await page.getByRole('navigation', {name: 'Contract search results'}).getByRole('link').count() > 0);
  await page.getByRole('navigation', {name: 'Contract search results'}).getByRole('link', {name: /^Principal domains\/mandate-identity$/}).click();
  await page.waitForURL(/mandate-identity/);
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Principal');
  assert.match(await page.locator('.b10x-contract-page').innerText(), /Lifecycle/);
  assert.ok(await page.locator('.b10x-contract-page svg').count() > 0, 'lifecycle diagrams render');
  assert.equal(await page.locator('.b10x-contract-page svg foreignObject, .b10x-contract-page svg script, .b10x-contract-page svg image').count(), 0, 'diagrams contain only passive SVG');
  assert.deepEqual(await page.locator('.b10x-contract-page svg').evaluateAll(elements => elements.flatMap(svg => [...svg.querySelectorAll('*')].flatMap(element => [...element.attributes].filter(attribute => /^on/i.test(attribute.name) || (/^(?:xlink:)?href$/i.test(attribute.name) && !attribute.value.startsWith('#'))).map(attribute => attribute.name)))), []);
  const link = page.url(); await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => document.querySelector('.b10x-contract-page h3')?.textContent === 'identity');
  assert.equal(page.url(), link);
  await page.getByRole('navigation', {name: 'Contract pages', exact: true}).getByRole('link', {name: /^credential domain$/}).click();
  await page.waitForFunction(() => document.querySelector('.b10x-contract-page h3')?.textContent === 'credential');
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('.b10x-contract-page h3')?.textContent === 'identity');
  await page.getByRole('searchbox', {name: 'Find a contract'}).fill('unfindable-contract-928482');
  await page.getByText('0 matching sections', {exact: true}).waitFor();
  await page.getByRole('searchbox', {name: 'Find a contract'}).fill('');
  await page.setViewportSize({width: 390, height: 844});
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile page has no horizontal overflow');
  await page.getByRole('searchbox', {name: 'Find a contract'}).focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'A');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  assert.notEqual(await page.locator('.b10x-contract-viewer').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
  assert.deepEqual(errors, []);
  if (server) {
    await page.goto(`${base}/connectors/`);
    assert.equal(await page.getByRole('navigation', {name: 'Contract pages', exact: true}).getByRole('link').count(), 26);
    await page.getByRole('searchbox', {name: 'Find a contract'}).fill('command');
    assert.ok(await page.getByRole('navigation', {name: 'Contract search results'}).getByRole('link').count() > 0);
  }
  console.log('ESS viewer browser checks: navigation, search, no results, deep link, history, focus, diagrams, mobile and dark theme passed');
} finally { await browser.close(); await server?.close(); }
