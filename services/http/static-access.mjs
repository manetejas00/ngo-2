import { posix } from 'node:path';

/** Determine whether a URL points to server-side or deployment-only material. */
export function isPrivateStaticPath(path) {
  // Check the path that will actually be resolved on disk, not the raw URL.
  const lower = posix.normalize(`/${path}`).toLowerCase();
  const segments = lower.split('/').filter(Boolean);
  const privateRoots = new Set(['.git', '.github', '.agents', 'cache', 'data', 'config', 'docs', 'scripts', 'services', 'storage', 'test', 'tests']);
  return (lower.startsWith('/api/healthcare/') && lower.endsWith('.json')) || lower.endsWith('.php') || lower.endsWith('.mjs') || lower.includes('.env') ||
    lower.includes('/.git') || lower.includes('/storage/') || lower.includes('/cache/') ||
    privateRoots.has(segments[0]);
}
