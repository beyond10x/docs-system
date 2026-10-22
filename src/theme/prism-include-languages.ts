/**
 * Wraps the classic theme's grammar loader, then registers the `console` fence language. A site
 * that wraps `@theme-original/prism-include-languages` still reaches this loader and keeps it.
 */
import includeLanguages from '@theme-init/prism-include-languages';
import {registerConsoleLanguage} from '../console-language.js';
import type {ConsolePrism} from '../console-language.js';

export default function prismIncludeLanguages(prism: ConsolePrism): void {
  includeLanguages(prism);
  registerConsoleLanguage(prism);
}
