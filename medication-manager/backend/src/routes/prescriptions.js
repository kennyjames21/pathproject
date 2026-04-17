const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parsePrescription, parsePrescriptionText } = require('../services/claudeService');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST parse prescription image
router.post('/parse-image', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const base64 = req.file.buffer.toString('base64');
    const result = await parsePrescription(base64, req.file.mimetype);
    res.json(result);
  } catch (error) {
    console.error('Prescription parse error:', error);
    res.status(500).json({ error: 'Failed to parse prescription: ' + error.message });
  }
});

// POST parse prescription text
router.post('/parse-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = await parsePrescriptionText(text);
    res.json(result);
  } catch (error) {
    console.error('Prescription text parse error:', error);
    res.status(500).json({ error: 'Failed to parse prescription text: ' + error.message });
  }
});

module.exports = router;
