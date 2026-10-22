// Files every product site needs at its root and that no site should have to remember: a favicon
// and `.nojekyll`.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import productSitePlugin, {PRODUCT_FAVICON, PRODUCT_FAVICON_ROOT, productFaviconSvg, withProductSite} from '../dist/product-site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'examples/product-site');

async function servedFavicon(config) {
  const directory = config.staticDirectories.find((entry) => entry.startsWith(`${PRODUCT_FAVICON_ROOT}${path.sep}`));
  assert.ok(directory, 'a generated favicon directory is served');
  return fs.readFile(path.join(directory, config.favicon), 'utf8');
}

test('without a favicon, the site serves a generated SVG of the mark on the product hue', async () => {
  const config = withProductSite({title: 'a2a'}, {product: 'a2a'});
  assert.equal(config.favicon, PRODUCT_FAVICON);
  const svg = await servedFavicon(config);
  assert.equal(svg, productFaviconSvg('A2A', 'a2a'));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
  assert.match(svg, /fill="#8a3a64" stroke="#db6a98"/);
  assert.match(svg, />A2A<\/text>/);
  assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+=|href=|url\(/i, 'no script, handler, foreign object or external resource');
  assert.ok(config.staticDirectories.includes('static'), 'the site keeps its own static directory');
});

test('a site without a product gets its mark on the family green; the mark option and title feed it', async () => {
  const titled = withProductSite({title: 'Mantle'});
  assert.match(await servedFavicon(titled), /fill="#17684a" stroke="#26996e"[\s\S]*>M<\/text>/);
  const marked = withProductSite({title: 'a2a'}, {mark: 'A2A'});
  assert.match(await servedFavicon(marked), /fill="#17684a"[\s\S]*font-size="22"[\s\S]*>A2A<\/text>/);
  assert.match(productFaviconSvg('a<b'), />a&lt;b<\/text>/);
});

test('the favicon option and a config favicon are used as given, and the config one wins', () => {
  const own = withProductSite({title: 'X'}, {favicon: 'img/icon.svg'});
  assert.equal(own.favicon, 'img/icon.svg');
  assert.ok(!own.staticDirectories.some((entry) => entry.startsWith(PRODUCT_FAVICON_ROOT)), 'nothing generated');
  const configured = withProductSite({title: 'X', favicon: 'img/site.ico'}, {favicon: 'img/icon.svg'});
  assert.equal(configured.favicon, 'img/site.ico');
  assert.equal(withProductSite({title: 'X', favicon: 'img/site.ico', themeConfig: {image: 'card.png'}}, {fonts: false}).staticDirectories, undefined);
  assert.throws(() => withProductSite({title: 'X'}, {favicon: ''}), /favicon must be a non-empty path/);
});

test('the build output always carries .nojekyll, and an existing one is kept', async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-nojekyll-'));
  try {
    await fs.writeFile(path.join(out, 'index.html'), '<main></main>');
    const plugin = productSitePlugin({siteDir: example, baseUrl: '/'}, {});
    await plugin.postBuild({outDir: out});
    assert.equal(await fs.readFile(path.join(out, '.nojekyll'), 'utf8'), '');
    await fs.writeFile(path.join(out, '.nojekyll'), 'kept');
    await plugin.postBuild({outDir: out});
    assert.equal(await fs.readFile(path.join(out, '.nojekyll'), 'utf8'), 'kept');
  } finally {
    await fs.rm(out, {recursive: true, force: true});
  }
});
