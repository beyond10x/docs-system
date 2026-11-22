---
format: aep.planning-md/3
id: review-result:adversary-pass-1-on-the-reference-pages
kind: review-result
status: active
title: 'Adversary pass 1 on the reference pages: 8 findings (2 warnings, 6 notes), 6 introduced, 2 there before'
relations:
- reviews: story:reference-pages-for-openapi-asyncapi-and-cli
revision: 1
---
unit: adversary pass 1 on docs-system `feat/api-reference`, the uncommitted working tree on base 081e05f (the managed tree docs-system-api-ref)
verdict: CONFIRMED (4 red cases: 2 warnings, 2 notes; no blocker)
cases: executed 10→14, red 4 (files run: tests/api-reference.test.mjs and tests/adversary-reference.test.mjs; whole suite not run, as the brief said)
origin: introduced 4 / pre-existing 2 / undecided 0 (red cases are all introduced; the 2 pre-existing are text-only)
wrote-outside-worktree: 1 directory (listed in part 6)
needs-coordinator: none

1. `git diff --stat` still lists only the unit's 25 modified files. I added one untracked file, tests/adversary-reference.test.mjs. I changed no non-test path. Test runs created `.cache/b10x-favicon/` (gitignored), probably through `withProductSite` in the unit's tests.

2. Cases in tests/adversary-reference.test.mjs. All 4 are red now and were red on the first run, alone: `slot timeout 300 node --test tests/adversary-reference.test.mjs`, last line `exit=1 wall=291s` (most of it queue wait; the cases themselves 0.03 to 0.8 s each).
- "CliReference gives each command of a valid document its own anchor". Schema and parser both accept commands `key new`/`key-new` and `a_b`/`a.b`. Output: `+ ['command-key-new','command-key-new-title','command-a-b','command-a-b-title']`.
- "AsyncApiReference writes no link to an anchor that is not on the page". An operation's channel `$ref` points to a channel that does not exist. Output: `+ ['channel-missing']`.
- "a reference source the plugin cannot publish fails the build naming the id and the file". A YAML recursive alias passes the kind and version check. Output: `The validation function is expected to return "true". Received false`. A probe showed the actual error: `Converting circular structure to JSON`, with no id and no file.
- "the reference renderers name no product". Output: `+ ['src/cli-reference-view.tsx:57']`.

3. Combined run: `slot timeout 300 node --test tests/api-reference.test.mjs tests/adversary-reference.test.mjs`, last line `exit=1 wall=54s`, `# tests 14 # pass 10 # fail 4`. All 10 of the unit's tests pass. One of them is over 5 s at today's load: "OpenApiReference renders the inbox service…" took 19.2 s.

4. Findings
- src/cli-reference-view.tsx:62: `commandId` slugs the command path, so distinct valid commands get the same `id` and the second index link opens the first command. warning, CONFIRMED, introduced (verified by running). Reached by any CLI whose command words differ only in `-`, `_`, `.` or letter case.
- src/asyncapi.tsx:78 and :119: a channel `$ref` that does not resolve still produces `href="#channel-<name>"`. This breaks the story boundary "Every link a renderer writes is an anchor on the page". Also, at :121 a reply channel under `#/components/channels/` produces `href="#"` (probe only). warning, CONFIRMED, introduced (verified). Reached only by an invalid document; the build does not check `$ref`s.
- src/reference-data.ts:105 and src/product-site.ts:193: a YAML recursive alias passes `readReference`, then `JSON.stringify` throws with no reference id or file in the message. The renderer would also overflow the stack on the cyclic object (probe). note, INFEASIBLE (no generator writes recursive aliases), introduced (verified).
- src/cli-reference-view.tsx:57: a doc comment names `inbox`, and it ships in dist/cli-reference-view.{js,d.ts}:42/17. The story boundary says "nothing in them names the inbox". note, CONFIRMED, introduced (verified).
- src/renderers.tsx:82: an operation without an `operationId` gets the anchor `slug(method-path)`, so `/a/b` and `/a-b` both become `operation-get-a-b`, a duplicate id. note, pre-existing (081e05f:src/renderers.tsx:74; verified by probe).
- src/api-common.tsx:132 / src/renderers.tsx:95: a `$ref` to a component schema that does not exist links to `#schema-Missing`, which is not on the page. note, pre-existing (the base linked every `$ref` to `#schema-<last>`; verified by probe).
- schema/b10x.cli-reference.v1.schema.json:5: the description lists the parser-only checks but leaves out four that the parser refuses and the schema accepts: duplicate exit codes, environment `commands` that name no command, a trailing positional that is not last, and a group member that is a global option. The parser also accepts globals in `conflicts`/`requires` but not in groups. note, introduced (verified with a 35-case ajv-vs-parser matrix; text finding only).
- src/theme/MDXComponents.tsx:27: `<OpenApiReference document={…}>` used without `@b10x-reference` still loads lazily after hydration. AGENTS.md now says a lazy component "must be loaded before the page hydrates"; README:530 documents the re-render. note, introduced (read only; I was not allowed to run browser checks).
- Read only: a JSON source with a UTF-8 BOM is refused as "not valid JSON" (the message names the id and the file; RFC 8259 allows this). YAML `version: 1.10` renders "1.1" because `info.version` is not type-checked.

5. Attacked, found sound:
- No fetch, XHR, form, button, credential input, `dangerouslySetInnerHTML` or `innerHTML` in the renderers.
- Descriptions are text only, so HTML stays text.
- Every href is a `#` fragment or the plugin's `sourceUrl`. Server and `openIdConnect` URLs and `externalDocs` render as text.
- External, `../` and `file:` `$ref`s are never followed.
- `$ref` cycles end. An inline `allOf` nested 3000 deep renders.
- `__proto__` and `constructor` keys as channel, operation or property names: no prototype pollution; `resolvePointer` uses `hasOwn`.
- The CLI validator agrees with the schema on every case the brief named: switch with `valueName`/`values`/`default`, group of 0, unknown kind, path with a space or `/`, missing format, format `/2`.
- AsyncAPI 2.6.0 is refused by both the checker and the renderer.
- A channel with no messages and a boolean payload both render, the payload as "No payload schema."
- Two messages with one name keep separate ids.
- Nothing that could differ between server render and hydration: no dates, random ids or locale formatting; Map order is insertion order.
- Every spread in the new code spreads an array.
- dist: after `slot npm run build` (exit 0, 92 s run), the sha256 of all 130 files, `git status --short dist` and `git diff --stat -- dist` are all unchanged. No dist file lacks a source.
- No product-specific widget; the only product name in the code is the comment at :57.

Not reached: the browser and Playwright suites; webpack and rspack site builds; `npm run gate`; a stack-depth bound (an inline `items` chain 20,000 deep overflows; INFEASIBLE, not filed).

6. Outside the worktree: the session directory outside the repository  (probe1.mjs, probe2.mjs, after-build.sh, suite.sh, logs, dist snapshots, site/ fixture files). Inside the tree: only tests/adversary-reference.test.mjs. I created no fixtures under tests/fixtures/adversary/.

7.
```findings
- file: src/cli-reference-view.tsx
  line: 62
  category: boundary
  severity: warning
  verdict: CONFIRMED
  origin: introduced
  message: commandId slugs the path, so valid distinct commands (key new / key-new, a_b / a.b) get duplicate ids and the index links open the wrong command
- file: src/asyncapi.tsx
  line: 119
  category: acceptance
  severity: warning
  verdict: CONFIRMED
  origin: introduced
  message: an operation whose channel $ref does not resolve gets href="#channel-<name>" with no such anchor on the page, against the story's every-link-is-an-anchor-on-the-page boundary
- file: src/reference-data.ts
  line: 105
  category: boundary
  severity: note
  verdict: INFEASIBLE
  origin: introduced
  message: a YAML recursive alias passes readReference and then fails contentLoaded with "Converting circular structure to JSON", naming neither the reference id nor the file
- file: src/cli-reference-view.tsx
  line: 57
  category: acceptance
  severity: note
  verdict: CONFIRMED
  origin: introduced
  message: a doc comment in the generic CLI renderer names the inbox, and it ships in dist, against the story boundary that nothing in the components names the inbox
- file: src/renderers.tsx
  line: 82
  category: boundary
  severity: note
  verdict: CONFIRMED
  origin: pre-existing
  message: operations without operationId on /a/b and /a-b both get the anchor operation-get-a-b
- file: src/renderers.tsx
  line: 95
  category: boundary
  severity: note
  verdict: CONFIRMED
  origin: pre-existing
  message: a $ref to a missing component schema links to a #schema-<name> anchor that is not on the page
- file: schema/b10x.cli-reference.v1.schema.json
  line: 5
  category: contract-drift
  severity: note
  verdict: CONFIRMED
  origin: introduced
  message: the description omits four parser-only refusals (duplicate exit codes, unknown environment commands, non-last trailing positional, a group member that is a global option)
- file: src/theme/MDXComponents.tsx
  line: 27
  category: judgement
  severity: note
  verdict: CONFIRMED
  origin: introduced
  message: the MDX reference components used without a @b10x-reference module load after hydration, against the new AGENTS.md rule that a lazy component is loaded before the page hydrates
```
