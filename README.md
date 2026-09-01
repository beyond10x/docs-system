# docs-system

The shared presentation and discovery system for beyond10x public documentation. It provides one
Git-pinned package containing the Docusaurus integration, React/MDX components, OpenAPI and diagram
renderers, design tokens, the `b10x-docs/v1` manifest schema, and deterministic registry tooling.

Consumer sites depend on an immutable Git commit; this package is not published to npm:

```json
{
  "dependencies": {
    "@beyond10x/docs-system": "github:beyond10x/docs-system#0123456789abcdef0123456789abcdef01234567"
  }
}
```

## Components

- `CodeExample`, `CommandExample`, and `CodeTabs`
- `Diagram` for Mermaid source or generated SVG
- `OpenApiReference` and `JsonSchemaViewer` for read-only OpenAPI 3.1 documents
- `StatusBadge`, `BoundaryNotice`, `ProjectCard`, and `EcosystemSwitcher`
- `AdoptionCard` and `ChangeTimelineEntry` for outcome-first entry and ecosystem impact

Import the shared stylesheet once from `@beyond10x/docs-system/tokens.css`. Components use stable
`b10x-*` class names so projects can apply an accent without copying the shell.

## Surface manifests

Each participating repository owns a root `b10x.docs.yaml`. Version 2 adds one explicit adoption
action per surface while the validator continues to accept version 1 during migration. Important
public changes are owned by the repository making the claim as `b10x-change/v1` YAML documents.
Validate and aggregate them with:

```console
b10x-docs validate ../getting-started/b10x.docs.yaml
b10x-docs registry --out ecosystem.json ../*/b10x.docs.yaml
```

Produce a complete deterministic public snapshot—including a typed change ledger and feed files—with:

```console
b10x-docs snapshot --registry-out ecosystem.json --ledger-out changes.json \
  --rss-out changes/rss.xml --json-feed-out changes/feed.json \
  --release-facts release-facts.json ../*/b10x.docs.yaml ../*/changes/*.yaml
```

Release facts add the complete technical release stream. A repository-owned change document with
the same repository and version enriches that fact and promotes it as an impactful ecosystem
change rather than creating a duplicate.

The registry command includes only published, publicly discoverable surfaces and refuses a public
surface that links a non-public relationship.

## Gate

```console
npm ci --ignore-scripts
npm run gate
```

Apache-2.0. See [LICENSE](LICENSE).
