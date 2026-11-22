/**
 * Imported by the generated module behind each `@b10x-reference/<id>.json`. The page that imports
 * a reference carries the renderers in its own route chunks, which Docusaurus loads before it
 * hydrates, so the reference hydrates against its server HTML.
 */
import * as renderers from './renderers.js';
import { provideReferenceRenderers } from './reference-registry.js';
export function withReferenceRenderers(reference) {
    provideReferenceRenderers(renderers);
    return reference;
}
