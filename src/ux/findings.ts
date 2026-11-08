// Finding records ux/findings/UXF-nnn.md (SKILL § 5) and the rule that a closed S1/S2 has an asset.
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

export const FINDING_FIELDS = ['id', 'title', 'class', 'severity', 'metric', 'status', 'found_by', 'evidence_recording', 'evidence_screenshot', 'evidence_lines', 'regression_asset'] as const;
export type Finding = Record<(typeof FINDING_FIELDS)[number], string> & {file: string};

/** Reads the `key: value` header lines up to the first blank line after the title. */
export function parseFinding(text: string, file: string): Finding {
  const fields: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const match = /^- ([a-z_]+): (.*)$/.exec(line);
    if (match) fields[match[1]!] = match[2]!.trim();
  }
  const missing = FINDING_FIELDS.filter((key) => fields[key] === undefined);
  if (missing.length) throw new Error(`${file}: missing header field(s) ${missing.join(', ')}`);
  return {...(fields as Finding), file};
}

export async function readFindings(directory: string): Promise<Finding[]> {
  const names = (await readdir(directory).catch(() => [] as string[])).filter((name) => /^UXF-\d{3}\.md$/.test(name)).sort();
  return Promise.all(names.map(async (name) => parseFinding(await readFile(path.join(directory, name), 'utf8'), path.join(directory, name))));
}

/** Problems: an id that does not match its file, an unknown severity or class, a closed S1/S2 without an asset that exists. */
export async function checkFindings(directory: string, root: string): Promise<string[]> {
  const problems: string[] = [];
  for (const finding of await readFindings(directory)) {
    const name = path.basename(finding.file, '.md');
    if (finding.id !== name) problems.push(`${finding.file}: id ${finding.id} does not match the file name`);
    if (!['S1', 'S2', 'S3'].includes(finding.severity)) problems.push(`${finding.file}: severity ${finding.severity} is not S1, S2 or S3`);
    if (!['layout', 'cue', 'affordance', 'copy', 'noise', 'engine', 'input'].includes(finding.class)) problems.push(`${finding.file}: class ${finding.class} is unknown`);
    if (finding.status === 'closed' && finding.severity !== 'S3') {
      const asset = finding.regression_asset;
      if (!asset || asset === 'none') { problems.push(`${finding.file}: closed ${finding.severity} without a regression asset`); continue; }
      const [file] = asset.split(/\s+/);
      const exists = await readFile(path.resolve(root, file!), 'utf8').then((text) => text.includes(finding.id), () => false);
      if (!exists) problems.push(`${finding.file}: regression asset ${file} is missing or does not name ${finding.id}`);
    }
  }
  return problems;
}
