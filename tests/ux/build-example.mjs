// Builds examples/product-site against this checkout and prints the output directory.
import {buildProductSite} from '../product-site-server.mjs';

process.stdout.write(`${await buildProductSite()}\n`);
