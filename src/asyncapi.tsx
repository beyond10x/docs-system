import {useMemo, useRef} from 'react';
import type {ReactNode} from 'react';
import {ActionChip, Breakable, DownloadLink, entries, Examples, follow, heading, isRecord, LazyDetails, pointerTokens, Prose, RefContext, refName, SchemaCards, SchemaView, slug, useOpenOnHash} from './api-common.js';
import type {JsonSchema, ReferenceContext} from './api-common.js';
import {ScrollableTable} from './scrollable-table.js';

type Ref = {$ref: string};
interface AsyncApiMessage {name?: string; title?: string; summary?: string; description?: string; contentType?: string; payload?: JsonSchema | {schemaFormat?: string; schema?: JsonSchema}; headers?: JsonSchema; correlationId?: {location?: string; description?: string} | Ref; examples?: Array<{name?: string; summary?: string; payload?: unknown; headers?: unknown}>}
interface AsyncApiParameter {description?: string; enum?: string[]; default?: string; examples?: string[]; location?: string}
interface AsyncApiChannel {address?: string | null; title?: string; summary?: string; description?: string; messages?: Record<string, AsyncApiMessage | Ref>; parameters?: Record<string, AsyncApiParameter | Ref>; servers?: Ref[]}
interface AsyncApiOperation {action: 'send' | 'receive'; channel: Ref; title?: string; summary?: string; description?: string; messages?: Ref[]; reply?: {channel?: Ref; messages?: Ref[]; address?: {location?: string; description?: string}}}
interface AsyncApiServer {host?: string; protocol?: string; protocolVersion?: string; pathname?: string; title?: string; summary?: string; description?: string}
export interface AsyncApiDocument {
  asyncapi: string;
  info: {title: string; version: string; description?: string};
  defaultContentType?: string;
  servers?: Record<string, AsyncApiServer | Ref>;
  channels?: Record<string, AsyncApiChannel | Ref>;
  operations?: Record<string, AsyncApiOperation | Ref>;
  components?: {schemas?: Record<string, JsonSchema>; messages?: Record<string, AsyncApiMessage | Ref>; [key: string]: unknown};
}

export interface AsyncApiReferenceProps {
  document: AsyncApiDocument;
  /** Where the unchanged source document can be downloaded; shown as a download link. */
  sourceUrl?: string;
  /** The file name the download carries, shown beside the link. */
  sourceName?: string;
  /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
  headingLevel?: 2 | 3;
  /** Heading text instead of the document's `info.title`. */
  title?: string;
}

const pointer = (...tokens: string[]): string => `#/${tokens.map((token) => token.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;

/** Page anchors for AsyncAPI pointers; a channel's message that points at a component message links to that card. */
function asyncApiAnchor(document: AsyncApiDocument): (ref: string) => string | undefined {
  return (ref) => {
    const tokens = pointerTokens(ref);
    if (!tokens) return undefined;
    // The page holds a card only for what the document declares: a reference to anything else
    // gets no anchor, and its caller writes text instead of a link.
    const target = follow(document, {$ref: ref}).value;
    if (target === undefined) return undefined;
    if (tokens[0] === 'components' && tokens.length === 3 && tokens[1] === 'schemas') return `schema-${tokens[2]}`;
    if (!isRecord(target)) return undefined;
    if (tokens[0] === 'components' && tokens.length === 3 && tokens[1] === 'messages') return `message-${tokens[2]}`;
    if (tokens[0] === 'operations' && tokens.length === 2) return `operation-${tokens[1]}`;
    if (tokens[0] === 'channels' && tokens.length === 2) return `channel-${tokens[1]}`;
    if (tokens[0] === 'channels' && tokens.length === 4 && tokens[2] === 'messages') {
      const {ref: last} = follow(document, {$ref: ref});
      const target = last && last !== ref ? pointerTokens(last) : undefined;
      return target?.[0] === 'components' && target[1] === 'messages' && target.length === 3 ? `message-${target[2]}` : `channel-${tokens[1]}`;
    }
    return undefined;
  };
}

function payloadSchema(message: AsyncApiMessage): JsonSchema | undefined {
  const payload = message.payload;
  if (!isRecord(payload)) return undefined;
  return 'schemaFormat' in payload && isRecord(payload.schema) ? payload.schema as JsonSchema : payload as JsonSchema;
}

export function AsyncApiReference({document, sourceUrl, sourceName, headingLevel = 2, title}: AsyncApiReferenceProps): ReactNode {
  if (!isRecord(document) || typeof document.asyncapi !== 'string' || !/^3\.0\.\d+$/.test(document.asyncapi)) throw new Error(`AsyncApiReference supports AsyncAPI 3.0, received ${isRecord(document) ? String(document.asyncapi) : typeof document}`);
  const context = useMemo<ReferenceContext>(() => ({root: document, anchor: asyncApiAnchor(document)}), [document]);
  const root = useRef<HTMLElement>(null);
  useOpenOnHash(root);
  const info = isRecord(document.info) ? document.info : {title: 'Events', version: ''};
  const base = `asyncapi-${slug(info.title)}`;
  const TitleHeading = heading(headingLevel);
  const Section = heading(headingLevel + 1);
  const Item = heading(headingLevel + 2);
  const operations = entries<AsyncApiOperation | Ref>(document.operations).map(([name, raw]) => [name, follow<AsyncApiOperation>(document, raw).value] as const).filter(([, operation]) => isRecord(operation)) as Array<[string, AsyncApiOperation]>;
  const channels = entries<AsyncApiChannel | Ref>(document.channels).map(([name, raw]) => [name, follow<AsyncApiChannel>(document, raw).value] as const).filter(([, channel]) => isRecord(channel)) as Array<[string, AsyncApiChannel]>;
  const messages = entries<AsyncApiMessage | Ref>(document.components?.messages).map(([name, raw]) => [name, follow<AsyncApiMessage>(document, raw).value] as const).filter(([, message]) => isRecord(message)) as Array<[string, AsyncApiMessage]>;
  const servers = entries<AsyncApiServer | Ref>(document.servers).map(([name, raw]) => [name, follow<AsyncApiServer>(document, raw).value] as const).filter(([, server]) => isRecord(server)) as Array<[string, AsyncApiServer]>;
  const schemas = entries<JsonSchema>(document.components?.schemas);
  const channelOf = (operation: AsyncApiOperation): {name?: string; channel?: AsyncApiChannel; anchor?: string} => {
    const ref = isRecord(operation.channel) ? operation.channel.$ref : undefined;
    const tokens = typeof ref === 'string' ? pointerTokens(ref) : undefined;
    return {name: tokens?.[0] === 'channels' ? tokens[1] : ref ? refName(ref) : undefined, channel: ref ? follow<AsyncApiChannel>(document, {$ref: ref}).value : undefined, anchor: typeof ref === 'string' ? context.anchor(ref) : undefined};
  };
  const address = (name: string | undefined, channel: AsyncApiChannel | undefined): string => typeof channel?.address === 'string' ? channel.address : name ?? '—';
  return <RefContext.Provider value={context}>
    <section className="b10x-asyncapi b10x-api" aria-labelledby={`${base}-title`} ref={root}>
      <header className="b10x-api-header">
        <p className="b10x-eyebrow">ASYNCAPI {document.asyncapi}</p>
        <TitleHeading id={`${base}-title`}>{title ?? info.title}</TitleHeading>
        <Prose text={info.description} />
        <dl className="b10x-facts">
          <div><dt>Version</dt><dd>{info.version}</dd></div>
          <div><dt>Operations</dt><dd>{operations.length}</dd></div>
          <div><dt>Channels</dt><dd>{channels.length}</dd></div>
          <div><dt>Messages</dt><dd>{messages.length}</dd></div>
          {document.defaultContentType && <div><dt>Content type</dt><dd><code>{document.defaultContentType}</code></dd></div>}
        </dl>
        <DownloadLink url={sourceUrl} name={sourceName} label="Download AsyncAPI source" />
      </header>
      {servers.length > 0 && <section className="b10x-api-servers" aria-labelledby={`${base}-servers`}>
        <Section id={`${base}-servers`}>Servers</Section>
        <ScrollableTable label="Servers"><thead><tr><th scope="col">Server</th><th scope="col">Host</th><th scope="col">Protocol</th><th scope="col">Description</th></tr></thead>
          <tbody>{servers.map(([name, server]) => <tr key={name}><td><code>{name}</code></td><td><code><Breakable text={`${server.host ?? ''}${server.pathname ?? ''}`} /></code></td><td>{[server.protocol, server.protocolVersion].filter(Boolean).join(' ')}</td><td><Prose text={server.description ?? server.summary ?? server.title} /></td></tr>)}</tbody>
        </ScrollableTable>
      </section>}
      {operations.length > 0 && <nav className="b10x-api-index" aria-label={`${info.title} operations`}>
        <ul>{operations.map(([name, operation]) => {
          const {name: channelName, channel} = channelOf(operation);
          return <li key={name}><a href={`#operation-${name}`}><ActionChip action={operation.action} /><code className="b10x-api-path"><Breakable text={address(channelName, channel)} /></code><span>{operation.title ?? operation.summary ?? name}</span></a></li>;
        })}</ul>
      </nav>}
      {operations.length > 0 && <section className="b10x-api-group" aria-labelledby={`${base}-operations`}>
        <Section id={`${base}-operations`}>Operations</Section>
        <div className="b10x-api-operations">{operations.map(([name, operation]) => {
          const {name: channelName, channel, anchor: channelAnchor} = channelOf(operation);
          const replyRef = isRecord(operation.reply) && isRecord(operation.reply.channel) && typeof operation.reply.channel.$ref === 'string' ? operation.reply.channel.$ref : undefined;
          const replyAnchor = replyRef ? context.anchor(replyRef) : undefined;
          return <details className="b10x-api-operation" id={`operation-${name}`} key={name}>
            <summary><ActionChip action={operation.action} /><code className="b10x-api-path"><Breakable text={address(channelName, channel)} /></code><Item>{operation.title ?? name}</Item></summary>
            <div className="b10x-api-operation__body">
              <p className="b10x-api-operation-id">Operation <code><Breakable text={name} /></code></p>
              <Prose text={operation.summary} className="b10x-api-lede" />
              <Prose text={operation.description} />
              <dl className="b10x-api-pairs">
                <div><dt>Channel</dt><dd>{!channelName ? '—' : channelAnchor ? <a href={`#${channelAnchor}`}><code><Breakable text={channelName} /></code></a> : <code><Breakable text={channelName} /></code>}</dd></div>
                <div><dt>{operation.action === 'receive' ? 'Receives' : 'Sends'}</dt><dd><MessageRefs refs={operation.messages ?? []} /></dd></div>
                {isRecord(operation.reply) && <div><dt>Reply</dt><dd>{replyRef ? (replyAnchor ? <a href={`#${replyAnchor}`}><code>{refName(replyRef)}</code></a> : <code>{refName(replyRef)}</code>) : operation.reply.address?.location ? <code>{operation.reply.address.location}</code> : '—'}{operation.reply.messages && <MessageRefs refs={operation.reply.messages} />}</dd></div>}
              </dl>
            </div>
          </details>;
        })}</div>
      </section>}
      {channels.length > 0 && <section className="b10x-api-group" aria-labelledby={`${base}-channels`}>
        <Section id={`${base}-channels`}>Channels</Section>
        <div className="b10x-schema-grid b10x-api-cards">{channels.map(([name, channel]) => {
          const parameters = entries<AsyncApiParameter | Ref>(channel.parameters).map(([key, raw]) => [key, follow<AsyncApiParameter>(document, raw).value] as const).filter(([, parameter]) => isRecord(parameter)) as Array<[string, AsyncApiParameter]>;
          const users = operations.filter(([, operation]) => channelOf(operation).name === name);
          return <details className="b10x-schema-card" id={`channel-${name}`} key={name}>
            <summary><code><Breakable text={address(name, channel)} /></code><span className="b10x-schema-card__type">{channel.title ?? 'channel'}</span></summary>
            <div>
              <Prose text={channel.summary} className="b10x-api-lede" />
              <Prose text={channel.description} />
              {channel.address === null && <p className="b10x-schema-note">The address is dynamic or unknown.</p>}
              {parameters.length > 0 && <ScrollableTable label={`Parameters of ${name}`}><thead><tr><th scope="col">Parameter</th><th scope="col">Values</th><th scope="col">Description</th></tr></thead>
                <tbody>{parameters.map(([key, parameter]) => <tr key={key}><td><code>{`{${key}}`}</code></td><td>{Array.isArray(parameter.enum) ? parameter.enum.map((value) => <code key={value}>{value}</code>) : 'any'}{parameter.default !== undefined && <> default <code>{parameter.default}</code></>}</td><td><Prose text={parameter.description} />{parameter.location && <p className="b10x-schema-note">From <code>{parameter.location}</code></p>}</td></tr>)}</tbody>
              </ScrollableTable>}
              <dl className="b10x-api-pairs">
                <div><dt>Messages</dt><dd><MessageRefs refs={entries<AsyncApiMessage | Ref>(channel.messages).map(([key]) => ({$ref: pointer('channels', name, 'messages', key)}))} /></dd></div>
                {users.length > 0 && <div><dt>Operations</dt><dd><ul className="b10x-api-inline-list">{users.map(([key, operation]) => <li key={key}><a href={`#operation-${key}`}><ActionChip action={operation.action} /> <span>{operation.title ?? key}</span></a></li>)}</ul></dd></div>}
              </dl>
            </div>
          </details>;
        })}</div>
      </section>}
      {messages.length > 0 && <section className="b10x-api-group" aria-labelledby={`${base}-messages`}>
        <Section id={`${base}-messages`}>Messages</Section>
        <div className="b10x-schema-grid b10x-api-cards">{messages.map(([name, message]) => <details className="b10x-schema-card" id={`message-${name}`} key={name}>
          <summary><code><Breakable text={message.name ?? name} /></code><span className="b10x-schema-card__type">{message.contentType ?? document.defaultContentType ?? 'message'}</span></summary>
          <div><Message message={message} name={name} /></div>
        </details>)}</div>
      </section>}
      {schemas.length > 0 && <section className="b10x-api-schemas" aria-labelledby={`${base}-schemas`}>
        <Section id={`${base}-schemas`}>Schemas</Section>
        <SchemaCards schemas={schemas} anchor={(name) => `schema-${name}`} />
      </section>}
    </section>
  </RefContext.Provider>;
}

function Message({message, name}: {message: AsyncApiMessage; name: string}): ReactNode {
  const payload = payloadSchema(message);
  return <>
    {message.title && message.title !== name && <p className="b10x-schema-title">{message.title}</p>}
    <Prose text={message.summary} className="b10x-api-lede" />
    <Prose text={message.description} />
    <p className="b10x-schema-label">Payload</p>
    {payload ? <SchemaView schema={payload} /> : <p className="b10x-schema-note">No payload schema.</p>}
    {isRecord(message.headers) && <><p className="b10x-schema-label">Headers</p><SchemaView schema={message.headers} /></>}
    {isRecord(message.correlationId) && 'location' in message.correlationId && <p className="b10x-schema-note">Correlation id at <code>{String(message.correlationId.location)}</code></p>}
    <Examples examples={message.examples} />
  </>;
}

/** Message references as links to their cards, each with its payload expandable in place. */
function MessageRefs({refs}: {refs: Ref[]}): ReactNode {
  return <RefContext.Consumer>{(context) => {
    const list = refs.filter((ref) => isRecord(ref) && typeof ref.$ref === 'string');
    if (!list.length) return <>—</>;
    return <ul className="b10x-api-messages">{list.map((ref) => {
      const message = follow<AsyncApiMessage>(context.root, ref).value;
      const anchor = context.anchor(ref.$ref);
      const label = isRecord(message) ? message.name ?? message.title ?? refName(ref.$ref) : refName(ref.$ref);
      const payload = isRecord(message) ? payloadSchema(message) : undefined;
      return <li key={ref.$ref}>
        {anchor ? <a href={`#${anchor}`}><code><Breakable text={label} /></code></a> : <code><Breakable text={label} /></code>}
        {payload && <LazyDetails className="b10x-schema-more" summary={<>Show payload<span className="b10x-sr-only"> of {label}</span></>} fallback={anchor ? <p className="b10x-schema-note">See <a href={`#${anchor}`}><code><Breakable text={label} /></code></a>.</p> : null}>{() => <SchemaView schema={payload} />}</LazyDetails>}
      </li>;
    })}</ul>;
  }}</RefContext.Consumer>;
}
