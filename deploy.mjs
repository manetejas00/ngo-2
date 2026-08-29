import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const environment = process.argv[2] || 'staging';
const script = resolve(__dirname, 'scripts/deploy-hostinger.sh');
const result = spawnSync(script, [environment], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
