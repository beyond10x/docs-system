/** The product layer's MDX vocabulary, available on every page without an import. */
import MDXComponents from '@theme-init/MDXComponents';
import {DomainGraph, ProtocolGraph} from '../charts.js';
import {EmptyState, Kind, Truth} from '../components.js';
import {CompositionGraph, SessionKpis, SessionTimeline, StatTiles, StepBars} from '../session-charts.js';
import {Feature, FeatureGrid, Flow, FlowStep, RelatedTools, StatusBadge, StatusStrip, Terminal} from '../product.js';

export default {
  ...MDXComponents,
  CompositionGraph,
  DomainGraph,
  EmptyState,
  Feature,
  FeatureGrid,
  Flow,
  FlowStep,
  Kind,
  ProtocolGraph,
  RelatedTools,
  SessionKpis,
  SessionTimeline,
  StatTiles,
  StatusBadge,
  StatusStrip,
  StepBars,
  Terminal,
  Truth,
};
