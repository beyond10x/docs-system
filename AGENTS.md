# AGENTS.md — docs-system

The change contract for the public beyond10x documentation-system repository. Organization-wide
rules live in `atlas/AGENTS.md`.

## Serves

- **O2 — decisions as data, with evidence.** Public documentation surfaces and their relationships
  are declared, validated, generated, and drift-checked.
- **O5 — the generic agent platform.** Readers receive one coherent entry point and navigation
  system across the public foundation and service documentation.

## Boundary

- This repository owns reusable presentation and discovery infrastructure, not project claims.
- Project manifests and documentation remain owned by their repositories.
- Public registry output contains only surfaces explicitly declared `discoverability: public` and
  `availability: published`.
- Consumer repositories pin an immutable Git commit. Do not publish this package to npm.
- Components are generic primitives. A project-specific widget moves here only after another real
  consumer establishes the shared contract.
- OpenAPI rendering is read-only. It never sends a request or accepts a credential.
- Rendered SVG must contain no scripts, event handlers, foreign objects, or external resources.

## Gate

```console
npm ci --ignore-scripts
npm run gate
```

The gate builds committed distribution files, checks they are current, runs tests, validates the
fixture manifests, and exercises package exports.

## Delivery

Use conventional commits. Commits, tags, pushes, and repository mutations use Atlas-owned bot
tooling from outside this public repository.
