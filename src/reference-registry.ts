/**
 * Holds the reference renderers once a page module has loaded them, so the theme's lazy reference
 * components can render in the same pass instead of waiting for a chunk.
 */
import type * as Renderers from './renderers.js';

export type ReferenceRenderers = typeof Renderers;

let loaded: ReferenceRenderers | undefined;

export function provideReferenceRenderers(renderers: ReferenceRenderers): void {
  loaded = renderers;
}

export function loadedReferenceRenderers(): ReferenceRenderers | undefined {
  return loaded;
}
