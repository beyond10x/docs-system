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

This repository owns the public source and presentation allowlist in `b10x.docs.yaml`. The generated credential-free `.github/workflows/b10x-docs-bundle.yml` passively packages only those declared files for the exact successful `main` commit; it must never run repository code. Atlas selects the latest successful bundle with every other catalog source, and Website plus Docs System own rendering, shared components, search, and feeds. Do not add a standalone docs deployer or put App credentials in this public repository. If Atlas catalogs a former Pages workflow, that file remains repository-owned validation: preserve its bespoke checks while keeping exact read-only permissions, an unconditional pull-request trigger, and no deployment primitives. Project Pages at `/docs-system/` is only the generated stable redirect façade in `.github/workflows/b10x-docs-pages.yml`; content-only publication never rebuilds it.

From the complete organization workspace, verify the contract with a clean Atlas checkout at the current remote `main`. Set `B10X_ATLAS_CHECKOUT` to a managed Atlas worktree when the primary checkout is dirty or stale; never infer command availability from the primary alone.

```bash
atlas_checkout="${B10X_ATLAS_CHECKOUT:-atlas}"
atlas_head="$(git -C "$atlas_checkout" rev-parse HEAD)"
atlas_main="$(git -C "$atlas_checkout" ls-remote origin refs/heads/main | awk '{print $1}')"
test -z "$(git -C "$atlas_checkout" status --porcelain)"
test "$atlas_head" = "$atlas_main"
cargo run --manifest-path "$atlas_checkout/Cargo.toml" --locked -q -- \
  --store "$atlas_checkout/catalog/store" docs reconcile --workspace . --check
```

Keep internal plans, stories, ADRs, decisions, worklogs, security material, and research out of the public allowlist unless a repository authority explicitly declares them public.
<!-- b10x-docs-operations:end -->
