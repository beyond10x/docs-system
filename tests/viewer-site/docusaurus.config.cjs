const path = require('node:path');
module.exports = {
  title: 'ESS contract viewer integration fixture', url: 'https://example.com', baseUrl: '/',
  onBrokenLinks: 'throw', onBrokenAnchors: 'throw',
  markdown: {mermaid: true}, themes: ['@docusaurus/theme-mermaid'],
  presets: [['classic', {docs: false, blog: false, theme: {customCss: path.resolve(__dirname, '../..', 'styles/tokens.css')}}]],
  themeConfig: {mermaid: {options: {securityLevel: 'strict', htmlLabels: false, flowchart: {htmlLabels: false}}}},
};
