// Regression assets for round R-02's style findings: each asserts the rule the finding asks for.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const css = await readFile(path.resolve(import.meta.dirname, '../styles/product-components.css'), 'utf8');
const rules = (selectorPattern) => [...css.matchAll(/(^|\})\s*([^{}@]+)\{([^{}]*)\}/g)].filter((match) => selectorPattern.test(match[2])).map((match) => match[3]);

test('UXF-013: a documentation card shows its whole title and description', () => {
  const bodies = rules(/\.card\b[^,{]*\.text--truncate/);
  assert.ok(bodies.length > 0, 'a rule for .card .text--truncate is required');
  assert.ok(bodies.some((body) => /white-space:\s*normal/.test(body)), 'card text wraps instead of truncating');
  assert.ok(bodies.some((body) => /text-overflow:\s*clip/.test(body) || /overflow:\s*visible/.test(body)), 'card text is not cut with an ellipsis');
});
