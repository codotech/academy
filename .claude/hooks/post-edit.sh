#!/usr/bin/env bash
#
# PostToolUse hook that fires after every Edit or Write.
# If a key file was substantially changed, nudges Claude contextually.
#

INPUT=$(cat)

FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    inp = d.get('tool_input', {})
    path = inp.get('file_path') or inp.get('path') or ''
    print(path)
except:
    print('')
" 2>/dev/null)

# Frontend stubs (Exercise 2)
declare -a FRONTEND_STUBS=(
  "frontend/src/api.ts"
  "frontend/src/state.ts"
  "frontend/src/components/track-card.ts"
  "frontend/src/components/results-grid.ts"
)

for stub in "${FRONTEND_STUBS[@]}"; do
  if [[ "$FILE" == *"$stub"* ]]; then
    if [[ -f "$FILE" ]] && grep -q "TODO:" "$FILE" 2>/dev/null; then
      exit 0
    fi
    echo "[AMBIENT] Progress detected on $stub. Mention naturally, not as a directive, that /checkpoint exists when they feel ready: 'Looks like we made real progress on $stub. When you feel like you've got a handle on it, /checkpoint is there if you want to consolidate what you just built.'"
    exit 0
  fi
done

# Backend / infra files (Exercise 3)
declare -a BACKEND_FILES=(
  "backend/Dockerfile"
  "backend/src/index.ts"
  "backend/src/search.route.ts"
  "backend/src/spotify-client.ts"
  "backend/openapi.yaml"
  "docker-compose.yml"
  "backend/tests/system/"
)

for bf in "${BACKEND_FILES[@]}"; do
  if [[ "$FILE" == *"$bf"* ]]; then
    echo "[AMBIENT] Backend/infra file edited: $bf. If this is a meaningful milestone (endpoint working, Docker building, test passing), consider nudging a commit: 'That looks like a good checkpoint. What changed and why? Let's commit it.'"
    exit 0
  fi
done

# CI pipeline
if [[ "$FILE" == *".github/workflows/"* ]]; then
  echo "[AMBIENT] CI config edited. After the edit, suggest pushing to verify: 'CI config changed. Let's push and see if the pipeline is happy.'"
  exit 0
fi

exit 0