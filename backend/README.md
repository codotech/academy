# Music Finder  Backend Starter

The platform team built the scaffolding. You build the Spotify integration.

## The only hard requirement

`GET /api/search?q=<query>` must return **exactly** this shape:

```json
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "artist": "string",
      "album": "string",
      "preview_url": "string | null",
      "external_url": "string",
      "cover_url": "string | null"
    }
  ]
}
```

On error (any non-2xx), return:
```json
{ "error": "string" }
```

The frontend validates your response against this contract with Zod. If the shape is wrong, the UI shows a `ContractError`  not broken UI.

## What's given

- Express server on port 3000 with `/health`
- TypeScript strict mode
- CORS enabled for dev
- `dotenv` loads `.env` on startup

## What you build

Everything else. How you structure the Spotify client, how you organize routes  that's up to you and Claude.

## Setup

```bash
cp .env.example .env
# paste your Spotify Client ID and Secret into .env

npm install
npm run dev
```

Server starts at `http://localhost:3000`.

## Must pass before submitting

```bash
curl localhost:3000/health
# → { "status": "ok" }

curl "localhost:3000/api/search?q=daft+punk" | jq '.results[0]'
# → a track object matching the contract above

curl "localhost:3000/api/search?q="
# → 400 { "error": "..." }

npm run typecheck
# → no errors

cat .gitignore | grep .env
# → .env is excluded from git
```
