import { Router } from 'express';
import { searchTracks } from './spotify-client.js';

export const searchRouter = Router();

searchRouter.get('/api/search', async (req, res) => {
  const q = req.query.q;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    res.status(400).json({ error: 'Missing or empty query parameter: q' });
    return;
  }

  try {
    const results = await searchTracks(q.trim());
    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('Spotify')) {
      res.status(502).json({ error: `Upstream failure: ${message}` });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});
