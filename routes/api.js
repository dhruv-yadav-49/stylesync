const express = require('express');
const router = express.Router();
const ScraperService = require('../services/scraper');
const AnalyzerService = require('../services/analyzer');
const db = require('../db');
// Site and Token models are no longer needed

// POST /api/scrape - Analyze a website and return tokens
router.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // 1. Check if site already exists
    let siteResult = await db.query('SELECT * FROM scraped_sites WHERE url = $1', [url]);
    let site = siteResult.rows[0];

    if (!site) {
      const newSiteResult = await db.query(
        'INSERT INTO scraped_sites (url, site_name) VALUES ($1, $2) RETURNING *',
        [url, new URL(url).hostname]
      );
      site = newSiteResult.rows[0];
    }

    // 2. Run Scraping & Analysis
    const scrapedData = await ScraperService.scrape(url);
    const tokens = await AnalyzerService.analyze(scrapedData);

    // 3. Save or Update Tokens (respecting locked status)
    let tokenResult = await db.query('SELECT * FROM design_tokens WHERE site_id = $1', [site.id]);
    let existingToken = tokenResult.rows[0];

    if (existingToken) {
      // Merge: only update unlocked fields
      const lockedResult = await db.query('SELECT field FROM locked_tokens WHERE site_id = $1', [site.id]);
      const lockedFields = lockedResult.rows.map(r => r.field);

      const updatedColors = { ...existingToken.colors };
      Object.keys(tokens.colors).forEach(key => {
        if (!lockedFields.includes(key)) {
          updatedColors[key] = tokens.colors[key];
        }
      });

      // Update version history
      await db.query(
        'INSERT INTO version_history (site_id, tokens, change_description) VALUES ($1, $2, $3)',
        [site.id, JSON.stringify(updatedColors), 'Automatic Re-scrape']
      );

      const finalTokenResult = await db.query(
        'UPDATE design_tokens SET colors = $1, typography = $2, spacing = $3, last_updated = CURRENT_TIMESTAMP WHERE site_id = $4 RETURNING *',
        [JSON.stringify(updatedColors), JSON.stringify(tokens.typography), JSON.stringify(tokens.spacing), site.id]
      );

      return res.json({ site: { _id: site.id, ...site }, tokens: finalTokenResult.rows[0] });
    } else {
      const newTokenResult = await db.query(
        'INSERT INTO design_tokens (site_id, colors, typography, spacing) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          site.id,
          JSON.stringify(tokens.colors),
          JSON.stringify({
            headingFont: tokens.typography.headingFont || 'Inter',
            bodyFont: tokens.typography.bodyFont || 'Inter',
            baseSize: tokens.typography.baseSize || '16px',
            scale: tokens.typography.scale || []
          }),
          JSON.stringify({
            baseUnit: tokens.spacing?.baseUnit || 4,
            scale: tokens.spacing || []
          })
        ]
      );
      return res.json({ site: { _id: site.id, ...site }, tokens: newTokenResult.rows[0] });
    }

  } catch (error) {
    console.error('API Scrape error:', error);
    res.status(500).json({ error: 'Failed to analyze site' });
  }
});

// GET /api/tokens/:siteId - Fetch tokens for a site
router.get('/tokens/:siteId', async (req, res) => {
  try {
    const siteResult = await db.query('SELECT * FROM scraped_sites WHERE id = $1', [req.params.siteId]);
    const site = siteResult.rows[0];
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const tokenResult = await db.query('SELECT * FROM design_tokens WHERE site_id = $1', [req.params.siteId]);
    const tokens = tokenResult.rows[0];
    if (!tokens) return res.status(404).json({ error: 'Tokens not found' });

    const lockedResult = await db.query('SELECT category, field FROM locked_tokens WHERE site_id = $1', [req.params.siteId]);
    const locked = { colors: [], typography: [], spacing: [] };
    lockedResult.rows.forEach(r => locked[r.category].push(r.field));

    res.json({ siteId: site, ...tokens, locked });
  } catch (error) {
    console.error('Fetch tokens error:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// POST /api/tokens/:siteId/update - Update tokens manually
router.post('/tokens/:siteId/update', async (req, res) => {
  try {
    const { colors, typography, spacing } = req.body;
    
    // Save to version history
    await db.query(
      'INSERT INTO version_history (site_id, tokens, change_description) VALUES ($1, $2, $3)',
      [req.params.siteId, JSON.stringify(colors), 'Manual Edit']
    );

    const result = await db.query(
      'UPDATE design_tokens SET colors = $1, typography = $2, spacing = $3, last_updated = CURRENT_TIMESTAMP WHERE site_id = $4 RETURNING *',
      [JSON.stringify(colors), JSON.stringify(typography), JSON.stringify(spacing), req.params.siteId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tokens error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// POST /api/tokens/:siteId/lock - Lock/Unlock a token
router.post('/tokens/:siteId/lock', async (req, res) => {
  const { category, field, isLocked } = req.body;
  try {
    if (isLocked) {
      await db.query(
        'INSERT INTO locked_tokens (site_id, category, field) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [req.params.siteId, category, field]
      );
    } else {
      await db.query(
        'DELETE FROM locked_tokens WHERE site_id = $1 AND category = $2 AND field = $3',
        [req.params.siteId, category, field]
      );
    }

    // Return updated locked status
    const lockedResult = await db.query('SELECT category, field FROM locked_tokens WHERE site_id = $1', [req.params.siteId]);
    const locked = { colors: [], typography: [], spacing: [] };
    lockedResult.rows.forEach(r => locked[r.category].push(r.field));

    res.json({ locked });
  } catch (error) {
    console.error('Lock error:', error);
    res.status(500).json({ error: 'Locking failed' });
  }
});

// GET /api/tokens/:siteId/history - Fetch version history
router.get('/tokens/:siteId/history', async (req, res) => {
  try {
    const historyResult = await db.query(
      'SELECT id, change_description, created_at, tokens FROM version_history WHERE site_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.params.siteId]
    );
    res.json({ history: historyResult.rows });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

module.exports = router;
