import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Load the optional local environment file without overriding existing values. */
export async function loadEnvironment(root, environment = process.env) {
  const envFile = environment.NODE_ENV === 'production' ? '.env.production' : '.env';
  try {
    const content = await readFile(join(root, envFile), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...values] = trimmed.split('=');
      const name = key.trim();
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (name && environment[name] === undefined) environment[name] = value;
    }
  } catch (error) {
    // Deployment may supply variables directly, but other read failures need attention.
    if (error.code !== 'ENOENT') throw error;
  }
}
