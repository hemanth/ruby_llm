#!/usr/bin/env bash
# Build the deployed two-version site: 2.0 at $BASE/, 1.x at $BASE/v1/.
# Run directly. --serve to preview on :4000.
set -euo pipefail

# Drop the parent bundle's env so the docs Gemfile resolves on its own.
unset RUBYOPT RUBYLIB BUNDLE_GEMFILE BUNDLE_BIN_PATH BUNDLE_BIN BUNDLE_APP_CONFIG

ONE_X_REF="${ONE_X_REF:-ec673f21}"   # last clean 1.x docs commit
BASE="${BASE:-}"                     # Pages base path (empty for a custom domain at root)
PORT="${PORT:-4000}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
docs="$repo_root/docs"
site="${SITE:-$docs/_site}"
gemfile="$docs/Gemfile"
versions="$docs/_data/versions.yml"
registry="${MODEL_REGISTRY_FILE:-$repo_root/lib/ruby_llm/models.json}"
stable="$(ruby -ryaml -e 'puts YAML.load_file(ARGV[0])["stable"]' "$versions")"

next_src="$(mktemp -d)"; onex_src="$(mktemp -d)"
next_out="$(mktemp -d)"; onex_out="$(mktemp -d)"
trap 'rm -rf "$next_src" "$onex_src" "$next_out" "$onex_out"' EXIT

set_current() { ruby "$docs/bin/prepare_versions.rb" "$1" "$2" "$BASE"; }

echo "==> Building current docs (2.0 prerelease) -> /"
rsync -a --exclude='_site' --exclude='_data_serve' --exclude='vendor' --exclude='.jekyll-cache' --exclude='.bundle' "$docs/" "$next_src/"
set_current "$next_src/_data/versions.yml" next
( cd "$next_src" && BUNDLE_GEMFILE="$gemfile" bundle exec jekyll build --baseurl "$BASE" -d "$next_out" --quiet )

echo "==> Building API docs (RDoc) -> /api/"
SITE_BASE_URL="https://rubyllm.com${BASE}" "$docs/bin/build-api.sh" "$next_out/api"

echo "==> Building 1.x docs (frozen @ $ONE_X_REF) -> /v1/"
git -C "$repo_root" archive "$ONE_X_REF" docs/ | tar -x -C "$onex_src"
"$docs/bin/prepare_one_x_docs.rb" "$onex_src/docs"
cp "$docs/_includes/version_select.html" "$onex_src/docs/_includes/"
mkdir -p "$onex_src/docs/_data"
cp "$versions" "$onex_src/docs/_data/versions.yml"
set_current "$onex_src/docs/_data/versions.yml" "$stable"
perl -0pi -e 's{(\{% include components/header.html %\}\n)}{$1    {% include version_select.html %}\n}' \
  "$onex_src/docs/_layouts/default.html"
( cd "$onex_src/docs" && BUNDLE_GEMFILE="$gemfile" bundle exec jekyll build --baseurl "$BASE/v1" -d "$onex_out" --quiet )

echo "==> Assembling -> $site"
rm -rf "$site"; mkdir -p "$site/v1"
cp -a "$next_out/." "$site/"
cp -a "$onex_out/." "$site/v1/"
ruby "$docs/bin/build_version_redirects.rb" "$site" "$BASE"
cp "$registry" "$site/models.json"

echo "Done.  / = 2.0 prerelease   /v1/ = 1.x   /next/ = redirects   /models.json = live registry"
if [[ "${1:-}" == "--serve" ]]; then
  exec python3 -m http.server "$PORT" --directory "$site"
fi
