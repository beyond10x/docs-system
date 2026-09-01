import fs from 'node:fs/promises';
import path from 'node:path';
import type {ChangeLedger, ChangeLedgerEntry, FeedScope} from './types.js';

const origin = 'https://beyond10x.github.io';

export interface FeedWriteOptions {
  scope?: FeedScope;
  homePageUrl?: string;
  feedUrl?: string;
  title?: string;
}

export async function writeRss(out: string, ledger: ChangeLedger, options: FeedWriteOptions = {}): Promise<void> {
  const scope = options.scope ?? 'all';
  const items = selectFeedEntries(ledger, scope).map((change) => `    <item>\n      <guid isPermaLink="false">${xml(change.key)}</guid>\n      <title>${xml(change.title)}</title>\n      <link>${xml(change.source.url)}</link>\n      <pubDate>${new Date(change.publishedAt).toUTCString()}</pubDate>\n      <description>${xml(change.summary)}</description>\n      <category>${xml(change.repository)}</category>\n      <category>${xml(change.impact)}</category>\n      <category>${xml(change.channel)}</category>\n    </item>`).join('\n');
  const homePageUrl = options.homePageUrl ?? defaultHomePage(scope);
  const title = options.title ?? defaultTitle(scope);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n    <title>${xml(title)}</title>\n    <link>${xml(homePageUrl)}</link>\n    <description>Important releases, migrations, capabilities, and adopter actions across the public beyond10x ecosystem.</description>\n${items}\n  </channel></rss>\n`;
  await write(out, body);
}

export async function writeJsonFeed(out: string, ledger: ChangeLedger, options: FeedWriteOptions = {}): Promise<void> {
  const scope = options.scope ?? 'all';
  const homePageUrl = options.homePageUrl ?? defaultHomePage(scope);
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: options.title ?? defaultTitle(scope),
    home_page_url: homePageUrl,
    feed_url: options.feedUrl ?? `${homePageUrl.replace(/\/$/, '')}/feed.json`,
    items: selectFeedEntries(ledger, scope).map((change) => ({
      id: change.key,
      url: change.source.url,
      title: change.title,
      content_text: change.summary,
      date_published: change.publishedAt,
      tags: [change.repository, change.kind, change.impact, change.channel, ...change.journeys],
    })),
  };
  await write(out, `${JSON.stringify(feed, null, 2)}\n`);
}

export function selectFeedEntries(ledger: ChangeLedger, scope: FeedScope): ChangeLedgerEntry[] {
  if (scope === 'all') return ledger.changes;
  const channel = scope === 'impact' ? 'impact' : 'releases';
  return ledger.changes.filter((change) => change.channel === channel);
}

async function write(out: string, body: string): Promise<void> {
  await fs.mkdir(path.dirname(out), {recursive: true});
  await fs.writeFile(out, body, 'utf8');
}

function xml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function defaultHomePage(scope: FeedScope): string { return scope === 'releases' ? `${origin}/releases/` : `${origin}/changes/`; }
function defaultTitle(scope: FeedScope): string { return scope === 'releases' ? 'beyond10x releases' : scope === 'impact' ? 'beyond10x impactful changes' : 'beyond10x ecosystem changes'; }
