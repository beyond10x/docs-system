#!/usr/bin/env node
import process from 'node:process';
import { buildRegistry, readManifest, writeRegistry } from './manifest.js';
const [, , command, ...args] = process.argv;
try {
    if (command === 'validate') {
        if (args.length === 0)
            throw new Error('usage: b10x-docs validate <manifest>...');
        for (const file of args) {
            const manifest = await readManifest(file);
            process.stdout.write(`${file}: ${manifest.surfaces.length} surface(s) valid\n`);
        }
    }
    else if (command === 'registry') {
        const marker = args.indexOf('--out');
        if (marker < 0 || !args[marker + 1])
            throw new Error('usage: b10x-docs registry --out <file> <manifest>...');
        const out = args[marker + 1];
        const files = args.filter((_, index) => index !== marker && index !== marker + 1);
        if (files.length === 0)
            throw new Error('registry requires at least one manifest');
        const manifests = await Promise.all(files.map(readManifest));
        const registry = buildRegistry(manifests);
        await writeRegistry(out, registry);
        process.stdout.write(`${out}: ${registry.surfaces.length} public surface(s)\n`);
    }
    else {
        throw new Error('usage: b10x-docs <validate|registry> ...');
    }
}
catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
}
