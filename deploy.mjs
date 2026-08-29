import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const environment = process.argv[2] || 'staging';
const script = resolve(import.meta.dirname, 'scripts/deploy-hostinger.sh');
const result = spawnSync(script, [environment], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
