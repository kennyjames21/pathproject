const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { checkInteractions } = require('../services/claudeService');

// GET latest interaction check
router.get('/', (req, res) => {
  const latest = db.prepare(`
    SELECT * FROM interactions ORDER BY checked_at DESC LIMIT 1
  `).get();

  if (!latest) return res.json({ interactions: [], safe: true, summary: 'No interaction check performed yet.' });

  try {
    const data = JSON.parse(latest.description);
    res.json({ ...data, checked_at: latest.checked_at });
  } catch {
    res.json({ interactions: [], safe: true, summary: 'No data available.' });
  }
});

// POST check interactions for current medications
router.post('/check', async (req, res) => {
  try {
    const meds = db.prepare('SELECT id, name, dosage FROM medications WHERE active = 1').all();

    if (meds.length < 2) {
      return res.json({
        interactions: [],
        safe: true,
        summary: 'At least 2 medications needed for interaction check.',
        checked_at: new Date().toISOString()
      });
    }

    const result = await checkInteractions(meds);

    // Store result
    const medIds = meds.map((m) => m.id).join(',');
    const severity = result.interactions?.length > 0
      ? result.interactions[0].severity
      : 'none';

    db.prepare(`
      INSERT INTO interactions (medication_ids, severity, description)
      VALUES (?, ?, ?)
    `).run(medIds, severity, JSON.stringify(result));

    res.json({ ...result, checked_at: new Date().toISOString() });
  } catch (error) {
    console.error('Interaction check error:', error);
    res.status(500).json({ error: 'Failed to check interactions: ' + error.message });
  }
});

module.exports = router;
