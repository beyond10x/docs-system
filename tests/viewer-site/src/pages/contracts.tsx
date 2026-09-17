import Layout from '@theme/Layout';
import {EssContractViewer} from '../../../../dist/ess-contract-viewer.js';
import mandate from '../../../fixtures/ess/mandate.json';
export default function Contracts() {
  return <Layout title="Contract viewer"><main className="container margin-vert--lg"><h1>Explore contracts</h1><EssContractViewer document={mandate} id="mandate" /></main></Layout>;
}
