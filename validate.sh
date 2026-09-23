#!/usr/bin/env bash
# Runs the same checks as CI, locally. Safe to run repeatedly (idempotent).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "==> npm ci"
npm ci

echo "==> node --check"
node --check src/index.js

echo "==> npm test"
npm test

echo "==> npm audit"
npm audit --omit=dev --audit-level=high

echo "==> actionlint"
if ! command -v actionlint >/dev/null 2>&1; then
  bin_dir="$HOME/.cache/actionlint"
  mkdir -p "$bin_dir"
  if [ ! -x "$bin_dir/actionlint" ]; then
    # Official installer verifies its own download checksum before extracting.
    curl -fsSL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash \
      | bash -s -- latest "$bin_dir"
  fi
  export PATH="$bin_dir:$PATH"
fi
actionlint .github/workflows/*.yml

echo "==> all checks passed"
