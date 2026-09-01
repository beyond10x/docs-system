import fs from 'node:fs/promises';
import path from 'node:path';
import type {ChangeLedger} from './types.js';

const siteUrl = 'https://beyond10x.github.io/getting-started/changes';

export async function writeRss(out: string, ledger: ChangeLedger): Promise<void> {
  const items = ledger.changes.map((change) => `    <item>\n      <guid isPermaLink="false">${xml(change.key)}</guid>\n      <title>${xml(change.title)}</title>\n      <link>${xml(change.source.url)}</link>\n      <pubDate>${new Date(change.publishedAt).toUTCString()}</pubDate>\n      <description>${xml(change.summary)}</description>\n      <category>${xml(change.repository)}</category>\n      <category>${xml(change.impact)}</category>\n    </item>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n    <title>beyond10x ecosystem changes</title>\n    <link>${siteUrl}</link>\n    <description>Important releases, migrations, capabilities, and adopter actions across the public beyond10x ecosystem.</description>\n${items}\n  </channel></rss>\n`;
  await write(out, body);
}

export async function writeJsonFeed(out: string, ledger: ChangeLedger): Promise<void> {
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'beyond10x ecosystem changes',
    home_page_url: siteUrl,
    feed_url: 'https://beyond10x.github.io/getting-started/changes/feed.json',
    items: ledger.changes.map((change) => ({
      id: change.key,
      url: change.source.url,
      title: change.title,
      content_text: change.summary,
      date_published: change.publishedAt,
      tags: [change.repository, change.kind, change.impact, ...change.journeys],
    })),
  };
  await write(out, `${JSON.stringify(feed, null, 2)}\n`);
}

async function write(out: string, body: string): Promise<void> {
  await fs.mkdir(path.dirname(out), {recursive: true});
  await fs.writeFile(out, body, 'utf8');
}

function xml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
