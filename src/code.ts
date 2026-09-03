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

/** Resolve the label and visual semantics used by shared code surfaces. */
export function describeMarkdownFenceLanguage(language?: string | null): MarkdownFencePresentation {
  const normalized = normalizeMarkdownFenceLanguage(language);
  const presentation = PRISM_LANGUAGE_PRESENTATIONS[normalized as PrismLanguage];
  if (presentation) return {language: normalized, ...presentation, canonical: true};
  return {language: normalized, label: normalized, kind: 'source', canonical: false};
}
