/**
 * Prism grammars used by the shared Docusaurus shell.
 *
 * Keep this list in one place so every documentation surface highlights the
 * same repository-owned Markdown. JavaScript, TypeScript, JSX, TSX, CSS, and
 * markup are already loaded by Docusaurus and therefore do not belong in the
 * additional-language list.
 */
export const PRISM_ADDITIONAL_LANGUAGES = [
  'bash',
  'c',
  'cpp',
  'diff',
  'docker',
  'go',
  'graphql',
  'http',
  'ini',
  'json',
  'json5',
  'markdown',
  'powershell',
  'properties',
  'python',
  'rust',
  'shell-session',
  'toml',
  'yaml',
] as const;

/** Canonical language names accepted across beyond10x Markdown and examples. */
export const PRISM_LANGUAGES = [
  ...PRISM_ADDITIONAL_LANGUAGES,
  'css',
  'javascript',
  'jsx',
  'markup',
  'text',
  'typescript',
  'tsx',
] as const;

export type PrismLanguage = (typeof PRISM_LANGUAGES)[number];

export type CodePresentationKind = 'command' | 'transcript' | 'output' | 'source';

export interface CodeLanguagePresentation {
  label: string;
  kind: CodePresentationKind;
}

export interface MarkdownFencePresentation extends CodeLanguagePresentation {
  language: string;
  canonical: boolean;
}

/** Human-facing labels and semantics for every grammar in the shared shell. */
export const PRISM_LANGUAGE_PRESENTATIONS: Readonly<Record<PrismLanguage, CodeLanguagePresentation>> = {
  bash: {label: 'Bash', kind: 'command'},
  c: {label: 'C', kind: 'source'},
  cpp: {label: 'C++', kind: 'source'},
  diff: {label: 'Diff', kind: 'source'},
  docker: {label: 'Dockerfile', kind: 'source'},
  go: {label: 'Go', kind: 'source'},
  graphql: {label: 'GraphQL', kind: 'source'},
  http: {label: 'HTTP', kind: 'source'},
  ini: {label: 'INI', kind: 'source'},
  json: {label: 'JSON', kind: 'source'},
  json5: {label: 'JSON5', kind: 'source'},
  markdown: {label: 'Markdown', kind: 'source'},
  powershell: {label: 'PowerShell', kind: 'command'},
  properties: {label: 'Properties', kind: 'source'},
  python: {label: 'Python', kind: 'source'},
  rust: {label: 'Rust', kind: 'source'},
  'shell-session': {label: 'Terminal', kind: 'transcript'},
  toml: {label: 'TOML', kind: 'source'},
  yaml: {label: 'YAML', kind: 'source'},
  css: {label: 'CSS', kind: 'source'},
  javascript: {label: 'JavaScript', kind: 'source'},
  jsx: {label: 'JSX', kind: 'source'},
  markup: {label: 'HTML', kind: 'source'},
  text: {label: 'Plain text', kind: 'output'},
  typescript: {label: 'TypeScript', kind: 'source'},
  tsx: {label: 'TSX', kind: 'source'},
};

const FENCE_LANGUAGE_ALIASES: Readonly<Record<string, PrismLanguage>> = {
  console: 'shell-session',
  dockerfile: 'docker',
  htm: 'markup',
  html: 'markup',
  js: 'javascript',
  jsonc: 'json',
  md: 'markdown',
  ps1: 'powershell',
  py: 'python',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  terminal: 'shell-session',
  text: 'text',
  plaintext: 'text',
  txt: 'text',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
};

const canonicalLanguages = new Set<string>(PRISM_LANGUAGES);

/**
 * Normalize a Markdown fence or CodeBlock language to the shared Prism name.
 * Unknown names are retained so a consumer can add a project-specific Prism
 * grammar without this package silently turning its source into plain text.
 */
export function normalizeMarkdownFenceLanguage(language?: string | null): string {
  const normalized = language?.trim().toLowerCase().replace(/^language-/, '') ?? '';
  if (!normalized) return 'text';
  if (canonicalLanguages.has(normalized)) return normalized;
  return FENCE_LANGUAGE_ALIASES[normalized] ?? normalized;
}

export interface MarkdownFenceSource {
  /** The info-string language exactly as authored; empty or absent when the fence has none. */
  language?: string | null;
  /** The fence's raw source text, from its opening marker through its closing marker if any. */
  raw: string;
}

/**
 * The source-mode Markdown code-fence contract shared by the Website publisher
 * and `b10x-docs check-source`. Returns one message per violation; an empty
 * list means the fence is publishable. Parsing Markdown is left to the caller
 * so this module stays free of parser dependencies in browser bundles.
 */
export function markdownFenceProblems(fence: MarkdownFenceSource): string[] {
  const problems: string[] = [];
  const declaredLanguage = fence.language ?? '';
  const normalizedLanguage = normalizeMarkdownFenceLanguage(declaredLanguage);
  if (!declaredLanguage) {
    problems.push('fenced code block has no language; use text for plain output');
  } else if (declaredLanguage.toLowerCase() === 'console') {
    problems.push('console is ambiguous; use bash, shell-session, or text');
  } else if (normalizedLanguage !== 'mermaid' && !canonicalLanguages.has(normalizedLanguage)) {
    problems.push(`unsupported fenced-code language ${JSON.stringify(declaredLanguage)}`);
  }
  const marker = /^(`{3,}|~{3,})/.exec(fence.raw)?.[1];
  if (marker) {
    const closePattern = new RegExp(`${marker[0]}{${marker.length},}[\\t ]*$`);
    if (!closePattern.test(fence.raw)) problems.push('fenced code block is not closed');
  }
  return problems;
}

/** Resolve the label and visual semantics used by shared code surfaces. */
export function describeMarkdownFenceLanguage(language?: string | null): MarkdownFencePresentation {
  const normalized = normalizeMarkdownFenceLanguage(language);
  const presentation = PRISM_LANGUAGE_PRESENTATIONS[normalized as PrismLanguage];
  if (presentation) return {language: normalized, ...presentation, canonical: true};
  return {language: normalized, label: normalized, kind: 'source', canonical: false};
}

/** A managed-range violation, carrying the 1-based source line of the offending marker. */
export class ManagedRangeError extends Error {
  constructor(message: string, readonly line: number) {
    super(message);
    this.name = 'ManagedRangeError';
  }
}

const managedMarker = /^\s*<!--\s*(b10x-docs(?:[-:][a-z0-9-]+)*):(start|end)\s*-->\s*$/i;
const passiveHtmlElements = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn',
  'dialog', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'img', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map',
  'mark', 'menu', 'meter', 'nav', 'noscript', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre',
  'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'slot', 'small', 'source',
  'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
]);

/**
 * The passive rendering the Website publisher applies to a collected Markdown body before it
 * reaches Docusaurus (Website `scripts/passive-markdown.mjs`): managed ranges removed, HTML
 * comments dropped, placeholder tags escaped, `{#id}` headings made explicit anchors, and opening
 * fence languages canonicalized. Fence state toggles on any same-character marker, exactly as the
 * publisher does; a nested fence the CommonMark parser keeps open is therefore rendered as prose.
 */
export function normalizePassiveMarkdown(source: string): string {
  const output: string[] = [];
  let fence: string | undefined;
  let htmlComment = false;
  for (const original of stripManagedRanges(source).split(/\r?\n/)) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(original);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = undefined;
      output.push(fence ? normalizeFenceLine(original) : original);
      continue;
    }
    if (fence) {
      output.push(original);
      continue;
    }
    let line = original;
    if (htmlComment) {
      const end = line.indexOf('-->');
      if (end < 0) continue;
      line = line.slice(end + 3);
      htmlComment = false;
    }
    while (line.includes('<!--')) {
      const start = line.indexOf('<!--');
      const end = line.indexOf('-->', start + 4);
      if (end < 0) {
        line = line.slice(0, start);
        htmlComment = true;
        break;
      }
      line = `${line.slice(0, start)}${line.slice(end + 3)}`;
    }
    line = escapePlaceholderTags(line);
    const heading = /^(#{1,6})\s+(.+?)\s+\{#([A-Za-z][A-Za-z0-9_.:-]*)\}\s*$/.exec(line);
    if (heading) output.push(`<a id=${JSON.stringify(heading[3])}></a>`, `${heading[1]} ${heading[2]}`);
    else if (line || !htmlComment) output.push(line);
  }
  return output.join('\n');
}

/** Escape unknown, attribute-free lowercase tags outside code spans; authored HTML is left alone. */
export function escapePlaceholderTags(line: string): string {
  let output = '';
  let cursor = 0;
  while (cursor < line.length) {
    const opening = line.indexOf('`', cursor);
    if (opening < 0) return output + escapeProsePlaceholderTags(line.slice(cursor));
    let runEnd = opening;
    while (line[runEnd] === '`') runEnd += 1;
    const marker = line.slice(opening, runEnd);
    const closing = line.indexOf(marker, runEnd);
    if (closing < 0) return output + escapeProsePlaceholderTags(line.slice(cursor));
    output += escapeProsePlaceholderTags(line.slice(cursor, opening));
    output += line.slice(opening, closing + marker.length);
    cursor = closing + marker.length;
  }
  return output;
}

function escapeProsePlaceholderTags(value: string): string {
  return value.replace(/<([a-z][a-z0-9.-]*)>/g, (match, tag: string) => (passiveHtmlElements.has(tag) ? match : `&lt;${tag}&gt;`));
}

/** Canonicalize only the language token of an opening fence line; `console` stays visible. */
export function normalizeFenceLine(line: string): string {
  const match = /^(\s*)(`{3,}|~{3,})(\s*)([^\s{]+)(.*)$/.exec(line);
  if (!match) return line;
  const [, indentation, marker, spacing, language, metadata] = match;
  if (language.toLowerCase() === 'console') return line;
  return `${indentation}${marker}${spacing}${normalizeMarkdownFenceLanguage(language)}${metadata}`;
}

/** Remove `<!-- b10x-docs…:start -->` … `:end -->` ranges outside fences; malformed ranges throw. */
export function stripManagedRanges(source: string): string {
  const output: string[] = [];
  let fence: string | undefined;
  let managedRange: string | undefined;
  let managedStart = 0;
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (!managedRange && fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = undefined;
      output.push(line);
      continue;
    }
    if (fence) {
      output.push(line);
      continue;
    }
    const marker = managedMarker.exec(line);
    if (managedRange) {
      if (!marker) continue;
      if (marker[2].toLowerCase() === 'start') throw new ManagedRangeError(`nested managed documentation range ${marker[1]}`, index + 1);
      if (marker[1].toLowerCase() !== managedRange) {
        throw new ManagedRangeError(`managed documentation range ${managedRange} closes as ${marker[1]}`, index + 1);
      }
      managedRange = undefined;
      continue;
    }
    if (!marker) {
      output.push(line);
      continue;
    }
    if (marker[2].toLowerCase() === 'end') throw new ManagedRangeError(`managed documentation range ${marker[1]} ends without a start`, index + 1);
    managedRange = marker[1].toLowerCase();
    managedStart = index + 1;
  }
  if (managedRange) throw new ManagedRangeError(`managed documentation range ${managedRange} is not closed`, managedStart);
  return output.join('\n');
}
