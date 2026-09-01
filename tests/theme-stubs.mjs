import {createElement} from 'react';

const component = new URL(import.meta.url).searchParams.get('component');

export default function ThemeStub(properties) {
  if (component === 'mermaid') {
    return createElement('svg', {'data-testid': 'mermaid', 'data-source': properties.value, viewBox: '0 0 800 400'});
  }
  return createElement('pre', {'data-language': properties.language}, createElement('code', null, properties.children));
}
