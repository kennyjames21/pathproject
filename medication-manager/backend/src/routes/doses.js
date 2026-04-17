const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET today's dose schedule
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const doses = db.prepare(`
    SELECT dl.*, m.name as medication_name, m.dosage, m.color, m.frequency
    FROM dose_logs dl
    JOIN medications m ON dl.medication_id = m.id
    WHERE date(dl.scheduled_time) = ?
    ORDER BY dl.scheduled_time ASC
  `).all(today);

  res.json(doses);
});

// GET dose history
router.get('/history', (req, res) => {
  const { days = 7, medication_id } = req.query;
  let query = `
    SELECT dl.*, m.name as medication_name, m.dosage, m.color
    FROM dose_logs dl
    JOIN medications m ON dl.medication_id = m.id
    WHERE date(dl.scheduled_time) >= date('now', '-${parseInt(days)} days')
  `;
  const params = [];

  if (medication_id) {
    query += ' AND dl.medication_id = ?';
    params.push(medication_id);
  }

  query += ' ORDER BY dl.scheduled_time DESC LIMIT 200';

  const history = db.prepare(query).all(...params);
  res.json(history);
});

// GET missed doses
router.get('/missed', (req, res) => {
  const missed = db.prepare(`
    SELECT dl.*, m.name as medication_name, m.dosage, m.color
    FROM dose_logs dl
    JOIN medications m ON dl.medication_id = m.id
    WHERE dl.status = 'missed'
    AND date(dl.scheduled_time) >= date('now', '-30 days')
    ORDER BY dl.scheduled_time DESC
    LIMIT 50
  `).all();
  res.json(missed);
});

// POST log a dose
router.post('/', (req, res) => {
  const { medication_id, scheduled_time, status, notes } = req.body;

  if (!medication_id || !scheduled_time) {
    return res.status(400).json({ error: 'medication_id and scheduled_time are required' });
  }

  const result = db.prepare(`
    INSERT INTO dose_logs (medication_id, scheduled_time, taken_at, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    medication_id,
    scheduled_time,
    status === 'taken' ? new Date().toISOString() : null,
    status || 'pending',
    notes || null
  );

  // Decrement supply if taken
  if (status === 'taken') {
    db.prepare(`
      UPDATE medications
      SET supply_remaining = MAX(0, supply_remaining - 1),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(medication_id);
  }

  const dose = db.prepare(`
    SELECT dl.*, m.name as medication_name, m.dosage, m.color
    FROM dose_logs dl JOIN medications m ON dl.medication_id = m.id
    WHERE dl.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(dose);
});

// PUT mark dose as taken/missed/skipped
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Dose log not found' });

  const { status, notes } = req.body;
  const taken_at = status === 'taken' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE dose_logs SET status = ?, taken_at = ?, notes = ? WHERE id = ?
  `).run(status, taken_at, notes || existing.notes, req.params.id);

  // Update supply count
  if (status === 'taken' && existing.status !== 'taken') {
    db.prepare(`
      UPDATE medications SET supply_remaining = MAX(0, supply_remaining - 1),
      updated_at = datetime('now') WHERE id = ?
    `).run(existing.medication_id);
  } else if (status !== 'taken' && existing.status === 'taken') {
    db.prepare(`
      UPDATE medications SET supply_remaining = supply_remaining + 1,
      updated_at = datetime('now') WHERE id = ?
    `).run(existing.medication_id);
  }

  const updated = db.prepare(`
    SELECT dl.*, m.name as medication_name, m.dosage, m.color
    FROM dose_logs dl JOIN medications m ON dl.medication_id = m.id
    WHERE dl.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// POST generate today's schedule for all active medications
router.post('/generate-schedule', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const meds = db.prepare('SELECT * FROM medications WHERE active = 1').all();

  const frequencyToTimes = (frequency) => {
    const f = frequency.toLowerCase();
    if (f.includes('once') || f.includes('daily') || f.includes('qd')) return ['08:00'];
    if (f.includes('twice') || f.includes('bid') || f.includes('two')) return ['08:00', '20:00'];
    if (f.includes('three') || f.includes('tid') || f.includes('every 8')) return ['08:00', '14:00', '20:00'];
    if (f.includes('four') || f.includes('qid') || f.includes('every 6')) return ['08:00', '12:00', '16:00', '20:00'];
    if (f.includes('every 12')) return ['08:00', '20:00'];
    if (f.includes('bedtime') || f.includes('qhs') || f.includes('night')) return ['21:00'];
    if (f.includes('morning')) return ['08:00'];
    return ['08:00'];
  };

  const insert = db.prepare(`
    INSERT OR IGNORE INTO dose_logs (medication_id, scheduled_time, status)
    VALUES (?, ?, 'pending')
  `);

  let created = 0;
  for (const med of meds) {
    const times = frequencyToTimes(med.frequency);
    for (const time of times) {
      const scheduled = `${today}T${time}:00`;
      const existing = db.prepare(
        'SELECT id FROM dose_logs WHERE medication_id = ? AND scheduled_time = ?'
      ).get(med.id, scheduled);

      if (!existing) {
        insert.run(med.id, scheduled);
        created++;
      }
    }
  }

  res.json({ created, date: today });
});

module.exports = router;
