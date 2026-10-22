import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import test from 'node:test';
import {Highlight, Prism} from 'prism-react-renderer';
import {createElement, Fragment} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CONSOLE_PROMPT_TOKEN, consoleCommands, consoleHasPrompts, registerConsoleLanguage} from '../dist/console-language.js';
import {productPrismDarkTheme, productPrismTheme} from '../dist/prism-themes.js';

// The same order the product site uses: the classic theme loads Bash and shell-session onto
// prism-react-renderer's instance, then the docs-system loader registers `console`.
const require = createRequire(import.meta.url);
globalThis.Prism = Prism;
require('prismjs/components/prism-bash');
require('prismjs/components/prism-shell-session');
delete globalThis.Prism;
registerConsoleLanguage(Prism);
registerConsoleLanguage(Prism);

/** Renders a fence the way Docusaurus's CodeBlock does: one element per line, one span per token. */
function render(code) {
  return renderToStaticMarkup(createElement(Highlight, {prism: Prism, code, language: 'console', theme: {plain: {}, styles: []}},
    ({tokens, getLineProps, getTokenProps}) => createElement(Fragment, null, tokens.map((line, index) => createElement('div', {key: index, ...getLineProps({line})},
      line.map((token, key) => createElement('span', {key, ...getTokenProps({token})})))))));
}

test('s5-03: a console block of bare commands is highlighted as Bash with a drawn prompt before each command', () => {
  const code = 'cargo install --locked --path crates/canon-cli\n# check one protocol\ncanon validate --path protocol.yaml \\\n  --format json\n\nls | wc -l';
  const markup = render(code);
  const prompts = markup.match(new RegExp(`class="token ${CONSOLE_PROMPT_TOKEN}">\\$ </span>`, 'g')) ?? [];
  assert.equal(prompts.length, 3, 'one prompt per command; none on the comment, the continuation or the blank line');
  assert.match(markup, /class="token comment">#\s*check one protocol<\/span>/, 'the comment is a Bash comment');
  assert.match(markup, /class="token parameter variable">--locked<\/span>/, 'flags are Bash tokens');
  assert.match(markup, /<div class="token-line"><span class="token plain">  <\/span><span class="token parameter variable">--format<\/span>/, 'the continuation line carries no prompt');
  const text = markup.replace(/<span class="token console-prompt">\$ <\/span>/g, '').replace(/<\/div>/g, '\n').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').trimEnd();
  assert.equal(text, code, 'apart from the prompts, the rendered text is the source the copy button copies');
});

test('s5-03: a console transcript that writes its own prompts keeps them as shell-session tokens', () => {
  const markup = render('$ canon validate --path protocol.yaml\nok: protocol investigation revision 1\nuser@host:~/canon$ ls');
  assert.doesNotMatch(markup, new RegExp(CONSOLE_PROMPT_TOKEN), 'no prompt is drawn on a block that writes its own');
  assert.equal((markup.match(/class="token command shell-symbol important">\$<\/span>/g) ?? []).length, 2);
  assert.match(markup, /class="token output">ok: protocol investigation revision 1<\/span>/);
});

test('s5-03: prompts, continuations and comments are told apart without a Prism instance', () => {
  assert.equal(consoleHasPrompts('cargo test'), false);
  assert.equal(consoleHasPrompts('# $ is not a prompt here'), false);
  assert.equal(consoleHasPrompts('$ cargo test\nok'), true);
  assert.equal(consoleHasPrompts('  user@host:~/x$ ls'), true);
  assert.deepEqual(consoleCommands('a &&\n  b\n\n# c\nd |\n  e'), [
    {prompt: true, text: 'a &&\n  b'},
    {prompt: false, text: ''},
    {prompt: false, text: '# c'},
    {prompt: true, text: 'd |\n  e'},
  ]);
});

test('s5-03: the product theme loads the console language and its prompt is not selectable', async () => {
  const loader = await readFile(new URL('../src/theme/prism-include-languages.ts', import.meta.url), 'utf8');
  assert.match(loader, /from '@theme-init\/prism-include-languages'/);
  assert.match(loader, /registerConsoleLanguage\(prism\)/);
  const css = await readFile(new URL('../styles/tokens.css', import.meta.url), 'utf8');
  assert.match(css, /\.theme-code-block \.token\.console-prompt,\n\.theme-code-block\.language-console \.token\.shell-symbol \{ -webkit-user-select: none; user-select: none; \}/);
  assert.match(css, /\.theme-code-block\.language-console \{ --b10x-code-label: 'Terminal'; \}/);
  for (const theme of [productPrismTheme, productPrismDarkTheme]) {
    const entry = theme.styles.find(style => style.types.includes(CONSOLE_PROMPT_TOKEN) && !style.languages);
    const punctuation = theme.styles.find(style => style.types.includes('punctuation') && !style.languages);
    assert.equal(entry?.style.color, punctuation.style.color, 'the drawn prompt takes the punctuation colour, which clears 4.5:1 on the code surface');
  }
});
