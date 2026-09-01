# docs-system

The public contract and reusable tooling behind the unified beyond10x documentation site. Docs
System validates repository-owned publication declarations, safely collects their passive content,
builds deterministic discovery and change data, and supplies shared React renderers and GitHub Pages
compatibility routes.

Consumer repositories pin an immutable Git commit. This package is private to the Git transport and
is not published to npm:

```json
{
  "dependencies": {
    "@beyond10x/docs-system": "github:beyond10x/docs-system#0123456789abcdef0123456789abcdef01234567"
  }
}
```

## Documentation sources

Every participating repository owns a root `b10x.docs.yaml`. `b10x-docs/v3` separates the owning
repository's data-only source declaration from delivery by the central Website. It declares:

- the repository display name and public documentation surfaces;
- canonical route bases, audiences, primary journeys, relationships, and adoption actions;
- allowlisted Markdown/MDX, structured data, blog, asset, OpenAPI, and JSON Schema inputs;
- an optional fixed vocabulary of shared components; and
- the Website publisher and `beyond10x.github.io` delivery origin.

Versions 1 and 2 remain readable during migration. Validate any supported contract with:

```console
b10x-docs validate b10x.docs.yaml changes/*.yaml sources.lock.json redirects.yaml
```

The v3 collector never imports repository code. It refuses path traversal, symlinks, executable MDX,
undeclared components, invalid source types, unmatched declarations, duplicate outputs, and duplicate
specification routes. It can validate and hash in place or copy only the declared bytes:

```console
b10x-docs collect --manifest b10x.docs.yaml --repository-root . \
  --index-out collection.json --out .generated/sources
```

The deterministic index contains every repository-relative source path, staged output path, byte
size, SHA-256 digest, and one aggregate `contentSha256`. A `b10x-sources/v1` lock binds that digest and
the manifest digest to an exact 40-character Git commit.

Node orchestration imports the dedicated server-safe subpaths. The package root also exports React
components and therefore belongs in Docusaurus, not a plain Node collector process:

```js
import {readManifest, readSourceLock} from '@beyond10x/docs-system/manifest';
import {collectManifestSources} from '@beyond10x/docs-system/collector';
import {writeRedirectMap} from '@beyond10x/docs-system/redirects';
```

## Discovery, changes, and compatibility

Generate or check the standard marked README entry block rather than hand-writing cross-ecosystem
links:

```console
b10x-docs readme --manifest b10x.docs.yaml --file README.md
b10x-docs readme --manifest b10x.docs.yaml --file README.md --check
```

`b10x-change/v2` adds typed affected repositories, surfaces, components, and APIs. Existing v1 change
documents remain valid. Snapshot generation keeps explicit impact records and unenriched technical
releases in distinct typed channels while retaining a deterministic combined ledger:

```console
b10x-docs snapshot --registry-out ecosystem.json --ledger-out changes.json \
  --rss-out changes/feed.xml --json-feed-out changes/feed.json \
  --release-facts release-facts.json ../*/b10x.docs.yaml ../*/changes/*.yaml
```

Generate repository Pages compatibility façades from `b10x-redirects/v1`:

```console
b10x-docs redirects --map redirects.yaml --out public --alias-root unified-artifact
```

HTML routes receive deterministic canonical/noindex redirect pages that preserve the query and
fragment. RSS, JSON, OpenAPI, schemas, and downloads use byte-preserving static aliases instead of
HTML redirects.

## Shared components

- `CodeExample`, `CommandExample`, and `CodeTabs`
- `DataCatalog` and `DependencyGraph` for typed repository-owned data
- `Diagram` for Mermaid source or generated SVG
- `OpenApiReference` and `JsonSchemaViewer` for read-only OpenAPI 3.1 documents
- `StatusBadge`, `BoundaryNotice`, `ProjectCard`, and `EcosystemSwitcher`
- `AdoptionCard` and `ChangeTimelineEntry`

Import `@beyond10x/docs-system/tokens.css` once. Components use stable `b10x-*` class names; project
identity is data, while Website owns the unified shell.

## Gate

```console
npm ci --ignore-scripts
npm run gate
```

Apache-2.0. See [LICENSE](LICENSE).

<!-- b10x-docs:discovery:start -->
> **Docs System in beyond10x:** [Start](https://beyond10x.github.io/) · [Project](https://beyond10x.github.io/ecosystem/docs-system/) · [Documentation](https://beyond10x.github.io/docs/docs-system/) · [Ecosystem](https://beyond10x.github.io/ecosystem/) · [Changes](https://beyond10x.github.io/changes/)
<!-- b10x-docs:discovery:end -->
