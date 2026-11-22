let loaded;
export function provideReferenceRenderers(renderers) {
    loaded = renderers;
}
export function loadedReferenceRenderers() {
    return loaded;
}
