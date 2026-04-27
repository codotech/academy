import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { searchTracks, SpotifyError } from './spotify.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await searchTracks(q);
    res.json({ results });
  } catch (err) {
    if (err instanceof SpotifyError) {
      console.error('[spotify]', err.message);
      return res.status(502).json({ error: 'Upstream Spotify request failed' });
    }
    console.error('[search]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
