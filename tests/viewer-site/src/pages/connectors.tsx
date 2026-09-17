import Layout from '@theme/Layout';
import {EssContractViewer} from '../../../../dist/ess-contract-viewer.js';
import connectors from '../../../fixtures/ess/connectors.json';
export default function Contracts() {
  return <Layout title="Connector contracts"><main className="container margin-vert--lg"><h1>Connector contracts</h1><EssContractViewer document={connectors} id="connectors" /></main></Layout>;
}
