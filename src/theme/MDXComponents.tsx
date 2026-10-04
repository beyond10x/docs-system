/** The product layer's MDX vocabulary, available on every page without an import. */
import MDXComponents from '@theme-init/MDXComponents';
import {DomainGraph, ProtocolGraph} from '../charts.js';
import {EmptyState, Kind, Truth} from '../components.js';
import {CompositionGraph, SessionKpis, SessionTimeline, StatTiles, StepBars} from '../session-charts.js';
import {CaseCard, CodePair, FamilyStrip, Feature, FeatureGrid, Flow, FlowStep, HeroArt, KindIcon, RelatedTools, StatusBadge, StatusStrip, StatusTable, Terminal} from '../product.js';

export default {
  ...MDXComponents,
  CaseCard,
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
  ProtocolGraph,
  RelatedTools,
  SessionKpis,
  SessionTimeline,
  StatTiles,
  StatusBadge,
  StatusStrip,
  StatusTable,
  StepBars,
  Terminal,
  Truth,
};
