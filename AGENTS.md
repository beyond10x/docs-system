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

<!-- b10x-docs-operations:start -->
## Public documentation operations

This repository owns the public source and presentation allowlist in `b10x.docs.yaml`; the unified [beyond10x Website](https://beyond10x.github.io/docs/docs-system/) passively collects those declared files from the exact commit in `website/sources.lock.json`. Atlas owns discovery grouping/order; Website and Docs System own rendering, shared components, search, and feeds. Do not add a standalone docs deployer or put App credentials in this public repository. If Atlas catalogs a former Pages workflow, that file remains repository-owned validation: preserve its bespoke checks while keeping exact read-only permissions, an unconditional pull-request trigger, and no deployment primitives. Project Pages at `/docs-system/` is only the generated redirect façade in `.github/workflows/b10x-docs-pages.yml`.

From a complete organization workspace, run `cargo run --manifest-path atlas/Cargo.toml -- docs reconcile --workspace . --check` to verify the contract. Keep internal plans, stories, ADRs, decisions, worklogs, security material, and research out of the public allowlist unless a repository authority explicitly declares them public.
<!-- b10x-docs-operations:end -->
