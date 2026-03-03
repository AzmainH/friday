import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(join(__dirname, '..', 'frontend'));
await import('../frontend/node_modules/vite/bin/vite.js');
