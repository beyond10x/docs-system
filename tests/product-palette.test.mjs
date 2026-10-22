// The product signatures, checked the way they were chosen: as one categorical palette in family
// order (lightness band, chroma floor, adjacent separation under protan and deutan simulation and
// under normal vision, contrast on the canvas), and each ink as text on the surface it sits on.
// Thresholds and the Machado–Oliveira–Fernandes (2009) severity-1.0 transforms are the dataviz
// validator's; Delta E is Euclidean distance in OKLab ×100.
import assert from 'node:assert/strict';
import test from 'node:test';
import {FAMILY, FAMILY_ORDER} from '../dist/family.js';
import {isProductId, PRODUCT_SIGNATURES} from '../dist/product-palette.js';

const MODES = {
  light: {band: [0.43, 0.77], canvas: '#f6f8f5', surface: '#ffffff', ink: 6.5},
  dark: {band: [0.48, 0.67], canvas: '#101a1b', surface: '#172324', ink: 10.6},
};
const CHROMA_FLOOR = 0.10;
const CVD_TARGET = 8;
const NORMAL_FLOOR = 15;
const MARK_CONTRAST = 3;
const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
};

const linear = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
const luminance = (hex) => { const [r, g, b] = linear(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (one, two) => { const [high, low] = [luminance(one), luminance(two)].sort((a, b) => b - a); return (high + 0.05) / (low + 0.05); };
function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const simulate = (hex, kind) => { const rgb = linear(hex); return MACHADO[kind].map((row) => Math.max(0, Math.min(1, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]))); };
const deltaE = (one, two, kind) => { const [a, b] = [one, two].map((hex) => oklab(kind ? simulate(hex, kind) : linear(hex))); return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };

test('a2a is a product with its own mark, signature and family entry', () => {
  assert.ok(isProductId('a2a'));
  assert.deepEqual(PRODUCT_SIGNATURES.a2a, {name: 'a2a', mark: 'A2A', hue: {light: '#db6a98', dark: '#c664a8'}, ink: {light: '#8a3a64', dark: '#f7c8dd'}});
  assert.equal(FAMILY.a2a.url, 'https://beyond10x.github.io/a2a/');
  assert.equal(FAMILY.a2a.repository, 'https://github.com/beyond10x/a2a');
  assert.deepEqual(Object.keys(PRODUCT_SIGNATURES).sort(), [...FAMILY_ORDER].sort());
});

test('the signature hues pass the categorical checks in family order, and every ink clears its floor', (t) => {
  for (const [mode, {band, canvas, surface, ink}] of Object.entries(MODES)) {
    const hues = FAMILY_ORDER.map((id) => PRODUCT_SIGNATURES[id].hue[mode]);
    for (const [index, hue] of hues.entries()) {
      const [L, a, b] = oklab(linear(hue));
      const id = FAMILY_ORDER[index];
      assert.ok(L >= band[0] && L <= band[1], `${mode} ${id} ${hue}: OKLCH L ${L.toFixed(3)} outside ${band.join('–')}`);
      assert.ok(Math.hypot(a, b) >= CHROMA_FLOOR, `${mode} ${id} ${hue}: chroma ${Math.hypot(a, b).toFixed(3)} under ${CHROMA_FLOOR}`);
      assert.ok(contrast(hue, canvas) >= MARK_CONTRAST, `${mode} ${id} ${hue}: ${contrast(hue, canvas).toFixed(2)}:1 on ${canvas}`);
      const text = PRODUCT_SIGNATURES[id].ink[mode];
      const ratio = contrast(text, surface);
      t.diagnostic(`${mode} ${id} hue ${hue} ${contrast(hue, canvas).toFixed(2)}:1 on ${canvas}; ink ${text} ${ratio.toFixed(2)}:1 on ${surface}`);
      assert.ok(ratio >= ink, `${mode} ${id} ink ${text}: ${ratio.toFixed(2)}:1 on ${surface}, needs ${ink}:1`);
    }
    for (let index = 1; index < hues.length; index += 1) {
      const pair = `${FAMILY_ORDER[index - 1]}↔${FAMILY_ORDER[index]}`;
      const cvd = Math.min(deltaE(hues[index - 1], hues[index], 'protan'), deltaE(hues[index - 1], hues[index], 'deutan'));
      const normal = deltaE(hues[index - 1], hues[index]);
      t.diagnostic(`${mode} ${pair} ΔE ${cvd.toFixed(1)} (protan/deutan) ${normal.toFixed(1)} (normal)`);
      assert.ok(cvd >= CVD_TARGET, `${mode} ${pair}: CVD ΔE ${cvd.toFixed(1)} under ${CVD_TARGET}`);
      assert.ok(normal >= NORMAL_FLOOR, `${mode} ${pair}: normal ΔE ${normal.toFixed(1)} under ${NORMAL_FLOOR}`);
    }
  }
});
