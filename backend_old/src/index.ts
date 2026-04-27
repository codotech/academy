import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { searchRouter } from './search.route.js';

// Fail fast if Spotify credentials are missing
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('FATAL: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

// OpenAPI / Swagger UI
const openapiSpec = parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(searchRouter);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
