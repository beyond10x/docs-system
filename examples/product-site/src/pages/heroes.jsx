import Layout from '@theme/Layout';
import {LandingHero} from '@beyond10x/docs-system/product';
import investigation from '@site/data/investigation.protocol-graph.json';
import commission from '@site/data/commission.domain-graph.json';
import staleRevision from '@site/data/stale-revision.case.json';
import money from '@site/data/money.code-pair.json';

const landing = (product) => ({format: 'b10x-product-landing/1', product: {actions: [], ...product}, sections: []});

const heroes = [
  landing({
    name: 'Protocol graph',
    eyebrow: 'Hero art · protocol-graph',
    promise: ['The protocol,', 'drawn from its own source.'],
    lede: 'The aside is investigation.protocol-graph.json, the graph of canon fixtures/investigation/protocol.yaml. The KPI row counts its nodes.',
    art: {kind: 'protocol-graph', data: investigation},
    kpis: ['nodes', 'actions', 'evidence', 'claims', 'outcomes'],
  }),
  landing({
    name: 'Domain graph',
    eyebrow: 'Hero art · domain-graph',
    promise: ['The domain,', 'as the specification says it.'],
    lede: 'The aside is commission.domain-graph.json, compiled from an ESS model. Entities take the product hue; the KPI row counts entities and relations.',
    art: {kind: 'domain-graph', data: commission, caption: 'commission.responsibility, from ess/ via the domain-graph emitter.'},
    kpis: ['entities', 'relations', 'lifecycles'],
  }),
  landing({
    name: 'Case card',
    eyebrow: 'Hero art · case',
    promise: ['Evidence for r1', 'says nothing about r2.'],
    lede: 'The aside is stale-revision.case.json: two canon evaluate runs over the same evidence, with only the case revision changed.',
    art: {kind: 'case', data: staleRevision, caption: 'UNKNOWN is not FALSE: the outcome waits for evidence about r2.'},
  }),
  landing({
    name: 'Code pair',
    eyebrow: 'Hero art · code-pair',
    promise: ['Write the specification.', 'Generate the contract.'],
    lede: 'The aside is money.code-pair.json: an excerpt of an ESS domain and the OpenAPI excerpt ess generate produced from it, both quoted verbatim.',
    art: {kind: 'code-pair', data: money},
  }),
];

export default function HeroShowcase() {
  return <Layout title="Hero art" description="Every hero art kind, rendered from generated data, with its KPI row." wrapperClassName="b10x-product-page">
    <main className="b10x-product">
      {heroes.map((data, index) => <div key={data.product.name} className="b10x-showcase__hero">
        <LandingHero data={data} titleId={`hero-${index}`} />
      </div>)}
    </main>
  </Layout>;
}
