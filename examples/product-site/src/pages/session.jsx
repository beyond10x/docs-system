import Layout from '@theme/Layout';
import {CompositionGraph, SessionKpis, SessionTimeline, StepBars} from '@beyond10x/docs-system/session-charts';
import session from '@site/data/session.json';

export default function SessionShowcase() {
  return <Layout title="A session as a composition instance" description="One working session mapped onto protocols, lanes and the composition behind it." wrapperClassName="b10x-product-page">
    <main className="b10x-product b10x-showcase">
      <p className="b10x-kicker"><span className="b10x-kicker__dot" />Showcase · session-composition-instance</p>
      <h1>One night of governed design, as a composition instance</h1>
      <p className="b10x-showcase__lede">The work of 2026-10-04 between the operator, the design session, the orchestrator session and seven sub-agents, mapped onto the protocols and the composition it implied. Every mark is a timestamp from the session record or a pull request.</p>
      <SessionKpis data={session} />
      <SessionTimeline data={session} />
      <StepBars data={session} title="design.decision/1, step by step" description="Thirteen decisions. Almost all the time is before the decision; the hand-off to a draft takes seconds." />
      <CompositionGraph data={session} description="Triggers open protocols; protocols are taken by agents; agents act through capabilities; capabilities bind to connections. Numbers are cases observed in the session. Hover a node to trace it." />
      <p className="b10x-graph__source">Sources: the session transcript (user, tool-call and peer-message timestamps) and pull-request created and merged times. Peer times are arrival times in this session, not the peer's working time. Names are roles.</p>
    </main>
  </Layout>;
}
