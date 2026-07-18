const multer = require('multer');

// Memory storage to process before sending to Supabase
const storage = multer.memoryStorage();

const uploadPdf = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

module.exports = uploadPdf;
