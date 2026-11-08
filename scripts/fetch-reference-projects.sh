#!/usr/bin/env bash
# Re-clone the reference projects listed in docs/reference-projects.json.
#
# They are deliberately NOT vendored into this repository. Together they are
# several hundred megabytes, most of it history and build assets we will never
# read, and one of them has no licence at all — vendoring that would be
# republishing someone's all-rights-reserved code. The registry is the durable
# artifact; this script rebuilds the working copies whenever they are needed.
#
#   ./scripts/fetch-reference-projects.sh              # clone all into ./reference/
#   ./scripts/fetch-reference-projects.sh Magyar       # clone only matching repos
#   DEPTH=full ./scripts/fetch-reference-projects.sh   # full history, not --depth 1
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/docs/reference-projects.json"
DEST="${DEST:-$ROOT/reference}"
FILTER="${1:-}"

PY="$(command -v python3 || command -v python || true)"
[ -n "$PY" ] || { echo "python3 (or python) is required to read the registry" >&2; exit 1; }
[ -f "$REGISTRY" ] || { echo "registry not found: $REGISTRY" >&2; exit 1; }

mkdir -p "$DEST"
echo "cloning into $DEST"
echo

"$PY" - "$REGISTRY" "$FILTER" <<'PY' | while IFS='|' read -r repo url licence integration; do
import json, sys
reg, filt = sys.argv[1], sys.argv[2]
for p in json.load(open(reg))["projects"]:
    if filt and filt.lower() not in p["repo"].lower():
        continue
    print("|".join([p["repo"], p["url"], p["licence"], p["integration"]]))
PY
  name="${repo##*/}"
  printf '%-34s %-22s ' "$repo" "[$integration]"
  if [ -d "$DEST/$name/.git" ]; then
    echo "already present"
    continue
  fi
  args=(--quiet)
  [ "${DEPTH:-shallow}" = "shallow" ] && args+=(--depth 1)
  if timeout "${TIMEOUT:-300}" git clone "${args[@]}" "$url.git" "$DEST/$name" 2>/dev/null; then
    echo "ok"
    printf '%s\nLicence: %s\nIntegration: %s\nSee docs/PROJECT_REGISTRY.md before reusing anything from this repository.\n' \
      "$url" "$licence" "$integration" > "$DEST/$name/_REGISTRY_NOTE.txt"
  else
    echo "FAILED (network, size, or the repository moved)"
  fi
done

echo
echo "Reminder: 'ideas-only' means study it, copy nothing."
echo "Licences and verdicts: docs/PROJECT_REGISTRY.md"
