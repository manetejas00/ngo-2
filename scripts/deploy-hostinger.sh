#!/usr/bin/env bash
set -Eeu

export PATH="$HOME/.node/bin:$PATH"

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
ssh_options=(-p "$HOSTINGER_SSH_PORT" -o BatchMode=yes -o StrictHostKeyChecking=no)
scp_options=(-P "$HOSTINGER_SSH_PORT" -o BatchMode=yes -o StrictHostKeyChecking=no)

scp "${scp_options[@]}" "$archive" "$ssh_target:$remote_archive"

ssh "${ssh_options[@]}" "$ssh_target" bash -s -- "$DEPLOY_TARGET" "$remote_archive" "$release_id" <<'REMOTE_DEPLOY'
set -Eeu
copy_release_files() {
  local release_source="$1" release_target="$2" file relative release_temp
  mkdir -p "$release_target"
  release_temp="$(mktemp -d "${release_target}.pending-XXXXXX")"
  while IFS= read -r -d '' file; do
    relative="${file#"$release_source/"}"
    case "$relative" in .env|.env.*|storage/*|cache/*|.git/*|node_modules/*) continue ;; esac
    mkdir -p "$(dirname "$release_target/$relative")"
    cp -p "$file" "$release_temp/file"
    mv -f "$release_temp/file" "$release_target/$relative"
  done < <(find "$release_source" \( -name .git -o -name node_modules -o -name storage -o -name cache \) -type d -prune -o -type f -print0)
  # Remove retired published files only after replacements are available.
  while IFS= read -r -d '' file; do
    relative="${file#"$release_target/"}"
    case "$relative" in .env|.env.*|.release|storage/*|cache/*|.git/*|node_modules/*) continue ;; esac
    if [[ ! -f "$release_source/$relative" ]]; then rm -f "$file"; fi
  done < <(find "$release_target" \( -name .git -o -name node_modules -o -name storage -o -name cache \) -type d -prune -o -type f -print0)
  rmdir "$release_temp"
}

target="$1"
archive="$2"
release="$3"
stage="${target}.deploy-${release}"
backup="${target}.rollback"
# Runtime records, secrets and installed dependencies are preserved during deploy and rollback.

cleanup() { rm -rf "$stage" "$archive"; }
trap cleanup EXIT

rm -rf "$stage"
mkdir -p "$stage"
tar -xzf "$archive" -C "$stage"

for required in index.html doctors.html admin.html .htaccess api/booking/index.php assets/logo.png; do
  [[ -s "$stage/$required" ]] || { echo "Missing release file: $required" >&2; exit 1; }
done

if command -v php >/dev/null 2>&1; then
  find "$stage/api" -type f -name '*.php' -exec php -l {} + >/dev/null
fi

mkdir -p "$target"
[[ -f "$target/.env" ]] || { echo "Remote $target/.env is missing; refusing deployment." >&2; exit 1; }
cp "$target/.env" "$stage/.env"

rm -rf "$backup"
mkdir -p "$backup"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.env' --exclude='.env.production' --exclude='.env.staging' --exclude='storage/' --exclude='cache/' --exclude='.git/' --exclude='node_modules/' "$target/" "$backup/"
  rsync -a --delete --exclude='.env' --exclude='.env.production' --exclude='.env.staging' --exclude='storage/' --exclude='cache/' --exclude='.git/' --exclude='node_modules/' "$stage/" "$target/"
else
  cp -a "$target/." "$backup/"
  copy_release_files "$stage" "$target"
fi
echo "$release" > "$target/.release"
REMOTE_DEPLOY

if ! node scripts/live-smoke.mjs "$DEPLOY_URL"; then
  echo "Post-deploy smoke test failed; rolling back $environment." >&2
  ssh "${ssh_options[@]}" "$ssh_target" bash -s -- "$DEPLOY_TARGET" <<'REMOTE_ROLLBACK'
set -Eeu
copy_release_files() {
  local release_source="$1" release_target="$2" file relative release_temp
  mkdir -p "$release_target"
  release_temp="$(mktemp -d "${release_target}.pending-XXXXXX")"
  while IFS= read -r -d '' file; do
    relative="${file#"$release_source/"}"
    case "$relative" in .env|.env.*|storage/*|cache/*|.git/*|node_modules/*) continue ;; esac
    mkdir -p "$(dirname "$release_target/$relative")"
    cp -p "$file" "$release_temp/file"
    mv -f "$release_temp/file" "$release_target/$relative"
  done < <(find "$release_source" \( -name .git -o -name node_modules -o -name storage -o -name cache \) -type d -prune -o -type f -print0)
  # Remove retired published files only after replacements are available.
  while IFS= read -r -d '' file; do
    relative="${file#"$release_target/"}"
    case "$relative" in .env|.env.*|.release|storage/*|cache/*|.git/*|node_modules/*) continue ;; esac
    if [[ ! -f "$release_source/$relative" ]]; then rm -f "$file"; fi
  done < <(find "$release_target" \( -name .git -o -name node_modules -o -name storage -o -name cache \) -type d -prune -o -type f -print0)
  rmdir "$release_temp"
}

target="$1"
backup="${target}.rollback"
[[ -d "$backup" ]] || { echo "Rollback backup is missing." >&2; exit 1; }
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.env' --exclude='.env.production' --exclude='.env.staging' --exclude='storage/' --exclude='cache/' --exclude='.git/' --exclude='node_modules/' "$backup/" "$target/"
else
  copy_release_files "$backup" "$target"
fi
REMOTE_ROLLBACK
  exit 1
fi

echo "$environment deployment $release completed and verified."
