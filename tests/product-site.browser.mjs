// Rendered-page checks for the product-site template, built from examples/product-site.
// Each check names the docs-system issue it guards, or the site-review row when there is no issue.
// PRODUCT_SITE_CHECKS=19,22,s3-01 runs a subset.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {productSiteServer} from './product-site-server.mjs';

const server = await productSiteServer();
const browser = await chromium.launch({headless: true, ...(process.env.B10X_CHROME_BIN ? {executablePath: process.env.B10X_CHROME_BIN} : {}), args: ['--no-sandbox', '--disable-dev-shm-usage']})
  .catch(async error => { await server.close(); throw error; });
const only = process.env.PRODUCT_SITE_CHECKS?.split(',');
const widths = [1440, 1280, 996, 390];
const themes = ['light', 'dark'];
const checks = [];
const check = (issue, name, run) => { if (!only || only.includes(String(issue))) checks.push({issue, name, run}); };
const contrastOf = (fore, back) => {
  // getComputedStyle gives rgb() in 0-255, and color(srgb …) in 0-1 for a color-mix() result.
  const luminance = color => {
    const scale = color.startsWith('color(srgb') ? 1 : 255;
    const [r, g, b] = color.replace('color(srgb', '').match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const c = value / scale; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [luminance(fore), luminance(back)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
/** The RGB of one pixel row of the page at the given x offsets inside a box. */
async function pixels(page, box, y, xs) {
  const row = await page.screenshot({clip: {x: box.x, y, width: box.width, height: 1}});
  return page.evaluate(async ({data, xs}) => {
    const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = 1;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    return xs.map(x => Array.from(context.getImageData(Math.round(x * devicePixelRatio), 0, 1, 1).data.slice(0, 3)));
  }, {data: row.toString('base64'), xs});
}
const distance = (one, two) => Math.max(...one.map((value, index) => Math.abs(value - two[index])));

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
  const surfaces = [['docs/reference', '.theme-admonition table'], ['docs/charts', '.b10x-graph__table table'], ['session', '.b10x-chart__table table']];
  for (const [url, selector] of surfaces) for (const theme of themes) for (const width of [1280, 390]) {
    const {page, close} = await open(url, {width, theme});
    try {
      await page.evaluate(() => { for (const details of document.querySelectorAll('details.b10x-graph__table, details.b10x-chart__table')) details.open = true; });
      const table = page.locator(selector).first();
      await table.waitFor({state: 'visible'});
      await table.locator('th').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const box = await table.locator('xpath=..').boundingBox();
      const header = await table.locator('th').first().boundingBox();
      const row = await page.screenshot({clip: {x: box.x, y: header.y + 4, width: box.width, height: 1}}).catch(error => { throw new Error(`${url} ${theme} ${width}px ${JSON.stringify([box, header])}: ${error.message.split("\n")[0]}`); });
      const [edge, middle] = await page.evaluate(async data => {
        const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = 1;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        return [6 * devicePixelRatio, image.width * 0.6].map(x => Array.from(context.getImageData(Math.round(x), 0, 1, 1).data.slice(0, 3)));
      }, row.toString('base64'));
      const delta = Math.max(...edge.map((value, index) => Math.abs(value - middle[index])));
      assert.ok(delta <= 3, `${url} ${theme} ${width}px: "${selector}" paints its edge ${edge} against its row ${middle}`);
    } finally { await close(); }
  }
});

check(23, 'code-block copy and wrap buttons never cover code on a phone or a narrow window', async () => {
  for (const [width, touch] of [[390, true], [390, false], [996, false]]) {
    const {page, close} = await open('docs/code', {width, touch});
    try {
      await page.locator('.theme-code-block [class*="buttonGroup"] button').first().waitFor();
      const blocks = page.locator('.theme-code-block');
      assert.ok(await blocks.count() >= 2, 'the example has code blocks with and without a title');
      for (let index = 0; index < await blocks.count(); index++) {
        const block = blocks.nth(index);
        await block.scrollIntoViewIfNeeded();
        if (!touch) await block.hover();
        await block.evaluate(element => Promise.all([...element.querySelectorAll('[class*="buttonGroup"] button')].flatMap(button => button.getAnimations().map(animation => animation.finished))));
        const found = await block.evaluate(element => {
          const group = element.querySelector('[class*="buttonGroup"]');
          const code = element.querySelector('pre');
          if (!group || !code) return null;
          const buttons = group.getBoundingClientRect(); const lines = code.getBoundingClientRect(); const frame = element.getBoundingClientRect();
          const title = element.querySelector('[class*="codeBlockTitle"]');
          const text = title && document.createRange(); text?.selectNodeContents(title);
          const textRight = text ? Math.max(...[...text.getClientRects()].map(rect => rect.right)) : 0;
          return {title: title && [Math.round(textRight), title.scrollWidth - title.clientWidth], buttons: [Math.round(buttons.top), Math.round(buttons.bottom), Math.round(buttons.left), Math.round(buttons.right)], code: Math.round(lines.top), frame: [Math.round(frame.top), Math.round(frame.right)], opacity: Math.min(...[...group.querySelectorAll('button')].map(button => Number(getComputedStyle(button).opacity)))};
        });
        assert.ok(found, `${width}px block ${index} has its button group`);
        const where = `${width}px${touch ? ' touch' : ''} block ${index}`;
        assert.ok(found.buttons[1] <= found.code + 1, `${where}: buttons end at ${found.buttons[1]}, the code starts at ${found.code}`);
        assert.ok(found.buttons[0] >= found.frame[0] - 1 && found.buttons[3] <= found.frame[1] + 1, `${where}: buttons ${found.buttons} leave the block ${found.frame}`);
        assert.ok(found.opacity >= 0.8, `${where}: buttons are faint (${found.opacity})`);
        if (found.title) assert.ok(found.title[0] <= found.buttons[2] + 1 && found.title[1] <= 0, `${where}: the title text ends at ${found.title[0]} and overflows its bar by ${found.title[1]}px; the buttons start at ${found.buttons[2]}`);
      }
    } finally { await close(); }
  }
});

check(24, 'table-of-contents labels of long code headings stay in the rail and break only at their separators', async () => {
  for (const width of [1440, 1280, 997, 390]) {
    const {page, close} = await open('docs/code', {width});
    try {
      if (width < 997) {
        await page.locator('.theme-doc-toc-mobile button').click();
        await page.locator('.theme-doc-toc-mobile .table-of-contents__link code').first().waitFor();
        await page.waitForTimeout(400);
      }
      const labels = await page.evaluate(narrow => {
        const toc = document.querySelector(narrow ? '.theme-doc-toc-mobile' : '.theme-doc-toc-desktop');
        const rail = toc.getBoundingClientRect();
        return [...toc.querySelectorAll('.table-of-contents__link')].filter(link => link.querySelector('code')).map(link => {
          const breaks = [];
          let right = 0;
          const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
          let previous = null;
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            for (let index = 0; index < node.length; index++) {
              const range = document.createRange(); range.setStart(node, index); range.setEnd(node, index + 1);
              const box = range.getBoundingClientRect();
              if (!box.width) { if (previous && /\s/.test(node.data[index])) previous.character = ' '; continue; }
              right = Math.max(right, box.right);
              const character = node.data[index];
              const whole = Boolean(node.parentElement.closest('.b10x-toc-word'));
              const separator = /[\s/_:-]/.test(previous?.character) || /[\s.]/.test(character) || (/[a-z\d]/.test(previous?.character) && /[A-Z]/.test(character));
              if (previous && box.top > previous.top + 2 && (whole || previous.whole) && !separator) breaks.push(`${previous.character}|${character}`);
              previous = {top: box.top, character, whole};
            }
          }
          return {text: link.textContent.slice(0, 48), right: Math.round(right), rail: Math.round(rail.right), breaks};
        });
      }, width < 997);
      assert.ok(labels.length >= 2, `${width}px: the example has code headings in the table of contents`);
      for (const label of labels) {
        assert.ok(label.right <= label.rail + 1, `${width}px "${label.text}" ends at ${label.right}, the rail at ${label.rail}`);
        assert.deepEqual(label.breaks, [], `${width}px "${label.text}" breaks inside a word`);
      }
    } finally { await close(); }
  }
});

check(25, 'every page has a share image, and the home description fits a search result', async () => {
  for (const url of ['', 'docs/code']) {
    const {page, close} = await open(url);
    try {
      // Crawlers and link unfurlers read the served HTML; during hydration the head briefly drops the page's own tags.
      const html = await (await page.request.get(page.url())).text();
      const meta = await page.evaluate(source => {
        const served = new DOMParser().parseFromString(source, 'text/html');
        return Object.fromEntries(['name="description"', 'property="og:description"', 'property="og:image"', 'name="twitter:image"', 'name="twitter:card"'].map(key => [key, served.querySelector(`meta[${key}]`)?.content ?? null]));
      }, html);
      assert.equal(meta['name="twitter:card"'], 'summary_large_image');
      assert.match(meta['property="og:image"'] ?? '', /^https?:\/\/.+\.png$/, `/${url} og:image`);
      assert.equal(meta['name="twitter:image"'], meta['property="og:image"'], `/${url} twitter:image`);
      const image = await page.request.get(new URL(new URL(meta['property="og:image"']).pathname, server.url).href);
      assert.equal(image.status(), 200, `/${url} ${meta['property="og:image"']}`);
      const png = await image.body();
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], 'the card is 1200 × 630');
      if (url === '') {
        const description = meta['name="description"'] ?? '';
        assert.ok(description.length >= 50 && description.length <= 160, `the home description is ${description.length} characters: "${description}"`);
        assert.match(description, /[.!?…]$/, 'the home description ends a sentence or says it was cut');
        assert.equal(meta['property="og:description"'], description);
      }
    } finally { await close(); }
  }
});

check(26, 'the not-found page links back to the docs and the home page', async () => {
  for (const width of [1440, 390]) {
    const {page, errors, close} = await open('docs/does-not-exist', {width});
    try {
      await page.waitForFunction(() => document.querySelector('main h1'));
      const content = await page.evaluate(() => {
        const main = document.querySelector('main');
        return {
          text: main.innerText,
          links: [...main.querySelectorAll('a[href]')].filter(link => link.getClientRects().length).map(link => ({name: link.innerText.trim(), href: new URL(link.getAttribute('href'), location.href).pathname})),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      assert.doesNotMatch(content.text, /contact the owner of the site/, `${width}px still shows the stock copy`);
      const docs = content.links.find(link => /^\/product-site\/docs(\/|$)/.test(link.href));
      assert.ok(docs, `${width}px no link into the docs: ${JSON.stringify(content.links)}`);
      assert.equal((await page.request.get(new URL(docs.href, server.url).href)).status(), 200, `${width}px ${docs.href}`);
      assert.ok(content.links.some(link => link.href === '/product-site/'), `${width}px no link to the home page: ${JSON.stringify(content.links)}`);
      assert.ok(content.overflow <= 0, `${width}px the page scrolls sideways by ${content.overflow}px`);
      assert.deepEqual(errors, []);
    } finally { await close(); }
  }
});

check(27, 'a chart or graph text table wider than a phone is a named region with guidance', async () => {
  let overflowing = 0;
  for (const url of ['docs/charts', 'docs/status', 'session']) {
    const {page, errors, close} = await open(url, {width: 390});
    try {
      await page.evaluate(() => { for (const details of document.querySelectorAll('.b10x-graph__table, .b10x-chart__table')) details.open = true; });
      await page.waitForTimeout(300);
      const frames = await page.evaluate(() => [...document.querySelectorAll('.b10x-graph__table .b10x-table-wrap, .b10x-chart__table .b10x-table-wrap, .b10x-status-table .b10x-table-wrap')]
        .filter(frame => frame.scrollWidth > frame.clientWidth + 1)
        .map(frame => {
          const guidance = document.getElementById(frame.getAttribute('aria-describedby') ?? '');
          return {
            head: frame.querySelector('caption, th')?.textContent.trim(),
            role: frame.getAttribute('role'), label: frame.getAttribute('aria-label'), tabIndex: frame.tabIndex,
            guidance: guidance && !guidance.hidden && guidance.getClientRects().length ? guidance.textContent.trim() : null,
          };
        }));
      overflowing += frames.length;
      for (const frame of frames) {
        assert.equal(frame.role, 'region', `/${url} "${frame.head}" is not a region`);
        assert.ok(frame.label && frame.label !== 'Table', `/${url} "${frame.head}" is named "${frame.label}"`);
        assert.equal(frame.tabIndex, 0, `/${url} "${frame.head}" cannot be focused`);
        assert.ok(frame.guidance, `/${url} "${frame.head}" has no visible guidance`);
      }
      assert.deepEqual(errors, []);
    } finally { await close(); }
  }
  assert.ok(overflowing > 0, 'no text table overflows at 390 px, so the check proves nothing');
});

check(28, 'a protocol graph with an input predicate renders in the browser as it was prerendered', async () => {
  const {page, errors, close} = await open('docs/reference');
  try {
    const logged = []; page.on('console', message => { if (message.type() === 'error') logged.push(message.text()); });
    await page.reload({waitUntil: 'load'});
    await page.waitForTimeout(500);
    const failed = await page.locator('.b10x-graph-error').allTextContents();
    assert.deepEqual(failed, [], 'every graph on the page renders after hydration');
    assert.deepEqual(errors, []);
    assert.deepEqual(logged, []);
  } finally { await close(); }
});

check('s3-01', 'a link in an admonition takes the link colour and clears 4.5:1 on the admonition ground', async () => {
  for (const theme of themes) {
    const {page, close} = await open('docs/reference', {theme});
    try {
      const found = await page.evaluate(() => {
        const link = document.querySelector('.theme-admonition p a[href]');
        if (!link) return null;
        const plain = document.querySelector('article .markdown').appendChild(document.createElement('a'));
        plain.href = '#'; const linkColour = getComputedStyle(plain).color; plain.remove();
        const box = link.closest('.theme-admonition');
        return {colour: getComputedStyle(link).color, text: getComputedStyle(box).color, ground: getComputedStyle(box).backgroundColor, linkColour};
      });
      assert.ok(found, 'the example has a link in an admonition paragraph');
      assert.equal(found.colour, found.linkColour, `${theme}: the admonition link is ${found.colour}, a page link ${found.linkColour}, the admonition text ${found.text}`);
      const contrast = contrastOf(found.colour, found.ground);
      assert.ok(contrast >= 4.5, `${theme}: the admonition link clears ${contrast.toFixed(2)}:1 on ${found.ground}`);
    } finally { await close(); }
  }
});

check('s2-06', 'status badges render at 12 px or larger', async () => {
  for (const width of [1440, 390]) {
    const {page, close} = await open('', {width});
    try {
      const sizes = await page.evaluate(() => [...document.querySelectorAll('.b10x-status--shipped, .b10x-status--decided, .b10x-status--planned')]
        .filter(badge => badge.checkVisibility()).map(badge => `${badge.className} ${parseFloat(getComputedStyle(badge).fontSize)}`));
      assert.ok(sizes.length > 0, `${width}px: the example home has status badges`);
      assert.deepEqual(sizes.filter(size => Number(size.split(' ').at(-1)) < 12), [], `${width}px badges under 12 px`);
    } finally { await close(); }
  }
});

check('s2-07', 'code in a table header cell keeps its case and renders at 12 px or larger', async () => {
  for (const width of [1440, 390]) {
    const {page, close} = await open('docs/reference', {width});
    try {
      const codes = await page.evaluate(() => [...document.querySelectorAll('article .markdown table th code')]
        .map(code => ({text: code.textContent, size: parseFloat(getComputedStyle(code).fontSize), transform: getComputedStyle(code).textTransform})));
      assert.ok(codes.length > 0, `${width}px: the example has code in a table header`);
      for (const code of codes) {
        assert.ok(code.size >= 12, `${width}px "${code.text}" in a header renders at ${code.size}px`);
        assert.equal(code.transform, 'none', `${width}px "${code.text}" in a header is transformed`);
      }
    } finally { await close(); }
  }
});

check('s2-01', 'a hero graph fits its card at every width: nothing is cut at the right edge and nothing scrolls', async () => {
  for (const width of [1440, 996, 390]) {
    const {page, errors, close} = await open('heroes', {width});
    try {
      const heroes = await page.evaluate(() => [...document.querySelectorAll('.b10x-graph--hero')].map(figure => {
        const viewport = figure.querySelector('.b10x-graph__viewport');
        const svg = figure.querySelector('.b10x-graph__svg').getBoundingClientRect();
        const frame = viewport.getBoundingClientRect();
        const aside = figure.closest('.b10x-hero-art').getBoundingClientRect();
        return {kind: figure.classList.contains('b10x-domain-graph') ? 'domain' : 'protocol', overflow: viewport.scrollWidth - viewport.clientWidth, svgRight: Math.round(svg.right), frameRight: Math.round(frame.right), figureRight: Math.round(figure.getBoundingClientRect().right), asideRight: Math.round(aside.right), page: document.documentElement.clientWidth};
      }));
      assert.deepEqual(heroes.map(hero => hero.kind).sort(), ['domain', 'protocol'], `${width}px: the showcase has a domain and a protocol hero graph`);
      for (const hero of heroes) {
        assert.ok(hero.overflow <= 1, `${width}px ${hero.kind} hero scrolls by ${hero.overflow}px`);
        assert.ok(hero.svgRight <= hero.frameRight + 1 && hero.frameRight <= hero.figureRight + 1 && hero.figureRight <= hero.asideRight + 1 && hero.asideRight <= hero.page, `${width}px ${hero.kind} hero: the graph ends at ${hero.svgRight}, its frame at ${hero.frameRight}, the card at ${hero.figureRight}, the aside at ${hero.asideRight}, the page at ${hero.page}`);
      }
      assert.deepEqual(errors, []);
    } finally { await close(); }
  }
});

check('s4-01', 'a code line wider than the block wraps inside it with a hanging indent, so no edge or fade hides any of it', async () => {
  // Replaces s1-05 (0.11.1), which marked a scrolled-off line with an edge shadow the review found too faint to notice.
  for (const width of [1440, 390]) for (const theme of themes) {
    const {page, close} = await open('docs/code', {width, theme});
    try {
      await page.locator('.theme-code-block [class*="buttonGroup"] button').first().waitFor();
      const blocks = await page.evaluate(() => [...document.querySelectorAll('.theme-code-block pre')].map((pre, index) => {
        const rows = [...pre.querySelectorAll('.token-line')].filter(line => line.textContent.trim() && !line.matches('.theme-code-block-highlighted-line')).map(line => {
          const range = document.createRange(); range.selectNodeContents(line);
          const rects = [...range.getClientRects()].filter(rect => rect.width > 0);
          const first = rects[0];
          const later = rects.filter(rect => rect.top > first.top + first.height / 2);
          return {text: line.textContent.slice(0, 30), indented: /^\s/.test(line.textContent), first: first.left, next: later.length ? Math.min(...later.map(rect => rect.left)) : null};
        });
        return {index, overflow: pre.scrollWidth - pre.clientWidth, wrapped: rows.filter(row => row.next !== null)};
      }));
      const where = `${width}px ${theme}`;
      for (const block of blocks) assert.ok(block.overflow <= 1, `${where}: block ${block.index} scrolls by ${block.overflow}px`);
      const wrapped = blocks.flatMap(block => block.wrapped);
      assert.ok(wrapped.length > 0, `${where}: the example has a line wider than its block`);
      for (const row of wrapped.filter(row => !row.indented)) assert.ok(row.next - row.first >= 8, `${where}: "${row.text}" continues ${Math.round(row.next - row.first)}px in from its first row`);
      const yaml = page.locator('.theme-code-block pre').first();
      await yaml.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const box = await yaml.boundingBox();
      const y = await yaml.evaluate(element => {
        const middle = element.getBoundingClientRect().top + element.clientHeight / 2;
        const lines = [...element.querySelectorAll('.token-line')].filter(line => !line.textContent.trim() && !line.matches('.theme-code-block-highlighted-line')).map(line => line.getBoundingClientRect());
        return lines.map(line => line.top + line.height / 2).sort((one, two) => Math.abs(one - middle) - Math.abs(two - middle))[0];
      });
      const [left, middle, right] = await pixels(page, box, Math.round(y), [2, box.width * 0.6, box.width - 3]);
      assert.ok(distance(left, middle) <= 3 && distance(right, middle) <= 3, `${where}: a block that fits paints its edges ${distance(left, middle)}/${distance(right, middle)} away from its ground`);
    } finally { await close(); }
  }
});

check('s5-03', 'a console block is highlighted as a shell with a prompt that is neither selected nor copied', async () => {
  for (const width of [1440, 390]) {
    const {page, errors, close} = await open('docs/code', {width});
    try {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {origin: new URL(server.url).origin});
      const blocks = page.locator('.theme-code-block.language-console');
      // Colours are read after hydration has applied the reader's theme, and after its transition.
      await blocks.first().locator('[class*="buttonGroup"] button').first().waitFor({state: 'attached'});
      await page.waitForFunction(() => {
        const pre = document.querySelector('.theme-code-block.language-console pre');
        return [...pre.querySelectorAll('.token.function')].some(token => getComputedStyle(token).color !== getComputedStyle(pre).color);
      }, null, {timeout: 5000}).catch(() => {});
      await page.waitForTimeout(300);
      assert.equal(await blocks.count(), 2, `${width}px: the example has a command block and a transcript`);
      const facts = await blocks.evaluateAll(elements => elements.map(element => {
        const pre = element.querySelector('pre');
        const plain = getComputedStyle(pre).color;
        const prompts = [...element.querySelectorAll('.token.console-prompt, .token.shell-symbol')];
        const selection = getSelection(); selection.removeAllRanges(); const range = document.createRange(); range.selectNodeContents(pre); selection.addRange(range);
        const selected = selection.toString(); selection.removeAllRanges();
        return {
          label: getComputedStyle(element, '::before').content,
          prompts: prompts.map(prompt => ({text: prompt.textContent, select: getComputedStyle(prompt).userSelect, visible: prompt.getBoundingClientRect().width > 0})),
          colours: new Set([...pre.querySelectorAll('.token')].filter(token => token.textContent.trim()).map(token => getComputedStyle(token).color).filter(colour => colour !== plain)).size,
          selected,
        };
      }));
      const [commands, transcript] = facts;
      assert.ok(commands.colours >= 3, `${width}px: the command block shows ${commands.colours} token colours besides plain text`);
      assert.ok(transcript.colours >= 1, `${width}px: the transcript shows ${transcript.colours} token colours besides plain text`);
      for (const block of facts) {
        assert.equal(block.label, '"Terminal"', `${width}px: a console block is labelled ${block.label}`);
        assert.ok(block.prompts.length >= 1 && block.prompts.every(prompt => prompt.visible && prompt.select === 'none'), `${width}px: prompts ${JSON.stringify(block.prompts)}`);
      }
      assert.deepEqual(commands.prompts.map(prompt => prompt.text), ['$ ', '$ '], `${width}px: each command, not the comment or the continuation, gets a drawn prompt`);
      assert.doesNotMatch(commands.selected, /\$/, `${width}px: selecting the command block selects no prompt`);
      assert.equal(transcript.prompts.length, 1, `${width}px: the transcript keeps its own prompt`);
      const copy = blocks.first().locator('button[aria-label*="Copy" i]');
      await blocks.first().hover();
      await copy.click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(copied, 'cargo install --locked --path crates/canon-cli\n# check one protocol\ncanon validate --path fixtures/investigation/protocol.yaml \\\n  --format json', `${width}px: the copy button copies the commands without a prompt`);
      assert.deepEqual(errors, []);
    } finally { await close(); }
  }
});

check('ess-viewer-width', 'a contract explorer page gets the full doc row and the viewer stacks on its own width', async () => {
  // Reading-pane text width on 0.11.0: 453/333/141 px. The pane must keep at least 600 px at each width.
  for (const width of [1440, 1280, 1024]) {
    const {page, errors, close} = await open('docs/contracts', {width});
    try {
      await page.waitForSelector('.b10x-contract-page h3');
      const layout = await page.evaluate(() => {
        const column = document.querySelector('.b10x-doc-item--no-toc > .row > .col');
        const pane = document.querySelector('.b10x-contract-page'); const style = getComputedStyle(pane);
        const sidebar = getComputedStyle(document.querySelector('.b10x-contract-sidebar'));
        const title = getComputedStyle(document.querySelector('.b10x-contract-header h2'));
        return {
          column: column && column.getBoundingClientRect().width, row: column && column.parentElement.getBoundingClientRect().width,
          toc: !!document.querySelector('.theme-doc-toc-desktop'),
          text: pane.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), wrap: style.overflowWrap,
          sticky: sidebar.position, titleBorder: title.borderTopWidth, titlePadding: title.paddingTop,
        };
      });
      assert.equal(layout.toc, false, `${width}px: the example page renders no table of contents`);
      assert.ok(layout.column && Math.abs(layout.column - layout.row) <= 1, `${width}px: the doc column is ${layout.column}px of a ${layout.row}px row`);
      assert.ok(layout.text >= 600, `${width}px: the reading pane has ${layout.text}px for text`);
      assert.equal(layout.wrap, 'break-word', `${width}px: the pane breaks words with ${layout.wrap}`);
      assert.equal(layout.sticky, width > 1024 ? 'sticky' : 'static', `${width}px: the contract list is ${layout.sticky}`);
      assert.deepEqual([layout.titleBorder, layout.titlePadding], ['0px', '0px'], `${width}px: the viewer title carries the doc h2 rule`);
      assert.deepEqual(errors, []);
    } finally { await close(); }
  }
  for (const [url, toc] of [['docs/reference', true], ['docs/charts', false]]) {
    const {page, close} = await open(url);
    try {
      assert.equal(await page.locator('.theme-doc-toc-desktop').count() > 0, toc, `${url}: table of contents`);
      assert.equal(await page.locator('.b10x-doc-item--no-toc').count(), 0, `${url}: a page with headings or hide_table_of_contents keeps the theme's layout`);
    } finally { await close(); }
  }
  // At 1024 px the viewport is wider than the old 800 px breakpoint and the viewer narrower than 44rem.
  for (const [width, stacked] of [[1440, false], [1024, true]]) {
    const {page, close} = await open('docs/contracts', {width});
    try {
      await page.waitForSelector('.b10x-contract-page h3');
      const [viewer, pane] = await page.evaluate(() => ['.b10x-contract-viewer', '.b10x-contract-page'].map(selector => document.querySelector(selector).clientWidth));
      assert.equal(viewer < 704, stacked, `${width}px: viewer ${viewer}px`);
      assert.equal(Math.abs(viewer - pane) <= 1, stacked, `${width}px: a ${viewer}px viewer with a ${pane}px pane`);
    } finally { await close(); }
  }
});

check('favicon', 'the site names a generated SVG favicon that is served, and nothing asks for a missing icon', async () => {
  const {page, close} = await open('');
  try {
    const missing = []; page.on('response', response => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
    await page.reload({waitUntil: 'load'});
    const href = await page.locator('link[rel="icon"]').first().getAttribute('href');
    assert.equal(href, '/product-site/b10x-favicon.svg');
    const icon = await page.request.get(new URL(href, server.url).href);
    assert.equal(icon.status(), 200);
    assert.equal(icon.headers()['content-type'], 'image/svg+xml');
    assert.match(await icon.text(), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[\s\S]*>C<\/text><\/svg>/);
    assert.deepEqual(missing, []);
  } finally { await close(); }
});

check('nojekyll', 'the build output carries .nojekyll', async () => {
  assert.equal(await readFile(path.join(server.output, '.nojekyll'), 'utf8'), '');
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
