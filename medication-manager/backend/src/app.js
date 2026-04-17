require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./models/database');

const medicationsRouter = require('./routes/medications');
const dosesRouter = require('./routes/doses');
const interactionsRouter = require('./routes/interactions');
const prescriptionsRouter = require('./routes/prescriptions');
const remindersRouter = require('./routes/reminders');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/medications', medicationsRouter);
app.use('/api/doses', dosesRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/reminders', remindersRouter);

// Dashboard stats endpoint
app.get('/api/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const totalMeds = db.prepare('SELECT COUNT(*) as count FROM medications WHERE active = 1').get();
  const todayDoses = db.prepare(`
    SELECT COUNT(*) as count FROM dose_logs WHERE date(scheduled_time) = ?
  `).get(today);
  const takenToday = db.prepare(`
    SELECT COUNT(*) as count FROM dose_logs WHERE date(scheduled_time) = ? AND status = 'taken'
  `).get(today);
  const missedThisWeek = db.prepare(`
    SELECT COUNT(*) as count FROM dose_logs
    WHERE status = 'missed' AND date(scheduled_time) >= date('now', '-7 days')
  `).get();
  const lowSupply = db.prepare(`
    SELECT * FROM medications WHERE active = 1 AND supply_remaining <= 7 ORDER BY supply_remaining ASC
  `).all();
  const recentActivity = db.prepare(`
    SELECT dl.*, m.name as medication_name, m.color
    FROM dose_logs dl JOIN medications m ON dl.medication_id = m.id
    WHERE dl.status != 'pending'
    ORDER BY dl.taken_at DESC, dl.scheduled_time DESC
    LIMIT 10
  `).all();
  const nextDoses = db.prepare(`
    SELECT dl.*, m.name as medication_name, m.dosage, m.color
    FROM dose_logs dl JOIN medications m ON dl.medication_id = m.id
    WHERE dl.status = 'pending' AND dl.scheduled_time >= datetime('now')
    ORDER BY dl.scheduled_time ASC LIMIT 5
  `).all();

  res.json({
    stats: {
      total_medications: totalMeds.count,
      doses_today: todayDoses.count,
      taken_today: takenToday.count,
      missed_this_week: missedThisWeek.count,
      adherence_rate: todayDoses.count > 0
        ? Math.round((takenToday.count / todayDoses.count) * 100)
        : 100
    },
    low_supply: lowSupply,
    recent_activity: recentActivity,
    next_doses: nextDoses
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Auto-generate daily schedule at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const meds = db.prepare('SELECT * FROM medications WHERE active = 1').all();

    const frequencyToTimes = (frequency) => {
      const f = frequency.toLowerCase();
      if (f.includes('twice') || f.includes('bid')) return ['08:00', '20:00'];
      if (f.includes('three') || f.includes('tid')) return ['08:00', '14:00', '20:00'];
      if (f.includes('four') || f.includes('qid')) return ['08:00', '12:00', '16:00', '20:00'];
      if (f.includes('bedtime') || f.includes('night')) return ['21:00'];
      return ['08:00'];
    };

    for (const med of meds) {
      const times = frequencyToTimes(med.frequency);
      for (const time of times) {
        const scheduled = `${today}T${time}:00`;
        const existing = db.prepare(
          'SELECT id FROM dose_logs WHERE medication_id = ? AND scheduled_time = ?'
        ).get(med.id, scheduled);
        if (!existing) {
          db.prepare('INSERT INTO dose_logs (medication_id, scheduled_time, status) VALUES (?, ?, ?)')
            .run(med.id, scheduled, 'pending');
        }
      }
    }
  } catch (err) {
    console.error('Schedule generation error:', err);
  }
});

// Mark missed doses every hour
cron.schedule('0 * * * *', () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    db.prepare(`
      UPDATE dose_logs SET status = 'missed'
      WHERE status = 'pending' AND scheduled_time < ?
    `).run(oneHourAgo);
  } catch (err) {
    console.error('Missed dose update error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Medication Manager API running on port ${PORT}`);
});
