#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:-}"
case "$environment" in
  staging)
    default_target="domains/test.avinyacarefoundation.org/public_html"
    default_url="https://test.avinyacarefoundation.org"
    ;;
  production)
    default_target="domains/avinyacarefoundation.org/public_html"
    default_url="https://avinyacarefoundation.org"
    ;;
  *)
    echo "Usage: $0 staging|production" >&2
    exit 2
    ;;
esac

: "${HOSTINGER_SSH_HOST:?Set HOSTINGER_SSH_HOST}"
: "${HOSTINGER_SSH_USER:?Set HOSTINGER_SSH_USER}"
HOSTINGER_SSH_PORT="${HOSTINGER_SSH_PORT:-65002}"
DEPLOY_TARGET="${DEPLOY_TARGET:-$default_target}"
DEPLOY_URL="${DEPLOY_URL:-$default_url}"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

expected_branch="staging"
[[ "$environment" == "production" ]] && expected_branch="main"
current_branch="${GITHUB_REF_NAME:-$(git branch --show-current)}"
if [[ "$current_branch" != "$expected_branch" ]]; then
  echo "Refusing $environment deploy from '$current_branch'; expected '$expected_branch'." >&2
  exit 1
fi

npm run build

release_id="${GITHUB_SHA:-$(git rev-parse HEAD)}"
archive="${RUNNER_TEMP:-/tmp}/avinya-${environment}-${release_id}.tar.gz"
git archive --format=tar.gz --output="$archive" HEAD

ssh_target="${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}"
remote_archive="avinya-deploy-${environment}-${release_id}.tar.gz"
ssh_options=(-p "$HOSTINGER_SSH_PORT" -o BatchMode=yes -o StrictHostKeyChecking=yes)
scp_options=(-P "$HOSTINGER_SSH_PORT" -o BatchMode=yes -o StrictHostKeyChecking=yes)

scp "${scp_options[@]}" "$archive" "$ssh_target:$remote_archive"

ssh "${ssh_options[@]}" "$ssh_target" bash -s -- "$DEPLOY_TARGET" "$remote_archive" "$release_id" <<'REMOTE_DEPLOY'
set -Eeuo pipefail
target="$1"
archive="$2"
release="$3"
stage="${target}.deploy-${release}"
backup="${target}.rollback"

cleanup() { rm -rf "$stage" "$archive"; }
trap cleanup EXIT

rm -rf "$stage"
mkdir -p "$stage"
tar -xzf "$archive" -C "$stage"

for required in index.html doctors.html admin.html .htaccess api/booking/index.php assets/logo.png; do
  [[ -s "$stage/$required" ]] || { echo "Missing release file: $required" >&2; exit 1; }
done

if command -v php >/dev/null 2>&1; then
  while IFS= read -r -d '' file; do php -l "$file" >/dev/null; done < <(find "$stage/api" -type f -name '*.php' -print0)
fi

mkdir -p "$target"
[[ -f "$target/.env" ]] || { echo "Remote $target/.env is missing; refusing deployment." >&2; exit 1; }
cp "$target/.env" "$stage/.env"

rm -rf "$backup"
mkdir -p "$backup"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.env' --exclude='storage/' "$target/" "$backup/"
  rsync -a --delete --exclude='.env' --exclude='storage/' "$stage/" "$target/"
else
  cp -a "$target/." "$backup/"
  find "$target" -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'storage' -exec rm -rf {} +
  cp -a "$stage/." "$target/"
fi
echo "$release" > "$target/.release"
REMOTE_DEPLOY

if ! node scripts/live-smoke.mjs "$DEPLOY_URL"; then
  echo "Post-deploy smoke test failed; rolling back $environment." >&2
  ssh "${ssh_options[@]}" "$ssh_target" bash -s -- "$DEPLOY_TARGET" <<'REMOTE_ROLLBACK'
set -Eeuo pipefail
target="$1"
backup="${target}.rollback"
[[ -d "$backup" ]] || { echo "Rollback backup is missing." >&2; exit 1; }
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.env' --exclude='storage/' "$backup/" "$target/"
else
  find "$target" -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'storage' -exec rm -rf {} +
  cp -a "$backup/." "$target/"
fi
REMOTE_ROLLBACK
  exit 1
fi

echo "$environment deployment $release completed and verified."
