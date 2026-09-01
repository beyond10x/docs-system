#!/usr/bin/env node
import process from 'node:process';
import {collectManifestSources} from './collector.js';
import {discoveryOptionsFromManifest, writeDiscoveryBlock} from './discovery.js';
import {writeJsonFeed, writeRss} from './feeds.js';
import {buildLedger, buildRegistry, readDocument, readManifest, readRedirectMap, readReleaseFacts, writeJson} from './manifest.js';
import {writeRedirectMap} from './redirects.js';
import type {DocumentationManifest, DocumentationManifestV3, EcosystemChange} from './types.js';

const [, , command, ...args] = process.argv;

try {
  if (command === 'validate') {
    if (args.length === 0) throw new Error('usage: b10x-docs validate <manifest-or-change-or-lock-or-redirect-map>...');
    for (const file of args) {
      const document = await readDocument(file);
      let detail: string;
      if (document.schema.startsWith('b10x-docs/')) detail = `${(document as DocumentationManifest).surfaces.length} surface(s)`;
      else if (document.schema.startsWith('b10x-change/')) detail = 'ecosystem change';
      else if (document.schema === 'b10x-sources/v1') detail = `${document.sources.length} locked source(s)`;
      else if (document.schema === 'b10x-redirects/v1') detail = `${document.redirects.length} compatibility route(s)`;
      else throw new Error(`${file} has unsupported schema`);
      process.stdout.write(`${file}: ${detail} valid\n`);
    }
  } else if (command === 'registry') {
    const {value: out, rest: files} = takeOption(args, '--out');
    if (!out || files.length === 0) throw new Error('usage: b10x-docs registry --out <file> <manifest>...');
    const manifests = await Promise.all(files.map(readManifest));
    const registry = buildRegistry(manifests);
    await writeJson(out, registry);
    process.stdout.write(`${out}: ${registry.surfaces.length} public surface(s)\n`);
  } else if (command === 'snapshot') {
    let rest = args;
    const registryOption = takeOption(rest, '--registry-out'); rest = registryOption.rest;
    const ledgerOption = takeOption(rest, '--ledger-out'); rest = ledgerOption.rest;
    const rssOption = takeOption(rest, '--rss-out'); rest = rssOption.rest;
    const feedOption = takeOption(rest, '--json-feed-out'); rest = feedOption.rest;
    const releaseOption = takeOption(rest, '--release-facts'); rest = releaseOption.rest;
    if (!registryOption.value || !ledgerOption.value || !rssOption.value || !feedOption.value || rest.length === 0) {
      throw new Error('usage: b10x-docs snapshot --registry-out <file> --ledger-out <file> --rss-out <file> --json-feed-out <file> [--release-facts <file>] <manifest-or-change>...');
    }
    const documents = await Promise.all(rest.map(readDocument));
    const manifests = documents.filter(isManifest);
    const changes = documents.filter(isChange);
    const registry = buildRegistry(manifests);
    const ledger = buildLedger(registry, changes, await readReleaseFacts(releaseOption.value));
    await Promise.all([
      writeJson(registryOption.value, registry),
      writeJson(ledgerOption.value, ledger),
      writeRss(rssOption.value, ledger),
      writeJsonFeed(feedOption.value, ledger),
    ]);
    process.stdout.write(`${registryOption.value}: ${registry.surfaces.length} public surface(s)\n${ledgerOption.value}: ${ledger.changes.length} ecosystem change(s)\n`);
  } else if (command === 'collect') {
    let rest = args;
    const manifestOption = takeOption(rest, '--manifest'); rest = manifestOption.rest;
    const rootOption = takeOption(rest, '--repository-root'); rest = rootOption.rest;
    const indexOption = takeOption(rest, '--index-out'); rest = indexOption.rest;
    const outOption = takeOption(rest, '--out'); rest = outOption.rest;
    if (!manifestOption.value || !rootOption.value || !indexOption.value || rest.length > 0) {
      throw new Error('usage: b10x-docs collect --manifest <file> --repository-root <dir> --index-out <file> [--out <dir>]');
    }
    const manifest = await readManifest(manifestOption.value);
    if (manifest.schema !== 'b10x-docs/v3') throw new Error('b10x-docs collect requires a b10x-docs/v3 manifest');
    const index = await collectManifestSources(manifest, rootOption.value, {outputRoot: outOption.value});
    await writeJson(indexOption.value, index);
    process.stdout.write(`${indexOption.value}: ${index.files.length} source file(s), ${index.contentSha256}\n`);
  } else if (command === 'redirects') {
    let rest = args;
    const mapOption = takeOption(rest, '--map'); rest = mapOption.rest;
    const outOption = takeOption(rest, '--out'); rest = outOption.rest;
    const aliasOption = takeOption(rest, '--alias-root'); rest = aliasOption.rest;
    if (!mapOption.value || !outOption.value || rest.length > 0) {
      throw new Error('usage: b10x-docs redirects --map <file> --out <dir> [--alias-root <dir>]');
    }
    const map = await readRedirectMap(mapOption.value);
    await writeRedirectMap(outOption.value, map, {aliasSourceRoot: aliasOption.value});
    process.stdout.write(`${outOption.value}: ${map.redirects.length} compatibility route(s)\n`);
  } else if (command === 'readme') {
    let rest = args;
    const manifestOption = takeOption(rest, '--manifest'); rest = manifestOption.rest;
    const fileOption = takeOption(rest, '--file'); rest = fileOption.rest;
    const checkOption = takeFlag(rest, '--check'); rest = checkOption.rest;
    if (!manifestOption.value || !fileOption.value || rest.length > 0) {
      throw new Error('usage: b10x-docs readme --manifest <file> --file <README.md> [--check]');
    }
    const manifest = await readManifest(manifestOption.value);
    const changed = await writeDiscoveryBlock(fileOption.value, discoveryOptionsFromManifest(manifest), {check: checkOption.present});
    process.stdout.write(`${fileOption.value}: discovery block ${changed ? 'updated' : 'current'}\n`);
  } else {
    throw new Error('usage: b10x-docs <validate|registry|snapshot|collect|redirects|readme> ...');
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

function isManifest(document: Awaited<ReturnType<typeof readDocument>>): document is DocumentationManifest {
  return document.schema.startsWith('b10x-docs/');
}

function isChange(document: Awaited<ReturnType<typeof readDocument>>): document is EcosystemChange {
  return document.schema.startsWith('b10x-change/');
}

function takeOption(args: string[], name: string): {value?: string; rest: string[]} {
  const marker = args.indexOf(name);
  if (marker < 0) return {rest: args};
  const value = args[marker + 1];
  if (!value) throw new Error(`${name} requires a value`);
  return {value, rest: args.filter((_, index) => index !== marker && index !== marker + 1)};
}

function takeFlag(args: string[], name: string): {present: boolean; rest: string[]} {
  return {present: args.includes(name), rest: args.filter((value) => value !== name)};
}
