#!/usr/bin/env bash
# Preview all versions and rebuild /next/ when the working tree changes.
# Run directly, not via bundle exec/rake.
#   docs/bin/serve.sh   |   PORT=4002 docs/bin/serve.sh
set -euo pipefail

unset RUBYOPT RUBYLIB BUNDLE_GEMFILE BUNDLE_BIN_PATH BUNDLE_BIN BUNDLE_APP_CONFIG

PORT="${PORT:-4000}"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
docs="$repo/docs"
site="${SITE:-$docs/_site}"

BASE="" "$docs/bin/build-versions.sh"
releases="$(ruby "$docs/bin/release_tags.rb" "$repo")"
read -r stable_ref onex_ref <<< "$releases"

rm -rf "$docs/_data_serve"
cp -a "$docs/_data" "$docs/_data_serve"
ruby "$docs/bin/prepare_versions.rb" "$docs/_data_serve/versions.yml" next "" "$stable_ref" "$onex_ref"
serve_cfg="$docs/_config_serve.yml"
printf "data_dir: _data_serve\nkeep_files: ['api']\n" > "$serve_cfg"
watcher=""
cleanup() {
  if [[ -n "$watcher" ]]; then kill "$watcher" 2>/dev/null || true; fi
  rm -rf "$docs/_data_serve" "$serve_cfg"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$docs"
BUNDLE_GEMFILE="$docs/Gemfile" bundle exec jekyll build --watch --baseurl /next \
  --destination "$site/next" --config _config.yml,_config_serve.yml &
watcher=$!
echo "==> Serving http://localhost:$PORT/ (stable), /next/ (working tree), and /v1/"
python3 -m http.server "$PORT" --directory "$site"
