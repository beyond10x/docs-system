import { jsx as _jsx } from "react/jsx-runtime";
/** The product layer's MDX vocabulary, available on every page without an import. */
import MDXComponents from '@theme-init/MDXComponents';
import { DomainGraph, ProtocolGraph } from '../charts.js';
import { EmptyState, Kind, ScrollableTable, Truth } from '../components.js';
import { CompositionGraph, SessionKpis, SessionTimeline, StatTiles, StepBars } from '../session-charts.js';
import { lazy, Suspense } from 'react';
import { loadedReferenceRenderers } from '../reference-registry.js';
import { CaseCard, CodePair, FamilyStrip, Feature, FeatureGrid, Flow, FlowStep, HeroArt, KindIcon, RelatedTools, StatusBadge, StatusStrip, StatusTable, Terminal } from '../product.js';
/** A thenable that calls back at once: React reads a lazy component from it without suspending. */
function settled(value) {
    const thenable = { then: (resolve) => { resolve(value); } };
    return thenable;
}
/**
 * The reference renderers load in a chunk of their own, so a docs page without a reference does not
 * carry their code. A page that imports `@b10x-reference/<id>.json` has loaded them before it
 * hydrates (see `reference-preload.ts`), and the component resolves in the same pass: React drops
 * the server HTML of a Suspense boundary that still waits when the page re-renders after mount.
 * Elsewhere the chunk loads on first use, and the server render waits for it.
 */
function deferred(pick) {
    const Lazy = lazy(() => {
        const loaded = loadedReferenceRenderers();
        return loaded ? settled({ default: pick(loaded) }) : import('../renderers.js').then((renderers) => ({ default: pick(renderers) }));
    });
    return function Deferred(props) {
        return _jsx(Suspense, { fallback: null, children: _jsx(Lazy, { ...props }) });
    };
}
const ApiReference = deferred((renderers) => renderers.ApiReference);
const AsyncApiReference = deferred((renderers) => renderers.AsyncApiReference);
const CliReference = deferred((renderers) => renderers.CliReference);
const OpenApiReference = deferred((renderers) => renderers.OpenApiReference);
export default {
    ...MDXComponents,
    ApiReference,
    AsyncApiReference,
    CaseCard,
    CliReference,
    CodePair,
    CompositionGraph,
    DomainGraph,
    EmptyState,
    FamilyStrip,
    Feature,
    FeatureGrid,
    Flow,
    FlowStep,
    HeroArt,
    Kind,
    KindIcon,
    OpenApiReference,
    ProtocolGraph,
    RelatedTools,
    SessionKpis,
    SessionTimeline,
    StatTiles,
    StatusBadge,
    StatusStrip,
    StatusTable,
    StepBars,
    table: ScrollableTable,
    Terminal,
    Truth,
};
