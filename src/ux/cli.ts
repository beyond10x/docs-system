// `b10x-docs ux gate|round`: the fast loop's gate and the round's Measure step on a built site.
import {mkdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {loadAdapter} from './adapter.js';
import {checkFindings} from './findings.js';
import {baselineAt, ratchet, readBaseline, updateBaseline, writeBaseline} from './ratchet.js';
import {writeRound} from './round.js';
import {runUx} from './run.js';

const USAGE = [
  'usage: b10x-docs ux gate --site <built-dir> [--adapter ux/adapter.json] [--baseline ux/baseline.json] [--out <run.json>] [--update [--decision <id>]]',
  '       b10x-docs ux round --site <built-dir> --round ux/rounds/R-nn [--adapter ux/adapter.json] [--baseline ux/baseline.json]',
].join('\n');

function options(args: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (!arg.startsWith('--')) throw new Error(USAGE);
    const next = args[index + 1];
    if (next === undefined || next.startsWith('--')) out[arg.slice(2)] = true;
    else { out[arg.slice(2)] = next; index += 1; }
  }
  return out;
}

export async function uxCommand(args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  const opts = options(rest);
  const site = opts.site;
  if ((sub !== 'gate' && sub !== 'round') || typeof site !== 'string') throw new Error(USAGE);
  const adapterFile = typeof opts.adapter === 'string' ? opts.adapter : 'ux/adapter.json';
  const baselineFile = typeof opts.baseline === 'string' ? opts.baseline : path.join(path.dirname(adapterFile), 'baseline.json');
  const {adapter, scenarios, directory} = await loadAdapter(adapterFile);
  const log = (line: string) => process.stdout.write(`${line}\n`);
  if (sub === 'round') {
    if (typeof opts.round !== 'string') throw new Error(USAGE);
    const measured = [...new Set([...adapter.viewports.measured, ...adapter.viewports.gating])];
    const run = await runUx({site, adapter, scenarios, viewports: measured, shots: path.join(opts.round, 'shots', 'pages'), log});
    await writeRound({run, adapter, scenarios, roundDir: opts.round, baseline: await readBaseline(baselineFile), findingsDir: path.join(directory, 'findings')});
    log(`${opts.round}: report.md, round.json, shots/ and ../trend.md written`);
    return 0;
  }
  const run = await runUx({site, adapter, scenarios, log});
  if (typeof opts.out === 'string') { await mkdir(path.dirname(opts.out), {recursive: true}); await writeFile(opts.out, `${JSON.stringify(run, null, 2)}\n`); }
  const problems = [...run.failures];
  const baseline = await readBaseline(baselineFile);
  if (opts.update) {
    const {baseline: next, refused} = updateBaseline(baseline, run.metrics, typeof opts.decision === 'string' ? opts.decision : undefined);
    await writeBaseline(baselineFile, next);
    problems.push(...refused.map((line) => `ratchet: ${line}`));
    log(`${baselineFile}: updated`);
  } else {
    if (!(await stat(baselineFile).then(() => true, () => false))) problems.push(`ratchet: ${baselineFile} does not exist; write it with --update and commit it`);
    else problems.push(...ratchet(baseline, run.metrics, await baselineAt(baselineFile)).map((line) => `ratchet: ${line}`));
  }
  problems.push(...(await checkFindings(path.join(directory, 'findings'), path.resolve(directory, '..'))).map((line) => `findings: ${line}`));
  const bots = run.botRuns.length;
  if (problems.length) {
    process.stderr.write(`${problems.join('\n')}\nux gate: ${problems.length} problem(s)\n`);
    return 1;
  }
  log(`ux gate: passed: ${run.pages.length} pages x ${run.gating.length} viewports x ${run.themes.length} themes, ${bots} screen-only runs, baseline held`);
  return 0;
}
