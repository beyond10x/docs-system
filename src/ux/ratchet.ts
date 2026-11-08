// The ratchet (SKILL § 6): every value is lower-is-better and the baseline never gets worse.
import {execFile} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import type {Metrics} from './run.js';

export interface BaselineEntry {value: number; tolerance: number; decision?: string}
export interface Baseline {
  about: string;
  scenarios: Record<string, Record<string, BaselineEntry>>;
  tolerances: Record<string, number>;
}

export const DEFAULT_TOLERANCES: Record<string, number> = {counts: 0, steps: 0.05, layout_shift: 0.01};

/** Tolerance for one key: layout_shift 0.01, step medians and percentiles 5 %, every count 0. */
export function toleranceFor(key: string, value: number, tolerances = DEFAULT_TOLERANCES): number {
  if (key.startsWith('layout_shift')) return tolerances.layout_shift ?? 0.01;
  if (/\.(median|p95)$/.test(key)) return Math.round(value * (tolerances.steps ?? 0.05) * 1000) / 1000;
  return tolerances.counts ?? 0;
}

/**
 * Compares measured values with the baseline. Fails on a worse value beyond tolerance, an improvement
 * not taken into the baseline, a value missing on either side, and a baseline entry worse than
 * `main`'s without a decision id.
 */
export function ratchet(baseline: Baseline, measured: Metrics, main?: Baseline): string[] {
  const problems: string[] = [];
  const scenarios = new Set([...Object.keys(baseline.scenarios), ...Object.keys(measured)]);
  for (const scenario of [...scenarios].sort()) {
    const base = baseline.scenarios[scenario] ?? {};
    const now = measured[scenario] ?? {};
    for (const key of [...new Set([...Object.keys(base), ...Object.keys(now)])].sort()) {
      const at = `${scenario} ${key}`;
      const entry = base[key];
      const value = now[key];
      if (!entry) { problems.push(`${at}: measured ${value} but not in the baseline (run the ratchet with --update)`); continue; }
      if (value === undefined) { problems.push(`${at}: baseline ${entry.value} but no measured value`); continue; }
      if (value > entry.value + entry.tolerance) problems.push(`${at}: ${value} is worse than the baseline ${entry.value} (tolerance ${entry.tolerance})`);
      else if (value < entry.value - entry.tolerance || (entry.tolerance === 0 && value < entry.value)) problems.push(`${at}: ${value} improves on the baseline ${entry.value}; take it into the baseline in this merge (--update)`);
    }
  }
  if (main) {
    for (const [scenario, keys] of Object.entries(baseline.scenarios)) for (const [key, entry] of Object.entries(keys)) {
      const before = main.scenarios[scenario]?.[key];
      if (before && entry.value > before.value + before.tolerance && !entry.decision) problems.push(`${scenario} ${key}: baseline ${entry.value} is worse than main's ${before.value} without a decision id`);
    }
  }
  return problems;
}

/** Takes measured values into the baseline. A value worse than before needs a decision id. */
export function updateBaseline(baseline: Baseline, measured: Metrics, decision?: string): {baseline: Baseline; refused: string[]} {
  const refused: string[] = [];
  const scenarios: Baseline['scenarios'] = {};
  for (const scenario of Object.keys(measured).sort()) {
    scenarios[scenario] = {};
    for (const key of Object.keys(measured[scenario]!).sort()) {
      const value = measured[scenario]![key]!;
      const before = baseline.scenarios[scenario]?.[key];
      const entry: BaselineEntry = {value, tolerance: toleranceFor(key, value, baseline.tolerances)};
      if (before && value > before.value + before.tolerance) {
        if (!decision) { refused.push(`${scenario} ${key}: ${value} is worse than ${before.value}; pass --decision <id>`); entry.value = before.value; entry.tolerance = before.tolerance; }
        else entry.decision = decision;
      } else if (before?.decision && value >= before.value) entry.decision = before.decision;
      scenarios[scenario]![key] = entry;
    }
  }
  return {baseline: {...baseline, scenarios}, refused};
}

export async function readBaseline(file: string): Promise<Baseline> {
  const text = await readFile(file, 'utf8').catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return undefined; throw error; });
  if (text === undefined) return {about: 'Lower is better. Written by b10x-docs ux ratchet --update.', scenarios: {}, tolerances: {...DEFAULT_TOLERANCES}};
  return JSON.parse(text) as Baseline;
}

export async function writeBaseline(file: string, baseline: Baseline): Promise<void> {
  await writeFile(file, `${JSON.stringify(baseline, null, 2)}\n`);
}

/** The baseline file as committed on `ref` (default origin/main, then main); undefined when absent. */
export async function baselineAt(file: string, ref?: string): Promise<Baseline | undefined> {
  const run = promisify(execFile);
  const directory = path.dirname(path.resolve(file));
  try {
    const {stdout: top} = await run('git', ['rev-parse', '--show-toplevel'], {cwd: directory});
    const relative = path.relative(top.trim(), path.resolve(file)).split(path.sep).join('/');
    for (const candidate of ref ? [ref] : ['origin/main', 'main']) {
      const shown = await run('git', ['show', `${candidate}:${relative}`], {cwd: directory, maxBuffer: 1 << 24}).catch(() => undefined);
      if (shown) return JSON.parse(shown.stdout) as Baseline;
    }
  } catch { /* not a git checkout */ }
  return undefined;
}
