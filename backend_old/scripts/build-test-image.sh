#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker build -t music-finder-backend:test .
