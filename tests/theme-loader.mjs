const stubs = new URL('./theme-stubs.mjs', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@theme/CodeBlock') return {url: `${stubs.href}?component=code`, shortCircuit: true};
  if (specifier === '@theme/Mermaid') return {url: `${stubs.href}?component=mermaid`, shortCircuit: true};
  return nextResolve(specifier, context);
}
