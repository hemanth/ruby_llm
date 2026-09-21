#!/usr/bin/env bash
# Build the RDoc API docs into the given directory, landing on the RubyLLM module page.
#   docs/bin/build-api.sh <output-dir> [source-root]
set -euo pipefail

out="${1:?usage: build-api.sh <output-dir>}"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_root="${2:-$repo}"
case "$out" in /*) ;; *) out="$repo/$out" ;; esac

( cd "$source_root" && BUNDLE_GEMFILE="$repo/Gemfile" bundle exec rdoc --output "$out" --quiet lib )
( cd "$repo" && bundle exec ruby docs/bin/export-api-markdown.rb "$out" "$source_root" )

# Both pages live at the same depth, so the module's relative links work at /api/.
cp "$out/RubyLLM.html" "$out/index.html"

( cd "$repo" && bundle exec ruby docs/bin/postprocess_api_seo.rb "$out" "${SITE_BASE_URL:-https://rubyllm.com}" )
