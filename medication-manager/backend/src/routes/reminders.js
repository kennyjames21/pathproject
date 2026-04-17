const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET all reminders
router.get('/', (req, res) => {
  const reminders = db.prepare(`
    SELECT r.*, m.name as medication_name, m.dosage, m.color
    FROM reminders r
    JOIN medications m ON r.medication_id = m.id
    WHERE r.active = 1
    ORDER BY r.time ASC
  `).all();
  res.json(reminders);
});

// POST create reminder
router.post('/', (req, res) => {
  const { medication_id, time, days } = req.body;

  if (!medication_id || !time) {
    return res.status(400).json({ error: 'medication_id and time are required' });
  }

  const result = db.prepare(`
    INSERT INTO reminders (medication_id, time, days)
    VALUES (?, ?, ?)
  `).run(medication_id, time, days || 'daily');

  const reminder = db.prepare(`
    SELECT r.*, m.name as medication_name, m.dosage, m.color
    FROM reminders r JOIN medications m ON r.medication_id = m.id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(reminder);
});

// PUT update reminder
router.put('/:id', (req, res) => {
  const { time, days, active } = req.body;

  db.prepare(`
    UPDATE reminders SET time = COALESCE(?, time), days = COALESCE(?, days),
    active = COALESCE(?, active) WHERE id = ?
  `).run(time, days, active, req.params.id);

  const reminder = db.prepare(`
    SELECT r.*, m.name as medication_name, m.dosage, m.color
    FROM reminders r JOIN medications m ON r.medication_id = m.id
    WHERE r.id = ?
  `).get(req.params.id);

  res.json(reminder);
});

// DELETE reminder
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
