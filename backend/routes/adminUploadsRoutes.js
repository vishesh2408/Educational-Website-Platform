const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', 'upload', 'notes');

function ensureUploadDir() {
  try {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function safeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  if (!ext) return '';
  // keep it simple: allow only common safe-ish extensions
  if (!/^[a-z0-9.]{1,10}$/.test(ext.replace('.', ''))) return '';
  return ext;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_ROOT);
  },
  filename: function (req, file, cb) {
    const ext = safeExt(file.originalname);
    const id = (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

// POST /api/admin/uploads
// multipart/form-data: field name "file"
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const urlPath = `/upload/notes/${req.file.filename}`;
    return res.json({
      url: urlPath,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
