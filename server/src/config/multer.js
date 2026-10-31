const multer = require('multer');
const path = require('path');
const fs = require('fs');

const resumesDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Storage for Resume PDFs
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}_${uniqueSuffix}${ext}`);
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMime = ['application/pdf'];
    if (ext === '.pdf' && allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF documents (.pdf) are allowed for resumes.'));
    }
  }
});

// Memory storage for Excel / CSV contact imports
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'));
    }
  }
});

module.exports = {
  resumeUpload,
  excelUpload,
  resumesDir
};

