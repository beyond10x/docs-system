import {createElement} from 'react';

const component = new URL(import.meta.url).searchParams.get('component');

export default function ThemeStub(properties) {
  if (component === 'broken-links') return {collectAnchor() {}, collectLink() {}};
  if (component === 'link') {
    const {to, href, ...rest} = properties;
    return createElement('a', {...rest, href: to ?? href});
  }
  if (component === 'mermaid') {
    return createElement('svg', {'data-testid': 'mermaid', 'data-source': properties.value, viewBox: '0 0 800 400'});
  }
  return createElement('pre', {'data-language': properties.language}, createElement('code', null, properties.children));
}
