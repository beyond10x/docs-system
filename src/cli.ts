#!/usr/bin/env node
import process from 'node:process';
import {writeJsonFeed, writeRss} from './feeds.js';
import {buildLedger, buildRegistry, readDocument, readManifest, readReleaseFacts, writeJson} from './manifest.js';
import type {DocumentationManifest, EcosystemChange} from './types.js';

const [, , command, ...args] = process.argv;

try {
  if (command === 'validate') {
    if (args.length === 0) throw new Error('usage: b10x-docs validate <manifest-or-change>...');
    for (const file of args) {
      const document = await readDocument(file);
      const detail = document.schema.startsWith('b10x-docs/') ? `${(document as DocumentationManifest).surfaces.length} surface(s)` : 'ecosystem change';
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
    const manifests = documents.filter((document): document is DocumentationManifest => document.schema.startsWith('b10x-docs/'));
    const changes = documents.filter((document): document is EcosystemChange => document.schema === 'b10x-change/v1');
    const registry = buildRegistry(manifests);
    const ledger = buildLedger(registry, changes, await readReleaseFacts(releaseOption.value));
    await Promise.all([
      writeJson(registryOption.value, registry),
      writeJson(ledgerOption.value, ledger),
      writeRss(rssOption.value, ledger),
      writeJsonFeed(feedOption.value, ledger),
    ]);
    process.stdout.write(`${registryOption.value}: ${registry.surfaces.length} public surface(s)\n${ledgerOption.value}: ${ledger.changes.length} ecosystem change(s)\n`);
  } else {
    throw new Error('usage: b10x-docs <validate|registry|snapshot> ...');
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

function takeOption(args: string[], name: string): {value?: string; rest: string[]} {
  const marker = args.indexOf(name);
  if (marker < 0) return {rest: args};
  const value = args[marker + 1];
  if (!value) throw new Error(`${name} requires a value`);
  return {value, rest: args.filter((_, index) => index !== marker && index !== marker + 1)};
}
