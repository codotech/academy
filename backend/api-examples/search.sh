#!/usr/bin/env bash
set -euo pipefail

# Music Finder API — curl examples for every endpoint and error case
#
# Usage:
#   chmod +x search.sh
#   ./search.sh
#
# Or run individual commands by copy-pasting them.
#
# Requires: curl, a running backend at http://localhost:3000
# Start the backend: npm run dev (from demo/backend/)

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=== Music Finder API — curl examples ==="
echo "Base URL: $BASE_URL"
echo ""

# ---------------------------------------------------------------------------
# 1. Health check
#    Proves: service is running and responding on the expected port.
#    Render polls this endpoint during deployment. If it fails, Render holds
#    traffic on the previous container.
# ---------------------------------------------------------------------------

echo "--- 1. GET /health (expect 200) ---"
curl -sS -i "${BASE_URL}/health"
echo ""
echo ""

# Expected response:
#   HTTP/1.1 200 OK
#   Content-Type: application/json
#
#   {"status":"ok"}


# ---------------------------------------------------------------------------
# 2. Happy path search
#    Proves: the backend can authenticate with Spotify, execute a search,
#    and return a response matching SearchResponseSchema (results array of Track).
#    Field names are snake_case: id, name, artist, album, preview_url,
#    external_url, cover_url.
# ---------------------------------------------------------------------------

echo "--- 2. GET /api/search?q=radiohead (expect 200 with results) ---"
curl -sS -i "${BASE_URL}/api/search?q=radiohead"
echo ""
echo ""

# Expected response shape (preview_url and cover_url may be null):
#   HTTP/1.1 200 OK
#   Content-Type: application/json
#
#   {
#     "results": [
#       {
#         "id": "7LVHVU3tWfcxj5aiPFEW4Q",
#         "name": "Creep",
#         "artist": "Radiohead",
#         "album": "Pablo Honey",
#         "preview_url": "https://p.scdn.co/mp3-preview/abc123",
#         "external_url": "https://open.spotify.com/track/7LVHVU3tWfcxj5aiPFEW4Q",
#         "cover_url": "https://i.scdn.co/image/..."
#       },
#       ...
#     ]
#   }


# ---------------------------------------------------------------------------
# 3. Error: missing q parameter
#    Proves: the backend validates that q is present.
#    400 = client's fault. The request is malformed.
#    The response must match ErrorResponseSchema: { "error": "<message>" }
# ---------------------------------------------------------------------------

echo "--- 3. GET /api/search (no q, expect 400) ---"
curl -sS -i "${BASE_URL}/api/search"
echo ""
echo ""

# Expected response:
#   HTTP/1.1 400 Bad Request
#   Content-Type: application/json
#
#   {"error":"Missing required query parameter: q"}


# ---------------------------------------------------------------------------
# 4. Error: empty q parameter
#    Proves: the backend validates that q is not just whitespace/empty.
#    400 = client's fault. An empty string is not a valid search query.
#    The Zod contract uses z.string().min(1) — the backend must mirror this.
# ---------------------------------------------------------------------------

echo "--- 4. GET /api/search?q= (empty q, expect 400) ---"
curl -sS -i "${BASE_URL}/api/search?q="
echo ""
echo ""

# Expected response:
#   HTTP/1.1 400 Bad Request
#   Content-Type: application/json
#
#   {"error":"Missing required query parameter: q"}


# ---------------------------------------------------------------------------
# 5. Upstream failure (502)
#    Proves: when Spotify is unreachable or returns an error, the backend
#    returns 502 (Bad Gateway) — not 500 and not Spotify's own status code.
#
#    502 vs 500: 502 means "I'm fine, but the upstream I depend on isn't."
#    500 means "I broke." These are different things and the status code
#    communicates the difference to anyone monitoring the system.
#
#    How to reproduce:
#      - Break the Spotify credentials in your .env:
#          SPOTIFY_CLIENT_ID=invalid
#          SPOTIFY_CLIENT_SECRET=invalid
#      - Restart the backend, then run:
#          curl -sS -i "http://localhost:3000/api/search?q=radiohead"
#      - You should get 502 with an ErrorResponseSchema body.
#
#    You cannot reach this case without intentionally misconfiguring credentials
#    or blocking outbound traffic to api.spotify.com. The example below is
#    illustrative only — it points at a URL that will return a connection error,
#    which your backend should handle as a 502.
# ---------------------------------------------------------------------------

echo "--- 5. 502 upstream failure (illustrative — see comment above) ---"
echo "    To test: set SPOTIFY_CLIENT_ID=invalid in .env and restart the backend."
echo "    Then run: curl -sS -i '${BASE_URL}/api/search?q=radiohead'"
echo "    Expected: HTTP 502, body: {\"error\":\"Upstream search service unavailable\"}"
echo ""

# Expected response when Spotify credentials are invalid:
#   HTTP/1.1 502 Bad Gateway
#   Content-Type: application/json
#
#   {"error":"Upstream search service unavailable"}


# ---------------------------------------------------------------------------
# 6. Unhandled internal error (500)
#    This case should NOT be reachable in correct code. 500 means your error
#    handling failed — a code path threw an exception that was not caught and
#    converted into a proper ErrorResponse.
#
#    If you see a 500 in production, it is a bug in your error handling, not
#    a normal error condition. Fix the bug; do not write code that deliberately
#    triggers 500.
#
#    A correct backend implementation catches:
#      - Invalid input → 400
#      - Spotify failures → 502
#      - Everything else → 500 (the fallback, should be unreachable)
# ---------------------------------------------------------------------------

echo "--- 6. 500 internal error (should not be reachable) ---"
echo "    500 means your error handling has a gap. It is the fallback, not a"
echo "    normal code path. If you see this in production, there is a bug."
echo ""

# If you do trigger a 500, the response shape is still ErrorResponseSchema:
#   HTTP/1.1 500 Internal Server Error
#   Content-Type: application/json
#
#   {"error":"Internal server error"}


echo "=== Done ==="
