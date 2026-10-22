// Rendered-page checks for the product-site template, built from examples/product-site.
// Each check names the docs-system issue it guards, or the site-review row when there is no issue.
// PRODUCT_SITE_CHECKS=19,22,s3-01 runs a subset.
import assert from 'node:assert/strict';
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
    const logged = []; page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) logged.push(message.text()); });
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

check('s1-05', 'a code block with a line wider than the block marks the hidden side with an edge shadow', async () => {
  for (const theme of themes) {
    const {page, close} = await open('docs/code', {theme});
    try {
      await page.locator('.theme-code-block [class*="buttonGroup"] button').first().waitFor();
      // Sampled on a blank, unhighlighted line near the middle, where the shadow is deepest and no glyph sits.
      const blocks = await page.evaluate(() => [...document.querySelectorAll('.theme-code-block pre')].map((pre, index) => ({
        index, wide: pre.scrollWidth > pre.clientWidth + 1,
        blank: [...pre.querySelectorAll('.token-line')].some(line => !line.textContent.trim() && !line.matches('.theme-code-block-highlighted-line')),
      })));
      const wide = blocks.find(block => block.wide && block.blank); const fits = blocks.find(block => !block.wide && block.blank);
      assert.ok(wide && fits, `${theme}: the example has a code block wider than the column and one that fits, each with a blank line`);
      const edges = async index => {
        const pre = page.locator('.theme-code-block pre').nth(index);
        await pre.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const box = await pre.boundingBox();
        const y = await pre.evaluate(element => {
          const middle = element.getBoundingClientRect().top + element.clientHeight / 2;
          const lines = [...element.querySelectorAll('.token-line')].filter(line => !line.textContent.trim() && !line.matches('.theme-code-block-highlighted-line')).map(line => line.getBoundingClientRect());
          return lines.map(line => line.top + line.height / 2).sort((one, two) => Math.abs(one - middle) - Math.abs(two - middle))[0];
        });
        const [left, middle, right] = await pixels(page, box, Math.round(y), [2, box.width * 0.6, box.width - 3]);
        return {left: distance(left, middle), right: distance(right, middle), at: `${Math.round(box.x)},${Math.round(y)} ${JSON.stringify([left, middle, right])}`};
      };
      const start = await edges(wide.index);
      assert.ok(start.right > 12 && start.left <= 3, `${theme}: at the start the right edge differs from the ground by ${start.right}, the left by ${start.left} (${start.at})`);
      await page.locator('.theme-code-block pre').nth(wide.index).evaluate(pre => { pre.scrollLeft = pre.scrollWidth; });
      await page.waitForTimeout(300);
      const end = await edges(wide.index);
      assert.ok(end.left > 12 && end.right <= 3, `${theme}: at the end the left edge differs from the ground by ${end.left}, the right by ${end.right} (${end.at})`);
      const still = await edges(fits.index);
      assert.ok(still.left <= 3 && still.right <= 3, `${theme}: a block that fits paints its edges ${still.left}/${still.right} away from its ground`);
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
