/** Determine whether a URL points to server-side or deployment-only material. */
export function isPrivateStaticPath(path) {
  const lower = path.toLowerCase();
  const segments = lower.split('/').filter(Boolean);
  const privateRoots = new Set(['.git', '.github', '.agents', 'cache', 'config', 'docs', 'scripts', 'services', 'storage', 'test', 'tests']);
  return lower.endsWith('.php') || lower.endsWith('.mjs') || lower.includes('.env') ||
    lower.includes('/.git') || lower.includes('/storage/') || lower.includes('/cache/') ||
    privateRoots.has(segments[0]);
}
