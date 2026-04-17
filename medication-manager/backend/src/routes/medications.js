const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET all active medications
router.get('/', (req, res) => {
  const meds = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM dose_logs dl WHERE dl.medication_id = m.id AND dl.status = 'taken' AND date(dl.taken_at) = date('now')) as taken_today,
      (SELECT COUNT(*) FROM dose_logs dl WHERE dl.medication_id = m.id AND dl.status = 'missed' AND date(dl.scheduled_time) >= date('now', '-7 days')) as missed_last_week
    FROM medications m
    ORDER BY m.name ASC
  `).all();
  res.json(meds);
});

// GET single medication
router.get('/:id', (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });
  res.json(med);
});

// POST create medication
router.post('/', (req, res) => {
  const {
    name, dosage, frequency, start_date, end_date,
    instructions, prescriber, pharmacy, refills_remaining,
    supply_days, supply_remaining, color, active
  } = req.body;

  if (!name || !dosage || !frequency || !start_date) {
    return res.status(400).json({ error: 'Name, dosage, frequency, and start_date are required' });
  }

  const result = db.prepare(`
    INSERT INTO medications (name, dosage, frequency, start_date, end_date, instructions,
      prescriber, pharmacy, refills_remaining, supply_days, supply_remaining, color, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, dosage, frequency, start_date, end_date || null,
    instructions || null, prescriber || null, pharmacy || null,
    refills_remaining || 0, supply_days || 30,
    supply_remaining !== undefined ? supply_remaining : (supply_days || 30),
    color || '#4F86C6', active !== undefined ? active : 1
  );

  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(med);
});

// PUT update medication
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medication not found' });

  const {
    name, dosage, frequency, start_date, end_date,
    instructions, prescriber, pharmacy, refills_remaining,
    supply_days, supply_remaining, color, active
  } = req.body;

  db.prepare(`
    UPDATE medications SET
      name = ?, dosage = ?, frequency = ?, start_date = ?, end_date = ?,
      instructions = ?, prescriber = ?, pharmacy = ?, refills_remaining = ?,
      supply_days = ?, supply_remaining = ?, color = ?, active = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || existing.name,
    dosage || existing.dosage,
    frequency || existing.frequency,
    start_date || existing.start_date,
    end_date !== undefined ? end_date : existing.end_date,
    instructions !== undefined ? instructions : existing.instructions,
    prescriber !== undefined ? prescriber : existing.prescriber,
    pharmacy !== undefined ? pharmacy : existing.pharmacy,
    refills_remaining !== undefined ? refills_remaining : existing.refills_remaining,
    supply_days !== undefined ? supply_days : existing.supply_days,
    supply_remaining !== undefined ? supply_remaining : existing.supply_remaining,
    color || existing.color,
    active !== undefined ? active : existing.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE medication
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medication not found' });

  db.prepare('DELETE FROM medications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST refill medication
router.post('/:id/refill', (req, res) => {
  const existing = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medication not found' });

  const newSupply = existing.supply_days;
  const newRefills = Math.max(0, existing.refills_remaining - 1);

  db.prepare(`
    UPDATE medications SET
      supply_remaining = ?,
      refills_remaining = ?,
      last_refill_date = date('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(newSupply, newRefills, req.params.id);

  const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
