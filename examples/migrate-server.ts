/**
 * Example: HTTP migration server.
 *
 * A minimal Express handler that accepts Editor.js GOV.UK data,
 * runs migrate(), and returns the result with fresh renderedHtml.
 *
 * This is NOT shipped in the npm package — copy and adapt it into
 * your own infrastructure (Express, Lambda, Cloud Run, etc.).
 *
 * Usage:
 *   npx tsx examples/migrate-server.ts
 *   curl -X POST http://localhost:3100/migrate \
 *     -H 'Content-Type: application/json' \
 *     -d '{"blocks":[], "pluginVersion":"0.1.0", "renderedHtml":""}'
 */

import express from 'express';
import { migrate } from '../src/migrate/index.js';

const app = express();
app.use(express.json());

app.post('/migrate', (req, res) => {
  try {
    const result = migrate(req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

const port = process.env.PORT ?? 3100;
app.listen(port, () => {
  console.log(`govuk-editorjs migrate server listening on port ${port}`);
});
