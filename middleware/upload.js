const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP'));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = { upload, ALLOWED_MIMETYPES, MAX_FILE_SIZE, MAX_FILES };
