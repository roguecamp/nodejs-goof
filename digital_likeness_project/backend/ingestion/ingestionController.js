const multer = require('multer');
const fs = require('fs');
const path = require('path');
const IngestedData = require('../models/IngestedData'); // Using the new model

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Use a unique filename to avoid conflicts, e.g., timestamp + originalname
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .txt files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Limit file size to 5MB
}).single('textFile'); // 'textFile' is the field name in the form-data

// Main upload logic function
exports.uploadTextFile = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 5MB allowed.' });
      }
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading (e.g., file type mismatch).
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }

    // Everything went fine with multer, file is uploaded.
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const userId = req.user.id; // Assuming verifyToken middleware added req.user

    fs.readFile(filePath, 'utf8', (readErr, content) => {
      if (readErr) {
        console.error('Error reading uploaded file:', readErr);
        // Clean up the uploaded file if reading fails
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp file after read error:', unlinkErr);
        });
        return next(new Error('Could not read the uploaded file content.')); // Pass to error handler
      }

      try {
        const newIngestedEntry = IngestedData.create({
          userId: userId,
          filename: originalFilename,
          content: content,
          // id and uploadedAt are handled by IngestedData.create
        });

        // Delete the temporary file after successful processing
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary uploaded file:', unlinkErr);
            // Non-critical, but log it. The main operation succeeded.
          }
        });

        res.status(201).json({
          message: 'File uploaded and content ingested successfully.',
          data: {
            id: newIngestedEntry.id,
            filename: newIngestedEntry.filename,
            userId: newIngestedEntry.userId,
            uploadedAt: newIngestedEntry.uploadedAt
          }
        });
      } catch (dbError) {
        console.error('Error saving ingested data:', dbError);
         // Clean up the uploaded file if DB saving fails
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp file after db error:', unlinkErr);
        });
        return next(dbError); // Pass to error handler
      }
    });
  });
};
