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
